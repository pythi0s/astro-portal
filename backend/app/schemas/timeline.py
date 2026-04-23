from __future__ import annotations

from typing import Literal, Optional, Union

from pydantic import BaseModel


class VisitTimelineEvent(BaseModel):
    type: Literal["visit"] = "visit"
    date: str
    id: int
    consultation_type: str
    fees: float
    payment_status: str
    problems_discussed: Optional[str] = None
    notes: Optional[str] = None


class SolutionTimelineEvent(BaseModel):
    type: Literal["solution"] = "solution"
    date: str
    id: int
    solution_name: str
    solution_category: str
    status: str
    notes: Optional[str] = None


class MessageTimelineEvent(BaseModel):
    type: Literal["message"] = "message"
    date: str
    id: int
    channel: str
    subject: Optional[str] = None
    status: str


TimelineEvent = Union[VisitTimelineEvent, SolutionTimelineEvent, MessageTimelineEvent]
