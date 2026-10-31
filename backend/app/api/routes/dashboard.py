from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.customer_account import CustomerAccount
from app.models.customer_solution import CustomerSolution
from app.models.solution import Solution
from app.models.user import User
from app.models.visit import PaymentStatus, Visit
from app.schemas.dashboard import (
    CategoryRevenueRow,
    DailyAmount,
    DashboardOverview,
    DashboardSummary,
    EarningsSummary,
    OverviewAppointment,
    OverviewCustomer,
    OverviewFollowUp,
    PeriodBreakdown,
    RevenueByCategory,
    RevenueSummary,
)
from app.services.appointments import clinic_now, clinic_to_utc

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# Default to "last 30 days inclusive" when a range is not provided.
_DEFAULT_RANGE_DAYS = 30


def _resolve_range(
    date_from: date | None,
    date_to: date | None,
    default_days: int = _DEFAULT_RANGE_DAYS,
) -> tuple[date, date]:
    today = date.today()
    to_d = date_to or today
    from_d = date_from or (to_d - timedelta(days=default_days - 1))
    if from_d > to_d:
        raise HTTPException(
            status_code=400,
            detail="`from_date` must be on or before `to_date`",
        )
    return from_d, to_d


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    month_start = today.replace(day=1)

    total_result = await session.execute(select(func.count(Customer.id)))
    total_customers = total_result.scalar() or 0

    active_result = await session.execute(
        select(func.count(Customer.id)).where(Customer.is_active == True)  # noqa: E712
    )
    active_customers = active_result.scalar() or 0

    visits_result = await session.execute(
        select(func.count(Visit.id)).where(Visit.visit_date >= month_start)
    )
    visits_this_month = visits_result.scalar() or 0

    revenue_result = await session.execute(
        select(func.coalesce(func.sum(Visit.fees), 0)).where(
            Visit.visit_date >= month_start,
            Visit.payment_status == PaymentStatus.paid,
        )
    )
    revenue_this_month = revenue_result.scalar() or Decimal("0.00")

    pending_result = await session.execute(
        select(func.coalesce(func.sum(Visit.fees), 0)).where(
            Visit.payment_status.in_([PaymentStatus.pending, PaymentStatus.partial])
        )
    )
    pending_payments = pending_result.scalar() or Decimal("0.00")

    new_cust_result = await session.execute(
        select(func.count(Customer.id)).where(
            Customer.created_at >= datetime.combine(month_start, datetime.min.time())
        )
    )
    new_customers_this_month = new_cust_result.scalar() or 0

    return DashboardSummary(
        total_customers=total_customers,
        active_customers=active_customers,
        visits_this_month=visits_this_month,
        revenue_this_month=revenue_this_month,
        pending_payments=pending_payments,
        new_customers_this_month=new_customers_this_month,
    )


@router.get("/earnings", response_model=EarningsSummary)
async def dashboard_earnings(
    period: str = Query("monthly", pattern="^(daily|weekly|monthly)$"),
    days: int = Query(30, ge=7, le=365),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    start_date = today - timedelta(days=days)

    visits_result = await session.execute(
        select(Visit).where(Visit.visit_date >= start_date).order_by(Visit.visit_date)
    )
    visits = visits_result.scalars().all()

    buckets: dict[str, list] = {}
    for v in visits:
        if period == "daily":
            label = v.visit_date.isoformat()
        elif period == "weekly":
            iso = v.visit_date.isocalendar()
            label = f"{iso[0]}-W{iso[1]:02d}"
        else:
            label = v.visit_date.strftime("%Y-%m")
        buckets.setdefault(label, []).append(v)

    breakdown: list[PeriodBreakdown] = []
    grand_total = Decimal("0.00")
    for label, group in sorted(buckets.items()):
        total_fees = sum((v.fees for v in group), Decimal("0.00"))
        paid_count = sum(1 for v in group if v.payment_status == PaymentStatus.paid)
        pending_amount = sum(
            (
                v.fees
                for v in group
                if v.payment_status in (PaymentStatus.pending, PaymentStatus.partial)
            ),
            Decimal("0.00"),
        )
        grand_total += total_fees
        breakdown.append(
            PeriodBreakdown(
                label=label,
                total_fees=total_fees,
                visit_count=len(group),
                paid_count=paid_count,
                pending_amount=pending_amount,
            )
        )

    return EarningsSummary(
        period=period,
        start_date=start_date,
        end_date=today,
        breakdown=breakdown,
        grand_total=grand_total,
    )


@router.get("/revenue", response_model=RevenueSummary)
async def dashboard_revenue(
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> RevenueSummary:
    """Range-aware revenue KPIs. Solves GAP-API-05 (summary was MTD-only and
    pending_payments was all-time).
    """
    from_d, to_d = _resolve_range(date_from, date_to)

    range_filter = (
        Visit.visit_date >= from_d,
        Visit.visit_date <= to_d,
    )

    def _sum_for(status: PaymentStatus | list[PaymentStatus]):
        q = select(func.coalesce(func.sum(Visit.fees), 0)).where(*range_filter)
        if isinstance(status, list):
            return q.where(Visit.payment_status.in_(status))
        return q.where(Visit.payment_status == status)

    collected_row = await session.execute(_sum_for(PaymentStatus.paid))
    outstanding_row = await session.execute(
        _sum_for([PaymentStatus.pending, PaymentStatus.partial])
    )
    waived_row = await session.execute(_sum_for(PaymentStatus.waived))
    count_row = await session.execute(
        select(func.count(Visit.id)).where(*range_filter)
    )

    collected = Decimal(collected_row.scalar() or 0)
    outstanding = Decimal(outstanding_row.scalar() or 0)
    waived = Decimal(waived_row.scalar() or 0)
    gross = collected + outstanding + waived
    visit_count = int(count_row.scalar() or 0)
    avg_fee = (gross / visit_count) if visit_count > 0 else Decimal("0.00")

    denom = collected + outstanding
    collection_rate = float((collected / denom) * 100) if denom > 0 else 0.0

    return RevenueSummary(
        from_date=from_d,
        to_date=to_d,
        collected=collected,
        outstanding=outstanding,
        waived=waived,
        gross=gross,
        visit_count=visit_count,
        avg_fee=avg_fee,
        collection_rate=round(collection_rate, 2),
    )


@router.get("/revenue-by-category", response_model=RevenueByCategory)
async def dashboard_revenue_by_category(
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> RevenueByCategory:
    """Allocate each visit's fee equally across its linked solutions. Visits
    with no linked solution contribute to the `__unassigned__` bucket so the
    total always reconciles with `/dashboard/revenue`.
    """
    from_d, to_d = _resolve_range(date_from, date_to)

    visits_result = await session.execute(
        select(Visit).where(Visit.visit_date >= from_d, Visit.visit_date <= to_d)
    )
    visits = visits_result.scalars().all()
    if not visits:
        return RevenueByCategory(
            from_date=from_d,
            to_date=to_d,
            rows=[],
            grand_total=Decimal("0.00"),
        )

    visit_ids = [v.id for v in visits]
    link_result = await session.execute(
        select(CustomerSolution.visit_id, Solution.category)
        .join(Solution, CustomerSolution.solution_id == Solution.id)
        .where(CustomerSolution.visit_id.in_(visit_ids))
    )
    # visit_id -> [category_value, ...]
    categories_by_visit: dict[int, list[str]] = defaultdict(list)
    for visit_id, category in link_result.all():
        label = category.value if hasattr(category, "value") else str(category)
        categories_by_visit[visit_id].append(label)

    totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
    counts: dict[str, int] = defaultdict(int)
    grand_total = Decimal("0.00")

    for v in visits:
        cats = categories_by_visit.get(v.id, [])
        fee = Decimal(v.fees)
        grand_total += fee
        if not cats:
            totals["__unassigned__"] += fee
            counts["__unassigned__"] += 1
            continue
        share = fee / Decimal(len(cats))
        seen: set[str] = set()
        for c in cats:
            totals[c] += share
            if c not in seen:
                counts[c] += 1
                seen.add(c)

    rows = [
        CategoryRevenueRow(
            category=cat,
            total_fees=amount.quantize(Decimal("0.01")),
            visit_count=counts[cat],
        )
        for cat, amount in sorted(totals.items(), key=lambda item: item[1], reverse=True)
    ]

    return RevenueByCategory(
        from_date=from_d,
        to_date=to_d,
        rows=rows,
        grand_total=grand_total.quantize(Decimal("0.01")),
    )


def _month_start(day: date) -> date:
    return day.replace(day=1)


@router.get("/overview", response_model=DashboardOverview)
async def dashboard_overview(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> DashboardOverview:
    """At-a-glance numbers for the home dashboard (appointments use clinic time)."""
    now = clinic_now()
    today = now.date()
    day_start = datetime.combine(today, time.min)
    month_start = _month_start(today)
    prev_month_start = _month_start(month_start - timedelta(days=1))
    # Same number of elapsed days last month, so the comparison is fair mid-month.
    prev_month_cutoff = min(
        prev_month_start + (today - month_start),
        month_start - timedelta(days=1),
    )
    active = Appointment.status != AppointmentStatus.cancelled

    async def count(*where) -> int:
        result = await session.execute(select(func.count(Appointment.id)).where(active, *where))
        return int(result.scalar() or 0)

    appointments_today = await count(
        Appointment.start_at >= day_start, Appointment.start_at < day_start + timedelta(days=1)
    )
    upcoming_rows = await session.execute(
        select(Appointment, Customer)
        .join(Customer, Customer.id == Appointment.customer_id)
        .where(Appointment.status == AppointmentStatus.booked, Appointment.start_at >= now)
        .order_by(Appointment.start_at)
        .limit(1)
    )
    next_row = upcoming_rows.first()
    remaining_today = await count(
        Appointment.status == AppointmentStatus.booked,
        Appointment.start_at >= now,
        Appointment.start_at < day_start + timedelta(days=1),
    )
    upcoming_7_days = await count(
        Appointment.status == AppointmentStatus.booked,
        Appointment.start_at >= now,
        Appointment.start_at < day_start + timedelta(days=8),
    )
    appointments_this_month = await count(
        Appointment.start_at >= datetime.combine(month_start, time.min),
    )
    appointments_total = await count()

    async def collected(start: date, end: date) -> Decimal:
        result = await session.execute(
            select(func.coalesce(func.sum(Visit.fees), 0)).where(
                Visit.is_active == True,  # noqa: E712
                Visit.payment_status == PaymentStatus.paid,
                Visit.visit_date >= start,
                Visit.visit_date <= end,
            )
        )
        return Decimal(result.scalar() or 0)

    collected_this_month = await collected(month_start, today)
    collected_last_month = await collected(prev_month_start, prev_month_cutoff)
    change = (
        round(float((collected_this_month - collected_last_month) / collected_last_month) * 100, 1)
        if collected_last_month > 0
        else None
    )

    daily_result = await session.execute(
        select(Visit.visit_date, func.coalesce(func.sum(Visit.fees), 0))
        .where(
            Visit.is_active == True,  # noqa: E712
            Visit.payment_status == PaymentStatus.paid,
            Visit.visit_date >= month_start,
            Visit.visit_date <= today,
        )
        .group_by(Visit.visit_date)
    )
    by_day = {d: Decimal(v or 0) for d, v in daily_result.all()}
    collected_daily = [
        DailyAmount(day=d, amount=by_day.get(d, Decimal("0")))
        for d in (month_start + timedelta(days=i) for i in range((today - month_start).days + 1))
    ]

    outstanding_result = await session.execute(
        select(func.coalesce(func.sum(Visit.fees), 0)).where(
            Visit.is_active == True,  # noqa: E712
            Visit.payment_status.in_([PaymentStatus.pending, PaymentStatus.partial]),
        )
    )

    new_customers_result = await session.execute(
        select(func.count(Customer.id)).where(
            Customer.created_at >= clinic_to_utc(datetime.combine(month_start, time.min))
        )
    )
    linked = select(CustomerAccount.customer_id)
    recent_result = await session.execute(
        select(Customer, Customer.id.in_(linked))
        .where(Customer.is_active == True)  # noqa: E712
        .order_by(Customer.created_at.desc())
        .limit(5)
    )

    follow_result = await session.execute(
        select(Visit, Customer)
        .join(Customer, Customer.id == Visit.customer_id)
        .where(
            Visit.is_active == True,  # noqa: E712
            Visit.follow_up_date.is_not(None),
            Visit.follow_up_date >= today - timedelta(days=7),
            Visit.follow_up_date <= today + timedelta(days=7),
        )
        .order_by(Visit.follow_up_date)
        .limit(8)
    )

    return DashboardOverview(
        today=today,
        appointments_today=appointments_today,
        remaining_today=remaining_today,
        next_appointment=(
            OverviewAppointment(
                id=next_row[0].id,
                customer_id=next_row[1].id,
                customer_name=next_row[1].name,
                start_at=next_row[0].start_at,
                end_at=next_row[0].end_at,
                duration_minutes=next_row[0].duration_minutes,
            )
            if next_row
            else None
        ),
        upcoming_7_days=upcoming_7_days,
        appointments_this_month=appointments_this_month,
        appointments_total=appointments_total,
        collected_this_month=collected_this_month,
        collected_last_month=collected_last_month,
        collected_change_pct=change,
        collected_daily=collected_daily,
        outstanding_total=Decimal(outstanding_result.scalar() or 0),
        new_customers_this_month=int(new_customers_result.scalar() or 0),
        recent_customers=[
            OverviewCustomer(
                id=c.id,
                name=c.name,
                phone=c.phone,
                created_at=c.created_at,
                self_registered=bool(has_account),
            )
            for c, has_account in recent_result.all()
        ],
        follow_ups_due=[
            OverviewFollowUp(
                visit_id=v.id,
                customer_id=c.id,
                customer_name=c.name,
                customer_phone=c.phone,
                follow_up_date=v.follow_up_date,
            )
            for v, c in follow_result.all()
        ],
    )
