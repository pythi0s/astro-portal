"""Auto-setup: run migrations and bootstrap admin on first start.

Step 3 hardening:
- Migration failures re-raise so the container exits with non-zero rather
  than serving traffic against a broken schema.
- Admin seed is idempotent: only creates a user if no active admin exists
  AND the SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars are set.
- Works on (a) empty DB, (b) partially-migrated DB, (c) fully-migrated DB.
"""

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

_ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


def _log(msg: str) -> None:
    print(f"INFO:     [setup] {msg}", file=sys.stderr, flush=True)


def _alembic_cfg() -> AlembicConfig:
    cfg = AlembicConfig(str(_ALEMBIC_INI))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    return cfg


def _run_migrations() -> None:
    """Run Alembic upgrade in a separate thread so asyncio.run() inside
    env.py doesn't clash with the already-running event loop."""
    command.upgrade(_alembic_cfg(), "head")


async def _seed_admin() -> None:
    email = settings.effective_seed_admin_email
    password = settings.effective_seed_admin_password
    full_name = settings.effective_seed_admin_name

    if not email or not password:
        _log(
            "No SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD — skipping admin seed. "
            "Either set them in .env, run `python -m app.cli create-admin ...`, "
            "or POST /auth/bootstrap before any user is created."
        )
        return

    async with async_session() as session:
        admin_q = await session.execute(
            select(User).where(User.role == UserRole.admin, User.is_active == True)  # noqa: E712
        )
        if admin_q.scalars().first() is not None:
            _log("An active admin already exists — skipping seed.")
            return

        # If a user with the configured email already exists, promote it idempotently
        # rather than fail with a unique-constraint violation.
        existing_q = await session.execute(select(User).where(User.email == email))
        existing = existing_q.scalar_one_or_none()
        if existing is not None:
            promoted = False
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                promoted = True
            if not existing.is_active:
                existing.is_active = True
                promoted = True
            if promoted:
                session.add(existing)
                await session.commit()
                _log(f"Existing user promoted to active admin: {email}")
            else:
                _log(f"User already admin+active: {email} — nothing to do.")
            return

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.admin,
        )
        session.add(user)
        await session.commit()
        _log(f"Seeded admin user: {email}")


async def run_auto_setup() -> None:
    """Called once during application startup (inside the lifespan)."""

    _log("Running database migrations …")
    try:
        await asyncio.to_thread(_run_migrations)
    except Exception as exc:
        _log(f"Migration failed: {exc}")
        # Re-raise so the process exits non-zero and orchestration (Docker
        # restart policy, k8s CrashLoopBackOff) surfaces the failure instead
        # of serving traffic on a broken schema.
        raise
    _log("Migrations applied successfully.")

    await _seed_admin()
    _log("Setup complete.")
