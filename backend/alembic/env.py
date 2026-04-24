import os
import sys

# Ensure app is importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlmodel import SQLModel

import app.models  # IMPORTANT: loads models
from alembic import context
from app.core.config import settings

# Alembic Config
config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata
target_metadata = SQLModel.metadata


# 🔥 FIX: Prevent SQLModel types like AutoString in migrations
def render_item(type_, obj, autogen_context):
    if type_ == "type":
        if obj.__class__.__name__ == "AutoString":
            return "sa.String()"
    return False


# OFFLINE migrations
def run_migrations_offline():
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        render_item=render_item,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        render_item=render_item,
    )

    with context.begin_transaction():
        context.run_migrations()


# ONLINE migrations (async)
async def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


# Entry point
def run():
    asyncio.run(run_migrations_online())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run()
