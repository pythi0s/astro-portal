"""Add durable automation delivery tracking.

Revision ID: c8e4f1a2b3d4
Revises: b7c9d1e2f3a4
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c8e4f1a2b3d4"
down_revision: str | None = "b7c9d1e2f3a4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TYPE messagestatus ADD VALUE IF NOT EXISTS 'queued'")
    op.execute("ALTER TYPE messagestatus ADD VALUE IF NOT EXISTS 'delivered'")
    op.execute("ALTER TYPE messagestatus ADD VALUE IF NOT EXISTS 'read'")

    op.add_column(
        "messageschedule",
        sa.Column(
            "automation_rule_id",
            sa.Integer(),
            sa.ForeignKey("automationrule.id"),
            nullable=True,
        ),
    )
    op.add_column("messageschedule", sa.Column("event_key", sa.String(), nullable=True))
    op.create_index(
        "ix_messageschedule_automation_rule_id",
        "messageschedule",
        ["automation_rule_id"],
    )
    op.create_index(
        "ix_messageschedule_event_key",
        "messageschedule",
        ["event_key"],
        unique=True,
    )

    op.add_column(
        "messagelog",
        sa.Column(
            "schedule_id",
            sa.Integer(),
            sa.ForeignKey("messageschedule.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "messagelog",
        sa.Column(
            "automation_rule_id",
            sa.Integer(),
            sa.ForeignKey("automationrule.id"),
            nullable=True,
        ),
    )
    op.add_column("messagelog", sa.Column("automation_event_key", sa.String(), nullable=True))
    op.create_index("ix_messagelog_schedule_id", "messagelog", ["schedule_id"])
    op.create_index(
        "ix_messagelog_automation_rule_id",
        "messagelog",
        ["automation_rule_id"],
    )
    op.create_index(
        "ix_messagelog_automation_event_key",
        "messagelog",
        ["automation_event_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_messagelog_automation_event_key", table_name="messagelog")
    op.drop_index("ix_messagelog_automation_rule_id", table_name="messagelog")
    op.drop_index("ix_messagelog_schedule_id", table_name="messagelog")
    op.drop_column("messagelog", "automation_event_key")
    op.drop_column("messagelog", "automation_rule_id")
    op.drop_column("messagelog", "schedule_id")

    op.drop_index("ix_messageschedule_event_key", table_name="messageschedule")
    op.drop_index("ix_messageschedule_automation_rule_id", table_name="messageschedule")
    op.drop_column("messageschedule", "event_key")
    op.drop_column("messageschedule", "automation_rule_id")

    # PostgreSQL enum values are retained; removing them safely requires type recreation.
