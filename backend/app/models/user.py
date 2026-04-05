# app/models/user.py
import enum
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class UserRole(str, enum.Enum):
    admin = "admin"
    astrologer = "astrologer"
    receptionist = "receptionist"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: str = ""
    phone: Optional[str] = None
    role: UserRole = Field(default=UserRole.astrologer)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
