# Step 7 — CI + Interaction Test Scaffolding

Step 7 was not in the original six-step plan. It is a pragmatic follow-on that picks up the two items `docs/resume-next-session.md` left explicitly pending after Step 6: a GitHub Actions workflow and a first pass at MSW + React Testing Library interaction tests. No production code changes.

## Summary

- New `.github/workflows/ci.yml` with four independent jobs: `frontend-react`, `frontend-vue`, `backend`, `compose`.
- New `vitest.config.ts` wiring jsdom, globals-off Vitest, a setup file that boots MSW, and `@testing-library/jest-dom/vitest` matchers.
- New `src/test/` directory with MSW server + default handlers, a `renderWithProviders` helper that stacks the same providers `main.tsx` does, and the vitest setup file.
- Three interaction tests in `src/pages/__tests__/Login.test.tsx` covering the happy path, the 401 path, and the in-flight submit-disabled behavior.
- `nginx/default.conf` now documents in a comment why the React app is **not** yet proxied under `/app/`; changing that requires a two-sided fix (vite `base` + nginx rewrites) that deserves a dedicated step.

## Files added

- `.github/workflows/ci.yml` — see job list below.
- `astro-portal/frontend-react/vitest.config.ts` — jsdom env, setup file hook, `clearMocks` + `restoreMocks` for test isolation.
- `astro-portal/frontend-react/src/test/setup.ts` — starts MSW once, resets handlers + auth store + storage after every test.
- `astro-portal/frontend-react/src/test/msw.ts` — `setupServer(...defaultHandlers)` plus a `fakeAdminUser` fixture. Default handlers cover `/auth/login`, `/auth/me`, `/auth/refresh`.
- `astro-portal/frontend-react/src/test/renderWithProviders.tsx` — wraps a component under test with `QueryClientProvider`, `ToastProvider`, `ConfirmProvider`, and `MemoryRouter`. Accepts `route` and `extraRoutes` so tests can assert navigation by registering a stub target route.
- `astro-portal/frontend-react/src/pages/__tests__/Login.test.tsx` — three interaction tests (see "Tests shipped" below).
- `astro-portal/docs/step-07-ci-hardening.md` — this file.

## Files modified

- `astro-portal/nginx/default.conf` — added a `NOTE:` comment block right above the `server {}` block explaining why the React frontend is not yet proxied through nginx. No functional change.

## CI workflow shape

`.github/workflows/ci.yml` defines four independent jobs, all running on `ubuntu-latest` with no secrets:

1. **`frontend-react (typecheck + test + build)`**
   - `actions/setup-node@v4` with Node 20 (no npm cache yet — no lockfile).
   - `npm install --no-audit --no-fund`.
   - `npm run typecheck` (`tsc --noEmit`).
   - `npm run test` (vitest, all schema + interaction suites).
   - `npm run build` (tsc + vite build; uploaded as artifact on failure).

2. **`frontend (Vue build smoke)`**
   - `npm install` + `npm run build`. That's it — the Vue app has no test suite.

3. **`backend (ruff + alembic upgrade head)`**
   - Services: `postgres:18-alpine` with a pg_isready healthcheck.
   - `astral-sh/setup-uv@v3` with `enable-cache: true` keyed on `backend/uv.lock`.
   - `uv sync --frozen`.
   - `uv run ruff check .`.
   - `uv run alembic upgrade head` against the service Postgres (`DATABASE_URL=postgresql+asyncpg://crm_user:crm_password@localhost:5432/crm_database`).
   - `uv run alembic current` so migration head is visible in the logs.
   - `uv run python -m app.cli seed-admin-if-missing` as an idempotent no-op smoke test — confirms the Step 6 CLI subcommand imports and runs cleanly when env vars are unset.
   - Turns the login rate limiter off for CI (`LOGIN_RATE_LIMIT_MAX_ATTEMPTS=0`) so future auth tests can't flake.

4. **`compose config validation`**
   - Copies `.env.example` to `.env`, rewrites `SECRET_KEY` and `SEED_ADMIN_PASSWORD` to non-placeholder values, then runs `docker compose config --quiet` against all three profile combinations (default, `with-celery`, `with-nginx`). Catches typo'd `env_file:` paths, broken interpolation, healthcheck schema errors, and other compose regressions before they hit a runtime.

Concurrency is set per-ref with `cancel-in-progress: true` so stale queue heads don't hold up fresh pushes.

## Tests shipped

`src/pages/__tests__/Login.test.tsx`:

1. **Happy path** — types valid email + password, clicks submit, asserts the `/` home stub renders (i.e. `<Navigate to="/">` did the right thing), and confirms the auth store now holds a token + user snapshot.
2. **401 path** — types a wrong password, asserts the `role="alert"` block shows `Invalid email or password.`, the home stub never mounts, and the auth store stays empty.
3. **In-flight state** — installs a never-resolving MSW handler, clicks submit, asserts the submit button becomes disabled and the label flips to "Signing in…".

These are the patterns the next round of interaction tests (customers list, dashboard, etc.) should follow. Each new test imports `renderWithProviders`, `server` from `@/test/msw`, and installs only the extra handlers it needs.

## Design choices and deferred items

- **Split `vitest.config.ts` from `vite.config.ts`.** Keeps jsdom + setup scaffolding out of the production bundle. Vitest resolves `vitest.config.ts` ahead of `vite.config.ts`, so there is no tooling glue.
- **`setupFiles` instead of `globals: true`.** Explicit imports (`describe`, `expect`, `it` from `vitest`) are cheap and avoid accidental polluting of types.
- **Per-test auth store reset.** `beforeEach` forces the store to `{ token: null, user: null, isBooting: false }` so tests start signed-out without having to render an `AuthProvider`.
- **Per-test storage wipe.** `afterEach` clears `localStorage` + `sessionStorage` to stop one test's persisted token bleeding into the next.
- **`onUnhandledRequest: 'error'`** in MSW so any test that accidentally hits an un-mocked endpoint fails loudly instead of silently returning 0 bytes.
- **No npm cache in CI yet.** Lockfiles (`package-lock.json`) are not committed for either frontend. Once they are, add `cache: npm` + `cache-dependency-path` to the two frontend jobs.
- **Interaction tests beyond login were intentionally scoped out.** The dashboard, customers, visits, solutions, templates, messages, admin, and profile pages each require a bespoke set of MSW handlers and provider state. Shipping the scaffolding + one worked example is enough to unblock the next engineer; bulk-writing tests without the ability to run them on this host would produce false confidence.
- **nginx React routing is still deferred.** Proxying the React dev server through nginx at a subpath requires setting `base: '/app/'` in `frontend-react/vite.config.ts`, matching the path on the nginx `location /app/` block, and verifying Vite HMR's WebSocket upgrade path survives the rewrite. That is a small but real piece of work; I left a comment in `nginx/default.conf` where it belongs and deferred the change.

## Verification (pending on a real CI runner)

- [ ] The `frontend-react` job installs, typechecks, runs the three login interaction tests + seven schema tests, and builds clean.
- [ ] The `frontend-vue` job builds clean.
- [ ] The `backend` job finishes with `alembic current` showing a revision head and no ruff errors.
- [ ] All three `compose config` profile invocations exit 0.

If any job fails on first push, the fix should land as a small follow-up commit rather than an amend — keeping the CI failure and its fix in the history is easier to audit.

## Diff shape

Expected `git diff --stat origin/astro-cursor-test...HEAD` after this step:

- `.github/workflows/ci.yml` (new)
- `astro-portal/frontend-react/vitest.config.ts` (new)
- `astro-portal/frontend-react/src/test/setup.ts` (new)
- `astro-portal/frontend-react/src/test/msw.ts` (new)
- `astro-portal/frontend-react/src/test/renderWithProviders.tsx` (new)
- `astro-portal/frontend-react/src/pages/__tests__/Login.test.tsx` (new)
- `astro-portal/nginx/default.conf` (comment-only change)
- `astro-portal/docs/step-07-ci-hardening.md` (new)
- `astro-portal/docs/resume-next-session.md` (status refresh)

No production code paths were changed.
