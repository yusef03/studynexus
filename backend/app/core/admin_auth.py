"""Admin authentication and session management (Sprint 5, ADR-019 + ADR-021).

Two-layer admin protection:
  1. get_admin_user  — checks is_admin flag on the DB user (from JWT sub lookup)
  2. get_verified_admin — additionally validates a short-lived Redis session token
     sent as X-Admin-Token header; required for all destructive operations.

Admin session tokens are 15-minute UUIDs stored in Redis under
"admin_session:<admin_id>:<token>". They cannot be forged from the JWT alone,
providing a sudo-style re-authentication barrier for critical mutations.
"""
import uuid
import redis
from fastapi import Depends, HTTPException, Header, status
from app.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User

_redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
_ADMIN_SESSION_TTL = 900  # 15 minutes


def _session_key(admin_id: str, token: str) -> str:
    return f"admin_session:{admin_id}:{token}"


def create_admin_session_token(admin_id: str) -> str:
    token = uuid.uuid4().hex
    _redis.setex(_session_key(admin_id, token), _ADMIN_SESSION_TTL, "1")
    return token


def revoke_admin_session_token(admin_id: str, token: str) -> None:
    _redis.delete(_session_key(admin_id, token))


def verify_admin_session_token(admin_id: str, token: str) -> bool:
    return bool(_redis.exists(_session_key(admin_id, token)))


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def get_verified_admin(
    admin: User = Depends(get_admin_user),
    x_admin_token: str = Header(None, alias="X-Admin-Token"),
) -> User:
    """Dependency for destructive operations: requires valid Admin-Session token."""
    if not x_admin_token or not verify_admin_session_token(str(admin.id), x_admin_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin session expired. Re-authenticate via POST /admin/auth/session.",
        )
    return admin
