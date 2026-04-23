# Astro Portal — React Frontend (`frontend-react/`)

React + TypeScript + Vite shell for the new Astro Portal UI. Step 2 delivered the
**auth foundation** (login, persistent session, silent refresh, role guards);
Step 4 adds the **Revenue Dashboard** at `/dashboard`. Remaining feature pages
(customers, visits, solutions, messaging, admin) ship in Step 5.

The existing Vue app in `../frontend/` is **unchanged** and continues to serve
production traffic until this app reaches feature parity.

---

## Tech stack

| Concern          | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | React 18 + TypeScript (strict)                      |
| Build            | Vite 5                                              |
| Routing          | `react-router-dom` v6 (data router)                 |
| Auth state       | `zustand`                                           |
| Server state     | `@tanstack/react-query` v5 (Step 4)                 |
| HTTP             | `axios` with interceptor-driven silent refresh      |
| Charts           | `recharts` (Step 4)                                 |
| Styling          | Tailwind CSS (palette mirrored from `../frontend/`) |

No Redux and no Context for app state. Zustand owns auth; React Query owns
every piece of server data displayed on `/dashboard`.

---

## Directory layout

```
frontend-react/
├── Dockerfile
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── src/
    ├── main.tsx              # React entry; wires RouterProvider
    ├── AppShell.tsx          # TopBar + AuthProvider + <Outlet/>
    ├── router.tsx            # Route tree (public / RequireAuth / RequireRole)
    ├── index.css             # Tailwind layers
    ├── api/
    │   ├── client.ts         # Axios instance + 401 queue + silent refresh
    │   └── auth.ts           # login / refresh / me; registers refresh handler
    ├── auth/
    │   ├── AuthProvider.tsx  # One-time boot: restore → /auth/me → /auth/refresh
    │   ├── RequireAuth.tsx   # Route guard: auth-only
    │   ├── RequireRole.tsx   # Route guard: role-gated
    │   └── useAuth.ts        # Hook over the Zustand store + auth API
    ├── components/
    │   ├── FullPageSpinner.tsx
    │   └── TopBar.tsx
    ├── pages/
    │   ├── Login.tsx
    │   ├── Home.tsx
    │   ├── AdminDemo.tsx     # proves RequireRole works; removed in Step 5
    │   ├── Forbidden.tsx     # /403
    │   └── NotFound.tsx      # /404
    ├── stores/
    │   └── auth.ts           # Zustand store + localStorage persistence
    └── types/
        └── api.ts            # Role + User DTOs matching backend schemas
```

---

## Auth flow at a glance

### 1. Boot sequence (`AuthProvider`)
On first mount, before any route renders:

1. Read token from `localStorage`.
2. If no token → `isBooting = false`, land on `/login`.
3. Call `GET /auth/me` with the token.
   - On 200: user is stored; `POST /auth/refresh` is called to extend the
     session; `isBooting = false`; authed routes render.
   - On 401 / network error: credentials are cleared, `isBooting = false`,
     `/login` is shown.

While `isBooting` is true, **every guard renders `FullPageSpinner`** — there is
no flash of the Login page for already-authenticated users.

### 2. Request path
`apiClient` request interceptor reads the token from the Zustand store
(single source of truth) and attaches `Authorization: Bearer <token>` to every
outgoing request.

### 3. 401 handling (`apiClient` response interceptor)
When a protected endpoint returns 401:

1. The request is marked `_authRetried` to prevent loops.
2. A **single** `POST /auth/refresh` is fired regardless of how many requests
   are in flight. Concurrent callers await the same promise (`refreshInFlight`).
3. On refresh success → new token stored, original request is retried with the
   new `Authorization` header. The caller never sees the 401.
4. On refresh failure → store is cleared and the browser is redirected to
   `/login?next=<current-path>`. In-flight requests reject cleanly.

The `/auth/login` and `/auth/refresh` endpoints are excluded from this retry
logic (their 401 is terminal).

### 4. Role guards
Admin-only routes wrap in `<RequireRole allow={['admin']} />`. Non-admin users
hitting the route are redirected to `/403`, not shown a half-loaded page.
Unauthenticated users are sent to `/login?next=…`. Booting state still shows
the spinner.

---

## Local development

```powershell
cd astro-portal/frontend-react
npm install
copy .env.example .env      # adjust VITE_BACKEND_URL if the backend is elsewhere
npm run dev                 # http://localhost:5174
```

The Vite dev server proxies `/auth`, `/customers`, `/visits`, `/solutions`,
`/templates`, `/messages`, `/timeline`, `/dashboard`, `/admin`, `/health`,
`/uploads` to the backend at `VITE_BACKEND_URL` (default
`http://localhost:8000`). The browser origin remains `localhost:5174` so CORS
never comes into play in dev.

### Scripts

| Command            | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Vite dev server on port 5174                    |
| `npm run build`    | `tsc --noEmit` then `vite build`                |
| `npm run preview`  | Serve the production build locally              |
| `npm run typecheck`| Strict TypeScript check without emit            |

---

## Docker Compose

The service is defined in `../docker-compose.yml` under the `react` profile so
it does not start by default while the Vue app is still authoritative:

```powershell
cd astro-portal
docker compose --profile react up frontend-react
# → http://localhost:5174
```

Inside the container, `VITE_BACKEND_URL` is set to `http://backend:8000` so the
Vite proxy reaches the backend over the compose network.

---

## Verification checklist (Step 2 exit criteria)

Manual smoke tests against a live backend:

1. **Happy-path login:** `POST /auth/login` with valid admin creds succeeds;
   user is redirected to `/`; TopBar shows name + role badge.
2. **Persistent session:** Reload the page → **no flash of `/login`**; the
   spinner renders briefly, then `/` renders with the same user.
3. **Role guard:** As `admin`, visit `/admin-demo` → renders. Sign out, sign in
   as `astrologer`, visit `/admin-demo` → redirected to `/403`.
4. **Silent refresh:** Set `ACCESS_TOKEN_EXPIRE_MINUTES=1` in `backend/.env`,
   restart backend, stay on the app for >60 s, then click around. DevTools
   Network tab shows exactly **one** `POST /auth/refresh` followed by the
   retried request; no UI flicker, no redirect to `/login`.
5. **Invalid token:** Edit `localStorage.astro_access_token` to a junk value,
   reload → cleared, redirected to `/login`. No infinite loop.
6. **Backend down:** Stop the backend, reload → spinner briefly, then `/login`
   with a generic error after the login attempt. No uncaught exceptions.
7. **Logout:** Click "Sign out" → localStorage is cleared, redirected to
   `/login`. Subsequent reload stays on `/login`.
8. **Unknown route:** Visit `/does-not-exist` → `/404` page with a link home.
9. **Typecheck:** `npm run typecheck` passes with zero errors.
10. **Build:** `npm run build` succeeds.

---

## Notes for Step 3+

- `apiClient` is the only module that should read/write the auth token
  directly. Feature APIs (customers, visits, …) must import it, not axios.
- `useAuth().hasRole('admin')` is the only supported way for UI components to
  conditionally render admin-only affordances. Never read `user.role` ad-hoc.
- The Vue app in `../frontend/` will be retired once feature parity is reached
  (Step 5 finishes). Until then, both apps talk to the same backend.

---

## Revenue Dashboard (Step 4)

Route `/dashboard` (also the default landing for authenticated users) reads all
its data from the new Step 3 endpoints:

| Panel                     | Endpoint                                 |
| ------------------------- | ---------------------------------------- |
| KPI cards + deltas        | `GET /dashboard/revenue?from&to` (x2: current + previous window) |
| Earnings chart            | `GET /dashboard/earnings?period=&days=`  |
| Payment status doughnut   | Derived from the revenue summary (collected / outstanding / waived) |
| Recent visits             | `GET /visits/?date_from&date_to&limit=10` |
| Top revenue by category   | `GET /dashboard/revenue-by-category?from&to` |
| Staff collection (admin)  | Placeholder — backend endpoint deferred (see `docs/step-03-changelog.md`) |

### Key design choices

- **URL is the single source of truth for the range.** `/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD` is shareable and survives hard refresh.
- **Granularity auto-follows the range** (≤31 d → day, ≤120 d → week, else month) with a manual per-session override. Override state is announced via `aria-live`.
- **Delta vs. previous window** is computed client-side off the previous-window fetch. Zero-previous renders `—`, not `NaN%`.
- **Money is always rendered through `formatMoney()`.** Currency code comes from `VITE_CURRENCY` (default `INR`). No `₹` or `$` characters appear in any JSX.
- **One panel, one error.** `<PanelShell>` keeps a failed widget from blanking the whole page.

### Manual verification checklist

1. `/dashboard` renders for `admin`, `astrologer`, and `receptionist`. Unauthenticated visit redirects to `/login?next=%2Fdashboard`.
2. Clicking `7D` / `30D` / `90D` / `365D` updates the URL and triggers one fetch per panel (check devtools Network).
3. Hard-refreshing `?from=...&to=...` restores the exact range.
4. The six KPI cards show value, delta %, and an up/down/flat glyph. No raw `NaN` or `Infinity`.
5. Earnings chart granularity defaults to `day` at 30D; overriding to `week` updates the chart and the `aria-live` helper text.
6. Payment-status doughnut legend amounts sum to Total Revenue ± 1.
7. Recent-visits rows link to `/customers/:id` (Step-5 stub page — must navigate without JS error).
8. Admin-only "Staff collection rate" panel is present for admin, **absent from the DOM** when logged in as astrologer or receptionist.
9. `npm run build` succeeds. `npm run typecheck` is clean.
10. Existing Step-2 behaviour still works: login, persistent session, silent 401 refresh.

### What is deferred (and why)

- **Vitest + React Testing Library + MSW tests** — test scaffolding is in `devDependencies`; suites ship in Step 6 alongside the setup hardening that also validates the docker/alembic path.
- **Bundle-size measurement + Lighthouse score** — require a `vite build` on the target machine. Measure on the Docker test box and record in `docs/step-04-changelog.md` when available.
- **Staff collection breakdown** — backend endpoint `NEW-03` was deferred in Step 3; the panel is a placeholder that still enforces the `hasRole('admin')` gate.
