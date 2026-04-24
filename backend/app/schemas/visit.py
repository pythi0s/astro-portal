# app/schemas/visit.py
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.visit import ConsultationType, PaymentMethod, PaymentStatus


class VisitCreate(BaseModel):
    customer_id: int
    visit_date: date | None = None
    consultation_type: ConsultationType = ConsultationType.follow_up

    problems_discussed: str | None = None
    analysis: str | None = None
    recommendations: str | None = None

    fees: Decimal = Decimal("0.00")
    payment_status: PaymentStatus = PaymentStatus.pending
    payment_method: PaymentMethod | None = None

    follow_up_date: date | None = None
    notes: str | None = None

    solution_ids: list[int] = []


class VisitUpdate(BaseModel):
    visit_date: date | None = None
    consultation_type: ConsultationType | None = None

    problems_discussed: str | None = None
    analysis: str | None = None
    recommendations: str | None = None

    fees: Decimal | None = None
    payment_status: PaymentStatus | None = None
    payment_method: PaymentMethod | None = None

    follow_up_date: date | None = None
    notes: str | None = None


class VisitRead(BaseModel):
    id: int
    customer_id: int
    visited_by: int | None = None
    visit_date: date
    consultation_type: ConsultationType

    problems_discussed: str | None = None
    analysis: str | None = None
    recommendations: str | None = None

    fees: Decimal
    payment_status: PaymentStatus
    payment_method: PaymentMethod | None = None

    follow_up_date: date | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SolutionBrief(BaseModel):
    id: int
    name: str
    category: str

    model_config = {"from_attributes": True}


class VisitWithSolutions(VisitRead):
    solutions: list[SolutionBrief] = []
