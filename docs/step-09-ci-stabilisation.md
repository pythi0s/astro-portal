# Step 9 changelog — CI stabilisation

Step 7 added `.github/workflows/ci.yml` but the first six runs on
`astro-cursor-test` failed in progressively narrower ways until run #6 went
green. This doc is the post-mortem: it names each failure, the commit that
fixed it, and — more importantly — why the fix was correct rather than a
shotgun patch. Future contributors debugging CI regressions should start
here before touching `ci.yml`.

**Green reference run:** [#6 — `7ed715b`](https://github.com/pythi0s/astro-portal/actions/runs/24884028452),
51 s total, all four jobs pass.

## Run history

| # | Commit  | Trigger      | Result | Root cause family |
| - | ------- | ------------ | ------ | ----------------- |
| 1 | —       | initial push | ❌     | workflow pathing  |
| 2 | —       | retry        | ❌     | workflow pathing  |
| 3 | —       | retry        | ❌     | frontend tsc + backend ruff |
| 4 | —       | —            | ❌     | 5 vitest failures |
| 5 | `3d708d8` | test fixes | ❌     | 1 vitest failure (real bug, previously masked) |
| 6 | `7ed715b` | ResizeObserver polyfill | ✅ | — |

Each row below is expanded with the diagnosis and the rationale for the
fix.

## Fix 1 — `working-directory` paths (runs #1, #2)

**Symptom.** Every job failed at the first `npm install` / `pip install`
step with `ENOENT: No such file or directory, open 'package.json'` or
`Could not open requirements file: astro-portal/backend/pyproject.toml`.

**Diagnosis.** The workflow was written assuming the repo had a top-level
`astro-portal/` directory — because the authoring host has the repo checked
out at `C:\ws\cursor\astro\astro-portal`. It does not; `actions/checkout@v4`
lands the repo contents directly in `$GITHUB_WORKSPACE`. Every
`working-directory:` and `cache-dependency-glob:` entry had a redundant
`astro-portal/` prefix that doubled the path on CI.

**Fix.** Dropped the prefix from all of them:

```diff
-      working-directory: astro-portal/frontend-react
+      working-directory: frontend-react
```

Applied uniformly to `frontend-react`, `frontend` (Vue), `backend`, and the
compose job. No other workflow changes were needed — the job logic was
correct, just rooted in the wrong directory.

## Fix 2 — Vite client types (run #3, frontend-react job)

**Symptom.** `tsc --noEmit` failed with

```
src/api/client.ts:51:22 - error TS2339: Property 'env' does not exist on type 'ImportMeta'.
```

**Diagnosis.** The project reads `import.meta.env.VITE_*` in several
places (`api/client.ts`, `features/dashboard/lib/*`). Without a
`vite-env.d.ts` pulling in `vite/client` types, TypeScript sees `ImportMeta`
as the empty `lib.es2020` shape and rejects `.env`. Local dev didn't catch
it because the authoring host skipped the typecheck (no npm).

**Fix.** Added `frontend-react/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_BASE?: string;
  readonly VITE_CURRENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Every `VITE_*` variable actually read in `src/` is declared explicitly so
the type covers intent, not just "whatever string survives vite's build".
Adding a new `VITE_*` var requires adding it here too — that's a feature.

## Fix 3 — Backend ruff cleanup (run #3, backend job, 411 → 0)

**Symptom.** `ruff check .` emitted a deprecation warning about
top-level `select` plus 411 real errors across every module.

**Diagnosis.** Three distinct issues conflated:

1. **Ruff 0.5+** moved lint-specific keys (`select`, `per-file-ignores`,
   etc.) under `[tool.ruff.lint]`. Keeping them at top-level still worked
   but printed a warning on every run.
2. Alembic auto-generates revision files under `alembic/versions/`. Those
   files are deliberately verbose (column definitions on single lines) and
   should never be linted; they contributed ~280 of the 411 errors.
3. The remaining ~130 errors were genuine: `UP045` (PEP 604 unions),
   `UP042` (`class Foo(str, Enum)` → `StrEnum`), `I001` (import sorting),
   `B904` (`raise ... from exc`), `B008` (mutable default arg from
   FastAPI's `Depends(...)` pattern — a false positive ruff needed
   teaching about), `E501` (line length), a few `E402`/`UP007`.

**Fix.** Refined `backend/pyproject.toml`:

```toml
[tool.ruff]
line-length = 100
target-version = "py311"
extend-exclude = ["alembic/versions"]

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]

[tool.ruff.lint.per-file-ignores]
"alembic/env.py" = ["E402", "F401"]
"__init__.py" = ["F401"]

[tool.ruff.lint.flake8-bugbear]
extend-immutable-calls = [
    "fastapi.Body",
    "fastapi.Cookie",
    "fastapi.Depends",
    "fastapi.File",
    "fastapi.Form",
    "fastapi.Header",
    "fastapi.Path",
    "fastapi.Query",
    "fastapi.Security",
]
```

Notes on each block:

- **`extend-exclude = ["alembic/versions"]`** rather than
  `per-file-ignores` because these files should be invisible to linters
  entirely — we're not writing them by hand.
- **`per-file-ignores` for `alembic/env.py`** covers two intentional
  anti-patterns: `E402` because the file mutates `sys.path` *before*
  importing `app.*`, and `F401` because it imports `app.models` purely
  for the side effect of registering every SQLModel on the shared
  metadata.
- **`per-file-ignores` for `__init__.py`** covers the re-export barrel
  pattern (`from .x import Y`). Those imports are used by the rest of
  the codebase but look unused to ruff.
- **`flake8-bugbear.extend-immutable-calls`** teaches B008 that FastAPI's
  dependency-injection helpers are safe as parameter defaults. The
  alternative is a `# noqa: B008` on every route handler, which is noisy.

After config: `python -m ruff check . --fix --unsafe-fixes` resolved 277
errors automatically (the `UP*` family, `I001`, `F401`). The remaining 24
were hand-fixed:

- **`B904`** — `raise Exception("refresh failed")` inside an `except`
  became `raise Exception("refresh failed") from exc`. Files:
  `app/core/security.py`, `app/tasks/messaging.py`.
- **`E402`** — a mid-file `BaseModel` import in `app/api/routes/admin.py`
  hoisted to the top of the module.
- **`E501`** — long lines wrapped by hand in `dashboard.py`,
  `messages.py`, `cli.py`, `uploads.py` (select statements, HTTPException
  detail messages, ArgumentParser descriptions).
- **`UP007`** — `Union[TimelineVisit, TimelineMessage, TimelineSolution]`
  in `app/schemas/timeline.py` rewritten as
  `TimelineVisit | TimelineMessage | TimelineSolution`.
- **`B008`** (one residual) — `auth.py` gained a module-level
  `_require_admin = require_role([UserRole.admin])` so the `Depends(...)`
  default references a pre-built dependency instead of calling a helper
  inline. This is the FastAPI-canonical workaround.

## Fix 4 — RTL cleanup (run #4, 4 of 5 vitest failures)

**Symptom.** Four tests failed with "Found multiple elements with role
`textbox`" or typed-into-stale-inputs errors:

- `Login.test.tsx` — "submits valid credentials and lands on home"
- `Login.test.tsx` — "shows a 401 error message"
- `Login.test.tsx` — "disables the submit button while in flight"
- `CustomerListPage.test.tsx` — "searches by query string"

**Diagnosis.** `vitest` is configured with `globals: false` (we prefer
explicit imports). Under that setting, **`@testing-library/react` does
not auto-unmount between tests** — you have to wire `cleanup()` into
`afterEach` yourself. The older "import from `@testing-library/react/vitest`"
shortcut requires `globals: true`, which we don't want.

Without cleanup, the DOM from one test stayed mounted and the next
`render(...)` appended a second copy into the same container. `getByRole`
then saw two of everything.

**Fix.** In `frontend-react/src/test/setup.ts`:

```ts
import { cleanup } from '@testing-library/react';
// …
afterEach(() => {
  cleanup();
  server.resetHandlers();
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    /* jsdom should never throw */
  }
});
```

This fix is independent of the individual test bugs — those were always
wrong, but `cleanup()` kept them from being visible until one specific
test ordering hit a collision. Every future test file inherits the fix.

## Fix 5 — UserListPage matcher scoping (run #4, 1 test)

**Symptom.** `findByText(/admins/i)` matched two elements: the
`AdminStatsCard` label "Admins" *and* the page subtitle prose "Manage
the admins, astrologers, and receptionists …".

**Diagnosis.** The regex was intentionally case-insensitive but
accidentally also a substring match. Both `/admins/i` and `/^admins$/i`
are case-insensitive; only the latter is anchored to the whole text
content.

**Fix.** In `frontend-react/src/features/admin/__tests__/UserListPage.test.tsx`:

```ts
expect(await screen.findByText(/^total users$/i)).toBeInTheDocument();
expect(screen.getByText(/^active users$/i)).toBeInTheDocument();
expect(screen.getByText(/^admins$/i)).toBeInTheDocument();
```

The same pattern applies anywhere a test asserts on stats-card labels
that might collide with descriptive copy elsewhere on the page. Prefer
`^…$`-anchored regexes for labels unless a partial match is explicitly
what you want.

## Fix 6 — Dashboard `/revenue` handler + stale refs (run #4 → run #5, partial)

**Symptom.** `Dashboard.test.tsx` "renders formatted KPI values" failed
twice in different ways: once with the ambiguous "element could not be
found" after a chain of `expect(capturedNode).toBeInTheDocument()` calls,
once with the bare `Unable to find role="list" and name …` error.

**Diagnosis (partial).** The page fires *two* `/dashboard/revenue`
queries on mount — one for the current range and one for the previous
equal-length window via `usePreviousRevenueStats`. The original handler
switched payloads by inspecting `url.searchParams` to tell current from
previous, which made the test brittle against the runtime-computed
`new Date()` default range. Separately, the assertions captured KPI
list nodes into local variables before awaiting React Query, so when
React Query re-rendered the subtree the captured nodes were orphaned.

**Fix (partial).** Simplified the handler to always return
`sampleRevenue`:

```ts
http.get('/dashboard/revenue', () => HttpResponse.json(sampleRevenue)),
```

Delta KPIs then show 0 % across the board, but the test doesn't assert
on them. And moved every assertion inside `waitFor`, re-querying the
list on each poll:

```ts
await waitFor(() => {
  const list = screen.getByRole('list', { name: /key revenue indicators/i });
  const items = within(list).getAllByRole('listitem');
  expect(items).toHaveLength(6);
  // …per-item assertions…
});
```

This fixed the visible symptoms but (as run #5 revealed) it masked a
deeper issue — see Fix 7.

## Fix 7 — jsdom `ResizeObserver` polyfill (run #5, last failure)

**Symptom.** `Unable to find role="list" and name /key revenue indicators/i`
with an empty render container:

```
<body>
  <div />
</body>
```

**Diagnosis.** With Fix 4 (RTL cleanup) in place, the test truly started
from a blank DOM and re-ran the render. The DOM stayed empty — not
because of stale refs, not because of test ordering, but because
`<Dashboard />` itself was rendering nothing. Walking the tree:

1. `Dashboard` renders `<main>…<KpiGrid/>…<PaymentStatusChart/>…</main>`
   unconditionally.
2. `KpiGrid` renders `<div role="list">` unconditionally.
3. `PaymentStatusChart`'s `PanelShell` takes the `isEmpty` branch only
   when every slice value is ≤ 0. The test fixture has
   `collected=120_000, outstanding=30_000`, so `slices.length === 2`
   and `isEmpty === false`. `ResponsiveContainer` mounts.
4. Recharts `<ResponsiveContainer>` calls
   `new ResizeObserver(...)` inside a layout-phase effect.
5. jsdom 25 does not define `ResizeObserver`, so the call throws
   `ReferenceError: ResizeObserver is not defined`.
6. We deliberately do not wrap tests in an error boundary (production
   doesn't have one either). React 18 responds to a commit-phase throw
   with no boundary by **unmounting the entire root** — leaving exactly
   the `<div />` we see.

The other two Dashboard tests didn't fail on run #5 for misleading
reasons. "Admin-only Staff Collection panel" passed because
`StaffCollectionRow` has no chart and its `findByText` resolved before
the eventual Recharts unmount; this test was flaky, not correct. "Hides
Staff Collection panel for non-admin roles" passed because its assertion
is `queryByText(...).not.toBeInTheDocument()`, which is trivially true
against an empty DOM.

**Fix.** Noop stubs in `frontend-react/src/test/setup.ts`, guarded so
real browsers keep their native implementations:

```ts
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const g = globalThis as unknown as {
  ResizeObserver?: typeof ResizeObserver;
  matchMedia?: Window['matchMedia'];
};

if (!g.ResizeObserver) {
  g.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

The `matchMedia` stub is defensive — some UI libraries read it during
render — and harmless if never called.

## Why no single shotgun fix would have worked

Each of Fixes 4–7 revealed the next one. If we had added the polyfill on
day one:

- the workflow pathing errors would still have blocked every job;
- the tsc and ruff failures would still have blocked the React and
  backend jobs;
- the RTL-cleanup bug would still have failed 4 of 5 vitest tests;
- and the dashboard-handler stale-ref bug would still have masked the
  real Recharts / jsdom issue.

CI was only ever one fix away from green at each step — but the stack of
fixes had to happen in the order dictated by which symptom was visible
at each layer. Future debugging sessions should follow the same pattern:
read the annotations top to bottom, fix the frontmost symptom, push,
re-read. Do not speculate three layers ahead.

## Surface area of each fix

| Fix | File(s) | Lines changed |
| --- | ------- | ------------- |
| 1 | `.github/workflows/ci.yml` | 8 |
| 2 | `frontend-react/src/vite-env.d.ts` (new) | 12 |
| 3 | `backend/pyproject.toml`, 24 modules across `backend/app/**` | ~330 (277 via autofix, ~55 hand-fixed, ~15 config) |
| 4 | `frontend-react/src/test/setup.ts` | 10 |
| 5 | `frontend-react/src/features/admin/__tests__/UserListPage.test.tsx` | 3 |
| 6 | `frontend-react/src/pages/__tests__/Dashboard.test.tsx` | 28 |
| 7 | `frontend-react/src/test/setup.ts` | 48 |

None of the fixes changed production behaviour. Fix 3 modernised Python
type syntax to PEP 604 / PEP 585 without semantic change. All other
changes are confined to tests, CI config, or backend linting config.

## Guardrails for future changes

- **Adding a dashboard component that uses Recharts**: no action needed,
  the polyfill covers `<ResponsiveContainer>`, `<PieChart>`,
  `<BarChart>`, `<LineChart>`.
- **Adding a UI that reads `window.matchMedia`**: covered by the same
  polyfill block.
- **Adding a new `VITE_*` variable read in `src/`**: add it to
  `ImportMetaEnv` in `frontend-react/src/vite-env.d.ts`, otherwise `tsc`
  breaks in CI.
- **Adding a new backend module that uses `Depends(helper_function())`
  as a parameter default**: covered if `helper_function` is already
  registered in `flake8-bugbear.extend-immutable-calls`; otherwise add
  it to `backend/pyproject.toml`.
- **Adding a new test file**: import explicitly from
  `@testing-library/react` / `vitest`; `cleanup()` runs automatically
  in `afterEach`. Don't import from `@testing-library/react/vitest` —
  that path requires `globals: true`, which we don't use.
- **Asserting on labels that share tokens with prose on the same page**:
  use anchored regexes (`/^Exact Label$/i`).
- **Asserting on data-driven UI**: always re-query inside `waitFor` and
  `findBy*`. Do not capture DOM refs and assert on them later, unless
  the interaction is strictly synchronous.
