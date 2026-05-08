import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class StudiengangStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    REGISTERED = "REGISTERED"
    PASSED = "PASSED"
    FAILED = "FAILED"


class StudentModule(Base):
    __tablename__ = "student_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=True, index=True)
    custom_name = Column(String, nullable=True)
    custom_ects = Column(Integer, nullable=True)
    status = Column(Enum(StudiengangStatus, name="studiengang_status"), nullable=False, default=StudiengangStatus.PLANNED)
    note = Column(Float, nullable=True)
    versuch_nummer = Column(Integer, nullable=False, default=1)
    anmelde_datum = Column(DateTime(timezone=True), nullable=True)
    pruefungs_datum = Column(DateTime(timezone=True), nullable=True)
    semester = Column(String, nullable=True)
    # Used exclusively by the StudyPlanBoard (/study-plan).
    # NULL means "auto-position via semester_empfehlung".
    # Any string value means the user has explicitly placed this module.
    # Never written by the ModuleList or grade-tracking flows.
    plan_semester = Column(String, nullable=True)
    # NULL for catalogue modules (ist_benotet comes from module.ist_benotet).
    # Set explicitly for custom ERGAENZEND modules which have no catalogue entry.
    custom_ist_benotet = Column(Boolean, nullable=True)
    # Sprint 4 Phase 5: Links custom ERGAENZEND sub-modules to their parent PFLICHT module.
    # Set automatically on add_module() for custom BIN-209 sub-modules.
    # Used by gpa_service to compute BIN-209 GPA contribution via avg of sub-module notes.
    parent_module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
