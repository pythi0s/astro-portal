from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.customer import Customer
from app.models.customer_solution import CustomerSolution
from app.models.solution import Solution
from app.models.user import User
from app.models.visit import PaymentStatus, Visit
from app.schemas.dashboard import (
    CategoryRevenueRow,
    DashboardSummary,
    EarningsSummary,
    PeriodBreakdown,
    RevenueByCategory,
    RevenueSummary,
)

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
            (v.fees for v in group if v.payment_status in (PaymentStatus.pending, PaymentStatus.partial)),
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
        categories_by_visit[visit_id].append(category.value if hasattr(category, "value") else str(category))

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
