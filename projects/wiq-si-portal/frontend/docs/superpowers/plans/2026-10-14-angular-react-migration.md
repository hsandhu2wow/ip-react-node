# Angular-to-React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` or
> `subagent-driven-development` for a separately approved, bounded implementation
> slice. Steps use checkbox (`- [ ]`) syntax for tracking. This is a
> programme-level roadmap, not an instruction to implement all applications
> in one run. Checkboxes track future work, not completion claims.

**Goal:** Recreate the current committed Angular application with one-to-one
functional and visual parity, without replacing its existing backend.

**Architecture:** Keep the React stack and migrate complete feature slices.
Use typed API wrappers, shared identity/filter state, query hooks and existing
presentation utilities. Derive behavior from pinned Angular source and shared
browser scenarios, not wireframes or old phase deferrals.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Router 7, Query 5, Axios,
Chart.js 4, CSS Modules, Vitest/Testing Library; browser differential tooling
is proposed and not installed.

---

## Baseline, boundaries and sequencing

React baseline: `c97525f268befdc68446c7c864a9f2c79b279d5c`.
Angular baseline: `02a9cf69889d74fb8542ec26c9ecb57aae041278`.
See [current status](../../migration-status.md) and
[architecture](../../technical-architecture.md).

This plan replaces earlier partial-feature plans as the overall migration
roadmap, without rewriting their history. It does not authorize code changes,
dependency installation, deployment or a commit during the documentation task.
Local Angular configuration edits and work in other React checkouts are not
part of the baseline.

| Stage | Depends on | Delivery gate |
|---|---|---|
| 0. Freeze contracts and scenarios | None | Reproducible source/target comparison |
| 1. Identity, routes and shared shell | 0 | Source-equivalent authorized entry/navigation |
| 2. Recent Quick Facts changes | 0; 1 for permission acceptance | Period/date/axis/cache/analytics/dialog parity |
| 3. Complete Daily/details and Quick Assist | 1–2 | Complete card/action workflows |
| 4. Complete Weekly/My Plan | 1; accepted shared filters/actions | Source-configured desktop/mobile experience |
| 5. Remaining application workstreams | 1; separate source-derived design per application | Every enabled source route implemented |
| 6. Cross-feature acceptance and cutover | All enabled slices | No unexplained or unapproved difference |

Stages 3–5 may contain independent workstreams after shared identity, state and
route contracts stabilize. Do not concurrently rewrite the same contexts or
navigation. Each untraced application needs its own detailed design and
implementation plan before coding; this inventory is not a substitute.

## Stage 0 — Reproducible baseline and regression evidence

**Read:** Both route inventories/manifests; Angular source references in the
status report; current React tests.

**Update:** `docs/migration-status.md`.
**Proposed acceptance files:** `tests/parity/`, `playwright.config.ts`,
sanitized fixtures in `src/test/fixtures/`.

- [ ] Record actual HEADs, branches and dirty status before each slice.
  Preserve other work; never reset a checkout to enforce this document.
- [ ] Give every source route/role/feature and recent change a scenario ID,
  target owner and expected outcome. Record new Angular commits separately
  until the source baseline is deliberately advanced.
- [ ] Obtain authorized or sanitized matching payloads and user/portal/location
  context. Freeze clock, reporting date, timezone, viewport, fonts and animation
  when comparing screens. Do not store credentials or real employee fixtures.
- [ ] Add browser differential tooling in a separate manifest change. Use
  Angular and React base URLs and the same fixtures; capture screenshot,
  request, action and analytics traces. Wireframes are supplementary only.
- [ ] Establish current `npm test -- --run` and `npm run build` outcomes before
  implementation. Record failures rather than adjusting unrelated behavior.

**Acceptance:** The same summary/details scenario is reproducible in both
applications. Every source requirement has a traceable acceptance scenario.

## Stage 1 — Real identity and compatible navigation

**Source:** Angular `app.module.ts`, `services/user/user.service.ts`,
`services/auth-guard.service.ts`, root/feature routers and backend common auth.
**Existing targets:** `src/context/AuthContext.tsx`, `src/api/client.ts`,
`src/App.tsx`, AppShell/SideNav/MobileNav.
**Proposed files:** `src/api/user.ts`, `src/types/user.types.ts`,
`src/context/AuthContext.test.tsx`, `src/App.test.tsx`.

- [ ] Define real bootstrap/user contracts from source responses, including
  role flags, portal settings, CFC restrictions and feature-enabled flags.
- [ ] Add failing tests for loading, bootstrap failure, denied/inactive users,
  allowed routes and session/account changes. Prevent gated content flashing.
- [ ] Replace demo identity using existing authenticated backend/IAP flow;
  never generate trusted IAP headers in the browser or invent bearer login.
- [ ] Match landing priority, Weekly/My Plan gating, source account switch/
  logout and identity-sensitive cache invalidation.
- [ ] Test/register source route names and child routes; preserve
  `/price-simulator` and `/act/avnav`. Existing React names can be approved
  aliases, not replacements. Missing routes must remain open gaps.
- [ ] Match desktop/mobile shell, enabled navigation, active states, portal
  assets/labels and direct links. Verify query state, refresh and back/forward,
  including sidebar and summary/details navigation.
- [ ] Run new auth/route tests plus existing shell/navigation suites and
  `npm run build`. Compare authorized and denied behavior in both apps.

**Acceptance:** No accepted enabled route depends on demo authentication;
landing, permissions and identity/cache changes match source.

## Stage 2 — Close recent Quick Facts regressions

### 2A. Response contracts, period caches and global axis

**Source:** `sqf-cards.service.ts`, `sqf-filter.service.ts`,
summary/details homes and backend SQF response code.
**Targets:** `src/types/sqf.types.ts`, `src/utils/periods.ts`,
`src/context/FilterContext.tsx`, summary/details/period/axis hooks,
`src/utils/breakdown.ts`, FilterBar and CardSidebar.

- [ ] Characterize legacy arrays, top-level wrappers, period arrays, wrapped
  periods with sort metadata, mixed error/success cards and malformed data.
  Start with this missing case in `src/utils/periods.test.ts`:

```ts
it('preserves cards and sort metadata in a legacy top-level wrapper', () => {
  const card = { cardName: 'sales', cardType: 'summary' as const }
  const result = normalizePeriods({ cards: [card], sortBy: 'Z - A' })
  expect(result.periods.WTD).toEqual([card])
  expect(result.sortBy.WTD).toBe('Z - A')
})
```

- [ ] Run `npm test -- --run src/utils/periods.test.ts` to observe the baseline
  failure, then implement the source-confirmed contract and rerun. Do not turn
  malformed successful responses into an unexplained empty page.
- [ ] Test source period retention/fallback, separate summary and
  `details:<metric>` availability, no extra HTTP on period-only switching and
  invalidation when location/date changes. Decide context/URL fallback from
  source behavior, not the earlier spec's unimplemented writeback.
- [ ] Test `hierarchy`, `department`, `proposition`, unrelated dimensions,
  unavailable-axis retention and legacy mango ETD/WTD selectors.
- [ ] Pass active axis through sidebar cards; cover child/department labeling,
  BIGW names and leaf Store/Department control visibility.
- [ ] Run period/breakdown/level-label/context/hook/sidebar/filter tests
  together, then build and execute shared request/navigation scenarios.

**Acceptance:** Main cards, sidebar, selected controls, sort metadata and
requests agree with the source for each scenario.

### 2B. Date/calendar, refresh ETA and analytics

**Source:** Filter/calendar components, filter/card services and timestamp/ETA
backend contracts.
**Targets:** FilterBar/DatePicker, `FilterContext.tsx`,
`src/utils/formatters.ts`, enrichment hooks; proposed
`src/hooks/useDataLoadETA.ts`, `src/utils/analytics.ts` and focused tests.
The unused ETA hook/API/type scaffold was removed during cleanup; implement
these together with actual page integration rather than restoring dead code.

- [ ] Reproduce the source's one-time initial non-yesterday query-date guard;
  distinguish initial navigation from subsequent deliberate date selection.
- [ ] Verify the source's 30-day minimum/yesterday maximum and month navigation
  against current React bounds. Compare date-only parsing, yesterday,
  disabled dates and midnight/DST behavior.
- [ ] Match desktop period availability and mobile calendar/hierarchy
  controls at 767/768/769px, including source legacy-cache visibility quirks.
  Any intentional source behavior change requires an explicit exception.
- [ ] Wire ETA to source-equivalent error enrichment. Test pending cutoff,
  expired/missing data, yesterday-only text/day prefix, support text,
  UTC-to-local conversion and omitted
  update timestamps for designated metrics.
- [ ] Implement exact `quick_facts_element_click` names/payloads for accepted
  actions, including `periodChangeWTD/YDAY` and
  `breakdownAxisChangeChildLevel/Department`. Test mobile callers, initialization
  and StrictMode so user actions do not produce duplicate events.
  Preserve literal `gtm.start`, `employeeNumber`, `siRole`,
  `quickFactEventType`, `quickFactCardType` and `selectedLocation` fields,
  including empty card type where the source supplies it.
- [ ] Run affected date/filter/formatter/ETA/analytics tests, build and compare
  browser event/request traces and error-state screenshots.

**Acceptance:** Reporting dates do not shift, refresh/error states match and
each source-equivalent user action emits the same analytics event/count.

### 2C. October 13 feature-alert dialog and acknowledgment

**Source:** The `67a138055` responsive-dialog change and `02a9cf698`
constructor smoke-test correction; `components/alert-list/`,
`components/alert-dialog/` and global `feature-alert-modal` styles.
**Proposed targets:** `src/components/shared/FeatureAlerts/FeatureAlerts.tsx`,
`FeatureAlerts.module.css`, `FeatureAlerts.test.tsx`; source-derived feed/
acknowledgment API wrapper and browser scenarios.

- [ ] Trace the source notice feed/read operations, route filtering and session
  cache before defining the wrapper contract. Capture authorized short/long
  notices, long titles, BIGW theme and height-constrained screens.
- [ ] Implement the source 720px/max-100% component, panel viewport limits
  (`calc(100vw - 32px)`, `92vw` at <=768px) and <=599px footer stacking.
  Do not borrow unrelated `.modal-size-60` maximum-height rules.
- [ ] Match acknowledgment/read/session removal and false close/remind-later/
  Escape outcomes, including source `disableClose` behavior. This is not
  Metrics Info and should not silently replace its existing modal.
- [ ] Characterize long-content clipping/scroll in a real browser: source
  hides overflow and has no explicit body-height/scroll constraint. Preserve
  observed behavior or obtain an explicit exception before improving it.
- [ ] Add request/session/route regressions and browser bounds/theme tests.
  Run the new alert tests, build and compare browser images; a smoke
  instantiation or jsdom assertion cannot prove responsive parity.

**Acceptance:** Notice availability, acknowledgment side effects, responsive
panel and close behavior match current source, with any long-content exception
explicitly recorded.

## Stage 3 — Complete Daily/details, actions and Quick Assist

**Source:** Angular summary/detail/metric-card components, card service and
Quick Assist components/services/typings; core preview/export service.
**Targets:** Existing SummaryPage/DetailsPage, cards/chart/table/tab components,
`src/api/sqf.ts`; proposed bounded Quick Assist page/API/type/hook groups.

- [ ] Add source fixtures/scenarios for all accepted card variants, KPI/custom
  HTML, nested/comments/expandable tables, tabs, skeleton/hidden/error states.
- [ ] Match card-status sequence and level/CFC rules, details default/user
  sorting, drill-down code selection/depth, breadcrumbs and navigation state.
- [ ] Verify actual basic-table sorting versus current indicator-only display,
  footers, shadows and scroll help. Compare chart labels, tooltips, gauge needle,
  stacking and annotations rather than treating generic Chart.js output as parity.
- [ ] Compare SQF Metrics Info against its actual source popup, preserving
  the 530px/648px maximums, `autoFocus: false`, info icon, HTML transformation
  and close/focus behavior. Keep feature alerts and Weekly popups
  distinct; retain existing InfoModal click regressions and add browser evidence.
- [ ] Replace recognition timers with real authorized requests and thank-you/
  error flows; implement feedback and capture/preview/download, keeping print
  separate. Preserve source request verbs/payloads and export scale/cropping/
  full-scroll/overlay exclusions.
- [ ] Write a separate Quick Assist source-derived design/implementation plan
  before coding its group/store/department data, discussion points, target/
  mixed charts and nested tables. Preserve source sparkline size/options and
  role/CFC restrictions.
- [ ] Run each slice's focused tests and build, then compare actual side effects,
  artifacts and desktop/mobile screens.

**Acceptance:** No enabled displayed action is inert; every source card variant
and permitted drill-down has matching output and behavior.

## Stage 4 — Complete Weekly Facts and My Plan

**Updated October 21:** Execute the
[dedicated Weekly Facts/My Plan implementation plan](2026-10-21-weekly-facts-myplan-parity.md)
with its [source/BU assessment](../../weekly-facts-myplan-parity.md).
Its task dependencies, source-quirk gates and acceptance register supersede
the generic checklist below. This stage is not complete for any BU.

**Source:** `weekly-facts-home`, `wf-table`, `IWF.d.ts`,
`weekly-facts.service.ts`, HTML tooltip directive and backend weekly registry.
**Targets:** TrendPage/TrendTable, `src/api/trend.ts`, `src/types/wf.types.ts`,
`useTrendData.ts`, `tableTransform.ts`, `htmlTooltip.ts`, shared filter/actions.

- [ ] Add failing tests for Weekly/My Plan enabled view switching,
  `varianceFlag.value`, `defaultExpanded`, selection reset after location/view
  changes and payload-level error/support details.
- [ ] Implement generic `dateFilterKey`, week/month/Half Year/HTD history,
  hierarchy and mobile views using source configuration rather than just type
  declarations.
- [ ] Compare KPI filtering, group row spans, configured measure column,
  goal/variance HTML, alerts, column widths, frozen headers/two columns,
  three-column layout and top/bottom-three styles.
- [ ] Exercise reused HTML tooltip positioning near sticky columns and viewport
  edges; compare mobile/touch and keyboard behavior explicitly.
- [ ] Replace inert Metrics Info/subscription labels with actual source flows;
  retain data endpoint `/myPlan` versus subscription `/myplan` casing and
  multipart JSON-string fields. Include banners, AI drawer, toolkit/usage and
  feedback/export where enabled.
- [ ] Run API/hook/transform/table/page tests in one invocation, build and execute
  Weekly and My Plan source/target request/interaction/mobile scenarios.

**Acceptance:** Every enabled BU/feature applies the actual backend defaults
and selection rules, exposes matching permitted actions and passes paired
Angular/React desktop/mobile, request/event and artifact comparisons.
An authorized BU inventory, source-behavior decisions and qualified fixtures
are prerequisites; a single SI profile or high React line coverage is not
all-BU acceptance.

## Stage 5 — Remaining application workstreams

These are required for full-app parity, not small Quick Facts extensions.
Create separate detailed source-derived specs and implementation plans before
editing each application's routes, response types or workflows.

| Workstream / source | Proposed React area | Required outcomes |
|---|---|---|
| Dashboard routers/components/services and common backend | `src/pages/dashboards/`, corresponding API/types/hooks | Catalog/search, category/tag counts, favourites, sorting, bookmarks/details, external/embedded/Tableau/Looker, mobile chrome |
| `bqf/` and backend BQF registry | `src/pages/bqf/`, distinct BQF API/types/state | Product/state/time/supplier/cluster filtering, metric families, notifications, sharing/subscriptions/defaults |
| My Metrics router | `src/pages/my-metrics/` and reused SQF/Quick Assist | Correct source routes, portal/permission context and reuse |
| Admin routers/templates/services | `src/pages/admin/` and admin API groups | Dashboards/attributes/tags/users/alerts/menus with real authorization and mutations |
| Help router and manifest entry | `src/pages/help/`, manifest route | Access/support/training/report/aboutUs/faq and source entry behavior |
| ACT router/existing React dashboard wrapper | `src/pages/act/` or approved wrapper integration | `/act`, `/act/avnav`, service/identity boundary and source actions |
| Price Simulator router/services | `src/pages/price-simulator/` | Simulation/setup/detail/view/grant/share/scenario/report routes and permissions |

- [ ] Inventory every child route, permission, request and side effect for the
  selected workstream; mark which surfaces have actually been traced.
- [ ] Define bounded components and contracts from source; do not force
  application-specific filters into SQF context.
- [ ] Add behavioral regressions before implementation, run targeted tests/
  build and execute authenticated direct-link/action/mobile scenarios.
- [ ] Update the status matrix only after the workstream acceptance gate closes.
  Do not substitute redirects/Coming Soon pages for implementation.

**Acceptance:** Every enabled baseline route family is implemented and verified
independently; externally hosted features retain their intended boundary.

## Stage 6 — Acceptance, operational readiness and cutover

**Files:** Parity scenarios/status, shared shell/state, build/deployment
configuration and README.

- [ ] Run `npm test -- --run` and `npm run build` after focused slices pass.
  Establish an ESLint configuration in a separate bounded tooling change
  before treating `npm run lint` as a gate. Add approved CI test/build checks.
- [ ] Execute the role/portal/location/date/period/axis matrix with identical
  payloads. Include allowed/denied/loading/pending/empty/error states, direct
  links, refresh/history, tables/charts/overlays, exports and analytics.
- [ ] Review browser images at source breakpoints and height-constrained sizes.
  Accept no unexplained mismatch; individually approve unavoidable
  font/canvas differences instead of using a permissive global threshold.
- [ ] Verify build-time API settings, IAP/session/cookies, endpoint casing,
  API dispatch/error responses, SPA deep links, static SVG/favicon responses
  and cache headers in authorized staging.
- [ ] Record known-good service versions and approved rollback; do not change
  shared dispatch or cut over production without separate release approval.
- [ ] Keep Angular changes since the pinned commit in a delta ledger and
  advance the baseline deliberately. Update completion claims only from
  contract, behavior, permission, analytics and visual evidence.

**Final acceptance:** No stub identity, placeholder route, inert enabled action,
untraced enabled feature or unapproved source difference remains.

## Execution handoff

Start with Stage 0 and identity/route foundations. The narrowest existing-SQF
regressions to address next are wrapper/fallback behavior, sidebar axis/URL
consistency, initial-date/mobile controls, missing ETA/analytics and the
October 13 feature-alert contract. Retain earlier useful code/tests; do not restart
the application or overwrite another checkout's work.
