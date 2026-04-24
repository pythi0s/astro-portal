# Step 5 changelog — Feature pages (React)

Step 5 builds the full working React UI on top of the Step 2 auth foundation
and the Step 3 backend surface. Every backend domain now has a code-split,
URL-driven, role-aware frontend page set. The existing Vue app is untouched.

Scope completed: **customers, visits, solutions, templates, messages, admin
user management, profile + change password**, plus the shared primitives that
power them.

## What shipped

### Shared primitives (`src/lib/`, `src/components/`, `src/hooks/`)

- `lib/format.ts` — promoted from `features/dashboard/lib/format.ts`. Adds
  `formatDateTime`, `humanizeEnum`. Every money render in every feature goes
  through `formatMoney` so `VITE_CURRENCY` flips the whole UI.
- `lib/urlState.ts` — `useUrlState<T>` plus `ListParams` defaults. All list
  pages store filters/search/page/sort in the query string.
- `lib/apiErrors.ts` — `applyServerErrors` maps FastAPI 422 onto
  `react-hook-form` fields; `errorMessage` extracts a string for toasts.
- `api/upload.ts` — typed `multipart/form-data` helper (`uploadFile`,
  `makeObjectUrl`). Single place for boundary + progress handling.
- `components/Toast.tsx` + `components/ConfirmProvider.tsx` — global toast
  region (live region, role=alert for errors) and a dialog-based `confirm()`
  used by every destructive action.
- `hooks/useServerErrorToast.ts` — response interceptor, mounted once in
  `AppShell`, that turns 403/5xx into toasts. `401` stays owned by the silent
  refresh interceptor.
- `components/PageHeader`, `Breadcrumbs`, `EmptyState`, `Skeleton`, `Tabs`
  (URL-backed via `?tab=`), `RoleGate` (DOM-level role gating), `Button` +
  `LinkButton`, `SearchInput` (debounced 300 ms, Escape-clears).
- `components/FormField.tsx` — `TextField`, `TextArea`, `SelectField`,
  `FormRootError`. Accessible labelling, `aria-invalid`, `aria-describedby`
  for both hint and error.
- `components/DataTable.tsx` — headless `@tanstack/react-table` wrapper with
  skeleton rows while loading, `EmptyState` inside the table for zero rows,
  keyboard-navigable rows, and a matching `Pagination` component that drives
  `page` / `pageSize` back into the URL.

### Domains

Each domain under `src/features/<name>/` follows the same shape:
`types.ts`, `queryKeys.ts`, `schema.ts`, `api.ts`, `hooks/use*.ts`,
`components/…`, `pages/…`, `__tests__/schema.test.ts`.

- **customers** — `/customers`, `/customers/new`, `/customers/:id` (Details /
  Timeline / Solutions / Visits tabs), `/customers/:id/edit` with photo +
  kundali upload. Optimistic-update-with-rollback on edit.
- **visits** — `/visits` (5-column filter bar), `/visits/new` (accepts
  `?customer_id=…` and locks the picker), `/visits/:id`, `/visits/:id/edit`.
  `CustomerPicker` (debounced typeahead) and `SolutionPicker` (category-grouped
  chips) are reused by the messages feature.
- **solutions** — card grid list with search + category + status filters,
  `SolutionForm` for create/edit, deactivate requires confirm.
- **templates** — Email / WhatsApp tabs via `?channel=…`. Editor shows a live
  `PlaceholderPreview` that mirrors the backend's `_render_placeholders`.
- **messages** — `/messages/send` with Email / WhatsApp tabs (pre-fills
  `?customer_id=…`), and `/messages/log` paginated. Sends that return
  `status=failed` surface the sanitised Step 3 error message as a toast.
- **admin** — `/admin/users` list with KPI strip (`AdminStatsCard`),
  `/admin/users/new`, `/admin/users/:id` edit. Hidden entirely from non-admins
  via `RoleGate`; server still enforces via Step 3's `require_role`. You
  cannot deactivate yourself or toggle your own role (UI hint).
- **profile** — `/profile` (any role): edit name + phone, and a change
  password form with confirm + must-differ validation. Hits `/auth/me` +
  `/auth/change-password` (Step 3 endpoint).

### Routing + navigation

- `src/router.tsx` — every feature page is wrapped in `React.lazy` so the
  initial bundle stays small. The `admin-demo` route and `CustomerDetailStub`
  placeholder are removed (real pages exist now).
- `src/components/TopBar.tsx` — adds Customers, Visits, Solutions, Messages,
  Templates tabs; Admin tab is rendered inside `<RoleGate allow={['admin']}>`
  so it is absent from the DOM for non-admins. The user badge now links to
  `/profile`.
- `src/pages/Home.tsx` — retargeted to point at the real feature pages rather
  than the deleted `/admin-demo` route.

### Tests

Each domain has a Vitest unit test covering its Zod schema and
payload-transformation helpers. These do not require a running backend.

```
frontend-react/src/features/customers/__tests__/schema.test.ts
frontend-react/src/features/visits/__tests__/schema.test.ts
frontend-react/src/features/solutions/__tests__/schema.test.ts
frontend-react/src/features/templates/__tests__/schema.test.ts
frontend-react/src/features/messages/__tests__/schema.test.ts
frontend-react/src/features/admin/__tests__/schema.test.ts
frontend-react/src/features/profile/__tests__/schema.test.ts
```

Deeper interaction tests (MSW + React Testing Library) stay deferred to Step 6
— the scaffolding is already declared in `devDependencies`.

## New dependencies

Added to `frontend-react/package.json` (runtime):

- `react-hook-form@^7.53.2`
- `zod@^3.23.8`
- `@hookform/resolvers@^3.9.1`
- `@tanstack/react-table@^8.20.5`

Added to `devDependencies`:

- `@testing-library/user-event@^14.5.2`

All other Step 4 dependencies (`@tanstack/react-query`, `recharts`, `clsx`,
`vitest`, `msw`, etc.) are unchanged.

## Backend impact

**None.** Step 5 is pure frontend. It consumes the Step 3 endpoints exactly as
they exist. No schema changes, no migrations, no API contract edits.

The React app relies on these Step 3 behaviours in particular:

- `DELETE /visits/{id}` is a soft-delete; the list page defaults to
  `is_active=true` and only asks for inactive rows behind a toggle.
- `GET /customers/` returns `CustomerList` (slim). The detail endpoint returns
  `CustomerRead`.
- `POST /auth/change-password` exists and is `204` on success with a neutral
  `400` on wrong-current-password.
- `GET /admin/stats` returns the typed `AdminStats` shape.
- Message send errors are sanitised (`_SANITIZED_SEND_ERROR`).

## What is deferred

- **MSW + RTL interaction tests** for the feature pages. Scaffolded in
  `devDependencies` but no test file in this step beyond schema coverage.
- **Server-side search for solutions by category count / advanced filters.**
  The backend search is a single `ILIKE`; deeper search belongs in Step 6.
- **Paginated `messages/log` total count.** Backend returns a bare array; the
  frontend infers "has more" from page fullness, same as other list pages.
- **Replace the Vue frontend.** Step 5 reaches feature parity in the React
  app; retiring the Vue app is a separate cut-over belonging to Step 6.
- **File-upload progress UI.** `uploadFile` supports `onProgress`, but no page
  wires a progress bar yet.
- **"Delete photo" / "delete kundali"** — removing the stored blob is not an
  operation the backend currently exposes; replacement is supported.

## Verification checklist

Run these on a machine with Node + Docker available:

```powershell
cd astro-portal/frontend-react
npm install
npm run typecheck
npm run test
npm run build
```

Then start the full stack with the React app:

```powershell
cd ..
docker compose up -d --build db redis backend
docker compose --profile react up -d --build frontend-react
# → http://localhost:5174
```

Manual smoke tests (see `frontend-react/README.md` §"Manual verification
checklist (Step 5)" for the 15-point list):

1. Admin login → every top-bar link works.
2. Customer list search + pagination drives the URL and survives refresh.
3. Create customer with a bad email → inline 422 error on `email`.
4. Customer detail tabs via `?tab=…`; photo + kundali upload work.
5. Visit list filter bar; new visit from `/customers/:id` pre-fills customer.
6. Solutions grid filter + deactivate requires confirm.
7. Templates editor preview matches backend substitution.
8. Send message: email with template hides subject/body; WhatsApp requires a
   template.
9. Message log paginates newest-first.
10. Admin user CRUD; cannot deactivate self; 403 link hidden from non-admin.
11. Profile update reflects in TopBar; change password validates confirm +
    must-differ + minimum length.
12. Sign in as astrologer → admin link missing; direct visit redirects to
    `/403`.
13. DevTools Network shows a per-feature chunk is loaded lazily on first
    navigation to that domain.
