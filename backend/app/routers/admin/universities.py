"""Admin Universities CRUD (Sprint 5 Phase 3).

Universities have no soft-delete (no student data tied directly).
DELETE only allowed when no faculties exist.
"""
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.university import University
from app.models.faculty import Faculty
from app.core.admin_auth import get_admin_user, get_verified_admin
from app.core.audit import AuditLogger, get_audit_logger
from app.models.user import User
from app.schemas.admin.po import (
    AdminUniversityCreate,
    AdminUniversityPatch,
    AdminUniversityResponse,
    AdminUniversityDetailResponse,
    AdminFacultyResponse,
)

router = APIRouter(prefix="/universities", tags=["admin-universities"])


@router.get("", response_model=List[AdminUniversityResponse])
def list_universities(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return db.query(University).order_by(University.name).all()


@router.post("", response_model=AdminUniversityResponse, status_code=status.HTTP_201_CREATED)
def create_university(
    payload: AdminUniversityCreate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    uni = University(**payload.model_dump())
    db.add(uni)
    db.flush()
    audit.log("CREATE", "University", entity_id=uni.id, entity_label=uni.name, new_value=payload.model_dump())
    db.commit()
    db.refresh(uni)
    return uni


@router.get("/{university_id}", response_model=AdminUniversityDetailResponse)
def get_university(
    university_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    uni = db.get(University, university_id)
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    faculties = db.query(Faculty).filter(Faculty.university_id == university_id).all()
    return AdminUniversityDetailResponse(
        **AdminUniversityResponse.model_validate(uni).model_dump(),
        faculties=[AdminFacultyResponse.model_validate(f) for f in faculties],
    )


@router.patch("/{university_id}", response_model=AdminUniversityResponse)
def patch_university(
    university_id: UUID,
    payload: AdminUniversityPatch,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    uni = db.get(University, university_id)
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    old_snap = {"name": uni.name, "kuerzel": uni.kuerzel}
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(uni, field, value)

    db.flush()
    audit.log("UPDATE", "University", entity_id=uni.id, entity_label=uni.name, old_value=old_snap, new_value=payload.model_dump(exclude_none=True))
    db.commit()
    db.refresh(uni)
    return uni


@router.delete("/{university_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_university(
    university_id: UUID,
    verified_admin: User = Depends(get_verified_admin),
    db: Session = Depends(get_db),
    audit: AuditLogger = Depends(get_audit_logger),
):
    uni = db.get(University, university_id)
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    faculty_count = db.query(Faculty).filter(Faculty.university_id == university_id).count()
    if faculty_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete university with {faculty_count} faculties. Remove faculties first.",
        )

    audit.log("DELETE", "University", entity_id=uni.id, entity_label=uni.name, old_value={"name": uni.name})
    db.flush()
    db.delete(uni)
    db.commit()
    return None
