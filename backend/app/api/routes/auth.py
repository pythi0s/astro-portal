# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)
from app.db.database import get_session
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token)


@router.post("/register", response_model=UserRead)
async def register(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role([UserRole.admin])),
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


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserRead)
async def update_me(
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.phone is not None:
        current_user.phone = body.phone

    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.post("/bootstrap", response_model=UserRead)
async def bootstrap_admin(body: UserCreate, session: AsyncSession = Depends(get_session)):
    """Create the first admin user. Only works when no users exist."""
    result = await session.execute(select(User))
    if result.scalars().first() is not None:
        raise HTTPException(status_code=400, detail="Users already exist. Use /auth/register.")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=UserRole.admin,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
