from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, model_validator
from app.models.module import ModulTyp
from app.models.student_module import StudiengangStatus


# ── University ────────────────────────────────────────────────────────────────

class UniversityResponse(BaseModel):
    id: UUID
    name: str
    kuerzel: str
    stadt: str
    bundesland: str
    typ: str

    model_config = {"from_attributes": True}


# ── Faculty ───────────────────────────────────────────────────────────────────

class FacultyResponse(BaseModel):
    id: UUID
    university_id: UUID
    name: str
    kuerzel: str

    model_config = {"from_attributes": True}


# ── Program ───────────────────────────────────────────────────────────────────

class ProgramResponse(BaseModel):
    id: UUID
    faculty_id: UUID
    name: str
    abschluss: str
    regelstudienzeit: int
    gesamt_ects: int

    model_config = {"from_attributes": True}


# ── ExamRegulation ────────────────────────────────────────────────────────────

class ExamRegulationResponse(BaseModel):
    id: UUID
    program_id: UUID
    version: str
    gueltig_ab: Optional[date]
    ist_aktuell: bool

    model_config = {"from_attributes": True}


# ── Module ────────────────────────────────────────────────────────────────────

class ModuleResponse(BaseModel):
    id: UUID
    exam_regulation_id: UUID
    name: str
    kuerzel: Optional[str]
    ects: int
    semester_empfehlung: Optional[int]
    modul_typ: ModulTyp
    ist_benotet: bool
    max_versuche: int
    gewichtung: float

    model_config = {"from_attributes": True}


class ModulesBySemester(BaseModel):
    semester: Optional[int]
    modules: List[ModuleResponse]


# ── UserProgram ───────────────────────────────────────────────────────────────

class SelectProgramRequest(BaseModel):
    exam_regulation_id: UUID
    start_semester: str


class UserProgramResponse(BaseModel):
    id: UUID
    user_id: UUID
    exam_regulation_id: UUID
    start_semester: str
    created_at: datetime
    exam_regulation: ExamRegulationResponse
    program: ProgramResponse

    model_config = {"from_attributes": True}


# ── StudentModule ─────────────────────────────────────────────────────────────

class StudentModuleResponse(BaseModel):
    id: UUID
    user_id: UUID
    module_id: Optional[UUID]
    custom_name: Optional[str]
    custom_ects: Optional[int]
    status: StudiengangStatus
    note: Optional[float]
    versuch_nummer: int
    anmelde_datum: Optional[datetime]
    pruefungs_datum: Optional[datetime]
    semester: Optional[str]
    module: Optional[ModuleResponse]

    model_config = {"from_attributes": True}


class StudentModulesBySemester(BaseModel):
    semester: Optional[int]
    modules: List[StudentModuleResponse]


class AddModuleRequest(BaseModel):
    module_id: Optional[UUID] = None
    custom_name: Optional[str] = None
    custom_ects: Optional[int] = None
    semester: Optional[str] = None

    @model_validator(mode="after")
    def check_either_module_or_custom(self) -> "AddModuleRequest":
        has_module = self.module_id is not None
        has_custom = self.custom_name is not None and self.custom_ects is not None
        if not has_module and not has_custom:
            raise ValueError("Provide either module_id or custom_name + custom_ects")
        if has_module and has_custom:
            raise ValueError("Provide either module_id or custom_name + custom_ects, not both")
        return self


class UpdateModuleRequest(BaseModel):
    status: Optional[StudiengangStatus] = None
    note: Optional[float] = None
    anmelde_datum: Optional[datetime] = None
    pruefungs_datum: Optional[datetime] = None
    semester: Optional[str] = None


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    gpa: Optional[float]
    erreichte_ects: int
    gesamt_ects: int
    fortschritt_prozent: float
    bestandene_module: int
    nicht_bestandene_module: int
    offene_module: int
