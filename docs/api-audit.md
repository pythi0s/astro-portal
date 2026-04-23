# API Audit & Frontend Page Map

> Produced as Step 1 of the `astro-portal` roadmap.
> **Branch:** `intuitive-design` — **Commit:** `d17675511aaf85ca79d99790e1515c07dd88bd33` — repo has **no submodules**.
> This document is authoritative for endpoint paths, role requirements, and the React page map consumed by Steps 2–6.
>
> **Step 3 reconciliation (2026-04-23):** gap remediation from `docs/step-03-changelog.md` has landed on branch `astro-cursor-test`. The §3 role matrix below is unchanged — Step 3 kept the "any authenticated user" posture for non-admin routes because the audit's proposed role tightening for astrologer/receptionist was gated on product sign-off (see §7 open question #1). Stricter per-role `require_role` wrappers land in Step 5 when the React UI surfaces the boundaries. `GAP-DATA-02` was re-verified during Step 3: the `ix_user_email` unique index already exists in the init migration (`71ad155155a5_init.py:56`), so no new migration was required.

---

## 1. Methodology

### Files inspected
- App wiring: [backend/app/main.py](../backend/app/main.py).
- Config: [backend/app/core/config.py](../backend/app/core/config.py).
- Security / auth deps: [backend/app/core/security.py](../backend/app/core/security.py).
- Startup lifecycle: [backend/app/core/startup.py](../backend/app/core/startup.py).
- DB session: [backend/app/db/database.py](../backend/app/db/database.py).
- Upload helper: [backend/app/core/uploads.py](../backend/app/core/uploads.py).
- Routes: [auth.py](../backend/app/api/routes/auth.py), [customers.py](../backend/app/api/routes/customers.py), [visits.py](../backend/app/api/routes/visits.py), [solutions.py](../backend/app/api/routes/solutions.py), [messages.py](../backend/app/api/routes/messages.py), [timeline.py](../backend/app/api/routes/timeline.py), [dashboard.py](../backend/app/api/routes/dashboard.py), [admin.py](../backend/app/api/routes/admin.py), [health.py](../backend/app/api/health.py).
- Models: [user.py](../backend/app/models/user.py), [customer.py](../backend/app/models/customer.py), [visit.py](../backend/app/models/visit.py), [solution.py](../backend/app/models/solution.py), [customer_solution.py](../backend/app/models/customer_solution.py), [message_template.py](../backend/app/models/message_template.py), [message_log.py](../backend/app/models/message_log.py).
- Schemas: [auth.py](../backend/app/schemas/auth.py), [customer.py](../backend/app/schemas/customer.py), [visit.py](../backend/app/schemas/visit.py), [solution.py](../backend/app/schemas/solution.py), [message.py](../backend/app/schemas/message.py), [dashboard.py](../backend/app/schemas/dashboard.py).
- Alembic: [env.py](../backend/alembic/env.py), [versions/71ad155155a5_init.py](../backend/alembic/versions/71ad155155a5_init.py), [versions/2f81f6eb5f55_add_kundali_original_name.py](../backend/alembic/versions/2f81f6eb5f55_add_kundali_original_name.py).

### How roles / auth were determined
- Every route's `Depends(...)` chain was traced back to `core/security.py`.
- Three primitives exist there:
  - `get_current_user` — decodes JWT, loads `User` by `id`, requires `is_active=True`. No role check.
  - `require_role(allowed_roles: Sequence[UserRole])` — wraps `get_current_user`, then asserts `user.role in allowed_roles`.
  - `security_scheme = HTTPBearer()` — sets the "Bearer" auth type in OpenAPI.
- Public routes have no security dependency at all (decorator-only).
- "Admin" in this codebase means `Depends(require_role([UserRole.admin]))`. Only the admin router and `POST /auth/register` use it.
- No other role (`astrologer`, `receptionist`) is gated anywhere in code. Every non-admin-gated, non-public route is "any authenticated user" — see §3 and §6 for the mismatch with `README.md`.

### Assumptions (to be resolved in Step 3)
- **Framework trailing-slash behavior** — several routers declare paths as `/customers/`, `/visits/`, `/solutions/`, `/templates/`. FastAPI's default redirects `/customers` → `/customers/`. The audit lists both the declared and the canonical form.
- **`POST /auth/bootstrap`** is documented as "create first admin". The code gates on "any user exists", not "any admin exists". The distinction matters if non-admin users are ever created before an admin — currently impossible via UI, but possible via CLI/SQL — and is flagged.
- **`startup.py` runs migrations programmatically** via `alembic upgrade head` inside the FastAPI lifespan, then optionally seeds an admin if `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` are set and no users exist. On migration failure it logs and returns — the app still starts with a broken DB. Flagged as `GAP-SEC-02`.
- **`UserRole` enum** has three values — `admin`, `astrologer`, `receptionist`. Any role outside this set cannot be stored or authenticated; the UI must treat these three as the complete universe.

---

## 2. Endpoint Catalog

### Registration order (from `main.py:34-42`)

```
app.include_router(health_router)    # no prefix
app.include_router(auth.router)      # /auth
app.include_router(customers.router) # /customers
app.include_router(visits.router)    # /visits
app.include_router(solutions.router) # /solutions
app.include_router(timeline.router)  # /timeline
app.include_router(messages.router)  # no prefix (templates + messages)
app.include_router(dashboard.router) # /dashboard
app.include_router(admin.router)     # /admin
```

Plus `GET /` declared directly on `app` (`main.py:45-47`).

**Total endpoints: 44** (2 health + 6 auth + 9 customers + 5 visits + 5 solutions + 1 timeline + 7 messages + 2 dashboard + 6 admin + 1 root).

### 2.1 Root
| Method | Path | File | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| GET | `/` | `main.py:45-47` | Public | all | — | `{status, service, docs}` untyped dict | system |

### 2.2 Health — [backend/app/api/health.py](../backend/app/api/health.py)
| Method | Path | Lines | Auth | Roles | Response | Notes |
|---|---|---|---|---|---|---|
| GET | `/health/live` | 10-12 | Public | all | `{status:"alive"}` | liveness only; no DB |
| GET | `/health/db` | 15-32 | Public | all | `{status, database, latency_ms}` or `{status, error}` | **Issue:** uses `Depends(get_session)` so an unreachable DB causes a 500 before the except branch can run. `GAP-SEC-04`. |

### 2.3 Auth — [backend/app/api/routes/auth.py](../backend/app/api/routes/auth.py)
| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/auth/login` | 26-35 | Public | all | `LoginRequest{email,password}` | `TokenResponse{access_token,token_type}` | No rate limit. JWT contains `{sub: str(user_id), role}`; role re-checked from DB on each request (good). |
| POST | `/auth/refresh` | 38-42 | Bearer | any | — | `TokenResponse` | Just issues a fresh token for the current user. |
| POST | `/auth/register` | 45-65 | Admin | admin | `UserCreate` | `UserRead` | **Redundant** with `POST /admin/users`; see `GAP-API-01`. |
| GET | `/auth/me` | 68-70 | Bearer | any | — | `UserRead` | |
| PUT | `/auth/me` | 73-87 | Bearer | any | `UserUpdate{full_name?,phone?}` | `UserRead` | Cannot change email or password via this route. |
| POST | `/auth/bootstrap` | 90-107 | Public* | all | `UserCreate` | `UserRead` | Rejects 400 if **any user** exists (not only admins). Returns 200 and promotes to `admin` regardless of request body's role. |

### 2.4 Customers — [backend/app/api/routes/customers.py](../backend/app/api/routes/customers.py)
| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/customers/` | 25-35 | Bearer | any auth | `CustomerCreate` | `CustomerRead` (empty `visits`/`customer_solutions`) | Sets `created_by = current_user.id`. |
| GET | `/customers/` | 38-59 | Bearer | any auth | `search?, is_active?, skip, limit` | `list[CustomerRead]` | **Bug:** declared `response_model=list[CustomerRead]` but rows are not eager-loaded, so nested `visits`/`customer_solutions` fields fail to serialize under MissingGreenlet. `GAP-API-02`. |
| GET | `/customers/{id}` | 62-79 | Bearer | any auth | — | `CustomerRead` with nested visits + customer_solutions (eager-loaded) | 404 if missing. |
| PUT | `/customers/{id}` | 82-102 | Bearer | any auth | `CustomerUpdate` | `CustomerRead` | Same nested-load issue on return as POST. |
| DELETE | `/customers/{id}` | 105-120 | Bearer | any auth | — | `{detail}` | **Soft delete** (`is_active=False`). |
| POST | `/customers/{id}/photo` | 123-143 | Bearer | any auth | multipart `file` | `CustomerRead` | 5 MB, jpeg/png/webp. Deletes previous photo. |
| POST | `/customers/{id}/kundali` | 146-167 | Bearer | any auth | multipart `file` | `CustomerRead` | 10 MB, image types + PDF. Stores original filename. |
| GET | `/customers/{id}/visits` | 170-179 | Bearer | any auth | — | `list[VisitRead]` | Ordered `visit_date desc`. |
| GET | `/customers/{id}/solutions` | 182-202 | Bearer | any auth | — | `list[CustomerSolutionHistory]` | Joins `CustomerSolution` × `Solution`. |

### 2.5 Visits — [backend/app/api/routes/visits.py](../backend/app/api/routes/visits.py)
| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/visits/` | 20-45 | Bearer | any auth | `VisitCreate{customer_id, …, solution_ids[]}` | `VisitRead` | Creates linked `CustomerSolution` rows. Sets `visited_by = current_user.id`. |
| GET | `/visits/` | 48-70 | Bearer | any auth | `customer_id?, payment_status?, date_from?, date_to?, skip, limit` | `list[VisitRead]` | Ordered `visit_date desc`. |
| GET | `/visits/{id}` | 73-92 | Bearer | any auth | — | `VisitWithSolutions` | Joins to fetch attached solutions. |
| PUT | `/visits/{id}` | 95-115 | Bearer | any auth | `VisitUpdate` | `VisitRead` | |
| DELETE | `/visits/{id}` | 118-131 | Bearer | any auth | — | `{detail}` | **HARD delete** — inconsistent with customers/solutions/templates. `GAP-CON-01`. |

### 2.6 Solutions — [backend/app/api/routes/solutions.py](../backend/app/api/routes/solutions.py)
| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/solutions/` | 18-28 | Bearer | any auth | `SolutionCreate` | `SolutionRead` | |
| GET | `/solutions/` | 31-47 | Bearer | any auth | `category?, is_active?, skip, limit` | `list[SolutionRead]` | **No text search** despite README claim. `GAP-API-03`. |
| GET | `/solutions/{id}` | 50-60 | Bearer | any auth | — | `SolutionRead` | |
| PUT | `/solutions/{id}` | 63-83 | Bearer | any auth | `SolutionUpdate` | `SolutionRead` | |
| DELETE | `/solutions/{id}` | 86-101 | Bearer | any auth | — | `{detail}` | Soft delete. |

### 2.7 Timeline — [backend/app/api/routes/timeline.py](../backend/app/api/routes/timeline.py)
| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| GET | `/timeline/{customer_id}` | 17-78 | Bearer | any auth | `skip, limit` | Untyped `list[dict]` (visit / solution / message events, sorted by date desc) | **No `response_model`** — clients lose type safety. `GAP-API-04`. Pagination is in-memory after full load. `GAP-PERF-01`. |

### 2.8 Messages & Templates — [backend/app/api/routes/messages.py](../backend/app/api/routes/messages.py)
Router declared with no prefix (`APIRouter(tags=["messages"])`), paths are absolute.

| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/templates/` | 30-40 | Bearer | any auth | `TemplateCreate` | `TemplateRead` | |
| GET | `/templates/` | 43-56 | Bearer | any auth | `channel?, trigger_type?` | `list[TemplateRead]` | Hard-filters `is_active=True` (soft-deleted templates are hidden even by id-lookup elsewhere). |
| PUT | `/templates/{id}` | 59-78 | Bearer | any auth | `TemplateUpdate` | `TemplateRead` | |
| DELETE | `/templates/{id}` | 81-96 | Bearer | any auth | — | `{detail}` | Soft delete. |
| POST | `/messages/send-email` | 116-177 | Bearer | any auth | `SendEmailRequest` | `MessageLogRead` | Uses aiosmtplib. On failure, records `MessageStatus.failed` with `error_message` — **exposes SMTP error verbatim to client**. `GAP-SEC-05`. |
| POST | `/messages/send-whatsapp` | 183-231 | Bearer | any auth | `SendWhatsAppRequest` | `MessageLogRead` | Twilio. Requires `template_id` (no ad-hoc body). Same verbose-error issue. |
| GET | `/messages/log` | 237-253 | Bearer | any auth | `customer_id?, channel?, skip, limit` | `list[MessageLogRead]` | |

### 2.9 Dashboard — [backend/app/api/routes/dashboard.py](../backend/app/api/routes/dashboard.py)
| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| GET | `/dashboard/summary` | 20-73 | Bearer | any auth | — | `DashboardSummary` | Month-to-date only; no custom range. `GAP-API-05`. |
| GET | `/dashboard/earnings` | 76-125 | Bearer | any auth | `period(daily\|weekly\|monthly), days(7-365)` | `EarningsSummary` | Range is `today - days` → `today`. No explicit `from/to`. |

### 2.10 Admin — [backend/app/api/routes/admin.py](../backend/app/api/routes/admin.py)
All endpoints gated by `_admin_only = require_role([UserRole.admin])` at module level.

| Method | Path | Lines | Auth | Roles | Request | Response | Notes |
|---|---|---|---|---|---|---|---|
| GET | `/admin/users` | 22-36 | Admin | admin | `role?, is_active?` | `list[UserRead]` | |
| GET | `/admin/users/{id}` | 39-49 | Admin | admin | — | `UserRead` | |
| POST | `/admin/users` | 52-72 | Admin | admin | `UserCreate` | `UserRead` (201) | |
| PUT | `/admin/users/{id}` | 87-122 | Admin | admin | `AdminUserUpdate` | `UserRead` | Can change email/password/role/is_active. |
| DELETE | `/admin/users/{id}` | 125-143 | Admin | admin | — | `{detail}` | Soft deactivate; refuses self. |
| GET | `/admin/stats` | 146-162 | Admin | admin | — | `{total_users, active_users, admin_count}` untyped | No `response_model`. `GAP-API-06`. |

---

## 3. Role × Endpoint Matrix

Legend: `R` = may call (read-oriented), `W` = may call (write/destructive), `—` = forbidden by code (401/403), `P` = public (no token required).

| Endpoint | public | admin | astrologer | receptionist |
|---|---|---|---|---|
| `GET /` | P | R | R | R |
| `GET /health/live` | P | R | R | R |
| `GET /health/db` | P | R | R | R |
| `POST /auth/login` | P | P | P | P |
| `POST /auth/refresh` | — | R | R | R |
| `POST /auth/register` | — | W | — | — |
| `GET /auth/me` | — | R | R | R |
| `PUT /auth/me` | — | W | W | W |
| `POST /auth/bootstrap` | P* | P* | P* | P* |
| `POST /customers/` | — | W | W | W |
| `GET /customers/` | — | R | R | R |
| `GET /customers/{id}` | — | R | R | R |
| `PUT /customers/{id}` | — | W | W | W |
| `DELETE /customers/{id}` | — | W | W | W |
| `POST /customers/{id}/photo` | — | W | W | W |
| `POST /customers/{id}/kundali` | — | W | W | W |
| `GET /customers/{id}/visits` | — | R | R | R |
| `GET /customers/{id}/solutions` | — | R | R | R |
| `POST /visits/` | — | W | W | W |
| `GET /visits/` | — | R | R | R |
| `GET /visits/{id}` | — | R | R | R |
| `PUT /visits/{id}` | — | W | W | W |
| `DELETE /visits/{id}` | — | W | W | W |
| `POST /solutions/` | — | W | W | W |
| `GET /solutions/` | — | R | R | R |
| `GET /solutions/{id}` | — | R | R | R |
| `PUT /solutions/{id}` | — | W | W | W |
| `DELETE /solutions/{id}` | — | W | W | W |
| `GET /timeline/{customer_id}` | — | R | R | R |
| `POST /templates/` | — | W | W | W |
| `GET /templates/` | — | R | R | R |
| `PUT /templates/{id}` | — | W | W | W |
| `DELETE /templates/{id}` | — | W | W | W |
| `POST /messages/send-email` | — | W | W | W |
| `POST /messages/send-whatsapp` | — | W | W | W |
| `GET /messages/log` | — | R | R | R |
| `GET /dashboard/summary` | — | R | R | R |
| `GET /dashboard/earnings` | — | R | R | R |
| `GET /admin/users` | — | R | — | — |
| `GET /admin/users/{id}` | — | R | — | — |
| `POST /admin/users` | — | W | — | — |
| `PUT /admin/users/{id}` | — | W | — | — |
| `DELETE /admin/users/{id}` | — | W | — | — |
| `GET /admin/stats` | — | R | — | — |

`P*` on `/auth/bootstrap` = public only while the users table is empty; otherwise 400.

**Observation: only 7 of 44 endpoints apply role-based restrictions** (`/auth/register` + the 6 admin routes). The other 36 authenticated endpoints are uniformly "any active user". The README's claim of differentiated astrologer vs. receptionist permissions is **not implemented**. See `GAP-SEC-01`.

---

## 4. Proposed React Page Tree

Paths follow React Router v6 conventions (`:id` not `{id}`). All authenticated routes are wrapped in `<RequireAuth />`. Admin-only routes additionally wrap in `<RequireRole allow={['admin']} />`. Client-side role hints (show/hide nav links) use `hasRole(...)`.

```
/                                    → redirect to /dashboard if authed, else /login
/login                               [public]
/403                                  [public]    Forbidden page
/404                                  [public]    Catch-all
/auth/bootstrap                      [public]    only visible when /auth/me 401 + bootstrap probe succeeds; see §7
└── <RequireAuth>
    /dashboard                       [any role]  Revenue dashboard (Step 4)
    /profile                         [any role]  View/edit own name + phone (PUT /auth/me)
    /customers                       [any role]  List + KPIs + search
    /customers/new                   [any role]  Form
    /customers/:id                   [any role]  Detail with tabs
    /customers/:id/edit              [any role]  Form
    /visits                          [any role]  List with filters
    /visits/new                      [any role]  Form (accepts ?customer_id=)
    /visits/:id                      [any role]  Detail
    /visits/:id/edit                 [any role]  Form
    /solutions                       [any role]  Grid + KPIs
    /solutions/new                   [any role]  Form
    /solutions/:id/edit              [any role]  Form
    /templates                       [any role]  Tabs: Email / WhatsApp
    /templates/new                   [any role]  Form
    /templates/:id/edit              [any role]  Form
    /messages/send                   [any role]  Send dialog route
    /messages/log                    [any role]  History with filters
    └── <RequireRole allow=['admin']>
        /admin/users                 [admin]     List with filters + stats card
        /admin/users/new             [admin]     Form
        /admin/users/:id             [admin]     Detail: edit + deactivate
```

### Page-map table (every non-system endpoint from §2 is consumed by at least one page)

| Page | Purpose | Guard | Endpoints consumed | Components/state | Empty state |
|---|---|---|---|---|---|
| `/login` | Email + password auth | none | `POST /auth/login` | `<LoginForm/>`, `useAuth().login` | n/a |
| `/dashboard` | Revenue + KPIs + charts (Step 4) | `requireAuth` | `GET /dashboard/summary`, `GET /dashboard/earnings`, `GET /visits?…` | `<KpiGrid/>`, `<EarningsChart/>`, `<PaymentStatusChart/>`, `<RecentVisitsPanel/>` | "No data for this range" |
| `/profile` | Edit self | `requireAuth` | `GET /auth/me`, `PUT /auth/me`, `POST /auth/refresh` | `<ProfileForm/>` | n/a |
| `/customers` | List + search + pagination | `requireAuth` | `GET /customers/?search=&skip=&limit=&is_active=` | `<CustomerTable/>`, `<CustomerKpiStrip/>` (derived) | "No customers yet — create one" |
| `/customers/new` | Create + optional photo/kundali upload | `requireAuth` | `POST /customers/`, `POST /customers/{id}/photo`, `POST /customers/{id}/kundali` | `<CustomerForm/>`, `<PhotoUploader/>`, `<KundaliUploader/>` | n/a |
| `/customers/:id` | Detail with tabs | `requireAuth` | `GET /customers/{id}`, `GET /customers/{id}/visits`, `GET /customers/{id}/solutions`, `GET /timeline/{customer_id}` | `<CustomerHeader/>`, `<Tabs:{Details,Timeline,Solutions}/>` | tab-level empty states |
| `/customers/:id/edit` | Update + re-upload files | `requireAuth` | `PUT /customers/{id}`, `POST /customers/{id}/photo`, `POST /customers/{id}/kundali`, `DELETE /customers/{id}` | `<CustomerForm/>` | n/a |
| `/visits` | List with filters | `requireAuth` | `GET /visits/?customer_id=&payment_status=&date_from=&date_to=` | `<VisitTable/>`, `<PaymentStatusBadge/>` | "No visits in range" |
| `/visits/new` | Create visit, link solutions | `requireAuth` | `POST /visits/`, `GET /solutions/?is_active=true`, `GET /customers/?search=` | `<VisitForm/>`, `<SolutionPicker/>`, `<CustomerPicker/>` | n/a |
| `/visits/:id` | Detail (+ solutions) | `requireAuth` | `GET /visits/{id}` | `<VisitDetail/>` | n/a |
| `/visits/:id/edit` | Update | `requireAuth` | `PUT /visits/{id}`, `DELETE /visits/{id}` | `<VisitForm/>` | n/a |
| `/solutions` | Grid + KPIs | `requireAuth` | `GET /solutions/?category=&is_active=` | `<SolutionGrid/>`, `<SolutionKpiStrip/>` (derived) | "No solutions in this category" |
| `/solutions/new` | Create | `requireAuth` | `POST /solutions/` | `<SolutionForm/>` | n/a |
| `/solutions/:id/edit` | Update / deactivate | `requireAuth` | `GET /solutions/{id}`, `PUT /solutions/{id}`, `DELETE /solutions/{id}` | `<SolutionForm/>` | n/a |
| `/templates` | List by channel | `requireAuth` | `GET /templates/?channel=&trigger_type=` | `<TemplateTabs:{Email,WhatsApp}/>`, `<TemplateTable/>` | "No templates — add one" |
| `/templates/new` | Create | `requireAuth` | `POST /templates/` | `<TemplateForm/>` | n/a |
| `/templates/:id/edit` | Update / soft-delete | `requireAuth` | `PUT /templates/{id}`, `DELETE /templates/{id}` | `<TemplateForm/>` | n/a |
| `/messages/send` | Compose & send | `requireAuth` | `POST /messages/send-email`, `POST /messages/send-whatsapp`, `GET /templates/?channel=`, `GET /customers/?search=` | `<SendMessageDialog/>`, `<PlaceholderPreview/>` | n/a |
| `/messages/log` | History + filter | `requireAuth` | `GET /messages/log?customer_id=&channel=` | `<MessageLogTable/>` | "No messages sent yet" |
| `/admin/users` | List + filters + stats | `requireAuth` + `requireRole(['admin'])` | `GET /admin/users?role=&is_active=`, `GET /admin/stats` | `<UserTable/>`, `<AdminStatsCard/>` | n/a |
| `/admin/users/new` | Create staff | admin | `POST /admin/users` | `<AdminUserForm/>` | n/a |
| `/admin/users/:id` | View + edit + deactivate | admin | `GET /admin/users/{id}`, `PUT /admin/users/{id}`, `DELETE /admin/users/{id}` | `<AdminUserForm/>`, `<UserRoleSelect/>` | n/a |

**System endpoints (no UI):** `GET /`, `GET /health/live`, `GET /health/db`, `POST /auth/refresh` (invoked silently by the axios interceptor), `POST /auth/bootstrap` (surface only as a one-time setup screen when `/auth/login` returns 401 on an empty DB — see §7).

**Orphan check:** every non-system endpoint from §2 appears in the `Endpoints consumed` column above at least once. `POST /auth/register` is intentionally not surfaced — superseded by `POST /admin/users`; see `GAP-API-01`.

---

## 5. Revenue / Dashboard Coverage

### Data sources actually available

Revenue in this schema is computed entirely from the `visit` table. The `customer_solution` / `solution` tables carry no monetary fields.

Relevant `Visit` fields ([models/visit.py](../backend/app/models/visit.py)):
- `fees: Decimal(10,2)` — monetary amount, default `0.00`.
- `payment_status: PaymentStatus` — `paid` | `pending` | `partial` | `waived`.
- `payment_method: PaymentMethod?` — `cash` | `upi` | `card` | `bank_transfer`.
- `visit_date: date` — bucket key for time series.
- `customer_id`, `visited_by` — slice dimensions.

Relevant `CustomerSolution` fields — no fee; only `given_date`, `status`, `visit_id` link back to the visit that carries the fee. This is important: **revenue cannot be attributed to an individual solution in the current schema.** See `GAP-DATA-01`.

### Revenue metrics supported by the existing endpoints

Three that can be computed today from `GET /dashboard/summary` + `GET /dashboard/earnings`:

1. **Collected Revenue (range)** = `SUM(visit.fees) WHERE payment_status = 'paid' AND visit_date BETWEEN from AND to`.
   - `/dashboard/summary` returns month-to-date only; `/dashboard/earnings` returns the same filter broken down by period but without a `paid`-only line — its `breakdown[].total_fees` is GROSS (all statuses). See `GAP-API-05`.
2. **Outstanding Revenue (range)** = `SUM(visit.fees) WHERE payment_status IN ('pending','partial') AND visit_date BETWEEN from AND to`.
   - `/dashboard/summary.pending_payments` provides this but **ignores the date range** — it is an all-time total. Needs an enhanced endpoint or client-side compute from `/visits`.
3. **Collection Rate (%)** = `Collected / (Collected + Outstanding) * 100`, excluding `waived`.
   - Fully derivable on the client from (1) and (2) once range-aware inputs exist.

Additional metrics required by the Step-4 dashboard that are **not** cleanly supported today:

4. **Average Fee / Visit (range)** = `SUM(fees) / COUNT(visits)` in range.
   - Derivable client-side from `/visits/?date_from=&date_to=`, but inefficient (full rows). Candidate for a new aggregation endpoint.
5. **Delta vs. previous equal-length window** for any of the above.
   - Requires two calls with different `from/to`; easy client-side; no backend change.
6. **Top revenue by solution category.**
   - Requires joining `Visit.fees` through `CustomerSolution.visit_id` → `Solution.category`. Since a visit may link multiple solutions, fees must be **split** across solutions. The current code does not do this. The realistic first cut is "visits whose primary/first-linked solution has category X" — an approximation — or a new endpoint that explicitly divides `visit.fees` by the count of linked solutions.
7. **Staff collection rate** (admin-only row in Step 4) = `SUM(paid fees WHERE visited_by=u) / SUM(all fees WHERE visited_by=u)` per user.
   - Derivable but no dedicated endpoint today.

### Recommendations for Step 3 / Step 4

- **Add `GET /dashboard/revenue` with `from` + `to` query params** returning `{collected, outstanding, waived, gross, visits, avg_fee, collection_rate}`. This consolidates metrics 1–4.
- **Enhance `/dashboard/summary`** to accept `from/to` and make `pending_payments` range-aware. Track in `GAP-API-05`.
- **Add `GET /dashboard/revenue-by-category?from=&to=`** returning `[{category, total_fees, visit_count}]`. Use allocation rule: `fees / max(1, count_of_linked_solutions)` per `CustomerSolution`. Document the rule in the endpoint's OpenAPI description.
- **Until those land**, the React dashboard (Step 4) can fall back to `/visits/?date_from=&date_to=` and compute all metrics client-side. Flag each fallback with `// TODO(step-3): replace with /dashboard/revenue`.

---

## 6. Gap List

Categories: `missing-ui` | `missing-endpoint` | `inconsistency` | `security` | `data-model` | `performance`.

**`missing-ui`: none found.** Every endpoint in §2 is either surfaced by a page in §4's page-map table or documented as a system endpoint (root, health, silent refresh, bootstrap). `POST /auth/register` is intentionally not surfaced — see `GAP-API-01` (deprecate in favor of `POST /admin/users`).

| ID | Category | Severity | File(s) | Summary | Recommendation |
|---|---|---|---|---|---|
| **GAP-SEC-01** | security | high | all routes except admin + `/auth/register` | `astrologer` and `receptionist` roles are **not enforced** on any customer/visit/solution/messaging/timeline/dashboard route. Every active authenticated user can do anything non-admin. | Step 3: introduce `require_role([...])` on every non-public route per the page map's intended matrix (e.g., receptionist = R-only on customers/visits, no template CRUD, no message send). Define the matrix explicitly in `docs/api-audit.md §3` as the source of truth and enforce there. |
| **GAP-SEC-02** | security | high | [startup.py:47-50](../backend/app/core/startup.py) | Migration failure is logged and swallowed — the app starts serving requests on a broken DB. | Step 3/6: re-raise on migration failure; let the container exit non-zero. Keeps humans honest. |
| **GAP-SEC-03** | security | med | [auth.py:90-107](../backend/app/api/routes/auth.py) | `POST /auth/bootstrap` tests `any user` rather than `any active admin`. If a non-admin user is ever created first (CLI/SQL), bootstrap is permanently closed and no admin can self-provision. Also leaks existence by returning 400 with a generic message. | Step 3: gate on `EXISTS(user WHERE role='admin' AND is_active=True)`; return 409 with neutral message; mark the endpoint for removal once any admin exists. |
| **GAP-SEC-04** | security | med | [health.py:15-32](../backend/app/api/health.py) | `/health/db` declares `Depends(get_session)` which itself raises before the try/except runs on DB failure — the endpoint returns 500 instead of the intended `{"status":"unhealthy"}`. | Step 3: build the session manually inside `try/except` or use the engine's `pool_ping`. |
| **GAP-SEC-05** | security | med | [messages.py:160-161, 213-214](../backend/app/api/routes/messages.py) | `send-email` / `send-whatsapp` persist the raw provider error in `MessageLog.error_message` and return it to the caller — leaks SMTP/Twilio config hints. | Step 3: log verbose error server-side; return a generic "send failed" to the client and store a sanitized error. |
| **GAP-SEC-06** | security | med | [main.py:22-28](../backend/app/main.py) | CORS set to `allow_origins=["*"]` with `allow_credentials=True`. Browsers reject this combination, but it's also an anti-pattern hiding real config. | Step 3: read allowed origins from env (default to the two frontend URLs); keep credentials only when origins are explicit. |
| **GAP-SEC-07** | security | med | [auth.py:26-35](../backend/app/api/routes/auth.py) | `POST /auth/login` has no rate limit. | Step 3: add a hook (slowapi or stub) — gate 5 attempts / 15 min / IP. |
| **GAP-CON-01** | inconsistency | med | [visits.py:128-131](../backend/app/api/routes/visits.py) | `DELETE /visits/{id}` **hard-deletes**, while customers / solutions / templates **soft-delete**. | Step 3: add `is_active` to `Visit`, switch to soft delete, migration. |
| **GAP-CON-02** | inconsistency | low | [auth.py:90-107](../backend/app/api/routes/auth.py) | `POST /auth/bootstrap` silently forces `role=admin` regardless of request payload's role. Swagger users will be confused. | Step 3: strip `role` from request schema for this endpoint; document "always creates admin". |
| **GAP-CON-03** | inconsistency | low | [config.py:29-37](../backend/app/core/config.py) | `bootstrap_admin_email`/`_password`/`_name` declared twice back-to-back. Harmless (second overrides first with identical values) but sloppy. | Step 3: delete the duplicate block. |
| **GAP-API-01** | inconsistency | low | [auth.py:45-65](../backend/app/api/routes/auth.py), [admin.py:52-72](../backend/app/api/routes/admin.py) | `POST /auth/register` and `POST /admin/users` are functionally identical (both admin-only, both create users). | Step 3: deprecate `/auth/register`, keep `/admin/users` as the canonical route. |
| **GAP-API-02** | inconsistency | high | [customers.py:38-59](../backend/app/api/routes/customers.py) | `GET /customers/` returns `list[CustomerRead]` but does not eager-load `visits` / `customer_solutions`, which are on the `CustomerRead` schema. Under async SQLAlchemy this raises `MissingGreenlet` at serialization time. Either the schema is too wide or the query is missing `selectinload`. | Step 3: introduce a slim `CustomerListItem` schema (already partially exists as `CustomerList`) and use it here; reserve `CustomerRead` for `GET /customers/{id}`. |
| **GAP-API-03** | missing-endpoint | low | [solutions.py:31-47](../backend/app/api/routes/solutions.py) | `GET /solutions/` has no text search param; README claims one. | Step 3: add `search?` param with ILIKE on `name` + `description`. |
| **GAP-API-04** | missing-endpoint | med | [timeline.py:17-78](../backend/app/api/routes/timeline.py) | No `response_model`; clients get untyped dicts; generated OpenAPI is useless here. | Step 3: define `TimelineEvent` (tagged-union) and annotate. |
| **GAP-API-05** | missing-endpoint | med | [dashboard.py](../backend/app/api/routes/dashboard.py) | `/dashboard/summary` is MTD-only; `pending_payments` is all-time; nothing accepts a `from`/`to` range. | Step 3/4: either add range params to `/dashboard/summary` or introduce `/dashboard/revenue?from=&to=` (preferred — see §5). |
| **GAP-API-06** | inconsistency | low | [admin.py:146-162](../backend/app/api/routes/admin.py) | `/admin/stats` returns untyped dict. | Step 3: add `AdminStats` schema. |
| **GAP-DATA-01** | data-model | med | models | No monetary field on `Solution` or `CustomerSolution`. Revenue-by-category requires an allocation rule. | Step 3/4: pick an allocation rule (equal split across linked solutions) and document it; or introduce an optional `price` on `Solution` as the basis. |
| **GAP-DATA-02** | data-model | low | [user.py:17](../backend/app/models/user.py) | ~~`email` has `unique=True` in SQLModel, but the init migration creates the column without an explicit `UniqueConstraint` / unique index.~~ **RESOLVED (Step 3)**: re-read of `backend/alembic/versions/71ad155155a5_init.py:56` confirms `op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)` is already present in the init migration. Gap was a false positive. | No action. |
| **GAP-PERF-01** | performance | low | [timeline.py:17-78](../backend/app/api/routes/timeline.py) | Pagination is in-memory after loading all visits/solutions/messages for the customer. Fine for tens of events; degrades at hundreds. | Step 3 (if ever needed): push `ORDER BY / LIMIT` into the DB via a UNION ALL. |
| **GAP-PERF-02** | performance | low | [dashboard.py:76-125](../backend/app/api/routes/dashboard.py) | `dashboard_earnings` loads all Visits in the range into Python and buckets there. At thousands of visits this becomes the slow path. | Step 3 (later): move the grouping into SQL with `date_trunc`. |

### Proposed new endpoints (listed, not implemented here)

| ID | Proposed | Justification | Step |
|---|---|---|---|
| NEW-01 | `GET /dashboard/revenue?from=&to=` → `{collected, outstanding, waived, gross, visits, avg_fee, collection_rate}` | Fixes `GAP-API-05`; eliminates per-metric client aggregation. | 3 or 4 |
| NEW-02 | `GET /dashboard/revenue-by-category?from=&to=` → `[{category, total_fees, visit_count}]` | Powers "Top categories" panel; uses allocation rule from `GAP-DATA-01`. | 4 |
| NEW-03 | `GET /dashboard/staff-collection?from=&to=` → `[{user_id, full_name, collected, outstanding, rate}]` | Admin-only row in Step-4 dashboard. | 4 |
| NEW-04 | `POST /auth/change-password` (self-service) | `PUT /auth/me` cannot change password today; admin-edit is the only path. | 3 or 5 |
| NEW-05 | `GET /customers/{id}/stats` | 4 KPI cards on customer detail (total visits, solutions given, total fees, messages sent) — today requires 4 round-trips. | 5 |

---

## 7. Open Questions

- **Role semantics — receptionist write scope.** Should a receptionist be able to create visits and send messages, or only read? The README mentions "Astrologer" and "Receptionist" as distinct but never spells out the write matrix. Step 3 blocks on this; proposing a default (Receptionist: R on customers/visits/solutions/templates/dashboard; W on `/messages/send-*`; R on `/messages/log`; no admin) unless the product owner overrides.
- **`POST /auth/bootstrap` lifetime.** Keep indefinitely gated on "no admin exists", or auto-remove after first admin is seeded via `startup.py`? Affects `GAP-SEC-03`.
- **Revenue-by-category allocation rule.** Equal split (`visit.fees / n_linked_solutions`) vs. first-solution-wins vs. per-solution `price` field? Blocks `GAP-DATA-01` and shapes `NEW-02`.
- **Hard vs. soft delete for Visits.** Fixing `GAP-CON-01` changes the `/visits/{id}` DELETE contract. Is any external system (audit log, reports) relying on hard-delete today?
- **Currency.** Revenue is rendered as `Decimal` with no currency code. Prompted a `VITE_CURRENCY=INR` default in Step 4, but the backend emits no currency field. Confirm all revenue is in a single currency for the foreseeable future.
- **Template placeholders.** Only `{{customer_name}}`, `{{customer_email}}`, `{{customer_phone}}` are rendered ([messages.py:102-110](../backend/app/api/routes/messages.py)). The README implies more (`{solution}`, `{date}`, etc.) — confirm whether any of those should be added before Step 5's template UI ships.
- **Timezone for dashboard date ranges.** Backend treats `visit_date` as a naive `date`. Should the React dashboard's "Last 30 days" be UTC-anchored, server-local, or browser-local? Affects edge-of-day rendering.

---

*End of audit.*
