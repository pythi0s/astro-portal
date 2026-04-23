# Step 5 — Remaining React Feature Pages (Customers, Visits, Solutions, Messaging, Admin, Timeline)

> **Target branch:** `intuitive-design`. Verify the working tree is on this branch and clean before starting. No submodules; do NOT run `git submodule update`.
> **Prerequisites:** Steps 1–4 must be complete and merged. You MUST read, in order:
> 1. `astro-portal/docs/api-audit.md` — §2 endpoint catalog, §3 role matrix, §4 Proposed React Page Tree (this is your blueprint), §6 gap list.
> 2. `astro-portal/docs/step-03-changelog.md` — the current, enforced role matrix per endpoint.
> 3. `astro-portal/frontend-react/src/` — especially `auth/`, `api/client.ts`, and the `features/dashboard/` patterns from Step 4 (hooks, lib, types layout, query keys, money/date formatting, URL-backed filters).
>
> If the audit doc's §4 disagrees with this prompt's page list, the audit doc wins — reconcile and note it in the chat summary.

## Role
You are a senior React frontend engineer delivering a cohesive, role-aware feature set on top of an already-established shell. You reuse, you do not reinvent. You keep the data layer uniform, the URL the source of truth for list state, and the component primitives small and composable. You do NOT touch backend code, the Vue app, or the Step-4 dashboard in this step.

## Task / Objective
Build every non-dashboard feature page listed in `docs/api-audit.md` §4, using the shell, auth, query layer, and primitives already in `astro-portal/frontend-react/`. Each domain gets a consistent **List → Detail → Form** surface (where applicable), with server-authoritative role guards mirroring the enforced backend matrix.

Concretely, deliver pages for these domains:

1. **Customers** — `/customers` (list + search + pagination + KPIs), `/customers/new` (form), `/customers/:id` (detail with tabs: Details, Timeline, Solutions), `/customers/:id/edit` (form).
2. **Visits** — `/visits` (list, filterable by customer and date range), `/visits/new?customer_id=...` (form with solution picker + fee + payment status), `/visits/:id/edit` (form).
3. **Solutions Catalog** — `/solutions` (grid + search + KPIs), `/solutions/new`, `/solutions/:id/edit`.
4. **Messaging & Templates** — `/templates` (list, separate tabs for email vs. WhatsApp), `/templates/new`, `/templates/:id/edit`, `/messages/send?customer_id=&template_id=` (send modal or page — justify choice), `/messages/log` (history with filters).
5. **Admin — User Management** — `/admin/users` (list, admin-only), `/admin/users/new` (create), `/admin/users/:id` (view + deactivate + role change).
6. **Profile** — `/me` (view + edit own name/phone, change password if endpoint exists).
7. **Timeline** — rendered inside `/customers/:id` as a tab, NOT a standalone route. Uses `GET /timeline/{customer_id}`.
8. Any endpoint from §2 not covered by the above MUST get a page or be explicitly listed in the chat summary under "intentionally not surfaced" with justification.

Replace the Step-4 placeholder route for `/customers/:id` (the `"Coming soon"` stub) with the real page.

## Context
- Target app: `astro-portal/frontend-react/`.
- Reuse (do not duplicate):
  - `src/api/client.ts` — the one and only axios instance.
  - `src/auth/*` — `RequireAuth`, `RequireRole`, `useAuth`, and `hasRole(...)`.
  - `src/providers/QueryProvider.tsx` — the single `QueryClientProvider`.
  - `src/features/dashboard/lib/format.ts` — `formatMoney`, `formatDate`, `formatPercent`. Promote these to `src/lib/format.ts` in this step (move, don't copy) and update the dashboard imports accordingly. That's the only file outside this step's scope you are permitted to touch inside `features/dashboard/`.
  - `src/features/dashboard/lib/range.ts` patterns — replicate the URL-backed filter approach for list pages (page, pageSize, q, filters in URL).
- Backend endpoints per domain are authoritative from `docs/api-audit.md` §2. Do NOT infer paths from this prompt; look them up.
- File uploads (customer photo, kundali) — the backend uses `multipart/form-data` to `POST /customers` and `PUT /customers/{id}`. Use a typed wrapper in `src/api/upload.ts`; do not scatter FormData assembly across components.
- Role surface (must match `docs/api-audit.md` §3 as reconciled in Step 3):
  - `admin`: full access including `/admin/users/*`.
  - `astrologer`: customers/visits/solutions/messages CRUD, no admin routes.
  - `receptionist`: read + limited write per the matrix; hide destructive actions they cannot perform.
- Client-side role checks are UX hints only. The server is authoritative; render the control, but disable or hide it based on role. On a 403, surface a non-blocking toast and keep the user on the page.
- Money/date formatting and currency env var (`VITE_CURRENCY`) carry over from Step 4 — no new formatting utilities.

## Page surface — required components per domain (shape, not code)

Every domain page follows one of these three templates:

- **ListPage** — URL-backed search/pagination, top KPI strip (if the audit doc lists KPIs for this page), data table (`DataTable` primitive), row actions gated by role, empty state with CTA, error banner per panel, skeleton on first load.
- **DetailPage** — header with title + actions (edit, delete, role-gated), tabbed body for domains with sub-resources (customer detail has Details / Timeline / Solutions tabs), breadcrumb back to list.
- **FormPage** — react-hook-form + zod schema, inline field errors, optimistic update via React Query `useMutation` + `onMutate` cache update + `onError` rollback, cancel returns to list/detail preserving the caller's URL state via `?next=`.

## Example (shape, not exact code)

Mutation with rollback — every form uses this shape:

```ts
const qc = useQueryClient();
const { mutate, isPending } = useMutation({
  mutationFn: (payload: CustomerInput) => api.post('/customers', payload).then(r => r.data),
  onMutate: async (payload) => {
    await qc.cancelQueries({ queryKey: ['customers', 'list'] });
    const prev = qc.getQueryData(['customers', 'list']);
    // optimistic insert
    return { prev };
  },
  onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['customers', 'list'], ctx.prev),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
});
```

Role-gated row action — rendered always, disabled when not allowed:

```tsx
<RowAction
  label="Delete"
  tone="danger"
  disabled={!hasRole('admin') && !hasRole('astrologer')}
  disabledReason="You do not have permission to delete customers"
  onConfirm={() => mutateDelete(row.id)}
/>
```

Confirm dialog is GLOBAL — one provider near the root, called via hook:

```tsx
const confirm = useConfirm();
const ok = await confirm({ title: 'Delete customer?', danger: true });
if (ok) mutateDelete(id);
```

## Constraints

1. **No new routing, server-state, or charting libraries.** React Router v6, TanStack Query v5, Recharts (only if a page needs a chart — most will not). Zustand remains for auth only.
2. **Forms:** add `react-hook-form` + `zod` + `@hookform/resolvers`. All form validation is declared once as a zod schema and reused for both `POST` and `PUT` flows.
3. **Tables:** add `@tanstack/react-table` (headless). Build a single `DataTable` primitive in `src/components/DataTable.tsx` that every list page consumes. Do NOT install a styled table kit (AG Grid, Material, etc.).
4. **Global confirm dialog** via a `ConfirmProvider` + `useConfirm()` hook. Every destructive action uses it. No `window.confirm`.
5. **URL is the source of truth** for list-page state: `?q=&page=&pageSize=&sort=&<filter>=...`. Refresh restores state. Do not store list state in React Query alone; the URL drives the query key.
6. **File uploads** go through `src/api/upload.ts`. Photo/kundali preview uses `URL.createObjectURL` and revokes on unmount.
7. **Accessibility carries over from Step 4** — WCAG AA, keyboard nav, focus-visible, Lighthouse a11y ≥ 95 on every new page. Tables have proper `<caption>` or `aria-label`. Forms have associated `<label>` and `aria-describedby` for errors.
8. **Role checks use `hasRole(...)`**. Never inline `user.role === 'admin'`. Admin-only routes are wrapped in `<RequireRole allow={['admin']} />`; non-admin slices of otherwise-shared pages are conditionally rendered and MUST NOT render in the DOM for unauthorized users.
9. **403 handling** — a single axios response interceptor shows a toast ("You don't have permission") and keeps the user on the page. Do NOT log out on 403. Log out only on 401-after-refresh-fails (already handled in Step 2 — don't touch).
10. **No backend changes.** Missing endpoints are logged as `// TODO(step-6)` and the UI falls back to the closest available endpoint, or the affected control is disabled with a tooltip explaining why.
11. **No changes to the Vue app** (`frontend/`), the dashboard feature folder (`features/dashboard/`, except as noted for the `format` module promotion), or anything under `backend/`.
12. **No emojis** in UI copy, code, or docs.
13. **Bundle discipline.** Each route is lazy-loaded via `React.lazy` + route-level code splitting. The main (post-login) chunk stays ≤ 220 KB gzipped. Each feature route chunk ≤ 120 KB gzipped. Report sizes in the chat summary.
14. **Tests.** For each domain, at minimum:
    - Zod schema round-trip (valid + two invalid cases).
    - List page: renders rows from MSW, URL filter round-trip, role-gated action disabled for unauthorized role.
    - Form page: submit happy path + server-validation error rendering.
    - One integration test per domain that boots the router, logs in via MSW, navigates list → detail → edit → save, and asserts cache invalidation.

## Output Format

Produce files under `astro-portal/frontend-react/src/` as follows. Co-locate by feature (`src/features/<domain>/`), mirror the Step-4 dashboard layout.

**New shared primitives and utilities:**
- `src/lib/format.ts` (moved from `features/dashboard/lib/format.ts`; dashboard imports updated).
- `src/lib/urlState.ts` — generic `useUrlState<T>(schema)` hook for list-page filters.
- `src/api/upload.ts` — typed multipart helper.
- `src/components/DataTable.tsx` — headless TanStack Table wrapper with pagination, sort, empty/loading/error states.
- `src/components/PageHeader.tsx`, `Breadcrumbs.tsx`, `ConfirmProvider.tsx`, `useConfirm.ts`, `Toast.tsx`/`useToast.ts`, `FormField.tsx`, `Tabs.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `RoleGate.tsx` (thin wrapper over `hasRole` for DOM-level hiding).
- `src/hooks/useServerErrorToast.ts` — axios 403/5xx → toast.

**Per-domain feature folders** (`src/features/<domain>/`), each containing:
- `api.ts` (typed endpoint wrappers), `types.ts`, `schema.ts` (zod), `queryKeys.ts`.
- `hooks/use<Domain>List.ts`, `hooks/use<Domain>.ts`, `hooks/use<Domain>Mutations.ts`.
- `pages/<Domain>ListPage.tsx`, `pages/<Domain>DetailPage.tsx` (if applicable), `pages/<Domain>FormPage.tsx`.
- `components/` — domain-specific pieces (e.g. `customers/components/CustomerKpiStrip.tsx`, `PhotoUploader.tsx`, `TimelineTab.tsx`, `SolutionsTab.tsx`; `visits/components/SolutionPicker.tsx`, `PaymentStatusBadge.tsx`; `templates/components/PlaceholderPreview.tsx`, `SendMessageDialog.tsx`; `admin/components/UserRoleSelect.tsx`).
- `__tests__/` — schema, list, form, and one integration test.

**Modified (additive) files:**
- `src/router.tsx` — register all new routes under the authenticated layout with `React.lazy` imports; wrap admin routes in `<RequireRole allow={['admin']} />`; replace the Step-4 placeholder for `/customers/:id`.
- `src/App.tsx` — add nav links (Dashboard, Customers, Visits, Solutions, Templates, Message Log, Admin Users [admin-only], Profile). Use `RoleGate` for admin items.
- `src/main.tsx` — wrap app with `<ConfirmProvider>` and `<ToastProvider>`.
- `package.json` — add `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-table`. No other new runtime deps.
- `README.md` (in `frontend-react/`) — new "Feature Pages" section: route map table, role-visibility matrix, manual verification checklist.
- `docs/api-audit.md` §4 — if you discover a missing page or route name mismatch, update the doc and note the reconciliation in the chat summary.

Final chat summary (≤ 25 lines) must include:
- Links to each domain folder.
- The updated route map table (path → page → guard → role visibility).
- Per-route gzipped chunk size.
- Any endpoints intentionally not surfaced, with justification.
- Any `docs/api-audit.md` updates made.
- The manual verification checklist, copied verbatim from the README.

## Validation Criteria
Accepted only if ALL of these hold:

- [ ] Every endpoint in `docs/api-audit.md` §2 that is not tagged `system` is either consumed by at least one page in this step OR listed in the chat summary under "intentionally not surfaced" with justification.
- [ ] Every page in `docs/api-audit.md` §4 exists in `src/router.tsx` with the guard specified by the doc.
- [ ] `/customers/:id` renders the real customer detail with Details / Timeline / Solutions tabs. The Step-4 placeholder is gone. Direct links from the dashboard's Recent Visits panel now resolve to real content.
- [ ] Admin-only routes (`/admin/users*`) render `/403` for non-admin users and are absent from the nav for non-admins (DOM-level, not CSS-hidden).
- [ ] A non-admin user's attempt to call an admin-only endpoint (e.g., via devtools) results in a toast "You don't have permission" and the user stays on the page — no logout, no white screen.
- [ ] Every list page has URL-backed state: changing search/page/filter updates the URL with `replace: true` (no history spam) and a hard refresh restores the exact view.
- [ ] Every form page submits via `useMutation` with optimistic update + rollback on error, and server validation errors (422) render inline next to the offending field (parsed from the backend's Pydantic error response).
- [ ] Destructive actions always go through `useConfirm()`. `rg "window\\.confirm\\(" frontend-react/src/` returns zero hits.
- [ ] Exactly ONE axios instance in the codebase: `rg "axios\\.create\\(" frontend-react/src/` returns exactly one hit (still in `src/api/client.ts`).
- [ ] Exactly ONE `QueryClientProvider` in the codebase: `rg "QueryClientProvider" frontend-react/src/` returns hits only in `src/providers/QueryProvider.tsx` and `src/main.tsx`.
- [ ] `formatMoney` is used for every money render; `rg "₹|\\$\\d" frontend-react/src/` returns zero hits in JSX.
- [ ] File uploads (customer photo, kundali) work: preview renders from a local blob URL before save; `URL.revokeObjectURL` is called in a cleanup.
- [ ] `npm run build` succeeds with no TypeScript errors; `tsc --noEmit` clean.
- [ ] `npm run test` — all Vitest tests pass, including the one integration test per domain.
- [ ] Per-route gzipped chunk sizes reported; each ≤ 120 KB, main post-login chunk ≤ 220 KB.
- [ ] Lighthouse accessibility ≥ 95 on Customers list, Customers detail, Customer form, Admin Users list, Templates list, Message Log (report each score in the chat summary).
- [ ] Existing Step-2 auth, Step-4 dashboard, and the Vue app (`:5173`) all still work with zero regressions.
- [ ] `git diff --stat origin/intuitive-design...HEAD` shows changes ONLY under `frontend-react/` and (optionally) `docs/api-audit.md`. No changes to `backend/` or `frontend/`.
