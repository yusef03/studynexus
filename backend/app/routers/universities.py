from collections import defaultdict
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.exam_regulation import ExamRegulation
from app.models.faculty import Faculty
from app.models.module import Module
from app.models.program import Program
from app.models.university import University
from app.schemas.study_plan import (
    ExamRegulationResponse,
    FacultyResponse,
    ModuleResponse,
    ModulesBySemester,
    ProgramResponse,
    UniversityResponse,
)

router = APIRouter(tags=["universities"])


@router.get("/universities", response_model=List[UniversityResponse])
def list_universities(db: Session = Depends(get_db)):
    return db.query(University).all()


@router.get("/universities/{university_id}/faculties", response_model=List[FacultyResponse])
def list_faculties(university_id: UUID, db: Session = Depends(get_db)):
    if not db.get(University, university_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    return db.query(Faculty).filter(Faculty.university_id == university_id).all()


@router.get("/faculties/{faculty_id}/programs", response_model=List[ProgramResponse])
def list_programs(faculty_id: UUID, db: Session = Depends(get_db)):
    if not db.get(Faculty, faculty_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")
    return db.query(Program).filter(Program.faculty_id == faculty_id).all()


@router.get("/programs/{program_id}/exam-regulations", response_model=List[ExamRegulationResponse])
def list_exam_regulations(program_id: UUID, db: Session = Depends(get_db)):
    if not db.get(Program, program_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    return db.query(ExamRegulation).filter(ExamRegulation.program_id == program_id).all()


@router.get("/exam-regulations/{exam_reg_id}/modules", response_model=List[ModulesBySemester])
def list_modules_by_semester(exam_reg_id: UUID, db: Session = Depends(get_db)):
    if not db.get(ExamRegulation, exam_reg_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam regulation not found")

    modules = db.query(Module).filter(Module.exam_regulation_id == exam_reg_id).all()

    grouped: dict = defaultdict(list)
    for m in modules:
        grouped[m.semester_empfehlung].append(m)

    return [
        ModulesBySemester(semester=sem, modules=mods)
        for sem, mods in sorted(grouped.items(), key=lambda kv: (kv[0] is None, kv[0]))
    ]
