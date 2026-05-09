"""Admin Session Authentication (Sprint 5 Phase 1, ADR-019).

Endpoints:
  POST   /admin/auth/session   → re-authenticate with password → returns 15-min token
  DELETE /admin/auth/session   → invalidate current Admin-Session token
  GET    /admin/me             → own admin profile

The Admin-Session token is separate from the regular JWT. It must be sent as
X-Admin-Token header when calling destructive endpoints (archive, delete, etc.).
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.admin_auth import (
    get_admin_user,
    create_admin_session_token,
    revoke_admin_session_token,
)
from app.core.security import verify_password

router = APIRouter(prefix="/auth", tags=["admin-auth"])


class AdminSessionRequest(BaseModel):
    password: str


class AdminSessionResponse(BaseModel):
    admin_token: str
    expires_in: int = 900


class AdminMeResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    is_admin: bool
    last_login_at: datetime | None


@router.post("/session", response_model=AdminSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: AdminSessionRequest,
    admin: User = Depends(get_admin_user),
):
    """Re-authenticate as admin. Returns a short-lived session token for destructive operations."""
    if not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    token = create_admin_session_token(str(admin.id))
    return AdminSessionResponse(admin_token=token)


@router.delete("/session", status_code=status.HTTP_204_NO_CONTENT)
def revoke_session(
    admin: User = Depends(get_admin_user),
    x_admin_token: str = Header(None, alias="X-Admin-Token"),
):
    """Invalidate the current Admin-Session token."""
    if x_admin_token:
        revoke_admin_session_token(str(admin.id), x_admin_token)
    return None


@router.get("/me", response_model=AdminMeResponse)
def admin_me(admin: User = Depends(get_admin_user)):
    return {
        "id": str(admin.id),
        "email": admin.email,
        "full_name": admin.full_name,
        "is_admin": admin.is_admin,
        "last_login_at": admin.last_login_at,
    }
