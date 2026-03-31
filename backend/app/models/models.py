import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    Date,
    Time,
    Numeric,
    ForeignKey,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(20))
    date_of_birth = Column(Date)
    time_of_birth = Column(Time)
    place_of_birth = Column(String(200))
    mobile_number = Column(String(15), index=True)
    email = Column(String(254), index=True)
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    country = Column(String(100), default="India")

    # Astrology-specific fields
    rashi = Column(String(50))          # Zodiac sign (Moon sign)
    nakshatra = Column(String(50))      # Birth star
    gotra = Column(String(100))
    lagna = Column(String(50))          # Ascendant
    manglik_status = Column(String(20)) # Yes / No / Partial

    # File references
    photo_path = Column(String(500))
    kundali_pdf_path = Column(String(500))

    # Metadata
    notes = Column(Text)
    referred_by = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interactions = relationship(
        "Interaction", back_populates="client", cascade="all, delete-orphan",
        order_by="Interaction.interaction_date.desc()"
    )

    __table_args__ = (
        Index("ix_clients_name", "first_name", "last_name"),
    )


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False
    )
    interaction_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    interaction_type = Column(String(50), nullable=False)
    # Types: consultation, phone_call, follow_up, remedy, prediction, puja, gemstone, general

    summary = Column(String(500), nullable=False)
    details = Column(Text)
    solutions_given = Column(Text)
    remedies = Column(Text)
    fees_charged = Column(Numeric(10, 2))
    payment_mode = Column(String(50))  # cash, upi, bank_transfer, etc.
    next_followup_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    client = relationship("Client", back_populates="interactions")

    __table_args__ = (
        Index("ix_interactions_client_date", "client_id", "interaction_date"),
    )
