from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module, ModulTyp
from app.models.module_prerequisite import ModulePrerequisite, PrerequisiteType
from app.models.program import Program
from app.models.student_module import StudentModule, StudiengangStatus
from app.models.user import User
from app.models.user_program import UserProgram
from app.schemas.study_plan import (
    AddModuleRequest,
    ExamRegulationResponse,
    ModuleResponse,
    ProgramResponse,
    SelectProgramRequest,
    StudentModuleResponse,
    StudentModulesBySemester,
    UpdateModuleRequest,
    UserProgramResponse,
)

router = APIRouter(prefix="/me", tags=["study-plan"])


# ── Program selection ─────────────────────────────────────────────────────────

@router.post("/program", response_model=UserProgramResponse, status_code=status.HTTP_201_CREATED)
def select_program(
    payload: SelectProgramRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(UserProgram).filter(UserProgram.user_id == current_user.id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Program already selected. Use PUT to change.",
        )

    exam_reg = db.get(ExamRegulation, payload.exam_regulation_id)
    if not exam_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam regulation not found")

    user_program = UserProgram(
        user_id=current_user.id,
        exam_regulation_id=payload.exam_regulation_id,
        start_semester=payload.start_semester,
    )
    db.add(user_program)
    db.commit()
    db.refresh(user_program)

    program = db.get(Program, exam_reg.program_id)
    return _build_user_program_response(user_program, exam_reg, program)


@router.get("/program", response_model=UserProgramResponse)
def get_my_program(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_program = db.query(UserProgram).filter(UserProgram.user_id == current_user.id).first()
    if not user_program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No program selected")

    _ensure_pflicht_modules(db, current_user.id, user_program.exam_regulation_id)

    exam_reg = db.get(ExamRegulation, user_program.exam_regulation_id)
    program = db.get(Program, exam_reg.program_id)
    return _build_user_program_response(user_program, exam_reg, program)


@router.put("/program", response_model=UserProgramResponse)
def update_my_program(
    payload: SelectProgramRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_program = db.query(UserProgram).filter(UserProgram.user_id == current_user.id).first()
    if not user_program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No program selected. Use POST first.")

    exam_reg = db.get(ExamRegulation, payload.exam_regulation_id)
    if not exam_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam regulation not found")

    user_program.exam_regulation_id = payload.exam_regulation_id
    user_program.start_semester = payload.start_semester
    db.commit()
    db.refresh(user_program)

    program = db.get(Program, exam_reg.program_id)
    return _build_user_program_response(user_program, exam_reg, program)


# ── Modules ───────────────────────────────────────────────────────────────────

@router.get("/modules", response_model=List[StudentModulesBySemester])
def get_my_modules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student_modules = (
        db.query(StudentModule).filter(StudentModule.user_id == current_user.id).all()
    )

    modules_by_id = _load_modules_by_id(db, student_modules)

    # Also load parent modules for custom sub-modules (e.g. BIN-209 sub-modules)
    parent_ids = [sm.parent_module_id for sm in student_modules if sm.parent_module_id and sm.parent_module_id not in modules_by_id]
    if parent_ids:
        for m in db.query(Module).filter(Module.id.in_(parent_ids)).all():
            modules_by_id[m.id] = m

    # Compute semester completion flags + reached ECTS for prerequisites_met
    sem_flags = _get_semester_flags(db, current_user.id, student_modules)
    reached_ects = sum(
        modules_by_id[sm.module_id].ects if sm.module_id and sm.module_id in modules_by_id
        else (sm.custom_ects or 0)
        for sm in student_modules if sm.status == StudiengangStatus.PASSED
    )

    # Load all prerequisites for catalogue modules in the plan
    catalogue_ids = [sm.module_id for sm in student_modules if sm.module_id]
    prereqs_by_module: dict = {}
    if catalogue_ids:
        for prereq in db.query(ModulePrerequisite).filter(
            ModulePrerequisite.module_id.in_(catalogue_ids)
        ).all():
            prereqs_by_module.setdefault(prereq.module_id, []).append(prereq)

    from collections import defaultdict
    grouped: dict = defaultdict(list)
    for sm in student_modules:
        module = modules_by_id.get(sm.module_id) if sm.module_id else None
        semester_key = sm.semester
        if semester_key is None:
            if module and module.semester_empfehlung:
                semester_key = str(module.semester_empfehlung)
            elif sm.parent_module_id and sm.parent_module_id in modules_by_id:
                # Custom sub-module: inherit semester from parent (e.g. BIN-209 → Sem 5)
                parent = modules_by_id[sm.parent_module_id]
                semester_key = str(parent.semester_empfehlung) if parent.semester_empfehlung else "Ungeplant"
            else:
                semester_key = "Ungeplant"

        prereqs_met = _eval_prerequisites(
            sm.module_id,
            prereqs_by_module,
            sem_flags,
            reached_ects,
        )
        grouped[semester_key].append(_build_sm_response(sm, module, prerequisites_met=prereqs_met))

    return [
        StudentModulesBySemester(semester=sem, modules=mods)
        for sem, mods in sorted(grouped.items(), key=lambda kv: (kv[0] is None, kv[0]))
    ]


@router.post("/modules", response_model=StudentModuleResponse, status_code=status.HTTP_201_CREATED)
def add_module(
    payload: AddModuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(UserProgram).filter(UserProgram.user_id == current_user.id).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select a program first")

    module = None
    if payload.module_id:
        module = db.get(Module, payload.module_id)
        if not module:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
        if module.modul_typ not in (ModulTyp.WAHLPFLICHT, ModulTyp.ERGAENZEND):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only WAHLPFLICHT or ERGAENZEND modules can be added manually",
            )
        existing = (
            db.query(StudentModule)
            .filter(StudentModule.user_id == current_user.id, StudentModule.module_id == payload.module_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Module already in your study plan")

        # BIN PO: max 2 WAHLPFLICHT modules (12 ECTS total). Hard limit enforced here.
        if module.modul_typ == ModulTyp.WAHLPFLICHT:
            wahlpflicht_count = (
                db.query(StudentModule)
                .join(Module, StudentModule.module_id == Module.id)
                .filter(
                    StudentModule.user_id == current_user.id,
                    Module.modul_typ == ModulTyp.WAHLPFLICHT,
                )
                .count()
            )
            if wahlpflicht_count >= 2:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Wahlpflicht limit reached. The PO allows exactly 2 Wahlpflicht modules (12 ECTS).",
                )

    # Sprint 4 Phase 5: auto-link custom ERGAENZEND sub-modules to their parent (BIN-209)
    parent_module_id = None
    if payload.custom_name:
        user_prog = db.query(UserProgram).filter(UserProgram.user_id == current_user.id).first()
        if user_prog:
            parent = db.query(Module).filter(
                Module.kuerzel == "BIN-209",
                Module.exam_regulation_id == user_prog.exam_regulation_id,
            ).first()
            if parent:
                parent_module_id = parent.id

    sm = StudentModule(
        user_id=current_user.id,
        module_id=payload.module_id,
        custom_name=payload.custom_name,
        custom_ects=payload.custom_ects,
        custom_ist_benotet=payload.custom_ist_benotet,
        semester=payload.semester,
        parent_module_id=parent_module_id,
        status=StudiengangStatus.PLANNED,
        versuch_nummer=1,
    )
    db.add(sm)
    db.commit()
    db.refresh(sm)
    return _build_sm_response(sm, module)


@router.put("/modules/{sm_id}", response_model=StudentModuleResponse)
def update_module(
    sm_id: UUID,
    payload: UpdateModuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sm = db.query(StudentModule).filter(
        StudentModule.id == sm_id, StudentModule.user_id == current_user.id
    ).first()
    if not sm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found in your study plan")

    module = db.get(Module, sm.module_id) if sm.module_id else None

    new_status = payload.status if payload.status is not None else sm.status
    new_note = payload.note  # None means "don't change" unless explicitly set

    # Validate note range
    if new_note is not None and not (1.0 <= new_note <= 5.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Note must be between 1.0 and 5.0",
        )

    # Reject note for ungraded modules
    if new_note is not None and module and not module.ist_benotet:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This module is not graded. Remove the note.",
        )

    # PASSED with note > 4.0 is not allowed
    if new_status == StudiengangStatus.PASSED and new_note is not None and new_note > 4.0:
        detail = (
            "Note 5.0 counts as failed. Use status FAILED instead."
            if new_note == 5.0
            else "Note > 4.0 does not count as passed in the German grading system."
        )
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)

    # FAILED: auto-increment versuch_nummer and check max_versuche
    if new_status == StudiengangStatus.FAILED and payload.status == StudiengangStatus.FAILED:
        new_versuch = sm.versuch_nummer + 1
        if module and new_versuch > module.max_versuche:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Maximale Anzahl Versuche ({module.max_versuche}) erreicht.",
            )
        sm.versuch_nummer = new_versuch

    if payload.status is not None:
        sm.status = payload.status
    if new_note is not None:
        sm.note = new_note
    if payload.anmelde_datum is not None:
        sm.anmelde_datum = payload.anmelde_datum
    if payload.pruefungs_datum is not None:
        sm.pruefungs_datum = payload.pruefungs_datum
    if payload.semester is not None:
        sm.semester = payload.semester
    # plan_semester: written only by StudyPlanBoard — decoupled from grade tracking.
    # We accept any string (e.g. "3", "Ungeplant") or None (reset to auto-position).
    if "plan_semester" in payload.model_fields_set:
        sm.plan_semester = payload.plan_semester
    if "custom_ist_benotet" in payload.model_fields_set:
        sm.custom_ist_benotet = payload.custom_ist_benotet

    db.commit()
    db.refresh(sm)
    return _build_sm_response(sm, module)


@router.delete("/modules/{sm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    sm_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sm = db.query(StudentModule).filter(
        StudentModule.id == sm_id, StudentModule.user_id == current_user.id
    ).first()
    if not sm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found in your study plan")
    if sm.status == StudiengangStatus.PASSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a passed module.",
        )
    db.delete(sm)
    db.commit()
    return None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _ensure_pflicht_modules(db: Session, user_id, exam_regulation_id) -> None:
    pflicht = (
        db.query(Module)
        .filter(
            Module.exam_regulation_id == exam_regulation_id,
            Module.modul_typ == ModulTyp.PFLICHT,
        )
        .all()
    )
    existing_ids = {
        sm.module_id
        for sm in db.query(StudentModule).filter(StudentModule.user_id == user_id).all()
        if sm.module_id
    }
    new_entries = [
        StudentModule(user_id=user_id, module_id=m.id, status=StudiengangStatus.PLANNED, versuch_nummer=1)
        for m in pflicht
        if m.id not in existing_ids
    ]
    if new_entries:
        db.add_all(new_entries)
        db.commit()


def _load_modules_by_id(db: Session, student_modules) -> dict:
    ids = [sm.module_id for sm in student_modules if sm.module_id]
    if not ids:
        return {}
    return {m.id: m for m in db.query(Module).filter(Module.id.in_(ids)).all()}


def _build_sm_response(
    sm: StudentModule,
    module,
    prerequisites_met: Optional[bool] = None,
) -> StudentModuleResponse:
    return StudentModuleResponse(
        id=sm.id,
        user_id=sm.user_id,
        module_id=sm.module_id,
        custom_name=sm.custom_name,
        custom_ects=sm.custom_ects,
        status=sm.status,
        note=sm.note,
        versuch_nummer=sm.versuch_nummer,
        anmelde_datum=sm.anmelde_datum,
        pruefungs_datum=sm.pruefungs_datum,
        semester=sm.semester,
        plan_semester=sm.plan_semester,
        custom_ist_benotet=sm.custom_ist_benotet,
        parent_module_id=sm.parent_module_id,
        prerequisites_met=prerequisites_met,
        module=ModuleResponse.model_validate(module) if module else None,
    )


def _get_semester_flags(db: Session, user_id, student_modules: list) -> dict:
    """Returns {1: bool, 2: bool, 3: bool} — whether each semester's PFLICHT modules are all PASSED."""
    user_program = db.query(UserProgram).filter(UserProgram.user_id == user_id).first()
    if not user_program:
        return {}
    exam_reg = db.get(ExamRegulation, user_program.exam_regulation_id)
    if not exam_reg:
        return {}
    reg_pflicht = db.query(Module).filter(
        Module.exam_regulation_id == exam_reg.id,
        Module.modul_typ == ModulTyp.PFLICHT,
        Module.semester_empfehlung.in_([1, 2, 3]),
    ).all()
    passed_ids = {
        sm.module_id for sm in student_modules
        if sm.status == StudiengangStatus.PASSED and sm.module_id
    }
    result = {}
    for sem in [1, 2, 3]:
        sem_ids = {m.id for m in reg_pflicht if m.semester_empfehlung == sem}
        result[sem] = bool(sem_ids) and sem_ids.issubset(passed_ids)
    return result


def _eval_prerequisites(module_id, prereqs_by_module: dict, sem_flags: dict, reached_ects: int) -> bool:
    """Returns True if all prerequisites for a module are satisfied. Custom modules always return True."""
    if module_id is None:
        return True
    prereqs = prereqs_by_module.get(module_id, [])
    if not prereqs:
        return True
    for prereq in prereqs:
        if prereq.prerequisite_type == PrerequisiteType.SEMESTER_COMPLETE:
            for s in prereq.required_semesters.split(","):
                if not sem_flags.get(int(s), False):
                    return False
        elif prereq.prerequisite_type == PrerequisiteType.ECTS_THRESHOLD:
            if reached_ects < prereq.minimum_ects:
                return False
        elif prereq.prerequisite_type == PrerequisiteType.MODULE:
            # Not used in BIN seed — reserved for future use
            pass
    return True


def _build_user_program_response(user_program, exam_reg, program) -> UserProgramResponse:
    return UserProgramResponse(
        id=user_program.id,
        user_id=user_program.user_id,
        exam_regulation_id=user_program.exam_regulation_id,
        start_semester=user_program.start_semester,
        created_at=user_program.created_at,
        exam_regulation=ExamRegulationResponse.model_validate(exam_reg),
        program=ProgramResponse.model_validate(program),
    )
