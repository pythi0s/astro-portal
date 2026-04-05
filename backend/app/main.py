import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.routes import auth, customers, dashboard, messages, solutions, timeline, visits
from app.core.config import settings

app = FastAPI(title="Astro-Portal CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files
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


@app.get("/")
async def root():
    return {"status": "ok", "service": "astro-portal-backend", "docs": "/docs"}
