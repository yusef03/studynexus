"""Tests for Sprint 5 Phase 4 – Admin Analytics + System.

Coverage:
  - GET /admin/stats — KPI shape + all fields present
  - GET /admin/stats — non-admin gets 403
  - GET /admin/stats/growth — returns period, days, data, total
  - GET /admin/stats/growth?period=7d — uses correct cutoff
  - GET /admin/stats/growth?period=invalid — 422
  - GET /admin/stats/modules — three lists present
  - GET /admin/stats/users — correct segmentation shape
  - GET /admin/system — system info shape
  - GET /admin/system/health — ok when both services up
  - GET /admin/system/health — degraded when redis down
"""
import uuid
from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app

_ADMIN_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_DT = datetime(2026, 5, 9, 12, 0, 0, tzinfo=timezone.utc)


def _admin():
    u = MagicMock()
    u.id = _ADMIN_UUID
    u.email = "admin@stud.hs-hannover.de"
    u.full_name = "Admin"
    u.is_active = True
    u.is_admin = True
    u.last_login_at = None
    u.created_at = _DT
    return u


def _non_admin():
    u = MagicMock()
    u.id = uuid.uuid4()
    u.is_admin = False
    return u


def _scalar_db(values: dict):
    """Create a mock_db whose scalar() returns predefined values in sequence."""
    db = MagicMock()
    scalars = list(values.values())
    db.query.return_value.scalar.side_effect = scalars
    db.query.return_value.filter.return_value.scalar.side_effect = scalars
    return db


# ── KPI Stats ─────────────────────────────────────────────────────────────────

def test_stats_non_admin_gets_403(mock_db):
    app.dependency_overrides[get_current_user] = lambda: _non_admin()
    app.dependency_overrides[get_db] = lambda: mock_db

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats")

    app.dependency_overrides.clear()
    assert resp.status_code == 403


def test_stats_returns_correct_shape(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.scalar.return_value = 42
    mock_db.query.return_value.filter.return_value.scalar.return_value = 10
    exec_result = MagicMock()
    exec_result.scalar.return_value = 512.0
    mock_db.execute.return_value = exec_result

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    required_keys = [
        "total_users", "verified_users", "active_users_30d", "premium_users",
        "total_student_modules", "passed_modules_today",
        "new_registrations_today", "new_registrations_week",
        "total_universities", "total_programs", "total_modules",
        "db_size_mb", "last_updated",
    ]
    for key in required_keys:
        assert key in data, f"Missing key: {key}"


def test_stats_db_size_fallback_on_error(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.scalar.return_value = 0
    mock_db.query.return_value.filter.return_value.scalar.return_value = 0
    mock_db.execute.side_effect = Exception("pg function not available")

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["db_size_mb"] == 0.0


# ── Growth ────────────────────────────────────────────────────────────────────

def test_growth_returns_correct_shape(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    row = MagicMock()
    row.day = date(2026, 5, 1)
    row.cnt = 3
    mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [row]

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/growth?period=7d")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["period"] == "7d"
    assert data["days"] == 7
    assert isinstance(data["data"], list)
    assert data["total"] == 3
    assert data["data"][0]["date"] == "2026-05-01"
    assert data["data"][0]["count"] == 3


def test_growth_default_period_is_30d(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/growth")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["days"] == 30


def test_growth_invalid_period_returns_422(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/growth?period=14d")

    app.dependency_overrides.clear()
    assert resp.status_code == 422


def test_growth_1y_uses_365_days(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/growth?period=1y")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["days"] == 365


# ── Module Stats ──────────────────────────────────────────────────────────────

def test_module_stats_returns_three_lists(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    # Each sub-query (top_by_students, worst_pass_rate, best_avg_note) calls .all()
    mock_db.query.return_value.join.return_value.filter.return_value.group_by.return_value.having.return_value.order_by.return_value.limit.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/modules")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert "top_by_students" in data
    assert "worst_pass_rate" in data
    assert "best_avg_note" in data
    assert isinstance(data["top_by_students"], list)


# ── User Segmentation ─────────────────────────────────────────────────────────

def test_user_stats_returns_correct_shape(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.scalar.return_value = 100
    mock_db.query.return_value.filter.return_value.scalar.return_value = 80

    prog_row = MagicMock()
    prog_row.program_name = "Angewandte Informatik"
    prog_row.cnt = 50
    mock_db.query.return_value.join.return_value.join.return_value.group_by.return_value.order_by.return_value.all.return_value = [prog_row]

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/users")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "active" in data
    assert "inactive" in data
    assert "premium" in data
    assert "by_program" in data
    assert isinstance(data["by_program"], list)
    assert data["by_program"][0]["program_name"] == "Angewandte Informatik"
    assert data["by_program"][0]["count"] == 50


# ── System ────────────────────────────────────────────────────────────────────

def test_system_info_returns_correct_shape(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    exec_result = MagicMock()
    exec_result.scalar.side_effect = ["PostgreSQL 15.3", 128.5]
    mock_db.execute.return_value = exec_result
    mock_db.query.return_value.scalar.return_value = 10
    mock_db.query.return_value.filter.return_value.scalar.return_value = 5

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/system")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert "db_version" in data
    assert "db_size_mb" in data
    assert "total_users" in data
    assert "total_modules" in data
    assert "total_audit_logs" in data
    assert "checked_at" in data


def test_system_health_all_ok(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.execute.return_value = MagicMock()

    with patch("app.routers.admin.system._redis") as mock_redis:
        mock_redis.ping.return_value = True
        with TestClient(app) as c:
            resp = c.get("/api/v1/admin/system/health")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall"] == "ok"
    assert data["database"]["status"] == "ok"
    assert data["redis"]["status"] == "ok"


def test_system_health_degraded_when_redis_down(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.execute.return_value = MagicMock()

    with patch("app.routers.admin.system._redis") as mock_redis:
        mock_redis.ping.side_effect = Exception("Redis connection refused")
        with TestClient(app) as c:
            resp = c.get("/api/v1/admin/system/health")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["overall"] == "degraded"
    assert data["database"]["status"] == "ok"
    assert data["redis"]["status"] == "error"
