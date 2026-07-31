"""Phase 4.1 — Messaging platform schema

Adds:
* `messagetemplate` columns: variables, preview_snapshot, attachments,
  is_transactional, track_opens, track_clicks
* `messagelog` columns: conversation_id, direction, provider_message_id,
  open_count, click_count, opened_at, clicked_at, error_code, retry_count
* New tables: `messageconversation`, `automationrule`, `messageschedule`

`MessageStatus` gains `queued`, `delivered`, `read`.  Python enum lookups
handle new members without a migration (values are stored as strings).

Revision ID: b7c9d1e2f3a4
Revises: a3b9c1d4e5f6
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7c9d1e2f3a4"
down_revision: str | None = "a3b9c1d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── messagetemplate: additive columns ─────────────────────────────────
    with op.batch_alter_table("messagetemplate") as batch_op:
        batch_op.add_column(sa.Column("variables", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("preview_snapshot", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("attachments", sa.JSON(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "is_transactional",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(
            sa.Column(
                "track_opens",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(
            sa.Column(
                "track_clicks",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )

    # ── messageconversation ───────────────────────────────────────────────
    op.create_table(
        "messageconversation",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "customer_id",
            sa.Integer(),
            sa.ForeignKey("customer.id"),
            nullable=False,
        ),
        sa.Column("channel", sa.String(), nullable=False, server_default="whatsapp"),
        sa.Column("last_message_at", sa.DateTime(), nullable=True),
        sa.Column("unread_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_messageconversation_customer_id",
        "messageconversation",
        ["customer_id"],
    )
    op.create_index(
        "ix_messageconversation_channel",
        "messageconversation",
        ["channel"],
    )
    op.create_index(
        "ix_messageconversation_last_message_at",
        "messageconversation",
        ["last_message_at"],
    )

    # ── messagelog: additive columns ──────────────────────────────────────
    with op.batch_alter_table("messagelog") as batch_op:
        batch_op.add_column(
            sa.Column(
                "conversation_id",
                sa.Integer(),
                sa.ForeignKey("messageconversation.id"),
                nullable=True,
            )
        )
        batch_op.add_column(
            sa.Column(
                "direction",
                sa.String(),
                nullable=False,
                server_default="outbound",
            )
        )
        batch_op.add_column(
            sa.Column("provider_message_id", sa.String(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("open_count", sa.Integer(), nullable=False, server_default="0")
        )
        batch_op.add_column(
            sa.Column("click_count", sa.Integer(), nullable=False, server_default="0")
        )
        batch_op.add_column(sa.Column("opened_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("clicked_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("error_code", sa.String(), nullable=True))
        batch_op.add_column(
            sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0")
        )
    op.create_index(
        "ix_messagelog_conversation_id", "messagelog", ["conversation_id"]
    )
    op.create_index("ix_messagelog_direction", "messagelog", ["direction"])
    op.create_index(
        "ix_messagelog_provider_message_id",
        "messagelog",
        ["provider_message_id"],
    )

    # ── automationrule ────────────────────────────────────────────────────
    op.create_table(
        "automationrule",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("trigger", sa.String(), nullable=False),
        sa.Column(
            "template_id",
            sa.Integer(),
            sa.ForeignKey("messagetemplate.id"),
            nullable=False,
        ),
        sa.Column("channel", sa.String(), nullable=False, server_default="email"),
        sa.Column("offset_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "is_active", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column("filter", sa.JSON(), nullable=True),
        sa.Column(
            "timezone", sa.String(), nullable=False, server_default="Asia/Kolkata"
        ),
        sa.Column(
            "send_window_start_hour",
            sa.Integer(),
            nullable=False,
            server_default="9",
        ),
        sa.Column(
            "send_window_end_hour",
            sa.Integer(),
            nullable=False,
            server_default="20",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_automationrule_trigger", "automationrule", ["trigger"])
    op.create_index(
        "ix_automationrule_template_id", "automationrule", ["template_id"]
    )
    op.create_index(
        "ix_automationrule_is_active", "automationrule", ["is_active"]
    )

    # ── messageschedule ───────────────────────────────────────────────────
    op.create_table(
        "messageschedule",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "template_id",
            sa.Integer(),
            sa.ForeignKey("messagetemplate.id"),
            nullable=False,
        ),
        sa.Column("channel", sa.String(), nullable=False, server_default="email"),
        sa.Column("target_query", sa.JSON(), nullable=True),
        sa.Column("scheduled_for", sa.DateTime(), nullable=False),
        sa.Column(
            "timezone", sa.String(), nullable=False, server_default="Asia/Kolkata"
        ),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column(
            "created_by", sa.Integer(), sa.ForeignKey("user.id"), nullable=True
        ),
        sa.Column("sent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_messageschedule_template_id", "messageschedule", ["template_id"]
    )
    op.create_index(
        "ix_messageschedule_scheduled_for",
        "messageschedule",
        ["scheduled_for"],
    )
    op.create_index("ix_messageschedule_status", "messageschedule", ["status"])


def downgrade() -> None:
    op.drop_index("ix_messageschedule_status", table_name="messageschedule")
    op.drop_index("ix_messageschedule_scheduled_for", table_name="messageschedule")
    op.drop_index("ix_messageschedule_template_id", table_name="messageschedule")
    op.drop_table("messageschedule")

    op.drop_index("ix_automationrule_is_active", table_name="automationrule")
    op.drop_index("ix_automationrule_template_id", table_name="automationrule")
    op.drop_index("ix_automationrule_trigger", table_name="automationrule")
    op.drop_table("automationrule")

    op.drop_index("ix_messagelog_provider_message_id", table_name="messagelog")
    op.drop_index("ix_messagelog_direction", table_name="messagelog")
    op.drop_index("ix_messagelog_conversation_id", table_name="messagelog")
    with op.batch_alter_table("messagelog") as batch_op:
        batch_op.drop_column("retry_count")
        batch_op.drop_column("error_code")
        batch_op.drop_column("clicked_at")
        batch_op.drop_column("opened_at")
        batch_op.drop_column("click_count")
        batch_op.drop_column("open_count")
        batch_op.drop_column("provider_message_id")
        batch_op.drop_column("direction")
        batch_op.drop_column("conversation_id")

    op.drop_index(
        "ix_messageconversation_last_message_at",
        table_name="messageconversation",
    )
    op.drop_index(
        "ix_messageconversation_channel", table_name="messageconversation"
    )
    op.drop_index(
        "ix_messageconversation_customer_id", table_name="messageconversation"
    )
    op.drop_table("messageconversation")

    with op.batch_alter_table("messagetemplate") as batch_op:
        batch_op.drop_column("track_clicks")
        batch_op.drop_column("track_opens")
        batch_op.drop_column("is_transactional")
        batch_op.drop_column("attachments")
        batch_op.drop_column("preview_snapshot")
        batch_op.drop_column("variables")
