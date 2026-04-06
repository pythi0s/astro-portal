"""Auto-setup: run migrations and bootstrap admin on first start."""

import asyncio
import logging
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config as AlembicConfig
from sqlmodel import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import async_session
from app.models.user import User, UserRole

log = logging.getLogger("uvicorn.error")

# Alembic ini lives at the repo root inside the container
_ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


def _log(msg: str) -> None:
    """Print to stderr (same as uvicorn) and flush immediately."""
    print(f"INFO:     [setup] {msg}", file=sys.stderr, flush=True)


def _alembic_cfg() -> AlembicConfig:
    cfg = AlembicConfig(str(_ALEMBIC_INI))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    return cfg


def _run_migrations() -> None:
    """Run Alembic upgrade in a separate thread so asyncio.run() inside
    env.py doesn't clash with the already-running event loop."""
    command.upgrade(_alembic_cfg(), "head")


async def run_auto_setup() -> None:
    """Called once during application startup (inside the lifespan)."""

    # 1. Run Alembic migrations in a thread to avoid nested-event-loop issues
    _log("Running database migrations …")
    try:
        await asyncio.to_thread(_run_migrations)
        _log("Migrations applied successfully.")
    except Exception as exc:
        _log(f"Migration failed: {exc}")
        return

    # 2. Bootstrap admin if no users exist
    async with async_session() as session:
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            _log("Users already exist — skipping admin bootstrap.")
            _log("Setup complete.")
            return

        admin_email = settings.bootstrap_admin_email
        admin_password = settings.bootstrap_admin_password
        admin_name = settings.bootstrap_admin_name

        if not admin_email or not admin_password:
            _log(
                "No users in DB and BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD "
                "not set. Set them in .env or POST /auth/bootstrap."
            )
            _log("Setup complete (no admin created).")
            return

        user = User(
            email=admin_email,
            hashed_password=hash_password(admin_password),
            full_name=admin_name,
            role=UserRole.admin,
        )
        session.add(user)
        await session.commit()
        _log(f"Created admin user: {admin_email}")
        _log("Setup complete.")
