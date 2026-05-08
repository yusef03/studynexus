"""add pruefungsart and sws to modules

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-08 10:00:00.000000

Sprint 4 Phase 1 (ADR-018):
- pruefungsart VARCHAR(20) NULLABLE — exam type per module, from ATPO-FIV 2025 §7
    PX     = Prüfung (Klausur oder mündliche Prüfung, 90 Min.)
    EA     = Experimentelle Arbeit
    R      = Referat
    BAA+Ko = Bachelorarbeit mit Kolloquium
- sws SMALLINT NULLABLE — Semesterwochenstunden from Modulhandbuch BIN 19WS
    NULL = not applicable (Praxisprojekte, Bachelorarbeit, complex modules)

Seed: all 37 BIN modules (28 PFLICHT + 9 WAHLPFLICHT) updated with
pruefungsart and sws values per PO BIN 2019 Anlage B1/B2 + Modulhandbuch BIN 19WS.
"""
from alembic import op
import sqlalchemy as sa


revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # ── 1. Add pruefungsart column ─────────────────────────────────────────────
    op.add_column('modules', sa.Column('pruefungsart', sa.String(20), nullable=True))

    # ── 2. Add sws column ─────────────────────────────────────────────────────
    op.add_column('modules', sa.Column('sws', sa.SmallInteger(), nullable=True))

    # ── 3. Seed pruefungsart + sws for all BIN modules ────────────────────────
    # Source: ATPO-FIV 2025 §7 + PO BIN 2019 Anlage B1/B2 + Modulhandbuch BIN 19WS
    #
    # pruefungsart codes:
    #   PX     = Klausur oder mündliche Prüfung (Standard)
    #   EA     = Experimentelle Arbeit
    #   R      = Referat
    #   BAA+Ko = Bachelorarbeit mit Kolloquium
    #
    # sws: Semesterwochenstunden. NULL for project/thesis work with no fixed schedule.

    module_seed = [
        # 1. Studienabschnitt — Semester 1
        ("BIN-100", "PX",     4),
        ("BIN-101", "PX",     4),
        ("BIN-102", "PX",     4),
        ("BIN-103", "PX",     4),
        ("BIN-104", "PX",     4),
        ("BIN-116", "PX",     2),   # Englisch — 2 SWS
        # Semester 2
        ("BIN-105", "PX",     4),
        ("BIN-106", "PX",     4),
        ("BIN-107", "PX",     4),
        ("BIN-108", "PX",     4),
        ("BIN-109", "PX",     4),
        # Semester 3
        ("BIN-110", "PX",     4),
        ("BIN-111", "PX",     4),
        ("BIN-112", "PX",     4),
        ("BIN-113", "PX",     4),
        ("BIN-114", "EA",     4),   # Programmierprojekt — Experimentelle Arbeit
        ("BIN-115", "PX",     2),   # Betriebswirtschaft — 2 SWS
        # 2. Studienabschnitt — Semester 4
        ("BIN-200", "PX",     4),
        ("BIN-201", "PX",     4),
        ("BIN-202", "PX",     4),
        ("BIN-203", "PX",     4),
        ("BIN-204", "R",      2),   # Seminar — Referat, 2 SWS
        # Semester 5
        ("BIN-205", "PX",     4),
        ("BIN-206", "EA",     None),  # Praxisprojekt 1 — EA, kein fixer SWS-Rhythmus
        ("BIN-207", "PX",     4),
        # Semester 6
        ("BIN-208", "EA",     None),  # Praxisprojekt 2 — EA, kein fixer SWS-Rhythmus
        ("BIN-210", "BAA+Ko", None),  # Bachelorarbeit mit Kolloquium
        # BIN-209 Ergänzende Fächer: 3 × 2 ECTS Fächer, SWS variiert pro Fach
        ("BIN-209", "PX",     None),
        # WAHLPFLICHT (Sem 5–6)
        ("BIN-211", "PX",     4),
        ("BIN-212", "PX",     4),
        ("BIN-213", "PX",     4),
        ("BIN-214", "PX",     4),
        ("BIN-215", "PX",     4),
        ("BIN-216", "PX",     4),
        ("BIN-217", "PX",     4),
        ("BIN-218", "PX",     4),
        ("BIN-219", "PX",     4),
    ]

    for kuerzel, pruefungsart, sws in module_seed:
        if sws is not None:
            bind.execute(sa.text(
                "UPDATE modules SET pruefungsart = :pa, sws = :sws WHERE kuerzel = :k"
            ), {"pa": pruefungsart, "sws": sws, "k": kuerzel})
        else:
            bind.execute(sa.text(
                "UPDATE modules SET pruefungsart = :pa, sws = NULL WHERE kuerzel = :k"
            ), {"pa": pruefungsart, "k": kuerzel})


def downgrade() -> None:
    op.drop_column('modules', 'sws')
    op.drop_column('modules', 'pruefungsart')
