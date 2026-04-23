# Step 2 — React Frontend Auth Foundation (Login, RBAC, Persistent Session)

> **Target branch:** `intuitive-design` (commit `d17675511…`). Verify the working tree is on this branch and clean before starting. The repo has no submodules; do NOT run `git submodule update`.
> **Prerequisite:** Step 1 must be complete. Read `astro-portal/docs/api-audit.md` first and treat it as authoritative for endpoint paths, roles, and guards. If it is missing or conflicts with the backend source, STOP and report.

## Role
You are a senior React frontend engineer specializing in authentication, RBAC, and application shell architecture. You write production-grade, typed React code with clear separation between API clients, state stores, and route guards. You do NOT build feature pages in this step — only the auth-aware shell that every feature page will later plug into.

## Task / Objective
Scaffold a new React frontend under `astro-portal/frontend-react/` that replaces the existing Vue app's auth surface **only** (feature pages come in later steps). The deliverable is a working, runnable React app that a user can:

1. Open at `http://localhost:5174`.
2. Be redirected to `/login` if unauthenticated.
3. Log in using the existing backend `POST /auth/login` endpoint.
4. Stay logged in across page refresh, new tabs, and browser restart (persistent session).
5. Have their JWT auto-refreshed silently on 401, and transparently on app boot, using `POST /auth/refresh` and `GET /auth/me`.
6. See a minimal authenticated shell (header with user name + role + logout, empty `<Outlet/>` for future pages).
7. Be blocked from admin-only routes if their role is not `admin`, via a reusable route guard.

The new app must NOT break the existing Vue app or the docker-compose stack; it runs as an additional service on a separate port.

## Context
- **Repo layout (existing, do not disturb):**
  - Backend: [astro-portal/backend/](astro-portal/backend/) — FastAPI, unchanged in this step.
  - Existing Vue frontend: [astro-portal/frontend/](astro-portal/frontend/) — leave untouched. Read [frontend/src/stores/auth.js](astro-portal/frontend/src/stores/auth.js), [frontend/src/api/client.js](astro-portal/frontend/src/api/client.js), [frontend/src/api/auth.js](astro-portal/frontend/src/api/auth.js), and [frontend/src/router/index.js](astro-portal/frontend/src/router/index.js) for reference UX semantics (persistent session behavior, 401 interceptor, init guard) — replicate the behavior in React, do not copy the code.
  - Step 1 audit: `astro-portal/docs/api-audit.md` — source of truth for endpoint paths and role requirements.
- **New app location:** `astro-portal/frontend-react/` (sibling of `frontend/`).
- **Backend auth endpoints (confirm in audit doc before use):**
  - `POST /auth/login` — public. Request: `{ email, password }`. Response: `{ access_token, token_type }`.
  - `POST /auth/refresh` — bearer. Returns new token.
  - `GET /auth/me` — bearer. Returns current user: `{ id, email, full_name, role, is_active, ... }`.
  - `POST /auth/bootstrap` — public, one-time (for first admin). Out of scope for the UI here; note it in README only.
- **Role values** (from `UserRole` enum in `backend/app/models/user.py`): `admin`, `astrologer`, `receptionist`. Treat role comparison as case-sensitive and server-authoritative.
- **Token lifetime:** 1440 minutes (24h) by default (`ACCESS_TOKEN_EXPIRE_MINUTES` in `backend/app/core/config.py`). On every successful `/auth/me` during boot, call `/auth/refresh` once to extend the session (match existing Vue behavior).
- **Dev proxy:** The backend listens on `:8000`. Proxy `/api/*` and `/auth/*` from the Vite dev server to `http://backend:8000` inside Docker and `http://localhost:8000` for local `npm run dev`.
- **Docker:** Add a new compose service `frontend-react` (profile: default) on port `5174`, mirroring the existing `frontend` service pattern (node:20-alpine, volume mount, `npm run dev -- --host 0.0.0.0 --port 5174`). Do NOT remove or rename the existing `frontend` service in this step.

## Example (shape, not exact code)

Project structure to produce:

```
astro-portal/frontend-react/
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .env.example
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx                     # Shell: header + <Outlet/>
    ├── api/
    │   ├── client.ts               # axios instance, auth header, 401 refresh interceptor, request queue
    │   └── auth.ts                 # login, refresh, me
    ├── auth/
    │   ├── AuthProvider.tsx        # boot: restore from localStorage → /auth/me → /auth/refresh
    │   ├── useAuth.ts              # hook: { user, token, login, logout, isLoading, hasRole }
    │   ├── RequireAuth.tsx         # <Outlet/> guard; redirects to /login preserving ?next=
    │   └── RequireRole.tsx         # role guard; redirects to /403 if role mismatch
    ├── pages/
    │   ├── Login.tsx
    │   ├── Home.tsx                # authenticated landing placeholder
    │   ├── Forbidden.tsx           # /403
    │   └── NotFound.tsx            # /404
    ├── router.tsx                  # createBrowserRouter config
    └── types/
        └── api.ts                  # User, Role, LoginRequest, LoginResponse
```

A route guard must look structurally like:

```tsx
export function RequireRole({ allow, children }: { allow: Role[]; children?: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!allow.includes(user.role)) return <Navigate to="/403" replace />;
  return children ?? <Outlet />;
}
```

The 401 interceptor must:
- Queue concurrent requests during a refresh so only ONE `/auth/refresh` is in flight at a time.
- On refresh success, replay queued requests with the new token.
- On refresh failure, clear localStorage, reject all queued requests, and hard-redirect to `/login`.

## Constraints
1. **React + TypeScript + Vite**. Use React 18+, React Router v6 (data router APIs — `createBrowserRouter`), and Axios. Use **Zustand** for auth state (small, no Pinia baggage). No Next.js, no Redux, no MUI/Antd in this step.
2. Styling: minimal Tailwind CSS setup (mirror `frontend/tailwind.config.js` color palette if present — import the same primary hues). Do not port the mandala background or any other decorative assets yet.
3. Persist only two things to `localStorage`: `access_token` and a non-sensitive `user_snapshot` (id, email, full_name, role). Never persist passwords. Never persist refresh tokens (backend uses access-token-only refresh).
4. The `AuthProvider` MUST complete its boot sequence (localStorage → `/auth/me` → `/auth/refresh`) before any route renders. Show a full-page spinner during boot. No flash of the Login page for already-authenticated users.
5. Role checks are client-side hints for UX only. Do NOT replicate or hardcode backend authorization logic; always treat server 401/403 as authoritative.
6. Do NOT modify any file under `astro-portal/backend/` or `astro-portal/frontend/` in this step. Do NOT change existing `docker-compose.yml` services other than ADDING the new `frontend-react` service.
7. No business pages (customers, visits, solutions, messages, dashboard, admin users) — those are later steps. `/` after login shows a placeholder `Home.tsx` with "Welcome {name} (role: {role})" and a logout button. That is intentional.
8. No tests framework setup is required, but provide at least one Vitest-based unit test for the 401 refresh queue logic if you add Vitest; otherwise describe manual verification in the README.
9. Must work with `docker compose up --build` from a fresh clone, and also with `cd frontend-react && npm install && npm run dev` locally.
10. Keep dependencies minimal: `react`, `react-dom`, `react-router-dom`, `axios`, `zustand`, `tailwindcss`, `postcss`, `autoprefixer`, `typescript`, `vite`, `@vitejs/plugin-react`, `@types/*`. Justify any additional dependency in the README.
11. No emojis in code or UI copy. Neutral, professional tone.

## Output Format
Produce the following files under `astro-portal/frontend-react/` (complete, runnable):

- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `Dockerfile`, `.env.example`, `tailwind.config.js`, `postcss.config.js`, `README.md`
- `src/main.tsx`, `src/App.tsx`, `src/router.tsx`, `src/index.css`
- `src/api/client.ts`, `src/api/auth.ts`
- `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/RequireAuth.tsx`, `src/auth/RequireRole.tsx`
- `src/pages/Login.tsx`, `src/pages/Home.tsx`, `src/pages/Forbidden.tsx`, `src/pages/NotFound.tsx`
- `src/types/api.ts`
- `src/stores/auth.ts` (Zustand store)

Plus:
- Modify ONLY `astro-portal/docker-compose.yml` to add the `frontend-react` service (additive).
- A concise `README.md` in `frontend-react/` covering: run locally, run via docker, env vars, routing model, auth flow (1–2 sentences + link to `docs/api-audit.md`), manual verification checklist.

Final chat summary (≤ 15 lines) must include:
- The list of created/modified files with links.
- The exact commands to run it locally and via Docker.
- A manual verification checklist (see below) copied verbatim for the user to run.

## Validation Criteria
Accepted only if ALL of these hold:

- [ ] Starts cleanly with `docker compose up --build` from a fresh clone of `intuitive-design`, alongside the existing services, with no port conflicts.
- [ ] Starts cleanly locally with `cd frontend-react && npm install && npm run dev`.
- [ ] Visiting `/` while unauthenticated redirects to `/login?next=%2F`.
- [ ] Logging in with a valid admin user redirects back to `/` and shows "Welcome {full_name} (role: admin)".
- [ ] Refreshing the page while authenticated does NOT flash the Login screen and does NOT log the user out.
- [ ] Opening the app in a new tab inherits the session (no re-login).
- [ ] Clearing `localStorage.access_token` and refreshing redirects to `/login`.
- [ ] Manually expiring the token (edit localStorage to a malformed value) triggers a silent refresh attempt; on refresh failure, user is sent to `/login` and queued requests are rejected — no infinite loops, no duplicate `/auth/refresh` calls observable in the network tab.
- [ ] Visiting an admin-only route (`/admin-demo` guarded by `RequireRole allow={['admin']}`) as a non-admin shows the `/403` page.
- [ ] `docker compose down` followed by `docker compose up` still preserves the user's login (localStorage is browser-side, so this is a browser check, not a container check).
- [ ] The existing Vue app at `:5173` still works and is unmodified.
- [ ] No files under `backend/` or `frontend/` (Vue) are modified. `git diff --stat` shows changes only under `frontend-react/`, `docker-compose.yml`, and no other paths.
- [ ] `README.md` in `frontend-react/` contains the manual verification checklist and matches the one in the chat summary.
- [ ] All TypeScript files pass `tsc --noEmit`; no `any` in public API surfaces (internal `any` is acceptable only with a `// TODO(step-3): narrow` comment).
- [ ] Zero runtime console errors or unhandled promise rejections during the happy-path login/refresh/logout flow.
