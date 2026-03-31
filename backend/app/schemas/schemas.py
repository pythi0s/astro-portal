import uuid
from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# --------------- Client Schemas ---------------

class ClientBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    time_of_birth: Optional[time] = None
    place_of_birth: Optional[str] = None
    mobile_number: Optional[str] = Field(None, max_length=15, pattern=r"^\+?[0-9]{7,15}$")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = "India"
    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    gotra: Optional[str] = None
    lagna: Optional[str] = None
    manglik_status: Optional[str] = None
    notes: Optional[str] = None
    referred_by: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    time_of_birth: Optional[time] = None
    place_of_birth: Optional[str] = None
    mobile_number: Optional[str] = Field(None, max_length=15, pattern=r"^\+?[0-9]{7,15}$")
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = None
    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    gotra: Optional[str] = None
    lagna: Optional[str] = None
    manglik_status: Optional[str] = None
    notes: Optional[str] = None
    referred_by: Optional[str] = None


class ClientResponse(ClientBase):
    id: uuid.UUID
    photo_path: Optional[str] = None
    kundali_pdf_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    rashi: Optional[str] = None
    photo_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --------------- Interaction Schemas ---------------

class InteractionBase(BaseModel):
    interaction_date: datetime
    interaction_type: str = Field(
        ...,
        description="One of: consultation, phone_call, follow_up, remedy, prediction, puja, gemstone, general",
    )
    summary: str = Field(..., min_length=1, max_length=500)
    details: Optional[str] = None
    solutions_given: Optional[str] = None
    remedies: Optional[str] = None
    fees_charged: Optional[Decimal] = Field(None, ge=0)
    payment_mode: Optional[str] = None
    next_followup_date: Optional[date] = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    interaction_date: Optional[datetime] = None
    interaction_type: Optional[str] = None
    summary: Optional[str] = Field(None, min_length=1, max_length=500)
    details: Optional[str] = None
    solutions_given: Optional[str] = None
    remedies: Optional[str] = None
    fees_charged: Optional[Decimal] = Field(None, ge=0)
    payment_mode: Optional[str] = None
    next_followup_date: Optional[date] = None


class InteractionResponse(InteractionBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ClientDetailResponse(ClientResponse):
    interactions: list[InteractionResponse] = []

    class Config:
        from_attributes = True


# --------------- Pagination ---------------

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    per_page: int
    pages: int
