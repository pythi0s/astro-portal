import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.schemas import (
    InteractionCreate,
    InteractionUpdate,
    InteractionResponse,
)
from app.services.crud import (
    get_client,
    get_interactions,
    get_interaction,
    create_interaction,
    update_interaction,
    delete_interaction,
)

router = APIRouter(prefix="/api/clients/{client_id}/interactions", tags=["interactions"])


@router.get("", response_model=None)
def list_interactions(
    client_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if not get_client(db, client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    result = get_interactions(db, client_id, page=page, per_page=per_page)
    result["items"] = [InteractionResponse.model_validate(i) for i in result["items"]]
    return result


@router.post("", response_model=InteractionResponse, status_code=201)
def create_new_interaction(
    client_id: uuid.UUID,
    interaction: InteractionCreate,
    db: Session = Depends(get_db),
):
    if not get_client(db, client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return create_interaction(db, client_id, interaction)


@router.get("/{interaction_id}", response_model=InteractionResponse)
def read_interaction(
    client_id: uuid.UUID,
    interaction_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    db_interaction = get_interaction(db, interaction_id)
    if not db_interaction or db_interaction.client_id != client_id:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return db_interaction


@router.put("/{interaction_id}", response_model=InteractionResponse)
def update_existing_interaction(
    client_id: uuid.UUID,
    interaction_id: uuid.UUID,
    interaction: InteractionUpdate,
    db: Session = Depends(get_db),
):
    db_interaction = get_interaction(db, interaction_id)
    if not db_interaction or db_interaction.client_id != client_id:
        raise HTTPException(status_code=404, detail="Interaction not found")
    updated = update_interaction(db, interaction_id, interaction)
    return updated


@router.delete("/{interaction_id}", status_code=204)
def delete_existing_interaction(
    client_id: uuid.UUID,
    interaction_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    db_interaction = get_interaction(db, interaction_id)
    if not db_interaction or db_interaction.client_id != client_id:
        raise HTTPException(status_code=404, detail="Interaction not found")
    delete_interaction(db, interaction_id)
