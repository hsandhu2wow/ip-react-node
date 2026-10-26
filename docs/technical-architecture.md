# Technical architecture and development

## October 26 branch integration

The Quick Facts parity branch introduces `SnackbarProvider` at the entry point
and `CardsPreviewProvider` / `TrendActionsProvider` in `QuickFactsLayout`.
Quick Facts cards now use generic-card export IDs and support seasonal/profile
content, recognition, feedback, NPS and preview/PDF/slide actions. Weekly
subscription and AI controls register through the shared trend-actions context.
These additions supersede earlier statements below that those surfaces were
absent; implementation is not evidence of Angular or all-BU acceptance.

`npm run build` now runs `scripts/prebuild.mjs` first. Cloud Build decrypts the
matching per-project configuration before the build; prebuild writes the
frontend allowlist into ignored `.env.production.local`. `src/config/theme.ts`
applies the configured title and theme assets. A local build without the
decrypted file uses defaults, not an authenticated BU deployment.

Integration retains dev's full-source coverage scope and threshold, restores
the now-used ETA/seasonal hooks removed by the earlier unused-code cleanup,
and keeps the obsolete generic `MetricCard` renderer deleted. Existing
regressions are reconciled with changed chart payloads, accessible tab/date
controls, generic API mapping and print-preview behavior rather than discarded.
Wireframes are not changed by this integration.

Reviewed October 14, 2026 against React `c97525f` and Angular `02a9cf698`;
Weekly Facts/My Plan contracts reviewed again October 21 at the same HEADs;
initial migration work started October 23 on `feat/weekly-facts-myplan-parity`,
with hierarchy/projection/dialog updates on October 26.
This describes the **current implementation**. Required changes are tracked in
the [status report](migration-status.md) and
[migration plan](superpowers/plans/2026-10-14-angular-react-migration.md).

## Runtime boundaries

```text
Browser
  React Router + AuthProvider (currently demo identity)
    AppShell
      QuickFactsLayout + FilterProvider
        FilterBar + route page
          Query hooks -> typed API functions -> Axios
            /api -> existing Python/backend services
```

`src/main.tsx` creates a React root in StrictMode, BrowserRouter and one
QueryClientProvider. The QueryClient retries queries three times with a
one-second delay. `src/App.tsx` mounts AuthProvider, AppShell and the routes.
StrictMode performs development checks; it is not an Angular change-detection
or authentication replacement.

The stack's major versions are React 19, Router 7, Query 5, TypeScript 6,
Vite 8 and Chart.js 4. Use `package-lock.json` for exact resolved versions,
not old June specs or comments referring to Vite 7.

| Directory | Responsibility |
|---|---|
| `src/api/` | Axios instance and endpoint wrappers |
| `src/context/` | Demo identity and shared filter state |
| `src/hooks/` | Query lifecycles and card derivation |
| `src/pages/` | Route-specific composition |
| `src/components/` | Navigation, filters, cards, tables and modal presentation |
| `src/types/` | SQF/Weekly backend response declarations |
| `src/utils/` | Period/axis/tree/table transformations, formatting and HTML tooltips |
| `src/styles/globals.css` | Theme/layout variables and global backend-HTML classes |
| `public/assets/images/` | Two data-refresh state illustrations |

## Routing and identity

`src/App.tsx` implements summary, details, Weekly and My Plan beneath
`/quick-facts`. The route shell provides shared filter state while moving
between these child routes. Other registered top-level application routes
render Coming Soon; unknown routes redirect to Quick Facts.

The desktop/mobile navigation maps **Trend** to `/quick-facts/weekly`;
**Weekly** still points to `/weekly` and shows a Soon marker. My Plan has a
route but no implemented Weekly/My Plan switch in `TrendPage`.

`AuthContext.tsx` supplies `{ name: 'Demo User', portal: 'WW' }` and
`isAuthenticated: true`. There is no user bootstrap, source role/feature/CFC
model or genuine account switch/logout. Real authorization remains a migration
prerequisite, not something `withCredentials` or `ProtectedRoute` already solves.

## Filter state and data flow

`FilterContext.tsx` owns flattened permitted-tree data, selected node,
date-only string, reporting period and breakdown axis. Setters update the
query string with replacement navigation:

| Field | Initialization | URL key |
|---|---|---|
| Location | Restored code or first selectable node after hierarchy loads | `code` |
| Date | Supplied string or yesterday | `date` |
| Period | `YDAY` only when explicitly supplied; otherwise `WTD` | `period` |
| Axis | `department` only when supplied; otherwise `childLevel` | `axis` |

Initialization does not automatically write default code/date into the URL.
URL values are read during initialization; this is not a complete
back/forward-history synchronization mechanism. Page/sidebar links also do
not explicitly preserve the current search string. State can survive while
the provider remains mounted even when its URL representation is lost.

Flow: FilterBar calls `useFilterTree`; its effect invokes `initTree`, which
processes parent references/selectability. Enabled summary/detail queries then
fetch cards for the selected location/date. Summary enrichment combines active
period cards with card-status detail availability. Pages filter hidden cards,
then order/render them. Details also computes drill-down availability.

The backend's server-defined hierarchy, hidden/nonclickable flags and
`apiDepth` must remain authoritative. An empty/invalid hierarchy currently
leaves `isLoaded` false; the filter has no explicit hierarchy-error UI.

## Queries, caching and period selection

| Hook | Query key | Freshness / lifecycle |
|---|---|---|
| `useFilterTree` | `['sqf', 'filter-tree']` | `staleTime` and `gcTime`: Infinity |
| `useCardStatus` | `['sqf', 'card-status']` | Both Infinity |
| `useSummaryCards` | `['sqf', 'summary-cards', depth, code, date]` | Immediately stale; enabled after hierarchy readiness |
| `useDetailsCard` | `['sqf', 'detail-card', metric, depth, code, date]` | Immediately stale; also requires metric |
| `useTrendData` | `['trend', metric, code]` | Immediately stale; no SQF date/depth parameter |

`staleTime: 0` means cached data is immediately stale, **not no caching**.
Mount/focus/reconnect and query-option behavior can trigger refetch. Infinite
cache keys currently omit identity/portal; real account switching will need
source-equivalent isolation/invalidation.

`normalizePeriods` accepts a legacy array as WTD, or period-keyed arrays/
`{ cards, sortBy }` values. Invalid values are dropped. A top-level
`{ cards, sortBy }` wrapper is not supported. `usePeriodCards` derives:

```text
cards, activePeriod, availablePeriods, hasMultiplePeriods, sortBy
```

If the selected period is absent, it derives a fallback but **does not update
FilterContext or the URL**. Until data arrives, the period control remains
visible. Period is not part of the HTTP query key; changing it alone selects
already-fetched data. A dedicated network-level parity test is still needed.
The October 8 spec's context-writeback and query-`select` descriptions are
intent, not the actual implementation.

## API contracts

`src/api/client.ts` uses `VITE_API_URL`, cookie credentials and a 30-second
timeout. Set `VITE_API_URL=/api`; there is no code fallback to that value.
These paths are relative to that base:

| Method/path | Wrapper |
|---|---|
| GET `/sqf/getUniversalFilterGeneric` | `getUniversalFilter` |
| GET `/sqf/getSQFMetricCardsStatus` | `getSQFCardStatus` |
| GET `/sqf/summaryCards/<depth>/<date>[/code]` | `getSummaryCards` |
| GET `/sqf/detailCard/<metric>/<depth>/<date>[/code]` | `getDetailCard` |
| GET `/wf/<code>` | `getWeeklyFacts` |
| GET `/myPlan/<code>` | `getMyPlan`; preserve case |

Depth zero omits the code segment. Summary/details types allow period-keyed
responses or arrays. Type declarations are not runtime response validation.
Auxiliary/data failures must not silently be interpreted as empty successful
pages when closing parity gaps.

Unused ETA/seasonal hooks, their API wrappers and ETA-only types were removed
during cleanup. These source features still require an integrated implementation;
their removal does not change current page requests.

## Rendering and interactions

SummaryCard/DetailsCard are the route card renderers. The `MetricCard/`
directory retains their shared chart/table/tab/skeleton presentation; the
obsolete generic MetricCard renderer and its private header/KPI/footer/error
components have been removed.
`useAxisCard` resolves nested content using backend `hierarchy`,
`department`/`proposition`; unrelated dimensions choose their first option.
It retains the last resolved content for the same card name when a subsequent
axis is unresolved. Legacy cards retain their per-card selectors.

Details sorting starts A–Z, can be seeded by recognized backend sort labels
and supports numeric high/low. Breadcrumbs are text, not navigable ancestors.
CardSidebar renders SummaryCard without the selected axis. These surfaces need
comparison together, not independent screenshot approval.

The shared basic table handles nested expansion, HTML headers/cells, footer
rows and frozen-column shadows. It displays the backend sort indicator but
does not actually sort rows or offer clickable sort headers.

MetricCardChart converts custom datasets to Chart.js and supports bar/
horizontal bar/pie/doughnut. `gauge` currently uses Doughnut and excludes the
`needle` dataset; this does not establish source gauge parity.

TrendPage selects card views/history, renders the grouped/KPI table and
variance CSS. The October 23 slice uses response-defined `dateFilterKey`
(default weekNo), root variance defaults and each table's KPI/defaultExpanded
configuration. Page selections/variance reset on changed response identity or
metric; expansion resets on changed tables. The October 26 `trendSelection.ts`
boundary owns desktop view/date/hierarchy state, source-specific fallback and
retention of the displayed table on unmatched filters. Page hierarchy controls
follow `allowedViews`; child/peer controls follow each card's toggle key and
retain their selection across loads. Full source load/viewport lifecycle and
card-level Half Year remain incomplete. Banner/AI/mobile/subscription
configuration in types is not equivalent to implemented UI.

### Weekly Facts/My Plan: reviewed source contract and target boundary

The [focused assessment](weekly-facts-myplan-parity.md) and
[implementation plan](superpowers/plans/2026-10-21-weekly-facts-myplan-parity.md)
document the full port. Desktop selection and Weekly information dialogs are
partially implemented; AI, qualified trend fixtures and browser tooling remain
planned. The dated progress register distinguishes these stages.

The existing Python Weekly registry remains authoritative for measures, view
order, HTML and settings. Local SI GET responses confirmed generic history
keys `monthNo`/`halfNo`, array hierarchy variants, object My Plan trend contents,
card-level Half Year selection and My Plan's variance-true default.
October 23 corrections model hierarchy/AI/card fields, object alerts,
`{displayText,link}` links and dynamic history properties. Subscription API
functions now read/save through `/wf/...` or lowercase `/myplan/...` with
JSON-string FormData arrays and natural rejection propagation. These wrappers
are not yet wired into a preferences dialog. `available_views` contains card keys, joined to card
labels when constructing the subscription dialog; it is not the dialog's
checkbox-object array.

The selection boundary must still add card-level My Plan Half Year and
mobile preview/committed state without changing desktop rules. The table
boundary now uses original-column membership, source KPI substring matching,
empty-group guards and singleton group spacers. Its optional typed display
context adds desktop child/peer and mobile parent/child/hierarchy/date/WFM
projection; the page wires desktop controls only. Original column IDs also
associate sparse rows with their headers. WFM/double-goal/three-column layout,
mobile state wiring and computed sticky geometry remain open. Global backend-HTML styles and external per-BU theme variables
remain separate from CSS Module layout. Shared auth/filter/action adapters
must be integrated rather than reimplemented inside TrendPage.

There is no proven exhaustive enabled-BU list in frontend source. Identity,
app_settings, permitted hierarchy, stored page JSON and deployed theme assets
determine each profile. Source-specific SI/METRO/BIGW/PEL/360FM/PEOPLE branches
are inventoried; other deployment families and actual feature enablement need
authorized confirmation. Current saved fixtures cover SQF only and no
cross-BU browser parity has been measured.

InfoModal renders backend HTML with close-button/backdrop dismissal. Its
current width is 90%, maximum 480px, maximum height 80vh and scrollable body.
No Escape handler, focus trap or focus restoration is implemented here.
It is not an implementation of Angular's separate feature-alert acknowledgment
dialog. That missing workflow changed on October 13; see the status report for
its 720px component, viewport panel constraints and source scrolling caveat.
Weekly's source `WFPopupComponent` is another distinct popup contract.
The new `TrendInfoDialog` implements Weekly Metrics Info and header/cell alert
actions with trusted HTML, source icon mapping, maximum 530px by 648px sizing
and no initial autofocus. Its portal owns keyboard/backdrop dismissal, scroll
locking, focus trapping and restoration; it is cleared on page-response/metric
changes. Optional refresh metadata is supported at the component boundary;
composed mobile information remains future work. Structured Axios errors show
the backend title/message/support email and remove stale page content, retaining
an explicit fallback for errors without a response body.
Angular SQF card Metrics Info uses `QfPopupComponent` (maximum 530px by 648px,
`autoFocus: false`, info icon and its body-HTML transformation). The current
React modal is not yet equivalent in sizing, icon, HTML handling or focus options.

Backend cell, tooltip and modal HTML uses `dangerouslySetInnerHTML`/`innerHTML`
with global classes. `htmlTooltip.ts` reuses one floating panel and caches
sticky-column boundaries. This is a trusted-backend HTML boundary, not
sanitization; do not pass arbitrary user content through it.
Compare Angular's actual HTML transformation/sanitization path before claiming
that rendering the same markup preserves the source contract.

## Known operational limits

Feedback/download are disabled; recognition only runs a timer; print invokes
`window.print()`. Trend Metrics Info/subscription text is inert. No analytics
adapter or source event dispatch was found.

Card errors show refresh/support information, but pages use generic query
errors and lack full source bootstrap/permission/auxiliary-error handling.
ETA requests and expected-refresh enrichment are not implemented in either
page. Reintroduce them together with source-equivalent behavior and focused tests.

## Tooling, tests and deployment

There are 33 `.test.ts`/`.test.tsx` files: 15 component, 7 utility,
4 hook, 4 page, 1 context, 1 API and 1 application integration test file. Vitest uses jsdom, globals and
`src/test/setup.ts`. No browser differential runner or checked-in CI test job
is present. `cloudbuild.yaml` builds/deploys but does
not run tests or lint. `npm run lint` has no tracked ESLint configuration.

The [README](../README.md#commands-and-tests) lists commands. Removal of the
obsolete MetricCard's five tests leaves the active card suites unchanged.
The October 20 test expansion passed 248 tests across 33 files; the October 23
foundation passed 267 tests. The October 26 continuation passes 293 tests in
35 files, adding hierarchy/projection/dialog/error cases. Existing cutoff tests
use a fixed UTC clock with user approval, avoiding an after-22:00 wraparound
failure without changing formatter behavior.
New query tests
exercise real React Query hooks and API wrappers with mocked HTTP transport,
covering filter changes, request gating, errors and cached hierarchy/status.
Page tests render real card components while controlling query/filter state.
Calendar, location tree and HTML tooltip tests exercise user interactions and
positioning with explicit geometry fixtures, not real browser layout.
The second pass covers chart data/legacy datasets, bar labels and tooltips,
nested-table expansion, frozen-column scroll shadows and tab switching.
Chart tests mock `react-chartjs-2` at the canvas boundary and inspect the actual
transformed data/options and callbacks. They do not certify chart pixels or
gauge parity. FilterContext tests use its real provider and MemoryRouter to
exercise hierarchy initialization, URL restoration and parameter preservation.
`App.test.tsx` renders the real application/provider/query stack with HTTP
transport mocked using `src/test/fixtures/sqf-api.sanitized.json`. This fixture
was captured from the running local `/api` endpoints (hierarchy, card status,
summary and sales details) on October 20. Both WTD and YDAY are retained;
only one metric, two subcards/rows/columns/KPIs and one hierarchy branch remain.
Original locations/identifiers, text, values and timestamps were replaced;
chart payloads were omitted. The fixture preserves uppercase card types,
string-valued generic flags, nested breakdown keys and table flags from the
responses. It records provenance but no credentials or raw response bodies.
Tests run offline, not against a live or production backend.

`npm run test:coverage` uses `@vitest/coverage-v8` and the configuration in
`vitest.config.ts`. It includes all `src/**/*.{ts,tsx}`, including unimported
application files, excluding tests, setup and type declarations. Text, HTML
and JSON summaries are written under ignored `coverage/`. A global line threshold
of **95.01%** is enforced. Other coverage metrics have no enforced threshold.
The October 26 measured result is 97.88% lines, 96.85% statements,
90.34% branches and 97.73% functions, versus 58.37% initial line coverage
with the same scope. CSS and Angular/browser parity remain outside this metric.

Cleanup also removed unimported Vite starter styles/assets, unused barrel
exports, the unreferenced color-variable map, unused local card selectors and
the unused chart annotation dependency. Global styles used by backend HTML
and dynamic tooltip content remain intact.

Vite's development server proxies `/api` to port 8080. Production builds to
`dist/`; the preview server has no configured API proxy. Cloud Build uses Node
22 for `npm ci`/build, then deploys `app.yaml` and shared `dispatch.yaml`.

App Engine `ip-react` uses the `python312` runtime for configured static
handlers; this repository does not contain the backend Python application.
`/assets` has immutable one-year caching; the SPA fallback serves
`dist/index.html`. Dispatch routes `/api/ps/*`, `/api/widget/*`, `/api/act/*`
to their services and remaining `/api/*` to `default`.

Check build-time API configuration, authenticated origin/cookies/IAP,
deep-link/error dispatch and static assets in an authorized staging environment.
In particular, refresh SVGs live at `public/assets/images/` while `/assets`
maps to `dist/assets`; the favicon handler expects a file not currently tracked.
Source structure alone does not prove deployment behavior or production
authorization. Never change shared dispatch merely to test documentation.
