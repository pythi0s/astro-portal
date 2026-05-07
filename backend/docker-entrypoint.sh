#!/usr/bin/env sh
# Astro Portal backend entrypoint.
#
# Runs exactly once per container start, in this order:
#   1. Wait for the database to accept queries.
#   2. Alembic upgrade to head.
#   3. Seed admin user if SEED_ADMIN_* env vars are set and no admin exists.
#   4. exec the command passed by docker-compose (default: uvicorn).
#
# Every step prints a clearly-prefixed `[entrypoint]` log line. Any step that
# fails causes the container to exit non-zero so orchestration surfaces the
# failure (Docker restart policy, k8s CrashLoopBackOff, compose logs).
#
# Must have LF line endings -- enforced via .gitattributes. On Windows the
# checkout will still be LF; on macOS/Linux it's native.

set -eu

log() {
    printf '[entrypoint] %s\n' "$1"
}

log "Waiting for database to accept connections ..."
uv run python -m app.cli wait-for-db --timeout 60

log "Applying database migrations (alembic upgrade head) ..."
uv run python -m app.cli migrate

log "Seeding admin user if missing (idempotent) ..."
uv run python -m app.cli seed-admin-if-missing

log "Startup tasks complete. Launching: $*"
exec "$@"
