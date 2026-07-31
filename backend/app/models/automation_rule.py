# app/models/automation_rule.py
"""Rules that fire scheduled messages when triggers match customers."""
import enum
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.models.message_template import MessageChannel


class AutomationTrigger(enum.StrEnum):
    # Fires when POST /visits/ creates a new visit.
    visit_created = "visit_created"
    # Beat task scans Visit rows: for each visit with follow_up_due_date == today, fire.
    follow_up_due = "follow_up_due"
    # Beat task scans Customer.dob: if today matches, fire.
    birthday = "birthday"
    # Beat task: customer.last_visit_at older than `filter.days` days.
    no_visit_days = "no_visit_days"


class AutomationRule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    trigger: AutomationTrigger = Field(index=True)
    template_id: int = Field(foreign_key="messagetemplate.id", index=True)
    channel: MessageChannel = Field(default=MessageChannel.email)
    # Number of days to offset the send from the trigger event
    # (0 = same day; +7 = seven days after; -1 = one day before).
    offset_days: int = Field(default=0)
    is_active: bool = Field(default=True, index=True)
    # Additional filter applied to the trigger's candidate set.
    #   Shape: {"rashi": "mesh", "gender": "F", "city": "Pune", ...}
    filter: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    # Timezone (IANA name) used to interpret `send_window_*` and to align
    # birthday / follow-up matching with the customer's local date.
    timezone: str = Field(default="Asia/Kolkata")
    # Hour-of-day (0-23) window inside `timezone` in which sends are allowed.
    #   Outside the window the task defers itself to the next in-window slot.
    send_window_start_hour: int = Field(default=9)
    send_window_end_hour: int = Field(default=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
