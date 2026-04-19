from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module
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

    return StatsResponse(
        gpa=calculate_gpa(student_modules, modules_by_id),
        erreichte_ects=erreichte_ects,
        gesamt_ects=gesamt_ects,
        fortschritt_prozent=fortschritt,
        bestandene_module=len(bestandene),
        nicht_bestandene_module=len(nicht_bestandene),
        offene_module=len(offene),
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
