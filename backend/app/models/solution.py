# app/models/solution.py
import enum
from datetime import datetime

from sqlmodel import Field, SQLModel


class SolutionCategory(enum.StrEnum):
    gemstone = "gemstone"
    mantra = "mantra"
    puja = "puja"
    remedy = "remedy"
    yantra = "yantra"
    charity = "charity"
    lifestyle = "lifestyle"
    other = "other"


class Solution(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    category: SolutionCategory = Field(default=SolutionCategory.other)
    description: str | None = None
    instructions: str | None = None
    typical_duration: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
