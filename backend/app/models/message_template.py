# app/models/message_template.py
import enum
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class MessageChannel(str, enum.Enum):
    email = "email"
    whatsapp = "whatsapp"


class TriggerType(str, enum.Enum):
    first_visit = "first_visit"
    follow_up = "follow_up"
    solution_given = "solution_given"
    custom = "custom"


class MessageTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    channel: MessageChannel = Field(default=MessageChannel.email)
    trigger_type: TriggerType = Field(default=TriggerType.custom)
    subject: Optional[str] = None
    body: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
