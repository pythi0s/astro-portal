# app/models/customer.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Customer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
