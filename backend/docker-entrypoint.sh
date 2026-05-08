#!/usr/bin/env sh
# Astro Portal backend entrypoint.
#
# Startup order:
#   0. Validate required environment variables.
#      - In ENVIRONMENT=production: hard-fail on missing/insecure values.
#      - In any other environment: warn and continue (dev-friendly).
#   1. Wait for the database to accept queries.
#   2. Alembic upgrade to head.
#   3. Seed admin user if SEED_ADMIN_* env vars are set and no admin exists.
#   4. exec the command passed by docker-compose.

set -eu

log()  { printf '[entrypoint] %s\n' "$1"; }
warn() { printf '[entrypoint] WARNING: %s\n' "$1"; }
err()  { printf '[entrypoint] ERROR: %s\n' "$1"; }

IS_PROD=0
if [ "${ENVIRONMENT:-development}" = "production" ]; then
    IS_PROD=1
fi

# ─── 0. Environment validation ───────────────────────────────────────────────
ISSUES=""

# DATABASE_URL must always be set
if [ -z "${DATABASE_URL:-}" ]; then
    ISSUES="${ISSUES}\n  - DATABASE_URL is not set"
fi

# SECRET_KEY must always be set
if [ -z "${SECRET_KEY:-}" ]; then
    ISSUES="${ISSUES}\n  - SECRET_KEY is not set"
fi

# In production: reject known-insecure placeholder values for SECRET_KEY
if [ "$IS_PROD" = "1" ]; then
    case "${SECRET_KEY:-}" in
        ""|"change-me-in-production"|"astro-dev-secret-key-2026-change-in-production")
            ISSUES="${ISSUES}\n  - SECRET_KEY is empty or uses a known-insecure placeholder."
            ISSUES="${ISSUES}\n    Generate one: python3 -c \"import secrets; print(secrets.token_hex(32))\""
            ;;
    esac
fi

if [ -n "$ISSUES" ]; then
    if [ "$IS_PROD" = "1" ]; then
        err "Production environment validation failed:$(printf '%b' "$ISSUES")"
        err "Set ENVIRONMENT=production only when all values are properly configured."
        exit 1
    else
        warn "Development environment has configuration issues (ignored in non-production):"
        printf '%b\n' "$ISSUES"
    fi
fi

log "Environment: ${ENVIRONMENT:-development} — validation passed."

# ─── 1. Wait for database ─────────────────────────────────────────────────────
log "Waiting for database to accept connections ..."
uv run python -m app.cli wait-for-db --timeout 60

# ─── 2. Migrations ────────────────────────────────────────────────────────────
log "Applying database migrations (alembic upgrade head) ..."
uv run python -m app.cli migrate

# ─── 3. Seed admin (idempotent) ───────────────────────────────────────────────
log "Seeding admin user if missing (idempotent) ..."
uv run python -m app.cli seed-admin-if-missing

# ─── 4. Launch application ───────────────────────────────────────────────────
log "Startup tasks complete. Launching: $*"
exec "$@"
