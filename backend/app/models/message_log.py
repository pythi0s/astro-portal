# app/models/message_log.py
import enum
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class MessageStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"
    pending = "pending"


class MessageLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    template_id: Optional[int] = Field(default=None, foreign_key="messagetemplate.id")
    visit_id: Optional[int] = Field(default=None, foreign_key="visit.id")
    channel: str
    recipient: str
    subject: Optional[str] = None
    body_snapshot: Optional[str] = None
    status: MessageStatus = Field(default=MessageStatus.pending)
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
