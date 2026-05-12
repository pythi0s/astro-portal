# app/schemas/customer.py
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel

from app.models.customer import Gender


class CustomerCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    birth_time: time | None = None
    birth_place: str | None = None
    occupation: str | None = None
    marital_status: str | None = None

    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    rashi: str | None = None
    nakshatra: str | None = None
    gotra: str | None = None
    lagna: str | None = None

    notes: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    birth_time: time | None = None
    birth_place: str | None = None
    occupation: str | None = None
    marital_status: str | None = None

    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    rashi: str | None = None
    nakshatra: str | None = None
    gotra: str | None = None
    lagna: str | None = None

    notes: str | None = None


# Inline nested schemas to avoid circular imports
class _VisitBrief(BaseModel):
    id: int
    visit_date: date
    consultation_type: str
    fees: Decimal
    payment_status: str
    payment_method: str | None = None
    problems_discussed: str | None = None
    analysis: str | None = None
    recommendations: str | None = None
    follow_up_date: date | None = None
    notes: str | None = None
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
    visit_id: int | None = None
    given_date: date
    status: str
    notes: str | None = None
    created_at: datetime
    solution: _SolutionBrief | None = None

    model_config = {"from_attributes": True}


class CustomerRead(BaseModel):
    """Default Customer response — no relationship fields.

    Used by POST/PUT/photo/kundali endpoints where the ORM object hasn't been
    eager-loaded with relationships. Accessing `customer.visits` or
    `customer.customer_solutions` on an `AsyncSession`-bound instance without
    `selectinload` raises `MissingGreenlet`, so those fields are intentionally
    omitted from this schema. Use `CustomerReadDetail` from the GET-by-id
    endpoint where relationships are eager-loaded.
    """

    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    birth_time: time | None = None
    birth_place: str | None = None
    occupation: str | None = None
    marital_status: str | None = None

    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    rashi: str | None = None
    nakshatra: str | None = None
    gotra: str | None = None
    lagna: str | None = None

    photo_path: str | None = None
    kundali_file_path: str | None = None
    kundali_original_name: str | None = None

    notes: str | None = None
    is_active: bool
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerReadDetail(CustomerRead):
    """Detail response for GET /customers/{id} — adds eager-loaded relationships."""

    visits: list[_VisitBrief] = []
    customer_solutions: list[_CustomerSolutionBrief] = []


class CustomerList(BaseModel):
    """Slim list-view schema used by GET /customers/. Keeps enough fields for
    the existing Vue CustomerList view (name, contact, city, rashi, gender,
    photo, created_at) without touching the relationship columns that cause
    async-lazy-load errors when serializing a plain `select(Customer)` without
    `selectinload`.
    """

    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    gender: Gender | None = None
    city: str | None = None
    rashi: str | None = None
    photo_path: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
