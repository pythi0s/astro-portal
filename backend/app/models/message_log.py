# app/models/message_log.py
import enum
from datetime import datetime

from sqlmodel import Field, SQLModel


class MessageStatus(enum.StrEnum):
    sent = "sent"
    failed = "failed"
    pending = "pending"


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
