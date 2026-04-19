import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ModulTyp(str, enum.Enum):
    PFLICHT = "PFLICHT"
    WAHLPFLICHT = "WAHLPFLICHT"
    ERGAENZEND = "ERGAENZEND"


class Module(Base):
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_regulation_id = Column(UUID(as_uuid=True), ForeignKey("exam_regulations.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    kuerzel = Column(String, nullable=True)
    ects = Column(Integer, nullable=False)
    semester_empfehlung = Column(Integer, nullable=True)
    modul_typ = Column(Enum(ModulTyp, name="modul_typ"), nullable=False, default=ModulTyp.PFLICHT)
    ist_benotet = Column(Boolean, nullable=False, default=True)
    max_versuche = Column(Integer, nullable=False, default=3)
    gewichtung = Column(Float, nullable=False, default=1.0)
