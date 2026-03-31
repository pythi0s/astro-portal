from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.crud import get_dashboard_stats
from app.schemas.schemas import ClientListResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db)):
    stats = get_dashboard_stats(db)
    stats["recent_clients"] = [
        ClientListResponse.model_validate(c) for c in stats["recent_clients"]
    ]
    return stats
