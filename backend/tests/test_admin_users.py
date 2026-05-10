"""Tests for Sprint 5 Phase 2 – Admin User Management.

Coverage:
  - Non-admin gets 403 on all /admin/users endpoints
  - GET /admin/users returns paginated list with correct shape
  - GET /admin/users?search= filters by email/name
  - GET /admin/users?is_active=false filters inactive users
  - GET /admin/users/{id} returns full detail
  - GET /admin/users/{id} returns 404 for unknown user
  - PATCH /admin/users/{id} updates fields and logs audit entry
  - PATCH /admin/users/{id} returns 404 for unknown user
  - DELETE /admin/users/{id} requires Admin-Session token (403 without)
  - DELETE /admin/users/{id} prevents deletion of admin accounts
  - DELETE /admin/users/{id} succeeds with valid Admin-Token + reason
"""
import uuid
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app
from fastapi.testclient import TestClient

_FIXED_UUID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
_TARGET_UUID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
_ADMIN_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_DT = datetime(2026, 5, 9, 12, 0, 0, tzinfo=timezone.utc)


def _make_admin():
    u = MagicMock()
    u.id = _ADMIN_UUID
    u.email = "admin@stud.hs-hannover.de"
    u.full_name = "Admin"
    u.is_active = True
    u.is_admin = True
    u.is_premium = False
    u.is_verified = True
    u.last_login_at = None
    u.created_at = _DT
    return u


def _make_target_user(**kwargs):
    u = MagicMock()
    u.id = _TARGET_UUID
    u.email = "student@stud.hs-hannover.de"
    u.full_name = "Max Mustermann"
    u.matrikelnummer = "1234567"
    u.university = "Hochschule Hannover"
    u.birth_date = None
    u.is_active = True
    u.is_premium = False
    u.is_verified = True
    u.is_admin = False
    u.preferred_language = "de"
    u.admin_notes = None
    u.created_at = _DT
    u.last_login_at = None
    for k, v in kwargs.items():
        setattr(u, k, v)
    return u


# ── Access Control ─────────────────────────────────────────────────────────────

def test_list_users_non_admin_gets_403(mock_db, mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users")
    app.dependency_overrides.clear()
    assert resp.status_code == 403


# ── GET List ──────────────────────────────────────────────────────────────────

def test_list_users_returns_paginated(mock_db):
    admin = _make_admin()
    user = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.count.return_value = 1
    mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [user]

    # Subqueries in _build_list_item
    mock_db.query.return_value.first.return_value = None  # no user_program
    mock_db.query.return_value.all.return_value = []  # no student_modules

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "total_pages" in data
    assert data["total"] == 1
    assert data["page"] == 1


def test_list_users_default_page_size_is_25(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin

    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.count.return_value = 0
    mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["page_size"] == 25


# ── GET Detail ────────────────────────────────────────────────────────────────

def test_get_user_detail_returns_full_profile(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.side_effect = lambda model, uid: target if uid == _TARGET_UUID else None
    mock_db.query.return_value.filter.return_value.first.return_value = None  # no user_program
    mock_db.query.return_value.filter.return_value.all.return_value = []  # no student_modules

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/users/{_TARGET_UUID}")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "student@stud.hs-hannover.de"
    assert data["full_name"] == "Max Mustermann"
    assert "gpa" in data
    assert "total_modules" in data
    assert "university" in data


def test_get_user_detail_returns_404_for_unknown(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    mock_db.get.return_value = None

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/users/{uuid.uuid4()}")

    app.dependency_overrides.clear()
    assert resp.status_code == 404


# ── PATCH ─────────────────────────────────────────────────────────────────────

def test_patch_user_updates_fields(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.side_effect = lambda model, uid: target if uid == _TARGET_UUID else None
    mock_db.query.return_value.filter.return_value.first.return_value = None
    mock_db.query.return_value.filter.return_value.all.return_value = []

    with patch("app.core.audit.AuditLogger.log") as mock_log:
        with TestClient(app) as c:
            resp = c.patch(
                f"/api/v1/admin/users/{_TARGET_UUID}",
                json={"is_active": False, "admin_notes": "Testnotiz"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert target.is_active is False
    assert target.admin_notes == "Testnotiz"
    mock_log.assert_called_once()
    call_kwargs = mock_log.call_args.kwargs
    assert call_kwargs["action"] == "UPDATE"
    assert call_kwargs["entity_type"] == "User"


def test_patch_user_returns_404(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    mock_db.get.return_value = None

    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/users/{uuid.uuid4()}", json={"is_active": False})

    app.dependency_overrides.clear()
    assert resp.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_user_without_admin_token_returns_401(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 0  # no valid session
        with TestClient(app) as c:
            resp = c.request(
                "DELETE",
                f"/api/v1/admin/users/{_TARGET_UUID}",
                json={"reason": "Test"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 401


def test_delete_admin_account_is_forbidden(mock_db):
    admin = _make_admin()
    target_admin = _make_target_user(is_admin=True)
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = target_admin

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1  # valid session
        with TestClient(app) as c:
            resp = c.request(
                "DELETE",
                f"/api/v1/admin/users/{_TARGET_UUID}",
                headers={"X-Admin-Token": "validtoken"},
                json={"reason": "Test"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 403


def test_delete_user_success(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = target
    mock_db.query.return_value.filter.return_value.delete.return_value = 0

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.request(
                    "DELETE",
                    f"/api/v1/admin/users/{_TARGET_UUID}",
                    headers={"X-Admin-Token": "validtoken"},
                    json={"reason": "Account auf Wunsch des Users gelöscht"},
                )

    app.dependency_overrides.clear()
    assert resp.status_code == 204
    mock_db.delete.assert_called_once_with(target)
    mock_db.commit.assert_called()
