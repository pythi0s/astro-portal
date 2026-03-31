from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import clients, interactions, dashboard

# Create tables (use Alembic migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Astrologer Client Management Portal",
    description="Manage clients, kundalis, and consultation history",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(interactions.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
