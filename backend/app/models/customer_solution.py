# app/models/customer_solution.py
import enum
from datetime import date, datetime
from typing import Optional

from sqlmodel import SQLModel, Field


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
