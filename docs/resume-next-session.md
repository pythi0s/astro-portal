# Resume notes — astro-cursor-test branch

This doc is the single entry point for picking up implementation work on the
`astro-cursor-test` branch. Read this first, then the referenced changelogs.

## Where we are (Steps 1–8 shipped, locally)

| Step | Status | Details |
| ---- | ------ | ------- |
| 1 — Discovery & API audit | **Done** | [`docs/api-audit.md`](./api-audit.md) |
| 2 — React auth foundation | **Done** | [`frontend-react/README.md`](../frontend-react/README.md) §Auth flow |
| 3 — Backend hardening | **Done, not runtime-validated** | [`docs/step-03-changelog.md`](./step-03-changelog.md) |
| 4 — Revenue dashboard (React) | **Done, not runtime-validated** | [`docs/step-04-changelog.md`](./step-04-changelog.md) |
| 5 — Feature pages (React) | **Done, not runtime-validated** | [`docs/step-05-changelog.md`](./step-05-changelog.md) |
| 6 — Seamless setup (Docker, Alembic, bootstrap banner) | **Done, not runtime-validated** | [`docs/step-06-changelog.md`](./step-06-changelog.md) |
| 7 — CI + interaction test scaffolding | **Done, CI green on `astro-cursor-test`** | [`docs/step-07-ci-hardening.md`](./step-07-ci-hardening.md) |
| 8 — nginx /app/ proxy (opt-in) + Dashboard/Customers/Admin interaction tests | **Done, CI green on `astro-cursor-test`** | [`docs/step-08-nginx-tests.md`](./step-08-nginx-tests.md) |

### CI status

The GitHub Actions `ci.yml` workflow has been booted and stabilised on
`astro-cursor-test`. Run [#6 (`7ed715b`)](https://github.com/pythi0s/astro-portal/actions/runs/24884028452)
is the first fully-green run; it covers all four jobs:

| Job | Duration | Notes |
| --- | --- | --- |
| `frontend-react (typecheck + test + build)` | ~47 s | tsc + vitest (6 interaction tests across 4 files) + vite build |
| `frontend (Vue build smoke)`                | ~16 s | legacy Vue `npm run build` |
| `backend (ruff + alembic upgrade head)`     | ~25 s | ruff lint + alembic upgrade against a postgres service |
| `compose config validation`                 | ~5 s  | `docker compose config` schema check |

The stabilisation took five follow-up commits after the initial Step 7 push
(see [`docs/step-09-ci-stabilisation.md`](./step-09-ci-stabilisation.md) for
the full diagnosis of each):

1. **`working-directory` fix** — CI was running from `astro-portal/astro-portal/`
   because the workflow assumed a nested layout. Dropped the redundant prefix
   in every job.
2. **Vite client types** — `tsc` failed on `import.meta.env` until
   `frontend-react/src/vite-env.d.ts` added `/// <reference types="vite/client" />`
   plus an `ImportMetaEnv` declaration for `VITE_BACKEND_URL`, `VITE_BASE`,
   `VITE_CURRENCY`.
3. **Backend ruff cleanup (411 → 0)** — `backend/pyproject.toml` gained
   `[tool.ruff.lint]` config, `extend-exclude = ["alembic/versions"]`,
   `per-file-ignores` for `alembic/env.py` and `__init__.py`, and
   `flake8-bugbear.extend-immutable-calls` for FastAPI's `Depends`/`Query`/etc.
   Ruff autofixes + hand fixes modernised `Optional[X]` → `X | None`,
   `class Foo(str, Enum)` → `class Foo(StrEnum)`, `raise ... from exc`,
   long-line wraps, and `Union[...]` → `X | Y | Z`.
4. **RTL cleanup** — `src/test/setup.ts`'s `afterEach` now calls
   `cleanup()` from `@testing-library/react` explicitly (vitest with
   `globals: false` doesn't auto-clean). Without this, DOM leaked between
   tests and caused "multiple elements found" / stale-input failures in
   Login, CustomerListPage, and UserListPage tests.
5. **Test matcher + MSW handler cleanup** — `UserListPage.test.tsx` uses
   `findByText(/^admins$/i)` (exact) so the stats card matches without
   clashing with the page subtitle. `Dashboard.test.tsx` uses a single
   `/dashboard/revenue` mock (no query-param switching) and re-queries the
   KPI list inside every `waitFor` to avoid stale DOM refs after React
   Query re-renders.
6. **jsdom ResizeObserver polyfill** — the last failure (Dashboard test
   showing an empty `<body><div/></body>`) was Recharts'
   `<ResponsiveContainer>` calling `new ResizeObserver(...)` under jsdom.
   With no error boundary, React 18 unmounted the entire root on the
   `ReferenceError`. Fix: noop `ResizeObserver` (and `matchMedia`) stubs
   on `globalThis` in `src/test/setup.ts`, guarded so real browsers are
   unaffected.

Warnings in the green run are all environmental and safe to ignore:
Node.js 20 deprecation notices from `actions/checkout@v4` / `setup-node@v4`
/ `setup-python@v5` / `setup-uv@v3` (force-to-Node-24 starts June 2026) and
a transient GitHub cache-service 400 that the `actions/cache` step survives
by falling back to a cache miss.

All eight steps are shipped. None of Steps 3–6 have been booted on real Docker;
the authoring host has neither Docker nor Node nor Python installed. Step 6's
whole point is to make that first boot trivial, so the very first thing the
next human operator does is run it. Step 7 adds a GitHub Actions workflow that
runs on every push/PR and exercises migrations + compose config + the React
build/test suite — so CI will see real failures even while the local-dev
validation is still pending. Step 8 layers in nginx support (opt-in via
`VITE_BASE=/app/`) and extends the interaction test suite to cover the three
most important React pages.

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

## Still pending after Step 9 (CI stabilisation)

- **Runtime validation of Steps 3–6 on Docker.** Everything above is the plan;
  the first human on a Docker box is the first person to see it actually work.
  Run the three-command flow from the Step 6 block above, capture the
  time-to-READY, and update `docs/step-06-changelog.md` §"Verification".
- **Runtime validation of the nginx `/app/` flow** — see the verification
  checklist in [`docs/step-08-nginx-tests.md`](./step-08-nginx-tests.md). The
  opt-in is safe (default flow unchanged) but Vite HMR over nginx websocket
  upgrade is the one code path that often surprises on first boot.
- **Still more interaction tests.** Dashboard, customer list, and admin
  user list are covered. Visits (list + detail + form), solutions (list +
  form), templates (list + form), messages (list + send form), and profile
  remain. Follow the same pattern as the three existing test files; no
  new scaffolding is needed (MSW, `renderWithProviders`, and the jsdom
  polyfills all already exist).
- **Package lockfiles.** Neither frontend has a `package-lock.json`
  committed. The authoring host does not have npm available (only Cursor's
  internal `node.exe` helper, which lacks npm). Grab the generated
  lockfiles from the green CI run's workspace (or commit them from any
  dev box with npm installed), then enable `cache: npm` +
  `cache-dependency-path` in `.github/workflows/ci.yml` (two one-line
  additions in each frontend job) to shave ~15–20 s off every CI run.
- **Optional.** `RequireAuth` / `RequireRole` unit tests and Playwright
  screenshot tests are both useful but not blocking. Neither has a
  corresponding hook in the existing test pipeline yet.

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

should end with Step 8 on top of Steps 7/6/5:

```
(step 8)  Step 8: nginx /app/ proxy (opt-in) + Dashboard/Customers/Admin tests
57c594f   Step 7: CI workflow + MSW interaction test scaffolding
b733630   Step 6: seamless Docker first-run (entrypoint, healthchecks, READY sidecar)
4d976f3   Step 5 phases D-I: solutions, templates, messages, admin, profile + wiring
fce4f4a   Step 5 phase B+C: customers and visits domains
ad35fae   Step 5 phase A: shared primitives + format promotion
2718679   docs: add resume-next-session handoff notes
8040991   Step 4: React revenue dashboard
05c07ac   Step 3: backend hardening and new dashboard revenue endpoints
452fc01   Add frontend-react auth foundation, docs/api-audit, prompts, and docker-compose react profile
```

If the list diverges (extra commits, different order, hash changes on earlier
commits), something unexpected happened — reconcile before proceeding.
