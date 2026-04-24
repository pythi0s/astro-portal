"""Health endpoints.

- `GET /health` returns 200 in <50 ms without touching the database. This is
  what Docker Compose and k8s readiness probes should hit; a slow DB must not
  make the container itself look unhealthy.
- `GET /health?deep=1` performs a real `SELECT 1` against Postgres and reports
  the round-trip latency. The `bootstrap` sidecar uses this to decide when the
  full stack is READY.
- `GET /health/live` and `GET /health/db` remain as before for any existing
  probes or dashboards -- removing them would be a breaking change for no gain.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Query
from sqlalchemy import text

from app.db.database import engine

router = APIRouter()


async def _db_ping() -> tuple[bool, float | None, str | None]:
    start = time.time()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        return False, None, str(exc)
    latency_ms = round((time.time() - start) * 1000, 2)
    return True, latency_ms, None


@router.get("/health")
async def health(deep: int = Query(0, ge=0, le=1)) -> dict[str, object]:
    """Shallow by default; pass ?deep=1 for a DB round-trip check."""
    if not deep:
        return {"status": "ok"}

    ok, latency_ms, err = await _db_ping()
    if not ok:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "database connection failed",
            "detail": err,
        }
    return {
        "status": "ok",
        "database": "connected",
        "latency_ms": latency_ms,
    }


@router.get("/health/live")
async def liveness() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/health/db")
async def db_health() -> dict[str, object]:
    ok, latency_ms, err = await _db_ping()
    if not ok:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "database connection failed",
            "detail": err,
        }
    return {
        "status": "healthy",
        "database": "connected",
        "latency_ms": latency_ms,
    }
