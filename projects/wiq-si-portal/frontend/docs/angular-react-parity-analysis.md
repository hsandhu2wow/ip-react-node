# Angular / React parity analysis

Reviewed: 2026-10-10. This is a source and local-history comparison, not a
runtime, production or screenshot certification.

## Baselines and evidence

| Item | Angular | React |
|---|---|---|
| Git repository | `dsa-buying-insights` parent repository | `hsandhu2wow/ip-react-node` |
| Application path | `store-insights/` | Repository root |
| Branch | `feature/smkt-qf-yday-toggle-mobile` | `dev-branch` |
| HEAD | `dbd096cd36c457531f7d3ffd6e6b6fa9176d6c02` | `c97525f268befdc68446c7c864a9f2c79b279d5c` |
| Latest commit | Oct 8: information-popup styling | Oct 8: WTD/YDAY and breakdown filters |
| Frontend stack | Angular/Material 22, TypeScript 6, RxJS, Chart.js | React 19, TypeScript 6, Router 7, Query 5, Chart.js |
| Backend | Python 3.12, existing application/services | No backend implementation in this repository |

Angular's April `CLAUDE.md` and React's June design describe older versions
and scopes. Use current manifests and actual source, not those historical
technology descriptions.

The user selected committed Angular HEAD as the product baseline. Angular has
local modifications in `backend/config.py` and
`src/environments/environment.prod.ts`; the parent repository also contains an
untracked `quick-assist-demo.html`. Configuration values were not copied.

React has active uncommitted changes in cards, filters, ETA/date formatting,
sorting, layout and tests, plus local wireframes. The working tree changed
during this review. These are work in progress, not a frozen or accepted
release; committed findings below must be reconciled with that work before
implementation. This documentation pass does not edit application files.

## Last three months

Window: **July 10 through October 10, 2026**, inclusive in Sydney local time:
`2026-07-10T00:00:00+10:00 <= committer timestamp <
2026-10-11T00:00:00+11:00`. Counts include merges and commits reachable from
local HEAD; remote-only branches and uncommitted work are excluded.

| Scoped history | July 10–31 | August | September | October 1–10 | Total |
|---|---:|---:|---:|---:|---:|
| Angular `store-insights/` | 63 | 62 | 31 | 6 | **162** |
| React | 12 | 22 | 0 | 2 | **36** |
| Angular parent repository, context only | 94 | 125 | 37 | 6 | 262 |

Angular has 136 non-merge commits in the application scope. Commit counts are
activity indicators, not a measure of parity or code quality.

To reproduce the scoped evidence, run in each Git root:

```bash
# Angular parent Git root:
git log HEAD --format='%h %cI %s' -- store-insights/
# React Git root:
git log HEAD --format='%h %cI %s'
```

Filter `%cI` timestamps to the interval above. Do not count the parent
repository as if every change belongs to Store Insights, or rely solely on
commit subjects. Representative actual diffs and current implementations were
reviewed.

### Angular changes that affect migration

| Period / commits | Evidence and migration implications |
|---|---|
| July dashboards: `9ad55e3b9`, `7180a9f36`, `88ff5ad4c`, `eaaffbc03` | Mobile category drawer, sticky filter/sort/view controls, hide-on-scroll chrome, peek/back-to-top and overflow behavior. React dashboards remain a placeholder. |
| July Weekly/MyPlan: `257f261e0`, `e3be3de97`, `85b947c0e`, `faeec199c`, `eb12c0c2c`, `3b1ebdd68` | Variance toggle and rich HTML tooltips, frozen-column collision avoidance, cached boundaries and reused tooltip panel. A plain native tooltip is not equivalent. |
| July `598fb24cb` | My Plan Half Year/HTD history-selection handling; compare actual selection behavior. |
| August `56f18713f`, `a11d1466d` | Three-column My Plan desktop alignment and top/bottom-three styling. |
| August `ac36b33b7`, `c5af46495`, `b381090f4`, `2c9f5f664` | PDF/subscription behavior and subscription entry moved to shared filter. React labels/disabled buttons do not implement these actions. |
| August `9a0532728` | Backend `updatedTime` becomes UTC `created_at`; frontend must convert timestamps locally without shifting reporting dates. |
| August `63d53c22d`, `229ed8229`, `1b78e8388`, `03eb14d87` | Dashboard bookmarks and exact employee identity matching. |
| August `b55467900`, `cbd810b83` | Angular 22/Material migration and additional/headless test coverage. Smoke-test additions are not proof of behavior changes. |
| September `81cda6643`, `341cc9e29`, `af8d4f33d`, `a35a64a69` | Global WTD/YDAY, hierarchy/department axis, mobile controls and legacy mango-card compatibility. Backend child key is `hierarchy`, not `childLevel`. |
| September `0ac71252b`, `36ecb8d58`, `20427b648` | BQF notifications and dashboard direct-link/menu behavior. |
| October `5ca765e45`, `e950e95be` | Active-view period availability and retained selection; details switches cached period data without refetching. |
| October `677fda858`, `267143057` | Period and axis GA events on desktop/mobile. React's Oct 8 spec explicitly excluded analytics. |
| October `dbd096cd3` | BIGW information-dialog theme/hover styling. |

### React changes and remaining risk

| Period / commits | Implemented work and implications |
|---|---|
| July `257ad99`, `feab2d0`, `41bdd4d`, `849434c`, `6d06198`, `2491aa4` | Summary-to-details availability, sidebar/two-column layout, numeric `details` flag handling and styling. These are partial slices, not whole-app parity. |
| July/August `a7e1377`, `e458778`, `44cc1fe`, `58480c0` | Further details work and build configuration; some work was explicitly WIP. |
| August `3052bf3`, `094f99a`, `9a6086f`, `c943a1b`, `8451896`, `07adfdd`, `8485b25` | Weekly/MyPlan types, API, grouped/KPI table transformation, query, component and routes. |
| August `9d6a74e`, `6bd7698`, `0a38bfb`, `509b1ce` | Navigation active-state fix, backend HTML rendering, table/chart labels/tooltips, custom calendar and more styling. |
| October `765a30d`, `c97525f` | Period-keyed responses, axis resolution and URL-synced controls. No GA implementation; earlier deferrals remain functional gaps. |

There are no September commits in the reviewed React history. October's
filter implementation catches up with part of Angular's September work but
does not establish coverage of all later fixes.

## Route and feature parity matrix

Paths in the Angular column below are relative to `store-insights/src/app/`.
Status means source coverage, not tested runtime equivalence.

| Feature | Angular evidence | React evidence / status | Required work |
|---|---|---|---|
| Bootstrap/identity | `app.module.ts`, `services/user/user.service.ts`, `services/auth-guard.service.ts` | `src/context/AuthContext.tsx`: always-authenticated demo user | Real bootstrap, roles, feature flags, CFC restrictions and identity-scoped caches |
| Landing/route guards | `app-routing.module.ts`, `sqf/sqf-routing.module.ts` | `src/App.tsx`: wildcard sends all unknown paths to Quick Facts | Source landing priority, direct links, denied states and complete route map |
| Quick Facts summary/details | `sqf/components/shared/sqf-summary-home/`, `sqf-details-home/`, `sqf-cards.service.ts` | `SummaryPage`, `DetailsPage`, summary/detail cards implemented | All variants, defaults, sorting, errors, drill-down, actions and navigation state |
| Period/axis/date | `sqf-filter.service.ts`, `sqf-filter/`, `sqf-calendar-header/` | `FilterContext`, `FilterBar`, `usePeriodCards`, `breakdown.ts` implemented | Initial-date guard, source/mobile visibility and cache semantics; integrate active local work |
| Analytics | `sqf-cards.service.ts:870–880`, filter/calendar callers | No matching analytics source found | Source event names/context, no duplicate events |
| Quick Assist | `sqf/components/quick-assist/`, `qa-cards.service.ts` | No `/quick-facts/quick-assist` route | Discussion points, group/store/department data, charts/tables and permissions |
| Weekly/MyPlan core | `sqf/components/weekly-facts/`, `IWF.d.ts` | `TrendPage`, `TrendTable`, `tableTransform.ts` | Enabled view navigation, server defaults, history/HTD, hierarchy, frozen columns, mobile |
| Weekly/MyPlan actions | Same components, `weekly-facts.service.ts` | Metrics Info text/subscription label are inert; no full action flow | Popover, subscriptions, exports, banners, AI panel, feedback/toolkit links |
| SQF actions | `backend/sqf/urls.py`, `core-qf/services/qf-cards-preview.service.ts` | Recognition simulates loading; feedback/download disabled | Recognition POST, thank-you data, previews/capture/download and feedback |
| Dashboards | Root dashboard routes/components/services | `/dashboards` renders `ComingSoon` | Catalog, filters, favourites, bookmarks, info, embeds and mobile chrome |
| BQF | `bqf/`, `bqf/bqf-routing.module.ts` | No `/bqf` route | Distinct product/state/time/supplier/cluster filtering, metrics and notifications |
| My Metrics | `me-at-woolies/me-at-woolies-routing.module.ts` | No `/my-metrics` route | Source entry point and reused SQF routes with correct context |
| ACT | `act/act-routing.module.ts`, shared React dashboard wrapper | `/availability-navigator` placeholder | `/act`, `/act/avnav`, permissions and existing service/wrapper integration |
| Price Simulator | `price-simulator/price-simulator-routing.module.ts` | `/pricing-simulator` placeholder; source uses `/price-simulator` | Correct routes and simulation/share/grant/scenario/report workflows |
| Admin | `admin/admin-routing.module.ts`, admin services | No `/admin` route | Dashboards/attributes/tags/users/alerts/menus and admin authorization |
| Help/manifest | `help/help-routing.module.ts`, root manifest route | Help affordance not wired; routes missing | Access/support/training/report/aboutUs/faq and manifest behavior |
| Branding/responsiveness | `src/styles/`, assets and component SCSS | CSS Modules/global theme and two refresh SVGs | All portal themes, real logos/assets, source breakpoints, overlays and print/export |

Angular dashboard routes include `search/:searchValue`, embedded/external/
Tableau/Looker routes, dashboard info, app/list routes and favourites.
Price Simulator has simulations, setup/details, views, grants, shares,
scenario actions and report generation. These are independent workstreams,
not small extensions of Quick Facts.

Some dashboard/help/manifest source routes do not have explicit frontend
`canActivate`; do not falsely describe every source route as guarded.
Backend authorization still applies.

## Contract requirements

### Identity and permissions

Normal identity is established by the backend using IAP's trusted
`X-Goog-Authenticated-User-Email`, exact employee-directory matching and an
active portal account. The frontend must not synthesize trusted headers or
introduce bearer/Firebase authentication without an approved architecture
change. Angular's current manifest does not establish Firebase auth.

Bootstrap uses `GET /api/getUserdetails` and `/api/sqf/getCFCChildCodes`.
Source role flags include `sqf`, `bqf`, `sqa`, `wf`, `admin`, `psf` and `act`.
Weekly requires `wf === 1` and `weekly_facts_enabled`; My Plan requires
`wf === 1` and `my_plan_enabled`. CFC responsibility restricts Quick Assist,
Weekly and My Plan. Default redirect priority is SQF, Quick Assist, My Plan,
Weekly, then Dashboards.

### Quick Facts

React's `src/api/sqf.ts` calls, relative to the configured `/api` base:

```text
GET /sqf/getUniversalFilterGeneric
GET /sqf/getDataLoadETA
GET /sqf/getSQFMetricCardsStatus
GET /sqf/summaryCards/<depth>/<date>[/code]
GET /sqf/detailCard/<metric>/<depth>/<date>[/code]
```

Retain depth-zero omission of location code, permission-defined hierarchy,
hidden/nonclickable nodes and API depth. Response variants include:

```ts
Card[]
{ cards: Card[], sortBy: string }
{ WTD?: Card[] | { cards: Card[], sortBy?: string },
  YDAY?: Card[] | { cards: Card[], sortBy?: string } }
```

The above is contract notation, not a proposed replacement type declaration.
`normalizePeriods` currently supports plain arrays and period-keyed values;
the legacy top-level wrapper needs an explicit fixture and comparison.

Preserve mixed successful/error cards, period-specific sorting and pending ETA
versus failed/no-level-data states. Source period caches are separate for
`summary` and `details:<metric>`. Keep selection when it is present in a new
response, fall back only when unavailable, and switch cached periods without
refetching. Source period/axis persistence is in-memory service state, not
demonstrated browser-storage persistence. React additionally uses
`?period=`/`?axis=`; URL compatibility needs source verification.

Child axis maps to backend `hierarchy`; department maps to offered
`department` or `proposition`. Other dimensions take their first option.
An unresolved selection can retain previous content. Legacy mango ETD/WTD
cards keep per-card selectors. `breakdownLabelOverride` changes wording, not
keys. Hide the axis control at Store/Department; preserve BIGW Zone→Regions,
Group→Areas and Department→Business labels.

Default/max reporting date is yesterday. On initial navigation Angular
redirects a non-yesterday query date once to yesterday while merging query
parameters; it does not merely reject future dates. React initializes from
the query date. This is a concrete acceptance gap.

Desktop period visibility consults the active summary/details period cache.
Mobile period controls are inside the calendar at width `<=768`.
Source caveats to reproduce or explicitly approve changing: mobile visibility
uses width rather than cache availability; legacy arrays do not populate the
period cache in `checkNoDataV2`. Do not silently "fix" these while claiming
one-to-one behavior.

Backend `updatedTime` is UTC `created_at` with ISO `Z`, omitted for
`ready_for_trade` and `nightfill`. ETA UTC times are normalized to the user's
local today. Compare midnight/DST/pending-cutoff cases separately from
date-only selection.

### Analytics

Source event: `quick_facts_element_click`. Payload includes
`quickFactEventType`, `quickFactCardType` and `selectedLocation`.
Recent event types include `periodChangeWTD`, `periodChangeYDAY`,
`breakdownAxisChangeChildLevel`, `breakdownAxisChangeDepartment`.
Verify exact caller payloads and event counts, including the mobile calendar.

### Weekly Facts and My Plan

```text
GET  /api/wf/<code>
GET  /api/myPlan/<code>
GET  /api/wf/userSubscriptions
GET  /api/myplan/userSubscriptions
POST /api/wf/updateUserSubscriptions
POST /api/myplan/updateUserSubscriptions
```

The data endpoint is camel-case **`myPlan`**; subscription routes use
**`myplan`**. Data requests use code alone, not the SQF date/depth parameters.
Subscription POST uses multipart `FormData`; `locations` and
`selected_views` are JSON strings.

Preserve backend-enabled tabs, `varianceFlag.value`, `defaultExpanded`,
`dateFilterKey` (default `weekNo`), history/month/HTD behavior, mobile view
configuration, hierarchy filtering, banners and support-rich error payloads.
Committed `TrendPage` initializes variance to false and expansion to true
rather than server defaults and has no Weekly/MyPlan view switch.

Preserve goal/variance HTML, global CSS classes, KPI filtering, group row spans,
two frozen columns, header structure, alignment and top/bottom-three styles.
Rich tooltips need viewport/frozen-column collision handling. Source tooltip
inspection found mouse-hover behavior, not keyboard parity; assess keyboard
behavior explicitly rather than claiming it already exists.

### Broader backend surfaces

| Feature | Contracts to retain |
|---|---|
| Recognition | POST `/api/sqf/recognize`, GET `/api/sqf/getThankYouCard` |
| Quick Assist | GET `/api/sqa/group/<code>`, `/store/<code>`, `/dept/<code>` |
| Dashboard catalog | GET `/api/menu/<app>`, `/getDashboardsCount/<app>`, `/getDashboards/<app>[/search]` |
| Dashboard info | GET `/api/getDashboardDetails/<id>`, `/getInfo/<id>`, `/getExternalLinks/<id>` |
| Embeds | POST `/api/dashboards/generateJWT`, `/generateLookerSSO` |
| Favourites/settings | Source add uses GET `/api/user/favourites/<id>`; remove uses DELETE; settings use PUT |
| BQF | Distinct metric/filter paths with state/time/code/supplier and optional cluster; source registry is `backend/bqf/urls.py` |

Do not "modernize" unusual source verbs or endpoint casing during the parity
port. The backend remains unchanged unless a separately approved dependency
requires work.

## Visual, operational and test findings

Angular's `src/styles/_variables.scss`, `_mixins.scss`, `app.scss`, component
SCSS and source assets define the visual contract. There are both 768px and
767px breakpoints in source surfaces; test both sides, including exact widths.
Existing React wireframes are supplementary, not the acceptance baseline.

Charts require data-driven labels, colors, tooltips, stacking and annotations.
The current React chart excludes the `needle` dataset and renders gauge as
doughnut; source gauge behavior needs dedicated comparison. Quick Assist's
60×27 sparkline must not be replaced by a generic full-sized chart.

Exports use source `core-qf/services/qf-cards-preview.service.ts` with
`html2canvas-pro`, scale 2, cropping and overlay exclusions. Browser print is
not equivalent to capture/download or full-scroll export.

Angular has 324 frontend `.spec.ts` files, Karma/Jasmine/headless Chrome,
focused filter/cache/calendar/axis tests and many construction-only smoke
tests. Backend tests cover UTC timestamps and exact employee identity.
No package-level E2E runner was identified. React has Vitest/jsdom/Testing
Library tests for cards, filters, hooks and transformations, but no inspected
Angular-versus-React browser acceptance harness.

React production serves a static SPA on App Engine `ip-react`; dispatch
forwards APIs to existing services. Angular backend provides authenticated
SPA fallback and selected private-cache responses. Verify equivalent identity,
deep links, query strings, assets, errors and service routing in staging.

## Limits and acceptance

The review covered architecture, route inventory, important service/data
contracts, representative components and recent actual diffs. It did not
exhaustively trace every Admin, Price Simulator, BQF or ACT template and
transformation. Their inventories identify required migration slices, not
implementation-ready specifications.

Neither application was run against a shared authenticated backend. Tests,
screenshots, live analytics, authenticated embeds and deployments were not
executed in this documentation pass. No production or remote-history
equivalence is asserted.

Use the [migration plan](superpowers/plans/2026-10-10-angular-react-migration.md)
to close these gaps. A slice is accepted only with matching data/user/context,
behavioral scenarios, route/permission checks and reviewed visual evidence.
Every source requirement must have an acceptance scenario; every unexplained
difference remains open.
