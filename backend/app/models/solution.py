# app/models/solution.py
import enum
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class SolutionCategory(str, enum.Enum):
    gemstone = "gemstone"
    mantra = "mantra"
    puja = "puja"
    remedy = "remedy"
    yantra = "yantra"
    charity = "charity"
    lifestyle = "lifestyle"
    other = "other"


class Solution(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    category: SolutionCategory = Field(default=SolutionCategory.other)
    description: Optional[str] = None
    instructions: Optional[str] = None
    typical_duration: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
