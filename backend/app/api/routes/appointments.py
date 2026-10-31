"""Staff view of customer appointments (booked through the portal)."""

from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.user import User
from app.schemas.appointment import AppointmentRead, AppointmentStaffRead, AppointmentUpdate
from app.services.appointments import SLOT_TAKEN_DETAIL, ensure_slot_free

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _staff_read(appointment: Appointment, customer: Customer) -> AppointmentStaffRead:
    return AppointmentStaffRead(
        **AppointmentRead.model_validate(appointment).model_dump(),
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_email=customer.email,
    )


@router.get("/", response_model=list[AppointmentStaffRead])
async def list_appointments(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    status_filter: AppointmentStatus | None = Query(None, alias="status"),
    customer_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Appointment, Customer).join(Customer, Customer.id == Appointment.customer_id)
    if date_from:
        query = query.where(Appointment.start_at >= datetime.combine(date_from, time.min))
    if date_to:
        query = query.where(
            Appointment.start_at < datetime.combine(date_to + timedelta(days=1), time.min)
        )
    if status_filter:
        query = query.where(Appointment.status == status_filter)
    if customer_id is not None:
        query = query.where(Appointment.customer_id == customer_id)
    query = query.order_by(Appointment.start_at.asc()).offset(skip).limit(limit)

    result = await session.execute(query)
    return [_staff_read(a, c) for a, c in result.all()]


@router.patch("/{appointment_id}", response_model=AppointmentStaffRead)
async def update_appointment(
    appointment_id: int,
    body: AppointmentUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    appointment = await session.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if body.status is not None and body.status != appointment.status:
        reviving = appointment.status == AppointmentStatus.cancelled
        if reviving:
            await ensure_slot_free(
                session, appointment.start_at, appointment.end_at, exclude_id=appointment.id
            )
        appointment.status = body.status
    if body.notes is not None:
        appointment.notes = body.notes
    appointment.updated_at = datetime.utcnow()

    session.add(appointment)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SLOT_TAKEN_DETAIL) from exc
    await session.refresh(appointment)
    customer = await session.get(Customer, appointment.customer_id)
    return _staff_read(appointment, customer)
