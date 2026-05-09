"""Admin System info + Health check (Sprint 5 Phase 4)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin_audit_log import AdminAuditLog
from app.models.module import Module
from app.models.user import User
from app.core.admin_auth import get_admin_user, _redis
from app.schemas.admin.analytics import ServiceStatus, SystemHealthResponse, SystemInfoResponse

router = APIRouter(prefix="/system", tags=["admin-system"])


@router.get("", response_model=SystemInfoResponse)
def get_system_info(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    try:
        db_version = str(db.execute(text("SELECT version()")).scalar() or "unknown")
    except Exception:
        db_version = "unknown"

    try:
        db_size_mb = float(
            db.execute(text("SELECT pg_database_size(current_database()) / 1048576.0")).scalar() or 0
        )
    except Exception:
        db_size_mb = 0.0

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_modules = db.query(func.count(Module.id)).filter(Module.is_archived == False).scalar() or 0
    total_audit_logs = db.query(func.count(AdminAuditLog.id)).scalar() or 0

    return SystemInfoResponse(
        db_version=db_version,
        db_size_mb=round(db_size_mb, 2),
        total_users=total_users,
        total_modules=total_modules,
        total_audit_logs=total_audit_logs,
        checked_at=datetime.now(timezone.utc),
    )


@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    # Database check
    try:
        db.execute(text("SELECT 1"))
        db_status = ServiceStatus(status="ok")
    except Exception as e:
        db_status = ServiceStatus(status="error", detail=str(e))

    # Redis check
    try:
        _redis.ping()
        redis_status = ServiceStatus(status="ok")
    except Exception as e:
        redis_status = ServiceStatus(status="error", detail=str(e))

    all_ok = db_status.status == "ok" and redis_status.status == "ok"
    overall = "ok" if all_ok else ("down" if db_status.status == "error" else "degraded")

    return SystemHealthResponse(
        overall=overall,
        database=db_status,
        redis=redis_status,
    )
