import uuid
import enum
from sqlalchemy import Column, String, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class PrerequisiteType(str, enum.Enum):
    MODULE = "MODULE"
    ECTS_THRESHOLD = "ECTS_THRESHOLD"
    SEMESTER_COMPLETE = "SEMESTER_COMPLETE"


class ModulePrerequisite(Base):
    __tablename__ = "module_prerequisites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # The module whose access depends on this prerequisite
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    # For type=MODULE: a specific module the student must have PASSED
    required_module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    # For type=ECTS_THRESHOLD: minimum earned ECTS required
    minimum_ects = Column(Integer, nullable=True)
    # For type=SEMESTER_COMPLETE: comma-separated semester numbers, e.g. "1", "1,2", "1,2,3"
    required_semesters = Column(String, nullable=True)
    prerequisite_type = Column(Enum(PrerequisiteType, name="prerequisite_type"), nullable=False)
    description = Column(String, nullable=False)
