"""Backend test scaffolding.

Uses an in-memory SQLite database (aiosqlite) and SQLModel.metadata.create_all
so the test suite stands alone — no Postgres, no Docker, no migrations. The
production `get_session` and `get_current_user` dependencies are overridden via
`app.dependency_overrides` so the auth tree is bypassed without modifying any
route code.

Note on env-vars: `app.core.config.Settings` requires `database_url`. We set it
before importing `app.main` so the import-time engine creation in
`app.db.database` resolves to a (never-actually-used) SQLite URL rather than
failing validation. The real engine is shadowed by the `get_session` override.
"""

import os
import tempfile

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret")
# Keep `app.main`'s `os.makedirs(settings.upload_dir, exist_ok=True)` portable;
# the production default is a Linux-shaped /workspace/uploads.
os.environ.setdefault("UPLOAD_DIR", os.path.join(tempfile.gettempdir(), "astro-portal-tests"))

from collections.abc import AsyncIterator  # noqa: E402

import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import (  # noqa: E402
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402

import app.models  # noqa: F401, E402  — register every SQLModel with the shared metadata
from app.core.security import get_current_user  # noqa: E402
from app.db.database import get_session  # noqa: E402
from app.main import app  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402


@pytest_asyncio.fixture
async def engine():
    """Single shared in-memory SQLite engine for the test.

    `StaticPool` keeps the same underlying connection alive across all
    sessions, which is required because `:memory:` databases are scoped to a
    connection. Without it, each new session would see an empty database.
    """
    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    try:
        yield eng
    finally:
        await eng.dispose()


@pytest_asyncio.fixture
async def session_factory(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def test_user(session_factory) -> User:
    """A persisted admin user used by `created_by` foreign keys in routes."""
    async with session_factory() as session:
        user = User(
            email="tester@example.com",
            hashed_password="not-used-in-tests",
            full_name="Tester",
            role=UserRole.admin,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


@pytest_asyncio.fixture
async def client(session_factory, test_user) -> AsyncIterator[AsyncClient]:
    """ASGI client with `get_session` and `get_current_user` overridden.

    `ASGITransport` does NOT run the FastAPI lifespan, so `run_auto_setup`
    (which would try to run Alembic against the real database) is skipped —
    exactly what we want.
    """

    async def override_get_session() -> AsyncIterator[AsyncSession]:
        async with session_factory() as session:
            yield session

    async def override_get_current_user() -> User:
        return test_user

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
