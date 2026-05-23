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

def test_list_users_non_admin_gets_403(mock_db, mock_user):
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users")
    app.dependency_overrides.clear()
    assert resp.status_code == 403

def test_list_users_returns_paginated(mock_db):
    admin = _make_admin()
    user = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.count.return_value = 1
    mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [user]

    # Subqueries in _build_list_item: no user program, no student modules
    mock_db.query.return_value.first.return_value = None
    mock_db.query.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users")

    app.dependency_overrides.clear()
    assert resp.status_code == 200

def test_list_users_default_page_size_is_25(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.count.return_value = 0
    mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["page_size"] == 25

def test_list_users_with_filters(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.count.return_value = 0
    mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/users?search=max&is_active=true&is_premium=false&is_verified=true")

    app.dependency_overrides.clear()
    assert resp.status_code == 200

def test_get_user_detail_returns_full_profile(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.side_effect = lambda model, uid: target if uid == _TARGET_UUID else None
    
    # Mocking _get_program_info & _get_module_summary complex branches
    up_mock = MagicMock()
    up_mock.exam_regulation_id = uuid.uuid4()
    up_mock.start_semester = "WS25"
    er_mock = MagicMock()
    er_mock.program_id = uuid.uuid4()
    prog_mock = MagicMock()
    prog_mock.name = "Informatik"
    
    def mock_db_get(model, uid):
        if model.__name__ == "User": return target if uid == _TARGET_UUID else None
        if model.__name__ == "ExamRegulation": return er_mock
        if model.__name__ == "Program": return prog_mock
        return None
    mock_db.get.side_effect = mock_db_get
    
    sm_mock = MagicMock()
    sm_mock.module_id = uuid.uuid4()
    sm_mock.status = "PASSED" # StudiengangStatus.PASSED matches string enum mostly, or we assume it matches
    sm_mock.note = 1.0
    sm_mock.custom_ects = None
    sm_mock.custom_ist_benotet = None
    
    module_mock = MagicMock()
    module_mock.id = sm_mock.module_id
    module_mock.ects = 5
    module_mock.ist_benotet = True
    module_mock.gewichtung = 1.0

    def mock_query(model):
        q = MagicMock()
        if model.__name__ == "UserProgram":
            q.filter.return_value.first.return_value = up_mock
        elif model.__name__ == "StudentModule":
            q.filter.return_value.all.return_value = [sm_mock]
        elif model.__name__ == "Module":
            q.filter.return_value.all.return_value = [module_mock]
        return q
        
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/users/{_TARGET_UUID}")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["program_name"] == "Informatik"
    assert data["gpa"] == 1.0

def test_get_user_detail_returns_404_for_unknown(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/users/{uuid.uuid4()}")

    app.dependency_overrides.clear()
    assert resp.status_code == 404

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
                json={"is_active": False, "is_premium": True, "is_verified": False, "admin_notes": "Testnotiz"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert target.is_active is False
    assert target.is_premium is True
    assert target.is_verified is False
    assert target.admin_notes == "Testnotiz"

def test_patch_user_returns_404(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None

    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/users/{uuid.uuid4()}", json={"is_active": False})

    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_reset_password_success(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = target

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log") as mock_log:
            with patch("app.routers.admin.users.send_verification_email") as mock_send_email:
                with TestClient(app) as c:
                    resp = c.post(
                        f"/api/v1/admin/users/{_TARGET_UUID}/reset-password",
                        headers={"X-Admin-Token": "validtoken"},
                    )

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    mock_log.assert_called_once()
    assert mock_log.call_args.kwargs["action"] == "RESET_PASSWORD"

def test_reset_password_returns_404(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(
                f"/api/v1/admin/users/{uuid.uuid4()}/reset-password",
                headers={"X-Admin-Token": "validtoken"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_delete_user_without_admin_token_returns_401(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 0
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
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.request(
                "DELETE",
                f"/api/v1/admin/users/{_TARGET_UUID}",
                headers={"X-Admin-Token": "validtoken"},
                json={"reason": "Test"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 403

def test_delete_user_returns_404(mock_db):
    admin = _make_admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.request(
                "DELETE",
                f"/api/v1/admin/users/{uuid.uuid4()}",
                headers={"X-Admin-Token": "validtoken"},
                json={"reason": "Test"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_delete_user_success(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = target

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

def test_get_user_detail_er_not_found(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.side_effect = lambda model, uid: target if model.__name__ == "User" else None
    up_mock = MagicMock()
    up_mock.start_semester = "WS25"
    mock_db.query.return_value.filter.return_value.first.return_value = up_mock
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/users/{_TARGET_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["start_semester"] == "WS25"
    assert resp.json()["program_name"] is None

def test_get_user_detail_failed_module(mock_db):
    admin = _make_admin()
    target = _make_target_user()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.side_effect = lambda model, uid: target if model.__name__ == "User" else None
    
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    sm_mock = MagicMock()
    sm_mock.status = "FAILED"
    sm_mock.module_id = uuid.uuid4()
    
    def mock_query(model):
        q = MagicMock()
        if model.__name__ == "StudentModule":
            q.filter.return_value.all.return_value = [sm_mock]
        elif model.__name__ == "Module":
            q.filter.return_value.all.return_value = []
        elif model.__name__ == "UserProgram":
            q.filter.return_value.first.return_value = None
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/users/{_TARGET_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["passed_modules"] == 0
