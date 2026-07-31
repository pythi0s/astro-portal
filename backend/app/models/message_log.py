# app/models/message_log.py
import enum
from datetime import datetime

from sqlmodel import Field, SQLModel


class MessageStatus(enum.StrEnum):
    sent = "sent"
    failed = "failed"
    pending = "pending"
    # Phase 4.1 additions
    queued = "queued"        # accepted by broker, not yet dispatched
    delivered = "delivered"  # provider confirmed delivery
    read = "read"            # provider confirmed read (WhatsApp)


class MessageDirection(enum.StrEnum):
    outbound = "outbound"
    inbound = "inbound"


class MessageLog(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    template_id: int | None = Field(default=None, foreign_key="messagetemplate.id")
    visit_id: int | None = Field(default=None, foreign_key="visit.id")
    channel: str
    recipient: str
    subject: str | None = None
    body_snapshot: str | None = None
    status: MessageStatus = Field(default=MessageStatus.pending)
    error_message: str | None = None
    sent_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # ── Phase 4.1 additions ───────────────────────────────────────────────
    conversation_id: int | None = Field(
        default=None, foreign_key="messageconversation.id", index=True
    )
    direction: MessageDirection = Field(default=MessageDirection.outbound, index=True)
    # Provider-side identifier (Twilio SID, SMTP message-id header value).
    #   Used to correlate delivery-status webhooks back to this log row.
    provider_message_id: str | None = Field(default=None, index=True)
    # Tracking counters (email only for now, but WhatsApp read receipts land here too).
    open_count: int = Field(default=0)
    click_count: int = Field(default=0)
    opened_at: datetime | None = None
    clicked_at: datetime | None = None
    # Structured error code (provider-supplied).  `error_message` retains the
    # human-readable payload; `error_code` powers retry policy branching.
    error_code: str | None = None
    retry_count: int = Field(default=0)
