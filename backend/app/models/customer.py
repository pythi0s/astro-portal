# app/models/customer.py
import enum
from datetime import date, datetime, time
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.customer_solution import CustomerSolution
    from app.models.visit import Visit


class Gender(enum.StrEnum):
    male = "male"
    female = "female"
    other = "other"


class Customer(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    # Personal
    name: str
    email: str | None = None
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    birth_time: time | None = None
    birth_place: str | None = None
    occupation: str | None = None
    marital_status: str | None = None

    # Address
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None

    # Astrology
    rashi: str | None = None
    nakshatra: str | None = None
    gotra: str | None = None
    lagna: str | None = None

    # Files
    photo_path: str | None = None
    kundali_file_path: str | None = None
    kundali_original_name: str | None = None

    # Meta
    notes: str | None = None
    is_active: bool = True
    created_by: int | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships (ORM only — no DB column changes)
    visits: list["Visit"] = Relationship(back_populates="customer")
    customer_solutions: list["CustomerSolution"] = Relationship(back_populates="customer")
