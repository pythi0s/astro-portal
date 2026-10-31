# app/schemas/appointment.py
from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.appointment import AppointmentStatus
from app.models.customer import Gender
from app.services.phone import normalize_mobile

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


_PROFILE_TEXT_FIELDS = (
    "email",
    "birth_place",
    "occupation",
    "marital_status",
    "address",
    "city",
    "state",
    "pincode",
    "rashi",
    "nakshatra",
    "gotra",
)


class PortalProfileFields(BaseModel):
    """Optional self-reported details; staff can complete or correct them later."""

    email: str | None = Field(None, max_length=254, pattern=EMAIL_PATTERN)
    gender: Gender | None = None
    date_of_birth: date | None = None
    birth_time: time | None = None
    birth_place: str | None = Field(None, max_length=120)
    occupation: str | None = Field(None, max_length=120)
    marital_status: str | None = Field(None, max_length=32)
    address: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=80)
    state: str | None = Field(None, max_length=80)
    pincode: str | None = Field(None, max_length=12)
    rashi: str | None = Field(None, max_length=40)
    nakshatra: str | None = Field(None, max_length=40)
    gotra: str | None = Field(None, max_length=80)

    @model_validator(mode="before")
    @classmethod
    def _blank_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {
                k: (None if isinstance(v, str) and not v.strip() else v) for k, v in data.items()
            }
        return data

    @field_validator(*_PROFILE_TEXT_FIELDS, mode="after")
    @classmethod
    def _strip(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("email", mode="after")
    @classmethod
    def _lower_email(cls, value: str | None) -> str | None:
        return value.lower() if value else value


def _mobile(value: str) -> str:
    return normalize_mobile(value)


class PortalRegisterRequest(PortalProfileFields):
    name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., max_length=20)
    password: str = Field(..., min_length=8, max_length=128)
    reminders_opt_in: bool = True

    @field_validator("phone", mode="after")
    @classmethod
    def _normalise_phone(cls, value: str) -> str:
        return _mobile(value)

    @field_validator("name", mode="after")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required")
        return value


class PortalProfileUpdate(PortalProfileFields):
    name: str | None = Field(None, min_length=1, max_length=120)
    reminders_opt_in: bool | None = None


class PortalLoginRequest(BaseModel):
    # Mobile number (any common format) or email address.
    identifier: str = Field(..., min_length=1, max_length=254)
    password: str


class PortalAccountRead(BaseModel):
    id: int
    customer_id: int
    phone: str
    email: str | None = None
    name: str


class PortalProfileRead(BaseModel):
    name: str
    phone: str
    reminders_opt_in: bool = True
    email: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    birth_time: time | None = None
    birth_place: str | None = None
    occupation: str | None = None
    marital_status: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    rashi: str | None = None
    nakshatra: str | None = None
    gotra: str | None = None


class AppointmentCreate(BaseModel):
    start_at: datetime
    duration_minutes: int = Field(..., ge=15, le=60)
    notes: str | None = Field(None, max_length=500)


class AppointmentRead(BaseModel):
    id: int
    customer_id: int
    start_at: datetime
    end_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentStaffRead(AppointmentRead):
    customer_name: str
    customer_phone: str | None = None
    customer_email: str | None = None


class AppointmentUpdate(BaseModel):
    status: AppointmentStatus | None = None
    notes: str | None = Field(None, max_length=500)


class BusySlot(BaseModel):
    start_at: datetime
    end_at: datetime


class Availability(BaseModel):
    day: date
    open_time: str
    close_time: str
    min_duration: int
    max_duration: int
    slot_step_minutes: int
    now: datetime
    busy: list[BusySlot]
