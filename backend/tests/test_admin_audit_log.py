"""Tests for Sprint 5 Phase 10 – Admin Audit-Log.

Coverage:
  - GET /admin/audit-log requires admin (403 for regular user)
  - GET /admin/audit-log returns paginated list with correct shape
  - GET /admin/audit-log filters by entity_type
  - GET /admin/audit-log filters by action
  - GET /admin/audit-log returns empty list when no entries exist
  - GET /admin/audit-log pagination: total_pages calculation
  - GET /admin/audit-log/{id} returns single audit log entry
  - GET /admin/audit-log/{id} returns 404 for unknown ID
  - admin_name resolved to "System" when admin_id is None
"""
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app

_ADMIN_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_LOG_UUID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
_LOG2_UUID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
_ENTITY_UUID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
_DT = datetime(2026, 5, 10, 12, 0, 0, tzinfo=timezone.utc)


def _admin():
    u = MagicMock()
    u.id = _ADMIN_UUID
    u.email = "admin@stud.hs-hannover.de"
    u.full_name = "Admin Tester"
    u.is_active = True
    u.is_admin = True
    u.last_login_at = None
    u.created_at = _DT
    return u


def _regular():
    u = MagicMock()
    u.id = uuid.uuid4()
    u.email = "student@stud.hs-hannover.de"
    u.full_name = "Regular Student"
    u.is_active = True
    u.is_admin = False
    u.last_login_at = None
    u.created_at = _DT
    return u


def _make_log(
    log_id=_LOG_UUID,
    action="CREATE",
    entity_type="Module",
    admin_id=None,
    entity_label="Programmierung I",
):
    log = MagicMock()
    log.id = log_id
    log.admin_id = admin_id
    log.action = action
    log.entity_type = entity_type
    log.entity_id = _ENTITY_UUID
    log.entity_label = entity_label
    log.old_value = None
    log.new_value = {"name": entity_label}
    log.reason = None
    log.ip_address = "127.0.0.1"
    log.created_at = _DT
    return log


def _query_chain(items: list, total: int) -> MagicMock:
    """Build a MagicMock DB query chain for the audit log list endpoint."""
    q = MagicMock()
    q.filter.return_value = q
    q.count.return_value = total
    q.order_by.return_value.offset.return_value.limit.return_value.all.return_value = items
    return q


# ── Access Control ─────────────────────────────────────────────────────────────

def test_non_admin_cannot_list_audit_logs(mock_db):
    regular = _regular()
    app.dependency_overrides[get_current_user] = lambda: regular
    app.dependency_overrides[get_db] = lambda: mock_db

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log")

    app.dependency_overrides.clear()
    assert resp.status_code == 403


def test_non_admin_cannot_get_audit_log_entry(mock_db):
    regular = _regular()
    app.dependency_overrides[get_current_user] = lambda: regular
    app.dependency_overrides[get_db] = lambda: mock_db

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{_LOG_UUID}")

    app.dependency_overrides.clear()
    assert resp.status_code == 403


# ── List Endpoint ──────────────────────────────────────────────────────────────

def test_list_audit_logs_returns_200(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    log = _make_log()
    mock_db.query.return_value = _query_chain([log], total=1)

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["page_size"] == 25
    assert data["total_pages"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["action"] == "CREATE"
    assert data["items"][0]["entity_type"] == "Module"
    assert data["items"][0]["entity_label"] == "Programmierung I"
    assert data["items"][0]["admin_name"] == "System"


def test_list_audit_logs_empty_returns_total_zero(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value = _query_chain([], total=0)

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["total_pages"] == 1  # ceil(0/25) → 1 fallback


def test_list_audit_logs_pagination_total_pages(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    # 26 entries with page_size=25 → 2 pages
    mock_db.query.return_value = _query_chain([], total=26)

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log?page=2&page_size=25")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["total_pages"] == 2
    assert resp.json()["page"] == 2


def test_list_audit_logs_filter_by_entity_type(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    log = _make_log(entity_type="University")
    q = _query_chain([log], total=1)
    mock_db.query.return_value = q

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log?entity_type=University")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    # filter was applied — confirm the chain used filter()
    q.filter.assert_called()


def test_list_audit_logs_filter_by_action(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    log = _make_log(action="DELETE")
    q = _query_chain([log], total=1)
    mock_db.query.return_value = q

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log?action=DELETE")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["items"][0]["action"] == "DELETE"


def test_list_audit_logs_multiple_items(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    logs = [
        _make_log(log_id=_LOG_UUID, action="CREATE", entity_type="Module"),
        _make_log(log_id=_LOG2_UUID, action="UPDATE", entity_type="Program"),
    ]
    mock_db.query.return_value = _query_chain(logs, total=2)

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/audit-log")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


# ── Single Entry ───────────────────────────────────────────────────────────────

def test_get_audit_log_entry_returns_200(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    log = _make_log(action="ARCHIVE", entity_type="ExamRegulation")
    mock_db.query.return_value.filter.return_value.first.return_value = log
    # second query for admin_name (admin_id=None → skipped)
    mock_db.query.return_value.filter.return_value.scalar.return_value = None

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{_LOG_UUID}")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "ARCHIVE"
    assert data["entity_type"] == "ExamRegulation"
    assert data["admin_name"] == "System"


def test_get_audit_log_entry_not_found(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value.first.return_value = None

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{uuid.uuid4()}")

    app.dependency_overrides.clear()
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_get_audit_log_entry_with_admin_id_resolves_name(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    log = _make_log(admin_id=_ADMIN_UUID)
    mock_db.query.return_value.filter.return_value.first.return_value = log
    # scalar() for User.full_name lookup
    mock_db.query.return_value.filter.return_value.scalar.return_value = "Admin Tester"

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/audit-log/{_LOG_UUID}")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["admin_name"] == "Admin Tester"
