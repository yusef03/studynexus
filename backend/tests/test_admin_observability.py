"""Tests for Sprint 5 Phase 5 – Admin Observability.

Coverage should be 100% for:
  - analytics.py
  - audit_log.py
  - system.py
"""
import uuid
from datetime import datetime, timezone, date
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app
from app.models.student_module import StudiengangStatus

_ADMIN_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_LOG_UUID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_DT = datetime(2026, 5, 9, 12, 0, 0, tzinfo=timezone.utc)

def _admin():
    u = MagicMock()
    u.id = _ADMIN_UUID
    u.email = "admin@test.local"
    u.full_name = "Admin"
    u.is_active = True
    u.is_admin = True
    u.last_login_at = _DT
    u.created_at = _DT
    return u

def _make_audit_log():
    row = MagicMock()
    row.id = _LOG_UUID
    row.admin_id = _ADMIN_UUID
    row.action = "UPDATE"
    row.entity_type = "User"
    row.entity_id = str(uuid.uuid4())
    row.entity_label = "Test"
    row.old_value = {}
    row.new_value = {}
    row.reason = "r"
    row.ip_address = "127.0.0.1"
    row.created_at = _DT
    return row

def _make_user_row():
    u = MagicMock()
    u.id = _ADMIN_UUID
    u.full_name = "Real Admin"
    return u

# ── Analytics ─────────────────────────────────────────────────────────────────

def test_get_stats_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db

    def mock_scalar():
        return 5
    mock_db.query.return_value.scalar.side_effect = mock_scalar
    mock_db.query.return_value.filter.return_value.scalar.side_effect = mock_scalar

    def mock_exec(*args):
        m = MagicMock()
        m.scalar.return_value = 100.0
        return m
    mock_db.execute.side_effect = mock_exec

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["total_users"] == 5

def test_get_stats_db_exception(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.query.return_value.scalar.return_value = 0
    mock_db.query.return_value.filter.return_value.scalar.return_value = 0

    mock_db.execute.side_effect = Exception("DB error")

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["db_size_mb"] == 0.0

def test_get_growth(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db

    row = MagicMock()
    row.day = date(2026, 5, 9)
    row.cnt = 10
    mock_db.query.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [row]

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/growth?period=30d")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["total"] == 10

def test_get_module_stats(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db

    row = MagicMock()
    row.mid = uuid.uuid4()
    row.name = "Prog I"
    row.kuerzel = "BIN-100"
    row.student_count = 50
    row.avg_note = 2.5
    row.pass_rate = 80.0

    def mock_query(*args):
        q = MagicMock()
        q.join.return_value.filter.return_value.group_by.return_value.having.return_value.order_by.return_value.limit.return_value.all.return_value = [row]
        
        # specific for note_filter
        filtered_q = MagicMock()
        filtered_q.order_by.return_value.limit.return_value.all.return_value = [row]
        q.join.return_value.filter.return_value.group_by.return_value.having.return_value.having.return_value = filtered_q
        
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/modules?limit=5")
    app.dependency_overrides.clear()
    assert resp.status_code == 200

def test_get_user_stats(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    mock_db.query.return_value.scalar.return_value = 100
    mock_db.query.return_value.filter.return_value.scalar.return_value = 50
    
    row = MagicMock()
    row.program_name = "Test"
    row.cnt = 20
    
    def mock_query(*args):
        q = MagicMock()
        if len(args) == 1:
            q.scalar.return_value = 100
            q.filter.return_value.scalar.return_value = 50
            return q
        q.join.return_value.join.return_value.group_by.return_value.order_by.return_value.all.return_value = [row]
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/stats/users")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["total"] == 100

# ── Audit Log ─────────────────────────────────────────────────────────────────

def test_list_audit_logs(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    mock_db.query.return_value.count.return_value = 1
    mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [_make_audit_log()]
    
    # second query for names
    mock_db.query.return_value.filter.return_value.all.return_value = [_make_user_row()]

    def mock_query(*args):
        q = MagicMock()
        if len(args) == 1:
            q.filter.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.count.return_value = 1
            q.filter.return_value.filter.return_value.filter.return_value.filter.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [_make_audit_log()]
            return q
        else:
            q.filter.return_value.all.return_value = [_make_user_row()]
            return q
    mock_db.query.side_effect = mock_query
    
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log?entity_type=User&action=UPDATE&date_from=2026-01-01&date_to=2026-12-31&admin_id={_ADMIN_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["admin_name"] == "Real Admin"

def test_list_audit_logs_no_users(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    # an audit log without admin_id
    r = _make_audit_log()
    r.admin_id = None
    
    def mock_query(*args):
        q = MagicMock()
        q.count.return_value = 1
        q.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [r]
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["items"][0]["admin_name"] == "System"

def test_get_audit_log_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_query(*args):
        q = MagicMock()
        if len(args) == 1:
            if hasattr(args[0], "__name__") and args[0].__name__ == "AdminAuditLog":
                q.filter.return_value.first.return_value = _make_audit_log()
            else:
                q.filter.return_value.scalar.return_value = "Real Admin"
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{_LOG_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["admin_name"] == "Real Admin"

def test_get_audit_log_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{uuid.uuid4()}")
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_get_audit_log_no_admin(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    r = _make_audit_log()
    r.admin_id = None
    
    def mock_query(*args):
        q = MagicMock()
        q.filter.return_value.first.return_value = r
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{_LOG_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["admin_name"] == "System"

# ── System ────────────────────────────────────────────────────────────────────

def test_get_system_info_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_exec(*args):
        m = MagicMock()
        m.scalar.return_value = "PostgreSQL 15" if "version" in str(args[0]) else 100.0
        return m
    mock_db.execute.side_effect = mock_exec
    
    def mock_query(*args):
        q = MagicMock()
        q.scalar.return_value = 50
        q.filter.return_value.scalar.return_value = 50
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/system")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["db_version"] == "PostgreSQL 15"

def test_get_system_info_exception(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    mock_db.execute.side_effect = Exception("DB error")
    mock_db.query.return_value.scalar.return_value = 0
    mock_db.query.return_value.filter.return_value.scalar.return_value = 0
    
    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/system")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["db_version"] == "unknown"
    assert resp.json()["db_size_mb"] == 0.0

def test_get_system_health_ok(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    with patch("app.routers.admin.system._redis") as mock_redis:
        mock_redis.ping.return_value = True
        with TestClient(app) as c:
            resp = c.get("/api/v1/admin/system/health")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["overall"] == "ok"

def test_get_system_health_degraded(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    with patch("app.routers.admin.system._redis") as mock_redis:
        mock_redis.ping.side_effect = Exception("Redis timeout")
        with TestClient(app) as c:
            resp = c.get("/api/v1/admin/system/health")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["overall"] == "degraded"

def test_get_system_health_down(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.execute.side_effect = Exception("DB connection lost")
    
    with patch("app.routers.admin.system._redis") as mock_redis:
        mock_redis.ping.return_value = True
        with TestClient(app) as c:
            resp = c.get("/api/v1/admin/system/health")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["overall"] == "down"
