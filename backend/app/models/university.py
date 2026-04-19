import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    kuerzel = Column(String, nullable=False)
    stadt = Column(String, nullable=False)
    bundesland = Column(String, nullable=False)
    typ = Column(String, nullable=False)  # FH or Uni
