# Migration status and Angular source comparison

> **Current-state guide, November 2, 2026:** Use the
> [documentation hub](README.md), [feature guide](feature-guide.md) and
> [architecture](technical-architecture.md) for code at `16e8c6f`.
> Modernisation is integrated into dev and Weekly/MyPlan at that commit.
> This file retains dated source assessments: older statements about missing
> mobile/actions, tables, gauges or URL reactivity are not current inventories.
> See [delivery gates](migration-strategy.md#delivery-roadmap-and-acceptance-gates)
> for remaining work. This refresh adds no new Angular/live-BU qualification.

Broad review: **October 14, 2026**; focused Weekly Facts/My Plan review:
**October 21, 2026**. Goal: one-to-one Angular-to-React parity,
including user-visible behavior, permissions, integrations and responsive UI.
This is a source/history assessment, **not runtime or production certification**.

## Frontend modernisation: October 30

`feat/frontend-architecture-modernisation` branches from the committed
Weekly/MyPlan continuation (`9313306`), not the older dev baseline. It replaces
the Axios dependency with native Fetch beneath the existing TanStack Query
hooks, converts scoped styles mechanically to SCSS Modules, colocates Quick
Facts and Weekly/MyPlan code under `src/features`, and introduces MSW-backed
query/HTTP tests. Shared transport, dialogs, filtering and export infrastructure
live in `src/shared`; application routing/layout lives in `src/app`.
The 95.01% line threshold remains unchanged; only the type-declaration exclusion
path follows the moved type directories. Global CSS, BU themes, backend
contracts and wireframes are unchanged. Historical source paths below refer
to the dated implementation, not the current directory layout.
The modernised branch passes 604 tests across 72 files and builds; line
coverage is 97.15% (2,733/2,813). These checks do not replace browser/BU
qualification.

## Implementation update: October 26

**Coverage follow-up:** The combined Weekly branch now passes 556 tests in
66 files, with 97.01% lines (2,629/2,710), 95.41% statements, 94.52% functions
and 88.26% branches. The unchanged 95.01% global line gate passes. Tests add
export/capture/SDK/error-path coverage, gauge callbacks and user interactions;
no production code, coverage exclusions or thresholds changed. This resolves
the integration coverage gap below, not the all-BU/browser qualification gaps.

**Integration follow-up:** Quick Facts parity is merged into dev at `e8817e8`;
the Weekly feature branch now incorporates that dev baseline while retaining
its selection/projection/popup work. The combined branch builds and passes
500 tests in 65 files. Imported code lowers full-source line coverage to
86.19%, below the unchanged 95.01% gate. The user approved publishing these
merges with the gap recorded; the follow-up above restores the line gate. The
smaller-scope measurements below are historical, not current combined coverage.

The next feature-branch slice adds desktop hierarchy/history selection and
child/peer projection for Weekly/MyPlan, original-column header association,
Weekly-specific Metrics Info/header/cell alert dialogs and structured error
details. Mobile projection is tested as a utility but is not yet connected to
the mobile menu/page lifecycle. The feature remains separate from `dev-branch`;
wireframes remain excluded.

The suite passes **293 tests in 35 files**, with **97.88% line coverage** under
the unchanged all-source policy and 95.01% gate. User-approved fixed UTC clocks
remove an existing after-22:00 cutoff-test failure without changing application
code. Source-derived unit/integration behavior is not all-BU visual acceptance:
identity, Half Year, full mobile/table layouts, subscriptions/actions and browser
qualification remain open. See the
[latest focused progress entry](weekly-facts-myplan-parity.md#implementation-progress-october-26).

## Implementation update: October 23

The documentation/cleanup/test baseline is pushed on `document-migration-plan`
at `07540f3`, merged and pushed to `dev-branch` at `e657079`. The initial
Weekly/MyPlan migration slice is on `feat/weekly-facts-myplan-parity`, created
from that dev merge; it is not part of dev until separately integrated.
Wireframes were excluded and the other checkout was not changed.

This slice fixes dynamic history keys, server variance/KPI expansion defaults,
response/table selection resets, source columnid membership, empty KPI groups,
KPI substring matching and singleton spacers. It also corrects wire types and
adds subscription transport (not preferences UI). That slice passed 267 tests
in 33 files with 97.62% line coverage; this remains unit/integration evidence,
not all-BU/browser acceptance. The assessment/gap ledger below retain their
review dates; the [focused progress entry](weekly-facts-myplan-parity.md#implementation-progress-october-23)
identifies remaining prerequisites and scope.

## Review baseline and limits

| Item | React | Angular |
|---|---|---|
| Application | Current repository/worktree | `dsa-buying-insights/store-insights` |
| Branch | `document-migration-plan` | `feature/smkt-qf-yday-toggle-mobile` |
| HEAD | `c97525f268befdc68446c7c864a9f2c79b279d5c` | `02a9cf69889d74fb8542ec26c9ecb57aae041278` |
| Latest commit | Oct 8 period/breakdown filters | Oct 13 alert-dialog smoke-test constructor correction |
| Baseline state | Clean before this documentation refresh | Local configuration edits excluded from product baseline |

Angular's Git root is the parent `dsa-buying-insights` repository, so history
must be scoped to `store-insights/`. Its local `backend/config.py` and
`src/environments/environment.prod.ts` changes were left untouched; their
values are not reproduced. The parent has an untracked Quick Assist demo.

This worktree is not the previously reviewed main checkout: October 10
uncommitted documentation and additional local React implementation/test files
are not present here. Current HEAD has not advanced from `c97525f`. The current
test inventory was 24 files before cleanup, 23 after removing the obsolete
MetricCard suite, and is **33 files after the October 20 test expansions**.
These counts do not refer to the earlier checkout's 28 files.
Do not count work in another working tree as implemented in this branch.

Reviewed evidence includes current route/provider/query/card/filter/table
implementations, manifests, deployment configuration, test inventory, historical
specs and relevant Angular source/diffs. The October 21 follow-up made
successful read-only local SI identity/hierarchy/Weekly/MyPlan GETs, inspecting
structure and flags without saving raw data. Neither app was exercised in
paired authenticated browser sessions; visual comparisons, analytics and
deployment smoke checks were not executed. Some broader Angular applications
are inventoried rather than exhaustively traced.

## Weekly Facts/My Plan follow-up: October 21

The [dedicated assessment](weekly-facts-myplan-parity.md) and
[detailed implementation plan](superpowers/plans/2026-10-21-weekly-facts-myplan-parity.md)
replace the broad roadmap's generic Stage 4 checklist. The source home/table,
templates/styles, popup, subscription service/dialog, backend registry,
permission/navigation branches and shared actions were traced. The focused
history window is July 21–October 21; the original three-month activity counts
below retain their October 14 window.

The current React page is **not qualified for any BU**. Real local SI data
already uses Weekly history keys `monthNo` and `halfNo`, while React supports
only `month`/`weekNo`; My Plan returns variance true while React defaults false.
KPI grouping has a reproducible empty-group exception. Mobile, hierarchy,
WFM/double-goal/three-column/sticky fidelity, Weekly dialogs, subscriptions,
AI/banner/links, analytics and real export remain incomplete.

The source has explicit SI/METRO/BIGW/PEL/360FM/PEOPLE branches, but actual
feature enablement and views are backend/settings-driven. Additional deployment
families require mapping to authorized portal identities. One SI National
profile is not all-BU evidence. The plan requires an exhaustive BU inventory,
sanitized fixtures, source-quirk decisions and matched browser/action evidence;
unavailable sessions or confirmed-disabled features cannot be counted as passes.
No Weekly/MyPlan fixtures or application implementation were added in this
documentation follow-up. Existing 248-test/97.24%-line results are from October
20 and do not establish source parity.

## Current changes and history

### Since the October 10 review

| Repository | Delta | Migration consequence |
|---|---|---|
| React | No additional commits at this worktree's HEAD | Re-establish actual baseline rather than assuming prior uncommitted fixes landed |
| Angular `67a138055` (Oct 13) | Feature-alert dialog `.wiq-dialog` width changes from 480px to 720px, with `max-width: 100%` and border-box sizing | Add alert-notice/acknowledgment UI and current viewport/container scenarios; this is not the Metrics Info popup |
| Angular `02a9cf698` (Oct 13) | Alert-dialog smoke test gains the fourth mock constructor argument for `UserService` | Test-only fix, not a build-configuration or additional layout change |

The new Angular target supersedes the previous `dbd096cd3` baseline.
Future Angular changes enter a separate delta ledger until deliberately
incorporated; the target must not move silently during a slice.

### Last-three-month activity

July 14–October 14 inclusive, using committer timestamps in Sydney time
(`2026-07-14T00:00:00+10:00` through, but excluding,
`2026-10-15T00:00:00+11:00`), reachable from local HEAD and including merges:

| Application scope | July 14–31 | August | September | October 1–14 | Total |
|---|---:|---:|---:|---:|---:|
| React | 12 | 22 | 0 | 2 | **36** |
| Angular `store-insights/` | 49 | 62 | 31 | 8 | **150** |

Counts measure activity, not migration completeness. They are not the earlier
July 10–October 10 window's counts.

### React changes within the window

| Period / commits | Implemented changes | Important limitation |
|---|---|---|
| July `257ad99`, `feab2d0`, `41bdd4d`, `849434c`, `6d06198`, `2491aa4` | Summary detail availability, sidebar/two-column details, numeric detail flag and styling | Not a complete route/card/permission migration |
| July/August `a7e1377`, `e458778`, `44cc1fe`, `58480c0` | Further details work and build/deployment configuration | WIP commit messages are not acceptance evidence |
| August `3052bf3`, `094f99a`, `9a6086f`, `c943a1b`, `8451896`, `07adfdd`, `8485b25` | Weekly/MyPlan types, endpoints, query, grouped/KPI table and routes | Mobile, permission gates and action integrations remain incomplete |
| August `9d6a74e`, `0a38bfb`, `509b1ce` | Active navigation, backend HTML, tooltips/chart labels, calendar and layout refinements; PageBar removal | Native/generic rendering and displayed labels are not complete interaction parity |
| October `765a30d`, `c97525f` | WTD/YDAY payloads, global axis, URL state and controls | Analytics was excluded; current fallback and route/control behavior differ from some spec intentions |

To reproduce history, use `git log HEAD --format='%h %cI %s'` in this root;
for Angular use the same command with `-- store-insights/` from its Git root.
Filter timestamps explicitly to the interval above; do not compare monorepo
counts as application-only changes.

### Angular changes the port must retain

The source's July–October work extends beyond Quick Facts. Important change
groups include dashboard mobile navigation/bookmarks, Weekly/MyPlan variance/
HTML tooltips and layout, exports/subscriptions, exact employee identity,
UTC update timestamps, Angular/Material 22 migration, and BQF notifications.

The September/October Quick Facts changes are especially relevant:

| Source commits | Required behavior |
|---|---|
| `81cda6643`, `341cc9e29`, `af8d4f33d`, `a35a64a69` | WTD/YDAY/global breakdown menus, backend `hierarchy` key, mobile and legacy-card behavior |
| `5ca765e45` | Period selector visibility follows active-view data availability |
| `e950e95be` | Retain available selected period, avoid accidental reset, switch cached details period data |
| `677fda858`, `267143057` | Period and axis analytics, including mobile calendar |
| `dbd096cd3`, `67a138055`, `02a9cf698` | Portal-themed feature-alert dialog, responsive width and constructor smoke-test correction |

The alert source is `components/alert-dialog/` and `components/alert-list/`.
The latter uses `feature-alert-modal`, `disableClose: true` and no explicit
width/maxHeight. Existing `src/styles.scss:840–866` limits the panel to
`calc(100vw - 32px)` and uses `92vw` at `<=768px`; the dialog stacks footer
buttons at `<=599px`. The component and Material surface hide overflow, with
no explicit body-height/scroll rule. Separate `.modal-size-60` rules must not
be attributed to this panel. Long-body behavior needs runtime characterization,
not an invented scrolling guarantee.

Confirming the alert marks selected notices read and removes them from the
in-session cache; close/remind-later/Escape return false. Notices are filtered
by the active feature route. This workflow is absent in React and is distinct
from its existing Metrics Info modal.

## Feature parity matrix

**Partial** means source exists in React, not that its parity is verified.
**Missing** includes Coming Soon or inert UI. **Inventory only** means a
separate source-specific specification is required before implementation.
Angular paths below are relative to `store-insights/src/app/` unless stated.

| Feature | Angular evidence | React status / next requirement |
|---|---|---|
| Identity/permissions | `app.module.ts`, user/auth-guard services, backend common auth | **Missing:** demo user, no real bootstrap/roles/CFC restrictions |
| Landing/routes/shell | `app-routing.module.ts`, feature routers and chrome | **Partial:** nested Quick Facts and basic shell; other apps mostly absent; route/portal/deep-link parity open |
| Summary/details | `sqf/components/shared/sqf-summary-home/`, `sqf-details-home/`, card service | **Partial:** cards/sidebar/sorting/drill-down; all variants/defaults/state/actions need comparison |
| Period/axis/date | SQF card/filter services, filter/calendar components | **Partial:** controls and resolvers; source initial-date/mobile/cache semantics, sidebar and URL consistency open |
| ETA/error/updated time | SQF filter/card service and backend metric response code | **Partial:** card error UI exists; unused ETA scaffold removed, source enrichment/timezone cases incomplete |
| Analytics | SQF card service and filter/calendar event callers | **Missing:** no matching analytics adapter/events found |
| Metrics Info dialogs | Source SQF/Weekly popup callers | **Partial:** generic card InfoModal exists; Weekly label is inert; verify each popup contract separately |
| Feature alerts/acknowledgment | `components/alert-list/`, `components/alert-dialog/`, Oct 13 diffs | **Missing:** notice feed, read/session behavior and source responsive alert panel |
| Recognition/feedback/export | SQF backend registry and core QF preview/export service | **Missing:** recognition timer, disabled feedback/download; only browser print works |
| Weekly/MyPlan core | `sqf/components/weekly-facts/`, `IWF.d.ts` | **Partial, unqualified:** generic history/defaults incorrect for observed SI payloads; hierarchy/mobile, grouping, WFM/goal/sticky layouts open; see dedicated assessment |
| Weekly/MyPlan integrations | Weekly home/service and shared filter/actions | **Missing/partial:** no working Weekly info/alert/subscription flow, AI drawer, analytics or full banner/link/export integration; per-BU acceptance required |
| Quick Assist | `sqf/components/quick-assist/`, QA service/typings | **Missing:** route and dedicated cards/charts/tables |
| Dashboards | Root dashboard routes/components/services | **Missing; inventory only:** catalog/search/favourites/bookmarks/detail/embeds/mobile chrome |
| BQF | `bqf/`, backend BQF URL registry | **Missing; inventory only:** distinct product/state/time/supplier/cluster filters, metrics and notifications |
| My Metrics | `me-at-woolies/me-at-woolies-routing.module.ts` | **Missing:** source entry point/reuse and portal/role behavior |
| Admin | `admin/admin-routing.module.ts`, services/templates | **Missing; inventory only:** management routes and authorized mutation flows |
| Help/manifest | Help router and root manifest entry | **Missing:** source help pages/forms and manifest behavior |
| ACT | ACT router and existing shared React-dashboard wrapper | **Missing; inventory only:** source route/service integration |
| Price Simulator | Feature router/services | **Missing; inventory only:** full simulation/share/grant/scenario/report workflow |
| Branding/responsive/assets | Source global/component styles and assets | **Partial:** single hardcoded demo portal, wireframe-derived grid; full source theme/mobile/print comparison needed |

Angular route families include `/quick-facts`, `/bqf`, `/my-metrics`, `/act`,
`/price-simulator`, `/admin`, `/help`, `/manifest` and dashboard search,
embedded/external/Tableau/Looker/info/list/app/favourites children.
React's `/pricing-simulator` and `/availability-navigator` placeholders are not
equivalent names. Not all source routes have explicit frontend guards; preserve
actual authorization boundaries rather than asserting blanket protection.

## Source contracts that constrain the port

### Bootstrap and permissions

Angular `services/user/user.service.ts:getUserData` requests
`${environment.base_url}/getUserdetails` and caches its promise. The root
initializers await it; identity failure can reject application bootstrap.
The subsequent CFC-fetch error handling does not cover that initial request.
React must explicitly model startup failure, not treat a failed lookup as
an authenticated empty/demo account.

Backend `common/user_helper.py` and `common/auth.py` resolve normal requests
through trusted `X-Goog-Authenticated-User-Email` identity, employee lookup and
an active account. This is not a frontend bearer-token implementation.
Service-specific exceptions are not browser login mechanisms; preserve the
existing authenticated origin/proxy boundary rather than synthesizing headers.

`services/auth-guard.service.ts` checks numeric flags including `sqf`, `bqf`,
`sqa`, `wf`, `admin`, `psf` with `psf_enabled`, and `act`. My Plan requires
`wf === 1` plus `my_plan_enabled`; Weekly requires `wf === 1` plus
`weekly_facts_enabled`. SQA/Weekly/My Plan also exclude CFC responsibilities.
My Metrics uses SQF access. Landing priority is enabled SQF, Quick Assist,
My Plan, Weekly, then Dashboards. Help/manifest/dashboard routes do not all
declare that frontend guard; backend authorization must still be preserved.

### SQF response, state and mobile behavior

`sqf/services/sqf-cards.service.ts:669–800` accepts bare arrays, legacy
`{ cards, sortBy }`, and period-keyed arrays/wrappers. Summary and
`details:<metric>` caches are separate and cleared on filter updates.
Period-only changes can switch already-loaded summary/sidebar/detail data
without another request. Preserve selected available periods and source
fallback behavior; service state is not evidence of localStorage persistence.

Axis resolution uses `hierarchy` for child level and `department`/`proposition`
for department; non-axis dimensions retain their first option. Legacy
ETD/WTD cards keep local selectors. Breakdown display wording does not change
backend keys.

The filter's source range is 30 days ago through yesterday. Its route handler
rewrites an initial non-yesterday date while `isDateChanged` is false, retaining
merged query parameters; later deliberate date selection is a different case.
Date controls are hidden for Quick Assist/Weekly/My Plan. At <=768px,
period controls move into the calendar header and the axis has a mobile menu.
Characterize desktop/mobile cache-availability quirks rather than assuming
identical selector visibility.

Analytics is a `window.dataLayer` push, not an API call. The source emits
`quick_facts_element_click` with period/axis action types and user/location
context. Literal fields are `gtm.start`, `event`, `employeeNumber`, `siRole`,
`quickFactEventType`, `quickFactCardType` and `selectedLocation`.
Period/axis filter callers can supply an empty card type outside details;
verify actual caller values and counts instead of only the event name.

Backend `sqf/metric_card_v2.py:130–138` formats `created_at` as UTC `updatedTime`
with `Z`, excluding `ready_for_trade` and `nightfill`. Angular converts it for
display. ETA text is generated only for yesterday's reporting date and can
prefix a supplied day label. Preserve date-only selection separately from
timestamp conversion and pending cutoff calculations.

### Weekly/My Plan and popup boundaries

`sqf/services/weekly-facts.service.ts` uses GET `/wf/<code>` or
`/myPlan/<code>` for page data, with no SQF date/depth parameter. Subscription
GET/POST use `/wf/userSubscriptions`, `/wf/updateUserSubscriptions` or
lowercase `/myplan/...`; POST sends multipart `FormData` with JSON-string
`locations` and `selected_views`.

Card/history selection uses source order and `dateFilterKey || 'weekNo'`,
including a distinct `half_year` branch. Mobile chooses `hasMobileView` cards.
Role/feature flags control Weekly/My Plan choices; hierarchy options and
subscriptions have additional view/role restrictions. Apply payload defaults
and reset behavior at the correct lifecycle, not hardcoded false/true values.

Source failures expose `errorTitle`, `errorMsg`, `subErrorMsg` and optional
`email`. A source quirk requires attention: `banner` is optional in `IWF.d.ts`,
but the success handler reads `pageData.banner.text`. Use realistic fixtures
and record this discrepancy instead of assuming optional fields are always
handled safely.

Weekly table alerts/info use `WFPopupComponent` with maximum width 530px and
maximum height 648px. It is separate from feature-alert acknowledgment.
SQF card Metrics Info uses `QfPopupComponent` in `sqf/components/shared/qf-popup/`,
opened through `SqfCardsService.openPopup` with the same maximum dimensions,
`autoFocus: false`, an info icon and panel class `qf-popup-container`.
Weekly uses a separate component/panel (`qa-popup-container`); feature alerts
use `feature-alert-modal`. No custom popup component is shared across the
three flows. The SQF source renders body HTML through its sanitization path;
verify that transformation when porting, not just the rendered markup.

Exports are real preview/capture/PDF/slide/print flows; SQF recognition goes
through its form and multipart POST `/sqf/recognize`, not a Weekly recognition
action. Do not flatten these distinct workflows into one generic dialog.
Shared export capabilities do not imply every format is visibly offered on
Weekly/MyPlan: source desktop entry points are PDF/print, and the mobile action
menu has subscription/feedback. See the dedicated assessment before adding UI.

The October 21 review also found source discrepancies that require explicit
characterization: both desktop and mobile initializers run even on desktop;
component mobile detection ends at 767px while SCSS ends at 768px; subscription
save compares locations but not views. Preserve observed behavior or record an
approved exception rather than silently fixing Angular quirks during the port.

## Concrete gap ledger

These source-level observations direct the roadmap; they are not claims that
the full applications have been exercised.

| ID | Evidence in current React | Required acceptance / roadmap stage |
|---|---|---|
| G01 | `AuthContext`: fixed WW demo, always authenticated, reload logout | Real bootstrap/roles/feature flags, CFC and identity-scoped cache behavior — 1 |
| G02 | `normalizePeriods` lacks top-level wrapper support and drops invalid data | Source-confirmed shape/error fixtures, preserved sort metadata — 2A |
| G03 | `usePeriodCards` fallback does not write context/URL; legacy array is treated WTD | Source selection/cache visibility/lifetime and no redundant requests — 2A |
| G04 | CardSidebar omits axis; links omit explicit search; breadcrumbs are text | Same cards/state/navigation across summary/details/sidebar/history — 1, 2A, 3 |
| G05 | Filter date accepts arbitrary initial URL date; no mobile calendar period control; date still shown on Trend | Source initial guard, 30-day/yesterday boundaries, mobile and view-specific controls — 2B |
| G06 | No integrated ETA flow; pages lack full auxiliary-query failures | Source pending/cutoff/error/support behavior and local timestamp correctness — 2B |
| G07 | No source event dispatch | Exact analytics event names/payloads/counts on desktop/mobile — 2B |
| G08 | No feature-alert workflow; card InfoModal uses 90%/480px/80vh and raw body HTML instead of source QfPopup contract | Alerts/acknowledgment/responsive panel — 2C; separate SQF/Weekly dimensions, HTML transformation and close/focus behavior — 3, 4 |
| G09 | Basic table shows sort icon but does not sort; chart gauge uses Doughnut and ignores needle | Match source sorting/chart variants and data formatting — 3 |
| G10 | Recognition timer, feedback/download disabled | Real requests, previews/artifacts and failure/cancel states — 3 |
| G11 | October 23 fixes dynamic history/defaults, response/table resets and group bugs; feature switch, hierarchy/mobile/Half Year/layout parity still open | Remaining WF03–WF08 source lifecycle, selection/table/mobile work and per-BU evidence — 4 |
| G12 | Metrics Info/subscriptions are text; subscription transport/types added October 23 but UI/actions remain absent | Detailed WF09–WF14 overlays, subscriptions, gated integrations and source events/artifacts — 4 |
| G13 | Whole source route families missing/placeholder | Independent application source designs and end-to-end delivery — 5 |
| G14 | V8 coverage with above-95% line gate and offline API-derived fixtures; no browser parity runner, ESLint config or CI test job | Differential coverage, targeted/full suites and operational acceptance — 0, 6 |

## Tests and completion criteria

The 33 React test files cover API wrappers, period/axis/tree/
formatting/table utilities, hooks, filter context, navigation/cards/tables/modal
and TrendPage. The existing InfoModal tests exercise rendering and click
dismissal, not responsive CSS or focus lifecycle. Filter tests mock query/
context surfaces; they do not prove real cross-page or network behavior.
Additional real FilterProvider/MemoryRouter tests verify URL restoration,
hierarchy readiness and preserving query parameters on filter changes.
The October 20 additions cover SummaryPage/DetailsPage loading/error/order/
drill-down, real query/API flow and caching, DatePicker bounds/navigation,
LocationTree search/selection/accordion behavior and HTML tooltip positioning.
The second pass covers chart dataset conversion and label/tooltip callbacks
with the canvas renderer mocked, nested-table expansion and scroll shadows,
and chart/table tab switching. These do not verify real canvas drawing.
Page queries and filter state are mocked, while real card renderers are used;
the new `App.test.tsx` also renders the real application/query/provider stack
using sanitized API-derived HTTP mocks. It covers actual summary-to-detail
navigation, date/location changes and cached period/breakdown selection.
Fixtures were captured from read-only local API requests on October 20, then
pruned and sanitized; they are not raw business data or production snapshots.
No live API is needed to run the tests. These are not end-to-end browser tests.
No dedicated AuthContext or browser
differential test files are present.

The file count is not an individual-test count or a coverage percentage.
The obsolete generic MetricCard's five tests were removed along with that
renderer; active SummaryCard/DetailsCard tests remain.
Post-expansion verification passes 248 tests across 33 files. V8 coverage,
including unimported application TS/TSX and excluding tests/setup/types,
is 97.24% lines, 96.09% statements, 88.82% branches and 96.63% functions.
Initial line coverage was 58.37% using the same scope. Run
`npm run test:coverage` to regenerate ignored reports under `coverage/`.
That command enforces 95.01% global line coverage; branches are not yet above
95% and are not gated.
This does not prove browser, backend or Angular parity.
Angular has 324 frontend `.spec.ts` files under `src/app`, including focused
SQF cache/shape/axis/calendar/analytics cases and many smoke tests. Weekly
component/service and the adjusted alert-dialog spec are smoke tests, not
backend or responsive-layout proof. Neither source tests nor generated
coverage artifacts establish current parity.

Accept each slice only with the same source/target user, portal, location,
date, data, viewport, browser and timezone. Evidence must include contract
fixtures, allowed/denied behavior, interactions/network side effects,
analytics, reviewed visuals and staging operational checks where relevant.
No unexplained difference, inert enabled action or placeholder route may be
marked complete. Intentional behavior changes require explicit exceptions.

See the [roadmap](superpowers/plans/2026-10-14-angular-react-migration.md) for
ordered delivery gates; later Angular commits remain separate until the
baseline is advanced.
