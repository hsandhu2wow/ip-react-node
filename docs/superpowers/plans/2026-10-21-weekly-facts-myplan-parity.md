# Weekly Facts and My Plan Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the committed Angular Weekly Facts/My Plan experience in React, with identical permitted views, data, controls, interactions and appearance on every enabled BU.

**Architecture:** Keep the Python APIs and server-generated business measures/HTML unchanged. Extend the existing TrendPage, TrendTable, Query hooks and shared shell; isolate selection rules in a small pure utility and keep backend-HTML styles global. Qualify the shared implementation against a per-BU evidence register rather than creating separate hardcoded pages per portal.

**Tech Stack:** React 19, TypeScript 6, React Router 7, TanStack Query 5, Axios, CSS Modules/global CSS, Vitest 4/React Testing Library; add a browser differential runner during the browser acceptance task.

---

## Scope, authority and execution rules

**Execution update, October 26:** The next feature slice adds typed desktop
selection/hierarchy state, child/peer column controls, source mobile projection
at the utility boundary, original-column header association, Weekly information/
alert dialogs and structured error details. The suite passes 293 tests in 35
files with 97.88% line coverage. This advances Tasks 4/5/8; none is fully closed:
mobile state wiring, Half Year/initializer characterization, table geometry,
error illustrations and paired-browser evidence remain outstanding alongside
the identity/BU/action prerequisites. See the
[current progress register](../../weekly-facts-myplan-parity.md#implementation-progress-october-26).

**Execution update, October 23:** The baseline is merged into `dev-branch`
(`e657079`); migration starts on `feat/weekly-facts-myplan-parity`.
The initial slice implements Task 2's response types and subscription
transport, dynamic-key/default/response-reset portions of Task 4, and
source column-membership/KPI/group fixes from Task 5. Task checkboxes remain
open where the complete task needs identity integration, qualified fixtures,
display contexts or browser evidence. No full task/all-BU completion is claimed.
See the [progress register](../../weekly-facts-myplan-parity.md#implementation-progress-october-23).

This is an implementation plan, not a completion report. At creation on
October 21, no application behavior, deployment, subscriptions or saved
business data was changed while writing it. The October 23 progress entry
above records the initial application changes; no deployment or live
subscription mutation was performed. The detailed requirements, source map, real local
response observations, BU matrix and source discrepancies are in the
[parity assessment](../../weekly-facts-myplan-parity.md).

Use Angular `02a9cf69889d74fb8542ec26c9ecb57aae041278` and React
`c97525f268befdc68446c7c864a9f2c79b279d5c`, plus explicitly reviewed worktree
changes. Recheck both before execution. Exclude Angular's dirty config files;
record runtime configuration separately. Preserve existing React cleanup,
tests and documentation. Do not stage wireframes or use them as acceptance
baselines. This plan replaces the generic October 14 roadmap Stage 4, not
its identity/shared-shell prerequisites or other application workstreams.

Implement one testable behavior at a time within each task: write the listed
regression, run it and confirm the expected behavioral failure, implement
that behavior, then rerun. Do not rewrite every component before the first
failing assertion. Code examples below pin critical contracts; surrounding
UI must satisfy the source-derived acceptance cases, not a redesigned mockup.

For implementation commits, stage only the task's explicit files. The user
authorized committing/pushing the baseline, merging it into dev and starting
the feature branch on October 23. Use a scoped message and the repository-required
Copilot co-author trailer. Never `git add .` in this dirty worktree.

### Delivery order and gates

| Task | Depends on | Exit gate |
|---|---|---|
| 1. BU evidence and source characterization | None | Inventory, sanitized shapes and approved source-behavior decisions |
| 2. Wire contracts and subscriptions transport | 1 for qualified fixtures | Correct case, payloads, types and explicit errors |
| 3. Identity, routing and shared controls | Main roadmap Stage 1; 1 | Actual roles/flags/CFC, no unauthorized page request |
| 4. Desktop selection/defaults | 2, 3 | Every source history/hierarchy/default path |
| 5. Table projection/grouping | 2 | Correct original-column/KPI/span behavior |
| 6. Table rendering/themes | 4, 5 | Source layout variants, sticky geometry and global HTML styles |
| 7. Mobile selection/layout | 4, 5, 6 | Menu commit/cancel, date arrows, projected columns, breakpoint cases |
| 8. Weekly info/alerts/errors | 2, 4, 6 | Working dialogs and source error payloads |
| 9. Subscriptions | 2, 3, 4, 8 | Read/save/cancel/unsubscribe/deep-link lifecycle |
| 10. Banner/AI/links/analytics | 3, 4, 7, 8 | Config-gated actions, reset and exact events |
| 11. Shared feedback/export | 6, 8; shared action work from roadmap Stage 3 | Real requests/preview/artifacts, not inert controls |
| 12. Differential acceptance and release record | All applicable tasks | Every enabled BU qualified; no unexplained differences |

Task 5 can be developed independently of desktop presentation after contracts
are fixed. Do not parallelize edits to shared TrendPage/types/filter files.
If an authorized BU fixture/session is unavailable, source-independent utility
work may proceed, but that BU and final acceptance remain **blocked**.

### Planned file map

| Files | Responsibility |
|---|---|
| `docs/weekly-facts-myplan-parity.md` | Source evidence, BU register and explicit exceptions |
| `src/test/fixtures/trend/manifest.json`, `<profile>.sanitized.json` | Authorized, sanitized identity/hierarchy/page/subscription shape bundles; profile filenames contain no employee/store identifiers |
| `src/types/wf.types.ts`, `src/api/trend.ts`, `src/hooks/useTrendData.ts` | Wire model, transport and gated lifecycle |
| `src/utils/trendSelection.ts` and `.test.ts` (new) | Generic history, hierarchy and Half Year selection; no JSX/network/business calculation |
| `src/pages/quick-facts/TrendPage.{tsx,module.css,test.tsx}` | Page lifecycle, desktop/mobile state and source controls |
| `src/components/trend/TrendTable.{tsx,module.css,test.tsx}` | Table rendering and interaction callbacks |
| `src/utils/tableTransform.{ts,test.ts}` | Column projection, KPI filtering, grouping and spans |
| `src/components/trend/TrendInfoDialog.{tsx,module.css,test.tsx}` (new) | Weekly-specific HTML/alert dialog; not feature-alert acknowledgment |
| `src/components/trend/TrendSubscriptionDialog.{tsx,module.css,test.tsx}` (new) | Preferences workflow; reuse LocationTree only after adding checkbox mode without changing ordinary single-select behavior |
| `src/components/trend/TrendInsightsPanel.{tsx,module.css,test.tsx}` (new) | AI drawer and close/feedback lifecycle |
| `src/context/AuthContext.tsx`, `src/App.tsx`, layout navigation/filter files | Shared prerequisite integration, permissions and actions |
| `src/styles/globals.css`, `src/utils/htmlTooltip.ts` and existing tests | Global server-HTML styles and source tooltip interaction |
| `src/pages/quick-facts/TrendPage.integration.test.tsx` (new) | Real router/auth/filter/query composition; HTTP boundary mocked |
| `playwright.config.ts`, `e2e/trend-parity.spec.ts`, `e2e/fixtures/trend-profile.ts` (new) | Future paired-browser evidence; no browser runner exists today |

Keep common feedback/export/analytics services in the locations established by
the main roadmap rather than adding parallel Weekly-only implementations.
Inspect their landed APIs at execution time; this worktree has no completed
shared action/identity adapter to import yet.

## Task 1: Establish the BU evidence register and characterize Angular

**Files:** Update `docs/weekly-facts-myplan-parity.md`; create sanitized bundles
and `manifest.json` under `src/test/fixtures/trend/` only after authorized capture.

- [ ] Record current HEADs/status in both checkouts, without staging.

```bash
git rev-parse HEAD
git status --short
git -C /Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights rev-parse HEAD
git -C /Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights status --short
```

Expected baseline hashes are above; a different hash requires an explicit
delta review, not silently using a newer source.

- [ ] Resolve the BU table in the assessment against an authorized deployment
  inventory. Include SI, METRO, BIGW, PEL, 360FM, PEOPLE and resolve deployment
  families edg/sc/wiq-009/supers to actual portal codes. For each feature record
  enabled/disabled, permitted roles/levels, source theme and source revision.
  Do not infer an enabled Weekly/MyPlan feature from a config filename.
- [ ] Capture GET page/hierarchy/subscription responses only through each
  profile's authorized session. Do not fabricate a portal header, switch local
  config or query another employee. Browser credentials stay out of saved
  fixtures. Subscription POST testing requires explicit staging permission.
- [ ] Prune and sanitize values consistently across identity responsibility,
  hierarchy, page codes, history, subscription locations and expected results.
  Preserve real keys, object/array shapes, optional-field absence, columnids,
  alert objects, HTML classes, row/col spans and flags. Keep source captures
  separate from deliberately constructed edge-case fixtures.

Use this manifest entry shape for each qualified bundle; this example is a
schema illustration, not evidence that the profile has been captured:

```json
{
  "profile": "si-national",
  "portal": "SI",
  "role": "National",
  "angularCommit": "02a9cf69889d74fb8542ec26c9ecb57aae041278",
  "captureDate": "2026-10-21",
  "origin": "authorized-development",
  "bundle": "si-national.sanitized.json",
  "features": { "weekly": true, "myPlan": true },
  "sanitized": true
}
```

- [ ] Each bundle contains `identity`, `hierarchy`, `pages` keyed by feature,
  and `subscriptions` keyed by `wf`/`myplan`, plus capture provenance.
  Cover Store and above-Store; applicable departments/CFC; weekly/monthly/
  half-year/trend; KPI/defaultExpanded and hidden-header/double-goal/
  three-column/WFM cases. Use explicit synthetic edge cases if a structural
  variant cannot be obtained; these do not qualify an unvisited BU.
- [ ] In Angular record the final state and events when first desktop/mobile
  cards differ; 767/768/769px; views-only subscription edits; menu tab preview
  with equal date labels; omitted banner; no mobile cards; direct-link denial
  and in-app switching. Document approved exceptions or keep the affected
  implementation/acceptance case blocked.

**Exit:** The inventory is exhaustive or explicitly incomplete; every completed
row has evidence. Missing sessions are an input prerequisite, not a reason to
claim all-BU parity from the current SI server.

## Task 2: Correct response types and subscription transport

**Modify:** `src/types/wf.types.ts`, `src/api/trend.ts`,
`src/api/trend.test.ts`, `src/hooks/useTrendData.ts`,
`src/hooks/useTrendData.test.ts`.

- [ ] Add failing tests to `trend.test.ts` for subscription method/path/body
  and rejection propagation. Keep existing page URL tests, especially
  `/myPlan` versus lowercase `/myplan`. Example assertion:

```ts
it('saves My Plan preferences as JSON-string multipart fields', async () => {
  vi.mocked(client.post).mockResolvedValueOnce({ data: [] });
  await updateTrendSubscriptions('myPlan', ['fixture-store'], ['month_overview']);
  const [path, body] = vi.mocked(client.post).mock.calls[0];
  expect(path).toBe('/myplan/updateUserSubscriptions');
  if (!(body instanceof FormData)) throw new Error('Expected FormData');
  expect(body.get('locations')).toBe('["fixture-store"]');
  expect(body.get('selected_views')).toBe('["month_overview"]');
});
```

Import `client` and the new API functions using the existing suite's mocked
Axios setup. The FormData guard narrows the transport argument, not the response type.
Include GET rejection and POST rejection assertions.

- [ ] Run `npm test -- --run src/api/trend.test.ts`.
  Expected RED: missing subscription exports, followed by behavioral failures
  when skeleton functions exist.
- [ ] Add explicit types, retaining existing required fields. Replace boolean
  alert and string link declarations:

```ts
export interface WfAlert {
  type: string;
  title?: string;
  text: string;
}
export interface WfLink {
  displayText: string;
  link: string;
}
export interface WfHierarchyDropdown {
  allowedViews?: string[];
  label?: string;
  filterDropdown: { displayValue: string; filterKey: string }[];
}
export interface WfUserSubscriptions {
  subscribed_locations: string[];
  subscribed_views: string[];
  is_store_user?: boolean;
}
```

Use `alert?: WfAlert` on header/cell; `toolkit_link?: WfLink` and
`usage_dashboard_link?: WfLink`; add optional hierarchyDropdown, ai_insights
header/insights/button_text, mobileInfo and toggleChildLevelKey to their
corresponding page/card types. Add `[key: string]: unknown` to
`WfCardContents` for wire-defined history keys while preserving named fields'
types. Do not copy Angular's inaccurate row-record/tags-array declarations.

- [ ] Add transport functions; let rejected HTTP promises remain rejected:

```ts
function subscriptionKey(metric: WfMetric): 'wf' | 'myplan' {
  return metric === 'weekly' ? 'wf' : 'myplan';
}

export async function getTrendSubscriptions(
  metric: WfMetric
): Promise<WfUserSubscriptions> {
  const response = await client.get<WfUserSubscriptions>(
    `/${subscriptionKey(metric)}/userSubscriptions`
  );
  return response.data;
}

export async function updateTrendSubscriptions(
  metric: WfMetric,
  locations: string[],
  views: string[]
): Promise<unknown> {
  const body = new FormData();
  body.append('locations', JSON.stringify(locations));
  body.append('selected_views', JSON.stringify(views));
  const response = await client.post<unknown>(
    `/${subscriptionKey(metric)}/updateUserSubscriptions`, body
  );
  return response.data;
}
```

- [ ] Run API/hook tests together, then `npm run build`.
  Expected GREEN: exact transport assertions and existing callers compile.
  Keep the page query free of SQF date/depth parameters. Identity-scoped query
  isolation and permission gating are wired in Task 3.

## Task 3: Integrate real identity, routes and shared controls

**Prerequisite:** Execute/land the main roadmap Stage 1 bootstrap/identity work;
do not introduce a second user service in TrendPage.

**Modify:** `src/context/AuthContext.tsx`, `src/App.tsx`,
`src/components/layout/{SideNav/SideNav,MobileNav/MobileNav,FilterBar/FilterBar}.tsx`
and their tests; `src/hooks/useTrendData.ts` and its tests.
**Create:** `src/pages/quick-facts/TrendPage.integration.test.tsx`.

- [ ] Add real-provider integration cases using the Task 1 sanitized identity.
  Numeric `wf: 0`, disabled Weekly/MyPlan and CFC responsibility must not
  render the corresponding permitted page or issue its page GET. Loading or
  failed identity must not display Demo User or fetch protected data.
  For MyPlan-only and both-enabled users check the source landing decision.
- [ ] Add a shared filter regression:

```tsx
it('does not offer SQF date selection on Weekly Facts', () => {
  render(
    <MemoryRouter initialEntries={['/quick-facts/weekly']}>
      <FilterBar />
    </MemoryRouter>
  );
  expect(screen.queryByRole('button', { name: /today|select date/i })).toBeNull();
  expect(screen.queryByRole('combobox', { name: 'Reporting period' })).toBeNull();
  expect(screen.queryByRole('combobox', { name: 'Breakdown' })).toBeNull();
});
```

Use the existing FilterBar suite's auth/filter/query mocks and give its
calendar trigger a meaningful accessible name on summary/details. The regex
matches its existing icon-derived name as well as the improved accessible
name, so this assertion fails against the current visible calendar.

- [ ] Run the integration, FilterBar and navigation suites; expected RED is
  current demo access/static labels and visible date control.
- [ ] Use trusted bootstrap's returned flags, not frontend derivation from BU
  alone. The core permission predicate is:

```ts
const metricEnabled = metric === 'weekly'
  ? user.weekly_facts_enabled
  : user.my_plan_enabled;
const permitted = user.wf === 1 && !!metricEnabled &&
  !cfcCodes.includes(user.sqf_area_of_responsibility);
```

Integrate this with the characterized parent-route/landing behavior, not as a
replacement for all Angular guard logic. `user` and `cfcCodes` must come from
Stage 1's resolved identity context. Keep loading/error distinct from denial.
Query enablement must include permission; cache isolation must include the
resolved identity/portal scope or clear relevant caches on a scope change.
- [ ] Gate the date wrapper, not only period/axis, to the source views that
  use SQF date selection. Preserve location and query parameters on feature
  switching, breadcrumbs and browser navigation. Do not add an API date.
- [ ] Reproduce SI/METRO desktop Trend/page-powered-by wording, other portal
  feature wording, WFM/People portal titles and mobile drawer's own source
  wording. Verify feature-toggle visibility with one/both/neither enabled.
  `/weekly` is not a Weekly Facts alias; do not replace Quick Assist's
  separately planned surface.
- [ ] Keep Weekly/MyPlan routes under `/quick-facts`. The source My Metrics
  router lacks Weekly/MyPlan children despite generic cardOrigin-based switch
  code; do not register inferred aliases while implementing this slice.
- [ ] Rerun these suites plus existing App integration tests and build.
  Expected GREEN: no denied request and unchanged summary/details controls.

## Task 4: Implement desktop selection, defaults and lifecycle

**October 26 status:** `createTrendSelection` / `updateTrendSelection` now
encapsulate desktop history/hierarchy selection, including asymmetric source
fallbacks and no-match table retention. Page controls and response resets are
wired and tested for both metrics. Keep the remaining full lifecycle/Half Year
and authorized integration requirements below open.

**Create:** `src/utils/trendSelection.ts`, `src/utils/trendSelection.test.ts`.
**Modify:** `TrendPage.tsx`, `TrendPage.test.tsx` in
`src/pages/quick-facts/`.

- [ ] Write the dynamic-key regression before changing the page:

```ts
it('uses the response-defined monthNo key', () => {
  const tableData: WfTableData = { headers: [], data: [] };
  const older: WfCardContents = { monthNo: 'M02', tableData };
  const card: WfCardData = {
    key: 'month_overview', displayName: 'Monthly Overview',
    dateFilterKey: 'monthNo', dateFilterValues: ['M03', 'M02'],
    cardContents: [{ monthNo: 'M03', tableData }, older]
  };
  expect(selectHistoryContents(card, 'M02')).toBe(older);
});
```

- [ ] Run the resolver and page tests:

```bash
npm test -- --run src/utils/trendSelection.test.ts src/pages/quick-facts/TrendPage.test.tsx
```

Expected RED is missing resolver/unmatched monthNo, halfNo and server defaults.
- [ ] Extract this typed primitive; keep hierarchy and mobile Half Year
  branches explicit rather than overloading a month/week conditional:

```ts
export function selectHistoryContents(
  card: WfCardData, selectedDate: string
): WfCardContents | undefined {
  if (!Array.isArray(card.cardContents)) return card.cardContents;
  const value = selectedDate || card.dateFilterValues?.[0] || '';
  const key = card.dateFilterKey || 'weekNo';
  return value
    ? card.cardContents.find(contents => contents[key] === value)
    : undefined;
}
```

Import the three Wf types from `../types/wf.types`. The page's desktop initial
selection tries history, then source hierarchy fallback when applicable.
Hierarchy-change selection filters by filterKey and, where required, history
as well; do not substitute an unconditional `contents[0]` fallback.
- [ ] Add separate tests for `halfNo`, absent dateFilterKey/weekNo, object
  contents, hierarchy-only arrays, date+hierarchy and a nonmatching selection.
  Pin final load state against Task 1's desktop-then-mobile initializer trace.
- [ ] Apply root variance and table expansion defaults at the matching source
  lifecycle:

```ts
const variance = pageData.varianceFlag?.value ?? false;
const expanded = tableData.kpiFilterEnabled
  ? tableData.defaultExpanded ?? false
  : true;
```

Initialize expansion when source resets its table input, not on every render,
so user expansion is not erased by unrelated UI changes. Reset old view/date/
hierarchy/data and AI on the characterized location/metric response boundary;
ignore stale responses after navigation. Distinguish initial load from query
background refresh before changing visible loading/reset behavior.
- [ ] Add page regressions for variance true, absent/defaultExpanded true/
  false, different view sets after location change, slow old request finishing
  last, feature switch preserving search and supported/unsupported old date.
  Rerun the resolver/page/integration suites; expected GREEN is source-matched
  state, never stale-location content or blank unhandled history.

## Task 5: Match column projection and KPI grouping

**October 26 status:** Desktop child/peer and mobile projection rules now have
typed context and focused tests, preserving original IDs and wire order.
TrendPage forwards desktop state through TrendTable; actual mobile state
forwarding is deferred to Task 7, not a completed mobile implementation.

**Modify:** `src/utils/tableTransform.{ts,test.ts}`.

- [ ] Add a failing regression for a fully filtered-out group:

```ts
it('does not dereference a group with no visible KPI rows', () => {
  const cell = (columnid: number, displayValue: string,
    extra: Partial<WfTableCell> = {}): WfTableCell =>
    ({ columnid, displayValue, value: displayValue, ...extra });
  const table: WfTableData = {
    headers: ['Group', 'Metric', 'Value'], kpiFilterEnabled: true,
    data: [
      [cell(0, 'Hidden', { rowSpan: 1 }), cell(1, 'Detail'), cell(2, '1')],
      [cell(0, 'Visible', { rowSpan: 1 }),
       cell(1, 'Measure', { tags: 'KPI' }), cell(2, '2')]
    ]
  };
  const result = filterTableData(table, false);
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].find(c => c.columnid === 0)?.rowSpan).toBe(1);
});
```

- [ ] Run `npm test -- --run src/utils/tableTransform.test.ts`.
  Expected RED: current `.find` on undefined.
- [ ] Guard an absent group before dereferencing it; derive visible original
  column IDs from selected headers. Keep the Angular filtering rule:

```ts
const displayRow = row
  .filter(cell => displayedIndexes.includes(cell.columnid))
  .map(cell => ({ ...cell }));
```

`displayedIndexes` is the original header-index list, computed before filtering
rows. Preserve wire order as Angular does; do not silently sort malformed
rows. Add an explicit test where a filtered column and sparse/reordered row
would make positional `row[idx]` select the wrong cell.
- [ ] Extend transform inputs with a typed display context: mobile flag,
  parentCode, childCode, hierarchyNode, selectedDateFilter, WFM mode, and
  child/peer toggle/key. Pass this from TrendPage through TrendTable. Desktop
  selection is all allowed colTypes without toggle; toggle on excludes peers,
  off excludes children. Mobile first two and parent/child/hierarchy/date
  header matches must follow the source, including WFM child substitution.
- [ ] Add table-driven tests for each projection rule, numeric measureColumnId,
  substring `tags.includes('KPI')`, disabled KPI filtering, hidden continuation
  cells, consecutive empty groups, final empty group, singleton group spacer,
  multirow spacer and input immutability. Preserve source tag split/whitespace
  behavior; do not trim data as an incidental cleanup.
- [ ] Rerun transform and TrendTable suites. Expected GREEN: correct original
  cell membership, visible spans and spacer positions without source mutation.

## Task 6: Recreate table layout, backend HTML and BU themes

**Modify:** `src/components/trend/TrendTable.{tsx,module.css,test.tsx}`,
`src/pages/quick-facts/TrendPage.module.css`, `src/styles/globals.css`,
`src/utils/htmlTooltip.ts`, `src/utils/htmlTooltip.test.ts`.

- [ ] Add hidden-header and source expand-control regressions:

```tsx
it('does not display a zero-span header', () => {
  const tableData: WfTableData = {
    headers: [
      { text: 'Goals', val: 'g', colSpan: 2 },
      { text: 'Hidden continuation', val: 'h', colSpan: 0 },
      { text: 'Measure', val: 'm' }
    ],
    data: [[
      { columnid: 0, displayValue: 'Goal', value: 'Goal', rowSpan: 1 },
      { columnid: 1, displayValue: '', value: '' },
      { columnid: 2, displayValue: 'Metric', value: 'Metric' }
    ]]
  };
  render(<TrendTable tableData={tableData} isExpanded={false} showVariance={false} />);
  expect(screen.getByRole('columnheader', { name: 'Goals' })).toBeVisible();
  expect(screen.queryByRole('columnheader', { name: 'Hidden continuation' }))
    .not.toBeInTheDocument();
});
```

- [ ] Run TrendTable tests; expected RED is visible zero-span header and
  missing source header expand interaction.
- [ ] Use explicit zero handling rather than `colSpan || 1`:

```tsx
if (header.colSpan === 0) return null;
const colSpan = header.colSpan ?? 1;
```

Reproduce source double-goal class conditions and metric index treatment;
add onToggleExpanded and alert callbacks with typed payloads. Place the
expand/collapse control in the source header, remove the non-source toolbar
switch, and test clicking it does not trigger an alert/row action.
- [ ] Port source fixed/WFM/store/three-column layout conditions and widths.
  Compare calculated first/second sticky offsets and z-indices rather than
  relying on `position: sticky` with no left offset. Preserve explicit
  columnWidth width/min/max, hidden spans and border precedence (left, right,
  background). Do not "fix" overlapping source double-goal selectors without
  browser evidence.
- [ ] Port the actual source CSS rules for goal/variance/tooltip/tag content
  into global CSS; retain component layout in CSS Modules. Match 24/40/44/36/
  2px row cases, three-column left alignment, WFM no-rotation and store sizing.
  Bind authorized source theme variables to current React tokens while
  preserving intentional literal source colors.
- [ ] Move tooltip trigger bounds to the source inner wrappers. Test plain/
  HTML content, explicit custom header HTML, infoMessage suppression, bottom/
  right edges and sticky exclusion; include source top/bottom-three long names.
  Compare pointer/focus/touch behavior in Task 12, since jsdom does not measure
  fonts, overlap or actual scroll geometry.
- [ ] Rerun transform/table/tooltip suites and build. Expected GREEN covers
  structure and behavior; visual completion remains gated on Task 12.

## Task 7: Reproduce mobile selection and responsive controls

**October 27 partial implementation:** Mobile menu preview/cancel/commit,
bounded history arrows, mobile hierarchy context, page column projection,
header/info/variance and My Plan card-level Half Year selection are wired and
covered by regressions. `TrendMobileFilters` owns the menu; the existing
selection utility owns card/date resolution. The Half Year rule is implemented
inside `updateMobileTrendSelection` rather than introducing a second helper
used only once. Desktop/mobile selection state is kept separately on resize.
Live source initializer/breakpoint characterization and pixel comparison remain
open: user-details GET returns 403 and Chrome crashes during the synthetic
browser probe. Do not mark the task or any BU qualified from unit tests.

**Modify:** `src/utils/trendSelection.{ts,test.ts}`,
`src/pages/quick-facts/TrendPage.{tsx,module.css,test.tsx}`,
`src/components/trend/TrendTable.tsx`.

- [ ] Add tests for hasMobileView-only choices, first mobile selection,
  menu tab preview followed by cancel, date commit, duplicate date labels
  across tabs, latest/oldest disabled arrows, one-item history and no mobile
  views. Start with the card-level Half Year rule:

```ts
it('resolves My Plan Half Year at card level', () => {
  const cards: WfCardData[] = ['H1', 'H2'].map(half_year => ({
    key: half_year, displayName: half_year, half_year,
    dateFilterKey: 'half_year', mobileDateFilterTabName: 'Half Year',
    cardContents: { tableData: { headers: [], data: [] } }
  }));
  expect(selectMyPlanHalfYear(cards, 'H2')?.key).toBe('H2');
});
```

- [ ] Run selection/page suites; expected RED is missing mobile flow.
- [ ] Add the explicit helper:

```ts
export function selectMyPlanHalfYear(
  cards: WfCardData[], value: string
): WfCardData | undefined {
  return cards.find(card =>
    card.dateFilterKey === 'half_year' && card.half_year === value
  );
}
```

Use it only for My Plan with source tab name `Half Year`. Keep previewed and
committed mobile tab/date separate. Restore source committed state on menu
close; do not convert an equal-value selection to a commit unless Task 1
approves an exception to source behavior.
- [ ] Render source mobile date groups/header/info, hierarchy dropdown and
  variance row (including On/Off and stopping switch click propagation).
  Hide arrows when hierarchy mode hides them. Wire committed selection into
  Task 5's table projection and preserve source desktop/mobile initializer
  result on viewport changes.
- [ ] Add 767/768/769px browser scenarios to Task 12 rather than assuming
  SCSS and observer breakpoints coincide. Rerun page/table/selection tests and
  build; expected GREEN covers menu state and selected table, not jsdom layout.

## Task 8: Implement Weekly info/alert dialogs and error presentation

**October 26 status:** Weekly Metrics Info, header/cell alerts and structured
404/500 details are wired with focused dialog/page tests. The popup supports
source sizing/icon/HTML and dismissal/focus behavior; keep mobile composition,
error illustrations, real-provider rejection cases and visual qualification
open.

**Create:** `src/components/trend/TrendInfoDialog.{tsx,module.css,test.tsx}`.
**Modify:** TrendPage/TrendTable and their tests.

- [ ] Write dialog tests for HTML body/icon/title, optional refresh time,
  close behavior, header/cell alert payload, mobile composed body and no
  simultaneous normal tooltip when infoMessage is present. A page-level
  regression should click Metrics Info and assert a dialog, not label text:

```tsx
fireEvent.click(screen.getByRole('button', { name: 'Metrics Info' }));
expect(screen.getByRole('dialog')).toHaveTextContent('Fixture explanation');
```

Supply `metricsInfo.body: '<p>Fixture explanation</p>'` via the existing page
test setup. Run page/table/dialog suites; expected RED is inert text.
- [ ] Match the Weekly popup contract independently of InfoModal:
  maxWidth 530px, maxHeight 648px, source body/icon spacing, no autofocus,
  source close/backdrop/Escape/focus restoration behavior. Use existing modal
  infrastructure only if it can express this without changing SQF dialogs.
  Mobile body includes formatted last-updated + divider + global Metrics Info.
  Render trusted backend HTML through the same reviewed boundary, never an
  arbitrary user-input path.
- [ ] Add an Axios rejection integration case with `errorTitle`, `errorMsg`,
  `subErrorMsg`, `email`; render source illustration/text/mailto link.
  Separately test department/CFC 404, server 500 and transport/no-body failures.
  Keep transport fallback visibly an error, not a successful empty table.
  Error states must clear stale header/table/actions as the source does.
- [ ] Rerun targeted suites and build. Expected GREEN: source-visible error
  details, working dialogs and no dialog confused with feature-alert acknowledgment.

## Task 9: Complete subscription preferences

**Create:** `src/components/trend/TrendSubscriptionDialog.{tsx,module.css,test.tsx}`.
**Modify:** TrendPage, shared FilterBar, LocationTree and their tests;
`src/api/trend.test.ts`, integration suite.

- [ ] Write initial-load tests for available card-key intersection, source
  order, single-view disabled checkbox, saved selections, Store responsibility
  default and non-Store checkbox hierarchy. Write first-subscription required
  locations and existing-subscription clear-all unsubscribe cases.
- [ ] Assert source selected-location count/list, hidden departments, no
  location-navigation side effect, and conditional schedule notes (Weekly
  Monday/Tuesday/Wednesday; Monthly Trend second fiscal-month Monday; My Plan
  Monthly Overview second fiscal-month Tuesday). Port the source 130px
  scrollable three-column location list and button/validation styling.
- [ ] Add transport-boundary assertions:

```ts
expect(formData.get('locations')).toBe('[]');
expect(formData.get('selected_views')).toBe('["monthly_trend"]');
expect(requestPath).toBe('/myplan/updateUserSubscriptions');
```

In the existing-subscriber test `formData` is the captured FormData from mocked
Axios POST, `requestPath` its captured URL; the test must operate the dialog
and Save, not construct those arguments itself. Run dialog/API/integration
tests; expected RED is no working subscription workflow.
- [ ] Build dialog view options by intersecting `page.cards` with
  `page.available_views`, preserving card order:

```ts
const views = page.cards
  .filter(card => page.available_views?.includes(card.key))
  .map(card => ({
    name: card.key, displayName: card.displayName, checked: false
  }));
```

Hydrate saved views and locations using source rules, including store role
and single-view hydration quirks. Reuse the permitted hierarchy with a
checkbox mode; no selected-node navigation side effect from checking a box.
Save is invalid when offered views have none selected; for a first non-Store
subscription require a location, but allow an existing subscriber to clear
all locations.
- [ ] Match source POST decision for views-only edits unless the Task 1
  exception explicitly approves fixing that source bug. Do not suppress actual
  GET/POST errors. Show source success/error notification; failed save leaves
  the dialog open, cancel/close never writes.
- [ ] Wire desktop mail/mobile action-menu entry points; open once after
  successful `#EmailSubscription` load, and only under the characterized
  permission/flag rules. Match 590px maximum width and non-dismissible
  backdrop/Escape with explicit close/cancel.
- [ ] Add/remove temporary SI National Weekly hierarchy entries for the
  dialog only, including cleanup after cancel, successful save and unmount.
  Test backend Store MyPlan view rewrite via authorized staging integration;
  frontend continues to send selected source keys rather than duplicating it.
- [ ] Rerun dialog/location/filter/API/integration tests and build. No live POST
  outside the authorized staging subscription cases.

## Task 10: Wire banners, AI, links and analytics

**Create:** `src/components/trend/TrendBanner.{tsx,module.css}`.
**Reuse:** the existing `AiInsightsSidenav`; do not create a duplicate AI panel.
**Modify:** TrendPage, shared filter/layout/actions, global CSS, integration tests.

**Continuation evidence:** shared-layout banners, configured links and exact
analytics envelope are wired. Local integration tests cover response/metric
reset, enabled AI with absent content, safe banner HTML, mobile cancellation
and initialization deduplication. Fixed AI drag teardown on close/unmount.
Synthetic browser runs passed both routes at 360/767/768/769/1024px, including
the source's 768px link/header-action visibility boundary. Browser APIs were
intercepted; no real email/subscription mutations occurred. Live user details
remain blocked by 403. The system Chrome was unstable; the successful probe
used Playwright's isolated headless shell. These results do not replace Task
12's authorized paired-BU visual/behavior acceptance. Local suite: 582 tests,
97.09% lines against the unchanged 95.01% gate. ESLint is unavailable because
the existing worktree has no ESLint configuration.

- [x] Write gated-action tests for AI enabled/disabled, drawer close/reset
  after location/metric change, toolkit/usage link labels/targets, banner
  propagation and mobile-versus-desktop action availability. Include enabled
  flag with absent content as characterized in Task 1.
- [x] Add analytics assertions on the **actual shared source event envelope**:

```ts
expect(window.dataLayer).toContainEqual(expect.objectContaining({
  event: 'quick_facts_element_click',
  quickFactEventType: 'myPlanDateFilterChanged',
  quickFactCardType: 'Monthly Overview - Fixture Month',
  selectedLocation: 'fixture-national'
}));
```

Initialize the typed dataLayer through the main roadmap's analytics adapter;
use synthetic employee/role values. Run page/panel/integration tests;
expected RED is missing source side effects.
- [x] Publish banner and clear it through shared layout lifecycle according
  to source. Render configured links as `{displayText,link}`, opening a new
  tab with safe opener handling. Do not treat links as strings or infer titles.
- [ ] Match AI end-side resizable/no-backdrop drawer, top gap 56px,
  source header/Beta/body, feedback/close and teardown flags. Keep backend
  whitelist/permission decisions server-side. Do not invent an AI request
  when the source renders returned HTML.
- [ ] Wire exact tab/date/mobile/hierarchy event types and card/location
  values using the shared adapter. Include initialization, no-op selection,
  preview cancellation and feature transition counts from Task 1; prevent
  accidental duplicate development-effect events without removing actual
  source initialization events.
- [ ] Rerun targeted suites and build; inspect events in Task 12's paired
  browser runs, not just mocked callback invocation.

## Task 11: Integrate source feedback and export

**Prerequisite:** Main roadmap Stage 3 shared feedback/preview/export adapter.
**Modify:** shared FilterBar/actions, TrendPage, TrendPage.module.css and their
tests; reuse the shared preview implementation instead of a second PDF system.

- [ ] Add integration tests that source-visible feedback opens the real
  workflow, PDF/print opens page preview with the selected view and exported
  artifact metadata, cancel does not export, and a capture failure is visible.
  Assert actual adapter calls after clicking, for example the landscape page
  preview contract rather than an unrelated `window.print` spy.
- [ ] Run shared action and Trend integration suites; expected RED is disabled
  download/feedback or direct browser-print behavior.
- [ ] Match Weekly page capture target `js-${metric}-card`, card displayName,
  landscape orientation and source title handling. The source currently
  assigns `WeeklyFacts` even to My Plan export metadata: preserve it or record
  an approved exception, do not silently rename the artifact.
- [ ] Apply source page-preview classes and full-scroll layout (1500px page
  width, scale 2); restore table-scroll and preview classes after success,
  error and cancel. Capture actual selected history/hierarchy, goal HTML and
  variance, not the initial/default table. Use the source single-page capture
  path; the September shared multi-card optimization is not a mandate to
  split this page into separate captures.
- [ ] Expose only actual source PDF/print/feedback entry points. Google Slide
  exists in shared types/menu markup but must not become a new visible Weekly
  action without source browser evidence. Mobile menu remains source-limited.
- [ ] Rerun targeted suites and build; compare downloaded PDF/print content,
  orientation, cropping, text/goal completeness and post-preview layout in the
  authorized browser gate. No production upload/send action is part of tests.

## Task 12: Qualify every enabled BU with differential browser evidence

**Create:** `playwright.config.ts`, `e2e/trend-parity.spec.ts`,
`e2e/fixtures/trend-profile.ts`.
**Modify:** `package.json`, `package-lock.json` for browser tooling,
`docs/weekly-facts-myplan-parity.md`, README and migration status.

- [ ] Confirm the runner is absent with `npm exec --no -- playwright --version`.
  After the missing-tool result, add `@playwright/test` as a development
  dependency with the package manager and commit its resolved lockfile only
  if authorized. Install the runner's Chromium locally. No browser tooling
  installation or manifest change is part of this documentation task.
- [ ] Configure separate Angular/React base URLs through local environment
  variables, keeping credentials/storage state out of Git. Set fixed browser,
  fonts, locale `en-AU`, timezone `Australia/Sydney`, clock and viewport.
  Route only API endpoints to the **same qualified fixture bundle** for
  deterministic comparisons; never intercept HTML/theme assets as fake JSON.
  Separately exercise real authenticated staging APIs to validate transport
  and integration behavior.
- [ ] Render Angular and React against identical data before comparing:

```ts
const angularTable = await angularPage
  .locator('table.wf-table').screenshot({ animations: 'disabled' });
expect(await reactPage.locator('table.wf-table')
  .screenshot({ animations: 'disabled' })).toEqual(angularTable);
```

The profile fixture sets up both pages, their API routes and source-equivalent
selection. The initial rule above is strict; if deterministic PNG bytes
differ, use the browser runner's image comparator and inspect the actual diff.
Default to zero different pixels. Any rendering-only tolerance/mask requires
a recorded reason and approval; do not bless React's own screenshot as the
Angular baseline or mask missing rows/controls. Store approved evidence
according to repository policy, not raw user/business screenshots.
- [ ] For every BU/feature row, run all applicable source scenarios: role and
  CFC denial; every view/history/hierarchy; Store/above-Store/department; default
  and switched variance/KPI; double-goal/three-column/WFM; sparse grouping;
  tooltip/alerts/info; subscription state/cancel/save/error; AI/banner/links;
  export/feedback; URL/deep link/back-forward and source lifecycle exceptions.
  Compare complete-page screenshots as well as table, drawer, dialog and
  scrolled sticky-column states.
- [ ] Test widths 360/390/503/714/767/768/769/904/1024/1280/1440 and height
  boundaries 600/740/741/900/901 where relevant. Include mobile portrait/
  landscape, scroll extremes, long labels, keyboard/focus and source touch
  behavior. A single desktop screenshot is not all-BU/mobile acceptance.
- [ ] Capture method/path/body/count, visible selection/text/HTML and analytics
  count/payload. Run approved subscription POST cases only on staging and
  restore that test account's prior preferences through the supported UI/API.
  Include real backend no-data/CFC/department responses and actual artifact
  previews. Missing permission/session blocks the case rather than generating
  synthetic "passed" evidence.
- [ ] Run the focused unit/integration group and full regression/coverage/build:

```bash
npm test -- --run src/api/trend.test.ts src/hooks/useTrendData.test.ts src/utils/trendSelection.test.ts src/utils/tableTransform.test.ts src/components/trend src/pages/quick-facts/TrendPage.test.tsx src/pages/quick-facts/TrendPage.integration.test.tsx
npm run test:coverage
npm run build
npx playwright test e2e/trend-parity.spec.ts
git diff --check
```

Expected: all applicable cases pass, global line coverage **>95%** under the
unchanged source scope (current threshold 95.01%), typed build succeeds and no
whitespace errors. Do not delete coverage includes, weaken thresholds or
replace realistic fixtures to make these commands green.

- [ ] Update the BU register with source revision, profile/theme, scenario IDs,
  evidence location, result and reviewer. Record confirmed-disabled features
  separately from passes; preserve unresolved exceptions and unavailable BUs
  as blockers. No all-BU completion statement until the inventory and every
  enabled row close. Do not change shared dispatch/deploy configuration as a
  shortcut to acceptance.

## Completion record and handoff

The October 21 deliverable was the source assessment and this plan only.
Implementation began October 23 in the scoped feature branch described above.
Implementation may use task-by-task subagents or inline execution with review
checkpoints when requested; neither mode is started by this document.
Before implementation, obtain missing authorized BU/session/theme evidence and
decisions on the explicitly identified Angular quirks. Until then, shared
development may be planned, but **one-to-one parity across all BUs remains
unverified**.
