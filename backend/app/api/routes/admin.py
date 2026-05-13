# app/api/routes/admin.py
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, select

from app.core.security import hash_password, require_role
from app.db.database import get_session
from app.models.user import User, UserRole
from app.schemas.auth import AdminStats, UserCreate, UserRead

router = APIRouter(prefix="/admin", tags=["admin"])

_admin_only = require_role([UserRole.admin])


# -- User Management --


@router.get("/users", response_model=list[UserRead])
async def list_users(
    role: UserRole | None = Query(None),
    is_active: bool | None = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_admin_only),
):
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    query = query.order_by(User.created_at.desc())
    result = await session.execute(query)
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_admin_only),
):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users", response_model=UserRead, status_code=201)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_admin_only),
):
    existing = await session.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=body.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


class AdminUserUpdate(BaseModel):
    email: str | None = None
    password: str | None = None
    full_name: str | None = None
    phone: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    body: AdminUserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_admin_only),
):
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.email and body.email != user.email:
        dup = await session.execute(
            select(User).where(User.email == body.email, User.id != user_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = body.email

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.phone is not None:
        user.phone = body.phone
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.password:
        user.hashed_password = hash_password(body.password)

    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_admin_only),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    user.updated_at = datetime.utcnow()
    session.add(user)
    await session.commit()
    return {"detail": f"User {user.email} deactivated"}


@router.get("/stats", response_model=AdminStats)
async def admin_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(_admin_only),
):
    total = await session.execute(select(func.count()).select_from(User))
    active = await session.execute(
        select(func.count()).select_from(User).where(User.is_active == True)  # noqa: E712
    )
    admins = await session.execute(
        select(func.count()).select_from(User).where(User.role == UserRole.admin)
    )
    return AdminStats(
        total_users=total.scalar() or 0,
        active_users=active.scalar() or 0,
        admin_count=admins.scalar() or 0,
    )
