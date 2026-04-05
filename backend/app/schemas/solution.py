# app/schemas/solution.py
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.customer_solution import CustomerSolutionStatus
from app.models.solution import SolutionCategory


class SolutionCreate(BaseModel):
    name: str
    category: SolutionCategory = SolutionCategory.other
    description: Optional[str] = None
    instructions: Optional[str] = None
    typical_duration: Optional[str] = None


class SolutionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[SolutionCategory] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    typical_duration: Optional[str] = None
    is_active: Optional[bool] = None


class SolutionRead(BaseModel):
    id: int
    name: str
    category: SolutionCategory
    description: Optional[str] = None
    instructions: Optional[str] = None
    typical_duration: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerSolutionCreate(BaseModel):
    customer_id: int
    solution_id: int
    visit_id: Optional[int] = None
    given_date: Optional[date] = None
    notes: Optional[str] = None


class CustomerSolutionRead(BaseModel):
    id: int
    customer_id: int
    solution_id: int
    visit_id: Optional[int] = None
    given_date: date
    status: CustomerSolutionStatus
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerSolutionHistory(CustomerSolutionRead):
    solution_name: str
    solution_category: str
