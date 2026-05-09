import uuid
from sqlalchemy import Column, String, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ExamRegulation(Base):
    __tablename__ = "exam_regulations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False, index=True)
    version = Column(String, nullable=False)
    gueltig_ab = Column(Date, nullable=True)
    ist_aktuell = Column(Boolean, nullable=False, default=False)

    # Sprint 5 Phase 1 (ADR-020): Soft delete
    is_archived = Column(Boolean, nullable=False, default=False)
    archived_at = Column(DateTime(timezone=True), nullable=True)
    archived_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    archive_reason = Column(Text, nullable=True)
