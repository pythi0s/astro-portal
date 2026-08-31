from unittest.mock import AsyncMock

import pytest
from pydantic import ValidationError

from app.api import health as health_module
from app.core import startup
from app.core.config import Settings


def test_settings_reject_credentialed_wildcard_cors():
    with pytest.raises(ValidationError, match="CORS_ORIGINS cannot contain"):
        Settings(
            database_url="sqlite+aiosqlite:///:memory:",
            cors_origins="*",
            cors_allow_credentials=True,
            _env_file=None,
        )


def test_settings_allow_explicit_credentialed_cors_origins():
    configured = Settings(
        database_url="sqlite+aiosqlite:///:memory:",
        cors_origins="https://astro.example, https://admin.astro.example",
        cors_allow_credentials=True,
        _env_file=None,
    )

    assert configured.cors_origin_list == [
        "https://astro.example",
        "https://admin.astro.example",
    ]


async def test_auto_setup_propagates_migration_failure(monkeypatch):
    def fail_migration():
        raise RuntimeError("migration failed")

    seed_admin = AsyncMock()
    monkeypatch.setattr(startup, "_run_migrations", fail_migration)
    monkeypatch.setattr(startup, "_seed_admin", seed_admin)

    with pytest.raises(RuntimeError, match="migration failed"):
        await startup.run_auto_setup()

    seed_admin.assert_not_awaited()


@pytest.mark.parametrize("path", ["/health?deep=1", "/health/ready", "/health/db"])
async def test_database_probes_return_503_without_internal_details(client, monkeypatch, path):
    async def failed_ping():
        return False, None, "connection refused at internal-db:5432"

    monkeypatch.setattr(health_module, "_db_ping", failed_ping)

    response = await client.get(path)

    assert response.status_code == 503
    assert response.json()["database"] == "disconnected"
    assert "detail" not in response.json()


async def test_liveness_does_not_require_database(client, monkeypatch):
    db_ping = AsyncMock(side_effect=AssertionError("liveness must not query the database"))
    monkeypatch.setattr(health_module, "_db_ping", db_ping)

    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    db_ping.assert_not_awaited()
