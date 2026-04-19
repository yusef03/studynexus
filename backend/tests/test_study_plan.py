import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.models.module import ModulTyp
from app.models.student_module import StudiengangStatus


_USER_ID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
_ER_ID = uuid.uuid4()
_PROG_ID = uuid.uuid4()
_FIXED_DT = datetime(2026, 4, 18, 12, 0, 0, tzinfo=timezone.utc)


def _make_exam_reg():
    er = MagicMock()
    er.id = _ER_ID
    er.program_id = _PROG_ID
    er.version = "PO 19 WiSe"
    er.gueltig_ab = None
    er.ist_aktuell = True
    return er


def _make_program():
    p = MagicMock()
    p.id = _PROG_ID
    p.faculty_id = uuid.uuid4()
    p.name = "Angewandte Informatik"
    p.abschluss = "Bachelor"
    p.regelstudienzeit = 6
    p.gesamt_ects = 180
    return p


def _make_user_program():
    up = MagicMock()
    up.id = uuid.uuid4()
    up.user_id = _USER_ID
    up.exam_regulation_id = _ER_ID
    up.start_semester = "WS2024/25"
    up.created_at = _FIXED_DT
    return up


def _make_module(typ=ModulTyp.PFLICHT, ects=6, sem=1, benotet=True):
    m = MagicMock()
    m.id = uuid.uuid4()
    m.exam_regulation_id = _ER_ID
    m.name = "Testmodul"
    m.kuerzel = None
    m.ects = ects
    m.semester_empfehlung = sem
    m.modul_typ = typ
    m.ist_benotet = benotet
    m.max_versuche = 3
    m.gewichtung = 1.0
    return m


def _make_student_module(module_id=None, status=StudiengangStatus.PLANNED):
    sm = MagicMock()
    sm.id = uuid.uuid4()
    sm.user_id = _USER_ID
    sm.module_id = module_id or uuid.uuid4()
    sm.custom_name = None
    sm.custom_ects = None
    sm.status = status
    sm.note = None
    sm.versuch_nummer = 1
    sm.anmelde_datum = None
    sm.pruefungs_datum = None
    sm.semester = None
    return sm


# ── POST /me/program ──────────────────────────────────────────────────────────

def test_select_program_success(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None  # no existing program
    er = _make_exam_reg()
    prog = _make_program()
    mock_db.get.side_effect = lambda model, id: er if model.__name__ == "ExamRegulation" else prog

    new_up = _make_user_program()
    with patch("app.routers.study_plan.UserProgram", return_value=new_up):
        response = authed_client.post("/api/v1/me/program", json={
            "exam_regulation_id": str(_ER_ID),
            "start_semester": "WS2024/25",
        })

    assert response.status_code == 201
    data = response.json()
    assert data["start_semester"] == "WS2024/25"
    assert data["program"]["name"] == "Angewandte Informatik"


def test_select_program_conflict_if_already_selected(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = _make_user_program()
    response = authed_client.post("/api/v1/me/program", json={
        "exam_regulation_id": str(_ER_ID),
        "start_semester": "WS2024/25",
    })
    assert response.status_code == 409


def test_select_program_exam_reg_not_found(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    mock_db.get.return_value = None
    response = authed_client.post("/api/v1/me/program", json={
        "exam_regulation_id": str(uuid.uuid4()),
        "start_semester": "WS2024/25",
    })
    assert response.status_code == 404


# ── GET /me/program ───────────────────────────────────────────────────────────

def test_get_my_program_not_found(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    response = authed_client.get("/api/v1/me/program")
    assert response.status_code == 404


def test_get_my_program_returns_details(authed_client, mock_db):
    up = _make_user_program()
    er = _make_exam_reg()
    prog = _make_program()

    call_count = [0]
    def query_side_effect(model):
        q = MagicMock()
        q.filter.return_value.first.return_value = up
        q.filter.return_value.all.return_value = []
        return q

    mock_db.query.side_effect = query_side_effect
    mock_db.get.side_effect = lambda model, _id: er if hasattr(model, '__name__') and model.__name__ == "ExamRegulation" else prog

    response = authed_client.get("/api/v1/me/program")
    assert response.status_code == 200
    data = response.json()
    assert data["start_semester"] == "WS2024/25"


# ── GET /me/modules ───────────────────────────────────────────────────────────

def test_get_my_modules_empty(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.all.return_value = []
    response = authed_client.get("/api/v1/me/modules")
    assert response.status_code == 200
    assert response.json() == []


def test_get_my_modules_grouped(authed_client, mock_db):
    m = _make_module()
    sm = _make_student_module(module_id=m.id)

    def query_side_effect(model):
        q = MagicMock()
        q.filter.return_value.all.return_value = [sm]
        q.filter.return_value.filter.return_value.all.return_value = [m]
        return q

    mock_db.query.side_effect = query_side_effect

    response = authed_client.get("/api/v1/me/modules")
    assert response.status_code == 200


# ── POST /me/modules ──────────────────────────────────────────────────────────

def test_add_wahlpflicht_module_success(authed_client, mock_db):
    from app.models.user_program import UserProgram as UP
    from app.models.student_module import StudentModule as SM

    m = _make_module(typ=ModulTyp.WAHLPFLICHT)

    def query_side_effect(model):
        q = MagicMock()
        if model is UP:
            q.filter.return_value.first.return_value = _make_user_program()
        elif model is SM:
            # duplicate check returns None → not already added
            q.filter.return_value.first.return_value = None
        return q

    mock_db.query.side_effect = query_side_effect
    mock_db.get.return_value = m

    # db.refresh is a no-op mock; assign id so serialisation succeeds
    def refresh_side_effect(obj):
        if hasattr(obj, "id") and not obj.id:
            obj.id = uuid.uuid4()

    mock_db.refresh.side_effect = refresh_side_effect

    response = authed_client.post("/api/v1/me/modules", json={"module_id": str(m.id)})
    assert response.status_code == 201


def test_add_module_no_program_returns_400(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    response = authed_client.post("/api/v1/me/modules", json={"module_id": str(uuid.uuid4())})
    assert response.status_code == 400


def test_add_pflicht_module_rejected(authed_client, mock_db):
    m = _make_module(typ=ModulTyp.PFLICHT)

    def query_side_effect(model):
        q = MagicMock()
        q.filter.return_value.first.return_value = _make_user_program()
        q.filter.return_value.all.return_value = []
        return q

    mock_db.query.side_effect = query_side_effect
    mock_db.get.return_value = m

    response = authed_client.post("/api/v1/me/modules", json={"module_id": str(m.id)})
    assert response.status_code == 400


def test_add_custom_ergaenzend_success(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = _make_user_program()
    sm = _make_student_module()
    sm.module_id = None
    sm.custom_name = "Extra Kurs"
    sm.custom_ects = 3

    with patch("app.routers.study_plan.StudentModule", return_value=sm):
        response = authed_client.post("/api/v1/me/modules", json={
            "custom_name": "Extra Kurs",
            "custom_ects": 3,
        })

    assert response.status_code == 201


def test_add_module_invalid_body_returns_422(authed_client, mock_db):
    response = authed_client.post("/api/v1/me/modules", json={})
    assert response.status_code == 422


# ── DELETE /me/modules/{id} ───────────────────────────────────────────────────

def test_delete_module_success(authed_client, mock_db):
    sm = _make_student_module(status=StudiengangStatus.PLANNED)
    mock_db.query.return_value.filter.return_value.first.return_value = sm
    response = authed_client.delete(f"/api/v1/me/modules/{sm.id}")
    assert response.status_code == 204
    mock_db.delete.assert_called_once_with(sm)


def test_delete_passed_module_rejected(authed_client, mock_db):
    sm = _make_student_module(status=StudiengangStatus.PASSED)
    mock_db.query.return_value.filter.return_value.first.return_value = sm
    response = authed_client.delete(f"/api/v1/me/modules/{sm.id}")
    assert response.status_code == 409


def test_delete_module_not_found(authed_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    response = authed_client.delete(f"/api/v1/me/modules/{uuid.uuid4()}")
    assert response.status_code == 404
