# Step 3 — Backend Review, Hardening & Gap Remediation

> **Target branch:** `intuitive-design` (commit `d17675511…` or later). Verify the working tree is on this branch and clean before starting. No submodules exist; do NOT run `git submodule update`.
> **Prerequisites:** Steps 1 and 2 must be complete. You MUST read `astro-portal/docs/api-audit.md` first and treat its §3 role matrix, §6 gap list, and §7 open questions as the authoritative backlog for this step. If that file is missing, STOP and report — do not guess.

## Role
You are a senior backend engineer and API security reviewer. You specialize in FastAPI, SQLAlchemy 2.0 async, Pydantic v2, JWT-based RBAC, and Alembic migrations. You ship small, reversible changes with migrations, tests, and clear release notes. You do NOT add new features in this step — you harden what exists.

## Task / Objective
Remediate the gaps identified by Step 1, enforce role-based access consistently across all routes, tighten request/response schemas, and stabilize application startup so the stack comes up clean on a fresh machine. All changes must be backward-compatible for the existing Vue frontend (`:5173`) and the new React app (`:5174`) — no breaking API path or response-shape changes unless explicitly justified and version-gated.

Concretely, deliver:

1. **Role enforcement audit & fix** — every endpoint in `docs/api-audit.md` §3 matches the actual `Depends(...)` chain in code. Any mismatch is fixed (in code, not in the doc).
2. **Schema tightening** — Pydantic v2 request/response schemas for every route, no bare `dict` / `Any` returns, explicit `response_model` on every operation that returns data.
3. **Security fixes** — at minimum: unique index on `user.email`, bcrypt cost sanity check, JWT `sub` = user id (not email), constant-time comparisons, rate-limit hook on `/auth/login` (stub or real), and removal of any info-leak error strings on auth failure.
4. **Startup idempotency** — `backend/app/core/startup.py` runs cleanly N times in a row on an empty DB, a partially-migrated DB, and a fully-migrated DB. No `DuplicateTable`, no silent swallowed exceptions.
5. **Migrations consistency** — every model change since the last Alembic head has a migration; `alembic upgrade head` is a no-op on a fresh run after startup; `alembic downgrade -1` runs without error for every migration touched in this step.
6. **First-admin seed** — a documented, idempotent way to create the initial admin user without relying on the public `/auth/bootstrap` endpoint being exposed. Recommend disabling `/auth/bootstrap` once an admin exists.
7. **CORS + trust-boundaries** — CORS origins read from env, default to the two frontend URLs, no wildcard in non-dev. Security headers reviewed.
8. **Release notes** — `docs/step-03-changelog.md` listing every change with rationale, migration IDs, and risk assessment.

## Context
- Primary source files to review and edit:
  - Routes: `astro-portal/backend/app/api/routes/{auth,customers,visits,solutions,messages,timeline,dashboard,admin}.py`, `astro-portal/backend/app/api/health.py`.
  - Security: `astro-portal/backend/app/core/security.py`, `astro-portal/backend/app/core/config.py`.
  - Startup: `astro-portal/backend/app/core/startup.py`, `astro-portal/backend/app/main.py`.
  - Models: `astro-portal/backend/app/models/*.py`.
  - Schemas: `astro-portal/backend/app/schemas/*.py`.
  - DB session: `astro-portal/backend/app/db/database.py`.
  - Alembic: `astro-portal/backend/alembic.ini`, `astro-portal/backend/alembic/env.py`, `astro-portal/backend/alembic/versions/`.
- Authoritative inputs:
  - `astro-portal/docs/api-audit.md` (Step 1 output) — endpoint catalog, role matrix, gap list, open questions.
  - `astro-portal/frontend-react/` (Step 2 output) — must continue to authenticate and operate after your changes.
- Role values (from `UserRole` enum): `admin`, `astrologer`, `receptionist`. Enforce server-side on every non-public endpoint.
- Public endpoints that MUST remain public: `POST /auth/login`, `GET /health`. `POST /auth/bootstrap` is public only until an admin exists — gate it.
- Environment variables are loaded via Pydantic settings in `core/config.py`. Prefer adding new settings there with sensible defaults over hardcoding.
- Existing Alembic migrations live in `backend/alembic/versions/`. Do not edit historical migrations; always add new ones.

## Example (shape, not exact code)

A role-enforcement fix commit typically touches three places together. The route:

```python
@router.delete("/customers/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: UUID,
    current_user: Annotated[User, Depends(require_roles("admin"))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    ...
```

The dependency in `core/security.py`:

```python
def require_roles(*roles: str) -> Callable[..., Awaitable[User]]:
    async def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user
    return _dep
```

The corresponding row in the audit doc (updated in §3) should now show `admin=W`, `astrologer=—`, `receptionist=—`. If the code and doc disagree, the CODE is authoritative and the doc row gets updated.

A migration for the `user.email` unique index should be additive and reversible:

```python
def upgrade() -> None:
    op.create_index("ix_user_email_unique", "user", ["email"], unique=True)

def downgrade() -> None:
    op.drop_index("ix_user_email_unique", table_name="user")
```

## Constraints
1. **Backward compatibility first.** No change to endpoint paths, HTTP methods, status codes, or the shape of existing success responses without an explicit entry in `docs/step-03-changelog.md` under "Breaking changes" with a justification. Prefer adding optional fields over renaming existing ones.
2. **Server-authoritative authorization.** All role checks happen via `Depends(...)` on the route. Never trust a role claim from request body or query params. The JWT `sub` claim must be the user id (UUID or int, whichever the model uses); email goes in a separate claim if needed.
3. **Every new or modified route has an explicit `response_model`.** Replace `dict` / `Any` / untyped returns with Pydantic v2 models. Use `response_model_exclude_none=True` only when justified.
4. **Migrations are additive and reversible.** Every `upgrade` has a working `downgrade`. Do not squash history. Auto-generated migrations must be reviewed and edited for correctness; do not commit `# ### commands auto generated ###` blocks without human review.
5. **Startup must be idempotent.** `startup.py` is safe to call on (a) empty DB, (b) partial schema, (c) fully migrated DB. Prefer running `alembic upgrade head` programmatically on startup over ad-hoc `create_all`. Seed logic (e.g., ensuring a default role enum row) must use `INSERT ... ON CONFLICT DO NOTHING` or the SQLAlchemy equivalent.
6. **First-admin seed** is delivered as BOTH: (a) a CLI command `uv run python -m app.cli create-admin --email ... --password ...` (or similar, justify the name in the changelog), and (b) an optional env-var-driven one-shot seed in `startup.py` gated by `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` that runs only when no admin exists.
7. **`/auth/bootstrap` is disabled when any active admin user exists.** Return 409 with a neutral message. Do not leak whether admins exist via timing.
8. **No new business logic.** If you find a missing-endpoint gap from §6 of the audit, list it in the changelog under "Deferred to Step 4+"; do not implement it here.
9. **Dependencies.** No new runtime dependencies unless strictly required for a security fix; justify any addition in the changelog. Prefer stdlib and already-present packages.
10. **Testing.** Add pytest tests for: (a) role guard matrix (parametrized: every non-public endpoint × every role → expected status), (b) `/auth/bootstrap` gating before and after an admin exists, (c) login rate-limit or rejection after N bad attempts (stub acceptable, but the hook must exist and be tested), (d) startup idempotency (run startup function twice in a test and assert no exception / no duplicate rows).
11. **No emojis.** Neutral, professional tone in code comments, commit messages, and changelog.
12. **Do not modify** `astro-portal/frontend/` (Vue) or `astro-portal/frontend-react/` in this step, except to bump a single `BACKEND_API_VERSION` constant if you introduce one — and only if absolutely required.

## Output Format
Produce/modify files under `astro-portal/` as follows:

**New files:**
- `backend/alembic/versions/<timestamp>_step3_*.py` — one or more new migrations (unique index on `user.email`, any schema tightening).
- `backend/app/cli.py` (or extend existing) — `create-admin` command.
- `backend/tests/test_role_matrix.py` — parametrized role-guard tests.
- `backend/tests/test_auth_bootstrap.py` — bootstrap gating tests.
- `backend/tests/test_startup_idempotency.py` — startup runs twice cleanly.
- `backend/tests/conftest.py` — async test client + ephemeral DB fixture (if not already present).
- `docs/step-03-changelog.md` — see structure below.

**Modified files (only where necessary):**
- `backend/app/core/security.py`, `backend/app/core/startup.py`, `backend/app/core/config.py`, `backend/app/main.py`.
- `backend/app/api/routes/*.py` — add/correct `Depends(require_roles(...))` and `response_model`.
- `backend/app/schemas/*.py` — tighten request/response models.
- `backend/app/models/user.py` — add `email` unique index annotation.
- `backend/pyproject.toml` / `backend/uv.lock` — only if a dependency is added.
- `docs/api-audit.md` — update §3 role matrix rows where the CODE was corrected to now reflect reality. Add a "Step 3 reconciliation" note at the top of §3.

**`docs/step-03-changelog.md` structure (required):**

```
# Step 3 Changelog

## Summary
(1–3 sentences)

## Gaps addressed (from docs/api-audit.md §6)
- GAP-001 — <what was done> — <files> — <migration id if any>
- GAP-00N — ...

## Security changes
- <change> — <rationale> — <risk: low|med|high>

## Schema & migration changes
- <migration id> — <tables/columns> — forward + downgrade verified on local DB

## Startup & seed changes
- ...

## Breaking changes
- none
  (or: <endpoint> — <old> → <new> — <migration path for clients>)

## Deferred to later steps
- <gap id> — <why deferred> — <target step>

## Verification commands run
- `docker compose up --build` → clean
- `./scripts/db.sh auto-migrate` → no diff
- `uv run pytest backend/tests/` → N passed, 0 failed
```

Final chat summary (≤ 20 lines) must include: (a) links to every created/modified file, (b) the migration IDs, (c) the exact commands used to verify, (d) a short list of gaps deferred to Step 4+.

## Validation Criteria
Accepted only if ALL of these hold:

- [ ] `docker compose up --build` on a fresh clone of `intuitive-design` comes up with backend `healthy` (via `/health`) within 60 seconds, no error logs other than expected dev warnings.
- [ ] `./scripts/db.sh auto-migrate` after startup shows "No changes detected" — i.e., models and migrations are in sync.
- [ ] `./scripts/db.sh current` matches the latest migration head after fresh-clone startup (startup auto-applied migrations).
- [ ] `alembic downgrade -1` then `alembic upgrade head` succeeds for every migration added in this step.
- [ ] `uv run pytest backend/tests/` — all tests pass, including the new role-matrix, bootstrap-gating, and startup-idempotency tests.
- [ ] The role-matrix test covers EVERY non-public endpoint enumerated in `docs/api-audit.md` §2. No endpoint is silently skipped.
- [ ] `POST /auth/bootstrap` returns 200 on empty DB, then 409 after an admin exists. Response body does not leak the existing admin's email.
- [ ] `uv run python -m app.cli create-admin --email x@y.z --password <pw>` creates an active admin; running it again with the same email updates nothing and exits non-zero with a clear message (or is idempotent — justify the choice in the changelog).
- [ ] Startup is idempotent: starting the backend container twice in a row on an existing DB produces no new rows in any seed table and no exceptions.
- [ ] `user.email` has a unique index at the DB level (verify via `./scripts/db.sh describe user`).
- [ ] `docs/api-audit.md` §3 role matrix has been updated to reflect any CODE corrections made in this step, with a reconciliation note.
- [ ] `docs/step-03-changelog.md` exists and matches the required structure; every item links to a file or migration id.
- [ ] Existing Vue frontend (`:5173`) and React frontend (`:5174`) both still log in and load `/auth/me` successfully after these changes — no client-side code changes required.
- [ ] `git diff --stat origin/intuitive-design...HEAD` shows changes ONLY under `backend/`, `docs/`, and (if strictly needed) a one-line constant in a single frontend file; every other frontend path is untouched.
- [ ] No new runtime dependencies were added, OR every added dependency is listed in the changelog with a security rationale.
- [ ] No endpoint has its path, method, or success-response shape changed without a matching "Breaking changes" entry in the changelog.
