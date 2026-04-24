# app/schemas/message.py
from datetime import datetime

from pydantic import BaseModel

from app.models.message_log import MessageStatus
from app.models.message_template import MessageChannel, TriggerType


class TemplateCreate(BaseModel):
    name: str
    channel: MessageChannel = MessageChannel.email
    trigger_type: TriggerType = TriggerType.custom
    subject: str | None = None
    body: str


class TemplateUpdate(BaseModel):
    name: str | None = None
    channel: MessageChannel | None = None
    trigger_type: TriggerType | None = None
    subject: str | None = None
    body: str | None = None
    is_active: bool | None = None


class TemplateRead(BaseModel):
    id: int
    name: str
    channel: MessageChannel
    trigger_type: TriggerType
    subject: str | None = None
    body: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SendEmailRequest(BaseModel):
    customer_id: int
    template_id: int | None = None
    visit_id: int | None = None
    subject: str | None = None
    body: str | None = None


class SendWhatsAppRequest(BaseModel):
    customer_id: int
    template_id: int
    visit_id: int | None = None


class MessageLogRead(BaseModel):
    id: int
    customer_id: int
    template_id: int | None = None
    visit_id: int | None = None
    channel: str
    recipient: str
    subject: str | None = None
    body_snapshot: str | None = None
    status: MessageStatus
    error_message: str | None = None
    sent_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
