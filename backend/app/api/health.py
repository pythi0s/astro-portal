from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_session
import time

router = APIRouter()


@router.get("/health/live")
async def liveness():
    return {"status": "alive"}


@router.get("/health/db")
async def db_health(session: AsyncSession = Depends(get_session)):
    start = time.time()
    try:
        await session.execute(text("SELECT 1"))
        latency = round((time.time() - start) * 1000, 2)

        return {
            "status": "healthy",
            "database": "connected",
            "latency_ms": latency,
        }
    except Exception:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "database connection failed",
        }
