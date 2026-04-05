from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.routes import auth, customers, timeline

app = FastAPI(title="Custom CRM API")

app.include_router(health_router)
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(timeline.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "custom-crm-backend", "docs": "/docs"}
