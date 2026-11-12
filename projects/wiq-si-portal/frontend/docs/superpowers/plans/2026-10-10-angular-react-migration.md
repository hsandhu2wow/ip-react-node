# Angular-to-React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans for an approved, bounded implementation slice. Steps use checkbox (`- [ ]`) syntax for tracking. This document is a programme-level migration plan, not authorization to implement the entire platform in one run.

**Goal:** Recreate the pinned Angular Store Insights application in React with
one-to-one routes, permissions, data, behavior, analytics and responsive visuals.

**Architecture:** Retain the existing React frontend and Python backend.
Migrate complete vertical slices behind source-equivalent permissions, using
typed API adapters, shared contexts, query hooks and existing components.
Angular at the pinned commit is authoritative; reconcile local React work
before editing.

**Tech Stack:** React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5,
Axios, Chart.js 4, CSS Modules, Vitest and React Testing Library. Browser
differential tooling is a planned addition, not currently installed.

---

## Scope and execution rules

Approved [design](../specs/2026-10-10-angular-react-migration-design.md) and
[analysis](../../angular-react-parity-analysis.md) supply the source baseline
and gap matrix:

- Angular `dbd096cd36c457531f7d3ffd6e6b6fa9176d6c02`.
- React `c97525f268befdc68446c7c864a9f2c79b279d5c`, plus separately tracked
  in-progress work that must not be overwritten.
- All Angular route families are in the migration inventory. Older deferrals
  are not permanent exclusions.
- No backend rewrite, redesign, altered API verbs/casing or frontend identity
  bypass. Externally hosted applications may retain their service boundary,
  but their entry, permissions and interaction contracts still need parity.
- This task produces documentation only. No application changes, dependency
  installation, deployment or commits are authorized by this planning pass.

This platform spans independent applications. Each stage below is a separate
delivery slice; larger stages are decomposed into the listed tasks. Before
coding an untraced application, complete its source-specific design and
implementation plan rather than inventing data types or endpoint behavior.
Do not interpret inventory coverage as implementation readiness.

For each coding task: add a focused behavior test, observe its failure,
implement only that behavior, run the targeted suite, then build. Keep
acceptance evidence with the slice and update the parity report. Commit only
the intended files when committing has been separately authorized.

## File responsibility map

| Surface | Existing or proposed target | Responsibility |
|---|---|---|
| HTTP/auth bootstrap | `src/api/client.ts`; proposed `src/api/user.ts` | Existing cookie/IAP-backed user and bootstrap endpoints; no fabricated headers |
| Identity/permissions | `src/context/AuthContext.tsx`; proposed `src/types/user.types.ts` | Real user, roles, feature flags and identity lifecycle |
| Routes/shell | `src/App.tsx`, `src/components/layout/{AppShell,SideNav,MobileNav}/` | Landing, route compatibility and permission-aware chrome |
| Shared SQF state | `src/context/FilterContext.tsx`, `src/hooks/useFilterTree.ts` | Permitted location/date/period/axis state |
| SQF contracts | `src/api/sqf.ts`, `src/types/sqf.types.ts`, `src/utils/periods.ts` | Response variants and period sort metadata |
| SQF rendering | `src/pages/quick-facts/`, `src/components/cards/` | Summary/details/drill-down and card variants |
| Dates/formatting | `src/utils/formatters.ts`; in-progress `src/utils/eta.ts`, `tableSort.ts` | Reporting dates, UTC timestamps, ETA and stable sorting |
| Weekly/MyPlan | `src/api/trend.ts`, `src/types/wf.types.ts`, `src/hooks/useTrendData.ts`, `TrendPage.tsx`, `TrendTable.tsx` | Source-configured views and table/action flows |
| Analytics | Proposed `src/utils/analytics.ts` | Central source-equivalent event dispatch |
| Other applications | Proposed `src/pages/{quick-assist,dashboards,bqf,my-metrics,admin,help,price-simulator,act}/` | Route-specific applications; detailed files decided in each slice design |
| Differential acceptance | Proposed `tests/parity/`, `playwright.config.ts` | Same-fixture browser interactions and approved screenshot comparison |

Do not duplicate existing period, axis, tree, formatting or table helpers.
Do not move shared presentation into a new abstraction merely because another
framework used a service or module.

## Dependencies and delivery gates

| Stage | Prerequisites | Deliverable |
|---|---|---|
| 0: baseline/evidence | None | Frozen route, role, payload and scenario inventory |
| 1: identity/routes/shell | Stage 0 | Authorized bootstrap and faithful navigation |
| 2: recent SQF regressions | Stage 0 contracts; Stage 1 for identity-sensitive acceptance | Complete period/axis/date/analytics behavior |
| 3: cards/actions/Quick Assist | Stages 1–2 | Complete Daily/details and Quick Assist slices |
| 4: Weekly/MyPlan | Stage 1; shared filters/actions from Stages 2–3 where reused | Fully interactive desktop/mobile weekly experience |
| 5: remaining applications | Stage 1; each application's source inventory | Dashboard, BQF, My Metrics, Admin, Help, ACT and Price Simulator |
| 6: cutover | All enabled application slices | Cross-feature parity and production-like deployment acceptance |

Stages 3–5 can contain independent workstreams only after shared identity,
route and contract boundaries are agreed. Avoid concurrent edits to the same
contexts/shell.

## Stage 0 — Freeze evidence before further migration

### Task 1: Baseline and traceability ledger

**Read:** Angular `src/app/app-routing.module.ts` and feature routing modules;
React `src/App.tsx`; both manifests and histories.  
**Modify:** `docs/angular-react-parity-analysis.md`.

- [ ] Record both actual HEADs/branches and `git status --short`; preserve local
  application work. Do not restore either repository to the historical commit.
- [ ] Expand the route matrix into scenario IDs for each root/child route,
  query-string variant, landing priority, permission denial and deep link.
- [ ] Associate July–October source changes with a target task and scenario.
  Keep later source commits in a separate delta ledger until the baseline is
  deliberately advanced.
- [ ] Capture source defaults, breakpoint boundaries, event payloads, response
  fixtures and API verbs for the first slice. Use sanitized/authorized data,
  never production credentials or real employee identity fixtures.
- [ ] Record observations as source-confirmed, runtime-confirmed, missing,
  in-progress or unexamined; never use a passing smoke test as parity evidence.

**Gate:** Every inventoried Angular route and recent behavior has an owner/task
and an acceptance scenario. Untraced applications are explicitly identified.

### Task 2: Establish contract and differential acceptance foundations

**Modify:** `src/utils/periods.test.ts`.  
**Create during implementation:** sanitized fixtures under
`src/test/fixtures/sqf/`; approved browser runner/config under `tests/parity/`.
**Read:** Angular `sqf-cards.service.ts`, `ISQFMetricCard.d.ts`,
`backend/sqf/metric_card_v2.py`.

- [ ] Add focused normalization cases for legacy arrays, legacy top-level
  wrappers, period arrays, period wrappers, single-period results, mixed
  error/success cards and sort metadata. First reproduce the confirmed
  top-level wrapper gap in the existing test file:

```ts
it('normalizes a legacy top-level wrapper without dropping cards or sort metadata', () => {
  const card = { cardName: 'sales', cardTitle: 'Sales' }
  const result = normalizePeriods({ cards: [card], sortBy: 'za' })
  expect(result.periods.WTD).toEqual([card])
  expect(result.sortBy.WTD).toBe('za')
})
```

- [ ] Run `npm test -- --run src/utils/periods.test.ts`. The new wrapper case
  should fail at the committed React baseline. If local work already fixes it,
  preserve that work and record the regression as covered.
- [ ] Implement the narrow normalization correction in `src/utils/periods.ts`
  using `src/types/sqf.types.ts`; preserve existing supported shapes and surface
  malformed-response failures through the established query/page error flow.
- [ ] Run the same suite again; all period cases must pass without changing
  legacy-array semantics. Run `npm run build`.
- [ ] Add a browser differential runner only after changing its dependency
  manifest. Configure Angular and React base URLs and one shared
  authorized/sanitized fixture source. Freeze clock/timezone, viewport, fonts,
  chart animation and payload so screenshots compare the same state.
- [ ] Store scenario metadata and screenshots locally or in approved artifact
  storage. Baseline images come from the pinned Angular app, not wireframes.

**Gate:** Both browser apps can execute the same summary/details scenario.
Unit fixture success alone does not satisfy this gate.

## Stage 1 — Identity, permissions, routes and shell

### Task 3: Replace demo authentication with source bootstrap

**Source:** Angular `app.module.ts`, `services/user/user.service.ts`,
`services/auth-guard.service.ts`, `backend/common/{auth,user_helper}.py`.  
**Targets:** `src/context/AuthContext.tsx`, `src/api/client.ts`, proposed
`src/api/user.ts`, `src/types/user.types.ts`,
`src/context/AuthContext.test.tsx`.

- [ ] Define the user contract from actual `getUserdetails` responses and
  numeric role/feature flags; obtain CFC restrictions through the source endpoint.
- [ ] Write bootstrap loading, authorized, unauthorized, inactive-user and
  request-failure tests. Assert gated children never flash before bootstrap.
- [ ] Implement source-equivalent cookie/IAP identity handling, real account/
  logout behavior, and explicit failure/denied states. Never send a
  frontend-generated trusted IAP header.
- [ ] Test `wf` plus separate Weekly/MyPlan flags, `psf_enabled`, admin,
  portal variants and CFC restrictions. Clear identity-sensitive cached
  hierarchy/card data on source-equivalent account/session changes.
- [ ] Run `npm test -- --run src/context/AuthContext.test.tsx` and
  `npm run build`; compare allowed/denied behavior in both applications.

**Gate:** No stub-auth path remains in an accepted enabled feature.

### Task 4: Route and permission-aware shell parity

**Source:** Angular root/feature routers, chrome components, assets/styles.  
**Targets:** `src/App.tsx`, AppShell/SideNav/MobileNav and tests; proposed
`src/App.test.tsx`; portal theme/asset files.

- [ ] Add tests for source landing priority: SQF, Quick Assist, My Plan,
  Weekly, then Dashboards. Cover missing permissions and direct route loads.
- [ ] Register source route names and child paths. Preserve `/price-simulator`
  and `/act/avnav`; existing React spellings may be explicit compatibility
  aliases, not replacements. Do not route a missing application silently to
  summary and call it migrated.
- [ ] Reconcile earlier React nav decisions with the source; match enabled
  entries, active state, portal labeling, user/help actions and mobile drawer.
- [ ] Verify existing query names and browser back/forward behavior using
  source links. Do not assume React's extra period/axis URL state is equivalent.
- [ ] Run `npm test -- --run src/App.test.tsx
  src/components/layout/SideNav/SideNav.test.tsx
  src/components/layout/MobileNav/MobileNav.test.tsx
  src/components/layout/AppShell/AppShell.test.tsx` as one shell command, then
  `npm run build`. Compare source/target at 767, 768 and 769px.

**Gate:** Every migrated route loads directly, preserves required state and
shows the same permission-aware shell. Unmigrated routes stay open in the ledger.

## Stage 2 — Close September/October Quick Facts gaps

### Task 5: Period, axis, cache and navigation behavior

**Source:** `sqf-filter.service.ts`, `sqf-cards.service.ts`,
`sqf-details-home.component.ts:144–165`.  
**Targets:** `FilterContext.tsx`, `usePeriodCards.ts`,
`useSummaryCards.ts`, `useDetailsCard.ts`, `useAxisCard.ts`,
`periods.ts`, `breakdown.ts`, corresponding existing tests.

- [ ] Reconcile active local changes before editing. Test summary and
  `details:<metric>` isolation, both period value shapes, mixed error cards,
  absent selected period and restored available period.
- [ ] Preserve selected period/axis across source-equivalent node/date/
  page changes; assert toggling cached periods does not issue another HTTP call.
- [ ] Test `hierarchy`, `department`, `proposition`, multi-dimension fallback,
  missing axis content and retained previous display. Cover legacy mango
  ETD/WTD dropdowns and BIGW hierarchy display names.
- [ ] Add navigation/deep-link/history regression cases across summary,
  details, card sidebar and breadcrumbs. Match source state lifetime rather
  than introducing unsupported localStorage persistence.
- [ ] Run `npm test -- --run src/utils/periods.test.ts
  src/utils/breakdown.test.ts src/utils/levelLabels.test.ts
  src/hooks/usePeriodCards.test.ts src/context/FilterContext.test.tsx
  src/components/cards/SummaryCard/SummaryCard.axis.test.tsx` as one command,
  then `npm run build`.

**Gate:** Same cards, sorting metadata and selected controls at each scenario;
no redundant period-switch request and no cross-metric cache contamination.

### Task 6: Date/calendar, ETA and mobile control parity

**Source:** `sqf-filter.component.ts`, calendar header, filter service ETA;
backend timestamp tests.  
**Targets:** FilterBar/DatePicker/FilterSelect, `formatters.ts`, in-progress
`eta.ts`, page hooks; existing tests and proposed `DatePicker.test.tsx`.

- [ ] Test initial non-yesterday URL redirect once, retaining code/merged
  query parameters; distinguish this from subsequent intentional date changes.
- [ ] Derive calendar bounds and month navigation from source, not React's
  assumed 30-day window. Match yesterday/default, disabled days and labels.
- [ ] Test active-view desktop availability versus mobile calendar visibility
  at 767/768/769px, including legacy-array cache behavior. Any improvement to
  source quirks needs a recorded approval.
- [ ] Test local UTC timestamp conversion, reporting date stability, ETA
  before/after cutoff, midnight/DST and timestamp exclusions for
  `ready_for_trade`/`nightfill`. Preserve support/error content.
- [ ] Run the impacted FilterBar, DatePicker, formatter and ETA tests in one
  Vitest invocation, then build and compare mobile screenshots/interactions.

**Gate:** Date and refresh states match source on initial load, later selection
and timezone boundaries; mobile controls occupy the source locations.

### Task 7: Restore exact analytics

**Source:** `sqf-cards.service.ts:870–880`, filter and calendar callers.  
**Targets:** proposed `src/utils/analytics.ts`, `analytics.test.ts`;
FilterBar/DatePicker, cards and affected navigation callers.

- [ ] Inventory all source click events used by the accepted slices, including
  exact payload values and whether fallback/initialization emits an event.
- [ ] Add event-dispatch tests for `quick_facts_element_click` with
  `quickFactEventType`, `quickFactCardType`, `selectedLocation`.
- [ ] Implement `periodChangeWTD/YDAY` and
  `breakdownAxisChangeChildLevel/Department`, including mobile calendar, through
  one shared adapter to the approved analytics runtime.
- [ ] Assert one event per source-equivalent user action, no duplicate
  StrictMode effect emissions and no event on actions source does not track.
- [ ] Run analytics/caller tests together, build and compare browser event
  traces against Angular.

**Gate:** Event name, payload, count and timing match—not just presence of a GA
script.

## Stage 3 — Complete cards, actions and Quick Assist

### Task 8: Summary/details card variants and drill-down

**Source:** Angular summary/detail homes and metric-card components,
`SqfCardsService.setupCommonProps/selectCard`.  
**Targets:** existing SummaryCard/DetailsCard/CardSidebar/MetricCard components,
SummaryPage/DetailsPage, card hooks/utilities/types and their tests.

- [ ] Cover all source card variants with fixtures: simple/custom KPIs,
  tables, tabs, nested/comments/expandable/rich-text, errors and hidden cards.
- [ ] Match config sequence, API/default sorting, numeric detail flags, start/
  last depth bounds, generic `childCode` versus `cardCode`, special availability
  department/store drill-down and breadcrumb behavior.
- [ ] Reconcile local sidebar, table sort and ETA work; test special
  UNK/REGIONEX/CLOSED ordering and source-provided sort values.
- [ ] Compare charts for gauges/needles, doughnut/pie/bar, annotations,
  stacking, datalabel selection, backend HTML tooltips and supplied formatting.
  Remove `any`-based shortcuts only where touched behavior needs correct types.
- [ ] Match BIGW information-dialog styling and source modal/tooltip close/
  scroll behavior; compare cards at source viewport/grid boundaries.
- [ ] Run impacted card/utility suites and build; execute source/target
  summary-to-details-to-child/back scenarios with the same payloads.

**Gate:** No unimplemented source card variant or unexplained layout/action
difference remains for this slice.

### Task 9: Real feedback, recognition, preview and exports

**Source:** SQF endpoint registry, recognition callers,
`core-qf/services/qf-cards-preview.service.ts`.  
**Targets:** SQF API adapter, cards, FilterBar and proposed shared action
components/hooks; source-derived request tests.

- [ ] Capture source recognition/feedback request shape and successful/failed
  side effects; test exact verbs and bodies.
- [ ] Replace recognition timers and disabled/inert action affordances with
  permission-aware real flows, including thank-you/support states.
- [ ] Implement preview/capture selection, scale-2 cropping, full-scroll content,
  overlay exclusions and PDF/download formats from source. Preserve browser
  print as a distinct action.
- [ ] Test cancel, failure and repeated action behavior; do not report success
  when a backend operation or export failed.
- [ ] Compare downloaded artifacts and previews in both browsers with a shared
  fixture; run affected tests and build.

**Gate:** Actions produce matching authorized side effects and artifacts, not
just matching icons.

### Task 10: Quick Assist as a separate vertical slice

**Source:** `sqf/components/quick-assist/`, `qa-cards.service.ts`, `IQA.d.ts`,
`qa-trend-line-chart.component.ts`.  
**Proposed targets:** `src/pages/quick-assist/`, `src/api/quickAssist.ts`,
`src/types/quickAssist.types.ts`, `src/hooks/useQuickAssist.ts`, focused tests.

- [ ] Write a bounded source-derived Quick Assist spec/implementation plan
  before adding components; include CFC and role restrictions.
- [ ] Test group/store/department endpoint selection and discussion/target/trend
  payload variants; wire `/quick-facts/quick-assist` and My Metrics reuse.
- [ ] Implement mixed charts, nested/expandable tables and the 60×27 sparkline
  with source colors and no animation/axes/legend/tooltip/point markers.
- [ ] Compare permitted levels, no-data/error states, mobile layout and action
  flows; run new tests and build.

**Gate:** Quick Assist works end-to-end for authorized levels and is denied
where the source denies it.

## Stage 4 — Complete Weekly Facts and My Plan

### Task 11: Defaults, view/history/hierarchy and table behavior

**Source:** `weekly-facts-home.component.ts`, `wf-table/`, `IWF.d.ts`,
`html-tooltip.directive.ts`.  
**Targets:** TrendPage/TrendTable, `useTrendData.ts`, `tableTransform.ts`,
`htmlTooltip.ts`, `wf.types.ts`, existing tests/styles.

- [ ] Test source-enabled Weekly/MyPlan view navigation, initial
  `varianceFlag.value`, `defaultExpanded`, card/date selection and reset
  behavior when location/view changes.
- [ ] Implement source `dateFilterKey`, week/month/Half Year/HTD handling,
  hierarchy filter, mobile views and source labels/metadata.
- [ ] Test grouped row spans with KPI filtering, nonstandard measure-column
  index, column configuration, goal headers/HTML, alerts and borders.
- [ ] Match two frozen columns, header widths, three-column alignment,
  top/bottom-three and variance CSS; compare horizontal scroll and reused rich
  tooltip positioning near frozen columns/viewport edges.
- [ ] Run `npm test -- --run src/api/trend.test.ts
  src/hooks/useTrendData.test.ts src/utils/tableTransform.test.ts
  src/components/trend/TrendTable.test.tsx
  src/pages/quick-facts/TrendPage.test.tsx` as one command and build.

**Gate:** Weekly and My Plan both match server-configured defaults, selection,
desktop/mobile rendering and table interactions.

### Task 12: Weekly/MyPlan integrations

**Source:** Weekly home/service, shared subscription/export UI.  
**Targets:** `src/api/trend.ts`, TrendPage, FilterBar; proposed subscription,
metrics-info and AI-panel components with tests.

- [ ] Test GET subscription loads and POST multipart FormData with JSON-string
  `locations`/`selected_views`, preserving `myPlan` versus `myplan` casing.
- [ ] Implement subscription entry in its source location, editable
  preferences, permission flags, save/cancel and explicit failure states.
- [ ] Replace inert Metrics Info with the matching popover, and implement
  source banners, support-rich errors, toolkit/usage links, AI drawer resize
  and feedback where enabled.
- [ ] Reuse accepted export/action flows and verify content and mobile behavior.
- [ ] Run adapter/component tests, build and compare request/event traces and
  overlays against Angular.

**Gate:** No displayed enabled action is inert, and feature-disabled actions
match source visibility.

## Stage 5 — Remaining source applications

### Task 13: Dashboard catalog, detail and embeds

**Source:** Dashboard routing/components, dashboard/user/menu services,
`dashboards-chrome.service.ts`, backend common URL registry.  
**Proposed targets:** `src/pages/dashboards/`, `src/api/dashboards.ts`,
`src/types/dashboard.types.ts`, `src/hooks/useDashboards.ts`; shell tests.

- [ ] Create a dashboard-specific spec/plan from actual source templates and
  payloads, including every dashboard child route in the analysis.
- [ ] Test app/category filtering, union tags, full-list sidebar counts,
  trimmed case-insensitive search, favourites immediate removal and sort
  rules (`updated_at` with `created_at` fallback for newest).
- [ ] Implement catalog/grid/table/info/bookmarked routes, external/new-tab
  actions, favourites/settings and backend JWT/Looker SSO exchanges.
- [ ] Implement mobile top/hidden/peek chrome with 24px threshold/reset,
  category drawer, sticky controls and back-to-top.
- [ ] Compare authenticated embeds, connected-sheet/feedback restrictions,
  bookmarks and source mobile interactions; run tests and build.

**Gate:** All enabled dashboard entry/detail/embedded paths and navigation
states work with source-equivalent permissions.

### Task 14: BQF and My Metrics

**Source:** BQF feature router/services/components/typings,
`backend/bqf/urls.py`; My Metrics router.  
**Proposed targets:** `src/pages/bqf/`, `src/api/bqf.ts`,
`src/types/bqf.types.ts`, `src/hooks/useBqf.ts`,
`src/pages/my-metrics/`; source-derived tests.

- [ ] Create separate BQF and My Metrics specs/plans. Do not force BQF into
  SQF's location/date filter contract.
- [ ] Test BQF product hierarchy, state, time, supplier, cluster, default/
  favourite hierarchy and notification/share/subscription payloads.
- [ ] Implement sales/profit/stock-loss/units/ASP/Easter/promotion metric
  families and pricing/CDS/expiring-stock notifications, preserving source
  navigation and recent mobile changes.
- [ ] Wire `/my-metrics` to source-equivalent reused SQF/Quick Assist pages
  with correct portal/role context and feature availability.
- [ ] Run each application's targeted tests/build and compare
  summary/details/notification/action scenarios.

**Gate:** Both route families are accepted independently with their actual
filter, permission and payload models.

### Task 15: Admin, Help, manifest, ACT and Price Simulator

**Source:** Each feature routing module, templates/services and backend
registry; ACT's existing React-dashboard wrapper.  
**Proposed targets:** Separate page/API/type/hook groups under the directories
in the responsibility map, plus explicit source route registrations.

- [ ] Write one source-derived spec/plan per application before implementation;
  this review did not trace every template or transformation.
- [ ] Implement Admin dashboards/attributes/tags/users/alerts/menus with
  source admin authorization and exact operation side effects.
- [ ] Implement Help access/support/training/report/aboutUs/faq and manifest,
  including existing links/forms and allowed access.
- [ ] Preserve ACT `/act` and `/act/avnav` wrapper/service boundary and identity
  behavior; reuse the existing React integration where appropriate.
- [ ] Implement Price Simulator simulations/details/setup/view/grant/share/
  scenario/report routes and permission flags against the existing service.
- [ ] Run each bounded application's tests/build and source-versus-target
  end-to-end scenarios before marking its routes migrated.

**Gate:** Every enabled source route has implemented behavior, not a generic
Coming Soon page or fallback redirect.

## Stage 6 — Parity acceptance and deployment cutover

### Task 16: Cross-feature acceptance and operational readiness

**Read/modify as needed:** complete parity ledger, shared contexts/shell,
`app.yaml`, `cloudbuild.yaml`, `dispatch.yaml`, Vite configuration, README.

- [ ] Run the full React test suite with `npm test -- --run` and production
  build with `npm run build` after targeted slices pass.
- [ ] Resolve the missing ESLint configuration as a bounded tooling task,
  preserving repository conventions; then run `npm run lint`. Do not claim the
  currently declared command is an established passing gate.
- [ ] Execute the role/portal/location/date/period/axis matrix in both apps
  with identical payloads. Cover loading/pending/error/empty/denied and
  desktop/mobile navigation, overlays, charts, tables, exports and analytics.
- [ ] Review screenshots at source breakpoints, including 767/768/769px.
  Accept no unexplained mismatch; individually record approved unavoidable
  font/canvas rendering differences instead of a broad permissive threshold.
- [ ] In an authorized staging deployment, verify build-time environment,
  session/IAP, API dispatch and endpoint casing, direct routes/query strings,
  static assets including favicon, cache headers, error handling and cookie
  behavior. Do not alter shared dispatch without release approval.
- [ ] Record the known-good frontend service version and approved rollback
  procedure; keep existing backend services/Angular release available until
  the parity acceptance gate closes.
- [ ] Update README/parity status only from observed evidence. Track Angular
  changes since the frozen baseline as the next delta, not silent scope drift.

**Final gate:** Every enabled baseline feature and recent source change has
accepted contract, behavior, permission, analytics and visual evidence; no
placeholder, stub identity, inert enabled action or unapproved difference
remains. Production cutover requires separate release approval.

## Immediate next implementation slice

Begin with Tasks 1–2, then identity/routes. Within existing Quick Facts work,
the highest-risk next regressions are initial date guarding, legacy wrapper/
period cache behavior, mobile period visibility, exact analytics and active
summary/details state isolation. Reconcile the current local implementation
before applying fixes; this plan is not a request to restart or overwrite it.
