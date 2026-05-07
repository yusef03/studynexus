"""fix BIN module data and add custom_ist_benotet to student_modules

Revision ID: b2c3d4e5f6a7
Revises: 3f8a9b0c1d2e
Create Date: 2026-05-07 16:00:00.000000

- Add custom_ist_benotet (Boolean, nullable) to student_modules so that custom
  ERGAENZEND modules (which have no catalogue entry) can store their own
  ist_benotet value independently of module.ist_benotet.
- Delete fake ERGAENZEND placeholder modules (Ergänzendes Fach BWL/1/2)
  and fake WAHLPFLICHT placeholders (Wahlpflichtfach Informatik 1/2).
- Fix all 27 BIN PFLICHT modules: correct kuerzel (BIN-100..BIN-210),
  ECTS, ist_benotet, has_prerequisites (FALSE for Sem 1-3, TRUE for Sem 4+),
  gewichtung, semester_empfehlung per PO BIN 2019 WiSe.
- Fix all 9 WAHLPFLICHT catalogue names (BIN-211..219) and set
  semester_empfehlung=5 (was NULL).
- Insert BIN-209 "Ergänzende Fächer" (PFLICHT, Sem 4, 6 ECTS).
- Auto-provision BIN-209 for existing BIN program users.
"""
from alembic import op
import sqlalchemy as sa


revision = 'b2c3d4e5f6a7'
down_revision = '3f8a9b0c1d2e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Add custom_ist_benotet column ──────────────────────────────────────
    op.add_column(
        'student_modules',
        sa.Column('custom_ist_benotet', sa.Boolean(), nullable=True),
    )

    bind = op.get_bind()

    # ── 2. Remove student_module rows for fake placeholder modules ────────────
    bind.execute(sa.text(
        "DELETE FROM student_modules WHERE module_id IN ("
        "  SELECT id FROM modules WHERE name IN ("
        "    'Ergänzendes Fach BWL', 'Ergänzendes Fach 1', 'Ergänzendes Fach 2',"
        "    'Wahlpflichtfach Informatik 1', 'Wahlpflichtfach Informatik 2'"
        "  )"
        ")"
    ))

    # ── 3. Delete fake placeholder catalogue entries ───────────────────────────
    bind.execute(sa.text(
        "DELETE FROM modules WHERE name IN ("
        "  'Ergänzendes Fach BWL', 'Ergänzendes Fach 1', 'Ergänzendes Fach 2',"
        "  'Wahlpflichtfach Informatik 1', 'Wahlpflichtfach Informatik 2'"
        ")"
    ))

    # ── 4. Fix all PFLICHT modules per PO BIN 2019 WiSe ──────────────────────
    #   (name, kuerzel, ects, sem, ist_benotet, has_prerequisites, gewichtung)
    #   has_prerequisites: FALSE for 1. Studienabschnitt (BIN-100..116),
    #                      TRUE  for 2. Studienabschnitt (BIN-200+)
    pflicht_fixes = [
        ("Mathematik 1",                   "BIN-100", 6,  1, True,  False, 1.0),
        ("Startprojekt",                   "BIN-101", 4,  1, True,  False, 0.0),
        ("Programmieren 1",                "BIN-102", 6,  1, True,  False, 1.0),
        ("Grundlagen der Informatik",      "BIN-103", 6,  1, True,  False, 1.0),
        ("Theoretische Informatik",        "BIN-104", 6,  1, True,  False, 1.0),
        ("Englisch",                       "BIN-116", 2,  1, True,  False, 0.5),
        ("Mathematik 2",                   "BIN-105", 6,  2, True,  False, 1.0),
        ("Datenbanksysteme 1",             "BIN-106", 6,  2, True,  False, 1.0),
        ("Statistik",                      "BIN-107", 6,  2, True,  False, 1.0),
        ("Programmieren 2",                "BIN-108", 6,  2, True,  False, 1.0),
        ("Algorithmen und Datenstrukturen","BIN-109", 6,  2, True,  False, 1.0),
        ("Programmieren 3",                "BIN-110", 6,  3, True,  False, 1.0),
        ("Mathematik 3",                   "BIN-111", 6,  3, True,  False, 1.0),
        ("Betriebssysteme und Netze 1",    "BIN-112", 6,  3, True,  False, 1.0),
        ("Datenbanksysteme 2",             "BIN-113", 6,  3, True,  False, 1.0),
        ("Programmierprojekt",             "BIN-114", 4,  3, False, False, 0.0),
        ("Betriebswirtschaft",             "BIN-115", 2,  3, True,  False, 0.5),
        ("Computergrafik 1",               "BIN-200", 6,  4, True,  True,  1.0),
        ("Software Engineering 1",         "BIN-201", 6,  4, True,  True,  1.0),
        ("Betriebssysteme und Netze 2",    "BIN-202", 6,  4, True,  True,  1.0),
        ("Webtechnologien",                "BIN-203", 6,  4, True,  True,  1.0),
        ("Seminar",                        "BIN-204", 4,  4, False, True,  0.0),
        ("Software Engineering 2",         "BIN-205", 6,  5, True,  True,  1.0),
        ("Praxisprojekt 1",                "BIN-206", 10, 5, False, True,  0.0),
        ("Computergrafik 2",               "BIN-207", 6,  5, True,  True,  1.0),
        ("Praxisprojekt 2",                "BIN-208", 7,  6, False, True,  0.0),
        ("Bachelor-Arbeit mit Kolloquium", "BIN-210", 15, 6, True,  True,  4.0),
    ]

    for name, kuerzel, ects, sem, benotet, prereq, gew in pflicht_fixes:
        bind.execute(
            sa.text(
                "UPDATE modules SET kuerzel = :kuerzel, ects = :ects, "
                "semester_empfehlung = :sem, ist_benotet = :benotet, "
                "has_prerequisites = :prereq, gewichtung = :gew "
                "WHERE name = :name AND CAST(modul_typ AS text) = 'PFLICHT'"
            ),
            {"kuerzel": kuerzel, "ects": ects, "sem": sem, "benotet": benotet,
             "prereq": prereq, "gew": gew, "name": name},
        )

    # ── 5. Fix WAHLPFLICHT catalogue names and set semester_empfehlung=5 ──────
    wp_fixes = [
        ("BIN-211", "Computergrafik 3"),
        ("BIN-212", "Software Engineering 3"),
        ("BIN-213", "Betriebssysteme und Netze 3"),
        ("BIN-214", "Datenbanksysteme 3"),
        ("BIN-215", "Parallele Programmierung"),
        ("BIN-216", "Aktuelle Aspekte der Informatik 1"),
        ("BIN-217", "Aktuelle Aspekte der Informatik 2"),
        ("BIN-218", "Wissenschaftliches Arbeiten in der Informatik"),
        ("BIN-219", "Kryptographie und Algorithmen"),
    ]

    for kuerzel, name in wp_fixes:
        bind.execute(
            sa.text(
                "UPDATE modules SET name = :name, semester_empfehlung = 5, "
                "has_prerequisites = TRUE "
                "WHERE kuerzel = :kuerzel AND CAST(modul_typ AS text) = 'WAHLPFLICHT'"
            ),
            {"name": name, "kuerzel": kuerzel},
        )

    # ── 6. Insert BIN-209 "Ergänzende Fächer" ────────────────────────────────
    #   6 ECTS container module. Student adds individual Ergänzende Fächer
    #   as custom ERGAENZEND modules (2 ECTS each, min. 3 subjects).
    #   has_prerequisites=FALSE: the PO container itself has no formal prereq.
    bind.execute(sa.text(
        "INSERT INTO modules "
        "(id, exam_regulation_id, name, kuerzel, ects, semester_empfehlung, "
        " modul_typ, ist_benotet, max_versuche, gewichtung, has_prerequisites) "
        "SELECT gen_random_uuid(), er.id, 'Ergänzende Fächer', 'BIN-209', 6, 4, "
        "       CAST('PFLICHT' AS modul_typ), TRUE, 2, 1.0, FALSE "
        "FROM exam_regulations er "
        "JOIN programs p ON p.id = er.program_id "
        "WHERE p.name = 'Angewandte Informatik' AND er.version = 'PO 19 WiSe'"
    ))

    # ── 7. Auto-provision BIN-209 for existing BIN program users ─────────────
    bind.execute(sa.text(
        "INSERT INTO student_modules (id, user_id, module_id, status, versuch_nummer) "
        "SELECT gen_random_uuid(), up.user_id, m.id, "
        "       CAST('PLANNED' AS studiengang_status), 1 "
        "FROM user_programs up "
        "JOIN exam_regulations er ON er.id = up.exam_regulation_id "
        "JOIN programs p ON p.id = er.program_id "
        "JOIN modules m ON m.kuerzel = 'BIN-209' AND m.exam_regulation_id = er.id "
        "WHERE p.name = 'Angewandte Informatik' "
        "AND NOT EXISTS ("
        "  SELECT 1 FROM student_modules sm2 "
        "  WHERE sm2.user_id = up.user_id AND sm2.module_id = m.id"
        ")"
    ))


def downgrade() -> None:
    op.drop_column('student_modules', 'custom_ist_benotet')
