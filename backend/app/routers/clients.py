import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.schemas import (
    ClientCreate,
    ClientUpdate,
    ClientResponse,
    ClientListResponse,
    ClientDetailResponse,
)
from app.services.crud import (
    get_clients,
    get_client,
    create_client,
    update_client,
    delete_client,
    update_client_file,
)

router = APIRouter(prefix="/api/clients", tags=["clients"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_PDF_TYPES = {"application/pdf"}


@router.get("", response_model=None)
def list_clients(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=200),
    db: Session = Depends(get_db),
):
    result = get_clients(db, page=page, per_page=per_page, search=search)
    result["items"] = [ClientListResponse.model_validate(c) for c in result["items"]]
    return result


@router.post("", response_model=ClientResponse, status_code=201)
def create_new_client(client: ClientCreate, db: Session = Depends(get_db)):
    return create_client(db, client)


@router.get("/{client_id}", response_model=ClientDetailResponse)
def read_client(client_id: uuid.UUID, db: Session = Depends(get_db)):
    db_client = get_client(db, client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client


@router.put("/{client_id}", response_model=ClientResponse)
def update_existing_client(
    client_id: uuid.UUID, client: ClientUpdate, db: Session = Depends(get_db)
):
    db_client = update_client(db, client_id, client)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client


@router.delete("/{client_id}", status_code=204)
def delete_existing_client(client_id: uuid.UUID, db: Session = Depends(get_db)):
    if not delete_client(db, client_id):
        raise HTTPException(status_code=404, detail="Client not found")


@router.post("/{client_id}/photo", response_model=ClientResponse)
async def upload_photo(
    client_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    db_client = get_client(db, client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    content = await file.read()
    if len(content) > settings.max_photo_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Photo must be under {settings.max_photo_size_mb}MB")

    # Delete old photo if exists
    if db_client.photo_path and os.path.exists(db_client.photo_path):
        os.remove(db_client.photo_path)

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{client_id}{ext}"
    filepath = os.path.join(settings.upload_dir, "photos", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(content)

    return update_client_file(db, client_id, "photo_path", filepath)


@router.post("/{client_id}/kundali", response_model=ClientResponse)
async def upload_kundali(
    client_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    db_client = get_client(db, client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    if file.content_type not in ALLOWED_PDF_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await file.read()
    if len(content) > settings.max_pdf_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"PDF must be under {settings.max_pdf_size_mb}MB")

    if db_client.kundali_pdf_path and os.path.exists(db_client.kundali_pdf_path):
        os.remove(db_client.kundali_pdf_path)

    filename = f"{client_id}.pdf"
    filepath = os.path.join(settings.upload_dir, "kundalis", filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    with open(filepath, "wb") as f:
        f.write(content)

    return update_client_file(db, client_id, "kundali_pdf_path", filepath)


@router.get("/{client_id}/photo")
def get_photo(client_id: uuid.UUID, db: Session = Depends(get_db)):
    db_client = get_client(db, client_id)
    if not db_client or not db_client.photo_path:
        raise HTTPException(status_code=404, detail="Photo not found")
    if not os.path.exists(db_client.photo_path):
        raise HTTPException(status_code=404, detail="Photo file missing")
    return FileResponse(db_client.photo_path)


@router.get("/{client_id}/kundali")
def get_kundali(client_id: uuid.UUID, db: Session = Depends(get_db)):
    db_client = get_client(db, client_id)
    if not db_client or not db_client.kundali_pdf_path:
        raise HTTPException(status_code=404, detail="Kundali not found")
    if not os.path.exists(db_client.kundali_pdf_path):
        raise HTTPException(status_code=404, detail="Kundali file missing")
    return FileResponse(db_client.kundali_pdf_path, media_type="application/pdf")
