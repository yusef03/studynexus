"""Admin ExamRegulations CRUD + Archive/Restore (Sprint 5 Phase 3, ADR-020)."""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module
from app.models.program import Program
from app.models.user import User
from app.core.admin_auth import get_admin_user, get_verified_admin
from app.core.audit import AuditLogger, get_audit_logger
from app.schemas.admin.po import (
    AdminExamRegCreate,
    AdminExamRegPatch,
    AdminExamRegResponse,
    AdminExamRegDetailResponse,
    ArchiveRequest,
)

router = APIRouter(prefix="/exam-regulations", tags=["admin-exam-regulations"])


@router.get("", response_model=List[AdminExamRegResponse])
def list_exam_regulations(
    program_id: Optional[UUID] = Query(None),
    include_archived: bool = Query(False),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(ExamRegulation)
    if program_id:
        q = q.filter(ExamRegulation.program_id == program_id)
    if not include_archived:
        q = q.filter(ExamRegulation.is_archived == False)
    return q.order_by(ExamRegulation.version).all()


@router.post("", response_model=AdminExamRegResponse, status_code=status.HTTP_201_CREATED)
def create_exam_regulation(
    payload: AdminExamRegCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not db.get(Program, payload.program_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")

    er = ExamRegulation(**payload.model_dump())
    db.add(er)
    db.flush()
    audit.log("CREATE", "ExamRegulation", entity_id=er.id, entity_label=er.version, new_value=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(er)
    return er


@router.get("/{er_id}", response_model=AdminExamRegDetailResponse)
def get_exam_regulation(
    er_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    er = db.get(ExamRegulation, er_id)
    if not er:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ExamRegulation not found")

    module_count = db.query(Module).filter(
        Module.exam_regulation_id == er_id,
        Module.is_archived == False,
    ).count()

    return AdminExamRegDetailResponse(
        **AdminExamRegResponse.model_validate(er).model_dump(),
        module_count=module_count,
    )


@router.patch("/{er_id}", response_model=AdminExamRegResponse)
def patch_exam_regulation(
    er_id: UUID,
    payload: AdminExamRegPatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    er = db.get(ExamRegulation, er_id)
    if not er:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ExamRegulation not found")

    old_snap = {"version": er.version, "ist_aktuell": er.ist_aktuell}
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(er, field, value)

    db.flush()
    audit.log("UPDATE", "ExamRegulation", entity_id=er.id, entity_label=er.version, old_value=old_snap, new_value=payload.model_dump(exclude_none=True, mode="json"))
    db.commit()
    db.refresh(er)
    return er


@router.post("/{er_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
def archive_exam_regulation(
    er_id: UUID,
    payload: ArchiveRequest,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    er = db.get(ExamRegulation, er_id)
    if not er:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ExamRegulation not found")
    if er.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already archived")

    er.is_archived = True
    er.archived_at = datetime.now(timezone.utc)
    er.archived_by = verified_admin.id
    er.archive_reason = payload.reason

    db.flush()
    audit.log("ARCHIVE", "ExamRegulation", entity_id=er.id, entity_label=er.version, old_value={"is_archived": False}, new_value={"is_archived": True}, reason=payload.reason)
    db.commit()
    return None


@router.post("/{er_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
def restore_exam_regulation(
    er_id: UUID,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    er = db.get(ExamRegulation, er_id)
    if not er:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ExamRegulation not found")
    if not er.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not archived")

    er.is_archived = False
    er.archived_at = None
    er.archived_by = None
    er.archive_reason = None

    db.flush()
    audit.log("RESTORE", "ExamRegulation", entity_id=er.id, entity_label=er.version, old_value={"is_archived": True}, new_value={"is_archived": False})
    db.commit()
    return None
