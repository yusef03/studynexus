import uuid
from unittest.mock import MagicMock

from app.models.module import ModulTyp
from app.models.student_module import StudiengangStatus


_USER_ID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")


def _make_module(benotet=True, max_versuche=3, typ=ModulTyp.PFLICHT):
    m = MagicMock()
    m.id = uuid.uuid4()
    m.exam_regulation_id = uuid.uuid4()
    m.name = "Testmodul"
    m.kuerzel = None
    m.ects = 6
    m.semester_empfehlung = 1
    m.modul_typ = typ
    m.ist_benotet = benotet
    m.max_versuche = max_versuche
    m.gewichtung = 1.0
    return m


def _make_sm(status=StudiengangStatus.PLANNED, versuch=1, module_id=None, note=None):
    sm = MagicMock()
    sm.id = uuid.uuid4()
    sm.user_id = _USER_ID
    sm.module_id = module_id or uuid.uuid4()
    sm.custom_name = None
    sm.custom_ects = None
    sm.status = status
    sm.note = note
    sm.versuch_nummer = versuch
    sm.anmelde_datum = None
    sm.pruefungs_datum = None
    sm.semester = None
    return sm


def _setup_sm(mock_db, sm, module=None):
    # Router uses db.query(X).filter(cond1, cond2).first() — one filter call
    mock_db.query.return_value.filter.return_value.first.return_value = sm
    mock_db.get.return_value = module


# ── Status transitions ────────────────────────────────────────────────────────

def test_update_status_to_passed_with_valid_note(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "PASSED", "note": 2.3})
    assert response.status_code == 200


def test_update_status_to_failed_increments_versuch(authed_client, mock_db):
    module = _make_module(max_versuche=3)
    sm = _make_sm(status=StudiengangStatus.REGISTERED, versuch=1, module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "FAILED"})
    assert response.status_code == 200
    assert sm.versuch_nummer == 2


def test_update_to_failed_at_max_versuche_rejected(authed_client, mock_db):
    module = _make_module(max_versuche=3)
    sm = _make_sm(status=StudiengangStatus.REGISTERED, versuch=3, module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "FAILED"})
    assert response.status_code == 409


# ── Note validation ───────────────────────────────────────────────────────────

def test_note_too_low_rejected(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"note": 0.5})
    assert response.status_code == 422


def test_note_too_high_rejected(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"note": 5.5})
    assert response.status_code == 422


def test_passed_with_note_above_4_rejected(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "PASSED", "note": 4.3})
    assert response.status_code == 422


def test_passed_with_note_5_returns_specific_error(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "PASSED", "note": 5.0})
    assert response.status_code == 422
    assert "FAILED" in response.json()["detail"]


def test_note_on_ungraded_module_rejected(authed_client, mock_db):
    module = _make_module(benotet=False)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"note": 2.0})
    assert response.status_code == 422


def test_note_boundary_1_0_accepted(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "PASSED", "note": 1.0})
    assert response.status_code == 200


def test_note_boundary_4_0_accepted_as_passed(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"status": "PASSED", "note": 4.0})
    assert response.status_code == 200


def test_module_not_found_returns_404(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    response = authed_client.put(f"/api/v1/me/modules/{uuid.uuid4()}", json={"status": "PASSED"})
    assert response.status_code == 404


def test_update_only_semester_field(authed_client, mock_db):
    module = _make_module(benotet=True)
    sm = _make_sm(module_id=module.id)
    _setup_sm(mock_db, sm, module)

    response = authed_client.put(f"/api/v1/me/modules/{sm.id}", json={"semester": "WS2024/25"})
    assert response.status_code == 200
    assert sm.semester == "WS2024/25"
