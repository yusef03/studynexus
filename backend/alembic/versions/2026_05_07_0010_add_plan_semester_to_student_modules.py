"""add plan_semester to student_modules

Revision ID: 3f8a9b0c1d2e
Revises: 7a4f52690f1a
Create Date: 2026-05-07 14:00:00.000000

Adds a separate planning field for the StudyPlanBoard (/study-plan).
- `semester`      → administrative/grades context (ModuleList, /modules page)
- `plan_semester` → user's personal study planning (StudyPlanBoard only)

The two fields are intentionally decoupled so that rearranging modules in the
visual StudyPlanBoard never affects the grade-tracking view, and vice versa.

When plan_semester IS NULL the StudyPlanBoard falls back to
module.semester_empfehlung, so new programs populate automatically.
"""
from alembic import op
import sqlalchemy as sa


revision = '3f8a9b0c1d2e'
down_revision = '7a4f52690f1a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'student_modules',
        sa.Column('plan_semester', sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('student_modules', 'plan_semester')
