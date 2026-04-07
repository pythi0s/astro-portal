# app/schemas/message.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.message_log import MessageStatus
from app.models.message_template import MessageChannel, TriggerType


class TemplateCreate(BaseModel):
    name: str
    channel: MessageChannel = MessageChannel.email
    trigger_type: TriggerType = TriggerType.custom
    subject: Optional[str] = None
    body: str


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    channel: Optional[MessageChannel] = None
    trigger_type: Optional[TriggerType] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateRead(BaseModel):
    id: int
    name: str
    channel: MessageChannel
    trigger_type: TriggerType
    subject: Optional[str] = None
    body: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SendEmailRequest(BaseModel):
    customer_id: int
    template_id: Optional[int] = None
    visit_id: Optional[int] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class SendWhatsAppRequest(BaseModel):
    customer_id: int
    template_id: int
    visit_id: Optional[int] = None


class MessageLogRead(BaseModel):
    id: int
    customer_id: int
    template_id: Optional[int] = None
    visit_id: Optional[int] = None
    channel: str
    recipient: str
    subject: Optional[str] = None
    body_snapshot: Optional[str] = None
    status: MessageStatus
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
