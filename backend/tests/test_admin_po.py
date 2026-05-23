"""Tests for Sprint 5 Phase 3 – Admin PO-Verwaltung.

Coverage should be 100% for:
  - universities.py
  - faculties.py
  - programs.py
  - exam_regulations.py
"""
import uuid
from datetime import datetime, timezone, date
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app

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
    uni.created_at = _DT
    uni.updated_at = _DT
    return uni

def _make_fac():
    fac = MagicMock()
    fac.id = _FAC_UUID
    fac.university_id = _UNI_UUID
    fac.name = "Fakultät IV"
    fac.kuerzel = "F4"
    fac.created_at = _DT
    fac.updated_at = _DT
    return fac

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
    prog.created_at = _DT
    prog.updated_at = _DT
    return prog

def _make_er(is_archived=False):
    er = MagicMock()
    er.id = _ER_UUID
    er.program_id = _PROG_UUID
    er.version = "2026"
    er.ist_aktuell = True
    er.gueltig_ab = date(2026, 9, 1)
    er.gueltig_bis = None
    er.is_archived = is_archived
    er.archived_at = _DT if is_archived else None
    er.archive_reason = "Test" if is_archived else None
    er.created_at = _DT
    er.updated_at = _DT
    return er

def _mock_refresh(obj):
    obj.id = uuid.uuid4()
    obj.created_at = _DT
    obj.updated_at = _DT
    if not hasattr(obj, "is_archived") or obj.is_archived is None:
        obj.is_archived = False
    if hasattr(obj, "gueltig_ab"):
        obj.gueltig_ab = date(2026, 9, 1)

# ── Universities ───────────────────────────────────────────────────────────────

def test_list_universities(mock_db):
    admin = _admin()
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.query.return_value.order_by.return_value.all.return_value = [_make_uni()]

    with TestClient(app) as c:
        resp = c.get("/api/v1/admin/universities")
    app.dependency_overrides.clear()
    assert resp.status_code == 200

def test_create_university(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.refresh.side_effect = _mock_refresh

    with patch("app.core.audit.AuditLogger.log") as mock_log:
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/universities", json={"name": "HSH", "kuerzel": "HsH", "stadt": "H", "bundesland": "N", "typ": "FH"})
    app.dependency_overrides.clear()
    assert resp.status_code == 201
    mock_log.assert_called_once()

def test_get_university_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_uni()
    mock_db.query.return_value.filter.return_value.all.return_value = [_make_fac()]

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/universities/{_UNI_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["name"] == "Hochschule Hannover"
    assert len(resp.json()["faculties"]) == 1

def test_get_university_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/universities/{uuid.uuid4()}")
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_patch_university_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    uni = _make_uni()
    mock_db.get.return_value = uni

    with patch("app.core.audit.AuditLogger.log") as mock_log:
        with TestClient(app) as c:
            resp = c.patch(f"/api/v1/admin/universities/{_UNI_UUID}", json={"name": "Neu"})
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert uni.name == "Neu"
    mock_log.assert_called_once()

def test_patch_university_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/universities/{uuid.uuid4()}", json={"name": "Neu"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_delete_university_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_uni()
    mock_db.query.return_value.filter.return_value.count.return_value = 0
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/universities/{_UNI_UUID}", headers={"X-Admin-Token": "test"})
    app.dependency_overrides.clear()
    assert resp.status_code == 204

def test_delete_university_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/universities/{uuid.uuid4()}", headers={"X-Admin-Token": "test"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_delete_university_409(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_uni()
    mock_db.query.return_value.filter.return_value.count.return_value = 1
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/universities/{_UNI_UUID}", headers={"X-Admin-Token": "test"})
    app.dependency_overrides.clear()
    assert resp.status_code == 409


# ── Faculties ─────────────────────────────────────────────────────────────────

def test_list_faculties(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.query.return_value.order_by.return_value.all.return_value = [_make_fac()]
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [_make_fac()]

    with TestClient(app) as c:
        resp1 = c.get("/api/v1/admin/faculties")
        resp2 = c.get(f"/api/v1/admin/faculties?university_id={_UNI_UUID}")
    app.dependency_overrides.clear()
    assert resp1.status_code == 200
    assert resp2.status_code == 200

def test_create_faculty_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_uni()
    mock_db.refresh.side_effect = _mock_refresh
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/faculties", json={"university_id": str(_UNI_UUID), "name": "F4", "kuerzel": "F4"})
    app.dependency_overrides.clear()
    assert resp.status_code == 201

def test_create_faculty_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/faculties", json={"university_id": str(_UNI_UUID), "name": "F4", "kuerzel": "F4"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_patch_faculty_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    fac = _make_fac()
    mock_db.get.return_value = fac
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.patch(f"/api/v1/admin/faculties/{_FAC_UUID}", json={"name": "F5"})
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert fac.name == "F5"

def test_patch_faculty_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/faculties/{_FAC_UUID}", json={"name": "F5"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_delete_faculty_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_fac()
    mock_db.query.return_value.filter.return_value.count.return_value = 0
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/faculties/{_FAC_UUID}", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 204

def test_delete_faculty_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/faculties/{uuid.uuid4()}", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_delete_faculty_409(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_fac()
    mock_db.query.return_value.filter.return_value.count.return_value = 1
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/faculties/{_FAC_UUID}", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 409


# ── Programs ──────────────────────────────────────────────────────────────────

def test_list_programs(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_query(model):
        q = MagicMock()
        q.filter.return_value.filter.return_value.order_by.return_value.all.return_value = [_make_program()]
        q.order_by.return_value.all.return_value = [_make_program()]
        q.filter.return_value.order_by.return_value.all.return_value = [_make_program()]
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp1 = c.get("/api/v1/admin/programs")
        resp2 = c.get(f"/api/v1/admin/programs?faculty_id={_FAC_UUID}")
        resp3 = c.get("/api/v1/admin/programs?include_archived=true")
    app.dependency_overrides.clear()
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp3.status_code == 200

def test_create_program_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_fac()
    mock_db.refresh.side_effect = _mock_refresh
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/programs", json={
                "faculty_id": str(_FAC_UUID), "name": "P", "abschluss": "B", "regelstudienzeit": 7, "gesamt_ects": 210
            })
    app.dependency_overrides.clear()
    assert resp.status_code == 201

def test_create_program_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/programs", json={
            "faculty_id": str(_FAC_UUID), "name": "P", "abschluss": "B", "regelstudienzeit": 7, "gesamt_ects": 210
        })
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_get_program_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_program()
    
    er_mock = _make_er()
    
    def mock_query(model):
        q = MagicMock()
        if model.__name__ == "ExamRegulation":
            q.filter.return_value.all.return_value = [er_mock]
        elif model.__name__ == "UserProgram":
            q.filter.return_value.count.return_value = 5
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/programs/{_PROG_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["student_count"] == 5

def test_get_program_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/programs/{uuid.uuid4()}")
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_patch_program_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    prog = _make_program()
    mock_db.get.return_value = prog
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.patch(f"/api/v1/admin/programs/{_PROG_UUID}", json={"name": "P2"})
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert prog.name == "P2"

def test_patch_program_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/programs/{uuid.uuid4()}", json={"name": "P2"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_archive_program_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    prog = _make_program(False)
    mock_db.get.return_value = prog
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(f"/api/v1/admin/programs/{_PROG_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "r"})
    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert prog.is_archived is True

def test_archive_program_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/programs/{uuid.uuid4()}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "r"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_archive_program_400(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    prog = _make_program(True)
    mock_db.get.return_value = prog
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/programs/{_PROG_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "r"})
    app.dependency_overrides.clear()
    assert resp.status_code == 400

def test_restore_program_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    prog = _make_program(True)
    mock_db.get.return_value = prog
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(f"/api/v1/admin/programs/{_PROG_UUID}/restore", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert prog.is_archived is False

def test_restore_program_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/programs/{uuid.uuid4()}/restore", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_restore_program_400(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    prog = _make_program(False)
    mock_db.get.return_value = prog
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/programs/{_PROG_UUID}/restore", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 400


# ── Exam Regulations ──────────────────────────────────────────────────────────

def test_list_exam_regulations(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_query(model):
        q = MagicMock()
        q.filter.return_value.filter.return_value.order_by.return_value.all.return_value = [_make_er()]
        q.order_by.return_value.all.return_value = [_make_er()]
        q.filter.return_value.order_by.return_value.all.return_value = [_make_er()]
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp1 = c.get("/api/v1/admin/exam-regulations")
        resp2 = c.get(f"/api/v1/admin/exam-regulations?program_id={_PROG_UUID}")
        resp3 = c.get("/api/v1/admin/exam-regulations?include_archived=true")
    app.dependency_overrides.clear()
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp3.status_code == 200

def test_create_er_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_program()
    mock_db.refresh.side_effect = _mock_refresh
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/exam-regulations", json={
                "program_id": str(_PROG_UUID), "version": "2026", "ist_aktuell": True
            })
    app.dependency_overrides.clear()
    assert resp.status_code == 201

def test_create_er_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/exam-regulations", json={
            "program_id": str(_PROG_UUID), "version": "2026", "ist_aktuell": True
        })
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_get_er_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_er()
    mock_db.query.return_value.filter.return_value.count.return_value = 5

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/exam-regulations/{_ER_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["module_count"] == 5

def test_get_er_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/exam-regulations/{uuid.uuid4()}")
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_patch_er_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    er = _make_er()
    mock_db.get.return_value = er
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.patch(f"/api/v1/admin/exam-regulations/{_ER_UUID}", json={"version": "2027"})
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert er.version == "2027"

def test_patch_er_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/exam-regulations/{uuid.uuid4()}", json={"version": "2027"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_archive_er_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    er = _make_er(False)
    mock_db.get.return_value = er
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(f"/api/v1/admin/exam-regulations/{_ER_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "r"})
    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert er.is_archived is True

def test_archive_er_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/exam-regulations/{uuid.uuid4()}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "r"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_archive_er_400(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    er = _make_er(True)
    mock_db.get.return_value = er
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/exam-regulations/{_ER_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "r"})
    app.dependency_overrides.clear()
    assert resp.status_code == 400

def test_restore_er_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    er = _make_er(True)
    mock_db.get.return_value = er
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(f"/api/v1/admin/exam-regulations/{_ER_UUID}/restore", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert er.is_archived is False

def test_restore_er_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/exam-regulations/{uuid.uuid4()}/restore", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404

def test_restore_er_400(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    er = _make_er(False)
    mock_db.get.return_value = er
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/exam-regulations/{_ER_UUID}/restore", headers={"X-Admin-Token": "t"})
    app.dependency_overrides.clear()
    assert resp.status_code == 400

def test_get_program_student_count_empty(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_program()
    
    def mock_query(model):
        q = MagicMock()
        if model.__name__ == "ExamRegulation":
            q.filter.return_value.all.return_value = [] # no ERs
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/programs/{_PROG_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["student_count"] == 0
