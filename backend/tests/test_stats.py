import uuid
from unittest.mock import MagicMock

from app.models.student_module import StudiengangStatus


_USER_ID = uuid.UUID("123e4567-e89b-12d3-a456-426614174000")
_ER_ID = uuid.uuid4()
_PROG_ID = uuid.uuid4()


def _make_user_program():
    up = MagicMock()
    up.user_id = _USER_ID
    up.exam_regulation_id = _ER_ID
    return up


def _make_exam_reg():
    er = MagicMock()
    er.id = _ER_ID
    er.program_id = _PROG_ID
    return er


def _make_program(gesamt_ects=180):
    p = MagicMock()
    p.id = _PROG_ID
    p.gesamt_ects = gesamt_ects
    return p


def _make_module(ects=6, ist_benotet=True):
    m = MagicMock()
    m.id = uuid.uuid4()
    m.ects = ects
    m.ist_benotet = ist_benotet
    return m


def _make_sm(module_id, status=StudiengangStatus.PLANNED, note=None):
    sm = MagicMock()
    sm.id = uuid.uuid4()
    sm.user_id = _USER_ID
    sm.module_id = module_id
    sm.custom_name = None
    sm.custom_ects = None
    sm.status = status
    sm.note = note
    sm.versuch_nummer = 1
    sm.anmelde_datum = None
    sm.pruefungs_datum = None
    sm.semester = None
    return sm


def _setup_stats_mocks(mock_db, student_modules, modules, user_program=None, exam_reg=None, program=None):
    from app.models.user_program import UserProgram as UP
    from app.models.student_module import StudentModule as SM
    from app.models.module import Module as Mod
    from app.models.exam_regulation import ExamRegulation as ER
    from app.models.program import Program as Prog

    up = user_program or _make_user_program()
    er = exam_reg or _make_exam_reg()
    prog = program or _make_program()

    def query_side(model):
        q = MagicMock()
        if model is UP:
            q.filter.return_value.first.return_value = up
        elif model is SM:
            q.filter.return_value.all.return_value = student_modules
        elif model is Mod:
            q.filter.return_value.all.return_value = modules
        return q

    mock_db.query.side_effect = query_side

    def get_side(model, _id):
        if model is ER:
            return er
        return prog

    mock_db.get.side_effect = get_side


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_stats_no_modules(authed_client, mock_db):
    _setup_stats_mocks(mock_db, [], [])
    response = authed_client.get("/api/v1/me/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["gpa"] is None
    assert data["erreichte_ects"] == 0
    assert data["gesamt_ects"] == 180
    assert data["fortschritt_prozent"] == 0.0
    assert data["bestandene_module"] == 0
    assert data["nicht_bestandene_module"] == 0
    assert data["offene_module"] == 0


def test_stats_with_passed_modules(authed_client, mock_db):
    m1 = _make_module(ects=6, ist_benotet=True)
    m2 = _make_module(ects=6, ist_benotet=False)
    sm1 = _make_sm(m1.id, status=StudiengangStatus.PASSED, note=2.0)
    sm2 = _make_sm(m2.id, status=StudiengangStatus.PASSED, note=None)

    _setup_stats_mocks(mock_db, [sm1, sm2], [m1, m2])
    response = authed_client.get("/api/v1/me/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["erreichte_ects"] == 12
    assert data["bestandene_module"] == 2
    assert data["gpa"] == 2.0  # only m1 counts for GPA


def test_stats_gpa_none_when_no_graded_passed(authed_client, mock_db):
    m = _make_module(ects=4, ist_benotet=False)
    sm = _make_sm(m.id, status=StudiengangStatus.PASSED, note=None)

    _setup_stats_mocks(mock_db, [sm], [m])
    response = authed_client.get("/api/v1/me/stats")
    assert response.status_code == 200
    assert response.json()["gpa"] is None


def test_stats_counts_all_statuses(authed_client, mock_db):
    m = _make_module()
    sm_passed = _make_sm(m.id, status=StudiengangStatus.PASSED, note=1.7)
    sm_failed = _make_sm(m.id, status=StudiengangStatus.FAILED)
    sm_planned = _make_sm(m.id, status=StudiengangStatus.PLANNED)
    sm_registered = _make_sm(m.id, status=StudiengangStatus.REGISTERED)

    _setup_stats_mocks(mock_db, [sm_passed, sm_failed, sm_planned, sm_registered], [m])
    response = authed_client.get("/api/v1/me/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["bestandene_module"] == 1
    assert data["nicht_bestandene_module"] == 1
    assert data["offene_module"] == 2


def test_stats_fortschritt_prozent(authed_client, mock_db):
    m = _make_module(ects=18)  # 18 of 180 = 10%
    sm = _make_sm(m.id, status=StudiengangStatus.PASSED, note=None)

    _setup_stats_mocks(mock_db, [sm], [m])
    response = authed_client.get("/api/v1/me/stats")
    assert response.status_code == 200
    assert response.json()["fortschritt_prozent"] == 10.0
