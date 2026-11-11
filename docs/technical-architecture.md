# Technical architecture and development

Reviewed November 2, 2026 against implementation `16e8c6f`. This describes
the current React frontend. The [migration strategy](migration-strategy.md)
describes intended benefits and delivery gates; [ADRs](decisions/README.md)
explain decisions. Older source assessments remain dated evidence.

## Runtime boundaries

```text
Browser
  main.tsx: theme bootstrap + StrictMode + BrowserRouter
    QueryClientProvider + SnackbarProvider
      App: AuthProvider (demo identity)
        AppShell: navigation and route content
          /quick-facts -> QuickFactsLayout
            FilterProvider
              TrendActionsProvider
                CardsPreviewProvider
                  FilterBar + TrendBanner + Outlet + Footer
                    Quick Facts Summary / Details
                    or TrendPage(metric=weekly | myPlan)

Query hook / action -> typed endpoint function -> shared Fetch transport
  /api -> Vite development proxy or deployed dispatch -> existing Python APIs
```

This is a client-rendered Vite application, not SSR and not a Node backend.
`src/main.tsx` creates one QueryClient with three query retries and a
one-second retry delay. StrictMode's development effect checks require proper
cleanup/deduplication; they do not supply authentication or permissions.

### Directory ownership

| Directory | Responsibility |
|---|---|
| `src/app/` | Routes, shell/navigation/filter composition, theme bootstrap |
| `src/features/quick-facts/` | Summary/details, cards, query/API mapping and card-specific transforms |
| `src/features/trend/` | Weekly/MyPlan page, selection/projection, tables/dialogs, actions, endpoints and wire types |
| `src/shared/api/` | Fetch client and common feedback/NPS/recognition/user endpoints |
| `src/shared/context/` | Demo identity and shared URL-backed filter state |
| `src/shared/components/` | Common dialogs, previews, recognition and snackbars |
| `src/shared/types/` | Card/hierarchy wire declarations also used by filters/exports |
| `src/shared/utils/` | Formatting, tree/table helpers, analytics, capture/export and HTML tooltip infrastructure |
| `src/styles/` | Global runtime theme variables and literal backend-HTML classes |
| `src/test/` | Vitest lifecycle, MSW infrastructure and sanitized fixtures |

App composes features/shared; features depend on shared. Shared runtime code
must not depend on app/features. Keep tests and `.module.scss` beside their
owner. These are conventions, not an automated dependency-boundary check.

## Routing and identity

[App.tsx](../src/app/App.tsx) defines:

| Route | Current destination |
|---|---|
| `/quick-facts` | Redirect to summary |
| `/quick-facts/summary` | `SummaryPage` |
| `/quick-facts/details/:type` | `DetailsPage` |
| `/quick-facts/weekly` | `TrendPage` with metric `weekly` |
| `/quick-facts/myplan` | `TrendPage` with metric `myPlan` |
| `/weekly`, `/trend`, `/dashboards` | Coming Soon |
| `/pricing-simulator`, `/availability-navigator` | Coming Soon |
| Other paths | Redirect to `/quick-facts` |

Do not infer route implementation from its navigation label; the top-level
`/weekly` and `/trend` routes are not the implemented trend pages.

[AuthContext](../src/shared/context/AuthContext.tsx) supplies a demo user,
`isAuthenticated: true`, and a reload-based logout. Its portal reads
`VITE_PORTAL`, defaulting to `SI`. `ProtectedRoute` is not production
authorization. Real identity/bootstrap, permissions and feature/CFC gating
remain migration work.

## State ownership and filter data flow

| State | Owner | Important boundary |
|---|---|---|
| Remote pages/configuration | TanStack Query hooks | Cache keys/readiness policies determine requests |
| Common location/date/period/axis | `FilterContext` and router search parameters | Not a second server-data cache |
| Trend desktop/mobile selection | `TrendPage` with pure `trendSelection` helpers | Separate selection per viewport mode |
| Trend actions/banner | `TrendActionsContext` registration | Clear registration on loading/error/unmount |
| Current cards to export | `CardsPreviewProvider` / page registration | Capture uses stable DOM IDs and preview classes |
| Dialog open, draft menu, sort, expansion | Owning component | Reset/retain according to source behavior |
| Analytics user details | Shared user API's module-level promise | Not the authenticated provider or a Query cache |

The [filter provider](../src/shared/context/FilterContext.tsx) derives values
from current search parameters on render; URL navigation can update them.
This supersedes earlier documentation saying parameters were read only at
initialization.

| Field | URL key | Default/fallback |
|---|---|---|
| Location | `code` | Matching permitted tree node, otherwise first selectable node |
| Date | `date` | Yesterday calculated when the provider mounts |
| Period | `period` | `YDAY` when requested, otherwise `WTD` |
| Breakdown | `axis` | `department` when requested, otherwise `childLevel` |

Setters preserve other parameters and use replacement navigation. Breakdown
selection also increments `breakdownAxisChangeCount`, including repeated user
selections. Missing defaults are not automatically written to the URL.

`useFilterTree` obtains hierarchy; `initTree` processes it, adds parent
references and stores a flattened tree. Page queries wait for readiness.
An empty/invalid response leaves the provider unloaded; complete hierarchy-error
UX is not established. Treat the server's `apiDepth`, hidden/nonclickable and
selection flags as contracts, not values to recalculate from display labels.

## Queries, caching and period selection

| Hook | Key | Freshness / readiness |
|---|---|---|
| `useFilterTree` | `['sqf', 'filter-tree']` | Infinite stale/GC times |
| `useCardStatus` | `['sqf', 'card-status']` | Infinite stale/GC times |
| `useSummaryCards` | `['sqf', 'summary-cards', depth, code, date]` | Stale immediately; hierarchy loaded and enabled |
| `useDetailsCard` | `['sqf', 'detail-card', metric, depth, code, date]` | Stale immediately; loaded and metric present |
| `useTrendData` | `['trend', metric, code]` | Stale immediately; loaded and code present |
| `useDataLoadETA` | `['sqf', 'data-load-eta']` | Five-minute stale, ten-minute GC |
| `useCFCChildCodes` | `['sqf', 'cfc-child-codes']` | Infinite stale/GC; caller readiness |
| `useSupportEmail` | `['support-email', 'SQF']` | Infinite stale time |
| `useSeasonalCard` | SQF seasonal + mode/depth/code/date/config/CFC data | Conditional availability/CFC readiness |

`SummaryPage` also queries store profiles by selected code for METRO/PEL at
Store level. See the [feature guide](feature-guide.md) for composition.

`staleTime: 0` does not disable caching. Mount/focus/reconnect behavior can
refetch stale queries. Query keys currently do not fully isolate real
identity/portal switching; bootstrap/cache invalidation must be designed with
real account handling. Query signals are not currently forwarded by every
hook even though the transport supports a caller signal.

`usePeriodCards` normalises legacy arrays to WTD and supported WTD/YDAY
period-keyed payloads. It derives available/active periods and sort metadata.
If the selected period is absent, it uses an available period without changing
the URL/context. Period and breakdown are not HTTP query-key fields: selecting
them projects already-fetched cards. The MSW query integration test exercises
request reuse for period/axis changes.

## API contracts

[client.ts](../src/shared/api/client.ts) uses native Fetch with the configured
`VITE_API_URL`, `credentials: 'include'` and a 30-second timeout. There is no
automatic `/api` fallback; development setup must configure it.

Endpoint functions retain `client.get<T>` / `client.post<T>` returning
`{ data }`; they usually return the decoded body to callers. Non-2xx
responses throw `HttpError` with status/payload. Explicit text, legacy
JSON-with-text-content-type, empty responses and multipart behavior are
covered by HTTP tests. Network/timeout/cancellation failures reject.

Types are compile-time expectations, not runtime schema validation.
Several legacy adapters intentionally map failures to display models or
empty values; those are described, not recommended as a general error policy,
in the [API reference](api-reference.md). TanStack Query is not the HTTP client.

## Rendering and interactions

### Quick Facts

Summary/details use status configuration, period selection and ETA enrichment.
Generic cards gain stable `jsId` export IDs. Seasonal adapters map legacy
payloads; profile cards have portal/level gates. `SummaryCard` and
`DetailsCard` use chart/table/tab/skeleton presentation from the `MetricCard`
directory, not an additional generic MetricCard renderer.

Details preserve API card order until a user sort, with source-specific
seasonal defaults and display metadata. Card sorting, table sorting and
breakdown projection are separate operations. Basic tables support sort
interaction; nested tables disable header interaction while retaining initial
API sorting. Chart conversion includes bar/horizontal bar/pie/doughnut and a
gauge needle plugin. Rendered pixels still need browser qualification.

### Weekly Facts / My Plan

One `TrendPage` handles both metrics. `trendSelection.ts` owns view/date/
hierarchy matching, dynamic history keys and previous-table retention on
unmatched filters. Mobile state includes a preview/commit menu and card-level
My Plan Half Year. `tableTransform.ts` projects child/peer and mobile columns;
`TrendTable` uses original column IDs, header association and KPI grouping.

The page registers banner/subscription/AI actions into the shared shell.
Metrics info and cell/header alerts use `TrendInfoDialog`. Subscription
preferences, AI feedback, analytics, configured links and preview registration
are wired; they are not all-BU-qualified. Read the
[feature guide](feature-guide.md#weekly-facts-and-my-plan) before changing
source-specific selection or responsive rules.

### Shared actions and external boundaries

Feedback/NPS and recognition use multipart endpoint functions. Preview captures
cards or whole trend pages, then routes to PDF/download, print, Slides or
recognition. Google Slides additionally requires public client configuration,
SDK loading, OAuth consent and authorized backend image endpoints. Tests mock
these external boundaries; they do not grant actual service access.

`sendQFDataToAnalytics` pushes the `quick_facts_element_click` envelope to
`window.dataLayer`. The user-details endpoint's cached promise is separate
from real login. Do not add actual employee information to public fixtures.

## Styling and HTML trust

Scoped layout uses SCSS Modules; `src/styles/globals.css` and injected
`env.css` retain runtime variables and literal backend classes. Export
selectors and DOM IDs are behavioral contracts as well as styling details.

Backend tables, tooltip and information-dialog HTML are not uniformly
sanitized. `TrendBanner` specifically uses DOMPurify; that does not make
every `dangerouslySetInnerHTML` surface safe for arbitrary content.
Preserve the documented source boundary, inspect each surface and do not
introduce user-controlled HTML without an explicit trust/sanitization design.

## Tooling, tests and deployment

Vitest uses jsdom for UI tests and Node for multipart HTTP tests. MSW rejects
unhandled requests. V8 coverage includes all executable application TS/TSX,
excluding tests, test infrastructure and type directories; the line threshold
is 95.01%. See [testing](testing.md) for commands, fixture provenance and limits.

`npm run docs:check` validates maintained documentation using Node-only
regressions and a local-link checker. `npm run check:code` chains coverage and
build; `npm run check` also runs documentation checks. These commands do not
add CI, lint or browser qualification.

`npm run build` runs prebuild, TypeScript and Vite. Current deployment serves
`dist/` on App Engine with existing API dispatch; it is not FastAPI/Cloud Run.
Cloud config decryption is temporarily disabled pending KMS permission.
See [operations](operations.md) for configuration precedence and release checks.

There is no tracked ESLint configuration, checked-in browser parity runner
or Cloud Build test step. These limits and the large-chunk warning are not
resolved by the framework migration.
