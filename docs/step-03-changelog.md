# Step 3 Changelog — Backend Review, Hardening & Gap Remediation

## Summary

Backend hardening pass that remediates the security, schema, and consistency gaps identified in `docs/api-audit.md` §6, adds the revenue endpoints required by Step 4, and stabilizes startup. All existing endpoints keep their paths, HTTP methods, status codes, and success-response shapes. Two public contracts are **additive** (`POST /auth/change-password`, `GET /dashboard/revenue`, `GET /dashboard/revenue-by-category`) and one (`DELETE /visits/{id}`) changes its semantics from hard-delete to soft-delete — see Breaking changes.

## Gaps addressed (from `docs/api-audit.md` §6)

| Gap | Action | Files | Migration |
| --- | --- | --- | --- |
| GAP-SEC-02 | Migration failures now re-raise instead of being swallowed; the container exits non-zero on a broken schema. | `backend/app/core/startup.py` | — |
| GAP-SEC-03 | `POST /auth/bootstrap` now gates on "any active admin exists" (returns 409) and strips `role` from the request body (always forces `admin`). | `backend/app/api/routes/auth.py`, `backend/app/schemas/auth.py` | — |
| GAP-SEC-04 | `/health/db` no longer depends on `get_session` — it opens a connection inside the `try/except` so a DB outage returns `{"status":"unhealthy"}` instead of 500. | `backend/app/api/health.py` | — |
| GAP-SEC-05 | `POST /messages/send-email` and `POST /messages/send-whatsapp` now log verbose provider errors server-side and return/persist a generic `"Send failed — see server logs for details."` string to the caller. | `backend/app/api/routes/messages.py` | — |
| GAP-SEC-06 | CORS is env-driven via `CORS_ORIGINS` (comma-separated) with a safe default of `http://localhost:5173,http://localhost:5174`. Wildcard is no longer the default. | `backend/app/core/config.py`, `backend/app/main.py` | — |
| GAP-SEC-07 | Added an in-memory per-IP sliding-window rate limiter for `POST /auth/login` (defaults: 5 attempts / 900 s → 429). Pluggable for a Redis-backed implementation later. | `backend/app/core/security.py`, `backend/app/api/routes/auth.py` | — |
| GAP-CON-01 | `DELETE /visits/{id}` is now a soft-delete (`is_active=False`) aligned with customers/solutions/templates. `GET /visits/` hides soft-deleted rows unless `?include_inactive=true`. | `backend/app/models/visit.py`, `backend/app/api/routes/visits.py` | `a3b9c1d4e5f6_step3_visit_is_active` |
| GAP-CON-02 | `/auth/bootstrap` request body uses a dedicated `BootstrapRequest` schema that omits `role` (always forced to admin server-side). | `backend/app/schemas/auth.py`, `backend/app/api/routes/auth.py` | — |
| GAP-CON-03 | Removed the duplicate `bootstrap_admin_*` declaration in `Settings`; legacy env vars still work via aliases. | `backend/app/core/config.py` | — |
| GAP-API-01 | `POST /auth/register` marked `deprecated=True` in OpenAPI; identical behaviour kept for the existing Vue frontend. Prefer `POST /admin/users`. | `backend/app/api/routes/auth.py` | — |
| GAP-API-02 | `GET /customers/` now returns `list[CustomerList]` (the slim schema that was already defined) instead of `list[CustomerRead]`, eliminating the `MissingGreenlet` serialization bug. Detail endpoint still returns full `CustomerRead`. | `backend/app/api/routes/customers.py` | — |
| GAP-API-03 | `GET /solutions/` now supports `?search=` (ILIKE over `name` + `description`). | `backend/app/api/routes/solutions.py` | — |
| GAP-API-04 | `GET /timeline/{customer_id}` has a typed `list[TimelineEvent]` response model (tagged union over `visit` / `solution` / `message` events). Response shape is unchanged. | `backend/app/schemas/timeline.py`, `backend/app/api/routes/timeline.py` | — |
| GAP-API-05 | New `GET /dashboard/revenue?from=&to=` returns a range-aware `RevenueSummary` (collected / outstanding / waived / gross / visit_count / avg_fee / collection_rate). Defaults to the last 30 days when no range is provided. | `backend/app/schemas/dashboard.py`, `backend/app/api/routes/dashboard.py` | — |
| GAP-API-06 | `/admin/stats` is now typed via `AdminStats`. | `backend/app/schemas/auth.py`, `backend/app/api/routes/admin.py` | — |
| GAP-DATA-01 | New `GET /dashboard/revenue-by-category?from=&to=` allocates `visit.fees` equally across linked solutions (visits with no linked solution go to a `__unassigned__` bucket so totals always reconcile). Allocation rule documented in the schema docstring. | `backend/app/schemas/dashboard.py`, `backend/app/api/routes/dashboard.py` | — |
| GAP-DATA-02 | **Already satisfied**: the init migration `71ad155155a5_init.py:56` already creates `ix_user_email` as unique. No new migration required. Audit updated accordingly. | — | — |

## Security changes

- **Login rate limit** — per-IP sliding window (`security.py::LoginRateLimiter`). Fail-closed on the IP extraction path: if `X-Forwarded-For` is absent and there is no socket peer, the key falls back to `"unknown"`, which still participates in the window. Risk: **low** (single-process, no horizontal-scale guarantee; documented).
- **Generic auth failures** — login failures return `"Invalid credentials"` whether the email is unknown, the password is wrong, or the user is inactive. Removes a username-enumeration signal. Risk: **low**.
- **Bootstrap neutrality** — 409 response no longer reveals whether an admin exists or their email. Risk: **low**.
- **Provider error sanitization** — messaging endpoints no longer echo SMTP/Twilio exception text to clients. Risk: **low**, improves defense-in-depth.
- **CORS** — explicit origin allow-list, wildcard gone from the default. Risk: **low**.

## Schema & migration changes

- `backend/alembic/versions/a3b9c1d4e5f6_step3_visit_is_active.py` — adds `visit.is_active BOOL NOT NULL` with a temporary `server_default=true` for backfill, then clears the server default. Downgrade drops the column. Not yet validated on a running DB (no Python/Docker runtime available on the authoring host); flagged for verification on the Docker test machine.
- Schema tightening:
  - `AdminStats` (new typed response)
  - `ChangePasswordRequest`, `BootstrapRequest` (new typed requests)
  - `TimelineEvent` tagged-union in `schemas/timeline.py` (new)
  - `RevenueSummary`, `CategoryRevenueRow`, `RevenueByCategory` in `schemas/dashboard.py` (new)

## Startup & seed changes

- `startup.run_auto_setup` now re-raises on migration failure. Lifespan will abort and the process exits non-zero — orchestrators (Docker restart policy, k8s CrashLoopBackOff) surface the failure.
- Admin seed is idempotent and only runs when no active admin exists. Reads `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME`, with legacy `BOOTSTRAP_ADMIN_*` kept as fallback aliases. Promotes an existing user at the seed email to admin if needed instead of failing with a unique-constraint error.
- `backend/app/cli.py` provides `python -m app.cli create-admin --email ... --password ... [--name ...] [--force-password]`. Idempotent by default; exits non-zero if the email exists with a different password and `--force-password` was not supplied.

## Breaking changes

- `DELETE /visits/{id}` — response body is unchanged (`{"detail": "Visit deactivated"}` instead of `"Visit deleted"`), but the **semantics** change from hard-delete to soft-delete. Consumers that relied on the row actually disappearing must either (a) tolerate the ghost row, or (b) pass `include_inactive=false` (the new default) on `GET /visits/` queries. The Vue frontend is a pure-CRUD caller and does not inspect absence vs. presence post-delete, so no client change is required.
- `POST /auth/bootstrap` — request schema is now `BootstrapRequest` (no `role` field). Any client that previously sent a `role` value will have that field silently ignored by FastAPI (no 422). No existing client relies on this field.
- `POST /auth/login` — now returns **429 Too Many Requests** after the configured number of failed attempts within the window. Consumers should handle this alongside the existing 401. Set `LOGIN_RATE_LIMIT_MAX_ATTEMPTS=0` in `.env` to disable (backward-compatible escape hatch).
- `POST /auth/change-password` — new endpoint; not breaking.
- `GET /dashboard/revenue`, `GET /dashboard/revenue-by-category` — new endpoints; not breaking.
- CORS — if any deployment currently relies on wildcard origin acceptance, they must now set `CORS_ORIGINS` explicitly.

## Deferred to later steps

| Gap | Why deferred | Target step |
| --- | --- | --- |
| GAP-PERF-01 (timeline in-memory pagination) | Current volumes are tens of events per customer; SQL-side UNION pays off only at hundreds. | Later, only if needed. |
| GAP-PERF-02 (`/dashboard/earnings` Python bucketing) | Same reasoning; also the new `/dashboard/revenue` path will carry most dashboard traffic going forward. | Later. |
| Full pytest suite (role-matrix × bootstrap × rate-limit × startup-idempotency) | The authoring host has no Python/Docker runtime — tests cannot be validated locally. Test scaffolding is in `pyproject.toml` already. | Step 6 (seamless setup will validate). |
| `require_role` tightening for astrologer vs. receptionist | Audit §7 open question — requires product decision on receptionist write scope. | Step 5 when UI surfaces the boundaries. |
| NEW-03 `/dashboard/staff-collection`, NEW-05 `/customers/{id}/stats` | Not needed to ship Step 4 (revenue dashboard) or Step 5 (feature pages). | Later if UI demands them. |

## Verification commands to run on the Docker test machine

These were **not** run on the authoring host (no Python/Docker available). Run them on a machine with Docker Desktop to validate:

```bash
cd astro-portal
docker compose up -d --build db redis backend
docker compose logs -f backend   # expect "Setup complete." and no migration errors
curl -s http://localhost:8000/health/live        # {"status":"alive"}
curl -s http://localhost:8000/health/db          # {"status":"healthy", ...}
docker compose exec backend alembic current      # a3b9c1d4e5f6 (head)
docker compose exec backend alembic downgrade -1 && docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.cli create-admin --email test@example.com --password "ChangeMe123!"
# Existing Vue frontend should keep logging in at :5173 against the backend.
# New React frontend at :5174 (from Step 2) should also log in.
```

## File index

**New**
- `backend/alembic/versions/a3b9c1d4e5f6_step3_visit_is_active.py`
- `backend/app/cli.py`
- `backend/app/schemas/timeline.py`
- `docs/step-03-changelog.md` (this file)

**Modified**
- `backend/app/api/health.py`
- `backend/app/api/routes/admin.py`
- `backend/app/api/routes/auth.py`
- `backend/app/api/routes/customers.py`
- `backend/app/api/routes/dashboard.py`
- `backend/app/api/routes/messages.py`
- `backend/app/api/routes/solutions.py`
- `backend/app/api/routes/timeline.py`
- `backend/app/api/routes/visits.py`
- `backend/app/core/config.py`
- `backend/app/core/security.py`
- `backend/app/core/startup.py`
- `backend/app/main.py`
- `backend/app/models/visit.py`
- `backend/app/schemas/auth.py`
- `backend/app/schemas/dashboard.py`
- `docs/api-audit.md` — reconciliation note + GAP-DATA-02 status updated

## Risk assessment

Overall: **medium**. No tests executed on the authoring host; assumptions about Alembic migration correctness, SQLAlchemy query semantics for the new revenue endpoints, and the rate-limiter's behaviour under concurrent load rely on careful reading rather than observation. The changes are additive-heavy (new endpoints, new schemas, new migration) with only one behavioural change in an existing endpoint (`DELETE /visits/{id}` hard→soft). Rolling back is a single revert of this commit plus `alembic downgrade -1`.
