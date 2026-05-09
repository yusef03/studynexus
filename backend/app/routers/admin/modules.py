"""Admin Modules CRUD + Archive/Restore + JSON/PDF Import (Sprint 5 Phase 3, ADR-020)."""
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.module import Module, ModulTyp
from app.models.module_prerequisite import ModulePrerequisite
from app.models.student_module import StudentModule
from app.models.user import User
from app.core.admin_auth import get_admin_user, get_verified_admin
from app.core.audit import AuditLogger, get_audit_logger
from app.schemas.admin.po import (
    AdminModuleCreate,
    AdminModulePatch,
    AdminModuleResponse,
    AdminModuleDetailResponse,
    AdminPrerequisiteResponse,
    ModuleImportRequest,
    ImportResult,
    ArchiveRequest,
)

router = APIRouter(prefix="/modules", tags=["admin-modules"])


# ── Import routes (defined before /{module_id} to avoid UUID-parse conflict) ──

@router.post("/import/json", response_model=ImportResult)
def import_modules_json(
    payload: ModuleImportRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    er = db.get(ExamRegulation, payload.exam_regulation_id)
    if not er:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ExamRegulation not found")

    if len(payload.modules) > 500:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Maximum 500 modules per import")

    existing_kuerzel: set = {
        row[0] for row in
        db.query(Module.kuerzel).filter(
            Module.exam_regulation_id == payload.exam_regulation_id,
            Module.kuerzel.isnot(None),
        ).all()
    }

    created = 0
    skipped = 0
    errors: List[str] = []

    for item in payload.modules:
        try:
            if item.kuerzel and item.kuerzel in existing_kuerzel:
                skipped += 1
                continue

            mod = Module(
                exam_regulation_id=payload.exam_regulation_id,
                name=item.name,
                kuerzel=item.kuerzel,
                ects=item.ects,
                semester_empfehlung=item.semester_empfehlung,
                modul_typ=ModulTyp(item.modul_typ),
                ist_benotet=item.ist_benotet,
                max_versuche=item.max_versuche,
                gewichtung=item.gewichtung,
                has_prerequisites=item.has_prerequisites,
                pruefungsart=item.pruefungsart,
                sws=item.sws,
            )
            db.add(mod)
            db.flush()
            if item.kuerzel:
                existing_kuerzel.add(item.kuerzel)
            created += 1
        except Exception as e:
            db.rollback()
            errors.append(f"{item.name}: {e}")
            # Re-open transaction for remaining items
            db.begin()

    audit_entry = audit.log(
        "IMPORT",
        "Module",
        entity_label=f"{created} modules → ER {payload.exam_regulation_id}",
        new_value={"created": created, "skipped": skipped, "error_count": len(errors)},
    )
    db.commit()

    return ImportResult(
        created=created,
        skipped=skipped,
        errors=errors,
        audit_log_id=audit_entry.id if audit_entry else None,
    )


@router.post("/import/pdf", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def import_modules_pdf():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="PDF import not yet implemented",
    )


# ── Standard CRUD ─────────────────────────────────────────────────────────────

@router.get("", response_model=List[AdminModuleResponse])
def list_modules(
    exam_regulation_id: Optional[UUID] = Query(None),
    include_archived: bool = Query(False),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(Module)
    if exam_regulation_id:
        q = q.filter(Module.exam_regulation_id == exam_regulation_id)
    if not include_archived:
        q = q.filter(Module.is_archived == False)
    return q.order_by(Module.name).all()


@router.post("", response_model=AdminModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: AdminModuleCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not db.get(ExamRegulation, payload.exam_regulation_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ExamRegulation not found")

    mod = Module(**payload.model_dump())
    db.add(mod)
    db.flush()
    audit.log("CREATE", "Module", entity_id=mod.id, entity_label=mod.name, new_value=payload.model_dump(mode="json"))
    db.commit()
    db.refresh(mod)
    return mod


@router.get("/{module_id}", response_model=AdminModuleDetailResponse)
def get_module(
    module_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    mod = db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    student_count = db.query(StudentModule).filter(StudentModule.module_id == module_id).count()
    prereqs = db.query(ModulePrerequisite).filter(ModulePrerequisite.module_id == module_id).all()

    return AdminModuleDetailResponse(
        **AdminModuleResponse.model_validate(mod).model_dump(),
        student_count=student_count,
        prerequisites=[AdminPrerequisiteResponse.model_validate(p) for p in prereqs],
    )


@router.patch("/{module_id}", response_model=AdminModuleResponse)
def patch_module(
    module_id: UUID,
    payload: AdminModulePatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    mod = db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    old_snap = {"name": mod.name, "ects": mod.ects, "modul_typ": mod.modul_typ.value if mod.modul_typ else None}
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(mod, field, value)

    db.flush()
    audit.log("UPDATE", "Module", entity_id=mod.id, entity_label=mod.name, old_value=old_snap, new_value=payload.model_dump(exclude_none=True, mode="json"))
    db.commit()
    db.refresh(mod)
    return mod


@router.post("/{module_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
def archive_module(
    module_id: UUID,
    payload: ArchiveRequest,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    mod = db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    if mod.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already archived")

    mod.is_archived = True
    mod.archived_at = datetime.now(timezone.utc)
    mod.archived_by = verified_admin.id
    mod.archive_reason = payload.reason

    db.flush()
    audit.log("ARCHIVE", "Module", entity_id=mod.id, entity_label=mod.name, old_value={"is_archived": False}, new_value={"is_archived": True}, reason=payload.reason)
    db.commit()
    return None


@router.post("/{module_id}/restore", status_code=status.HTTP_204_NO_CONTENT)
def restore_module(
    module_id: UUID,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    mod = db.get(Module, module_id)
    if not mod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    if not mod.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not archived")

    mod.is_archived = False
    mod.archived_at = None
    mod.archived_by = None
    mod.archive_reason = None

    db.flush()
    audit.log("RESTORE", "Module", entity_id=mod.id, entity_label=mod.name, old_value={"is_archived": True}, new_value={"is_archived": False})
    db.commit()
    return None
