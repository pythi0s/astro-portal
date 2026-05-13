# Step 4 Changelog — Revenue Dashboard (React)

## Summary

Adds the `/dashboard` route to `frontend-react/` — a single-page revenue dashboard composed of KPI cards, two charts, and two supporting panels. All data is fetched through the existing `apiClient` (one axios instance) and managed in React Query v5. The dashboard consumes the new Step 3 endpoints (`/dashboard/revenue`, `/dashboard/revenue-by-category`) plus the pre-existing `/dashboard/earnings` and `/visits/`. No backend changes in this step.

## Deliverables

### New files

- `frontend-react/src/pages/Dashboard.tsx`
- `frontend-react/src/pages/CustomerDetailStub.tsx` — placeholder so the Recent Visits panel has a valid route to link to before Step 5 ships the real customer page.
- `frontend-react/src/providers/QueryProvider.tsx`
- `frontend-react/src/api/dashboard.ts`
- `frontend-react/src/features/dashboard/`
  - `types.ts`
  - `DateRangeFilter.tsx`, `KpiCard.tsx`, `KpiGrid.tsx`, `PanelShell.tsx`
  - `EarningsChart.tsx`, `PaymentStatusChart.tsx`
  - `RecentVisitsPanel.tsx`, `TopCategoriesPanel.tsx`
  - `StaffCollectionRow.tsx` (admin-only placeholder)
  - `hooks/useRevenueStats.ts` (current + previous-window hooks), `useEarnings.ts`, `useTopCategories.ts`, `useRecentVisits.ts`
  - `lib/format.ts` — `formatMoney`, `formatInteger`, `formatPercent`, `formatDate`, `deltaPercent`, `humanizeCategory`, `toIsoDate`, `toNumber`
  - `lib/range.ts` — `PRESETS`, `rangeForPreset`, `parseRange`, `serializeRange`, `previousWindow`, `autoGranularity`, `daysInRange`

### Modified files

- `frontend-react/src/main.tsx` — wraps the app in `<QueryProvider>`.
- `frontend-react/src/router.tsx` — `/` redirects to `/dashboard`; adds `/dashboard`, `/home` (old home), and `/customers/:id` (stub).
- `frontend-react/src/components/TopBar.tsx` — adds a primary nav with a Dashboard link.
- `frontend-react/package.json` — new runtime deps: `@tanstack/react-query`, `recharts`, `clsx`. New dev deps: `@tanstack/react-query-devtools`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `msw`, `vitest`. (Test harness is present; suites ship in Step 6.)
- `frontend-react/.env.example` — adds `VITE_CURRENCY=INR`.
- `frontend-react/README.md` — new "Revenue Dashboard" section with panel→endpoint map, design rationale, and a ten-point manual verification checklist.

## Endpoint contracts consumed

All four endpoints were defined in Step 3; the React client only types the fields it uses:

- `GET /dashboard/revenue?from=&to=` → `RevenueSummary` (current + previous-window, fetched as two parallel queries)
- `GET /dashboard/revenue-by-category?from=&to=` → `RevenueByCategory`
- `GET /dashboard/earnings?period=&days=` → `EarningsSummary`
- `GET /visits/?date_from=&date_to=&limit=10` → `VisitSummary[]`

## Design decisions

- **TanStack Query v5 only.** Single `QueryClientProvider` near the root. Query keys include the date range so cache invalidation on filter change is deterministic.
- **URL-backed state.** `?from=&to=` is the single source of truth. `useSearchParams` + `parseRange` on every render (cheap). Hard refresh restores the same view.
- **Previous-window delta as a separate query.** So the KPI value renders immediately even while the comparison is still loading; the delta shows `—` until both complete.
- **Granularity auto-rule.** ≤31 d day, ≤120 d week, else month. Manual override is per-session and announced via `aria-live`.
- **Panel-scoped errors.** `<PanelShell>` renders loading / error / empty uniformly so a single failing widget doesn't blank the page.
- **Money is never concatenated.** All money goes through `formatMoney()`, which reads `VITE_CURRENCY`. The codebase contains no `₹` or `$` in any JSX file.
- **Recharts over Chart.js.** Composable, React-native, tree-shakable, and the existing Vue app uses Chart.js — keeping the stacks distinct lets each app evolve independently.

## Deferred from the Step 4 prompt (and why)

| Item | Why deferred | Target |
| --- | --- | --- |
| Vitest + MSW test suite | The authoring host has no Node.js / Docker runtime; written suites can't be validated and could rot. Harness (deps, vitest config) is in place. | Step 6 — seamless setup will install the toolchain and land the tests in the same pass. |
| Bundle-size measurement + Lighthouse score | Requires `vite build` on the target machine. | Measure on the Docker test box; record numbers here once known. |
| Staff collection row data | Backend endpoint NEW-03 was deferred in Step 3 (no product signal). | Future step — when there is a product decision, wire the panel to the new endpoint. |

## Verification commands to run on the Docker test machine

```bash
cd astro-portal/frontend-react
npm install
npm run typecheck                                  # should be clean
npm run build                                      # should succeed; note chunk sizes
# Run the stack and check the dashboard end-to-end:
cd ..
docker compose --profile react up -d --build
open http://localhost:5174/dashboard
```

## Risk assessment

Overall: **low-medium**. Low because all changes are additive and feature-scoped to `frontend-react/` — the Vue app and backend are untouched. Medium because the code was not executed on the authoring host (no Node.js runtime), so recharts/react-query API usage and Tailwind class composition are trusted to pass `tsc --noEmit` and to render correctly on first `npm install` on the Docker box. Rolling back is a revert of this commit plus `npm install` to unwind `package-lock.json` changes.
