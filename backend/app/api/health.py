"""Health endpoints.

Probe model (Kubernetes / production Compose):

  GET /health         — liveness probe: <50ms, no DB. Container is alive.
  GET /health/ready   — readiness probe: DB round-trip. Container can serve traffic.
  GET /health?deep=1  — legacy: same as /health/ready, kept for bootstrap sidecar.
  GET /health/live    — legacy alias for /health (backward compat).
  GET /health/db      — legacy alias for /health/ready (backward compat).
"""

from __future__ import annotations

import time
from http import HTTPStatus

from fastapi import APIRouter, Query, Response
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


# ── Liveness ──────────────────────────────────────────────────────────────────
# No DB call — just proves the process is up and the event loop is running.
# Use this for Docker/k8s *liveness* probes (trigger restart on failure).

@router.get("/health")
async def health(deep: int = Query(0, ge=0, le=1)) -> dict[str, object]:
    """Liveness probe. Pass ?deep=1 to also check DB (legacy bootstrap use)."""
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


# ── Readiness ─────────────────────────────────────────────────────────────────
# Performs a real DB round-trip. Returns 503 when DB is unavailable so that
# load balancers / Compose healthchecks can stop routing traffic to this
# instance without triggering a full container restart.

@router.get("/health/ready")
async def readiness(response: Response) -> dict[str, object]:
    """Readiness probe. Use for load-balancer / Compose *readiness* checks."""
    ok, latency_ms, err = await _db_ping()
    if not ok:
        response.status_code = HTTPStatus.SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "disconnected",
            "detail": err,
        }
    return {
        "status": "ready",
        "database": "connected",
        "latency_ms": latency_ms,
    }


# ── Legacy aliases (backward compatibility) ───────────────────────────────────

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
