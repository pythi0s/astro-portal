# app/models/message_template.py
import enum
from datetime import datetime

from sqlmodel import Field, SQLModel


class MessageChannel(enum.StrEnum):
    email = "email"
    whatsapp = "whatsapp"


class TriggerType(enum.StrEnum):
    first_visit = "first_visit"
    follow_up = "follow_up"
    solution_given = "solution_given"
    custom = "custom"


class MessageTemplate(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    channel: MessageChannel = Field(default=MessageChannel.email)
    trigger_type: TriggerType = Field(default=TriggerType.custom)
    subject: str | None = None
    body: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
