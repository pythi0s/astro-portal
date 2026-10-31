# app/models/appointment.py
import enum
from datetime import datetime

from sqlmodel import Field, SQLModel


class AppointmentStatus(enum.StrEnum):
    booked = "booked"
    completed = "completed"
    cancelled = "cancelled"


class Appointment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)

    # Naive wall-clock datetimes in the practice's timezone (settings.appointment_timezone).
    start_at: datetime = Field(index=True)
    end_at: datetime
    duration_minutes: int

    status: AppointmentStatus = Field(default=AppointmentStatus.booked, index=True)
    notes: str | None = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
