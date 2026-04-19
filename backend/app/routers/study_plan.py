from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module, ModulTyp
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

    from collections import defaultdict
    grouped: dict = defaultdict(list)
    for sm in student_modules:
        module = modules_by_id.get(sm.module_id) if sm.module_id else None
        semester_key = module.semester_empfehlung if module else None
        grouped[semester_key].append(_build_sm_response(sm, module))

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

    sm = StudentModule(
        user_id=current_user.id,
        module_id=payload.module_id,
        custom_name=payload.custom_name,
        custom_ects=payload.custom_ects,
        semester=payload.semester,
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


def _build_sm_response(sm: StudentModule, module) -> StudentModuleResponse:
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
        module=ModuleResponse.model_validate(module) if module else None,
    )


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
