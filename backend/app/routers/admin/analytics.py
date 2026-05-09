"""Admin Analytics endpoints (Sprint 5 Phase 4).

All queries are read-only aggregations — no mutations, no audit logging needed.
"""
from datetime import datetime, timezone, timedelta
from typing import Literal, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, case, cast, Date, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module
from app.models.program import Program
from app.models.student_module import StudentModule, StudiengangStatus
from app.models.university import University
from app.models.user import User
from app.models.user_program import UserProgram
from app.core.admin_auth import get_admin_user
from app.schemas.admin.analytics import (
    AdminStatsResponse,
    DailyRegistration,
    GrowthResponse,
    ModuleStatItem,
    ModuleStatsResponse,
    ProgramSegment,
    UserStatsResponse,
)

router = APIRouter(prefix="/stats", tags=["admin-analytics"])

_PERIOD_DAYS: dict = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}


def _module_stat_rows(db: Session, order_col, asc: bool, limit: int, note_filter: bool = False) -> List[ModuleStatItem]:
    passed_expr = func.sum(
        case((StudentModule.status == StudiengangStatus.PASSED, 1), else_=0)
    )
    total_expr = func.count(StudentModule.id)
    avg_note_expr = func.avg(StudentModule.note)

    q = (
        db.query(
            Module.id.label("mid"),
            Module.name,
            Module.kuerzel,
            total_expr.label("student_count"),
            avg_note_expr.label("avg_note"),
            (passed_expr * 100.0 / func.nullif(total_expr, 0)).label("pass_rate"),
        )
        .join(StudentModule, StudentModule.module_id == Module.id)
        .filter(Module.is_archived == False)
        .group_by(Module.id, Module.name, Module.kuerzel)
        .having(total_expr > 0)
    )

    if note_filter:
        q = q.having(avg_note_expr.isnot(None))

    q = q.order_by(order_col if asc else order_col.desc()).limit(limit)

    return [
        ModuleStatItem(
            module_id=r.mid,
            name=r.name,
            kuerzel=r.kuerzel,
            student_count=r.student_count,
            avg_note=round(float(r.avg_note), 2) if r.avg_note is not None else None,
            pass_rate=round(float(r.pass_rate), 1) if r.pass_rate is not None else None,
        )
        for r in q.all()
    ]


# ── KPI Overview ──────────────────────────────────────────────────────────────

@router.get("", response_model=AdminStatsResponse)
def get_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar() or 0
    verified_users = db.query(func.count(User.id)).filter(User.is_verified == True).scalar() or 0
    premium_users = db.query(func.count(User.id)).filter(User.is_premium == True).scalar() or 0
    active_users_30d = (
        db.query(func.count(User.id))
        .filter(User.last_login_at >= month_ago)
        .scalar() or 0
    )

    total_student_modules = db.query(func.count(StudentModule.id)).scalar() or 0
    passed_modules_today = (
        db.query(func.count(StudentModule.id))
        .filter(
            StudentModule.status == StudiengangStatus.PASSED,
            StudentModule.pruefungs_datum >= today_start,
        )
        .scalar() or 0
    )

    new_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    new_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0

    total_universities = db.query(func.count(University.id)).scalar() or 0
    total_programs = (
        db.query(func.count(Program.id)).filter(Program.is_archived == False).scalar() or 0
    )
    total_modules = (
        db.query(func.count(Module.id)).filter(Module.is_archived == False).scalar() or 0
    )

    try:
        db_size_mb = float(
            db.execute(text("SELECT pg_database_size(current_database()) / 1048576.0")).scalar() or 0
        )
    except Exception:
        db_size_mb = 0.0

    return AdminStatsResponse(
        total_users=total_users,
        verified_users=verified_users,
        active_users_30d=active_users_30d,
        premium_users=premium_users,
        total_student_modules=total_student_modules,
        passed_modules_today=passed_modules_today,
        new_registrations_today=new_today,
        new_registrations_week=new_week,
        total_universities=total_universities,
        total_programs=total_programs,
        total_modules=total_modules,
        db_size_mb=round(db_size_mb, 2),
        last_updated=now,
    )


# ── Growth ────────────────────────────────────────────────────────────────────

@router.get("/growth", response_model=GrowthResponse)
def get_growth(
    period: Literal["7d", "30d", "90d", "1y"] = Query("30d"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    days = _PERIOD_DAYS[period]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        db.query(
            cast(User.created_at, Date).label("day"),
            func.count(User.id).label("cnt"),
        )
        .filter(User.created_at >= cutoff)
        .group_by(cast(User.created_at, Date))
        .order_by(cast(User.created_at, Date))
        .all()
    )

    data = [DailyRegistration(date=row.day, count=row.cnt) for row in rows]
    return GrowthResponse(
        period=period,
        days=days,
        data=data,
        total=sum(d.count for d in data),
    )


# ── Module Stats ──────────────────────────────────────────────────────────────

@router.get("/modules", response_model=ModuleStatsResponse)
def get_module_stats(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    student_count_col = func.count(StudentModule.id)
    pass_rate_col = (
        func.sum(case((StudentModule.status == StudiengangStatus.PASSED, 1), else_=0))
        * 100.0
        / func.nullif(func.count(StudentModule.id), 0)
    )
    avg_note_col = func.avg(StudentModule.note)

    return ModuleStatsResponse(
        top_by_students=_module_stat_rows(db, student_count_col, asc=False, limit=limit),
        worst_pass_rate=_module_stat_rows(db, pass_rate_col, asc=True, limit=limit),
        best_avg_note=_module_stat_rows(db, avg_note_col, asc=True, limit=limit, note_filter=True),
    )


# ── User Segmentation ─────────────────────────────────────────────────────────

@router.get("/users", response_model=UserStatsResponse)
def get_user_stats(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total = db.query(func.count(User.id)).scalar() or 0
    active = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    verified = db.query(func.count(User.id)).filter(User.is_verified == True).scalar() or 0
    premium = db.query(func.count(User.id)).filter(User.is_premium == True).scalar() or 0
    reg_7d = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    reg_30d = db.query(func.count(User.id)).filter(User.created_at >= month_ago).scalar() or 0

    program_rows = (
        db.query(
            Program.name.label("program_name"),
            func.count(UserProgram.id).label("cnt"),
        )
        .join(ExamRegulation, ExamRegulation.id == UserProgram.exam_regulation_id)
        .join(Program, Program.id == ExamRegulation.program_id)
        .group_by(Program.name)
        .order_by(func.count(UserProgram.id).desc())
        .all()
    )

    return UserStatsResponse(
        total=total,
        active=active,
        inactive=total - active,
        verified=verified,
        unverified=total - verified,
        premium=premium,
        registered_last_7d=reg_7d,
        registered_last_30d=reg_30d,
        by_program=[ProgramSegment(program_name=r.program_name, count=r.cnt) for r in program_rows],
    )
