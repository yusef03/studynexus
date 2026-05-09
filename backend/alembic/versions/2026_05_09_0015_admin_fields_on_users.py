"""add admin fields to users table

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-09 12:00:00.000000

Sprint 5 Phase 1 (ADR-021): Adds is_admin flag for JWT claim and admin-panel access,
last_login_at for User-Management UI, admin_notes for internal Super-Admin remarks.

Admin seeding is intentionally NOT done here — set manually after first login:
  docker compose exec db psql -U studynexus -d studynexus \
    -c "UPDATE users SET is_admin = TRUE WHERE email = 'your@email.de';"
"""
from alembic import op
import sqlalchemy as sa

revision = "f6a7b8c9d0e1"
down_revision = "e5f6a7b8c9d0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("admin_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "admin_notes")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "is_admin")
