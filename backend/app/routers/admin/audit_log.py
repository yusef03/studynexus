"""Admin Audit-Log — read-only listing (Sprint 5 Phase 10)."""
import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.admin_auth import get_admin_user
from app.database import get_db
from app.models.admin_audit_log import AdminAuditLog
from app.models.user import User
from app.schemas.admin.audit_log import AuditLogItem, AuditLogListResponse

router = APIRouter(prefix="/audit-log", tags=["admin-audit-log"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin_id: Optional[UUID] = None,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(AdminAuditLog)

    if entity_type:
        q = q.filter(AdminAuditLog.entity_type == entity_type)
    if action:
        q = q.filter(AdminAuditLog.action == action)
    if admin_id:
        q = q.filter(AdminAuditLog.admin_id == admin_id)
    if date_from:
        q = q.filter(AdminAuditLog.created_at >= date_from)
    if date_to:
        q = q.filter(AdminAuditLog.created_at <= date_to)

    total = q.count()
    items_raw = (
        q.order_by(AdminAuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Resolve admin names in one query
    admin_ids = {r.admin_id for r in items_raw if r.admin_id}
    name_map: dict = {}
    if admin_ids:
        users = db.query(User.id, User.full_name).filter(User.id.in_(admin_ids)).all()
        name_map = {str(u.id): u.full_name or "Admin" for u in users}

    items = []
    for row in items_raw:
        item = AuditLogItem(
            id=row.id,
            admin_id=row.admin_id,
            admin_name=name_map.get(str(row.admin_id), "System") if row.admin_id else "System",
            action=row.action,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            entity_label=row.entity_label,
            old_value=row.old_value,
            new_value=row.new_value,
            reason=row.reason,
            ip_address=row.ip_address,
            created_at=row.created_at,
        )
        items.append(item)

    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.get("/{log_id}", response_model=AuditLogItem)
def get_audit_log(
    log_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    row = db.query(AdminAuditLog).filter(AdminAuditLog.id == log_id).first()
    if not row:
        from fastapi import HTTPException
        raise HTTPException(404, "Audit log entry not found")

    admin_name = "System"
    if row.admin_id:
        u = db.query(User.full_name).filter(User.id == row.admin_id).scalar()
        admin_name = u or "Admin"

    return AuditLogItem(
        id=row.id,
        admin_id=row.admin_id,
        admin_name=admin_name,
        action=row.action,
        entity_type=row.entity_type,
        entity_id=row.entity_id,
        entity_label=row.entity_label,
        old_value=row.old_value,
        new_value=row.new_value,
        reason=row.reason,
        ip_address=row.ip_address,
        created_at=row.created_at,
    )
