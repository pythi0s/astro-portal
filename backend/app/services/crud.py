import math
import uuid
from typing import Optional

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.models.models import Client, Interaction
from app.schemas.schemas import ClientCreate, ClientUpdate, InteractionCreate, InteractionUpdate


# --------------- Client CRUD ---------------

def get_clients(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
):
    query = db.query(Client)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Client.first_name.ilike(search_filter),
                Client.last_name.ilike(search_filter),
                Client.mobile_number.ilike(search_filter),
                Client.email.ilike(search_filter),
                Client.city.ilike(search_filter),
                Client.rashi.ilike(search_filter),
                Client.nakshatra.ilike(search_filter),
            )
        )

    total = query.count()
    items = (
        query.order_by(Client.updated_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if per_page else 0,
    }


def get_client(db: Session, client_id: uuid.UUID):
    return db.query(Client).filter(Client.id == client_id).first()


def create_client(db: Session, client: ClientCreate):
    db_client = Client(**client.model_dump(exclude_unset=True))
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


def update_client(db: Session, client_id: uuid.UUID, client: ClientUpdate):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        return None
    update_data = client.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
    db.commit()
    db.refresh(db_client)
    return db_client


def delete_client(db: Session, client_id: uuid.UUID):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        return False
    db.delete(db_client)
    db.commit()
    return True


def update_client_file(db: Session, client_id: uuid.UUID, field: str, path: str):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        return None
    setattr(db_client, field, path)
    db.commit()
    db.refresh(db_client)
    return db_client


# --------------- Interaction CRUD ---------------

def get_interactions(db: Session, client_id: uuid.UUID, page: int = 1, per_page: int = 50):
    query = db.query(Interaction).filter(Interaction.client_id == client_id)
    total = query.count()
    items = (
        query.order_by(Interaction.interaction_date.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if per_page else 0,
    }


def get_interaction(db: Session, interaction_id: uuid.UUID):
    return db.query(Interaction).filter(Interaction.id == interaction_id).first()


def create_interaction(db: Session, client_id: uuid.UUID, interaction: InteractionCreate):
    db_interaction = Interaction(
        client_id=client_id, **interaction.model_dump(exclude_unset=True)
    )
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


def update_interaction(db: Session, interaction_id: uuid.UUID, interaction: InteractionUpdate):
    db_interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not db_interaction:
        return None
    update_data = interaction.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_interaction, key, value)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction


def delete_interaction(db: Session, interaction_id: uuid.UUID):
    db_interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not db_interaction:
        return False
    db.delete(db_interaction)
    db.commit()
    return True


def get_dashboard_stats(db: Session):
    total_clients = db.query(func.count(Client.id)).scalar()
    total_interactions = db.query(func.count(Interaction.id)).scalar()
    recent_clients = (
        db.query(Client)
        .order_by(Client.created_at.desc())
        .limit(5)
        .all()
    )
    return {
        "total_clients": total_clients,
        "total_interactions": total_interactions,
        "recent_clients": recent_clients,
    }
