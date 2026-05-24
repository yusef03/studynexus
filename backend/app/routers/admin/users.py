"""Admin User Management (Sprint 5 Phase 2).

Endpoints:
  GET    /admin/users             → Paginated user list (search, filter, ADR-022)
  GET    /admin/users/{id}        → Full user detail incl. study plan summary
  PATCH  /admin/users/{id}        → Toggle is_active/is_premium/is_verified, admin_notes
  POST   /admin/users/{id}/reset-password → Generate new password, email user [Admin-Token]
  DELETE /admin/users/{id}        → Hard delete incl. cascade [Admin-Token + reason]

All mutations are audit-logged (AuditLogger dependency, ADR-019).
DELETE and reset-password require a valid Admin-Session token (ADR-019).
"""
import math
import secrets
import string
from uuid import UUID
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.user_program import UserProgram
from app.models.student_module import StudentModule, StudiengangStatus
from app.models.module import Module
from app.models.exam_regulation import ExamRegulation
from app.models.program import Program
from app.core.admin_auth import get_admin_user, get_verified_admin
from app.core.audit import AuditLogger, get_audit_logger
from app.core.security import hash_password
from app.services.email_service import send_verification_email, send_password_reset_email
from app.schemas.admin.user import (
    AdminUserListItem,
    AdminUserListResponse,
    AdminUserDetailResponse,
    AdminUserPatch,
    DeleteUserRequest,
)

router = APIRouter(prefix="/users", tags=["admin-users"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _user_snap(user: User) -> dict:
    return {
        "is_active": user.is_active,
        "is_premium": user.is_premium,
        "is_verified": user.is_verified,
        "admin_notes": user.admin_notes,
    }


def _get_program_info(user_id: UUID, db: Session) -> tuple[Optional[str], Optional[str]]:
    """Returns (program_name, start_semester) for a user."""
    up = db.query(UserProgram).filter(UserProgram.user_id == user_id).first()
    if not up:
        return None, None
    er = db.get(ExamRegulation, up.exam_regulation_id)
    if not er:
        return None, up.start_semester
    prog = db.get(Program, er.program_id)
    return (prog.name if prog else None), up.start_semester


def _get_module_summary(user_id: UUID, db: Session) -> dict:
    """Returns total_modules, passed_modules, erreichte_ects, gpa for a user."""
    sms = db.query(StudentModule).filter(StudentModule.user_id == user_id).all()
    if not sms:
        return {"total_modules": 0, "passed_modules": 0, "erreichte_ects": 0, "gpa": None}

    module_ids = [sm.module_id for sm in sms if sm.module_id]
    modules_by_id: dict[UUID, Module] = {}
    if module_ids:
        for m in db.query(Module).filter(Module.id.in_(module_ids)).all():
            modules_by_id[m.id] = m

    total = len(sms)
    passed = 0
    ects = 0
    gpa_num = 0.0
    gpa_den = 0.0

    for sm in sms:
        if sm.status != StudiengangStatus.PASSED:
            continue
        passed += 1
        module = modules_by_id.get(sm.module_id) if sm.module_id else None
        sm_ects = module.ects if module else (sm.custom_ects or 0)
        ects += sm_ects

        if sm.note is not None and module:
            ist_benotet = (
                sm.custom_ist_benotet
                if sm.custom_ist_benotet is not None
                else module.ist_benotet
            )
            if ist_benotet and module.gewichtung > 0:
                gpa_num += sm.note * sm_ects * module.gewichtung
                gpa_den += sm_ects * module.gewichtung

    gpa = round(gpa_num / gpa_den, 2) if gpa_den > 0 else None
    return {"total_modules": total, "passed_modules": passed, "erreichte_ects": ects, "gpa": gpa}


def _build_list_item(user: User, db: Session) -> AdminUserListItem:
    program_name, start_semester = _get_program_info(user.id, db)
    summary = _get_module_summary(user.id, db)
    return AdminUserListItem(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        matrikelnummer=user.matrikelnummer,
        is_active=user.is_active,
        is_premium=user.is_premium,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        preferred_language=user.preferred_language,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        program_name=program_name,
        start_semester=start_semester,
        total_modules=summary["total_modules"],
        passed_modules=summary["passed_modules"],
        erreichte_ects=summary["erreichte_ects"],
    )


def _build_detail(user: User, db: Session) -> AdminUserDetailResponse:
    program_name, start_semester = _get_program_info(user.id, db)
    summary = _get_module_summary(user.id, db)
    return AdminUserDetailResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        matrikelnummer=user.matrikelnummer,
        university=user.university,
        birth_date=user.birth_date,
        is_active=user.is_active,
        is_premium=user.is_premium,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        preferred_language=user.preferred_language,
        admin_notes=user.admin_notes,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        program_name=program_name,
        start_semester=start_semester,
        total_modules=summary["total_modules"],
        passed_modules=summary["passed_modules"],
        erreichte_ects=summary["erreichte_ects"],
        gpa=summary["gpa"],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("", response_model=AdminUserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, description="Name, Email oder Matrikelnummer"),
    is_active: Optional[bool] = Query(None),
    is_premium: Optional[bool] = Query(None),
    is_verified: Optional[bool] = Query(None),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(User)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                User.email.ilike(term),
                User.full_name.ilike(term),
                User.matrikelnummer.ilike(term),
            )
        )
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if is_premium is not None:
        q = q.filter(User.is_premium == is_premium)
    if is_verified is not None:
        q = q.filter(User.is_verified == is_verified)

    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return AdminUserListResponse(
        items=[_build_list_item(u, db) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{user_id}", response_model=AdminUserDetailResponse)
def get_user(
    user_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _build_detail(user, db)


@router.patch("/{user_id}", response_model=AdminUserDetailResponse)
def patch_user(
    user_id: UUID,
    payload: AdminUserPatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_snap = _user_snap(user)

    if payload.is_active is not None:
        if payload.is_active is False and user.id == admin.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own account.")
        user.is_active = payload.is_active
    if payload.is_premium is not None:
        user.is_premium = payload.is_premium
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified
    if payload.admin_notes is not None:
        user.admin_notes = payload.admin_notes

    db.flush()
    audit.log(
        action="UPDATE",
        entity_type="User",
        entity_id=user.id,
        entity_label=f"{user.full_name} <{user.email}>",
        old_value=old_snap,
        new_value=_user_snap(user),
    )
    db.commit()
    db.refresh(user)
    return _build_detail(user, db)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    user_id: UUID,
    background_tasks: BackgroundTasks,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    """Generate a random 12-char password, set it, and email it to the user. [Admin-Token required]"""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_password = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    user.hashed_password = hash_password(new_password)

    audit.log(
        action="RESET_PASSWORD",
        entity_type="User",
        entity_id=user.id,
        entity_label=f"{user.full_name} <{user.email}>",
    )
    db.commit()

    background_tasks.add_task(send_password_reset_email, user.email, new_password)
    return {"detail": "Password reset. New password sent to user's email.", "new_password": new_password}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    reason: str = Query(..., min_length=1, description="Begründung für die Löschung"),
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    """Hard-delete user and all their data. [Admin-Token + reason required]"""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be deleted via this endpoint.",
        )

    old_snap = {
        "email": user.email,
        "full_name": user.full_name,
        "matrikelnummer": user.matrikelnummer,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }

    audit.log(
        action="DELETE",
        entity_type="User",
        entity_id=user.id,
        entity_label=f"{user.full_name} <{user.email}>",
        old_value=old_snap,
        reason=reason,
    )

    # Delete cascaded data that has no DB-level ON DELETE CASCADE
    db.query(StudentModule).filter(StudentModule.user_id == user_id).delete(synchronize_session=False)
    db.query(UserProgram).filter(UserProgram.user_id == user_id).delete(synchronize_session=False)
    # Tasks + Events have ON DELETE CASCADE on the FK, but we flush audit first
    db.flush()
    db.delete(user)
    db.commit()
    return None
