# app/models/user.py
import enum
from datetime import datetime

from sqlmodel import Field, SQLModel


class UserRole(enum.StrEnum):
    admin = "admin"
    astrologer = "astrologer"
    receptionist = "receptionist"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: str = ""
    phone: str | None = None
    role: UserRole = Field(default=UserRole.astrologer)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
