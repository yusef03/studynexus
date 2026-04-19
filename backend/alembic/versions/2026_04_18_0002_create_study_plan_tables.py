"""create study plan tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-18 00:00:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

modul_typ_enum = postgresql.ENUM("PFLICHT", "WAHLPFLICHT", "ERGAENZEND", name="modul_typ")
studiengang_status_enum = postgresql.ENUM("PLANNED", "REGISTERED", "PASSED", "FAILED", name="studiengang_status")


def upgrade() -> None:
    op.create_table(
        "universities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("kuerzel", sa.String(), nullable=False),
        sa.Column("stadt", sa.String(), nullable=False),
        sa.Column("bundesland", sa.String(), nullable=False),
        sa.Column("typ", sa.String(), nullable=False),
    )

    op.create_table(
        "faculties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("university_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("universities.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("kuerzel", sa.String(), nullable=False),
    )
    op.create_index("ix_faculties_university_id", "faculties", ["university_id"])

    op.create_table(
        "programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("faculty_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("faculties.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("abschluss", sa.String(), nullable=False),
        sa.Column("regelstudienzeit", sa.Integer(), nullable=False),
        sa.Column("gesamt_ects", sa.Integer(), nullable=False),
    )
    op.create_index("ix_programs_faculty_id", "programs", ["faculty_id"])

    op.create_table(
        "exam_regulations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("gueltig_ab", sa.Date(), nullable=True),
        sa.Column("ist_aktuell", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_exam_regulations_program_id", "exam_regulations", ["program_id"])

    op.create_table(
        "modules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("exam_regulation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exam_regulations.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("kuerzel", sa.String(), nullable=True),
        sa.Column("ects", sa.Integer(), nullable=False),
        sa.Column("semester_empfehlung", sa.Integer(), nullable=True),
        sa.Column("modul_typ", modul_typ_enum, nullable=False, server_default="PFLICHT"),
        sa.Column("ist_benotet", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("max_versuche", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("gewichtung", sa.Float(), nullable=False, server_default="1.0"),
    )
    op.create_index("ix_modules_exam_regulation_id", "modules", ["exam_regulation_id"])

    op.create_table(
        "user_programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("exam_regulation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exam_regulations.id"), nullable=False),
        sa.Column("start_semester", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_programs_user_id", "user_programs", ["user_id"])

    op.create_table(
        "student_modules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("modules.id"), nullable=True),
        sa.Column("custom_name", sa.String(), nullable=True),
        sa.Column("custom_ects", sa.Integer(), nullable=True),
        sa.Column("status", studiengang_status_enum, nullable=False, server_default="PLANNED"),
        sa.Column("note", sa.Float(), nullable=True),
        sa.Column("versuch_nummer", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("anmelde_datum", sa.DateTime(timezone=True), nullable=True),
        sa.Column("pruefungs_datum", sa.DateTime(timezone=True), nullable=True),
        sa.Column("semester", sa.String(), nullable=True),
    )
    op.create_index("ix_student_modules_user_id", "student_modules", ["user_id"])
    op.create_index("ix_student_modules_module_id", "student_modules", ["module_id"])

    _seed_hochschule_hannover()


def downgrade() -> None:
    op.drop_index("ix_student_modules_module_id", table_name="student_modules")
    op.drop_index("ix_student_modules_user_id", table_name="student_modules")
    op.drop_table("student_modules")

    op.drop_index("ix_user_programs_user_id", table_name="user_programs")
    op.drop_table("user_programs")

    op.drop_index("ix_modules_exam_regulation_id", table_name="modules")
    op.drop_table("modules")

    op.drop_index("ix_exam_regulations_program_id", table_name="exam_regulations")
    op.drop_table("exam_regulations")

    op.drop_index("ix_programs_faculty_id", table_name="programs")
    op.drop_table("programs")

    op.drop_index("ix_faculties_university_id", table_name="faculties")
    op.drop_table("faculties")

    op.drop_table("universities")

    modul_typ_enum.drop(op.get_bind(), checkfirst=True)
    studiengang_status_enum.drop(op.get_bind(), checkfirst=True)


# ── Seed data: Hochschule Hannover ────────────────────────────────────────────

def _seed_hochschule_hannover() -> None:
    bind = op.get_bind()

    uni_id = str(uuid.uuid4())
    fac_id = str(uuid.uuid4())
    prog_id = str(uuid.uuid4())
    er_id = str(uuid.uuid4())

    bind.execute(
        sa.text(
            "INSERT INTO universities (id, name, kuerzel, stadt, bundesland, typ) "
            "VALUES (:id, :name, :kuerzel, :stadt, :bundesland, :typ)"
        ),
        {"id": uni_id, "name": "Hochschule Hannover", "kuerzel": "HSH",
         "stadt": "Hannover", "bundesland": "Niedersachsen", "typ": "FH"},
    )

    bind.execute(
        sa.text(
            "INSERT INTO faculties (id, university_id, name, kuerzel) "
            "VALUES (:id, :university_id, :name, :kuerzel)"
        ),
        {"id": fac_id, "university_id": uni_id,
         "name": "Fakultät IV - Wirtschaft und Informatik", "kuerzel": "F4"},
    )

    bind.execute(
        sa.text(
            "INSERT INTO programs (id, faculty_id, name, abschluss, regelstudienzeit, gesamt_ects) "
            "VALUES (:id, :faculty_id, :name, :abschluss, :regelstudienzeit, :gesamt_ects)"
        ),
        {"id": prog_id, "faculty_id": fac_id, "name": "Angewandte Informatik",
         "abschluss": "Bachelor", "regelstudienzeit": 6, "gesamt_ects": 180},
    )

    bind.execute(
        sa.text(
            "INSERT INTO exam_regulations (id, program_id, version, gueltig_ab, ist_aktuell) "
            "VALUES (:id, :program_id, :version, :gueltig_ab, :ist_aktuell)"
        ),
        {"id": er_id, "program_id": prog_id, "version": "PO 19 WiSe",
         "gueltig_ab": "2019-10-01", "ist_aktuell": True},
    )

    modules = [
        # Semester 1
        ("Programmieren 1",                  6, 1, "PFLICHT",     True),
        ("Grundlagen der Informatik",         6, 1, "PFLICHT",     True),
        ("Mathematik 1",                      6, 1, "PFLICHT",     True),
        ("Theoretische Informatik",           6, 1, "PFLICHT",     True),
        ("Startprojekt",                      4, 1, "PFLICHT",     False),
        ("Englisch",                          2, 1, "PFLICHT",     True),
        # Semester 2
        ("Programmieren 2",                   6, 2, "PFLICHT",     True),
        ("Datenbanksysteme 1",                6, 2, "PFLICHT",     True),
        ("Mathematik 2",                      6, 2, "PFLICHT",     True),
        ("Statistik",                         6, 2, "PFLICHT",     True),
        ("Algorithmen und Datenstrukturen",   6, 2, "PFLICHT",     True),
        # Semester 3
        ("Programmieren 3",                   6, 3, "PFLICHT",     True),
        ("Datenbanksysteme 2",                6, 3, "PFLICHT",     True),
        ("Mathematik 3",                      6, 3, "PFLICHT",     True),
        ("Betriebssysteme und Netze 1",       6, 3, "PFLICHT",     True),
        ("Programmierprojekt",                4, 3, "PFLICHT",     False),
        ("Betriebswirtschaft",                2, 3, "PFLICHT",     True),
        # Semester 4
        ("Webtechnologien",                   6, 4, "PFLICHT",     True),
        ("Software Engineering 1",            6, 4, "PFLICHT",     True),
        ("Computergrafik 1",                  6, 4, "PFLICHT",     True),
        ("Betriebssysteme und Netze 2",       6, 4, "PFLICHT",     True),
        ("Seminar",                           4, 4, "PFLICHT",     False),
        ("Ergänzendes Fach BWL",              2, 4, "ERGAENZEND",  True),
        # Semester 5
        ("Wahlpflichtfach Informatik 1",      6, 5, "WAHLPFLICHT", True),
        ("Software Engineering 2",            6, 5, "PFLICHT",     True),
        ("Computergrafik 2",                  6, 5, "PFLICHT",     True),
        ("Praxisprojekt 1",                  10, 5, "PFLICHT",     False),
        ("Ergänzendes Fach 1",                2, 5, "ERGAENZEND",  True),
        # Semester 6
        ("Wahlpflichtfach Informatik 2",      6, 6, "WAHLPFLICHT", True),
        ("Praxisprojekt 2",                  10, 6, "PFLICHT",     False),
        ("Bachelor-Arbeit mit Kolloquium",   12, 6, "PFLICHT",     True),
        ("Ergänzendes Fach 2",                2, 6, "ERGAENZEND",  True),
    ]

    for name, ects, sem, typ, ist_benotet in modules:
        bind.execute(
            sa.text(
                "INSERT INTO modules "
                "(id, exam_regulation_id, name, ects, semester_empfehlung, modul_typ, ist_benotet, max_versuche, gewichtung) "
                "VALUES (:id, :er_id, :name, :ects, :sem, CAST(:typ AS modul_typ), :benotet, 3, 1.0)"
            ),
            {
                "id": str(uuid.uuid4()),
                "er_id": er_id,
                "name": name,
                "ects": ects,
                "sem": sem,
                "typ": typ,
                "benotet": ist_benotet,
            },
        )
