from typing import Dict, List, Optional
from app.models.module import Module
from app.models.student_module import StudentModule, StudiengangStatus


def calculate_gpa(
    student_modules: List[StudentModule],
    modules_by_id: Dict,
) -> Optional[float]:
    """
    Weighted GPA over graded passed modules.

    Only includes StudentModules where:
      - status == PASSED
      - module_id is set and the linked module exists
      - module.ist_benotet == True
      - note is not None

    Formula: sum(note * ects) / sum(ects), rounded to 2 decimal places.
    Returns None when no qualifying modules exist.
    """
    qualifying = [
        sm for sm in student_modules
        if sm.status == StudiengangStatus.PASSED
        and sm.note is not None
        and sm.module_id is not None
        and sm.module_id in modules_by_id
        and modules_by_id[sm.module_id].ist_benotet
    ]

    if not qualifying:
        return None

    total_ects = sum(modules_by_id[sm.module_id].ects for sm in qualifying)
    if total_ects == 0:
        return None

    weighted_sum = sum(sm.note * modules_by_id[sm.module_id].ects for sm in qualifying)
    return round(weighted_sum / total_ects, 2)
