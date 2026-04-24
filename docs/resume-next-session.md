# Resume notes — astro-cursor-test branch

This doc is the single entry point for picking up implementation work on the
`astro-cursor-test` branch. Read this first, then the referenced changelogs.

## Where we are (Step 5 complete, local)

| Step | Status | Details |
| ---- | ------ | ------- |
| 1 — Discovery & API audit | **Done** | [`docs/api-audit.md`](./api-audit.md) |
| 2 — React auth foundation | **Done** | [`frontend-react/README.md`](../frontend-react/README.md) §Auth flow |
| 3 — Backend hardening | **Done, not runtime-validated** | [`docs/step-03-changelog.md`](./step-03-changelog.md) |
| 4 — Revenue dashboard (React) | **Done, not runtime-validated** | [`docs/step-04-changelog.md`](./step-04-changelog.md) |
| 5 — Feature pages (React) | **Done, not runtime-validated** | [`docs/step-05-changelog.md`](./step-05-changelog.md) |
| 6 — Seamless setup (Docker, Alembic, bootstrap script, CI) | **Not started** | [`prompts/step-06-seamless-setup.md`](../prompts/step-06-seamless-setup.md) |

Step 5 lands the complete feature surface in React: customers, visits,
solutions, templates, messaging, admin user management, and a self-service
profile page. The existing Vue app is **untouched**.

**Remote state:** check `git status` and `git log origin/astro-cursor-test..HEAD`
before starting. The intent is to push Step 5 immediately after commit, but if
you are continuing mid-session confirm which commits are already on the remote.

## What to do first when you resume

1. **Validate everything on a machine with Docker + Node.** The authoring host
   lacked Python/Node/Docker, so Steps 3, 4, and 5 are unvalidated on real
   infrastructure:

   ```bash
   git switch astro-cursor-test
   git pull
   docker compose up -d --build db redis backend
   docker compose logs -f backend          # expect "Setup complete."
   docker compose exec backend alembic current   # should be a3b9c1d4e5f6
   curl http://localhost:8000/health/live
   curl http://localhost:8000/health/db

   cd frontend-react
   npm install
   npm run typecheck
   npm run test            # schema tests for every domain
   npm run build
   cd ..

   docker compose --profile react up -d --build frontend-react
   # → http://localhost:5174
   ```

   Then walk the Step 5 manual checklist in
   [`docs/step-05-changelog.md`](./step-05-changelog.md) §"Verification
   checklist" (15 items, covers all 7 domains + role gating + code-splitting).

   Capture any failures under a new "Validation fixes" section of the relevant
   changelog and patch before moving on.

2. **Move on to Step 6 once Step 5 is green.** Step 6 (bootstrap script, CI,
   seamless Docker setup) depends on the real final file layout, so it has to
   come after Step 5 boots cleanly.

## How much remains

- **Step 6** is smaller but fiddly: `scripts/bootstrap.{sh,ps1}`, a Docker
  "doctor" check, a seed script, a root-level README refresh, and a CI
  workflow. Budget half a session.
- **Interaction tests** (MSW + RTL) for the feature pages are deferred from
  Step 5; scaffolding is already declared in `devDependencies`. Worth adding
  during Step 6 while hardening CI.

## Known hazards to remember

- **Step 3 `DELETE /visits/{id}` is soft-delete.** Step 5's visits list
  defaults to `is_active=true` and only passes `include_inactive=true` behind
  the "Include inactive" toggle — do not regress this.
- **Step 3 `GET /customers/` returns a slim `CustomerList` shape**; detail
  still returns the full `CustomerRead`. Don't swap the list endpoint back to
  `CustomerRead` — it reintroduces the `MissingGreenlet` bug.
- **`GET /templates/` only returns active templates.** The `TemplateEditPage`
  loads from the list and finds by id; inactive templates are unreachable by
  design until the backend exposes a detail endpoint.
- **Login rate limit** is 5 / 900 s. Any Step 6 CI test that hammers
  `/auth/login` needs `LOGIN_RATE_LIMIT_MAX_ATTEMPTS=0` in the test env or a
  unique email per attempt.
- **CORS default is no longer `*`.** The Docker test machine uses
  `http://localhost:5173,http://localhost:5174` from `backend/.env.example`.
  If the React dev server runs on a different port, add it to `CORS_ORIGINS`.
- **Seed admin path:** on first boot, set `SEED_ADMIN_EMAIL` +
  `SEED_ADMIN_PASSWORD` in `backend/.env`, OR run
  `docker compose exec backend python -m app.cli create-admin --email ... --password ...`.
  `/auth/bootstrap` is closed once an active admin exists (returns 409).
- **New runtime deps added in Step 5:** `react-hook-form`, `zod`,
  `@hookform/resolvers`, `@tanstack/react-table`. First `npm install` on the
  Docker box is where TypeScript types lock in — expect lingering TS issues
  to surface only there, not on the authoring host.

## Paths to commit-message history

```bash
git log --oneline origin/intuitive-design..astro-cursor-test
```

should end with a Step 5 commit on top of:

```
(step 5)  Step 5: React feature pages (customers, visits, solutions, templates, messages, admin, profile)
2718679   docs: add resume-next-session handoff notes
8040991   Step 4: React revenue dashboard
05c07ac   Step 3: backend hardening and new dashboard revenue endpoints
452fc01   Add frontend-react auth foundation, docs/api-audit, prompts, and docker-compose react profile
```

If the list diverges (extra commits, different order, hash changes on earlier
commits), something unexpected happened — reconcile before proceeding.
