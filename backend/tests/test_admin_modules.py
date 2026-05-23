"""Tests for Sprint 5 Phase 4 – Admin Modulkatalog & Prerequisites.

Coverage should be 100% for:
  - modules.py
  - prerequisites.py
"""
import uuid
from datetime import datetime, timezone, date
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import get_current_user
from app.database import get_db
from app.main import app
from app.models.module import ModulTyp
from app.models.module_prerequisite import PrerequisiteType

_ADMIN_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_ER_UUID = uuid.UUID("44444444-4444-4444-4444-444444444444")
_MOD_UUID = uuid.UUID("55555555-5555-5555-5555-555555555555")
_REQ_MOD_UUID = uuid.UUID("66666666-6666-6666-6666-666666666666")
_PREREQ_UUID = uuid.UUID("77777777-7777-7777-7777-777777777777")
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


def _make_er():
    er = MagicMock()
    er.id = _ER_UUID
    return er


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
    mod.pruefungsart = "Klausur"
    mod.sws = 4
    mod.is_archived = is_archived
    mod.archived_at = _DT if is_archived else None
    mod.archive_reason = "Test" if is_archived else None
    mod.created_at = _DT
    mod.updated_at = _DT
    return mod


def _make_prereq():
    pr = MagicMock()
    pr.id = _PREREQ_UUID
    pr.module_id = _MOD_UUID
    pr.prerequisite_type = PrerequisiteType.MODULE
    pr.required_module_id = _REQ_MOD_UUID
    pr.minimum_ects = None
    pr.required_semesters = "Grundstudium"
    pr.description = "Prog I benötigt"
    pr.created_at = _DT
    pr.updated_at = _DT
    return pr


def _mock_refresh(obj):
    obj.id = uuid.uuid4()
    obj.created_at = _DT
    obj.updated_at = _DT
    if not hasattr(obj, "is_archived") or obj.is_archived is None:
        obj.is_archived = False


# ── Modules: JSON Import ──────────────────────────────────────────────────────

def test_import_json_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    mock_db.get.return_value = _make_er()
    # Mock existing_kuerzel query
    mock_db.query.return_value.filter.return_value.all.return_value = [("BIN-100",)]
    
    with patch("app.core.audit.AuditLogger.log", return_value=MagicMock(id=uuid.uuid4())) as mock_log:
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/modules/import/json", json={
                "exam_regulation_id": str(_ER_UUID),
                "modules": [
                    {"name": "Prog I", "kuerzel": "BIN-100", "ects": 5, "modul_typ": "PFLICHT"}, # Should be skipped
                    {"name": "Prog II", "kuerzel": "BIN-200", "ects": 5, "modul_typ": "PFLICHT"}  # Should be created
                ]
            })
    
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["skipped"] == 1
    assert data["created"] == 1
    assert data["errors"] == []
    mock_log.assert_called_once()


def test_import_json_404_er(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/modules/import/json", json={
            "exam_regulation_id": str(_ER_UUID),
            "modules": []
        })
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_import_json_422_limit(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_er()
    
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/modules/import/json", json={
            "exam_regulation_id": str(_ER_UUID),
            "modules": [{"name": str(i), "kuerzel": str(i), "ects": 5, "modul_typ": "PFLICHT"} for i in range(501)]
        })
    app.dependency_overrides.clear()
    assert resp.status_code == 422


def test_import_json_exception_handling(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_er()
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    def mock_add(obj):
        if obj.name == "Error":
            raise ValueError("Test error")
    mock_db.add.side_effect = mock_add

    with patch("app.core.audit.AuditLogger.log", return_value=MagicMock(id=uuid.uuid4())):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/modules/import/json", json={
                "exam_regulation_id": str(_ER_UUID),
                "modules": [
                    {"name": "Error", "kuerzel": "E-1", "ects": 5, "modul_typ": "PFLICHT"},
                    {"name": "Good", "kuerzel": "G-1", "ects": 5, "modul_typ": "PFLICHT"}
                ]
            })
            
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    data = resp.json()
    assert data["created"] == 1
    assert data["skipped"] == 0
    assert len(data["errors"]) == 1
    assert "Test error" in data["errors"][0]


def test_import_pdf_501():
    app.dependency_overrides[get_current_user] = _admin
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/modules/import/pdf")
    app.dependency_overrides.clear()
    assert resp.status_code == 501


# ── Modules: CRUD ─────────────────────────────────────────────────────────────

def test_list_modules(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_query(model):
        q = MagicMock()
        q.filter.return_value.filter.return_value.order_by.return_value.all.return_value = [_make_module()]
        q.order_by.return_value.all.return_value = [_make_module()]
        q.filter.return_value.order_by.return_value.all.return_value = [_make_module()]
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp1 = c.get("/api/v1/admin/modules")
        resp2 = c.get(f"/api/v1/admin/modules?exam_regulation_id={_ER_UUID}")
        resp3 = c.get("/api/v1/admin/modules?include_archived=true")
    
    app.dependency_overrides.clear()
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp3.status_code == 200


def test_create_module_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_er()
    mock_db.refresh.side_effect = _mock_refresh
    
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/modules", json={
                "exam_regulation_id": str(_ER_UUID),
                "name": "M", "kuerzel": "M1", "ects": 5, "modul_typ": "PFLICHT"
            })
            
    app.dependency_overrides.clear()
    assert resp.status_code == 201


def test_create_module_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/modules", json={
            "exam_regulation_id": str(_ER_UUID),
            "name": "M", "kuerzel": "M1", "ects": 5, "modul_typ": "PFLICHT"
        })
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_get_module_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_module()
    
    def mock_query(model):
        q = MagicMock()
        if model.__name__ == "StudentModule":
            q.filter.return_value.count.return_value = 10
        elif model.__name__ == "ModulePrerequisite":
            q.filter.return_value.all.return_value = [_make_prereq()]
        return q
    mock_db.query.side_effect = mock_query

    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/modules/{_MOD_UUID}")
        
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert resp.json()["student_count"] == 10
    assert len(resp.json()["prerequisites"]) == 1


def test_get_module_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/modules/{_MOD_UUID}")
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_patch_module_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mod = _make_module()
    mock_db.get.return_value = mod
    
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.patch(f"/api/v1/admin/modules/{_MOD_UUID}", json={"name": "M2"})
            
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert mod.name == "M2"


def test_patch_module_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/modules/{_MOD_UUID}", json={"name": "M2"})
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_archive_module_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mod = _make_module(False)
    mock_db.get.return_value = mod
    
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(f"/api/v1/admin/modules/{_MOD_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "R"})
                
    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert mod.is_archived is True


def test_archive_module_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/modules/{_MOD_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "R"})
            
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_archive_module_400(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mod = _make_module(True)
    mock_db.get.return_value = mod
    
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/modules/{_MOD_UUID}/archive", headers={"X-Admin-Token": "t"}, json={"reason": "R"})
            
    app.dependency_overrides.clear()
    assert resp.status_code == 400


def test_restore_module_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mod = _make_module(True)
    mock_db.get.return_value = mod
    
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with patch("app.core.audit.AuditLogger.log"):
            with TestClient(app) as c:
                resp = c.post(f"/api/v1/admin/modules/{_MOD_UUID}/restore", headers={"X-Admin-Token": "t"})
                
    app.dependency_overrides.clear()
    assert resp.status_code == 204
    assert mod.is_archived is False


def test_restore_module_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/modules/{_MOD_UUID}/restore", headers={"X-Admin-Token": "t"})
            
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_restore_module_400(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mod = _make_module(False)
    mock_db.get.return_value = mod
    
    with patch("app.core.admin_auth._redis") as mock_redis:
        mock_redis.exists.return_value = 1
        with TestClient(app) as c:
            resp = c.post(f"/api/v1/admin/modules/{_MOD_UUID}/restore", headers={"X-Admin-Token": "t"})
            
    app.dependency_overrides.clear()
    assert resp.status_code == 400


# ── Prerequisites: CRUD ───────────────────────────────────────────────────────

def test_list_prereqs_by_module(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_module()
    mock_db.query.return_value.filter.return_value.all.return_value = [_make_prereq()]
    
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/prerequisites/by-module/{_MOD_UUID}")
        
    app.dependency_overrides.clear()
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_list_prereqs_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with TestClient(app) as c:
        resp = c.get(f"/api/v1/admin/prerequisites/by-module/{_MOD_UUID}")
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_create_prereq_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_module()
    mock_db.refresh.side_effect = _mock_refresh
    
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.post("/api/v1/admin/prerequisites", json={
                "module_id": str(_MOD_UUID),
                "prerequisite_type": "MODULE",
                "required_module_id": str(_REQ_MOD_UUID),
                "description": "Benötigt Prog I"
            })
            
    app.dependency_overrides.clear()
    assert resp.status_code == 201


def test_create_prereq_404_module(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_get(model, id):
        return None
    mock_db.get.side_effect = mock_get
    
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/prerequisites", json={
            "module_id": str(_MOD_UUID), "prerequisite_type": "MODULE", "description": "X"
        })
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_create_prereq_404_req_module(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_get(model, id):
        if id == _MOD_UUID:
            return _make_module()
        return None
    mock_db.get.side_effect = mock_get
    
    with TestClient(app) as c:
        resp = c.post("/api/v1/admin/prerequisites", json={
            "module_id": str(_MOD_UUID),
            "prerequisite_type": "MODULE",
            "required_module_id": str(_REQ_MOD_UUID),
            "description": "X"
        })
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_patch_prereq_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_get(model, id):
        if model.__name__ == "ModulePrerequisite":
            return _make_prereq()
        return _make_module()
    mock_db.get.side_effect = mock_get
    
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.patch(f"/api/v1/admin/prerequisites/{_PREREQ_UUID}", json={"description": "Neu"})
            
    app.dependency_overrides.clear()
    assert resp.status_code == 200


def test_patch_prereq_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/prerequisites/{_PREREQ_UUID}", json={"description": "Neu"})
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_patch_prereq_404_req_module(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    
    def mock_get(model, id):
        if model.__name__ == "ModulePrerequisite":
            return _make_prereq()
        return None
    mock_db.get.side_effect = mock_get
    
    with TestClient(app) as c:
        resp = c.patch(f"/api/v1/admin/prerequisites/{_PREREQ_UUID}", json={"required_module_id": str(_REQ_MOD_UUID)})
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404


def test_delete_prereq_success(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = _make_prereq()
    
    with patch("app.core.audit.AuditLogger.log"):
        with TestClient(app) as c:
            resp = c.delete(f"/api/v1/admin/prerequisites/{_PREREQ_UUID}")
            
    app.dependency_overrides.clear()
    assert resp.status_code == 204


def test_delete_prereq_404(mock_db):
    app.dependency_overrides[get_current_user] = _admin
    app.dependency_overrides[get_db] = lambda: mock_db
    mock_db.get.return_value = None
    
    with TestClient(app) as c:
        resp = c.delete(f"/api/v1/admin/prerequisites/{_PREREQ_UUID}")
        
    app.dependency_overrides.clear()
    assert resp.status_code == 404
