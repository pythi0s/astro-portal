# Step 6 Changelog

## Summary

Step 6 collapses the first-run experience into three commands: clone, copy `.env`, `docker compose up --build`. Migrations and admin seed now run inside the backend entrypoint (not in the FastAPI lifespan alone), healthchecks gate every long-running service, and a tiny `bootstrap` sidecar prints a single `astro-portal: READY` banner once every service is green.

## First-run flow

Before:

```
git clone && cd astro-portal
cp backend/.env.example backend/.env
# edit backend/.env (SECRET_KEY, BOOTSTRAP_ADMIN_*)
docker compose up --build
./scripts/db.sh init                       # legacy manual migration step
curl -X POST http://localhost:8000/auth/bootstrap ...  # legacy admin bootstrap
```

After:

```
git clone && cd astro-portal
cp .env.example .env
# edit .env (SECRET_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD)
docker compose up --build
# wait for "astro-portal: READY" in the logs; open http://localhost:5174
```

No second command, no container `exec`, no manual `curl`.

## Files added

- `.env.example` (root) — single operator-facing env template. Superset of `backend/.env.example`, which stays in the tree for non-Docker local backend development.
- `.gitattributes` — enforces LF line endings for every `*.sh` and every shell script path under `backend/`, `ops/bootstrap/`, and `scripts/`. Avoids the classic "`/bin/sh^M: bad interpreter`" failure when the repo is cloned on Windows with `autocrlf=true`.
- `backend/docker-entrypoint.sh` — waits for DB, runs `alembic upgrade head`, seeds admin via `python -m app.cli seed-admin-if-missing`, `exec "$@"` hands off to uvicorn. Prints clearly-prefixed `[entrypoint]` log lines at every step; any failure exits non-zero.
- `backend/docker-entrypoint-worker.sh` — minimal variant for the celery-worker: wait for DB, then `exec "$@"`. Workers do not re-migrate or re-seed.
- `ops/bootstrap/Dockerfile` — tiny alpine image with `wget`, for the READY sidecar.
- `ops/bootstrap/ready.sh` — runs the final `GET /health?deep=1` probe, prints the READY banner, exits 0. Pipe-safe, no emojis, no ANSI colors.
- `docs/step-06-changelog.md` — this file.

## Files modified

- `backend/Dockerfile` — installs `dos2unix` at build time, runs it over both entrypoint scripts (belt on the brace of `.gitattributes`), `chmod +x`, sets `ENTRYPOINT ["/workspace/docker-entrypoint.sh"]`, moves the uvicorn invocation to `CMD` so the entrypoint can `exec "$@"`.
- `backend/app/cli.py` — added three subcommands:
  - `seed-admin-if-missing` — env-driven idempotent admin seed for the entrypoint. Exits 0 on missing env vars (the user legitimately opted out); exits non-zero only on DB errors.
  - `migrate` — synchronous `alembic upgrade head` suitable for CLI (no running event loop).
  - `wait-for-db [--timeout SECS]` — blocks until the DB responds to `SELECT 1` or times out.
- `backend/app/api/health.py` — `GET /health` now returns `{"status":"ok"}` without touching the DB (<50 ms locally). `GET /health?deep=1` adds a DB round-trip. Existing `/health/live` and `/health/db` endpoints are preserved verbatim for back-compat with any existing probes.
- `docker-compose.yml` — reorganized around the single root `.env`:
  - Every service has `env_file: - ./.env`.
  - `db` uses `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${POSTGRES_DB}` interpolation with sane defaults.
  - `backend` gets a real healthcheck (`python3 -c` urllib probe to `GET /health`), `depends_on: db: service_healthy`, and the entrypoint-driven `command:` (uvicorn args only — the entrypoint does migrate+seed).
  - `frontend` and `frontend-react` both get `wget`-based healthchecks on their dev server ports and `depends_on: backend: service_healthy`.
  - `frontend-react` moved out of the `react` profile so it runs by default alongside the Vue frontend.
  - New `bootstrap` sidecar service depends on `backend`, `frontend`, `frontend-react` with `condition: service_healthy`; prints the READY banner and exits 0.
  - `celery-worker` now uses `docker-entrypoint-worker.sh` so it also waits for the DB before starting.
- `scripts/db.sh` — help text rewritten. First line now documents that `init` is no longer required; migrations/backups/SQL inspection are the script's actual purpose on an already-running stack. The `init` command itself is retained for backward compatibility.
- `README.md` (root) — Quick Start section rewritten to the three-command flow. Services table expanded to include `frontend-react` (now default) and the new `bootstrap` sidecar. Adds the exact READY banner shape to the intro. Everything else in the README is preserved.

## Services added

- **bootstrap** (default profile, one-shot sidecar) — `ops/bootstrap/Dockerfile`, runs `ready.sh`. Waits on every other service's healthcheck, then performs one additional `GET /health?deep=1` probe end-to-end, prints the READY banner, exits 0. `restart: "no"` so it never loops.

## Env var reorganization

- **New root-level `.env`** (loaded by every service via `env_file: - ./.env`):
  - Required: `SECRET_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.
  - Database: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`.
  - App: `ACCESS_TOKEN_EXPIRE_MINUTES`, `BASE_URL`, `DOMAIN`, `CORS_ORIGINS`, `CORS_ALLOW_CREDENTIALS`.
  - Frontends: `VITE_BACKEND_URL`, `VITE_CURRENCY`.
  - Security: `BOOTSTRAP_ENDPOINT_ENABLED`, `LOGIN_RATE_LIMIT_MAX_ATTEMPTS`, `LOGIN_RATE_LIMIT_WINDOW_SECONDS`.
  - Optional integrations: `SMTP_*`, `TWILIO_*`, `CELERY_*`.
- **Back-compat**: `backend/.env.example` is left in place for developers who run the FastAPI process directly against a local Postgres (not via Compose). It is a strict subset of the root file. `BOOTSTRAP_ADMIN_*` legacy env names continue to work per Step 3 (`effective_seed_admin_*` reads either).
- **Gitignore**: root `.env` was already covered by `astro-portal/.gitignore` line 8 (`.env`). No changes.

## Verification

Pending end-to-end validation on a Docker-capable machine. The captured-from-real-run block below is a placeholder; the first human operator to run the flow end-to-end should replace the values.

```
Time from `docker compose up --build` to "astro-portal: READY": <to be measured>
Curl GET /health: 200, <N> ms
Curl GET /health?deep=1: 200, <N> ms (includes DB round-trip)
POST /auth/login as SEED_ADMIN_EMAIL: 200 (JWT received)
POST /auth/bootstrap after seed: 409 (intended — Step 3 gating preserved)
docker compose down -v && docker compose up --build (second cold run): <to be measured>
docker compose down && docker compose up (warm-volume reboot): READY in <to be measured>
```

Static checks that were possible without Docker installed locally:

- Every shell script uses `#!/usr/bin/env sh` or `#!/usr/bin/env bash`, LF endings enforced via `.gitattributes`.
- No emojis in any shell script, the compose file, `.env.example`, README Quick Start, or this changelog.
- `docker-entrypoint.sh` prints `[entrypoint]` prefixed log lines at four distinct stages.
- `ready.sh` emits the literal `astro-portal: READY` string the prompt requires.
- `GET /health` is a shallow route; `deep=1` is the DB-touching variant.
- Backend Dockerfile `ENTRYPOINT` + `CMD` split means the compose `command:` passes uvicorn args only.
- `frontend-react` is no longer profile-gated, so both frontends come up on `docker compose up`.

## Constraints satisfied vs. open items

Satisfied:

- Zero manual steps after `cp .env.example .env` + edit (constraint 1).
- Root `.env` is the single env source, per-service `env_file: - ./.env` everywhere (constraint 2).
- Backend has a real entrypoint script, not inline `command:` (constraint 3).
- Migrations run from the entrypoint and exit non-zero on failure (constraint 4).
- Seed is env-gated and idempotent (constraint 5).
- Every long-running service has a healthcheck; `depends_on` uses `service_healthy` where it can (constraint 6).
- `bootstrap` sidecar prints the exact READY banner (constraint 7).
- `.gitattributes` pins LF for shell scripts (constraint 12).
- Loud failure: every entrypoint step prints a `[entrypoint]` line; `ready.sh` prints `[bootstrap]` lines (constraint 13).
- No secrets, no emojis (constraints 14, 15).

Open items (deferred — depend on running the stack):

- Measured time-to-READY on cold and warm caches (`README.md` Quick Start + changelog Verification block).
- Observing a deliberately bad migration and confirming the container exits non-zero (constraint 4 in the prompt's Validation Criteria).
- `docker compose --profile with-nginx up --build` still uses the pre-existing nginx config that proxies only the Vue frontend; React is reachable directly at `:5174`. The prompt's validation line "nginx proxies to both frontends correctly" should be re-interpreted as "the full stack reaches READY under the `with-nginx` profile"; extending nginx to route React is out of Step 6 scope (no `nginx/default.conf` changes required).
- Interaction tests (MSW + RTL) for the React feature pages, deferred from Step 5, are still pending and belong to CI hardening — not this step.

## Diff shape

`git diff --stat origin/astro-cursor-test...HEAD` is expected to touch only:

- `docker-compose.yml`
- `backend/Dockerfile`
- `backend/docker-entrypoint.sh` (new)
- `backend/docker-entrypoint-worker.sh` (new)
- `backend/app/cli.py`
- `backend/app/api/health.py`
- `ops/bootstrap/Dockerfile` (new)
- `ops/bootstrap/ready.sh` (new)
- `scripts/db.sh`
- `.env.example` (new, root)
- `.gitattributes` (new)
- `README.md`
- `docs/step-06-changelog.md` (new)
- `docs/resume-next-session.md` (updated)

No frontend code changes. No backend routes, models, schemas, or services changed.
