# app/models/message_schedule.py
"""One row per bulk-send batch or automation-fired batch."""
import enum
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.message_template import MessageChannel


class ScheduleStatus(enum.StrEnum):
    pending = "pending"       # created, not yet enqueued
    queued = "queued"         # per-recipient tasks enqueued
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    failed = "failed"


class MessageSchedule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="messagetemplate.id", index=True)
    channel: MessageChannel = Field(default=MessageChannel.email)
    # Segment filter used to expand the schedule into recipients at run time.
    #   Same shape as AutomationRule.filter.
    target_query: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    scheduled_for: datetime = Field(index=True)
    timezone: str = Field(default="Asia/Kolkata")
    status: ScheduleStatus = Field(default=ScheduleStatus.pending, index=True)
    created_by: int | None = Field(default=None, foreign_key="user.id")
    sent_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    # Populated when the scheduler fans out — total planned recipients.
    total_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
