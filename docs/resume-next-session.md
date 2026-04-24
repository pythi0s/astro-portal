# Resume notes — astro-cursor-test branch

This doc is the single entry point for picking up implementation work on the
`astro-cursor-test` branch. Read this first, then the referenced changelogs.

**Last session ended:** CI fully green ([run #6 `7ed715b`](https://github.com/pythi0s/astro-portal/actions/runs/24884028452)),
Step 9 post-mortem committed (`253ef4a`). Nothing in-flight. Next session
can start by picking any item from the "Still pending" list below. See also
§"Session log" at the bottom for a compressed history of how we got here.

## Where we are (Steps 1–9 shipped, locally)

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
| 9 — CI stabilisation (6 follow-up fixes to get run #6 green) | **Done** | [`docs/step-09-ci-stabilisation.md`](./step-09-ci-stabilisation.md) |

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

Pick **one** of the following, in this priority order. Each is independent
— no hidden coupling — so you can stop after any of them.

### Priority 1 — Boot on Docker and validate Steps 3–6 (~20–30 minutes)

This is the single highest-leverage action left. Everything else
(lockfiles, extra tests, Playwright) only matters once the stack is
confirmed to boot. The authoring host for this branch has never had
Docker, Node, or Python installed, so every line of Steps 3–6 is
"green in theory".

1. On a machine with Docker Desktop (or Docker Engine + Compose v2):

   ```bash
   git clone https://github.com/pythi0s/astro-portal.git
   cd astro-portal
   git checkout astro-cursor-test
   cp .env.example .env              # edit SECRET_KEY, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
   docker compose up --build
   ```

   Wait for the READY banner (see §"Three-command first-run flow" above).
   Capture time-to-READY and append to
   [`docs/step-06-changelog.md`](./step-06-changelog.md) §"Verification".

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
     /visits, /solutions, /templates, /messages, /admin, /profile. Follow
     the 15-point checklist in
     [`frontend-react/README.md`](../frontend-react/README.md)
     §"Manual verification checklist (Step 5)".
   - Vue: <http://localhost:5173> — legacy app, just confirm login works.

3. **Exercise `down -v` and `down` separately:**

   - `docker compose down -v && docker compose up --build` → fresh DB;
     stack must reach READY again and the backend entrypoint should log
     `[cli] Seeded admin user: …` once.
   - `docker compose down && docker compose up` → retains the DB volume;
     entrypoint should log `[cli] Running alembic upgrade head …`
     followed by no schema changes, and `[cli] An active admin already
     exists — skipping seed.`

4. **Optional profile runs:**

   ```bash
   docker compose --profile with-celery up --build
   docker compose --profile with-nginx  up --build
   ```

   Both must also reach READY. Default nginx config routes to Vue at `/`;
   React remains reachable on `:5174` directly.

5. **Also validate the nginx `/app/` flow** once Priority 1 passes: set
   `VITE_BASE=/app/` in `.env` and re-run `docker compose --profile
   with-nginx up --build`. Confirm everything in
   [`docs/step-08-nginx-tests.md`](./step-08-nginx-tests.md) §Verification,
   especially HMR websocket upgrade.

6. **If any step fails**, capture the failing log block verbatim in a new
   "Validation fixes" section of
   [`docs/step-06-changelog.md`](./step-06-changelog.md) and patch before
   declaring Step 6 green. Do **not** amend any of the existing commits —
   the audit trail matters.

### Priority 2 — Commit lockfiles + enable npm cache in CI (~15 minutes)

Cheap, very high-value. Reduces every CI run by ~15–20 s and pins
transitive dependencies against silent upstream bumps. Blocked on having
npm available (authoring host does not).

1. Grab `frontend/package-lock.json` and `frontend-react/package-lock.json`
   from a green CI run (the lockfile is regenerated during each
   `npm install` in the workflow). The `actions/upload-artifact` step
   doesn't include it today — easiest path is to `npm install` locally
   on any Node-enabled dev box and commit the result.
2. Enable cache in `.github/workflows/ci.yml` — two one-liners per
   frontend job:

   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '20'
       cache: 'npm'
       cache-dependency-path: frontend-react/package-lock.json
   ```

   Remove the existing `cache-dependency-glob` workaround once
   `cache-dependency-path` is in place.
3. Verify the next CI run uses the cache (log line `Cache restored from key:`).

### Priority 3 — Add the remaining seven interaction tests (~2 hours total)

Coverage today: Login, Dashboard, CustomerListPage, UserListPage (admin).
Remaining feature pages:

- `visits/__tests__/VisitListPage.test.tsx`
- `visits/__tests__/VisitDetailPage.test.tsx`
- `visits/__tests__/VisitFormPage.test.tsx`
- `solutions/__tests__/SolutionListPage.test.tsx` + form
- `templates/__tests__/TemplateListPage.test.tsx` + form
- `messages/__tests__/MessageListPage.test.tsx` + send form
- `pages/__tests__/Profile.test.tsx`

All scaffolding already exists: `src/test/msw.ts`, `src/test/setup.ts`
(with RTL cleanup + ResizeObserver polyfill), and
`src/test/renderWithProviders.tsx`. Follow the pattern in
`src/features/customers/__tests__/CustomerListPage.test.tsx` — pre-seed
the auth store, install MSW handlers for exactly the endpoints the page
hits, render, assert on user-visible text.

### Priority 4 — RequireAuth / RequireRole unit tests (~30 minutes)

The Dashboard test pre-seeds the auth store and renders
`<Dashboard />` directly, skipping the guard. That's fine for testing
Dashboard, but the guard itself is currently untested. Three tests are
enough:

1. `<RequireAuth>` redirects to `/login?next=…` when `isAuthenticated === false`.
2. `<RequireAuth>` renders children when authenticated.
3. `<RequireRole roles={['admin']}>` blocks astrologer, allows admin.

### Priority 5 — Everything else is optional

See "Testing philosophy" below before adding Playwright.

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

## Still pending (consolidated list)

Listed in the same order as §"What to do first when you resume". This
section is intentionally a mirror of that section's priority list — use
the other one for *how*, this one for *what*.

1. **Runtime validation of Steps 3–6 on Docker** + the nginx `/app/`
   opt-in flow. Nothing above Step 9 has ever been booted; Priority 1.
2. **Package lockfiles + `cache: npm` in CI.** Priority 2.
3. **Seven remaining interaction tests** (visits ×3, solutions, templates,
   messages, profile). Priority 3.
4. **`RequireAuth` / `RequireRole` unit tests** (~3 tests). Priority 4.
5. **E2E smoke tests with Playwright.** Deferred — see §"Testing
   philosophy" below for the rationale. Priority 5.

## Testing philosophy (decided this session)

**Question:** should we add Playwright to the test stack?

**Answer:** no, not yet.

### Reasoning

The current test matrix already catches ~80 % of realistic regressions
in a React + FastAPI app:

| Layer | Tool | Catches |
| ----- | ---- | ------- |
| Types | `tsc --noEmit` in CI | Prop / API shape drift |
| Lint | `ruff` in CI | Dead Python imports, PEP violations, FastAPI anti-patterns |
| Schema | `alembic upgrade head` against a real Postgres in CI | Migrations applying cleanly, models staying in sync |
| Compose | `docker compose config` in CI | Valid compose file, resolvable service graph |
| Component interaction | `vitest` + `jsdom` + MSW + Testing Library | Form submit flows, URL navigation, React-Query fetch → render, role-based UI gating |

What it does **not** catch, and where Playwright *would* add value:

1. Real-browser layout / rendering. `jsdom` has no layout engine —
   `clientWidth` is 0, Recharts draws at 0×0, CSS media queries don't
   evaluate. Bugs like "sidebar overlaps header at 1280 px" or "the pie
   chart has no slices" slip through.
2. Full-stack contract validation. Every vitest test mocks the backend
   via MSW. FastAPI → SQLAlchemy → Postgres → JSON → Axios → React Query
   is never exercised end-to-end. An `/auth/login` response-shape change
   where the frontend silently accepts the drift would not be caught.
3. `RequireAuth` / `RequireRole` redirect flow — but this is cheaply
   covered by vitest (Priority 4 above), no browser needed.
4. nginx `/app/` subpath + Vite HMR websocket upgrade — best covered by
   the manual validation in Priority 1, not by Playwright.
5. `docker compose up` boot — same as #4, manual is better first.

### Why not add Playwright now

- **Cost.** Real-browser tests take ~45 s–2 min each; 5–8 scenarios
  double CI duration. Chromium cache in the runner adds infra drag.
- **Maintenance.** Flaky Playwright tests absorb human time disproportionate
  to the bugs they catch. The test itself becomes the bug.
- **Order.** Priority 1 (manual Docker boot) finds items 4 + 5 above in
  ~20 min with zero new tooling. Priority 4 (three vitest tests) covers
  item 3 with zero new tooling. That only leaves items 1–2, which are
  real Playwright use-cases — but they'll be much easier to scope *after*
  Priority 1 has run at least once.

### When to reconsider

Add Playwright only when one of these is true:

- A real-browser-only bug has escaped vitest twice.
- Team size grows past the point where one person can manually
  sanity-check each release candidate.
- An external client or deploy pipeline requires an automated smoke test
  against a live stack.

If you do add it, keep the scope small (5–8 scenarios), run against
`docker compose up`'d services (not mocks), and keep vitest as the primary
test layer. Typical scenarios worth covering:

1. Admin login → `/dashboard` → KPI values render as numbers → pie chart
   has non-zero slices.
2. Astrologer login → no admin nav link visible.
3. Persistent session survives `location.reload()`.
4. Create a customer → appears in list → soft-delete → gone.
5. `/app/` subpath under nginx profile boots and logs in correctly.

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

should match (HEAD first, base branch last):

```
253ef4a docs: Step 9 — record CI stabilisation post-mortem, mark pipeline green
7ed715b fix(tests): polyfill ResizeObserver so Recharts doesn't unmount Dashboard
3d708d8 fix(tests): wire RTL cleanup + fix two real test bugs
940cbeb fix(ci): frontend import.meta.env types + backend ruff clean pass
220494c fix(ci): drop redundant astro-portal/ prefix from every job path
3b37c30 Step 8: nginx /app/ proxy (opt-in) + Dashboard/Customers/Admin tests
57c594f Step 7: CI workflow + MSW interaction test scaffolding
b733630 Step 6: seamless Docker first-run (entrypoint, healthchecks, READY sidecar)
4d976f3 Step 5 phases D-I: solutions, templates, messages, admin, profile + wiring
fce4f4a Step 5 phase B+C: customers and visits domains
ad35fae Step 5 phase A: shared primitives + format promotion
2718679 docs: add resume-next-session handoff notes
8040991 Step 4: React revenue dashboard
05c07ac Step 3: backend hardening and new dashboard revenue endpoints
452fc01 Add frontend-react auth foundation, docs/api-audit, prompts, and docker-compose react profile
```

If the list diverges (extra commits, different order, hash changes on earlier
commits), something unexpected happened — reconcile before proceeding.

The five commits `220494c` through `7ed715b` are Step 9's sequential fixes
to get CI green; the rationale for each is in
[`docs/step-09-ci-stabilisation.md`](./step-09-ci-stabilisation.md). The
top commit `253ef4a` is documentation-only.

## Session log (compressed)

Rough chronology so the next session can reconstruct decisions without
digging through chat history. Collapsed into one-liners; each bullet
references the commit or doc where the fuller story lives.

### Session 1 — scaffold (initial plan through Step 8)

- Cloned `pythi0s/astro-portal`; worked off branch `astro-cursor-test`
  which is rooted at `origin/intuitive-design`.
- Agreed on stack: React 18 + Vite + TypeScript + React Router v6
  + Zustand + Axios + Tailwind + React Query + Recharts + Vitest + MSW.
  Vue frontend retained; React lives alongside at `frontend-react/`.
- Shipped Steps 1–6: API audit, React auth (with persistent session
  + rate limit), backend hardening (dashboard revenue endpoints,
  soft-delete visits, CustomerList slim shape), revenue dashboard,
  seven feature pages, seamless Docker first-run with READY banner.
- Step 7 added `.github/workflows/ci.yml` + first MSW-backed vitest
  test (Login). Step 8 added nginx `/app/` opt-in proxy (via `VITE_BASE`)
  + interaction tests for Dashboard, CustomerListPage, UserListPage.
- Pushed `astro-cursor-test` to origin.

### Session 2 — CI stabilisation (this session, runs #1–#6)

- Run #1–#2: all jobs failed. Fixed workflow `working-directory` paths
  that assumed a nested `astro-portal/astro-portal/` layout
  (`220494c`).
- Run #3: frontend-react tsc failed on `import.meta.env`; backend ruff
  emitted 411 errors + a deprecation warning. Added
  `frontend-react/src/vite-env.d.ts`; refined
  `backend/pyproject.toml` (moved `select` under `[tool.ruff.lint]`,
  excluded `alembic/versions`, added `per-file-ignores` for
  `alembic/env.py` + `__init__.py`, taught `flake8-bugbear` about
  FastAPI's `Depends` pattern); ran `ruff --fix --unsafe-fixes` for 277
  auto-fixes; hand-fixed 24 residuals (`B904`, `E402`, `E501`, `UP007`)
  (`940cbeb`).
- Run #4: 5 vitest failures. Three underlying bugs:
  - No RTL `cleanup()` in `afterEach` (vitest `globals: false` doesn't
    auto-clean).
  - `UserListPage` test used `/admins/i` which matched both a stats
    card label and prose in the page subtitle.
  - Dashboard test had a query-param-switching MSW handler that was
    order-dependent, plus stale DOM refs captured before
    `await waitFor(...)`.
  Fixed all three (`3d708d8`).
- Run #5: 1 vitest failure. Dashboard test DOM came up empty
  (`<body><div/></body>`). Diagnosed: with cleanup now working, the
  real issue was visible — Recharts' `<ResponsiveContainer>` calls
  `new ResizeObserver(...)` during commit phase; jsdom has no
  `ResizeObserver`; without an error boundary, React 18 unmounts the
  entire root on the `ReferenceError`. Added a noop `ResizeObserver`
  (and defensive `matchMedia`) stub to `src/test/setup.ts`, guarded by
  existence checks so real browsers are unaffected (`7ed715b`).
- Run #6: green. All four jobs pass; only warnings are Node.js 20
  deprecation notices and a transient GitHub cache-service error.
- Wrote [`docs/step-09-ci-stabilisation.md`](./step-09-ci-stabilisation.md)
  as a per-fix post-mortem + guardrails for future changes (`253ef4a`).
- Discussed Playwright. Decided against it for now; documented reasoning
  in §"Testing philosophy" above.
- Session closed; this resume doc rewritten end-to-end as the
  authoritative handoff.
