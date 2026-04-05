# app/schemas/visit.py
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.visit import ConsultationType, PaymentMethod, PaymentStatus


class VisitCreate(BaseModel):
    customer_id: int
    visit_date: Optional[date] = None
    consultation_type: ConsultationType = ConsultationType.follow_up

    problems_discussed: Optional[str] = None
    analysis: Optional[str] = None
    recommendations: Optional[str] = None

    fees: Decimal = Decimal("0.00")
    payment_status: PaymentStatus = PaymentStatus.pending
    payment_method: Optional[PaymentMethod] = None

    follow_up_date: Optional[date] = None
    notes: Optional[str] = None

    solution_ids: list[int] = []


class VisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    consultation_type: Optional[ConsultationType] = None

    problems_discussed: Optional[str] = None
    analysis: Optional[str] = None
    recommendations: Optional[str] = None

    fees: Optional[Decimal] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None

    follow_up_date: Optional[date] = None
    notes: Optional[str] = None


class VisitRead(BaseModel):
    id: int
    customer_id: int
    visited_by: Optional[int] = None
    visit_date: date
    consultation_type: ConsultationType

    problems_discussed: Optional[str] = None
    analysis: Optional[str] = None
    recommendations: Optional[str] = None

    fees: Decimal
    payment_status: PaymentStatus
    payment_method: Optional[PaymentMethod] = None

    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
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
