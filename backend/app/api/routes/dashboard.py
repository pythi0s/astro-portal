# app/api/routes/dashboard.py
from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.customer import Customer
from app.models.user import User
from app.models.visit import Visit, PaymentStatus
from app.schemas.dashboard import DashboardSummary, EarningsSummary, PeriodBreakdown

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    month_start = today.replace(day=1)

    # Total customers
    total_result = await session.execute(select(func.count(Customer.id)))
    total_customers = total_result.scalar() or 0

    active_result = await session.execute(
        select(func.count(Customer.id)).where(Customer.is_active == True)
    )
    active_customers = active_result.scalar() or 0

    # Visits this month
    visits_result = await session.execute(
        select(func.count(Visit.id)).where(Visit.visit_date >= month_start)
    )
    visits_this_month = visits_result.scalar() or 0

    # Revenue this month (paid visits)
    revenue_result = await session.execute(
        select(func.coalesce(func.sum(Visit.fees), 0)).where(
            Visit.visit_date >= month_start,
            Visit.payment_status == PaymentStatus.paid,
        )
    )
    revenue_this_month = revenue_result.scalar() or Decimal("0.00")

    # Pending payments
    pending_result = await session.execute(
        select(func.coalesce(func.sum(Visit.fees), 0)).where(
            Visit.payment_status.in_([PaymentStatus.pending, PaymentStatus.partial])
        )
    )
    pending_payments = pending_result.scalar() or Decimal("0.00")

    # New customers this month
    new_cust_result = await session.execute(
        select(func.count(Customer.id)).where(Customer.created_at >= datetime.combine(month_start, datetime.min.time()))
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

    breakdown = []
    grand_total = Decimal("0.00")
    for label, group in sorted(buckets.items()):
        total_fees = sum(v.fees for v in group)
        paid_count = sum(1 for v in group if v.payment_status == PaymentStatus.paid)
        pending_amount = sum(
            v.fees for v in group if v.payment_status in (PaymentStatus.pending, PaymentStatus.partial)
        )
        grand_total += total_fees
        breakdown.append(PeriodBreakdown(
            label=label,
            total_fees=total_fees,
            visit_count=len(group),
            paid_count=paid_count,
            pending_amount=pending_amount,
        ))

    return EarningsSummary(
        period=period,
        start_date=start_date,
        end_date=today,
        breakdown=breakdown,
        grand_total=grand_total,
    )
