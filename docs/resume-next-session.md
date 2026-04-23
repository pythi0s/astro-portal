# Resume notes — astro-cursor-test branch

This doc is the single entry point for picking up implementation work on the
`astro-cursor-test` branch. Read this first, then the referenced changelogs.

## Where we are (2026-04-23)

| Step | Status | Commit on `astro-cursor-test` | Details |
| ---- | ------ | ----------------------------- | ------- |
| 1 — Discovery & API audit | **Done** | earlier (`452fc01`) | [`docs/api-audit.md`](./api-audit.md) |
| 2 — React auth foundation | **Done** | earlier (`452fc01`) | [`frontend-react/README.md`](../frontend-react/README.md) §"Verification checklist (Step 2 exit criteria)" |
| 3 — Backend hardening | **Done, unpushed, not runtime-validated** | `05c07ac` | [`docs/step-03-changelog.md`](./step-03-changelog.md) |
| 4 — Revenue dashboard (React) | **Done, unpushed, not runtime-validated** | `8040991` | [`docs/step-04-changelog.md`](./step-04-changelog.md) |
| 5 — Feature pages (customers, visits, solutions, templates, messages, admin) | **Not started** | — | [`prompts/step-05-feature-pages.md`](../prompts/step-05-feature-pages.md) |
| 6 — Seamless setup (Docker, Alembic, bootstrap script, CI) | **Not started** | — | [`prompts/step-06-seamless-setup.md`](../prompts/step-06-seamless-setup.md) |

**Remote state:** Only the Step 1+2 commit (`452fc01`) has been pushed to
`origin/astro-cursor-test`. Steps 3 and 4 are committed locally only. Decide
whether to push before or after the Docker test machine has validated them.

## How much remains

Roughly 50–60% of the total scope is still ahead:

- **Step 5** is the largest remaining piece: ~6 CRUD areas × 3-4 pages each
  (list / detail / form / nested tabs) plus shared table / form / modal
  primitives, role-gated actions, and file-upload flows. Budget it as a full
  session on its own.
- **Step 6** is smaller but fiddly: `scripts/bootstrap.{sh,ps1}`, a Docker
  "doctor" check, a seed script, a root-level README refresh, and a CI
  workflow. Best done after Step 5 is at least bootable end-to-end so the
  bootstrap script actually lines up with reality.

## What to do first when you resume

1. **Run the pending validation on a machine with Docker + Node.** The
   authoring host had no Python/Node/Docker, so Steps 3 and 4 are unvalidated:
   ```bash
   git switch astro-cursor-test
   docker compose up -d --build db redis backend
   docker compose logs -f backend          # expect "Setup complete."
   docker compose exec backend alembic current   # should be a3b9c1d4e5f6
   curl http://localhost:8000/health/live
   curl http://localhost:8000/health/db
   # React:
   cd frontend-react && npm install && npm run typecheck && npm run build
   cd .. && docker compose --profile react up -d --build
   # → http://localhost:5174/dashboard  (log in, try presets, refresh)
   ```
   Capture any failures in `docs/step-03-changelog.md` / `docs/step-04-changelog.md`
   under a new "Validation fixes" section and patch before moving on.

2. **Decide on Step 5 scope.** The prompt at
   [`prompts/step-05-feature-pages.md`](../prompts/step-05-feature-pages.md) is
   ambitious. If the user's goal is parity with the Vue app, follow it;
   otherwise trim to "customers + visits + solutions" and defer
   templates/messages/admin to a later sub-step. Confirm with the user before
   starting.

3. **Only start Step 6 after Step 5 is at least in a runnable state.** The
   bootstrap script and CI workflow must reflect the real final file layout,
   not a guess at it.

## Known hazards to remember

- **Step 3 `DELETE /visits/{id}` changed from hard-delete to soft-delete.**
  Step 5's visits-list page should pass `include_inactive=true` only on an
  explicit "Show deactivated" toggle; everywhere else the default
  `is_active=true` filter is correct.
- **Step 3 `GET /customers/` returns a slim `CustomerList` shape.** The
  detail endpoint `GET /customers/{id}` still returns the full `CustomerRead`.
  Don't regress the list endpoint back to `CustomerRead` when adding new
  filters in Step 5 — it'll reintroduce the `MissingGreenlet` bug.
- **Login has a rate limit now** (5 attempts / 900 s). Any Step 5/6 test that
  hammers the login endpoint will need either `LOGIN_RATE_LIMIT_MAX_ATTEMPTS=0`
  in the test env, or a unique email per attempt.
- **CORS default is no longer `*`.** The Docker test machine will use
  `http://localhost:5173,http://localhost:5174` from `backend/.env.example`.
  If the user runs the React app on a different port, remind them to add it to
  `CORS_ORIGINS`.
- **`@tanstack/react-query`, `recharts`, `clsx`, plus Vitest/MSW/jsdom/RTL dev
  deps** are declared in `frontend-react/package.json` but not installed on
  the authoring host. First `npm install` on the Docker box is where types
  lock in — expect TS errors to surface only there.
- **Seed admin path:** on first boot, set `SEED_ADMIN_EMAIL` and
  `SEED_ADMIN_PASSWORD` in `backend/.env`, OR run
  `docker compose exec backend python -m app.cli create-admin --email ... --password ...`.
  `/auth/bootstrap` is closed once an active admin exists (returns 409).

## Paths to commit-message history

```bash
git log --oneline origin/intuitive-design..astro-cursor-test
```

should currently show:

```
8040991 Step 4: React revenue dashboard
05c07ac Step 3: backend hardening and new dashboard revenue endpoints
452fc01 Add frontend-react auth foundation, docs/api-audit, prompts, and docker-compose react profile
```

If that list diverges (extra commits, different order), something else
happened between sessions — reconcile before proceeding.
