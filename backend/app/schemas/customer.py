# app/schemas/customer.py
from datetime import date, datetime, time
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

    notes: Optional[str] = None
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerList(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    rashi: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
