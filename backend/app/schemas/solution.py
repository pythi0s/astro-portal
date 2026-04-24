# app/schemas/solution.py
from datetime import date, datetime

from pydantic import BaseModel

from app.models.customer_solution import CustomerSolutionStatus
from app.models.solution import SolutionCategory


class SolutionCreate(BaseModel):
    name: str
    category: SolutionCategory = SolutionCategory.other
    description: str | None = None
    instructions: str | None = None
    typical_duration: str | None = None


class SolutionUpdate(BaseModel):
    name: str | None = None
    category: SolutionCategory | None = None
    description: str | None = None
    instructions: str | None = None
    typical_duration: str | None = None
    is_active: bool | None = None


class SolutionRead(BaseModel):
    id: int
    name: str
    category: SolutionCategory
    description: str | None = None
    instructions: str | None = None
    typical_duration: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerSolutionCreate(BaseModel):
    customer_id: int
    solution_id: int
    visit_id: int | None = None
    given_date: date | None = None
    notes: str | None = None


class CustomerSolutionRead(BaseModel):
    id: int
    customer_id: int
    solution_id: int
    visit_id: int | None = None
    given_date: date
    status: CustomerSolutionStatus
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerSolutionHistory(CustomerSolutionRead):
    solution_name: str
    solution_category: str
