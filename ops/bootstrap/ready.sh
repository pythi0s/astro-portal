#!/usr/bin/env sh
# READY-banner sidecar for the astro-portal stack.
#
# Compose uses `depends_on: condition: service_healthy` to hold this service
# until every other service is green. By the time we run, the backend's real
# healthcheck has already passed. We still do one extra deep probe against
# `/health?deep=1` so the banner only appears AFTER the DB round-trip succeeds
# end-to-end. Then we print the banner and exit 0.
#
# Keep this script boring: no jq, no bash-isms, pipe-safe output, no colors.

set -eu

BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://backend:8000/health?deep=1}"
REACT_URL_PUBLIC="${FRONTEND_REACT_PUBLIC_URL:-http://localhost:5174}"
VUE_URL_PUBLIC="${FRONTEND_VUE_PUBLIC_URL:-http://localhost:5173}"
API_URL_PUBLIC="${API_PUBLIC_URL:-http://localhost:8000}"
ADMIN_EMAIL_DISPLAY="${SEED_ADMIN_EMAIL:-}"

log() {
    printf '[bootstrap] %s\n' "$1"
}

log "Waiting for backend deep health check at ${BACKEND_HEALTH_URL} ..."

# Retry the deep health probe for up to ~60 seconds. The backend service
# healthcheck should already be green by this point; this is a belt on the
# brace in case /health?deep=1 is momentarily slow during first-run seeding.
i=0
while [ "$i" -lt 60 ]; do
    if wget -q -T 3 -O - "${BACKEND_HEALTH_URL}" 2>/dev/null | grep -q '"status": *"ok"'; then
        break
    fi
    i=$((i + 1))
    sleep 1
done

if [ "$i" -ge 60 ]; then
    log "Backend did not report healthy within 60s. See 'docker compose logs backend'."
    exit 1
fi

if [ -z "${ADMIN_EMAIL_DISPLAY}" ]; then
    ADMIN_EMAIL_DISPLAY="not seeded -- set SEED_ADMIN_EMAIL in .env"
fi

printf '\n'
printf 'astro-portal: READY\n'
printf 'Frontend (React): %s\n' "${REACT_URL_PUBLIC}"
printf 'Frontend (Vue):   %s\n' "${VUE_URL_PUBLIC}"
printf 'API:              %s\n' "${API_URL_PUBLIC}"
printf 'API Docs:         %s/docs\n' "${API_URL_PUBLIC}"
printf 'Admin:            %s\n' "${ADMIN_EMAIL_DISPLAY}"
printf '\n'

exit 0
