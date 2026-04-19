import uuid
from unittest.mock import MagicMock

from app.models.student_module import StudiengangStatus
from app.services.gpa_service import calculate_gpa


def _make_module(ects=6, gewichtung=1.0):
    m = MagicMock()
    m.id = uuid.uuid4()
    m.ects = ects
    m.gewichtung = gewichtung
    return m


def _make_sm(module, status=StudiengangStatus.PASSED, note=2.0):
    sm = MagicMock()
    sm.module_id = module.id
    sm.status = status
    sm.note = note
    return sm


# ── Edge cases ────────────────────────────────────────────────────────────────

def test_gpa_no_modules_returns_none():
    assert calculate_gpa([], {}) is None


def test_gpa_no_passed_modules_returns_none():
    m = _make_module()
    sm = _make_sm(m, status=StudiengangStatus.PLANNED, note=None)
    assert calculate_gpa([sm], {m.id: m}) is None


def test_gpa_single_graded_passed_module():
    m = _make_module(ects=6)
    sm = _make_sm(m, note=1.7)
    result = calculate_gpa([sm], {m.id: m})
    assert result == 1.7


def test_gpa_excludes_failed_modules():
    m1 = _make_module(ects=6)
    m2 = _make_module(ects=6)
    sm_passed = _make_sm(m1, status=StudiengangStatus.PASSED, note=2.0)
    sm_failed = _make_sm(m2, status=StudiengangStatus.FAILED, note=5.0)
    result = calculate_gpa([sm_passed, sm_failed], {m1.id: m1, m2.id: m2})
    assert result == 2.0


def test_gpa_excludes_zero_gewichtung_modules():
    m_graded = _make_module(ects=6, gewichtung=1.0)
    m_zero = _make_module(ects=4, gewichtung=0.0)
    sm1 = _make_sm(m_graded, note=2.0)
    sm2 = _make_sm(m_zero, note=None)
    sm2.status = StudiengangStatus.PASSED
    result = calculate_gpa([sm1, sm2], {m_graded.id: m_graded, m_zero.id: m_zero})
    assert result == 2.0


def test_gpa_excludes_planned_and_registered():
    m = _make_module(ects=6)
    sm_planned = _make_sm(m, status=StudiengangStatus.PLANNED, note=None)
    sm_registered = _make_sm(m, status=StudiengangStatus.REGISTERED, note=None)
    assert calculate_gpa([sm_planned, sm_registered], {m.id: m}) is None


def test_gpa_weighted_by_ects():
    m1 = _make_module(ects=6)
    m2 = _make_module(ects=12)
    sm1 = _make_sm(m1, note=1.0)
    sm2 = _make_sm(m2, note=4.0)
    # (1.0*6 + 4.0*12) / (6+12) = 54/18 = 3.0
    result = calculate_gpa([sm1, sm2], {m1.id: m1, m2.id: m2})
    assert result == 3.0


def test_gpa_rounded_to_two_decimals():
    m1 = _make_module(ects=1)
    m2 = _make_module(ects=1)
    m3 = _make_module(ects=1)
    sm1 = _make_sm(m1, note=1.0)
    sm2 = _make_sm(m2, note=2.0)
    sm3 = _make_sm(m3, note=3.0)
    result = calculate_gpa([sm1, sm2, sm3], {m1.id: m1, m2.id: m2, m3.id: m3})
    assert result == 2.0


def test_gpa_excludes_module_without_note():
    m1 = _make_module(ects=6)
    m2 = _make_module(ects=6)
    sm1 = _make_sm(m1, note=1.3)
    sm2_no_note = _make_sm(m2, note=None)
    result = calculate_gpa([sm1, sm2_no_note], {m1.id: m1, m2.id: m2})
    assert result == 1.3


def test_gpa_ignores_student_module_without_module_id():
    m = _make_module(ects=6)
    sm_with_module = _make_sm(m, note=2.0)
    sm_custom = MagicMock()
    sm_custom.module_id = None
    sm_custom.status = StudiengangStatus.PASSED
    sm_custom.note = 1.0
    result = calculate_gpa([sm_with_module, sm_custom], {m.id: m})
    assert result == 2.0


def test_gpa_best_possible_grade():
    m = _make_module(ects=6)
    sm = _make_sm(m, note=1.0)
    assert calculate_gpa([sm], {m.id: m}) == 1.0


def test_gpa_last_passing_grade():
    m = _make_module(ects=6)
    sm = _make_sm(m, note=4.0)
    assert calculate_gpa([sm], {m.id: m}) == 4.0


def test_gpa_weighted_by_gewichtung_bachelorarbeit():
    m_regular = _make_module(ects=6, gewichtung=1.0)
    m_bachelor = _make_module(ects=15, gewichtung=4.0)
    sm1 = _make_sm(m_regular, note=2.0)
    sm2 = _make_sm(m_bachelor, note=1.3)
    # (2.0*6*1.0 + 1.3*15*4.0) / (6*1.0 + 15*4.0) = (12 + 78) / (6 + 60) = 90/66
    result = calculate_gpa([sm1, sm2], {m_regular.id: m_regular, m_bachelor.id: m_bachelor})
    assert result == round(90 / 66, 2)


def test_gpa_half_gewichtung():
    m1 = _make_module(ects=6, gewichtung=1.0)
    m2 = _make_module(ects=2, gewichtung=0.5)
    sm1 = _make_sm(m1, note=1.0)
    sm2 = _make_sm(m2, note=2.0)
    # (1.0*6*1.0 + 2.0*2*0.5) / (6*1.0 + 2*0.5) = (6 + 2) / (6 + 1) = 8/7
    result = calculate_gpa([sm1, sm2], {m1.id: m1, m2.id: m2})
    assert result == round(8 / 7, 2)
