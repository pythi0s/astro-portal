"""Customer self-service portal: account sign-up/login and appointment booking."""

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from app.core.config import settings
from app.core.security import (
    client_ip,
    create_customer_token,
    get_current_customer,
    hash_password,
    login_rate_limiter,
    verify_password,
)
from app.db.database import get_session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.customer_account import CustomerAccount
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentRead,
    Availability,
    BusySlot,
    PortalAccountRead,
    PortalLoginRequest,
    PortalProfileFields,
    PortalProfileRead,
    PortalProfileUpdate,
    PortalRegisterRequest,
)
from app.schemas.auth import TokenResponse
from app.services.appointments import (
    SLOT_TAKEN_DETAIL,
    busy_slots_for_day,
    clinic_now,
    ensure_slot_free,
    validate_window,
)
from app.services.phone import last_ten_digits, normalize_mobile

router = APIRouter(prefix="/portal", tags=["customer-portal"])


PROFILE_FIELDS = tuple(PortalProfileFields.model_fields)


async def _account_read(session: AsyncSession, account: CustomerAccount) -> PortalAccountRead:
    customer = await session.get(Customer, account.customer_id)
    return PortalAccountRead(
        id=account.id,
        customer_id=account.customer_id,
        phone=account.phone,
        email=account.email,
        name=customer.name if customer else "",
    )


async def _email_taken(
    session: AsyncSession, email: str, exclude_account_id: int | None = None
) -> bool:
    query = select(CustomerAccount.id).where(CustomerAccount.email == email)
    if exclude_account_id is not None:
        query = query.where(CustomerAccount.id != exclude_account_id)
    return (await session.execute(query.limit(1))).first() is not None


async def _find_unlinked_customer_by_mobile(session: AsyncSession, phone: str) -> Customer | None:
    """Staff may already have this person on file (phone typed in any format)."""
    digits_only = func.replace(
        func.replace(func.replace(func.replace(Customer.phone, " ", ""), "-", ""), "+", ""),
        "(",
        "",
    )
    linked = select(CustomerAccount.customer_id)
    result = await session.execute(
        select(Customer)
        .where(
            Customer.is_active == True,  # noqa: E712
            Customer.phone.is_not(None),
            digits_only.like(f"%{last_ten_digits(phone)}"),
            Customer.id.not_in(linked),
        )
        .order_by(Customer.created_at.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: PortalRegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    key = f"portal-register:{client_ip(request)}"
    login_rate_limiter.check(key)
    login_rate_limiter.record_failure(key)  # every sign-up counts toward the window

    existing = await session.execute(
        select(CustomerAccount.id).where(CustomerAccount.phone == body.phone)
    )
    if existing.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this mobile number already exists",
        )
    if body.email and await _email_taken(session, body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    profile = body.model_dump(include=set(PROFILE_FIELDS), exclude_none=True)
    customer = await _find_unlinked_customer_by_mobile(session, body.phone)
    if customer is None:
        customer = Customer(
            name=body.name,
            phone=body.phone,
            notes="Self-registered via customer portal",
            **profile,
        )
    else:
        # Never overwrite what staff already recorded; only fill the gaps.
        for field, value in profile.items():
            if getattr(customer, field) in (None, ""):
                setattr(customer, field, value)
        customer.updated_at = datetime.utcnow()
    session.add(customer)
    await session.flush()

    account = CustomerAccount(
        customer_id=customer.id,
        phone=body.phone,
        email=body.email,
        hashed_password=hash_password(body.password),
        reminders_opt_in=body.reminders_opt_in,
    )
    session.add(account)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with these details already exists",
        ) from exc
    await session.refresh(account)
    return TokenResponse(access_token=create_customer_token(account.id))


@router.post("/auth/login", response_model=TokenResponse)
async def login(
    body: PortalLoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    key = f"portal-login:{client_ip(request)}"
    login_rate_limiter.check(key)

    identifier = body.identifier.strip()
    account = None
    if "@" in identifier:
        query = select(CustomerAccount).where(CustomerAccount.email == identifier.lower())
    else:
        try:
            query = select(CustomerAccount).where(
                CustomerAccount.phone == normalize_mobile(identifier)
            )
        except ValueError:
            query = None
    if query is not None:
        account = (await session.execute(query)).scalar_one_or_none()

    if (
        account is None
        or not account.is_active
        or not verify_password(body.password, account.hashed_password)
    ):
        login_rate_limiter.record_failure(key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    login_rate_limiter.reset(key)
    account.last_login_at = datetime.utcnow()
    session.add(account)
    await session.commit()
    return TokenResponse(access_token=create_customer_token(account.id))


@router.get("/auth/me", response_model=PortalAccountRead)
async def me(
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    return await _account_read(session, account)


@router.get("/profile", response_model=PortalProfileRead)
async def get_profile(
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    customer = await session.get(Customer, account.customer_id)
    return _profile_read(customer, account)


@router.put("/profile", response_model=PortalProfileRead)
async def update_profile(
    body: PortalProfileUpdate,
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    customer = await session.get(Customer, account.customer_id)
    changes = body.model_dump(exclude_unset=True)
    if changes.get("name") is None:
        changes.pop("name", None)
    opt_in = changes.pop("reminders_opt_in", None)
    if opt_in is not None:
        account.reminders_opt_in = opt_in
        account.updated_at = datetime.utcnow()
        session.add(account)

    if "email" in changes and changes["email"] != account.email:
        if changes["email"] and await _email_taken(session, changes["email"], account.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
            )
        account.email = changes["email"]
        account.updated_at = datetime.utcnow()
        session.add(account)

    for field, value in changes.items():
        setattr(customer, field, value)
    customer.updated_at = datetime.utcnow()
    session.add(customer)
    await session.commit()
    await session.refresh(customer)
    return _profile_read(customer, account)


def _profile_read(customer: Customer, account: CustomerAccount) -> PortalProfileRead:
    return PortalProfileRead.model_validate(customer, from_attributes=True).model_copy(
        update={"phone": account.phone, "reminders_opt_in": account.reminders_opt_in}
    )


@router.get("/availability", response_model=Availability)
async def availability(
    day: date = Query(..., alias="date"),
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    # Only time ranges are exposed — never who booked them.
    busy = await busy_slots_for_day(session, day)
    return Availability(
        day=day,
        open_time=settings.appointment_open_time,
        close_time=settings.appointment_close_time,
        min_duration=settings.appointment_min_minutes,
        max_duration=settings.appointment_max_minutes,
        slot_step_minutes=settings.appointment_slot_step_minutes,
        now=clinic_now(),
        busy=[BusySlot(start_at=a.start_at, end_at=a.end_at) for a in busy],
    )


@router.get("/appointments", response_model=list[AppointmentRead])
async def my_appointments(
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    result = await session.execute(
        select(Appointment)
        .where(Appointment.customer_id == account.customer_id)
        .order_by(Appointment.start_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/appointments", response_model=AppointmentRead, status_code=status.HTTP_201_CREATED
)
async def book_appointment(
    body: AppointmentCreate,
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    start, end = validate_window(body.start_at, body.duration_minutes)
    await ensure_slot_free(session, start, end)

    appointment = Appointment(
        customer_id=account.customer_id,
        start_at=start,
        end_at=end,
        duration_minutes=body.duration_minutes,
        notes=body.notes,
    )
    session.add(appointment)
    try:
        await session.commit()
    except IntegrityError as exc:
        # Postgres exclusion constraint backstop for concurrent bookings.
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SLOT_TAKEN_DETAIL) from exc
    await session.refresh(appointment)
    return appointment


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentRead)
async def cancel_appointment(
    appointment_id: int,
    session: AsyncSession = Depends(get_session),
    account: CustomerAccount = Depends(get_current_customer),
):
    appointment = await session.get(Appointment, appointment_id)
    if appointment is None or appointment.customer_id != account.customer_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if appointment.status != AppointmentStatus.booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only booked appointments can be cancelled",
        )
    if appointment.start_at <= clinic_now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Past appointments cannot be cancelled"
        )

    appointment.status = AppointmentStatus.cancelled
    appointment.updated_at = datetime.utcnow()
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment
