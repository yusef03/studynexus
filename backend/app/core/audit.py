"""AuditLogger FastAPI dependency (Sprint 5, ADR-019).

Usage in admin routers:
    audit: AuditLogger = Depends(get_audit_logger)
    audit.log("UPDATE", "Module", entity_id=m.id, entity_label=m.name,
               old_value=old_snap, new_value=new_snap)

db.flush() is called immediately so the log entry is persisted within the same
transaction as the mutation — if the mutation rolls back, the log rolls back too.
This is intentional: we only log successful changes.
"""
import uuid
from typing import Optional
from fastapi import Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.admin_auth import get_admin_user
from app.models.user import User
from app.models.admin_audit_log import AdminAuditLog


class AuditLogger:
    def __init__(self, db: Session, admin: User, ip: Optional[str] = None):
        self.db = db
        self.admin = admin
        self.ip = ip

    def log(
        self,
        action: str,
        entity_type: str,
        entity_id: Optional[uuid.UUID] = None,
        entity_label: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        reason: Optional[str] = None,
    ) -> AdminAuditLog:
        entry = AdminAuditLog(
            admin_id=self.admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            ip_address=self.ip,
        )
        self.db.add(entry)
        self.db.flush()
        return entry


def get_audit_logger(
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
) -> AuditLogger:
    ip = request.client.host if request.client else None
    return AuditLogger(db=db, admin=admin, ip=ip)
