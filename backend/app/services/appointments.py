"""Booking rules shared by the customer portal and the staff appointment API."""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.models.appointment import Appointment, AppointmentStatus

# Arbitrary constant key for pg_advisory_xact_lock; serialises concurrent bookings.
_BOOKING_LOCK_KEY = 74_120_301


def clinic_now() -> datetime:
    return datetime.now(ZoneInfo(settings.appointment_timezone)).replace(tzinfo=None)


def clinic_to_utc(value: datetime) -> datetime:
    """Naive clinic wall-clock -> naive UTC (how `created_at` columns are stored)."""
    aware = value.replace(tzinfo=ZoneInfo(settings.appointment_timezone))
    return aware.astimezone(UTC).replace(tzinfo=None)


def to_clinic_time(value: datetime) -> datetime:
    if value.tzinfo is not None:
        value = value.astimezone(ZoneInfo(settings.appointment_timezone)).replace(tzinfo=None)
    return value.replace(second=0, microsecond=0)


def _parse_hhmm(value: str) -> time:
    hours, minutes = value.split(":")
    return time(int(hours), int(minutes))


def opening_hours() -> tuple[time, time]:
    return _parse_hhmm(settings.appointment_open_time), _parse_hhmm(
        settings.appointment_close_time
    )


def validate_window(start_at: datetime, duration_minutes: int) -> tuple[datetime, datetime]:
    """Normalise and validate a requested slot; returns (start, end) in clinic time."""
    if not settings.appointment_min_minutes <= duration_minutes <= settings.appointment_max_minutes:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Appointments must be between {settings.appointment_min_minutes} and "
                f"{settings.appointment_max_minutes} minutes"
            ),
        )

    start = to_clinic_time(start_at)
    end = start + timedelta(minutes=duration_minutes)

    if start <= clinic_now():
        raise HTTPException(
            status_code=422,
            detail="Appointments must be booked for a future time",
        )

    open_t, close_t = opening_hours()
    if start.time() < open_t or end.date() != start.date() or end.time() > close_t:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Appointments must be within opening hours "
                f"({settings.appointment_open_time}–{settings.appointment_close_time})"
            ),
        )
    return start, end


async def acquire_booking_lock(session: AsyncSession) -> None:
    bind = session.bind
    if bind is not None and bind.dialect.name == "postgresql":
        await session.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": _BOOKING_LOCK_KEY})


async def find_conflict(
    session: AsyncSession,
    start: datetime,
    end: datetime,
    exclude_id: int | None = None,
) -> Appointment | None:
    query = select(Appointment).where(
        Appointment.status != AppointmentStatus.cancelled,
        Appointment.start_at < end,
        Appointment.end_at > start,
    )
    if exclude_id is not None:
        query = query.where(Appointment.id != exclude_id)
    result = await session.execute(query.limit(1))
    return result.scalar_one_or_none()


SLOT_TAKEN_DETAIL = "This time slot is already booked. Please choose another time."


async def ensure_slot_free(
    session: AsyncSession,
    start: datetime,
    end: datetime,
    exclude_id: int | None = None,
) -> None:
    await acquire_booking_lock(session)
    if await find_conflict(session, start, end, exclude_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SLOT_TAKEN_DETAIL)


async def busy_slots_for_day(session: AsyncSession, day: date) -> list[Appointment]:
    day_start = datetime.combine(day, time.min)
    day_end = day_start + timedelta(days=1)
    result = await session.execute(
        select(Appointment)
        .where(
            Appointment.status != AppointmentStatus.cancelled,
            Appointment.start_at < day_end,
            Appointment.end_at > day_start,
        )
        .order_by(Appointment.start_at)
    )
    return list(result.scalars().all())
