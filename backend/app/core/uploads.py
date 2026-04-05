# app/core/uploads.py
import os
import uuid

from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOC_TYPES = {"application/pdf"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_DOC_SIZE = 10 * 1024 * 1024  # 10 MB


async def save_upload(file: UploadFile, subfolder: str, max_size: int, allowed_types: set[str]) -> str:
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {', '.join(allowed_types)}",
        )

    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {max_size // (1024 * 1024)} MB",
        )

    # Keep original filename but prefix with short UUID for uniqueness
    original = file.filename or "file"
    # Sanitize: keep only alphanumeric, dots, hyphens, underscores
    safe_name = "".join(ch if ch.isalnum() or ch in ".-_" else "_" for ch in original)
    filename = f"{uuid.uuid4().hex[:8]}_{safe_name}"
    dir_path = os.path.join(settings.upload_dir, subfolder)
    os.makedirs(dir_path, exist_ok=True)

    file_path = os.path.join(dir_path, filename)
    with open(file_path, "wb") as f:
        f.write(content)

    return f"{subfolder}/{filename}"


async def save_photo(file: UploadFile) -> str:
    return await save_upload(file, "photos", MAX_PHOTO_SIZE, ALLOWED_IMAGE_TYPES)


async def save_kundali(file: UploadFile) -> str:
    return await save_upload(file, "kundali", MAX_DOC_SIZE, ALLOWED_DOC_TYPES | ALLOWED_IMAGE_TYPES)


def delete_upload(relative_path: str) -> None:
    full_path = os.path.join(settings.upload_dir, relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
