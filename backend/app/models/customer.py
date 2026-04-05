# app/models/customer.py
import enum
from datetime import date, datetime, time
from typing import Optional

from sqlmodel import SQLModel, Field


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Personal
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[date] = None
    birth_time: Optional[time] = None
    birth_place: Optional[str] = None
    occupation: Optional[str] = None
    marital_status: Optional[str] = None

    # Address
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    # Astrology
    rashi: Optional[str] = None
    nakshatra: Optional[str] = None
    gotra: Optional[str] = None
    lagna: Optional[str] = None

    # Files
    photo_path: Optional[str] = None
    kundali_file_path: Optional[str] = None

    # Meta
    notes: Optional[str] = None
    is_active: bool = True
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
