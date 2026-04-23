import time

from fastapi import APIRouter
from sqlalchemy import text

from app.db.database import engine

router = APIRouter()


@router.get("/health/live")
async def liveness() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/health/db")
async def db_health() -> dict[str, object]:
    start = time.time()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "database connection failed",
        }
    latency = round((time.time() - start) * 1000, 2)
    return {
        "status": "healthy",
        "database": "connected",
        "latency_ms": latency,
    }
