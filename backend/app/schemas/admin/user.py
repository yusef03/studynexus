"""Admin User schemas (Sprint 5 Phase 2)."""
import math
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AdminUserListItem(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    matrikelnummer: Optional[str]
    is_active: bool
    is_premium: bool
    is_verified: bool
    is_admin: bool
    preferred_language: str
    created_at: datetime
    last_login_at: Optional[datetime]
    # Study plan summary
    program_name: Optional[str]
    start_semester: Optional[str]
    total_modules: int
    passed_modules: int
    erreichte_ects: int


class AdminUserListResponse(BaseModel):
    items: List[AdminUserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminUserDetailResponse(AdminUserListItem):
    university: Optional[str]
    birth_date: Optional[datetime]
    admin_notes: Optional[str]
    gpa: Optional[float]


class AdminUserPatch(BaseModel):
    is_active: Optional[bool] = None
    is_premium: Optional[bool] = None
    is_verified: Optional[bool] = None
    admin_notes: Optional[str] = None


class DeleteUserRequest(BaseModel):
    reason: str
