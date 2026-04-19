import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Program(Base):
    __tablename__ = "programs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("faculties.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    abschluss = Column(String, nullable=False)  # Bachelor or Master
    regelstudienzeit = Column(Integer, nullable=False)
    gesamt_ects = Column(Integer, nullable=False)
