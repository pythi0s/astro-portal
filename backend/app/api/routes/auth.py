from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.core.security import (
    client_ip,
    create_access_token,
    get_current_user,
    hash_password,
    login_rate_limiter,
    require_role,
    verify_password,
)
from app.db.database import get_session
from app.models.user import User, UserRole
from app.schemas.auth import (
    BootstrapRequest,
    ChangePasswordRequest,
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    key = client_ip(request)
    login_rate_limiter.check(key)

    result = await session.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.is_active or not verify_password(body.password, user.hashed_password):
        login_rate_limiter.record_failure(key)
        # Intentionally generic — no distinction between unknown email and bad password.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    login_rate_limiter.reset(key)
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(current_user: User = Depends(get_current_user)):
    token = create_access_token(
        {"sub": str(current_user.id), "role": current_user.role.value},
    )
    return TokenResponse(access_token=token)


@router.post("/register", response_model=UserRead, deprecated=True)
async def register(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role([UserRole.admin])),
):
    """Deprecated — prefer POST /admin/users. Kept for backward compatibility with
    the existing Vue frontend. Will be removed in a future release.
    """
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


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    if not verify_password(body.current_password, current_user.hashed_password):
        # Neutral detail: no side-channel on whether the account has a password set.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if body.new_password == body.current_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must differ from the current one")

    current_user.hashed_password = hash_password(body.new_password)
    session.add(current_user)
    await session.commit()


@router.post("/bootstrap", response_model=UserRead)
async def bootstrap_admin(
    body: BootstrapRequest,
    session: AsyncSession = Depends(get_session),
):
    """Create the first admin user. Public, but closed once ANY active admin exists.
    Forces role=admin regardless of request body.
    """
    if not settings.bootstrap_endpoint_enabled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bootstrap is disabled",
        )

    existing_admin = await session.execute(
        select(User).where(User.role == UserRole.admin, User.is_active == True).limit(1)  # noqa: E712
    )
    if existing_admin.scalar_one_or_none() is not None:
        # Neutral response — we do not reveal which admin exists or their email.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bootstrap is closed",
        )

    # Disallow duplicates on the email column (covered by DB unique index too).
    dup = await session.execute(select(User).where(User.email == body.email))
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

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
