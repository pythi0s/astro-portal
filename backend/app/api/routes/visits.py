# app/api/routes/visits.py
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.customer_solution import CustomerSolution
from app.models.solution import Solution
from app.models.user import User
from app.models.visit import Visit
from app.schemas.visit import VisitCreate, VisitRead, VisitUpdate, VisitWithSolutions, SolutionBrief

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("/", response_model=VisitRead)
async def create_visit(
    body: VisitCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    data = body.model_dump(exclude={"solution_ids"})
    if data.get("visit_date") is None:
        data["visit_date"] = date.today()
    visit = Visit(**data, visited_by=current_user.id)
    session.add(visit)
    await session.flush()

    # Link solutions
    for sol_id in body.solution_ids:
        cs = CustomerSolution(
            customer_id=body.customer_id,
            solution_id=sol_id,
            visit_id=visit.id,
            given_date=visit.visit_date,
        )
        session.add(cs)

    await session.commit()
    await session.refresh(visit)
    return visit


@router.get("/", response_model=list[VisitRead])
async def list_visits(
    customer_id: Optional[int] = Query(None),
    payment_status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Visit)
    if customer_id is not None:
        query = query.where(Visit.customer_id == customer_id)
    if payment_status:
        query = query.where(Visit.payment_status == payment_status)
    if date_from:
        query = query.where(Visit.visit_date >= date_from)
    if date_to:
        query = query.where(Visit.visit_date <= date_to)
    query = query.order_by(Visit.visit_date.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{visit_id}", response_model=VisitWithSolutions)
async def get_visit(
    visit_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    sol_result = await session.execute(
        select(Solution)
        .join(CustomerSolution, CustomerSolution.solution_id == Solution.id)
        .where(CustomerSolution.visit_id == visit_id)
    )
    solutions = [SolutionBrief.model_validate(s) for s in sol_result.scalars().all()]

    visit_data = VisitRead.model_validate(visit).model_dump()
    return VisitWithSolutions(**visit_data, solutions=solutions)


@router.put("/{visit_id}", response_model=VisitRead)
async def update_visit(
    visit_id: int,
    body: VisitUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(visit, key, value)
    visit.updated_at = datetime.utcnow()

    session.add(visit)
    await session.commit()
    await session.refresh(visit)
    return visit


@router.delete("/{visit_id}")
async def delete_visit(
    visit_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    await session.delete(visit)
    await session.commit()
    return {"detail": "Visit deleted"}
