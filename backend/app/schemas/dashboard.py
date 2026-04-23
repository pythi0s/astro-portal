from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class PeriodBreakdown(BaseModel):
    label: str
    total_fees: Decimal
    visit_count: int
    paid_count: int
    pending_amount: Decimal


class EarningsSummary(BaseModel):
    period: str
    start_date: date
    end_date: date
    breakdown: list[PeriodBreakdown]
    grand_total: Decimal


class DashboardSummary(BaseModel):
    total_customers: int
    active_customers: int
    visits_this_month: int
    revenue_this_month: Decimal
    pending_payments: Decimal
    new_customers_this_month: int


class RevenueSummary(BaseModel):
    """Range-aware revenue snapshot. `from`/`to` are inclusive dates.

    - `collected` = sum(fees) where payment_status=paid
    - `outstanding` = sum(fees) where payment_status in (pending, partial)
    - `waived` = sum(fees) where payment_status=waived
    - `gross` = collected + outstanding + waived
    - `visit_count` = count of visits in range
    - `avg_fee` = gross / visit_count (0 when visit_count==0)
    - `collection_rate` = collected / (collected + outstanding); 0 when denom==0.
      `waived` is excluded from the denominator deliberately.
    """

    from_date: date
    to_date: date
    collected: Decimal
    outstanding: Decimal
    waived: Decimal
    gross: Decimal
    visit_count: int
    avg_fee: Decimal
    collection_rate: float


class CategoryRevenueRow(BaseModel):
    category: str
    total_fees: Decimal
    visit_count: int


class RevenueByCategory(BaseModel):
    """`visit.fees` is split equally across the linked solutions for that visit
    (see allocation note in docs/api-audit.md §5). Visits with zero linked
    solutions contribute to a synthetic `__unassigned__` bucket.
    """

    from_date: date
    to_date: date
    rows: list[CategoryRevenueRow]
    grand_total: Decimal
    unassigned_bucket_label: Optional[str] = "__unassigned__"
