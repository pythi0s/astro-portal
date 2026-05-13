import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.routes import admin, auth, customers, dashboard, messages, solutions, timeline, visits
from app.core.config import settings
from app.core.logger import configure_logging, get_logger
from app.core.startup import run_auto_setup

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("application startup", extra={"service": "astro-portal-backend"})
    await run_auto_setup()
    yield
    logger.info("application shutdown")


app = FastAPI(title="Astro-Portal CRM API", lifespan=lifespan)

# ── Request correlation middleware ────────────────────────────────────────────
# Injects a UUID for every request and logs method, path, status, duration.
# All logger calls within a handler will include request_id automatically
# because the log record is enriched by the middleware at the root level.

@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start = time.monotonic()
    response = await call_next(request)
    duration_ms = round((time.monotonic() - start) * 1000, 1)
    # Skip logging for health/metrics probes to avoid log spam
    if not request.url.path.startswith("/health"):
        logger.info(
            "http request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
    response.headers["X-Request-ID"] = request_id
    return response


# ── CORS ──────────────────────────────────────────────────────────────────────
# Wildcard is intentionally not used when allow_credentials is true
# (browsers reject that combination per spec).
_cors_origins = settings.cors_origin_list or ["http://localhost:5173", "http://localhost:5174"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static uploads ────────────────────────────────────────────────────────────
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(visits.router)
app.include_router(solutions.router)
app.include_router(timeline.router)
app.include_router(messages.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "astro-portal-backend", "docs": "/docs"}
