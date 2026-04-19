"""fix module data: kuerzel, gewichtung, ects, has_prerequisites, wahlpflicht catalog

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-18 00:00:00.000000

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "modules",
        sa.Column("has_prerequisites", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    bind = op.get_bind()

    # Set has_prerequisites=True for all PFLICHT and WAHLPFLICHT modules
    bind.execute(sa.text(
        "UPDATE modules SET has_prerequisites = TRUE "
        "WHERE CAST(modul_typ AS text) IN ('PFLICHT', 'WAHLPFLICHT')"
    ))

    # Populate kuerzel (ERGAENZEND modules and "Wahlpflichtfach" placeholders left as NULL)
    kuerzel_map = [
        ("Programmieren 1",               "BIN-101"),
        ("Grundlagen der Informatik",      "BIN-102"),
        ("Mathematik 1",                   "BIN-103"),
        ("Theoretische Informatik",        "BIN-104"),
        ("Startprojekt",                   "BIN-105"),
        ("Englisch",                       "BIN-106"),
        ("Programmieren 2",                "BIN-201"),
        ("Datenbanksysteme 1",             "BIN-202"),
        ("Mathematik 2",                   "BIN-203"),
        ("Statistik",                      "BIN-204"),
        ("Algorithmen und Datenstrukturen","BIN-205"),
        ("Programmieren 3",                "BIN-301"),
        ("Datenbanksysteme 2",             "BIN-302"),
        ("Mathematik 3",                   "BIN-303"),
        ("Betriebssysteme und Netze 1",    "BIN-304"),
        ("Programmierprojekt",             "BIN-305"),
        ("Betriebswirtschaft",             "BIN-306"),
        ("Webtechnologien",                "BIN-401"),
        ("Software Engineering 1",         "BIN-402"),
        ("Computergrafik 1",               "BIN-403"),
        ("Betriebssysteme und Netze 2",    "BIN-404"),
        ("Seminar",                        "BIN-405"),
        ("Wahlpflichtfach Informatik 1",   "BIN-501"),
        ("Software Engineering 2",         "BIN-502"),
        ("Computergrafik 2",               "BIN-503"),
        ("Praxisprojekt 1",                "BIN-504"),
        ("Wahlpflichtfach Informatik 2",   "BIN-601"),
        ("Praxisprojekt 2",                "BIN-602"),
        ("Bachelor-Arbeit mit Kolloquium", "BIN-603"),
    ]

    for name, kuerzel in kuerzel_map:
        bind.execute(
            sa.text("UPDATE modules SET kuerzel = :k WHERE name = :n"),
            {"k": kuerzel, "n": name},
        )

    # Fix gewichtung
    gewichtung_fixes = [
        ("Startprojekt",                   0.0),
        ("Programmierprojekt",             0.0),
        ("Betriebswirtschaft",             0.5),
        ("Englisch",                       0.5),
        ("Praxisprojekt 1",                0.0),
        ("Praxisprojekt 2",                0.0),
        ("Bachelor-Arbeit mit Kolloquium", 4.0),
    ]

    for name, gew in gewichtung_fixes:
        bind.execute(
            sa.text("UPDATE modules SET gewichtung = :g WHERE name = :n"),
            {"g": gew, "n": name},
        )

    # Fix ECTS
    bind.execute(sa.text("UPDATE modules SET ects = 7  WHERE name = 'Praxisprojekt 2'"))
    bind.execute(sa.text("UPDATE modules SET ects = 15 WHERE name = 'Bachelor-Arbeit mit Kolloquium'"))

    # Insert 9 Wahlpflichtmodule — resolve er_id at runtime
    result = bind.execute(sa.text(
        "SELECT er.id FROM exam_regulations er "
        "JOIN programs p ON p.id = er.program_id "
        "WHERE p.name = 'Angewandte Informatik' AND er.version = 'PO 19 WiSe'"
    ))
    er_id = str(result.scalar())

    wahlpflicht_catalog = [
        ("BIN-211", "Computergrafik 3"),
        ("BIN-212", "Erweiterte Webentwicklung"),
        ("BIN-213", "Machine Learning Grundlagen"),
        ("BIN-214", "Mobile Computing"),
        ("BIN-215", "IT-Sicherheit"),
        ("BIN-216", "Verteilte Systeme"),
        ("BIN-217", "Cloud Computing"),
        ("BIN-218", "Data Science"),
        ("BIN-219", "Kryptographie und Algorithmen"),
    ]

    for kuerzel, name in wahlpflicht_catalog:
        bind.execute(
            sa.text(
                "INSERT INTO modules "
                "(id, exam_regulation_id, name, kuerzel, ects, semester_empfehlung, "
                "modul_typ, ist_benotet, max_versuche, gewichtung, has_prerequisites) "
                "VALUES (:id, :er_id, :name, :kuerzel, 6, NULL, "
                "CAST('WAHLPFLICHT' AS modul_typ), TRUE, 3, 1.0, TRUE)"
            ),
            {"id": str(uuid.uuid4()), "er_id": er_id, "name": name, "kuerzel": kuerzel},
        )


def downgrade() -> None:
    bind = op.get_bind()

    # Remove the 9 new Wahlpflichtmodule
    bind.execute(sa.text(
        "DELETE FROM modules WHERE kuerzel IN ("
        "'BIN-211','BIN-212','BIN-213','BIN-214','BIN-215',"
        "'BIN-216','BIN-217','BIN-218','BIN-219')"
    ))

    # Revert ECTS
    bind.execute(sa.text("UPDATE modules SET ects = 10 WHERE name = 'Praxisprojekt 2'"))
    bind.execute(sa.text("UPDATE modules SET ects = 12 WHERE name = 'Bachelor-Arbeit mit Kolloquium'"))

    # Revert gewichtung to 1.0
    for name in [
        "Startprojekt", "Programmierprojekt", "Betriebswirtschaft",
        "Englisch", "Praxisprojekt 1", "Praxisprojekt 2", "Bachelor-Arbeit mit Kolloquium",
    ]:
        bind.execute(
            sa.text("UPDATE modules SET gewichtung = 1.0 WHERE name = :n"),
            {"n": name},
        )

    # Revert kuerzel to NULL
    bind.execute(sa.text("UPDATE modules SET kuerzel = NULL"))

    op.drop_column("modules", "has_prerequisites")
