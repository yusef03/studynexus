"""add soft delete fields to modules, programs, exam_regulations

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-05-09 12:10:00.000000

Sprint 5 Phase 1 (ADR-020): Soft-delete (is_archived) instead of hard delete to preserve
student data integrity. Archived entries are hidden from all public GET endpoints via
is_archived = false filter. Admin endpoints accept ?include_archived=true.
archive_reason is required for ARCHIVE actions and stored in audit log.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "b8c9d0e1f2a3"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None

_TABLES = ("modules", "exam_regulations", "programs")


def upgrade() -> None:
    for table in _TABLES:
        op.add_column(table, sa.Column("is_archived", sa.Boolean(), nullable=False, server_default="false"))
        op.add_column(table, sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
        op.add_column(table, sa.Column("archived_by", UUID(as_uuid=True), nullable=True))
        op.add_column(table, sa.Column("archive_reason", sa.Text(), nullable=True))
        op.create_foreign_key(
            f"fk_{table}_archived_by",
            table, "users",
            ["archived_by"], ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    for table in reversed(_TABLES):
        op.drop_constraint(f"fk_{table}_archived_by", table, type_="foreignkey")
        op.drop_column(table, "archive_reason")
        op.drop_column(table, "archived_by")
        op.drop_column(table, "archived_at")
        op.drop_column(table, "is_archived")
