# app/models/customer_account.py
from datetime import datetime

from sqlmodel import Field, SQLModel


class CustomerAccount(SQLModel, table=True):
    """Self-service login for the customer portal. Deliberately separate from
    `User` so portal accounts can never satisfy staff RBAC checks."""

    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id", unique=True, index=True)
    # Normalised mobile (+<country><number>) is the unique login identifier.
    phone: str = Field(index=True, unique=True)
    email: str | None = Field(default=None, index=True, unique=True)
    hashed_password: str
    is_active: bool = True
    # Consent for automated booking confirmations/reminders (email + WhatsApp).
    reminders_opt_in: bool = True
    last_login_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
