import uuid
from unittest.mock import MagicMock


_UNI_ID = uuid.uuid4()
_FAC_ID = uuid.uuid4()
_PROG_ID = uuid.uuid4()
_ER_ID = uuid.uuid4()


def _make_university(**kwargs):
    u = MagicMock()
    u.id = _UNI_ID
    u.name = "Hochschule Hannover"
    u.kuerzel = "HSH"
    u.stadt = "Hannover"
    u.bundesland = "Niedersachsen"
    u.typ = "FH"
    for k, v in kwargs.items():
        setattr(u, k, v)
    return u


def _make_faculty(**kwargs):
    f = MagicMock()
    f.id = _FAC_ID
    f.university_id = _UNI_ID
    f.name = "Fakultät IV - Wirtschaft und Informatik"
    f.kuerzel = "F4"
    for k, v in kwargs.items():
        setattr(f, k, v)
    return f


def _make_program(**kwargs):
    p = MagicMock()
    p.id = _PROG_ID
    p.faculty_id = _FAC_ID
    p.name = "Angewandte Informatik"
    p.abschluss = "Bachelor"
    p.regelstudienzeit = 6
    p.gesamt_ects = 180
    for k, v in kwargs.items():
        setattr(p, k, v)
    return p


def _make_exam_reg(**kwargs):
    er = MagicMock()
    er.id = _ER_ID
    er.program_id = _PROG_ID
    er.version = "PO 19 WiSe"
    er.gueltig_ab = None
    er.ist_aktuell = True
    for k, v in kwargs.items():
        setattr(er, k, v)
    return er


def _make_module(name="Programmieren 1", ects=6, sem=1, typ="PFLICHT", benotet=True):
    m = MagicMock()
    m.id = uuid.uuid4()
    m.exam_regulation_id = _ER_ID
    m.name = name
    m.kuerzel = None
    m.ects = ects
    m.semester_empfehlung = sem
    m.modul_typ = typ
    m.ist_benotet = benotet
    m.max_versuche = 3
    m.gewichtung = 1.0
    return m


# ── GET /universities ─────────────────────────────────────────────────────────

def test_list_universities_empty(client, mock_db):
    mock_db.query.return_value.all.return_value = []
    response = client.get("/api/v1/universities")
    assert response.status_code == 200
    assert response.json() == []


def test_list_universities_returns_list(client, mock_db):
    mock_db.query.return_value.all.return_value = [_make_university()]
    response = client.get("/api/v1/universities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["kuerzel"] == "HSH"
    assert data[0]["typ"] == "FH"


# ── GET /universities/{id}/faculties ──────────────────────────────────────────

def test_list_faculties_not_found(client, mock_db):
    mock_db.get.return_value = None
    response = client.get(f"/api/v1/universities/{uuid.uuid4()}/faculties")
    assert response.status_code == 404


def test_list_faculties_success(client, mock_db):
    mock_db.get.return_value = _make_university()
    mock_db.query.return_value.filter.return_value.all.return_value = [_make_faculty()]
    response = client.get(f"/api/v1/universities/{_UNI_ID}/faculties")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["kuerzel"] == "F4"


# ── GET /faculties/{id}/programs ──────────────────────────────────────────────

def test_list_programs_not_found(client, mock_db):
    mock_db.get.return_value = None
    response = client.get(f"/api/v1/faculties/{uuid.uuid4()}/programs")
    assert response.status_code == 404


def test_list_programs_success(client, mock_db):
    mock_db.get.return_value = _make_faculty()
    mock_db.query.return_value.filter.return_value.all.return_value = [_make_program()]
    response = client.get(f"/api/v1/faculties/{_FAC_ID}/programs")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["abschluss"] == "Bachelor"
    assert data[0]["gesamt_ects"] == 180


# ── GET /programs/{id}/exam-regulations ──────────────────────────────────────

def test_list_exam_regulations_not_found(client, mock_db):
    mock_db.get.return_value = None
    response = client.get(f"/api/v1/programs/{uuid.uuid4()}/exam-regulations")
    assert response.status_code == 404


def test_list_exam_regulations_success(client, mock_db):
    mock_db.get.return_value = _make_program()
    mock_db.query.return_value.filter.return_value.all.return_value = [_make_exam_reg()]
    response = client.get(f"/api/v1/programs/{_PROG_ID}/exam-regulations")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["version"] == "PO 19 WiSe"
    assert data[0]["ist_aktuell"] is True


# ── GET /exam-regulations/{id}/modules ───────────────────────────────────────

def test_list_modules_not_found(client, mock_db):
    mock_db.get.return_value = None
    response = client.get(f"/api/v1/exam-regulations/{uuid.uuid4()}/modules")
    assert response.status_code == 404


def test_list_modules_grouped_by_semester(client, mock_db):
    mock_db.get.return_value = _make_exam_reg()
    mock_db.query.return_value.filter.return_value.all.return_value = [
        _make_module("Programmieren 1", 6, 1),
        _make_module("Mathematik 1", 6, 1),
        _make_module("Programmieren 2", 6, 2),
    ]
    response = client.get(f"/api/v1/exam-regulations/{_ER_ID}/modules")
    assert response.status_code == 200
    data = response.json()
    # Should be grouped: semester 1 with 2 modules, semester 2 with 1
    assert len(data) == 2
    sem1 = next(g for g in data if g["semester"] == 1)
    assert len(sem1["modules"]) == 2
    sem2 = next(g for g in data if g["semester"] == 2)
    assert len(sem2["modules"]) == 1
