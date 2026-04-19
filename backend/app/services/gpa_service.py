from typing import Dict, List, Optional
from app.models.student_module import StudentModule, StudiengangStatus


def calculate_gpa(
    student_modules: List[StudentModule],
    modules_by_id: Dict,
) -> Optional[float]:
    qualifying = [
        sm for sm in student_modules
        if sm.status == StudiengangStatus.PASSED
        and sm.note is not None
        and sm.module_id is not None
        and sm.module_id in modules_by_id
        and modules_by_id[sm.module_id].gewichtung > 0
    ]

    if not qualifying:
        return None

    total_weight = sum(
        modules_by_id[sm.module_id].ects * modules_by_id[sm.module_id].gewichtung
        for sm in qualifying
    )
    if total_weight == 0:
        return None

    weighted_sum = sum(
        sm.note * modules_by_id[sm.module_id].ects * modules_by_id[sm.module_id].gewichtung
        for sm in qualifying
    )
    return round(weighted_sum / total_weight, 2)
