# Step 6 — Seamless First-Run Setup (Docker Compose + Alembic + Seed)

> **Target branch:** `intuitive-design`. Verify the working tree is on this branch and clean before starting. No submodules; do NOT run `git submodule update`.
> **Prerequisites:** Steps 1–5 must be complete and merged. You MUST read, in order:
> 1. `astro-portal/docker-compose.yml` and every file under `astro-portal/backend/` referenced by it (`Dockerfile`, `alembic.ini`, `alembic/env.py`, `app/core/startup.py`, `app/core/config.py`, `app/main.py`, `pyproject.toml`).
> 2. `astro-portal/docs/step-03-changelog.md` — confirms what Step 3 already delivered for startup idempotency, first-admin seed, and migration stability. Do NOT duplicate that work; extend and productionize it.
> 3. `astro-portal/scripts/db.sh` and `astro-portal/backend/scripts/db.sh`.
>
> If Step 3 already made startup fully idempotent and auto-migrating, your job is to wrap that in a first-run experience that requires ZERO prior knowledge from the operator.

## Role
You are a senior platform / DevOps engineer specializing in local development ergonomics, reproducible Docker stacks, and safe database migration workflows. You write Compose files and entrypoint scripts that are boring, predictable, and loud about failure. You do NOT add features or change application code beyond what is strictly required to make the stack self-bootstrapping.

## Task / Objective
Make `docker compose up` on a **freshly cloned repo**, on any machine with only Docker Desktop (or Docker Engine + Compose v2) installed, bring the entire stack to a healthy, usable state with:

- Database created and fully migrated to `head`.
- First admin user seeded (from env vars, one-shot, idempotent).
- Backend serving `/health` → 200 within 60 seconds of `up`.
- Both frontends serving:
  - Vue app at `http://localhost:5173`.
  - React app at `http://localhost:5174`.
- API reachable at `http://localhost:8000` with `/docs` live.
- A single clear "READY" log line printed by the stack when all health checks have passed.

The operator's complete first-run experience must be:

```
git clone <repo> && cd astro-portal
cp .env.example .env       # edit SECRET_KEY and SEED_ADMIN_* at minimum
docker compose up --build
# ... wait for "astro-portal: READY" ...
# open http://localhost:5174, log in as the seeded admin
```

No `./scripts/db.sh init`, no manual `curl` to `/auth/bootstrap`, no container exec, no second terminal.

## Context
- Existing Compose services (from Step 2's additions): `db` (postgres:18-alpine), `redis` (redis:7-alpine), `backend` (FastAPI), `frontend` (Vue), `frontend-react` (React, port 5174), `celery-worker` (profile `with-celery`), `nginx` (profile `with-nginx`).
- Existing `.env` pattern: `astro-portal/backend/.env.example` — this file exists today but is backend-only. You will introduce a **root-level `.env.example`** that is the single source of truth the Compose file consumes via `env_file:` + `environment:` passthrough. The backend `.env` pattern is preserved for local non-Docker dev only.
- Step 3 deliverables you must build on (do NOT re-implement):
  - `backend/app/core/startup.py` — idempotent startup (programmatic `alembic upgrade head` + seed gated by env).
  - `backend/app/cli.py` — `create-admin` command.
  - `/auth/bootstrap` — already gated once an admin exists.
- Uploads volume already exists (`uploads:`); keep it.
- Frontends use volume mounts for hot reload (`./frontend:/app` and `./frontend-react:/app`) — preserve that developer experience; do not convert to production builds in this step.
- Cross-platform target: must work on macOS (Apple Silicon + Intel), Linux (x86_64), and Windows (WSL2 + Docker Desktop). No platform-specific binaries pinned in images.
- Node and Python versions: keep `node:20-alpine` and `python:3.11-slim` + `uv` as today.
- Network: all services on the default Compose network; services reference each other by service name (`db`, `redis`, `backend`, `frontend`, `frontend-react`). No `host.docker.internal` in service-to-service calls.

## Example (shape, not exact code)

Root `.env.example` — the single file the operator edits on first run:

```
# --- REQUIRED on first run ---
SECRET_KEY=change-me-in-production
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=change-me-on-first-login
SEED_ADMIN_FULL_NAME=Admin

# --- Database (defaults are fine for local dev) ---
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=crm_password
POSTGRES_DB=crm_database

# --- App ---
ACCESS_TOKEN_EXPIRE_MINUTES=1440
BASE_URL=http://localhost:5174
DOMAIN=localhost
VITE_API_BASE_URL=http://localhost:8000
VITE_CURRENCY=INR

# --- Optional: SMTP / Twilio / Celery ---
SMTP_HOST=
SMTP_PORT=587
...
```

Backend entrypoint (shape):

```bash
#!/usr/bin/env sh
set -eu

echo "[entrypoint] waiting for db..."
until uv run python -c "import asyncio, asyncpg, os; asyncio.run(asyncpg.connect(os.environ['DATABASE_URL'].replace('+asyncpg','')))" 2>/dev/null; do
  sleep 1
done

echo "[entrypoint] running migrations..."
uv run alembic upgrade head

echo "[entrypoint] seeding admin (idempotent)..."
uv run python -m app.cli seed-admin-if-missing

echo "[entrypoint] starting uvicorn..."
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

A "READY" signal that reflects the whole stack, not just one container — emitted by a tiny `bootstrap` sidecar service whose only job is to poll every service's healthcheck and print one line when all are green.

## Constraints
1. **Zero manual steps after `cp .env.example .env` + edit.** `docker compose up --build` is the only command the operator runs. Any step requiring a second command is a failure.
2. **Env var surface is a single file.** Root `.env.example` is the template; `.env` is the runtime file (gitignored — confirm it is). Compose reads it via top-level `env_file:` where possible; per-service `environment:` blocks explicitly list only the variables that service needs. No silent pass-through of unrelated secrets.
3. **Backend has a real entrypoint script**, not a multi-line inline `command:`. Put it at `backend/docker-entrypoint.sh`, make it executable in the Dockerfile (`RUN chmod +x`), and use it as `ENTRYPOINT`. The service's `command:` passes uvicorn args only.
4. **Migrations run from the entrypoint, exactly once per container start, before uvicorn binds the port.** Use `alembic upgrade head` (not `create_all`). If migrations fail, the container MUST exit non-zero — do not swallow errors.
5. **Seed runs from the entrypoint, after migrations, idempotent, gated.** If `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` are unset, skip silently with a clear log. If set and no admin exists, create one. If set and an admin already exists, skip with a clear log. Never overwrite an existing admin's password.
6. **Healthchecks on every long-running service.** `db` (already present), `redis` (already present), `backend` (`GET /health`), `frontend` and `frontend-react` (TCP probe on their dev-server ports or a simple `wget -q -O- http://localhost:<port> >/dev/null`). Compose `depends_on` uses `condition: service_healthy` everywhere it can.
7. **READY sidecar.** Add a `bootstrap` service (profile: default) that does nothing but `depends_on` all the above with `condition: service_healthy` and, on start, prints exactly:
   ```
   astro-portal: READY
   Frontend (React): http://localhost:5174
   Frontend (Vue):   http://localhost:5173
   API:              http://localhost:8000
   API Docs:         http://localhost:8000/docs
   Admin:            <SEED_ADMIN_EMAIL or "not seeded — set SEED_ADMIN_EMAIL in .env">
   ```
   Then exits 0. Use a minimal image (`alpine:3` or `busybox`). No long-running process.
8. **Dockerfiles are multi-stage where it helps caching.** Backend: keep a single stage but pin `uv sync --frozen` so `uv.lock` is authoritative. Frontend images: ensure `npm ci` layer is cached separately from source copy. First-run build must complete under 10 minutes on a mid-range laptop with a warm Docker cache, under 5 minutes on a second run.
9. **No platform-specific pins.** `platform:` directives may be used only if strictly required (e.g., an upstream image has no arm64). If you add one, justify it in the changelog.
10. **`scripts/db.sh` remains available** for power users but is no longer part of the first-run path. Update its help text to say so. Do NOT delete commands; migrations, backup, restore, shell, describe, query are still supported on an already-running stack.
11. **No application logic changes** beyond: (a) adding a `seed-admin-if-missing` subcommand to `backend/app/cli.py` if not already there, (b) ensuring `/health` returns quickly without touching the DB (or with a `?deep=1` variant that does). Nothing else under `backend/app/` should change.
12. **Windows compatibility.** Entrypoint script must use LF line endings; add a `.gitattributes` entry `backend/docker-entrypoint.sh text eol=lf` (and similar for any other shell scripts you add). Document that operators on Windows should run Docker Desktop with WSL2 backend.
13. **Loud failure, never silent.** Every step in the entrypoint prints a `[entrypoint] <what it is doing>` line. On failure, print the error and `exit 1`.
14. **No new secrets in git.** `.env` is gitignored. `.env.example` contains placeholder values only. No real SECRET_KEY, no real passwords.
15. **No emojis** in scripts, logs, env files, or docs.

## Output Format

**New files:**
- `.env.example` (root) — single operator-facing env template, superset of `backend/.env.example`.
- `backend/docker-entrypoint.sh` — wait-for-db, migrate, seed, exec uvicorn.
- `celery-worker` entrypoint fragment (reuse the same script if the worker benefits; otherwise add `backend/docker-entrypoint-worker.sh`).
- `ops/bootstrap/Dockerfile` (or a pre-built alpine image referenced directly) and `ops/bootstrap/ready.sh` — READY-banner sidecar.
- `.gitattributes` — enforce LF for shell scripts.
- `docs/step-06-changelog.md` — see structure below.

**Modified files:**
- `docker-compose.yml` — add `frontend-react` healthcheck (if Step 2 didn't), add `backend` healthcheck, add `bootstrap` service, switch backend to use `docker-entrypoint.sh`, consolidate env loading via root `.env`.
- `backend/Dockerfile` — `COPY docker-entrypoint.sh /usr/local/bin/` + `chmod +x` + `ENTRYPOINT`.
- `backend/app/cli.py` — add `seed-admin-if-missing` subcommand if not already present (Step 3 created `create-admin`; this is the one-shot env-driven variant).
- `backend/app/api/health.py` — ensure `/health` returns in <50 ms without touching DB; optional `?deep=1` adds a DB ping for the healthcheck.
- `scripts/db.sh` — update help text: note that `init` is no longer required on first run.
- `.gitignore` — ensure root `.env` is ignored (verify, don't duplicate).
- `README.md` (root) — rewrite the "Quick Start" section to the three-step flow above. Keep everything else.

**`docs/step-06-changelog.md` structure (required):**

```
# Step 6 Changelog

## Summary
(1–2 sentences)

## First-run flow
Before:
  git clone && cd && cp backend/.env.example backend/.env && docker compose up --build && ./scripts/db.sh init && curl -X POST .../auth/bootstrap ...
After:
  git clone && cd && cp .env.example .env && docker compose up --build

## Files added
- ...

## Files modified
- ...

## Services added
- bootstrap (sidecar) — prints READY banner when all healthchecks pass, exits 0.

## Env var reorganization
- Moved from backend/.env: ...
- New root-level: ...
- Back-compat note: backend/.env still works for local (non-Docker) dev; Compose uses root .env.

## Verification (captured from a real fresh run)
- Time from `docker compose up` to "astro-portal: READY": <Xs>
- Curl /health: 200, <N> ms
- Login as SEED_ADMIN_EMAIL via /auth/login: 200, JWT received
- /auth/bootstrap after seed: 409 (as expected)
- `docker compose down -v && docker compose up --build` second run: <Xs>, stack READY
```

Final chat summary (≤ 20 lines) must include:
- The three-step first-run flow quoted verbatim.
- Measured time-to-READY on the tester's machine.
- Links to every added/modified file.
- A one-paragraph note on what `./scripts/db.sh` is now for (power users, backups, manual inspection — not first run).

## Validation Criteria
Accepted only if ALL of these hold:

- [ ] On a fresh clone of `intuitive-design` with Docker as the only prerequisite, the full first-run flow is exactly: `git clone`, `cd`, `cp .env.example .env` (edit `SECRET_KEY`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`), `docker compose up --build`. No other commands.
- [ ] The literal line `astro-portal: READY` appears in the stack logs once, emitted by the `bootstrap` service, only after every other service's healthcheck is green.
- [ ] `docker compose down -v` followed by `docker compose up --build` successfully re-bootstraps from an empty volume (fresh DB, fresh migrations, fresh seed). No stale state leaks.
- [ ] `docker compose down` (without `-v`) followed by `docker compose up` re-uses the existing DB volume; migrations show "no-op", seed logs "admin exists, skipping", stack reaches READY.
- [ ] `GET /health` returns 200 in under 50 ms (locally). `GET /health?deep=1` returns 200 and includes a DB round-trip assertion.
- [ ] `POST /auth/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` returns 200 and a valid JWT on the first READY.
- [ ] `POST /auth/bootstrap` returns 409 after the seed has run (reconfirms Step 3 gating is intact end-to-end).
- [ ] Vue frontend at `http://localhost:5173` and React frontend at `http://localhost:5174` both load and can log in with the seeded admin.
- [ ] Backend container exits non-zero if migrations fail (verified by introducing a deliberate bad migration locally, running `up`, observing the crash, then reverting).
- [ ] Entrypoint prints clearly-prefixed `[entrypoint]` log lines for: waiting on DB, running migrations, seeding admin, starting uvicorn.
- [ ] No emoji, no color-code escape sequences in any log line emitted by the entrypoint or bootstrap sidecar (pipe-safe output).
- [ ] Root `.env` is gitignored; `git status` on a post-first-run working tree shows no new tracked `.env` file.
- [ ] `.gitattributes` enforces LF for `*.sh` and the shell scripts load correctly on Windows + WSL2 (document the Windows verification in the changelog; if you can't test on Windows, state that and explain what was done to safeguard it — `.gitattributes` + Alpine shell, no CRLF).
- [ ] `./scripts/db.sh auto-migrate` on an already-running stack still reports "no changes detected" — Step 3's migration discipline is preserved.
- [ ] `docker compose --profile with-celery up --build` also reaches READY (celery-worker healthcheck or wait-for-redis logic is correct).
- [ ] `docker compose --profile with-nginx up --build` also reaches READY; nginx proxies to both frontends correctly.
- [ ] First-run build completes in ≤ 10 min on a cold cache; subsequent `up` in ≤ 60 s to READY on a warm cache. Report both numbers in the chat summary.
- [ ] `git diff --stat origin/intuitive-design...HEAD` touches only: `docker-compose.yml`, `backend/Dockerfile`, `backend/docker-entrypoint.sh`, `backend/app/cli.py`, `backend/app/api/health.py`, `ops/**`, `scripts/db.sh`, `.env.example`, `.gitattributes`, `.gitignore`, `README.md`, `docs/step-06-changelog.md`. No changes to frontends, no changes to backend routes, models, or schemas.
