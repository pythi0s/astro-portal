# Step 8 — nginx reverse-proxy + more interaction tests

Step 8, like Step 7, is a pragmatic follow-on and not part of the original six-step plan. It picks up two of the explicit "still pending" items from Step 7's close-out:

1. Route the React app through the nginx reverse-proxy (the hardest of the deferred items because Vite's dev server is not subpath-friendly out of the box).
2. Add interaction tests for the three highest-value React pages (dashboard, customers list, admin user list).

## Summary

- **React + nginx reverse-proxy is now operator-configurable.** Set `VITE_BASE=/app/` in `.env` and the entire stack (vite dev server, docker healthcheck, bootstrap banner, nginx location block) moves the React app under `/app/`. Leave it unset and the direct-port workflow from Step 6 is unchanged.
- **Three new interaction test suites** cover Dashboard KPIs, admin-only panel gating, customer list rendering + debounced search + empty state, and admin user list stats + filters. All use the Step 7 MSW + RTL scaffolding.
- **Lockfile generation remains deferred.** The authoring host does not have a real Node/npm install — Cursor's bundled `node.exe` helper lacks npm. CI will regenerate lockfiles on first successful job run; the user can then commit them.

## Files changed

### Modified

- `astro-portal/frontend-react/vite.config.ts` — reads `VITE_BASE` from env. Normalizes to always end with `/`. Defaults to `/`.
- `astro-portal/nginx/default.conf` — adds `upstream frontend_react_upstream` and a `location /app/` block with WebSocket upgrade headers for HMR. The block proxies to `http://frontend-react:5174` verbatim (no rewrite) because Vite is now aware of its own `/app/` base and emits URLs accordingly.
- `astro-portal/docker-compose.yml`:
  - `frontend-react.environment.VITE_BASE` is now piped through from the root `.env` with default `/`.
  - `frontend-react.healthcheck` now hits `http://localhost:5174$${VITE_BASE:-/}` — the `$$` escapes compose interpolation so the container shell expands VITE_BASE at healthcheck runtime, not at compose parse time.
  - `bootstrap.environment.FRONTEND_REACT_PUBLIC_URL` is now `http://localhost:5174${VITE_BASE:-/}` so the READY banner prints the correct URL for both default and subpath workflows.
- `astro-portal/.env.example` — adds a commented-out `# VITE_BASE=/app/` line with an explanation of when to set it.
- `astro-portal/README.md` — "Access Points" table grows a "With Nginx (React)" row. A new paragraph under the table documents the `VITE_BASE` requirement and the direct-port vs. reverse-proxy URL differences.

### New

- `astro-portal/frontend-react/src/pages/__tests__/Dashboard.test.tsx`
- `astro-portal/frontend-react/src/features/customers/__tests__/CustomerListPage.test.tsx`
- `astro-portal/frontend-react/src/features/admin/__tests__/UserListPage.test.tsx`
- `astro-portal/docs/step-08-nginx-tests.md` (this file).

## Design notes

### Why `VITE_BASE` is opt-in rather than always on

The default compose workflow (no `--profile`) has served the React app at `http://localhost:5174/` since Step 2. Quietly flipping to `/app/` would regress that: users following the Step 6 Quick Start would boot the stack, click the banner link, and see a 404 until they add a path suffix. Opt-in keeps the default flow identical and scopes the change to operators who are already in the nginx lane.

### Why the nginx block is `proxy_pass http://upstream` not `proxy_pass http://upstream/`

Two differences are subtle:

- `proxy_pass http://upstream` → the path from the client request is appended verbatim. `/app/foo` on the client becomes `/app/foo` on the upstream.
- `proxy_pass http://upstream/` → the matched `location` prefix is stripped before forwarding. `/app/foo` becomes `/foo` on the upstream.

Vite, with `base: '/app/'`, serves under `/app/*` and expects `/app/*` on the wire. We want the first behavior. If we ever changed this to the second, Vite would serve the app but every asset URL would 404 because Vite would emit `/app/@vite/client` while the upstream only knows `/`.

### Why `$${VITE_BASE:-/}` is needed in the healthcheck

Compose v2 interpolates `${VAR}` at parse time against the host environment / .env. We *do* want interpolation for the bootstrap banner's `FRONTEND_REACT_PUBLIC_URL`, because the banner runs in an Alpine sidecar that does not read the root .env file. We *don't* want interpolation for the frontend-react healthcheck, because the value needs to come from the container's own env (which we set via `environment.VITE_BASE`). Using `$${VITE_BASE:-/}` emits the literal `${VITE_BASE:-/}` into the final compose config, which `sh -c` then expands against the container's env at healthcheck time.

### Why three tests instead of all of them

Dashboard, customer list, and admin user list exercise three distinct slices of the shared scaffolding:

- **Dashboard** — multiple parallel React Query fan-out, order-sensitive handlers (current + previous revenue), auth-store-driven UI variation (admin panel).
- **Customer list** — debounced search (proves the scaffolding handles async timers correctly), query-param-driven fetch, empty-state CTA.
- **Admin user list** — URL-state-driven filter (`?role=admin`), stats card error state, role-humanization column.

The remaining domains (visits, solutions, templates, messages, profile) are structurally identical to one of these three and can be written quickly by copying the closest sibling. No new patterns are required.

## Verification (pending on a real Docker + Node runner)

**Default workflow (no `VITE_BASE`)** — unchanged from Step 6, should still pass every one of those checks.

**Reverse-proxy workflow** — sequence to validate once a Docker host is available:

1. `cp .env.example .env`
2. Edit `.env`, uncomment `VITE_BASE=/app/`.
3. `docker compose --profile with-nginx up --build`.
4. Wait for `astro-portal: READY`.
5. Expect banner line: `Frontend (React): http://localhost:5174/app/`.
6. `curl -sf http://localhost:5174/app/` → 200, returns Vite-generated HTML.
7. `curl -sf http://localhost:5174/` → 404 (expected — Vite dev server only serves under base).
8. Browser: open `http://localhost/app/` via nginx, log in, navigate `/app/dashboard`, confirm HMR edit propagates (save a source file, see the change without full reload).
9. `curl -sf http://localhost/` → Vue frontend (unchanged).

**CI** — the Step 7 workflow should still go green:
- `frontend-react` now runs three extra test files (Dashboard, CustomerListPage, UserListPage) in addition to the existing schema + Login tests.
- `compose config` against `--profile with-nginx` should exit 0 despite the new `upstream frontend_react_upstream` block (nginx config is mounted, not compose-parsed).

## Known risks / caveats

- **Vite HMR over nginx WebSocket has not been runtime-validated.** Vite 5 derives the HMR websocket path from `base`, and the nginx `location /app/` block carries `Upgrade` + `Connection` headers, so the upgrade should just work. If it does not, the fix is typically one of: pinning `server.hmr.clientPort` in `vite.config.ts`, or adding `proxy_read_timeout 86400s;` for long-lived websockets. I have not hit this yet so have not pre-emptively added it.
- **The tests use `msw/node` with the jsdom transport.** If CI ever starts failing on `unhandled request` errors for the new tests, check that `MemoryRouter` is not eager-loading the auth boot sequence (which would call `/auth/me` outside any handler). The `beforeEach` auth store reset already guards against that, but a refactor that re-introduces `AuthProvider` would need to re-mock `/auth/me` and `/auth/refresh`.
- **Lockfiles still not committed.** The two frontend CI jobs use `npm install` (not `npm ci`) to tolerate that. Once CI has produced the first green build, pull the `package-lock.json` from the artifact or regenerate on a real dev box and commit; then switch `cache: npm` on in `.github/workflows/ci.yml`.

## Diff shape

Expected `git diff --stat` vs. the previous commit (`57c594f Step 7`):

- `docker-compose.yml` (3 lines modified — healthcheck, environment, bootstrap)
- `nginx/default.conf` (upstream + /app/ location block)
- `.env.example` (new commented-out `VITE_BASE` line)
- `README.md` (2 table + one paragraph change)
- `frontend-react/vite.config.ts` (base, HMR comment)
- 3 new test files under `frontend-react/src/.../__tests__/`
- `docs/step-08-nginx-tests.md` (new)
- `docs/resume-next-session.md` (status refresh)

No backend code paths are modified.
