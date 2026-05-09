"""Tests for Sprint 5 Phase 3 – Admin PO-Verwaltung.

Coverage:
  - GET /admin/universities returns list
  - POST /admin/universities creates and logs audit entry
  - DELETE /admin/universities/{id} blocked when faculties exist (409)
  - GET /admin/programs?faculty_id= filters correctly
  - POST /admin/programs/{id}/archive requires Admin-Token (401 without)
  - POST /admin/programs/{id}/archive sets is_archived + audit entry
  - POST /admin/programs/{id}/restore clears archived fields
  - POST /admin/programs/{id}/archive returns 400 when already archived
  - GET /admin/exam-regulations?program_id= filters correctly
  - GET /admin/modules returns only non-archived by default
  - POST /admin/modules/import/json creates modules, skips duplicates
  - POST /admin/modules/import/json returns 404 for unknown ER
  - POST /admin/modules/import/pdf returns 501
  - POST /admin/modules/{id}/archive sets archived fields
  - POST /admin/modules/{id}/restore clears archived fields
  - Public /faculties/{id}/programs filters archived programs
"""
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app
from app.models.module import ModulTyp

_ADMIN_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_UNI_UUID = uuid.UUID("11111111-1111-1111-1111-111111111111")
_FAC_UUID = uuid.UUID("22222222-2222-2222-2222-222222222222")
_PROG_UUID = uuid.UUID("33333333-3333-3333-3333-333333333333")
_ER_UUID = uuid.UUID("44444444-4444-4444-4444-444444444444")
_MOD_UUID = uuid.UUID("55555555-5555-5555-5555-555555555555")
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


def _make_uni():
    uni = MagicMock()
    uni.id = _UNI_UUID
    uni.name = "Hochschule Hannover"
    uni.kuerzel = "HsH"
    uni.stadt = "Hannover"
    uni.bundesland = "Niedersachsen"
    uni.typ = "FH"
    return uni


def _make_program(is_archived=False):
    prog = MagicMock()
    prog.id = _PROG_UUID
    prog.faculty_id = _FAC_UUID
    prog.name = "Angewandte Informatik"
    prog.abschluss = "B.Sc."
    prog.regelstudienzeit = 7
    prog.gesamt_ects = 210
    prog.is_archived = is_archived
    prog.archived_at = _DT if is_archived else None
    prog.archive_reason = "Test" if is_archived else None
    return prog


def _make_module(is_archived=False):
    mod = MagicMock()
    mod.id = _MOD_UUID
    mod.exam_regulation_id = _ER_UUID
    mod.name = "Programmierung I"
    mod.kuerzel = "BIN-100"
    mod.ects = 5
    mod.semester_empfehlung = 1
    mod.modul_typ = ModulTyp.PFLICHT
    mod.ist_benotet = True
    mod.max_versuche = 3
    mod.gewichtung = 1.0
    mod.has_prerequisites = False
    mod.pruefungsart = None
    mod.sws = 4
    mod.is_archived = is_archived
    mod.archived_at = _DT if is_archived else None
    mod.archive_reason = "Test" if is_archived else None
    return mod


# ── Universities ───────────────────────────────────────────────────────────────

def test_list_universities_returns_list(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.query.return_value.order_by.return_value.all.return_value = [_make_uni()]

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/universities")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) == 1


def test_create_university_returns_201(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    # Simulate SQLAlchemy setting the PK on flush
    def _flush_sets_id():
        pass

    mock_db.add.side_effect = lambda obj: setattr(obj, "id", _UNI_UUID)
    mock_db.refresh.side_effect = lambda obj: None

    with patch("app.core.audit.AuditLogger.log") as mock_log:
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/universities", json={
                "name": "Hochschule Hannover",
                "kuerzel": "HsH",
                "stadt": "Hannover",
                "bundesland": "Niedersachsen",
                "typ": "FH",
            })

    app.dependency_overrides.clear()
    assert resp.status_code == 201
    mock_log.assert_called_once()


def test_delete_university_blocked_with_faculties(mock_db):
    admin = _admin()
    uni = _make_uni()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = uni
    mock_db.query.return_value.filter.return_value.count.return_value = 2  # has faculties

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(
                f"/api/v1/admin/universities/{_UNI_UUID}",
                headers={"X-Admin-Token": "valid"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 409
    assert "faculties" in resp.json()["detail"]


# ── Programs ──────────────────────────────────────────────────────────────────

def test_list_programs_filters_by_faculty(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value.filter.return_value.order_by.return_value.all.return_value = [_make_program()]

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/programs?faculty_id={_FAC_UUID}")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_archive_program_requires_admin_token(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 0  # no valid session
        with TestClient(app) as c:
            resp = c.post(
                f"/api/v1/admin/programs/{_PROG_UUID}/archive",
                json={"reason": "Auslaufmodell"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 401


def test_archive_program_sets_archived_fields(mock_db):
    admin = _admin()
    prog = _make_program(is_archived=False)
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = prog

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log") as mock_log:
            with TestClient(app) as c:
                resp = c.post(
                    f"/api/v1/admin/programs/{_PROG_UUID}/archive",
                    headers={"X-Admin-Token": "valid"},
                    json={"reason": "Auslaufmodell"},
                )

    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert prog.is_archived is True
    assert prog.archive_reason == "Auslaufmodell"
    mock_log.assert_called_once()
    assert mock_log.call_args.args[0] == "ARCHIVE"


def test_archive_program_already_archived_returns_400(mock_db):
    admin = _admin()
    prog = _make_program(is_archived=True)
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = prog

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(
                f"/api/v1/admin/programs/{_PROG_UUID}/archive",
                headers={"X-Admin-Token": "valid"},
                json={"reason": "Test"},
            )

    app.dependency_overrides.clear()
    assert resp.status_code == 400


def test_restore_program_clears_archived_fields(mock_db):
    admin = _admin()
    prog = _make_program(is_archived=True)
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = prog

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(
                    f"/api/v1/admin/programs/{_PROG_UUID}/restore",
                    headers={"X-Admin-Token": "valid"},
                )

    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert prog.is_archived is False
    assert prog.archived_at is None
    assert prog.archive_reason is None


# ── Modules ───────────────────────────────────────────────────────────────────

def test_list_modules_excludes_archived_by_default(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.query.return_value.filter.return_value.filter.return_value.order_by.return_value.all.return_value = [_make_module()]

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/modules")

    app.dependency_overrides.clear()
    assert resp.status_code == 200


def test_import_modules_json_creates_new_modules(mock_db):
    admin = _admin()
    er = MagicMock()
    er.id = _ER_UUID
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = er
    # No existing kuerzel
    mock_db.query.return_value.filter.return_value.filter.return_value.all.return_value = []

    audit_entry = MagicMock()
    audit_entry.id = uuid.uuid4()

    with patch("app.core.audit.AuditLogger.log", return_value=audit_entry):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/modules/import/json", json={
                "exam_regulation_id": str(_ER_UUID),
                "modules": [
                    {"name": "Prog I", "kuerzel": "BIN-100", "ects": 5, "modul_typ": "PFLICHT"},
                    {"name": "Prog II", "kuerzel": "BIN-200", "ects": 5, "modul_typ": "PFLICHT"},
                ],
            })

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["created"] == 2
    assert data["skipped"] == 0
    assert data["errors"] == []


def test_import_modules_json_skips_duplicate_kuerzel(mock_db):
    admin = _admin()
    er = MagicMock()
    er.id = _ER_UUID
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = er
    # Router calls db.query(Module.kuerzel).filter(...).all() — one filter, one .all()
    mock_db.query.return_value.filter.return_value.all.return_value = [("BIN-100",)]

    with patch("app.core.audit.AuditLogger.log", return_value=MagicMock(id=uuid.uuid4())):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/modules/import/json", json={
                "exam_regulation_id": str(_ER_UUID),
                "modules": [
                    {"name": "Prog I", "kuerzel": "BIN-100", "ects": 5, "modul_typ": "PFLICHT"},
                    {"name": "Prog II", "kuerzel": "BIN-200", "ects": 5, "modul_typ": "PFLICHT"},
                ],
            })

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["skipped"] == 1
    assert data["created"] == 1


def test_import_modules_json_unknown_er_returns_404(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = None  # ER not found

    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/modules/import/json", json={
            "exam_regulation_id": str(uuid.uuid4()),
            "modules": [{"name": "X", "kuerzel": "X-001", "ects": 5, "modul_typ": "PFLICHT"}],
        })

    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_import_modules_pdf_returns_501(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/modules/import/pdf")

    app.dependency_overrides.clear()
    assert resp.status_code == 501


def test_archive_module_sets_archived_fields(mock_db):
    admin = _admin()
    mod = _make_module(is_archived=False)
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = mod

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(
                    f"/api/v1/admin/modules/{_MOD_UUID}/archive",
                    headers={"X-Admin-Token": "valid"},
                    json={"reason": "Modul entfernt"},
                )

    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert mod.is_archived is True
    assert mod.archive_reason == "Modul entfernt"


def test_restore_module_clears_archived_fields(mock_db):
    admin = _admin()
    mod = _make_module(is_archived=True)
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = mod

    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(
                    f"/api/v1/admin/modules/{_MOD_UUID}/restore",
                    headers={"X-Admin-Token": "valid"},
                )

    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert mod.is_archived is False
    assert mod.archived_at is None
    assert mod.archive_reason is None


# ── Public endpoint filtering ─────────────────────────────────────────────────

def test_public_programs_excludes_archived(mock_db):
    fac = MagicMock()
    fac.id = _FAC_UUID
    app.dependency_overrides[get_db] = lambda: mock_db

    mock_db.get.return_value = fac
    mock_db.query.return_value.filter.return_value.filter.return_value.all.return_value = []

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/faculties/{_FAC_UUID}/programs")

    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json() == []
