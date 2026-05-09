"""create admin_audit_logs table

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-05-09 12:05:00.000000

Sprint 5 Phase 1 (ADR-019): Immutable audit trail for every admin mutation.
Stores action, entity type/id/label, old/new JSON snapshots, reason (required
for ARCHIVE/DELETE), and IP address. Three indexes cover common query patterns:
by admin, by entity, and by recency (DESC).
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_audit_logs",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("admin_id", UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", UUID(as_uuid=True), nullable=True),
        sa.Column("entity_label", sa.String(200), nullable=True),
        sa.Column("old_value", JSONB, nullable=True),
        sa.Column("new_value", JSONB, nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_foreign_key(
        "fk_audit_admin_id",
        "admin_audit_logs", "users",
        ["admin_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index("idx_audit_admin_id", "admin_audit_logs", ["admin_id"])
    op.create_index("idx_audit_entity", "admin_audit_logs", ["entity_type", "entity_id"])
    op.execute("CREATE INDEX idx_audit_created ON admin_audit_logs(created_at DESC)")


def downgrade() -> None:
    op.drop_table("admin_audit_logs")
