# Step 1 — Backend API Discovery & Frontend Page Mapping

> **Target branch:** `intuitive-design` (commit `d17675511…`). Before doing anything else, verify: (1) working tree is on `intuitive-design` and clean, (2) `HEAD == origin/intuitive-design`, (3) no `.gitmodules` exists (this repo has no submodules; do NOT run `git submodule update` — it is a no-op and may mask issues). If any check fails, STOP and report.

## Role
You are a senior full-stack architect performing a read-only audit of an existing FastAPI backend. You specialize in API-to-UI mapping, RBAC design, and React frontend architecture. You do NOT write application code in this step — your only output is a specification document.

## Task / Objective
Produce a complete, accurate inventory of every HTTP endpoint exposed by the `astro-portal` backend, and propose a concrete React frontend page map that covers 100% of those endpoints. The document must be precise enough that a downstream engineer can use it to scaffold React routes, API clients, and RBAC guards without re-reading the backend source.

Concretely, deliver a single markdown report named `docs/api-audit.md` that contains:
1. An endpoint catalog (one row per route).
2. A role/permission matrix per endpoint.
3. A proposed React page tree with routes, guards, and the endpoints each page consumes.
4. A gap list: endpoints with no UI, UI needs with no endpoint, inconsistencies, and security concerns.

## Context
- Repository root: `astro-portal/`.
- Backend: FastAPI (async SQLAlchemy 2.0 + SQLModel, Pydantic v2, JWT via `python-jose`, bcrypt).
  - Routes: `astro-portal/backend/app/api/routes/{auth,customers,visits,solutions,messages,timeline,dashboard,admin}.py` and `astro-portal/backend/app/api/health.py`.
  - Models: `astro-portal/backend/app/models/{user,customer,visit,solution,customer_solution,message_template,message_log}.py`.
  - Schemas: `astro-portal/backend/app/schemas/{auth,customer,visit,solution,message,dashboard}.py`.
  - Security / role enforcement: `astro-portal/backend/app/core/security.py`.
  - App wiring / middleware / prefix: `astro-portal/backend/app/main.py`.
  - App startup / bootstrap hooks (new on `intuitive-design`): `astro-portal/backend/app/core/startup.py` — MUST be inspected; document what it does at startup (DB init, seeding, admin bootstrap, etc.) and whether it affects the API surface or idempotent first-run behavior.
- Roles defined in `UserRole` enum: `admin`, `astrologer`, `receptionist`.
- Target frontend stack for later steps: React (Vite + React Router + a typed API client). You are NOT implementing it now; you are only specifying the page/route surface it must cover.
- The existing Vue frontend under `astro-portal/frontend/src/views/` may be read for reference only, to understand current UX intent. It will be replaced later.
- Authoritative facts must come from source code, not from `README.md`. The README may be stale.

## Example (shape, not content — do not copy values)
An endpoint catalog row must look like:

| Method | Path | Router file | Auth | Allowed roles | Request schema | Response schema | Query/path params | Side effects | Notes |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/api/customers` | `routes/customers.py` | Bearer | admin, astrologer | `CustomerCreate` | `CustomerRead` | — | writes `customer` table; stores upload to `UPLOAD_DIR` | 413 if photo > N MB |

A page-map row must look like:

| Page (React route) | Purpose | Guard | Endpoints consumed | Components / state | Empty state |
|---|---|---|---|---|---|
| `/customers/:id` | Customer detail with tabs | `requireAuth` + `requireAnyRole([admin,astrologer,receptionist])` | `GET /customers/{id}`, `GET /timeline/{customer_id}`, `GET /visits?customer_id=` | `<CustomerHeader/>`, `<TabsDetailsTimelineSolutions/>` | "No visits yet" CTA |

A gap-list entry must look like:
- `GAP-003` — `PUT /admin/users/{id}` exists but has no corresponding UI screen; recommend adding `/admin/users/:id/edit`.
- `GAP-011` — Login endpoint accepts email but `User` model lacks unique index on `email`; recommend Alembic migration.

## Constraints
1. Read-only. Do not modify any source file. Do not add dependencies. Do not run migrations or start services.
2. Ground every claim in a file path and, where useful, a line range (e.g. `backend/app/api/routes/auth.py:42-78`). If something is unclear, mark it `UNVERIFIED` rather than guessing.
3. Enumerate 100% of routes registered on the FastAPI app (walk `main.py` includes + each router file). Missing even one endpoint is a failure.
4. For each endpoint, determine auth requirement from the actual dependency (`Depends(...)`) chain in `core/security.py`, not from naming conventions.
5. The proposed React page tree must cover every non-health endpoint at least once. Health and internal-only endpoints may be listed as "no UI (system)".
6. Do not propose new backend endpoints in this step unless filling a clear UX gap; if you do, list them under `gap list → proposed new endpoints` with justification — do not implement them.
7. Keep the document under ~600 lines. Prefer tables over prose.
8. No emojis. No marketing language. Neutral technical tone.
9. Output ONLY the file `docs/api-audit.md` plus a short chat summary (≤ 10 lines) that links to it. Do not create other files.

## Output Format
A single markdown file `docs/api-audit.md` with exactly these top-level sections, in order:

1. `# API Audit & Frontend Page Map`
2. `## 1. Methodology` — files inspected, how roles/auth were determined, assumptions.
3. `## 2. Endpoint Catalog` — one table covering every route (columns as in the Example above), grouped by router file.
4. `## 3. Role × Endpoint Matrix` — rows = endpoints, columns = `admin`, `astrologer`, `receptionist`, `public`; cell = `R` / `W` / `—`.
5. `## 4. Proposed React Page Tree` — nested list of routes with guard + purpose, followed by the page-map table (columns as in the Example above).
6. `## 5. Revenue / Dashboard Coverage` — which endpoints feed revenue metrics today, which metrics are missing data sources, and what a future "Revenue Dashboard" page would need.
7. `## 6. Gap List` — numbered IDs (`GAP-001`, …), each with: category (`missing-ui` | `missing-endpoint` | `inconsistency` | `security` | `data-model`), severity (`low|med|high`), file reference, recommendation.
8. `## 7. Open Questions` — bullet list of items needing product/owner input before Step 2.

## Validation Criteria
Your deliverable is accepted only if ALL of the following hold:
- [ ] Audit was performed against branch `intuitive-design` at commit `d17675511…` (state this explicitly in §1).
- [ ] Every route registered via `app.include_router(...)` in `backend/app/main.py` appears in §2, with correct method + full path (including any prefix).
- [ ] `backend/app/core/startup.py` is inspected and its behavior documented in §1 (Methodology) and/or §6 if it introduces gaps.
- [ ] Each endpoint row cites the source file; role determination matches the actual `Depends` chain in `core/security.py`.
- [ ] §3 matrix has no empty cells — every endpoint × role intersection is filled.
- [ ] §4 route tree covers every non-system endpoint from §2 at least once; no endpoint is orphaned.
- [ ] §4 uses React Router v6-style paths (`/customers/:id`, not `/customers/{id}`) and names guards consistently (`requireAuth`, `requireRole('admin')`, `requireAnyRole([...])`).
- [ ] §5 explicitly lists the fields on `Visit` / `CustomerSolution` that support revenue computation and names at least three revenue metrics with their formulas.
- [ ] §6 contains at least one entry per category or explicitly states `none found` with justification.
- [ ] No source files outside `docs/api-audit.md` are created or modified.
- [ ] Document is self-consistent: an endpoint listed in §2 with `admin-only` must appear as admin-only in §3 and be guarded accordingly in §4.
- [ ] Chat summary at the end links to `docs/api-audit.md` and lists the 3 highest-severity gaps.
