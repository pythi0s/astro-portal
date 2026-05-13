# app/models/customer_solution.py
import enum
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.solution import Solution


class CustomerSolutionStatus(enum.StrEnum):
    active = "active"
    completed = "completed"
    discontinued = "discontinued"


class CustomerSolution(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    solution_id: int = Field(foreign_key="solution.id", index=True)
    visit_id: int | None = Field(default=None, foreign_key="visit.id")
    given_date: date = Field(default_factory=date.today)
    status: CustomerSolutionStatus = Field(default=CustomerSolutionStatus.active)
    notes: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="customer_solutions")
    solution: Optional["Solution"] = Relationship()
