import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.routes import admin, auth, customers, dashboard, messages, solutions, timeline, visits
from app.core.config import settings
from app.core.startup import run_auto_setup


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_auto_setup()
    yield


app = FastAPI(title="Astro-Portal CRM API", lifespan=lifespan)

# CORS: explicit origin allow-list. Wildcard is intentionally not supported
# when allow_credentials is true (browsers reject that combination).
_cors_origins = settings.cors_origin_list or ["http://localhost:5173", "http://localhost:5174"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

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
