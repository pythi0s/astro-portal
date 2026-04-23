"""Management CLI for astro-portal backend.

Usage:

    python -m app.cli create-admin --email x@y.z --password <pw> [--name "Admin"]

Design choices:
- Idempotent: running the same command twice is safe — if the email already
  exists and is already an active admin, the command exits 0 with a note.
- If the email exists with a different role or is_active=False, the command
  promotes/reactivates it and reports what changed.
- If the email exists but the caller-provided password is different, the
  command does NOT silently overwrite the hash — it exits non-zero with a
  clear message. Use `--force-password` to override.
- Stdlib-only (argparse + asyncio). No click/typer dependency.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from sqlmodel import select

from app.core.security import hash_password, verify_password
from app.db.database import async_session
from app.models.user import User, UserRole


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
            print(f"Created admin: {email}")
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
            print(f"No changes for {email} — already an active admin with matching password.")
            return 0

        session.add(existing)
        await session.commit()
        print(f"Updated {email}: {', '.join(changes)}")
        return 0


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

    parser.error(f"Unknown command {args.command}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
