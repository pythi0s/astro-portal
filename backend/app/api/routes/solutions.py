# app/api/routes/solutions.py
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import get_current_user
from app.db.database import get_session
from app.models.solution import Solution, SolutionCategory
from app.models.user import User
from app.schemas.solution import SolutionCreate, SolutionRead, SolutionUpdate

router = APIRouter(prefix="/solutions", tags=["solutions"])


@router.post("/", response_model=SolutionRead)
async def create_solution(
    body: SolutionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    solution = Solution(**body.model_dump())
    session.add(solution)
    await session.commit()
    await session.refresh(solution)
    return solution


@router.get("/", response_model=list[SolutionRead])
async def list_solutions(
    category: SolutionCategory | None = Query(None),
    is_active: bool | None = Query(None),
    search: str | None = Query(None, description="Substring match on name or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Solution)
    if category:
        query = query.where(Solution.category == category)
    if is_active is not None:
        query = query.where(Solution.is_active == is_active)
    if search:
        like = f"%{search}%"
        query = query.where(
            (Solution.name.ilike(like)) | (Solution.description.ilike(like))
        )
    query = query.order_by(Solution.name).offset(skip).limit(limit)
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/{solution_id}", response_model=SolutionRead)
async def get_solution(
    solution_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Solution).where(Solution.id == solution_id))
    solution = result.scalar_one_or_none()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")
    return solution


@router.put("/{solution_id}", response_model=SolutionRead)
async def update_solution(
    solution_id: int,
    body: SolutionUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Solution).where(Solution.id == solution_id))
    solution = result.scalar_one_or_none()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(solution, key, value)
    solution.updated_at = datetime.utcnow()

    session.add(solution)
    await session.commit()
    await session.refresh(solution)
    return solution


@router.delete("/{solution_id}")
async def delete_solution(
    solution_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(select(Solution).where(Solution.id == solution_id))
    solution = result.scalar_one_or_none()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    solution.is_active = False
    solution.updated_at = datetime.utcnow()
    session.add(solution)
    await session.commit()
    return {"detail": "Solution deactivated"}
