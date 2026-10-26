# Weekly Facts and My Plan: Angular parity assessment

Reviewed **October 21, 2026**. Target: the same behavior and appearance as
Angular on **every enabled BU**, not a desktop-only approximation.
The [implementation plan](superpowers/plans/2026-10-21-weekly-facts-myplan-parity.md)
supersedes Stage 4 of the October 14 roadmap.

**Conclusion:** React has page endpoints and a basic grouped HTML table, but
Weekly Facts/My Plan are **not parity-complete for any BU**. Source review
identifies shared behavior and portal-specific branches; it does not certify
all deployed data/configurations. The October 20 baseline's 97.24% line coverage measures
existing React code, not missing Angular functionality or browser pixels.

## Baseline and evidence

### Implementation progress: October 26

**Branch synchronization:** Quick Facts parity (`6035014`) is merged into dev
at `e8817e8`, and that dev baseline is incorporated here. Its subscription/AI
header actions, preferences dialog and page-preview plumbing are retained
alongside this branch's history/hierarchy, column modes and Weekly popup.
Metric-based subscription wrappers delegate to the dialog's key-based transport,
so both callers share the same endpoint/FormData implementation. Page-response
or metric changes close overlays; errors disable registered page actions.
These imported implementations still require source/browser qualification;
earlier descriptions of missing UI below are dated pre-integration gaps.
The user approved publishing with the imported code's coverage gap documented,
without lowering the 95.01% gate.
Initial combined validation passed 500 tests in 65 files and the build;
line coverage was 86.19%, below its retained gate. A test-only follow-up now
passes 556 tests in 66 files with 97.01% line coverage, so the unchanged 95.01%
gate passes again. External SDK/canvas/network boundaries remain mocked.
These results supersede the pre-integration 293-test/97.88% figures below.

The next slice on **`feat/weekly-facts-myplan-parity`** adds a pure selection
boundary and desktop hierarchy control to both pages. Initial/view selection
prefers history then hierarchy; hierarchy changes combine history where
configured, date changes preserve Angular's date-first fallback, and unmatched
filters retain the previously displayed table. A new response resets the first
view/date/hierarchy selection. The child/peer switch is available only for
cards offering it, and its selection persists across responses as in Angular.

Table projection supports desktop child/peer modes and the source mobile
parent/child/date/hierarchy/WFM rules. Cell/header association now uses original
`columnid`, including rows with missing cells. **Mobile projection is not yet
wired to mobile page/menu state** and is not mobile acceptance evidence.

Metrics Info and header/cell alerts now open the distinct Weekly HTML popup,
with source type/icon mapping, maximum 530px by 648px sizing, no initial
autofocus, keyboard/backdrop dismissal and focus restoration. Structured error
responses display title/message/support details rather than stale tables.
The separate feature-alert acknowledgment and SQF popup remain out of scope.

All **293 tests in 35 files** pass; full-source coverage is **97.88% lines**,
96.85% statements, 97.73% functions and 90.34% branches with the existing
95.01% line gate unchanged. The build passes with the existing large-chunk
warning. With user approval, the existing cutoff tests now use a fixed UTC
clock: their previous relative-hour calculation failed after 22:00 UTC.
No formatter application behavior changed.

This advances parts of Tasks 4/5/8, not complete tasks or an enabled BU.
Still open: real identity/permission gates and authorized BU profiles,
card-level Half Year and dual-initializer characterization, complete mobile
selection/layout, header KPI controls and table geometry/themes, subscriptions
UI, AI/banner/links/analytics, feedback/export and paired-browser qualification.
No new live API capture, subscription write, deployment or dev merge occurred
in this continuation.

### Implementation progress: October 23

The documented baseline was committed/pushed on `document-migration-plan`
(`07540f3`) and merged into `dev-branch` (`e657079`). Initial migration work
is on **`feat/weekly-facts-myplan-parity`**, created from that merge, not on dev.
Wireframes were excluded from these commits.

The first implementation slice corrects alert/link/AI/hierarchy wire types;
adds GET/POST subscription transport with source casing and multipart fields;
handles response-defined history keys; applies server variance and table KPI
expansion defaults; resets stale view/date on changed responses; and matches
source columnid filtering, empty-group handling, KPI substring matching and
singleton spacers. Subscription transport does not mean its UI is complete.
That slice passed 267 tests with 97.62% line coverage under the same
source-inclusion policy.

This is partial work across plan Task 2 and the source-independent parts of
Tasks 4/5, not completion of the entire tasks. Identity prerequisites,
hierarchy/mobile/Half Year selection, source initializer quirks, table display
contexts/layout, dialogs/actions and all-BU browser evidence remain open.
The gap ledger below records the **October 21 assessment**; use the dated
progress entries for which foundation issues have since changed.

| Evidence | Reviewed baseline / limit |
|---|---|
| Angular | `feature/smkt-qf-yday-toggle-mobile`, `02a9cf69889d74fb8542ec26c9ecb57aae041278` |
| React | `document-migration-plan`, `c97525f268befdc68446c7c864a9f2c79b279d5c`, including existing uncommitted cleanup/tests |
| Source history | Relevant Weekly/MyPlan, shared subscription, global-style and export changes, July 21 through October 21 |
| Runtime probe | Successful GETs to local `/api/getUserdetails`, `/api/sqf/getUniversalFilterGeneric`, `/api/wf/<permitted-root>` and `/api/myPlan/<permitted-root>` |
| Local profile | SI, National role, both features enabled; not another BU or a production profile |
| Data handling | Inspected field names, structure and feature flags; no raw business response, identity data or new fixture saved |
| Not executed | Angular/React paired browser runs, screenshot comparison, subscription writes, export artifact comparison or cross-BU sessions |

Angular local changes to `backend/config.py` and
`src/environments/environment.prod.ts` remain excluded from the committed
baseline. Runtime results necessarily reflect the local server's configuration;
they are **examples of real response shapes**, not proof of committed
configuration or universal data availability. Neither repository's application
code was changed for this assessment. Wireframes are not the specification.

### Source map

Angular paths are relative to `store-insights/` in the source repository.

| Reference | Responsibility |
|---|---|
| `src/app/sqf/components/weekly-facts/weekly-facts-home/weekly-facts-home.component.{ts,html,scss}` | Bootstrap, views, history, mobile menu, hierarchy, metadata, AI, actions and layout |
| `src/app/sqf/components/weekly-facts/wf-table/wf-table.component.{ts,html,scss}` | Column projection, KPI/grouping, sticky table, alerts and layout variants |
| `src/app/sqf/components/weekly-facts/shared/wf-styles.scss` | Responsive root-class width rules; verify their actual inclusion before copying |
| `src/app/sqf/components/weekly-facts/wf-popup/` | Weekly-specific HTML information/alert dialog |
| `src/app/sqf/typings/IWF.d.ts` | Partial declarations; actual template, service and response shapes also matter |
| `src/app/sqf/services/weekly-facts.service.ts` | Page/subscription URLs, shared mobile selection, dialog configuration |
| `src/app/sqf/components/shared/email-subscription-popup/` | Views, locations, store defaults, validation and unsubscribe |
| `src/app/sqf/services/sqf-filter.service.ts`, `components/shared/sqf-filter/` | Shared location, actions, hidden date controls, temporary subscription nodes |
| `src/app/services/auth-guard.service.ts`, `services/nav.service.ts`, `shared/side-nav-drawer/` | Permissions, CFC exclusions, desktop/mobile labels and routes |
| `src/app/sqf/components/shared/sqf-layout/` | Portal-specific Trend title and powered-by wording |
| `src/styles/{_variables.scss,_mixins.scss,app.scss}` | External theme variables, breakpoints, backend HTML/tooltip/goal styles |
| `src/app/core-qf/services/qf-cards-preview.service.ts` | Page capture, preview lifecycle and landscape export |
| `backend/common/user_details.py` | App-settings-driven feature flags and portal-specific access derivation |
| `backend/weekly_facts/{urls.py,data.py}` | Case-sensitive endpoints, stored page JSON, CFC/data errors, subscriptions and AI gates |

React counterparts are `src/pages/quick-facts/TrendPage.*`,
`src/components/trend/TrendTable.*`, `src/types/wf.types.ts`,
`src/utils/{tableTransform,htmlTooltip}.ts`, `src/api/trend.ts`,
`src/hooks/useTrendData.ts` and the shared auth/filter/navigation components.

### Recent changes the migration must retain

The focused window is July 21–October 21, separate from the broader October 14
report's activity counts. Current source and relevant diffs, not commit titles
alone, determine the target.

| Source commit / date | Migration consequence |
|---|---|
| `257f261e0`, `9c60bc198`, `0f33a9fb1`, July 27 | Data-driven variance and globally styled backend HTML; displayValue/tooltip can contain HTML |
| `246663816`, `f032f4fa7`, July 31/Aug 3 | Goal summary/progress layout; do not omit backend-generated footer/goal rows |
| `9a8ece85c`, Aug 4 | Updated toggle/filter layout; historical desktop wireframes are not the full target |
| `cb7da351d`, Aug 5 | Existing non-Store subscribers may clear all locations to unsubscribe; first-time subscribers still need locations |
| `56f18713f`, Aug 6 | Desktop three-column left alignment, including variance and goal bar; cell tooltip trigger moved to the inner wrapper |
| `b381090f4`, Aug 12 | Subscription entry moved into shared filter actions; reproduce desktop/mobile action placement |
| `a11d1466d`, `91002978c`, Aug 17/24 | Top/bottom-three tooltip content and score/delta typography; preserve singular backend store-name/store-val classes |
| `b55467900`, Aug 24 | Angular/Material 22 upgrade; verify current rendered controls rather than assuming older Material geometry |
| `39262aaa0`, `8970d1b39`, Sep 9 | Single visible group rows need 40px; hidden continuation cells with fallback rowspan 1 must not expand every row |
| `4b8613763`, Sep 14 | Shared export/capture performance and cleanup changes; distinguish multi-card capture from Weekly's page capture path |

No new Weekly backend product contract was found in this focused window; its
current registry still needs to be honored. Older backend behavior is not
optional merely because the recent changes were predominantly frontend.

## All-BU scope and qualification matrix

There is **no frontend constant that proves the complete enabled-BU list**.
Backend `app_settings` categories `app_access_wf` and `app_access_my_plan`,
resolved user access, stored `weeklyfacts_data` JSON and deployed theme assets
control the experience. Do not hardcode one SI response's view list for others.

| Portal / deployment evidence | Verified source differences | Runtime evidence / release requirement |
|---|---|---|
| `SI` | Trend terminology in desktop shell; Weekly/MyPlan access derived from SQF when enabled; CFC restrictions; National Weekly subscriptions can add synthetic hierarchy nodes | Local National GET only. Still require Store, intermediate levels, departments, CFC and paired browser evidence |
| `METRO` | Shares SI short desktop navigation/layout labels; generic Weekly access logic rather than SI's explicit override | No session captured; verify enabled features, hierarchy, subscriptions, mobile labels and theme |
| `BIGW` | Hierarchy label overrides: Zone -> Regions, Group -> Areas, Department -> Business; generic feature access logic | No session captured; verify every enabled view and source theme |
| `PEL` | Weekly/MyPlan access derived from SQF; missing-department message omits State; mobile action menu has a PEL profile exception | No session captured; verify hierarchy levels, feature combination and source theme |
| `360FM` | Weekly access derived from SQF; WFM table mode, no rotated first column, hierarchy-column rule, 84px metric offset, special store layout at level string `'5'`; distinct portal label | No session captured; verify Store and above-Store tables, My Plan enablement separately |
| `PEOPLE` | Distinct portal logo label; otherwise generic Weekly/MyPlan source branches | No session captured; verify whether either feature is enabled, rather than assuming support or exclusion |
| Other deployment families | Config filenames also identify `edg`, `sc`, `wiq-009` and `supers` families | Resolve each deployed family to its actual identity `portal` and enabled applications. Filenames are not a reliable portal-code/BU mapping |
| Any additional deployed BU | Backend/settings-driven defaults apply unless source has a specific branch | Must enter the same evidence register; an unlisted enabled BU blocks an "all BUs" claim |

**Scope closure requires an authorized deployment/feature inventory.** For each
BU record the returned portal code, Weekly/MyPlan enabled flags, role, hierarchy
levels, theme/version and expected views. Mark a disabled feature
`not applicable - confirmed disabled`, never `passed`. The source's encrypted
configuration files were not decrypted, and configuration/credentials must not
be copied into fixtures. No portal switching or impersonation was attempted.

Desktop `NavService` uses Trend for SI/METRO; the older mobile drawer's
`getWFTabName()` uses Weekly Facts/My Plan wording. Preserve each actual surface
until paired browser evidence establishes otherwise; do not globally rename
everything "Trend".

The SQF router declares `/quick-facts/weekly` and `/quick-facts/myplan`.
Although the home switch constructs paths using `cardOrigin`, the current
My Metrics router does **not** declare Weekly/MyPlan children. Do not invent
`/my-metrics/weekly` or `/my-metrics/myplan` aliases from that generic method.

## Response and selection contract

### URLs and backend responsibility

Paths below are relative to `/api`.

| Operation | Exact contract |
|---|---|
| Weekly page | GET `/wf/<code>`; backend metric `weeklyfacts` |
| My Plan page | GET `/myPlan/<code>`; backend metric `myplan` |
| Subscription read | GET `/wf/userSubscriptions` or `/myplan/userSubscriptions` |
| Subscription save | POST `/wf/updateUserSubscriptions` or `/myplan/updateUserSubscriptions`; multipart fields `locations` and `selected_views`, each a JSON-string array |

Page requests have **no SQF date, depth, period or axis argument**.
Server-generated view order, HTML, values, colors, alerts, history and goals are
authoritative. The backend adds hierarchy/refresh metadata and settings-based
links, subscriptions and AI; stored JSON is merged into the response and can
override base fields. React must not recompute business measures.

`refreshTime` here is formatted without a timezone suffix. Do not apply the
SQF `updatedTime` UTC/`Z` rule to Weekly data without evidence. Compare
Angular's `MMM d, h:mm a` output, fiscal-period parentheses and mobile popup
formatting in a fixed locale/timezone, including daylight-saving boundaries.

### Real local SI shapes observed

| Feature | Observed view keys | History / content structure |
|---|---|---|
| Weekly | `week_overview`, `month_overview`, `half_overview`, `weekly_trend`, `monthly_trend` | Overview keys are `weekNo`, **`monthNo`**, **`halfNo`**; 8/13/3 history values respectively. Trend contents are arrays; hierarchy selection must be checked |
| My Plan | `month_overview`, `monthly_trend`, `h1_overview` | Month uses `month`; monthly trend has object contents; Half Year uses card-level `dateFilterKey: 'half_year'` and `half_year` |
| Defaults | Weekly variance false; **My Plan variance true** | React initializes both false |
| Shape | Header/cell objects, array rows with `columnid`; optional hierarchy dropdown | No KPI expansion flags in the sampled first tables, so these responses cannot qualify KPI/defaultExpanded behavior |

These are **observed examples**, not globally mandated view names/counts.
The existing saved `sqf-api.sanitized.json` covers SQF only. It contains no
Weekly/MyPlan or cross-BU snapshots.

### Required selection rules

1. Preserve response order. Feature switch choices come from enabled identity
   flags; desktop view controls differ when both versus one feature is enabled.
2. Select history by `activeCard.dateFilterKey || 'weekNo'`, not a hardcoded
   month/week conditional. Arrays can instead contain hierarchy variants
   identified by `filterKey`. Object contents have a different unwrap path.
3. My Plan's exact mobile tab name `Half Year` takes the source branch that
   finds a **card** by `dateFilterKey === 'half_year'` and
   `card.half_year === selectedValue`; it is not just another contents lookup.
4. Hierarchy availability is `allowedViews` including the desktop view key or
   `'mobile'`. Initial hierarchy uses the first dropdown option. The hierarchy
   change handler can combine date and hierarchy criteria; history fallback is
   not interchangeable with this path.
5. Source load clears prior selection/data/AI state; mobile service selection
   also resets on each page request. Capture exact state on metric, location,
   response, view and viewport transitions; never leave a stale view/date
   displaying another location's data.
6. Mobile uses only `hasMobileView` cards, `mobileDateFilterTabName`,
   `mobileDisplayName`/`mobileInfo`, menu preview versus committed selection,
   and boundary-disabled previous/next buttons. Canceling a menu tab preview
   restores the committed tab/date.

Source quirks below qualify these rules; a cleaner invented resolver is not
automatically one-to-one.

## Gap ledger

| ID | Current React evidence | Required migration outcome |
|---|---|---|
| WF01 | Demo identity `WW`, always authenticated, static navigation | Trusted bootstrap; actual numeric `wf` role, feature flags/CFC exclusions, portal-specific shell and direct-link handling |
| WF02 | No Weekly/MyPlan feature switch; one generic view select; shared date remains visible | Source feature combinations, conditional view-control presentation, hidden SQF date/period/axis, merged query/location navigation |
| WF03 | History recognizes only `month`, otherwise `weekNo` | Dynamic keys, object/array unwrap, card-level Half Year, hierarchy variants and lifecycle selection |
| WF04 | `showVariance=false`, `isExpanded=true`; no load reset | Root variance defaults/label and table-specific `kpiFilterEnabled ? defaultExpanded ?? false : true`; preserve source reset boundaries |
| WF05 | Desktop colTypes only; row cells projected by array index | Desktop child/peer switch and mobile hierarchy/date column rules; source `columnid` projection |
| WF06 | KPI split-token check differs from source substring check; no empty-group guard; singleton spacers omitted | Source measure column/KPI semantics, zero-visible-group handling, recalculated row spans, singleton/multirow spacers and no input mutation |
| WF07 | `colSpan=0` becomes 1; widths unused; metric index always 1; second sticky left unset | Hidden headers, configured widths, double-goal and three-column layouts, sticky geometry/z-index/scroll/print fidelity |
| WF08 | Backend HTML/global styles partially ported | Goal progress/variance/top-bottom-three tooltip classes, source metrics/tag/goal styling, WFM and theme behavior |
| WF09 | Alert types declared boolean; alert icons/actions absent; Metrics Info inert | Object alert payloads, icon mapping, distinct Weekly dialog and metadata/mobile-info flow |
| WF10 | `available_views` typed but no subscription API/UI | Complete existing preferences, store/non-store defaults, validation/unsubscribe, synthetic nodes, deep-link opening and save/error/cancel |
| WF11 | AI/hierarchy missing from response type; links incorrectly typed as strings | Payload-driven AI drawer, banner, toolkit/usage links and action availability |
| WF12 | Generic fetch error text | Source errorTitle/errorMsg/subErrorMsg/email, department/CFC/no-data distinctions; explicit transport/bootstrap errors |
| WF13 | No matching analytics | Actual source event payloads/counts for tab, desktop date, mobile date and hierarchy transitions |
| WF14 | Disabled feedback/download; generic browser print | Source shared feedback, visible PDF/print preview and landscape capture; artifacts and cleanup, not `window.print()` equivalence |
| WF15 | Unit tests mostly use mocked hooks and simplified payloads | Real-provider/transport tests, sanitized BU fixtures, paired browser/visual and side-effect acceptance |

A completely filtered-out group was reproduced directly against the current
transform and throws `Cannot read properties of undefined (reading 'find')`.
The projection also uses positional entries rather than Angular's original
`columnid` membership rule. With excluded columns, sparse/reordered rows can
therefore retain the wrong cells. Angular's filter also preserves wire order;
do not silently sort malformed rows as a supposed parity fix. These findings
are recorded for the implementation phase, not fixed in this documentation
change.

## Table and visual requirements

The source table projects columns before KPI/group processing, makes a deep
copy, and guards groups that disappear. Desktop child toggle excludes peers
when on and children when off, while retaining common/parent/selected columns.
Mobile retains the first two columns plus source parent/child/hierarchy/date
matches; WFM substitutes the child hierarchy rule. Do not infer columns solely
from display text or the array position of a cell.

Preserve hidden `rowSpan === 0` and `colSpan === 0`, measureColumnId default 1,
KPI substring semantics, and group spacers even for singleton groups.
Place the expand/collapse icon in the source metric header, not a new
"Show all rows" toolbar switch. Its original-column behavior with double-goal
headers needs a source screenshot, not a guessed relocation.

Compare columnWidth width/min/max rules, Weekly/MyPlan first-column widths,
double-goal header handling, first-two-column stickiness, WFM offsets, right
alignment and three-column desktop left alignment. Preserve source literal
class conditions even where they overlap; verify the rendered outcome.
Single visible group rows grow to 40px; hidden continuation cells must not
trigger that rule. Standard rows are 24px, variance value rows 44px, goal
tracker rows 36px and group spacers 2px in the reviewed styles.

Backend-injected `wf-*`, `tt-*`, goal tracker and variance classes require
**global** CSS, not only CSS Modules. External `env.css` supplies
`--main-bg-color`, `--main-txt-color`, `--bar-bg-color`, `--bar-txt-color`,
`--body-txt-color`, `--tr-bg-color` and `--tr-hover-bg-color`. Fetch authorized
theme assets per BU; do not replace all themes with the demo green. The source
table header itself has a literal dark green background; do not recolor every
element merely because other elements use theme variables.

The latest tooltip is attached to inner header/cell wrappers, not the entire
table cell. Preserve infoMessage suppression, plain versus HTML content,
top/bottom-three names/values, edge/sticky-column positioning and actual
desktop/mobile widths. Native `title` alone does not reproduce Material
tooltip timing/appearance.

The component observer uses mobile at **<=767px** while SCSS `xsm` uses
**<=768px** and `sm` starts at 769px. This source mismatch must be characterized
at 767/768/769; silently standardizing one breakpoint changes the baseline.
Also compare 360/390/503/714/904/1024/1280/1440px widths and scroll-container
height rules around 600/740/741/900/901px, including fixed/sticky chrome.

## Integrations that must remain distinct

**Weekly information/alerts:** WFPopup uses maxWidth 530px, maxHeight 648px,
`autoFocus: false`, `qa-popup-container`, payload icon/title/HTML body and
optional refresh time. Icon mapping: new/new_releases, warning/error,
error/priority_high, info/info_outlined, success/done. Mobile info appends
formatted refresh time, an `<hr />`, then global Metrics Info HTML.
This is neither SQF's QfPopup nor feature-alert acknowledgment.

**Subscriptions:** `available_views` is a list of permitted card keys, not
dialog checkbox objects. The home component joins keys to cards in card order,
producing `{name, displayName, checked}`. One available choice disables the
checkbox; subsequent saved-view hydration must match source behavior. Store
users default to their responsibility when unsubscribed and do not see the
location tree. Non-store first subscriptions require locations; existing
subscribers may clear all locations to unsubscribe, but still require a view
when choices exist. Cancel cannot save; HTTP failure must remain visible.
`#EmailSubscription` opens once after successful load. SI National Weekly
temporarily adds hierarchy nodes, removed on dialog close; backend recognizes
`metro` and `w_retail`. My Plan Store `['month_overview']` is rewritten to
`['monthly_trend']` by the backend; do not duplicate that business rule.
Preserve selected-location count/list, tree department hiding and no-navigation
checkbox behavior. The displayed schedule notes say Weekly Overview every
Monday/Tuesday/Wednesday, Monthly Trend every second fiscal-month Monday,
and My Plan Monthly Overview every second fiscal-month Tuesday; the backend's
delivery schedule is not a new frontend scheduler. Match the source's
conditional note visibility, three-column location list and 130px scroll area.

**AI/banner/links:** actions are gated by source flags, not content presence
alone. AI is an end-side, resizable, no-backdrop drawer with Beta/feedback/close
and source reset behavior; whitelisting belongs to the backend.
Toolkit/usage links are `{displayText, link}` and open in a new tab.
The banner is broadcast through shared alert/layout integration, not appended
as an unrelated table row.

**Feedback/export:** shared filter provides feedback, desktop PDF/print
preview and a mobile menu with subscription/feedback. Do not add mobile
download or a Google Slide button just because the shared export type supports
slides: the visible Weekly/MyPlan entry points must match the source.
Weekly page preview uses landscape, scale 2, a 1500px preview layout,
expanded scroll region and post-capture class restoration.

**Analytics:** use the existing source event envelope
`quick_facts_element_click` with `gtm.start`, employeeNumber, siRole,
quickFactEventType, quickFactCardType and selectedLocation. Event types include
`weeklyTabChanged` / `myPlanTabChanged`, corresponding `DateFilterChanged`,
`MobileFilterChanged` and `HierarchyDropdownChanged`. Initial source tab
selection can emit events; compare counts, not only click handlers.

## Source discrepancies requiring characterization

| Source behavior | Migration decision rule |
|---|---|
| Both desktop and mobile initializers run on every successful load; mobile initialization can overwrite activeCard/table even on desktop | Record final source view/history/table/event state for a response whose first desktop and mobile cards differ; preserve observed behavior unless an exception is approved |
| Banner is optional in typings but accessed as `pageData.banner.text` | Capture missing/empty/present cases; do not label a source crash as desired UX or silently invent parity |
| Subscription save compares only serialized locations, not changed views | A views-only edit with unchanged location order may not POST. Capture source behavior and obtain approval before intentionally fixing it in React |
| Same-mobile-value selection may not commit a previewed tab; internal arrow arithmetic wraps but buttons disable endpoints | Test actual menu/buttons and event counts, including equal labels across groups and one-item history |
| `IWF.d.ts` incompletely describes headers/rows/tags and optional fields | Prefer observed wire/template contracts; correct React types without copying inaccurate source declarations |
| Guard/navigation variants do not all enforce identical combinations; My Metrics has its own SQF gate | Record direct navigation, in-app switch and mobile/desktop results; do not broaden access while simplifying conditions |
| Backend subscription-read failures can return empty arrays | Record source/backend behavior; React must still expose actual transport failures rather than adding a new catch-to-empty path |

Any intentional correction needs a named exception with source evidence,
approved new behavior and regression coverage. Until then it is an open parity
decision, not permission to redesign.

## Definition of done

For **each enabled BU and each enabled feature**, supply sanitized contract
fixtures and matched Angular/React results for permitted Store and above-Store
levels, applicable departments/CFC outcomes, all response views/history,
desktop/mobile transitions, table variants and enabled actions.
Use the same committed Angular version, response data, permissions, theme,
browser, locale, timezone and viewport.

Record request method/path/body/count, selected state, visible text/HTML,
analytics, screenshots, export output and errors. Pixel comparisons must have
no unexplained differences; mask only documented volatile data and use a
recorded rendering tolerance, never mask the table or controls. Unknown BU
inventory, unavailable fixtures, unreviewed exceptions, disabled placeholder
actions or unexecuted browser cases block release qualification.

The implementation plan separates this evidence gate from delivery of the
shared renderer. No cross-BU parity percentage or completion date is defensible
from today's single SI profile.
