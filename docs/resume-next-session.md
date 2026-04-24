# Resume notes — astro-cursor-test branch

This doc is the single entry point for picking up implementation work on the
`astro-cursor-test` branch. Read this first, then the referenced changelogs.

## Where we are (Step 6 complete, locally)

| Step | Status | Details |
| ---- | ------ | ------- |
| 1 — Discovery & API audit | **Done** | [`docs/api-audit.md`](./api-audit.md) |
| 2 — React auth foundation | **Done** | [`frontend-react/README.md`](../frontend-react/README.md) §Auth flow |
| 3 — Backend hardening | **Done, not runtime-validated** | [`docs/step-03-changelog.md`](./step-03-changelog.md) |
| 4 — Revenue dashboard (React) | **Done, not runtime-validated** | [`docs/step-04-changelog.md`](./step-04-changelog.md) |
| 5 — Feature pages (React) | **Done, not runtime-validated** | [`docs/step-05-changelog.md`](./step-05-changelog.md) |
| 6 — Seamless setup (Docker, Alembic, bootstrap banner) | **Done, not runtime-validated** | [`docs/step-06-changelog.md`](./step-06-changelog.md) |

All six steps are shipped. None of Steps 3–6 have been booted on real Docker;
the authoring host has neither Docker nor Node nor Python installed. Step 6's
whole point is to make that first boot trivial, so the very first thing the
next human operator does is run it.

## Three-command first-run flow (what Step 6 delivers)

```bash
git clone <repo> && cd astro-portal
cp .env.example .env          # edit SECRET_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
docker compose up --build
```

Wait for this in the logs:

```
astro-portal: READY
Frontend (React): http://localhost:5174
Frontend (Vue):   http://localhost:5173
API:              http://localhost:8000
API Docs:         http://localhost:8000/docs
Admin:            <your SEED_ADMIN_EMAIL>
```

If you see that line, the stack is fully bootstrapped: migrations applied,
admin seeded, both frontends serving, `/health?deep=1` returning 200. Log in
at `http://localhost:5174`.

## What to do first when you resume

1. **Run the first-run flow above on a machine with Docker Desktop (or Docker
   Engine + Compose v2) installed.** Capture the observed time-to-READY and
   update the "Verification" block at the bottom of
   [`docs/step-06-changelog.md`](./step-06-changelog.md).

2. **Walk the validation grid.** On the running stack:

   ```bash
   curl -sS http://localhost:8000/health                    # {"status":"ok"}, <50ms
   curl -sS "http://localhost:8000/health?deep=1"           # DB latency included
   curl -sS -X POST http://localhost:8000/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"email":"<SEED_ADMIN_EMAIL>","password":"<SEED_ADMIN_PASSWORD>"}'  # 200 + JWT
   curl -sS -X POST http://localhost:8000/auth/bootstrap \
        -H 'Content-Type: application/json' -d '{}'        # 409 (Step 3 gating)
   ```

   Then exercise both UIs:

   - React: <http://localhost:5174> — log in, hit /dashboard, /customers,
     /visits, /solutions, /templates, /messages, /admin, /profile. Follow the
     15-point checklist in
     [`frontend-react/README.md`](../frontend-react/README.md)
     §"Manual verification checklist (Step 5)".
   - Vue: <http://localhost:5173> — the legacy app. Just confirm login works.

3. **Exercise `down -v` and `down` separately:**

   - `docker compose down -v && docker compose up --build` → fresh DB; stack
     must reach READY again and the backend entrypoint should log `[cli]
     Seeded admin user: …` once.
   - `docker compose down && docker compose up` → retains the DB volume;
     entrypoint should log `[cli] Running alembic upgrade head …` followed by
     no schema changes, and `[cli] An active admin already exists — skipping
     seed.`

4. **Optional profile runs:**

   ```bash
   docker compose --profile with-celery up --build
   docker compose --profile with-nginx  up --build
   ```

   Both must also reach READY. The nginx config still only routes to the Vue
   frontend at `/`; React remains reachable on `:5174` directly (out of Step 6
   scope per the changelog).

5. **If any step fails**, capture the failing log block verbatim in a new
   "Validation fixes" section of
   [`docs/step-06-changelog.md`](./step-06-changelog.md) and patch before
   declaring Step 6 green.

## What the stack looks like now

- **Root `.env.example`** is the single env template. `backend/.env.example`
  remains for developers who want to run FastAPI directly against a local
  Postgres, but Compose loads root `.env` for every service.
- **`backend/docker-entrypoint.sh`** is the new source of truth for startup
  order: wait-for-db → `alembic upgrade head` → `seed-admin-if-missing` →
  `exec "$@"`. Any failure exits non-zero.
- **`backend/docker-entrypoint-worker.sh`** handles the celery worker:
  wait-for-db → `exec "$@"`. Workers never re-migrate or re-seed.
- **`ops/bootstrap/`** is a tiny alpine sidecar that prints the READY banner
  after all healthchecks pass and exits 0.
- **`.gitattributes`** pins LF endings for every shell script path.
- **Backend Dockerfile** installs `dos2unix` at build time as a CRLF safety
  net and sets `ENTRYPOINT`/`CMD` so the entrypoint `exec "$@"`s the uvicorn
  command from the compose file.
- **Healthchecks** are in place for `db`, `redis`, `backend`, `frontend`,
  `frontend-react`. `bootstrap` depends on all three of the latter with
  `condition: service_healthy`.

## Still pending after Step 6

- **Runtime validation of Steps 3–6.** Everything above is the plan; the
  first human on a Docker box is the first person to see it actually work.
- **Interaction tests (MSW + RTL).** Deferred from Step 5; `devDependencies`
  in `frontend-react/package.json` already declare the scaffolding
  (`@testing-library/react`, `@testing-library/user-event`, `msw`, `jsdom`,
  `vitest`). Worth adding during the first "everything works, now harden it"
  pass.
- **CI workflow.** Not part of the strict Step 6 scope (the prompt focused on
  first-run ergonomics); a GitHub Actions file that runs `npm run build`,
  `npm run test`, `uv run alembic upgrade head` against a service Postgres,
  and `docker compose config` is the obvious next step once the stack is
  proven locally.
- **nginx reverse-proxy routes for the React app.** Today nginx proxies only
  the Vue frontend at `/`; the React app is reachable directly at `:5174`.
  Either proxy React at `/app/` or replace Vue at `/` when the Vue app is
  deprecated — out of scope for Step 6.

## Known hazards to remember

- **Step 3 `DELETE /visits/{id}` is soft-delete.** Step 5's visits list
  defaults to `is_active=true` and only passes `include_inactive=true` behind
  the "Include inactive" toggle — do not regress this.
- **Step 3 `GET /customers/` returns a slim `CustomerList` shape**; detail
  still returns the full `CustomerRead`. Don't swap the list endpoint back
  to `CustomerRead` — it reintroduces the `MissingGreenlet` bug.
- **`GET /templates/` only returns active templates.** The `TemplateEditPage`
  loads from the list and finds by id; inactive templates are unreachable by
  design until the backend exposes a detail endpoint.
- **Login rate limit** is 5 / 900 s per client IP. Any CI test that hammers
  `/auth/login` needs `LOGIN_RATE_LIMIT_MAX_ATTEMPTS=0` in the test env or a
  unique email per attempt.
- **CORS default is no longer `*`.** Root `.env.example` lists
  `http://localhost:5173,http://localhost:5174`. Add any extra origin you use
  to `CORS_ORIGINS`.
- **Seed admin path:** set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` in root
  `.env`, OR run
  `docker compose exec backend python -m app.cli create-admin --email ... --password ...`,
  OR `POST /auth/bootstrap` (gated once any admin exists).
- **`VITE_BACKEND_URL`** is `http://backend:8000` inside Docker (Vite proxy
  target is an in-cluster URL). On host-side `npm run dev`, override to
  `http://localhost:8000` in `frontend-react/.env`.
- **Line endings on Windows.** The `.gitattributes` keeps every `*.sh`
  checked out as LF. If you see `/bin/sh^M: bad interpreter` on Windows,
  confirm `git config core.autocrlf` is not overriding `.gitattributes`.

## Paths to commit-message history

```bash
git log --oneline origin/intuitive-design..astro-cursor-test
```

should end with a Step 6 commit on top of the Step 5 block:

```
(step 6)  Step 6: seamless Docker first-run (entrypoint, healthchecks, READY sidecar)
(step 5)  Step 5: React feature pages (customers, visits, solutions, templates, messages, admin, profile)
2718679   docs: add resume-next-session handoff notes
8040991   Step 4: React revenue dashboard
05c07ac   Step 3: backend hardening and new dashboard revenue endpoints
452fc01   Add frontend-react auth foundation, docs/api-audit, prompts, and docker-compose react profile
```

If the list diverges (extra commits, different order, hash changes on earlier
commits), something unexpected happened — reconcile before proceeding.
