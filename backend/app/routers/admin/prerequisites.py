"""Admin ModulePrerequisites CRUD (Sprint 5 Phase 3, ADR-020).

Prerequisites have no student data — hard delete is safe.
"""
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.module import Module
from app.models.module_prerequisite import ModulePrerequisite
from app.models.user import User
from app.core.admin_auth import get_admin_user
from app.core.audit import AuditLogger, get_audit_logger
from app.schemas.admin.po import (
    AdminPrerequisiteCreate,
    AdminPrerequisitePatch,
    AdminPrerequisiteResponse,
)

router = APIRouter(prefix="/prerequisites", tags=["admin-prerequisites"])


@router.get("/by-module/{module_id}", response_model=List[AdminPrerequisiteResponse])
def list_prerequisites(
    module_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if not db.get(Module, module_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return db.query(ModulePrerequisite).filter(ModulePrerequisite.module_id == module_id).all()


@router.post("", response_model=AdminPrerequisiteResponse, status_code=status.HTTP_201_CREATED)
def create_prerequisite(
    payload: AdminPrerequisiteCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not db.get(Module, payload.module_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    if payload.required_module_id and not db.get(Module, payload.required_module_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Required module not found")

    prereq = ModulePrerequisite(**payload.model_dump())
    db.add(prereq)
    db.flush()
    audit.log("CREATE", "ModulePrerequisite", entity_id=prereq.id, entity_label=prereq.description, new_value=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(prereq)
    return prereq


@router.patch("/{prereq_id}", response_model=AdminPrerequisiteResponse)
def patch_prerequisite(
    prereq_id: UUID,
    payload: AdminPrerequisitePatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    prereq = db.get(ModulePrerequisite, prereq_id)
    if not prereq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prerequisite not found")

    if payload.required_module_id and not db.get(Module, payload.required_module_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Required module not found")

    old_snap = {"description": prereq.description}
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(prereq, field, value)

    db.flush()
    audit.log("UPDATE", "ModulePrerequisite", entity_id=prereq.id, entity_label=prereq.description, old_value=old_snap, new_value=payload.model_dump(exclude_none=True, mode="json"))
    db.commit()
    db.refresh(prereq)
    return prereq


@router.delete("/{prereq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prerequisite(
    prereq_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    prereq = db.get(ModulePrerequisite, prereq_id)
    if not prereq:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prerequisite not found")

    audit.log("DELETE", "ModulePrerequisite", entity_id=prereq.id, entity_label=prereq.description)
    db.flush()
    db.delete(prereq)
    db.commit()
    return None
