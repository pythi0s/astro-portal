# app/models/message_template.py
import enum
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class MessageChannel(enum.StrEnum):
    email = "email"
    whatsapp = "whatsapp"


class TriggerType(enum.StrEnum):
    first_visit = "first_visit"
    follow_up = "follow_up"
    solution_given = "solution_given"
    custom = "custom"


class MessageTemplate(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    channel: MessageChannel = Field(default=MessageChannel.email)
    trigger_type: TriggerType = Field(default=TriggerType.custom)
    subject: str | None = None
    body: str

    # ── Phase 4.1 additions ───────────────────────────────────────────────
    # `variables`: declarative spec for template placeholders.
    #   Shape: {"customer_name": {"type": "string", "sample": "Rahul"}, ...}
    #   Consumed by the preview endpoint and the variable-inspector sidebar.
    variables: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    # Rendered snapshot of the last successful preview.  Cached so template
    # lists can show a thumbnail without re-rendering.
    preview_snapshot: str | None = None
    # List of upload IDs / URLs referenced by this template (email attachments).
    #   Shape: [{"kind": "upload", "id": 42, "filename": "kundali.pdf"}, ...]
    attachments: list[dict[str, Any]] | None = Field(default=None, sa_column=Column(JSON))
    # Transactional templates bypass the marketing opt-out check.
    is_transactional: bool = Field(default=False)
    # Open/click tracking is per-template so operators can disable it for
    # internal recipients or privacy-sensitive segments.
    track_opens: bool = Field(default=False)
    track_clicks: bool = Field(default=False)

    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
