# app/api/routes/timeline.py
from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models import TimelineEvent

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.post("/")
async def add_event(event: TimelineEvent, session: AsyncSession = Depends(get_session)):
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.get("/{customer_id}")
async def get_timeline(customer_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(TimelineEvent).where(TimelineEvent.customer_id == customer_id)
    )
    return result.scalars().all()
