# app/schemas/dashboard.py
from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class PeriodBreakdown(BaseModel):
    label: str  # e.g. "2026-04-05", "Week 14", "April 2026"
    total_fees: Decimal
    visit_count: int
    paid_count: int
    pending_amount: Decimal


class EarningsSummary(BaseModel):
    period: str  # "daily", "weekly", "monthly"
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
