from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class VisitTimelineEvent(BaseModel):
    type: Literal["visit"] = "visit"
    date: str
    id: int
    consultation_type: str
    fees: float
    payment_status: str
    problems_discussed: str | None = None
    notes: str | None = None


class SolutionTimelineEvent(BaseModel):
    type: Literal["solution"] = "solution"
    date: str
    id: int
    solution_name: str
    solution_category: str
    status: str
    notes: str | None = None


class MessageTimelineEvent(BaseModel):
    type: Literal["message"] = "message"
    date: str
    id: int
    channel: str
    subject: str | None = None
    status: str


TimelineEvent = VisitTimelineEvent | SolutionTimelineEvent | MessageTimelineEvent
