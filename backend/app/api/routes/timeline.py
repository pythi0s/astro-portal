from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.customer_solution import CustomerSolution
from app.models.message_log import MessageLog
from app.models.solution import Solution
from app.models.user import User
from app.models.visit import Visit
from app.schemas.timeline import (
    MessageTimelineEvent,
    SolutionTimelineEvent,
    TimelineEvent,
    VisitTimelineEvent,
)

router = APIRouter(prefix="/timeline", tags=["timeline"])


@router.get("/{customer_id}", response_model=list[TimelineEvent])
async def get_timeline(
    customer_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []

    visit_result = await session.execute(
        select(Visit).where(Visit.customer_id == customer_id)
    )
    for v in visit_result.scalars().all():
        events.append(
            VisitTimelineEvent(
                date=v.visit_date.isoformat(),
                id=v.id,
                consultation_type=v.consultation_type.value,
                fees=float(v.fees),
                payment_status=v.payment_status.value,
                problems_discussed=v.problems_discussed,
                notes=v.notes,
            )
        )

    sol_result = await session.execute(
        select(CustomerSolution, Solution)
        .join(Solution, CustomerSolution.solution_id == Solution.id)
        .where(CustomerSolution.customer_id == customer_id)
    )
    for cs, sol in sol_result.all():
        events.append(
            SolutionTimelineEvent(
                date=cs.given_date.isoformat(),
                id=cs.id,
                solution_name=sol.name,
                solution_category=sol.category.value,
                status=cs.status.value,
                notes=cs.notes,
            )
        )

    msg_result = await session.execute(
        select(MessageLog).where(MessageLog.customer_id == customer_id)
    )
    for m in msg_result.scalars().all():
        events.append(
            MessageTimelineEvent(
                date=(m.sent_at or m.created_at).isoformat(),
                id=m.id,
                channel=m.channel,
                subject=m.subject,
                status=m.status.value,
            )
        )

    events.sort(key=lambda e: e.date, reverse=True)
    # In-memory pagination is acceptable at current event volumes (dozens per
    # customer). See GAP-PERF-01 for SQL-side UNION if this ever grows.
    return events[skip : skip + limit]
