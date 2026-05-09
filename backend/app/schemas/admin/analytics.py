"""Admin Analytics + System schemas (Sprint 5 Phase 4)."""
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


# ── KPI Overview ──────────────────────────────────────────────────────────────

class AdminStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    active_users_30d: int
    premium_users: int
    total_student_modules: int
    passed_modules_today: int
    new_registrations_today: int
    new_registrations_week: int
    total_universities: int
    total_programs: int
    total_modules: int
    db_size_mb: float
    last_updated: datetime


# ── Growth ────────────────────────────────────────────────────────────────────

class DailyRegistration(BaseModel):
    date: date
    count: int


class GrowthResponse(BaseModel):
    period: str
    days: int
    data: List[DailyRegistration]
    total: int


# ── Module Stats ──────────────────────────────────────────────────────────────

class ModuleStatItem(BaseModel):
    module_id: UUID
    name: str
    kuerzel: Optional[str]
    student_count: int
    avg_note: Optional[float]
    pass_rate: Optional[float]


class ModuleStatsResponse(BaseModel):
    top_by_students: List[ModuleStatItem]
    worst_pass_rate: List[ModuleStatItem]
    best_avg_note: List[ModuleStatItem]


# ── User Segmentation ─────────────────────────────────────────────────────────

class ProgramSegment(BaseModel):
    program_name: str
    count: int


class UserStatsResponse(BaseModel):
    total: int
    active: int
    inactive: int
    verified: int
    unverified: int
    premium: int
    registered_last_7d: int
    registered_last_30d: int
    by_program: List[ProgramSegment]


# ── System ────────────────────────────────────────────────────────────────────

class ServiceStatus(BaseModel):
    status: str  # "ok" | "error"
    detail: Optional[str] = None


class SystemHealthResponse(BaseModel):
    overall: str  # "ok" | "degraded" | "down"
    database: ServiceStatus
    redis: ServiceStatus


class SystemInfoResponse(BaseModel):
    db_version: str
    db_size_mb: float
    total_users: int
    total_modules: int
    total_audit_logs: int
    checked_at: datetime
