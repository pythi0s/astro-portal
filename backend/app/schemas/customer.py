# app/schemas/customer.py
from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.customer import Gender


class CustomerCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    birth_time: Optional[time] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    gotra: Optional[str] = None
    lagna: Optional[str] = None

    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    birth_time: Optional[time] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    gotra: Optional[str] = None
    lagna: Optional[str] = None

    notes: Optional[str] = None


# Inline nested schemas to avoid circular imports
class _VisitBrief(BaseModel):
    id: int
    visit_date: date
    consultation_type: str
    fees: Decimal
    payment_status: str
    payment_method: Optional[str] = None
    problems_discussed: Optional[str] = None
    analysis: Optional[str] = None
    recommendations: Optional[str] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class _SolutionBrief(BaseModel):
    id: int
    name: str
    category: str

    model_config = {"from_attributes": True}


class _CustomerSolutionBrief(BaseModel):
    id: int
    solution_id: int
    visit_id: Optional[int] = None
    given_date: date
    status: str
    notes: Optional[str] = None
    created_at: datetime
    solution: Optional[_SolutionBrief] = None

    model_config = {"from_attributes": True}


class CustomerRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    birth_time: Optional[time] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    gotra: Optional[str] = None
    lagna: Optional[str] = None

    photo_path: Optional[str] = None
    kundali_file_path: Optional[str] = None
    kundali_original_name: Optional[str] = None

    notes: Optional[str] = None
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Nested relationships (populated when eager-loaded)
    visits: list[_VisitBrief] = []
    customer_solutions: list[_CustomerSolutionBrief] = []

    model_config = {"from_attributes": True}


class CustomerList(BaseModel):
    """Slim list-view schema used by GET /customers/. Keeps enough fields for
    the existing Vue CustomerList view (name, contact, city, rashi, gender,
    photo, created_at) without touching the relationship columns that cause
    async-lazy-load errors when serializing a plain `select(Customer)` without
    `selectinload`.
    """

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    city: Optional[str] = None
    rashi: Optional[str] = None
    photo_path: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
