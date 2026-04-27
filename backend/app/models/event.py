import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, DateTime, Time
from sqlalchemy.dialects.postgresql import UUID, ENUM as PG_ENUM
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class EventType(str, enum.Enum):
    LECTURE = "LECTURE"
    EXERCISE = "EXERCISE"
    TUTORIAL = "TUTORIAL"
    SEMINAR = "SEMINAR"
    PRACTICUM = "PRACTICUM"
    EXAM = "EXAM"
    CUSTOM_STUDY = "CUSTOM_STUDY"
    WORK = "WORK"
    LIFE = "LIFE"
    FOCUS = "FOCUS"

event_type_enum = PG_ENUM(EventType, name="eventtype", create_type=False)

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("student_modules.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(255), nullable=False)
    event_type = Column(event_type_enum, nullable=False, default=EventType.CUSTOM_STUDY)
    semester_tag = Column(String(50), nullable=True) # e.g. "WiSe2425"
    is_recurring = Column(Boolean, nullable=False, default=False)
    day_of_week = Column(Integer, nullable=True) # 0-6
    event_date = Column(DateTime(timezone=True), nullable=True) # For block seminars or exams
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    location = Column(String(255), nullable=True)
    lecturer = Column(String(255), nullable=True)
    is_hidden = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    user = relationship("User")
    module = relationship("StudentModule")
