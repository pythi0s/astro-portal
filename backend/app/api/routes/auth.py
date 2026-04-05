# app/api/routes/auth.py
from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models import User
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(email: str, password: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        return {"error": "Invalid credentials"}

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}
