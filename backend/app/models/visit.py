# app/models/visit.py
import enum
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer import Customer


class ConsultationType(enum.StrEnum):
    first_visit = "first_visit"
    follow_up = "follow_up"
    special = "special"
    emergency = "emergency"


class PaymentStatus(enum.StrEnum):
    paid = "paid"
    pending = "pending"
    partial = "partial"
    waived = "waived"


class PaymentMethod(enum.StrEnum):
    cash = "cash"
    upi = "upi"
    card = "card"
    bank_transfer = "bank_transfer"


class Visit(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    visited_by: int | None = Field(default=None, foreign_key="user.id")

    visit_date: date = Field(default_factory=date.today)
    consultation_type: ConsultationType = Field(default=ConsultationType.follow_up)

    problems_discussed: str | None = None
    analysis: str | None = None
    recommendations: str | None = None

    fees: Decimal = Field(default=Decimal("0.00"), max_digits=10, decimal_places=2)
    payment_status: PaymentStatus = Field(default=PaymentStatus.pending)
    payment_method: PaymentMethod | None = None

    follow_up_date: date | None = None
    notes: str | None = None

    # Soft-delete flag (Step 3). Default True to keep existing rows visible
    # after the backfilling migration runs.
    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="visits")
