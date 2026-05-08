from typing import Dict, List, Optional
from app.models.student_module import StudentModule, StudiengangStatus


def calculate_gpa(
    student_modules: List[StudentModule],
    modules_by_id: Dict,
) -> Optional[float]:
    # Modules handled via ERGAENZEND sub-module linking (e.g. BIN-209):
    # exclude their own note from GPA — contribution comes from averaged sub-module notes.
    parent_module_ids_with_subs = {
        sm.parent_module_id
        for sm in student_modules
        if sm.parent_module_id is not None
    }

    # Standard catalogue modules (exclude parents handled via sub-modules)
    qualifying = [
        sm for sm in student_modules
        if sm.status == StudiengangStatus.PASSED
        and sm.note is not None
        and sm.module_id is not None
        and sm.module_id in modules_by_id
        and modules_by_id[sm.module_id].gewichtung > 0
        and sm.module_id not in parent_module_ids_with_subs
    ]

    # Sprint 4 Phase 5 — BIN-209 GPA fix:
    # Group PASSED + benotet ERGAENZEND sub-modules by parent_module_id,
    # compute their average note, and use it as the parent module's GPA contribution.
    ergaenzend_by_parent: Dict = {}
    for sm in student_modules:
        if (
            sm.module_id is None
            and sm.parent_module_id is not None
            and sm.parent_module_id in modules_by_id
            and sm.status == StudiengangStatus.PASSED
            and sm.note is not None
            and sm.custom_ist_benotet is True
        ):
            ergaenzend_by_parent.setdefault(sm.parent_module_id, []).append(sm)

    parent_contributions: List = []
    for parent_module_id, sub_modules in ergaenzend_by_parent.items():
        parent_module = modules_by_id[parent_module_id]
        if parent_module.gewichtung == 0:
            continue
        notes = [sm.note for sm in sub_modules if sm.note is not None]
        if not notes:
            continue
        avg_note = sum(notes) / len(notes)
        parent_contributions.append((avg_note, parent_module))

    if not qualifying and not parent_contributions:
        return None

    total_weight = sum(
        modules_by_id[sm.module_id].ects * modules_by_id[sm.module_id].gewichtung
        for sm in qualifying
    ) + sum(
        m.ects * m.gewichtung for _, m in parent_contributions
    )

    if total_weight == 0:
        return None

    weighted_sum = sum(
        sm.note * modules_by_id[sm.module_id].ects * modules_by_id[sm.module_id].gewichtung
        for sm in qualifying
    ) + sum(
        avg_note * m.ects * m.gewichtung for avg_note, m in parent_contributions
    )

    return round(weighted_sum / total_weight, 2)
