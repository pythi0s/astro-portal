# Step 4 — Revenue Dashboard Page (React)

> **Target branch:** `intuitive-design`. Verify the working tree is on this branch and clean before starting. No submodules; do NOT run `git submodule update`.
> **Prerequisites:** Steps 1–3 must be complete and merged. You MUST read, in order:
> 1. `astro-portal/docs/api-audit.md` — §2 endpoint catalog, §3 role matrix, §5 Revenue / Dashboard Coverage (authoritative for which endpoints feed revenue), §6 gaps.
> 2. `astro-portal/docs/step-03-changelog.md` — confirms backend is hardened, migrations are stable, role guards are enforced.
> 3. `astro-portal/frontend-react/src/auth/*` — the shell, guards, and auth store you will build on.
>
> If any of the above is missing or inconsistent with the backend source, STOP and report.

## Role
You are a senior React frontend engineer specializing in data-dense dashboard UIs, accessible charts, and clean server-state management. You write typed, composable React code and you know when to avoid premature abstraction. You do NOT touch backend code or other feature pages in this step — only the revenue dashboard surface and the supporting data layer it needs.

## Task / Objective
Add a `/dashboard` route to `astro-portal/frontend-react/` that renders a **Revenue Dashboard**: the single page a business owner opens first thing in the morning to understand cash in, cash outstanding, and trend. It must consume the existing `/dashboard/stats` endpoint (and any additional revenue-specific endpoints listed in `docs/api-audit.md` §5) and render KPIs, two charts, and two supporting lists. It must be keyboard- and screen-reader-accessible, responsive from 360 px up, and performant (no layout thrash, no jank on date-range change).

Concretely, deliver:

1. A `/dashboard` route gated by `RequireAuth` and visible to all three roles (`admin`, `astrologer`, `receptionist`). Admin-only slices of the page are conditionally hidden via `hasRole('admin')`, never via route-level guards.
2. A date-range filter with presets (`7D`, `30D`, `90D`, `365D`) and a custom range picker. Selected range persists to URL query params (`?from=YYYY-MM-DD&to=YYYY-MM-DD`) so the view is shareable and survives refresh.
3. Six KPI cards: Total Revenue, Collected Revenue, Outstanding Revenue, Visits in Range, Avg Fee / Visit, Collection Rate (%). Each card shows delta vs. the immediately preceding equal-length window (e.g., last 30 days vs. the 30 days before that), with up/down indicator and tooltip explaining the comparison.
4. Two charts:
   - **Earnings over time** (bar or line, user toggle): day / week / month granularity auto-selected from range length, with a manual override.
   - **Payment status breakdown** (doughnut): paid vs. pending vs. partial, with absolute amounts in the legend.
5. Two supporting panels:
   - **Recent visits** — last 10 visits in range with customer name, fee, status, date. Each row links to `/customers/:id` (placeholder route — Step 5 will implement; the link must still render and be valid).
   - **Top revenue by solution category** — grouped sum of fees per solution category, top 5, bar or horizontal list.
6. Empty, loading, and error states for every panel. Skeletons during initial load. A single inline error banner per panel (not a page-level banner) so a failure in one widget does not hide the rest.
7. All data fetching through **TanStack Query (React Query) v5**. Add it as a new dependency. Keys must be deterministic and include the date range so cache invalidates correctly on filter change.

## Context
- Target app: `astro-portal/frontend-react/` (produced in Step 2).
- Auth/shell to reuse as-is:
  - `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/auth/RequireAuth.tsx`, `src/auth/RequireRole.tsx`.
  - `src/api/client.ts` — axios instance with 401-refresh interceptor. Reuse it; do not create a second axios instance.
  - `src/router.tsx` — add the new route here.
  - `src/App.tsx` — add a `Dashboard` link in the shell header/nav.
- Backend endpoints (confirm exact shape in `docs/api-audit.md` §5 before implementing — the doc wins if it disagrees with this prompt):
  - `GET /dashboard/stats?from=&to=` — primary feed. Expect KPI scalars and time-series arrays.
  - `GET /visits?from=&to=&limit=10&order=-date` — recent visits panel (or whatever the audit doc identifies as the correct filter params).
  - Any revenue-aggregation endpoint the audit doc listed as "proposed new endpoint" and actually delivered in Step 3. If it was deferred, derive that slice client-side from `/visits` and clearly comment the fallback with a `// TODO(step-5): migrate to /dashboard/revenue-by-category when available`.
- Role note: all three roles can see revenue KPIs. Admin additionally sees a small "Staff collection rate" breakdown (one extra card row). Non-admin users must not see this row — hide it in JSX via `hasRole('admin')`.
- Money formatting: use `Intl.NumberFormat` with the currency code from `VITE_CURRENCY` env var, default `INR`. Do NOT hardcode `₹` or `$` — derive from the currency code.
- Date formatting: ISO `YYYY-MM-DD` in URL and API calls; human format in UI via `Intl.DateTimeFormat` with the browser locale.
- Time zone: all `from`/`to` values are sent as date-only in the user's local time zone, converted to UTC day boundaries on the server. Do NOT send ISO timestamps from the client.

## Example (shape, not exact code)

Data layer — one hook per panel, each returning `{ data, isLoading, isError, error, refetch }`:

```ts
export function useRevenueStats(range: DateRange) {
  return useQuery({
    queryKey: ['dashboard', 'stats', range.from, range.to],
    queryFn: ({ signal }) => api.get('/dashboard/stats', { params: range, signal }).then(r => r.data),
    staleTime: 60_000,
  });
}
```

KPI card — dumb presentational, no fetching:

```tsx
<KpiCard
  label="Collected Revenue"
  value={formatMoney(stats.collected)}
  delta={stats.collected_delta_pct}
  tooltip={`vs. previous ${rangeLengthDays}-day window`}
  tone={stats.collected_delta_pct >= 0 ? 'positive' : 'negative'}
/>
```

URL-backed filter — single source of truth is the URL, not component state:

```tsx
const [params, setParams] = useSearchParams();
const range = parseRange(params); // returns { from, to, preset? }
const setRange = (next: DateRange) => setParams(serializeRange(next), { replace: true });
```

## Constraints
1. **No new routing library.** Use the existing React Router v6 setup from Step 2.
2. **TanStack Query v5 is the ONLY server-state tool.** Do not use SWR, RTK Query, or hand-rolled `useEffect` fetches. Provide a single `QueryClientProvider` near the root; don't wrap per-page.
3. **Charting library.** Use **Recharts** (composable, unstyled, accessible). Do not use Chart.js (keep parity with a lighter React-native library). Justify any deviation in the page-level comment.
4. **No new UI framework.** Continue with Tailwind + primitive components. You may add `clsx` and `@headlessui/react` (for the date range popover and menu) if needed — those are the only UI deps permitted.
5. **No global state for dashboard data.** Zustand is reserved for auth. All dashboard data lives in React Query cache.
6. **Accessibility is non-negotiable.**
   - All interactive controls reachable by keyboard, with visible focus rings.
   - Charts have an accessible text summary (`<figcaption>` or `aria-label`) describing the headline number.
   - Color is not the only signal: up/down deltas also use an icon + sign.
   - Contrast meets WCAG AA.
7. **Performance.**
   - Initial `/dashboard` JS payload (gzipped) ≤ 180 KB excluding Recharts; total ≤ 280 KB gzipped. Enforce via a manual check of `vite build` output in the README.
   - No chart re-render on hover (use `ResponsiveContainer` correctly; memoize data arrays).
   - Date-range change triggers exactly ONE network request per panel (no double-fetch). Verify in devtools Network panel and note it in the manual checklist.
8. **No backend changes.** If you discover a missing data slice, fallback client-side and log it as a TODO; do not edit any file under `backend/`.
9. **No changes to the existing Vue app.** `astro-portal/frontend/` is untouched.
10. **Money never rendered with floating-point concatenation.** Always through `formatMoney(value, currency)`.
11. **No emojis** in UI copy, code comments, or commit messages.
12. **Tests.** Add Vitest + React Testing Library unit tests for: (a) `parseRange`/`serializeRange` round-trip, (b) delta computation sign/percentage edge cases (zero previous, negative current), (c) `formatMoney` locale/currency behavior, (d) `useRevenueStats` hook under loading/success/error via MSW mock.

## Output Format
Produce/modify files under `astro-portal/frontend-react/` as follows:

**New files:**
- `src/pages/Dashboard.tsx` — page composition, reads URL range, renders all panels.
- `src/features/dashboard/`
  - `DateRangeFilter.tsx` — presets + custom picker popover.
  - `KpiCard.tsx`, `KpiGrid.tsx`.
  - `EarningsChart.tsx` — Recharts bar/line with granularity toggle.
  - `PaymentStatusChart.tsx` — Recharts doughnut.
  - `RecentVisitsPanel.tsx`.
  - `TopCategoriesPanel.tsx`.
  - `StaffCollectionRow.tsx` — admin-only, hidden via `hasRole('admin')`.
  - `hooks/useRevenueStats.ts`, `hooks/useRecentVisits.ts`, `hooks/useTopCategories.ts`.
  - `lib/range.ts` — `parseRange`, `serializeRange`, `previousWindow`.
  - `lib/format.ts` — `formatMoney`, `formatDate`, `formatPercent`.
  - `types.ts` — `DateRange`, `RevenueStats`, `VisitSummary`, `CategoryTotal`.
- `src/api/dashboard.ts` — typed functions: `getRevenueStats`, `getRecentVisits`, `getTopCategories`.
- `src/providers/QueryProvider.tsx` — exports `<QueryProvider>` wrapping `QueryClientProvider`.
- `src/features/dashboard/__tests__/range.test.ts`, `format.test.ts`, `useRevenueStats.test.tsx` (with MSW).
- `test/msw/handlers.ts`, `test/setup.ts` — MSW setup for Vitest.

**Modified files (additive only):**
- `src/router.tsx` — add `/dashboard` route under the authenticated layout.
- `src/App.tsx` — add "Dashboard" nav link; default authenticated landing may redirect to `/dashboard` (justify in README if you change the landing).
- `src/main.tsx` — wrap app in `<QueryProvider>`.
- `package.json` — add `@tanstack/react-query`, `@tanstack/react-query-devtools` (dev), `recharts`, `clsx`, `@headlessui/react`, `msw` (dev), `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- `vite.config.ts` — add Vitest config block.
- `.env.example` — add `VITE_CURRENCY=INR`.
- `README.md` (in `frontend-react/`) — new "Revenue Dashboard" section with screenshots/description, bundle-size note, and manual verification checklist.

Final chat summary (≤ 20 lines) must include: (a) links to the new files, (b) `npm run dev` and `docker compose up` commands, (c) the manual verification checklist (copied verbatim from the README), (d) the measured gzipped bundle size of the `/dashboard` chunk.

## Validation Criteria
Accepted only if ALL of these hold:

- [ ] Route `/dashboard` renders for authenticated users of all three roles and redirects unauthenticated users to `/login?next=%2Fdashboard`.
- [ ] Changing the preset from `7D` to `30D` updates the URL to `?from=...&to=...` AND triggers exactly ONE network request per panel (verified in devtools Network; note this in the README checklist).
- [ ] Hard-refreshing the page with a `?from=&to=` URL restores the exact range and re-fetches data — no fallback to default range.
- [ ] The six KPI cards each render a numeric value, a delta %, and a direction indicator (icon + sign, not color alone). Zero-previous-window edge case shows `—` for delta, not `NaN%` or `Infinity%`.
- [ ] Earnings chart granularity is `day` for ranges ≤ 31 days, `week` for 32–120 days, `month` for >120 days, and can be manually overridden; the override is reflected in an ARIA-live region for screen readers.
- [ ] Payment-status doughnut legend shows formatted money per slice and sums to Total Revenue ± 1 unit (rounding).
- [ ] Recent-visits rows link to `/customers/:id` with valid href even though that route is a Step-5 placeholder (clicking it should navigate without JS error; it may render a "Coming soon" placeholder).
- [ ] Admin-only staff collection row is visible when logged in as admin, absent from the DOM (not merely hidden by CSS) when logged in as astrologer or receptionist.
- [ ] Lighthouse accessibility score on `/dashboard` is ≥ 95 in Chrome devtools on a fresh `npm run dev` load (report the score in the chat summary).
- [ ] Keyboard-only navigation: user can tab to every control (preset buttons, custom range picker, granularity toggle, chart focusable elements), and focus is never trapped.
- [ ] `npm run build` succeeds with no TypeScript errors. `tsc --noEmit` is clean.
- [ ] `npm run test` — all Vitest tests pass, including the MSW-backed hook test.
- [ ] Gzipped size of the `/dashboard` route chunk (excluding Recharts) is ≤ 180 KB; total including Recharts ≤ 280 KB. Report both numbers in the chat summary.
- [ ] All money renders go through `formatMoney`; `rg "₹|\\$\\d"` in `frontend-react/src/` returns no results in JSX (bare currency symbols are a failure).
- [ ] All network calls use the existing `src/api/client.ts` axios instance — `rg "axios.create\\(" frontend-react/src/` returns exactly ONE hit (in `client.ts`).
- [ ] `git diff --stat origin/intuitive-design...HEAD` shows changes ONLY under `frontend-react/` and (optionally) `docs/` for any page-map updates. No changes to `backend/` or `frontend/`.
- [ ] Existing Step-2 auth behaviors still work: login, persistent session, silent 401 refresh. No regressions.
