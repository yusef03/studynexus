"""fix BIN-209 gewichtung 1.0 -> 1.5 (PO BIN 2019 Anlage B2)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-09 10:00:00.000000

Sprint 4 Phase 6 — Data correction:
BIN-209 "Ergänzende Fächer" has a GPA weight (gewichtung) of 1.5 per
Anlage B2 of PO BIN 2019. Migration 0011 incorrectly inserted it as 1.0.
This migration corrects the value so the GPA service calculates correctly.
"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE modules
        SET gewichtung = 1.5
        WHERE kuerzel = 'BIN-209'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        UPDATE modules
        SET gewichtung = 1.0
        WHERE kuerzel = 'BIN-209'
        """
    )
