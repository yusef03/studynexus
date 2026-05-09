"""Admin PO (Prüfungsordnung) schemas (Sprint 5 Phase 3)."""
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator

from app.models.module import ModulTyp
from app.models.module_prerequisite import PrerequisiteType


# ── Archive / Restore ──────────────────────────────────────────────────────────

class ArchiveRequest(BaseModel):
    reason: str


# ── University ─────────────────────────────────────────────────────────────────

class AdminUniversityCreate(BaseModel):
    name: str
    kuerzel: str
    stadt: str
    bundesland: str
    typ: str  # "FH" or "Uni"


class AdminUniversityPatch(BaseModel):
    name: Optional[str] = None
    kuerzel: Optional[str] = None
    stadt: Optional[str] = None
    bundesland: Optional[str] = None
    typ: Optional[str] = None


class AdminUniversityResponse(BaseModel):
    id: UUID
    name: str
    kuerzel: str
    stadt: str
    bundesland: str
    typ: str

    model_config = {"from_attributes": True}


class AdminUniversityDetailResponse(AdminUniversityResponse):
    faculties: List["AdminFacultyResponse"] = []


# ── Faculty ────────────────────────────────────────────────────────────────────

class AdminFacultyCreate(BaseModel):
    university_id: UUID
    name: str
    kuerzel: str


class AdminFacultyPatch(BaseModel):
    name: Optional[str] = None
    kuerzel: Optional[str] = None


class AdminFacultyResponse(BaseModel):
    id: UUID
    university_id: UUID
    name: str
    kuerzel: str

    model_config = {"from_attributes": True}


# ── Program ────────────────────────────────────────────────────────────────────

class AdminProgramCreate(BaseModel):
    faculty_id: UUID
    name: str
    abschluss: str
    regelstudienzeit: int
    gesamt_ects: int


class AdminProgramPatch(BaseModel):
    name: Optional[str] = None
    abschluss: Optional[str] = None
    regelstudienzeit: Optional[int] = None
    gesamt_ects: Optional[int] = None


class AdminProgramResponse(BaseModel):
    id: UUID
    faculty_id: UUID
    name: str
    abschluss: str
    regelstudienzeit: int
    gesamt_ects: int
    is_archived: bool
    archived_at: Optional[datetime]
    archive_reason: Optional[str]

    model_config = {"from_attributes": True}


class AdminProgramDetailResponse(AdminProgramResponse):
    student_count: int = 0
    exam_regulations: List["AdminExamRegResponse"] = []


# ── ExamRegulation ─────────────────────────────────────────────────────────────

class AdminExamRegCreate(BaseModel):
    program_id: UUID
    version: str
    gueltig_ab: Optional[date] = None
    ist_aktuell: bool = False


class AdminExamRegPatch(BaseModel):
    version: Optional[str] = None
    gueltig_ab: Optional[date] = None
    ist_aktuell: Optional[bool] = None


class AdminExamRegResponse(BaseModel):
    id: UUID
    program_id: UUID
    version: str
    gueltig_ab: Optional[date]
    ist_aktuell: bool
    is_archived: bool
    archived_at: Optional[datetime]
    archive_reason: Optional[str]

    model_config = {"from_attributes": True}


class AdminExamRegDetailResponse(AdminExamRegResponse):
    module_count: int = 0


# ── Module ─────────────────────────────────────────────────────────────────────

class AdminModuleCreate(BaseModel):
    exam_regulation_id: UUID
    name: str
    kuerzel: Optional[str] = None
    ects: int
    semester_empfehlung: Optional[int] = None
    modul_typ: ModulTyp = ModulTyp.PFLICHT
    ist_benotet: bool = True
    max_versuche: int = 3
    gewichtung: float = 1.0
    has_prerequisites: bool = False
    pruefungsart: Optional[str] = None
    sws: Optional[int] = None


class AdminModulePatch(BaseModel):
    name: Optional[str] = None
    kuerzel: Optional[str] = None
    ects: Optional[int] = None
    semester_empfehlung: Optional[int] = None
    modul_typ: Optional[ModulTyp] = None
    ist_benotet: Optional[bool] = None
    max_versuche: Optional[int] = None
    gewichtung: Optional[float] = None
    has_prerequisites: Optional[bool] = None
    pruefungsart: Optional[str] = None
    sws: Optional[int] = None


class AdminModuleResponse(BaseModel):
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
    has_prerequisites: bool
    pruefungsart: Optional[str]
    sws: Optional[int]
    is_archived: bool
    archived_at: Optional[datetime]
    archive_reason: Optional[str]

    model_config = {"from_attributes": True}


class AdminModuleDetailResponse(AdminModuleResponse):
    student_count: int = 0
    prerequisites: List["AdminPrerequisiteResponse"] = []


# ── JSON Bulk Import ───────────────────────────────────────────────────────────

class ModuleImportItem(BaseModel):
    name: str
    kuerzel: Optional[str] = None
    ects: int
    semester_empfehlung: Optional[int] = None
    modul_typ: str = "PFLICHT"
    ist_benotet: bool = True
    max_versuche: int = 3
    gewichtung: float = 1.0
    has_prerequisites: bool = False
    pruefungsart: Optional[str] = None
    sws: Optional[int] = None

    @field_validator("modul_typ")
    @classmethod
    def validate_modul_typ(cls, v: str) -> str:
        allowed = {"PFLICHT", "WAHLPFLICHT", "ERGAENZEND"}
        if v not in allowed:
            raise ValueError(f"modul_typ must be one of {allowed}")
        return v


class ModuleImportRequest(BaseModel):
    exam_regulation_id: UUID
    modules: List[ModuleImportItem]


class ImportResult(BaseModel):
    created: int
    skipped: int
    errors: List[str]
    audit_log_id: Optional[UUID] = None


# ── Prerequisites ──────────────────────────────────────────────────────────────

class AdminPrerequisiteCreate(BaseModel):
    module_id: UUID
    prerequisite_type: PrerequisiteType
    description: str
    required_module_id: Optional[UUID] = None
    minimum_ects: Optional[int] = None
    required_semesters: Optional[str] = None


class AdminPrerequisitePatch(BaseModel):
    description: Optional[str] = None
    required_module_id: Optional[UUID] = None
    minimum_ects: Optional[int] = None
    required_semesters: Optional[str] = None


class AdminPrerequisiteResponse(BaseModel):
    id: UUID
    module_id: UUID
    prerequisite_type: PrerequisiteType
    description: str
    required_module_id: Optional[UUID]
    minimum_ects: Optional[int]
    required_semesters: Optional[str]

    model_config = {"from_attributes": True}


# Forward references
AdminUniversityDetailResponse.model_rebuild()
AdminProgramDetailResponse.model_rebuild()
AdminModuleDetailResponse.model_rebuild()
