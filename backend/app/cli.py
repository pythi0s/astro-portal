"""Management CLI for astro-portal backend.

Usage:

    python -m app.cli create-admin --email x@y.z --password <pw> [--name "Admin"]
    python -m app.cli seed-admin-if-missing     # Step 6 entrypoint-safe one-shot
    python -m app.cli migrate                   # Step 6 entrypoint-safe alembic upgrade head
    python -m app.cli wait-for-db [--timeout 60]

Design choices:
- Idempotent: running the same command twice is safe -- if the email already
  exists and is already an active admin, the command exits 0 with a note.
- If the email exists with a different role or is_active=False, the command
  promotes/reactivates it and reports what changed.
- If the email exists but the caller-provided password is different, the
  command does NOT silently overwrite the hash -- it exits non-zero with a
  clear message. Use --force-password to override.
- `seed-admin-if-missing` is env-driven and designed to be called from
  docker-entrypoint.sh. It never fails the container if env vars are missing;
  it just logs and exits 0. It only hard-fails on database errors, which are
  the kind of failure you want to see.
- Stdlib-only (argparse + asyncio). No click/typer dependency.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from pathlib import Path

from sqlalchemy import text
from sqlmodel import select

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.database import async_session, engine
from app.models.user import User, UserRole


def _log(msg: str) -> None:
    print(f"[cli] {msg}", flush=True)


async def _create_admin(
    email: str,
    password: str,
    full_name: str,
    force_password: bool,
) -> int:
    async with async_session() as session:
        existing_q = await session.execute(select(User).where(User.email == email))
        existing = existing_q.scalar_one_or_none()

        if existing is None:
            user = User(
                email=email,
                hashed_password=hash_password(password),
                full_name=full_name,
                role=UserRole.admin,
            )
            session.add(user)
            await session.commit()
            _log(f"Created admin: {email}")
            return 0

        changes: list[str] = []
        if existing.role != UserRole.admin:
            existing.role = UserRole.admin
            changes.append("role=admin")
        if not existing.is_active:
            existing.is_active = True
            changes.append("is_active=True")
        if full_name and existing.full_name != full_name:
            existing.full_name = full_name
            changes.append("full_name updated")

        password_matches = verify_password(password, existing.hashed_password)
        if not password_matches:
            if force_password:
                existing.hashed_password = hash_password(password)
                changes.append("password reset")
            else:
                print(
                    f"User {email} already exists but the provided password does NOT match the "
                    "stored hash. Refusing to overwrite. Re-run with --force-password to reset.",
                    file=sys.stderr,
                )
                return 2

        if not changes:
            _log(f"No changes for {email} -- already an active admin with matching password.")
            return 0

        session.add(existing)
        await session.commit()
        _log(f"Updated {email}: {', '.join(changes)}")
        return 0


async def _seed_admin_if_missing() -> int:
    """Env-driven, container-entrypoint-safe admin seed.

    Exits 0 in every non-fatal situation so a bad env doesn't crash-loop the
    backend. DB errors still exit non-zero so the operator sees them.
    """
    email = settings.effective_seed_admin_email
    password = settings.effective_seed_admin_password
    full_name = settings.effective_seed_admin_name

    if not email or not password:
        _log(
            "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set -- skipping admin seed. "
            "Set them in .env, or create an admin manually via POST /auth/bootstrap."
        )
        return 0

    async with async_session() as session:
        admin_q = await session.execute(
            select(User).where(User.role == UserRole.admin, User.is_active == True)  # noqa: E712
        )
        if admin_q.scalars().first() is not None:
            _log("An active admin already exists -- skipping seed.")
            return 0

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
                _log(f"User already admin+active: {email} -- nothing to do.")
            return 0

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.admin,
        )
        session.add(user)
        await session.commit()
        _log(f"Seeded admin user: {email}")
        return 0


def _run_migrations() -> int:
    """Run Alembic `upgrade head` synchronously.

    Run this from a blocking CLI context (e.g. docker-entrypoint.sh), NOT from
    inside an already-running event loop. That's why this is not async.
    """
    from alembic import command
    from alembic.config import Config as AlembicConfig

    alembic_ini = Path(__file__).resolve().parents[1] / "alembic.ini"
    cfg = AlembicConfig(str(alembic_ini))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)

    _log("Running alembic upgrade head ...")
    command.upgrade(cfg, "head")
    _log("Migrations complete.")
    return 0


async def _wait_for_db(timeout: int) -> int:
    """Block until the database responds to SELECT 1, or timeout.

    The backend container needs to know the DB is really up before running
    migrations. Compose's `depends_on: condition: service_healthy` is usually
    enough, but Postgres briefly accepts connections before it's ready for
    queries on first boot; this is the belt for that brace.
    """
    deadline = time.monotonic() + timeout
    last_err: Exception | None = None
    attempt = 0
    while time.monotonic() < deadline:
        attempt += 1
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            _log(f"Database reachable after {attempt} attempt(s).")
            return 0
        except Exception as exc:
            last_err = exc
            await asyncio.sleep(1)
    _log(f"Database unreachable after {timeout}s: {last_err!r}")
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli", description="Astro-Portal backend CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    create_admin = sub.add_parser("create-admin", help="Create or promote an admin user")
    create_admin.add_argument("--email", required=True)
    create_admin.add_argument("--password", required=True)
    create_admin.add_argument("--name", default="Admin", dest="full_name")
    create_admin.add_argument(
        "--force-password",
        action="store_true",
        help="If the user exists, reset their password to the provided value.",
    )

    sub.add_parser(
        "seed-admin-if-missing",
        help="Create the SEED_ADMIN_* user iff no active admin exists yet (idempotent, env-driven).",
    )

    sub.add_parser(
        "migrate",
        help="Run `alembic upgrade head`. Intended for docker-entrypoint.sh before uvicorn binds.",
    )

    wait = sub.add_parser(
        "wait-for-db",
        help="Block until the database accepts a SELECT 1 query, or timeout.",
    )
    wait.add_argument("--timeout", type=int, default=60)

    args = parser.parse_args(argv)

    if args.command == "create-admin":
        return asyncio.run(
            _create_admin(
                email=args.email,
                password=args.password,
                full_name=args.full_name,
                force_password=args.force_password,
            )
        )

    if args.command == "seed-admin-if-missing":
        return asyncio.run(_seed_admin_if_missing())

    if args.command == "migrate":
        return _run_migrations()

    if args.command == "wait-for-db":
        return asyncio.run(_wait_for_db(args.timeout))

    parser.error(f"Unknown command {args.command}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
