# app/models/message_conversation.py
"""One row per (customer, channel) — the conversation aggregate."""
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.message_template import MessageChannel


class MessageConversation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    channel: MessageChannel = Field(default=MessageChannel.whatsapp, index=True)
    # Last inbound OR outbound message timestamp — drives inbox ordering.
    last_message_at: datetime | None = Field(default=None, index=True)
    unread_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
