"""step3: add visit.is_active soft-delete column

Revision ID: a3b9c1d4e5f6
Revises: 2f81f6eb5f55
Create Date: 2026-04-23 12:00:00.000000

Adds a non-nullable is_active boolean to the visit table to align visit
lifecycle with customers / solutions / templates (all of which already
soft-delete). Existing rows are backfilled to True so the default list
endpoint (which now filters is_active=True) keeps showing them.
"""

import sqlalchemy as sa
from alembic import op

revision = "a3b9c1d4e5f6"
down_revision = "2f81f6eb5f55"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "visit",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    # Drop the server-side default once all existing rows are populated; the
    # model sets default=True in Python, which is sufficient going forward.
    op.alter_column("visit", "is_active", server_default=None)


def downgrade() -> None:
    op.drop_column("visit", "is_active")
