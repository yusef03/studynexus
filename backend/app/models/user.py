import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    matrikelnummer = Column(String, nullable=True, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_code = Column(String, nullable=True)
    verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    preferred_language = Column(String(2), default="de", nullable=False)

    # Profile fields
    birth_date = Column(DateTime(timezone=True), nullable=True)
    university = Column(String, nullable=True)
    profile_picture_url = Column(String, nullable=True)

    # Admin fields (Sprint 5, Migration 0015)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=True)

    # Python default keeps the field populated before DB flush (needed for tests/serialisation)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
