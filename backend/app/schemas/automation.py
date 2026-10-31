from datetime import datetime
from typing import Any, Self
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.automation_rule import AutomationTrigger
from app.models.message_schedule import ScheduleStatus
from app.models.message_template import MessageChannel

ALLOWED_FILTER_KEYS = frozenset({"city", "gender", "rashi", "days"})


class AutomationRuleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    trigger: AutomationTrigger
    template_id: int = Field(gt=0)
    channel: MessageChannel = MessageChannel.email
    offset_days: int = Field(default=0, ge=-365, le=365)
    offset_hours: int = Field(default=0, ge=0, le=168)
    is_active: bool = True
    filter: dict[str, Any] | None = None
    timezone: str = "Asia/Kolkata"
    send_window_start_hour: int = Field(default=9, ge=0, le=23)
    send_window_end_hour: int = Field(default=20, ge=0, le=23)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("name cannot be blank")
        return normalized

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("timezone must be a valid IANA timezone") from exc
        return value

    @field_validator("filter")
    @classmethod
    def validate_filter_keys(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        if value is None:
            return None
        unsupported = set(value) - ALLOWED_FILTER_KEYS
        if unsupported:
            raise ValueError(f"unsupported filter keys: {', '.join(sorted(unsupported))}")
        return value

    @model_validator(mode="after")
    def validate_rule(self) -> Self:
        if self.send_window_start_hour >= self.send_window_end_hour:
            raise ValueError("send window start must be before end")
        if self.trigger == AutomationTrigger.appointment_reminder and self.offset_hours < 1:
            raise ValueError("appointment reminders need offset_hours of at least 1")

        days = self.filter.get("days") if self.filter else None
        if self.trigger == AutomationTrigger.no_visit_days:
            if isinstance(days, bool) or not isinstance(days, int) or days < 1:
                raise ValueError("no_visit_days rules require a positive integer filter.days")
        elif days is not None:
            raise ValueError("filter.days is only supported for no_visit_days rules")
        return self


class AutomationRuleUpdate(BaseModel):
    name: str | None = None
    trigger: AutomationTrigger | None = None
    template_id: int | None = Field(default=None, gt=0)
    channel: MessageChannel | None = None
    offset_days: int | None = Field(default=None, ge=-365, le=365)
    offset_hours: int | None = Field(default=None, ge=0, le=168)
    is_active: bool | None = None
    filter: dict[str, Any] | None = None
    timezone: str | None = None
    send_window_start_hour: int | None = Field(default=None, ge=0, le=23)
    send_window_end_hour: int | None = Field(default=None, ge=0, le=23)


class AutomationRuleRead(AutomationRuleCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AutomationRunRead(BaseModel):
    id: int
    automation_rule_id: int
    event_key: str
    channel: MessageChannel
    scheduled_for: datetime
    timezone: str
    status: ScheduleStatus
    sent_count: int
    failed_count: int
    total_count: int

    model_config = {"from_attributes": True}
