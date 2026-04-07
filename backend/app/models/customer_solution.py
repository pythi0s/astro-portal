# app/models/customer_solution.py
import enum
from datetime import date, datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.solution import Solution


class CustomerSolutionStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    discontinued = "discontinued"


class CustomerSolution(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", index=True)
    solution_id: int = Field(foreign_key="solution.id", index=True)
    visit_id: Optional[int] = Field(default=None, foreign_key="visit.id")
    given_date: date = Field(default_factory=date.today)
    status: CustomerSolutionStatus = Field(default=CustomerSolutionStatus.active)
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    customer: Optional["Customer"] = Relationship(back_populates="customer_solutions")
    solution: Optional["Solution"] = Relationship()
