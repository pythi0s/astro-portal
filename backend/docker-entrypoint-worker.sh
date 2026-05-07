#!/usr/bin/env sh
# Astro Portal celery worker entrypoint.
#
# The worker should not run migrations or seed admins (the backend service
# already does both). It just needs the database to be reachable before it
# starts consuming tasks, which may query the DB via SQLAlchemy.

set -eu

log() {
    printf '[entrypoint-worker] %s\n' "$1"
}

log "Waiting for database to accept connections ..."
uv run python -m app.cli wait-for-db --timeout 60

log "Launching celery worker: $*"
exec "$@"
