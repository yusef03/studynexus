"""Admin Faculties CRUD (Sprint 5 Phase 3).

Faculties have no soft-delete. DELETE only allowed when no programs exist.
"""
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.faculty import Faculty
from app.models.program import Program
from app.models.university import University
from app.models.user import User
from app.core.admin_auth import get_admin_user, get_verified_admin
from app.core.audit import AuditLogger, get_audit_logger
from app.schemas.admin.po import AdminFacultyCreate, AdminFacultyPatch, AdminFacultyResponse

router = APIRouter(prefix="/faculties", tags=["admin-faculties"])


@router.get("", response_model=List[AdminFacultyResponse])
def list_faculties(
    university_id: Optional[UUID] = Query(None),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(Faculty)
    if university_id:
        q = q.filter(Faculty.university_id == university_id)
    return q.order_by(Faculty.name).all()


@router.post("", response_model=AdminFacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(
    payload: AdminFacultyCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    if not db.get(University, payload.university_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    faculty = Faculty(**payload.model_dump())
    db.add(faculty)
    db.flush()
    audit.log("CREATE", "Faculty", entity_id=faculty.id, entity_label=faculty.name, new_value=payload.model_dump())
    db.commit()
    db.refresh(faculty)
    return faculty


@router.patch("/{faculty_id}", response_model=AdminFacultyResponse)
def patch_faculty(
    faculty_id: UUID,
    payload: AdminFacultyPatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")

    old_snap = {"name": faculty.name, "kuerzel": faculty.kuerzel}
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(faculty, field, value)

    db.flush()
    audit.log("UPDATE", "Faculty", entity_id=faculty.id, entity_label=faculty.name, old_value=old_snap, new_value=payload.model_dump(exclude_none=True))
    db.commit()
    db.refresh(faculty)
    return faculty


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(
    faculty_id: UUID,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")

    program_count = db.query(Program).filter(Program.faculty_id == faculty_id).count()
    if program_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete faculty with {program_count} programs. Archive programs first.",
        )

    audit.log("DELETE", "Faculty", entity_id=faculty.id, entity_label=faculty.name)
    db.flush()
    db.delete(faculty)
    db.commit()
    return None
