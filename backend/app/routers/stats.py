from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module, ModulTyp
from app.models.program import Program
from app.models.student_module import StudentModule, StudiengangStatus
from app.models.user import User
from app.models.user_program import UserProgram
from app.schemas.study_plan import StatsResponse
from app.services.gpa_service import calculate_gpa

router = APIRouter(prefix="/me", tags=["stats"])


@router.get("/stats", response_model=StatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gesamt_ects = _get_gesamt_ects(db, current_user.id)

    student_modules = (
        db.query(StudentModule).filter(StudentModule.user_id == current_user.id).all()
    )

    module_ids = [sm.module_id for sm in student_modules if sm.module_id]
    modules_by_id: dict = {}
    if module_ids:
        modules_by_id = {m.id: m for m in db.query(Module).filter(Module.id.in_(module_ids)).all()}

    bestandene = [sm for sm in student_modules if sm.status == StudiengangStatus.PASSED]
    nicht_bestandene = [sm for sm in student_modules if sm.status == StudiengangStatus.FAILED]
    offene = [
        sm for sm in student_modules
        if sm.status in (StudiengangStatus.PLANNED, StudiengangStatus.REGISTERED)
    ]

    erreichte_ects = sum(
        modules_by_id[sm.module_id].ects if sm.module_id and sm.module_id in modules_by_id
        else (sm.custom_ects or 0)
        for sm in bestandene
    )

    fortschritt = round(erreichte_ects / gesamt_ects * 100, 1) if gesamt_ects > 0 else 0.0

    milestones = _compute_milestone_stats(db, current_user.id, student_modules, erreichte_ects)

    return StatsResponse(
        gpa=calculate_gpa(student_modules, modules_by_id),
        erreichte_ects=erreichte_ects,
        gesamt_ects=gesamt_ects,
        fortschritt_prozent=fortschritt,
        bestandene_module=len(bestandene),
        nicht_bestandene_module=len(nicht_bestandene),
        offene_module=len(offene),
        **milestones,
    )


def _get_gesamt_ects(db: Session, user_id) -> int:
    user_program = db.query(UserProgram).filter(UserProgram.user_id == user_id).first()
    if not user_program:
        return 0
    exam_reg = db.get(ExamRegulation, user_program.exam_regulation_id)
    if not exam_reg:
        return 0
    program = db.get(Program, exam_reg.program_id)
    return program.gesamt_ects if program else 0


def _compute_milestone_stats(
    db: Session,
    user_id,
    student_modules: list,
    erreichte_ects: int,
) -> dict:
    """
    Computes BIN PO §6 milestone stats program-aware via semester_empfehlung.

    Groups all PFLICHT catalogue modules of the user's exam_regulation by
    semester_empfehlung (1, 2, 3) and checks whether the student has PASSED all
    of them. Returns all fields as None if the program has no such structure.

    BA threshold (134 ECTS) is BIN-specific — will become program-configurable
    when Sprint 7 adds multi-program support.
    """
    user_program = db.query(UserProgram).filter(UserProgram.user_id == user_id).first()
    if not user_program:
        return {}

    exam_reg = db.get(ExamRegulation, user_program.exam_regulation_id)
    if not exam_reg:
        return {}

    # Load all PFLICHT modules for this exam_regulation that have a semester_empfehlung
    reg_pflicht = (
        db.query(Module)
        .filter(
            Module.exam_regulation_id == exam_reg.id,
            Module.modul_typ == ModulTyp.PFLICHT,
            Module.semester_empfehlung.isnot(None),
        )
        .all()
    )

    sem1_ids = {m.id for m in reg_pflicht if m.semester_empfehlung == 1}
    sem2_ids = {m.id for m in reg_pflicht if m.semester_empfehlung == 2}
    sem3_ids = {m.id for m in reg_pflicht if m.semester_empfehlung == 3}

    # None if a semester group doesn't exist for this program (not applicable)
    if not sem1_ids and not sem2_ids and not sem3_ids:
        return {}

    passed_ids = {
        sm.module_id for sm in student_modules
        if sm.status == StudiengangStatus.PASSED and sm.module_id
    }

    sem1_complete = sem1_ids.issubset(passed_ids) if sem1_ids else None
    sem2_complete = sem2_ids.issubset(passed_ids) if sem2_ids else None
    sem3_complete = sem3_ids.issubset(passed_ids) if sem3_ids else None

    vorpruefung = (
        bool(sem1_complete) and bool(sem2_complete) and bool(sem3_complete)
        if sem1_complete is not None and sem2_complete is not None and sem3_complete is not None
        else None
    )

    ba_eligible = (
        bool(vorpruefung) and erreichte_ects >= 134
        if vorpruefung is not None
        else None
    )

    return {
        "sem1_complete": sem1_complete,
        "sem2_complete": sem2_complete,
        "vorpruefung_bestanden": vorpruefung,
        "sem4_zugaenglich": sem1_complete,
        "sem5_zugaenglich": (
            bool(sem1_complete) and bool(sem2_complete)
            if sem1_complete is not None and sem2_complete is not None
            else None
        ),
        "sem6_zugaenglich": vorpruefung,
        "ba_zulassung_eligible": ba_eligible,
        "ects_fuer_ba": erreichte_ects,
    }
