import uuid
from sqlalchemy import Column, String, Boolean, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ExamRegulation(Base):
    __tablename__ = "exam_regulations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False, index=True)
    version = Column(String, nullable=False)
    gueltig_ab = Column(Date, nullable=True)
    ist_aktuell = Column(Boolean, nullable=False, default=False)
