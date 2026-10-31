"""Customer portal accounts and appointments.

Revision ID: d4e5f6a7b8c9
Revises: c8e4f1a2b3d4
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "c8e4f1a2b3d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "customeraccount",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customer.id"), nullable=False),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_customeraccount_customer_id", "customeraccount", ["customer_id"], unique=True
    )
    op.create_index("ix_customeraccount_phone", "customeraccount", ["phone"], unique=True)
    op.create_index("ix_customeraccount_email", "customeraccount", ["email"], unique=True)

    op.create_table(
        "appointment",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customer.id"), nullable=False),
        sa.Column("start_at", sa.DateTime(), nullable=False),
        sa.Column("end_at", sa.DateTime(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("booked", "completed", "cancelled", name="appointmentstatus"),
            nullable=False,
        ),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "duration_minutes BETWEEN 15 AND 60", name="ck_appointment_duration_range"
        ),
        sa.CheckConstraint("end_at > start_at", name="ck_appointment_end_after_start"),
    )
    op.create_index("ix_appointment_customer_id", "appointment", ["customer_id"])
    op.create_index("ix_appointment_start_at", "appointment", ["start_at"])
    op.create_index("ix_appointment_status", "appointment", ["status"])

    # DB-level guarantee that two non-cancelled appointments never overlap, even
    # under concurrent requests. Not mirrored in the SQLModel (Postgres-only).
    if op.get_bind().dialect.name == "postgresql":
        op.execute(
            "ALTER TABLE appointment ADD CONSTRAINT ex_appointment_no_overlap "
            "EXCLUDE USING gist (tsrange(start_at, end_at, '[)') WITH &&) "
            "WHERE (status <> 'cancelled')"
        )


def downgrade() -> None:
    op.drop_table("appointment")
    op.execute("DROP TYPE IF EXISTS appointmentstatus")
    op.drop_table("customeraccount")
