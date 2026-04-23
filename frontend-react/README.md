# Astro Portal — React Frontend (`frontend-react/`)

React + TypeScript + Vite shell for the new Astro Portal UI. This is the Step 2
deliverable: a production-grade **auth foundation** (login, persistent session,
silent refresh, role guards). Feature pages (customers, visits, solutions,
messaging, dashboard, admin) are added in Steps 4 and 5.

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
| HTTP             | `axios` with interceptor-driven silent refresh      |
| Styling          | Tailwind CSS (palette mirrored from `../frontend/`) |

No Redux, no Context for state, no `react-query` yet — those land in Step 4 when
data fetching grows past the `/auth/*` endpoints.

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
