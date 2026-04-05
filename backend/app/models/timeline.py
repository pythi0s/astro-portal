# app/models/timeline.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class TimelineEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="customer.id")
    event_type: str
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
