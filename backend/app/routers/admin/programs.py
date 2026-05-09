"""Admin Programs CRUD + Archive/Restore (Sprint 5 Phase 3, ADR-020).

Programs support soft-delete (is_archived). Archive requires Admin-Token + reason.
Restore requires Admin-Token. Students enrolled in archived programs keep their data.
"""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.program import Program
from app.models.faculty import Faculty
from app.models.exam_regulation import ExamRegulation
from app.models.user_program import UserProgram
from app.models.user import User
from app.core.admin_auth import get_admin_user, get_verified_admin
from app.core.audit import AuditLogger, get_audit_logger
from app.schemas.admin.po import (
    AdminProgramCreate,
    AdminProgramPatch,
    AdminProgramResponse,
    AdminProgramDetailResponse,
    AdminExamRegResponse,
    ArchiveRequest,
)

router = APIRouter(prefix="/programs", tags=["admin-programs"])


def _student_count(program_id: UUID, db: Session) -> int:
    er_ids = [
        er.id for er in
        db.query(ExamRegulation).filter(ExamRegulation.program_id == program_id).all()
    ]
    if not er_ids:
        return 0
    return db.query(UserProgram).filter(UserProgram.exam_regulation_id.in_(er_ids)).count()


@router.get("", response_model=List[AdminProgramResponse])
def list_programs(
    faculty_id: Optional[UUID] = Query(None),
    include_archived: bool = Query(False),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(Program)
    if faculty_id:
        q = q.filter(Program.faculty_id == faculty_id)
    if not include_archived:
        q = q.filter(Program.is_archived == False)
    return q.order_by(Program.name).all()


@router.post("", response_model=AdminProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(
    payload: AdminProgramCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not db.get(Faculty, payload.faculty_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")

    prog = Program(**payload.model_dump())
    db.add(prog)
    db.flush()
    audit.log("CREATE", "Program", entity_id=prog.id, entity_label=prog.name, new_value=payload.model_dump())
    db.commit()
    db.refresh(prog)
    return prog


@router.get("/{program_id}", response_model=AdminProgramDetailResponse)
def get_program(
    program_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    prog = db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")

    ers = db.query(ExamRegulation).filter(ExamRegulation.program_id == program_id).all()
    return AdminProgramDetailResponse(
        **AdminProgramResponse.model_validate(prog).model_dump(),
        student_count=_student_count(program_id, db),
        exam_regulations=[AdminExamRegResponse.model_validate(er) for er in ers],
    )


@router.patch("/{program_id}", response_model=AdminProgramResponse)
def patch_program(
    program_id: UUID,
    payload: AdminProgramPatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    prog = db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")

    old_snap = {"name": prog.name, "gesamt_ects": prog.gesamt_ects}
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(prog, field, value)

    db.flush()
    audit.log("UPDATE", "Program", entity_id=prog.id, entity_label=prog.name, old_value=old_snap, new_value=payload.model_dump(exclude_none=True))
    db.commit()
    db.refresh(prog)
    return prog


@router.post("/{program_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
def archive_program(
    program_id: UUID,
    payload: ArchiveRequest,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    prog = db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    if prog.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Program is already archived")

    prog.is_archived = True
    prog.archived_at = datetime.now(timezone.utc)
    prog.archived_by = verified_admin.id
    prog.archive_reason = payload.reason

    db.flush()
    audit.log("ARCHIVE", "Program", entity_id=prog.id, entity_label=prog.name, old_value={"is_archived": False}, new_value={"is_archived": True}, reason=payload.reason)
    db.commit()
    return None


@router.post("/{program_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
def restore_program(
    program_id: UUID,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    prog = db.get(Program, program_id)
    if not prog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    if not prog.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Program is not archived")

    prog.is_archived = False
    prog.archived_at = None
    prog.archived_by = None
    prog.archive_reason = None

    db.flush()
    audit.log("RESTORE", "Program", entity_id=prog.id, entity_label=prog.name, old_value={"is_archived": True}, new_value={"is_archived": False})
    db.commit()
    return None
