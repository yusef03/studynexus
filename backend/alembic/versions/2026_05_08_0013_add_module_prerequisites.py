"""add module_prerequisites table and parent_module_id to student_modules

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-08 14:00:00.000000

Sprint 4 Phase 5 (ADR-010):
- Creates module_prerequisites table (id, module_id, required_module_id,
  minimum_ects, required_semesters, prerequisite_type, description)
- prerequisite_type: SEMESTER_COMPLETE | ECTS_THRESHOLD | MODULE
- required_semesters: comma-separated int string e.g. "1", "1,2", "1,2,3"
- Adds parent_module_id (UUID FK → modules) to student_modules for BIN-209 GPA fix:
  custom ERGAENZEND sub-modules are linked to their parent PFLICHT module.
- Seeds all BIN PO §6 prerequisite rules.
- Backfills parent_module_id for existing custom ERGAENZEND student_modules.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Create module_prerequisites table (enum type created automatically) ─
    op.create_table(
        "module_prerequisites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("module_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("modules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("required_module_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("modules.id", ondelete="CASCADE"), nullable=True),
        sa.Column("minimum_ects", sa.Integer(), nullable=True),
        sa.Column("required_semesters", sa.String(), nullable=True),
        sa.Column("prerequisite_type",
                  sa.Enum("MODULE", "ECTS_THRESHOLD", "SEMESTER_COMPLETE",
                           name="prerequisite_type"),
                  nullable=False),
        sa.Column("description", sa.String(), nullable=False),
    )
    op.create_index("ix_module_prerequisites_module_id", "module_prerequisites", ["module_id"])

    # ── 3. Add parent_module_id to student_modules ────────────────────────────
    op.add_column(
        "student_modules",
        sa.Column("parent_module_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("modules.id", ondelete="SET NULL"), nullable=True),
    )

    bind = op.get_bind()

    # ── 4. Seed BIN PO §6 prerequisite rules ─────────────────────────────────
    #
    # Sem 4 modules (BIN-200..204): require all Sem 1 PFLICHT passed
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, required_semesters, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, '1', "
        "       CAST('SEMESTER_COMPLETE' AS prerequisite_type), "
        "       'Alle Prüfungen Sem 1 bestanden' "
        "FROM modules m "
        "WHERE m.kuerzel IN ('BIN-200', 'BIN-201', 'BIN-202', 'BIN-203', 'BIN-204')"
    ))

    # Sem 5 standard modules (BIN-205, BIN-207): require Sem 1+2 passed
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, required_semesters, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, '1,2', "
        "       CAST('SEMESTER_COMPLETE' AS prerequisite_type), "
        "       'Alle Prüfungen Sem 1+2 bestanden' "
        "FROM modules m "
        "WHERE m.kuerzel IN ('BIN-205', 'BIN-207')"
    ))

    # BIN-206 Praxisprojekt 1: requires Vorprüfung (Sem 1+2+3) — PO §6 Sonderregel
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, required_semesters, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, '1,2,3', "
        "       CAST('SEMESTER_COMPLETE' AS prerequisite_type), "
        "       'Bachelor-Vorprüfung bestanden (alle Prüfungen Sem 1–3)' "
        "FROM modules m "
        "WHERE m.kuerzel = 'BIN-206'"
    ))

    # BIN-208 Praxisprojekt 2: requires Vorprüfung (Sem 1+2+3)
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, required_semesters, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, '1,2,3', "
        "       CAST('SEMESTER_COMPLETE' AS prerequisite_type), "
        "       'Alle Prüfungen Sem 1–3 bestanden' "
        "FROM modules m "
        "WHERE m.kuerzel = 'BIN-208'"
    ))

    # BIN-210 Bachelorarbeit: requires Vorprüfung (Sem 1+2+3) + 134 ECTS
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, required_semesters, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, '1,2,3', "
        "       CAST('SEMESTER_COMPLETE' AS prerequisite_type), "
        "       'Bachelor-Vorprüfung bestanden (alle Prüfungen Sem 1–3)' "
        "FROM modules m "
        "WHERE m.kuerzel = 'BIN-210'"
    ))
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, minimum_ects, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, 134, "
        "       CAST('ECTS_THRESHOLD' AS prerequisite_type), "
        "       'Mindestens 134 ECTS erreicht' "
        "FROM modules m "
        "WHERE m.kuerzel = 'BIN-210'"
    ))

    # WAHLPFLICHT (BIN-211..219): require Sem 1+2 passed (Sem 5 access per PO §6)
    bind.execute(sa.text(
        "INSERT INTO module_prerequisites "
        "(id, module_id, required_semesters, prerequisite_type, description) "
        "SELECT gen_random_uuid(), m.id, '1,2', "
        "       CAST('SEMESTER_COMPLETE' AS prerequisite_type), "
        "       'Alle Prüfungen Sem 1+2 bestanden' "
        "FROM modules m "
        "WHERE m.kuerzel IN ("
        "  'BIN-211','BIN-212','BIN-213','BIN-214','BIN-215',"
        "  'BIN-216','BIN-217','BIN-218','BIN-219'"
        ")"
    ))

    # ── 5. Backfill parent_module_id for existing custom ERGAENZEND modules ───
    # Custom student_modules (module_id IS NULL) are BIN-209 sub-modules.
    # Link them to the BIN-209 catalogue entry of the user's exam regulation.
    bind.execute(sa.text(
        "UPDATE student_modules "
        "SET parent_module_id = m.id "
        "FROM modules m "
        "JOIN exam_regulations er ON er.id = m.exam_regulation_id "
        "JOIN programs p ON p.id = er.program_id "
        "JOIN user_programs up ON up.exam_regulation_id = er.id "
        "WHERE m.kuerzel = 'BIN-209' "
        "  AND p.name = 'Angewandte Informatik' "
        "  AND student_modules.module_id IS NULL "
        "  AND student_modules.custom_name IS NOT NULL "
        "  AND up.user_id = student_modules.user_id"
    ))


def downgrade() -> None:
    op.drop_column("student_modules", "parent_module_id")
    op.drop_table("module_prerequisites")
    op.execute("DROP TYPE IF EXISTS prerequisite_type")
