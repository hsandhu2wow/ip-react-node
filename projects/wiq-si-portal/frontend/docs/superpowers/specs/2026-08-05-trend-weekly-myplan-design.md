# Trend Page — Weekly Facts / My Plan Design

**Date:** 2026-08-05
**Status:** Approved
**Reference:** Angular implementation in `store-insights/src/app/sqf/` — `WeeklyFactsHomeComponent`,
`WeeklyFactsTableComponent`, `WeeklyFactsService`, `IWF.d.ts`, `weekly_facts/urls.py`, `weekly_facts/data.py`.

> **Historical design, reviewed 2026-10-14:** Core routes/table rendering were
> implemented, but not every behavior below. In particular, the current page
> has no Weekly/My Plan view switch, Metrics Info is inert text, server variance/
> expansion defaults are not applied, and PageBar was removed. Wireframes were
> earlier references, not the current source of truth. Use the
> [parity status](../../migration-status.md) and
> [current roadmap](../plans/2026-10-14-angular-react-migration.md).
>
> **Superseded for full-parity scope on 2026-10-21:** Use the
> [Weekly Facts/My Plan assessment](../../weekly-facts-myplan-parity.md) and
> [detailed implementation plan](../plans/2026-10-21-weekly-facts-myplan-parity.md).
> The desktop-only scope and deferrals below are historical, not exclusions
> from the required all-BU migration.

---

## Problem

The "Trend" nav item currently renders `ComingSoon`. It should route to a real page implementing:

- `http://localhost:4200/quick-facts/weekly?code=National&date=2026-08-04`
- `http://localhost:4200/quick-facts/myplan?code=National&date=2026-08-04`

These correspond to the Angular app's `/weekly` and `/myplan` routes, both backed by a single component
that toggles between "Weekly Facts" and "My Plan" views. Two wireframe HTML files
(`wiq-my-plan-v21-store_manager.html`, `wiq-my-plan-v21-group_manager.html`) and two screenshots
(`weekly-screenshot.png`, `myplan-screenshot.png`) define the target visual design.

## Scope

**In scope (this pass):**
- Desktop-only core table experience: location filter (reusing existing `FilterContext`/`FilterBar`),
  Weekly Facts / My Plan toggle, "View as" dropdown, "Time Period" dropdown, "Show variance" toggle,
  the grouped/colored data table itself, "Metrics Info" lightweight popover, header metadata
  ("Results for", "Last updated").
- Real backend calls: `GET /wf/{code}` and `GET /myPlan/{code}` (confirmed routes in
  `backend/weekly_facts/urls.py`), proxied the same way existing Quick Facts calls are (`/api` → backend).

**Explicitly deferred (future work):**
- AI insights side panel, email subscription popup ("Subscription preferences" link renders but is inert),
  hierarchy-dropdown drill filter, mobile card view / mobile date filter, help-feedback popup,
  toolkit/usage-dashboard links, permission-gated tab visibility (both tabs always shown — no
  `weekly_facts_enabled`/`my_plan_enabled` concept exists in the React app's stub `AuthContext`).

## API contract

Confirmed from `store-insights/backend/weekly_facts/urls.py` and `weekly-facts.service.ts`:

- `GET /wf/<code>` — Weekly Facts page data.
- `GET /myPlan/<code>` — My Plan page data.
- No date or apiDepth parameter — `code` alone identifies the selected location node
  (Angular calls this with `selectedNode.code` regardless of level, including national).
- Response shape is `IWFPageData` (see `store-insights/src/app/sqf/typings/IWF.d.ts`), notably:
  - `cards: IWFCardData[]` — one entry per "View as" option (`key`, `displayName`, `dateFilterValues`,
    `dateFilterKey`, `cardContents`).
  - `cardContents` is either a single `IWFCardContents` object or an array of them (one per time period),
    each with `tableData: IWFTableData` and `timePeriod`.
  - `varianceFlag?: { text, value }` — presence gates the "Show variance" toggle; `value` is its default.
  - `metricsInfo?: { title, body, label? }` — Metrics Info popover content.
  - `refreshTime`, `refreshFiscalPeriod?` — "Last updated" text.
  - `hierarchyDropdown`, `ai_insights`, `is_web_subscription_enabled`, `toolkit_link`,
    `usage_dashboard_link` — present in the payload but unused this pass (deferred features).
- Table cell rows are **not** a keyed record despite the `.d.ts` declaration — at runtime each row is an
  **array** of cell objects with a `columnid` field (confirmed in `wf-table.component.ts`:
  `row.find(c => c.columnid === 0)`), each cell carrying `displayValue` (trusted HTML string),
  `tooltip` (may be HTML), `backgroundColor`/`borderLeftColor`/`borderRightColor`, `cssClass`, `tags`,
  `rowSpan`, `infoMessage`, `alert`.
- Headers are either `string[]` or an array of `{ text, val, tooltip?, alert?, colSpan?, cssClass?,
  columnWidth?, colType? }`. `colType` is one of `'', 'parentNode', 'selectedNode', 'peerNode',
  'childNode'` and drives which location columns are shown.

## Architecture

### Routing

`src/App.tsx` — add two new routes nested under the existing `/quick-facts` route (same
`QuickFactsLayout`, same `FilterProvider`):

```tsx
<Route path="weekly" element={<TrendPage metric="weekly" />} />
<Route path="myplan" element={<TrendPage metric="myPlan" />} />
```

`src/components/layout/SideNav/SideNav.tsx` and `MobileNav.tsx` — change the "Trend" nav item's `to`
from `/trend` to `/quick-facts/weekly` (and drop its `badge: true` "Soon" marker). The `/trend` and
`/weekly` top-level routes remain pointed at `ComingSoon` (unchanged) — the "Weekly" nav item keeps
its current target per product decision.

### Layout awareness

`PageBar.tsx` and `FilterBar.tsx` already special-case `/details/` via an `isDetails` check. Add an
equivalent `isTrend` check (`location.pathname.includes('/weekly') || location.pathname.includes('/myplan')`,
scoped under `/quick-facts`):
- `PageBar`: return `null` on Trend routes (no "Quick Facts" tab strip shown, matching the screenshots).
- `FilterBar`: keep the location dropdown + action icons (chat/download/print), but hide the date-picker
  control — Trend pages have their own "Time Period" dropdown instead of a single date. `useFilterTree()`
  still runs here so `FilterContext` loads normally.

### Data layer

**`src/types/wf.types.ts`** (new) — TypeScript port of `IWF.d.ts`, correcting the table row shape to
match runtime reality:

```ts
export interface IWFTableCell {
  columnid: number
  displayValue?: string          // trusted HTML
  value?: string
  tooltip?: string               // may contain HTML
  backgroundColor?: string
  borderLeftColor?: string
  borderRightColor?: string
  cssClass?: string
  tags?: string                  // comma-separated, e.g. "KPI"
  rowSpan?: number
  infoMessage?: string
  alert?: { type: string; title?: string; text: string }
}
export type IWFTableRow = IWFTableCell[]
export interface IWFTableHeader {
  text: string; val?: string; tooltip?: string; colSpan?: number
  cssClass?: string; columnWidth?: string; colType?: string
  alert?: { type: string; title?: string; text: string }
}
export interface IWFTableData {
  headers: string[] | IWFTableHeader[]
  data: IWFTableRow[]
  kpiFilterEnabled?: boolean
  measureColumnId?: number
  defaultExpanded?: boolean
}
export interface IWFCardContents {
  seq?: number; weekNo?: string; month?: string; timePeriod?: string
  infoMessage?: string; tableData: IWFTableData; filterKey?: string
}
export interface IWFCardData {
  key: string; displayName: string; cardContents: IWFCardContents | IWFCardContents[]
  dateFilterValues?: string[]; dateFilterKey?: string; durationLabel?: string
}
export interface IWFPageData {
  cards: IWFCardData[]; label?: string; refreshTime: string; refreshFiscalPeriod?: string
  metricsInfo?: { title: string; body: string; label?: string }
  varianceFlag?: { text: string; value: boolean }
}
```

**`src/api/trend.ts`** (new):
```ts
export async function getWeeklyFacts(code: string): Promise<IWFPageData> {
  const res = await client.get<IWFPageData>(`/wf/${code}`)
  return res.data
}
export async function getMyPlan(code: string): Promise<IWFPageData> {
  const res = await client.get<IWFPageData>(`/myPlan/${code}`)
  return res.data
}
```

**`src/hooks/useTrendData.ts`** (new) — React Query wrapper following the `useDetailsCard` convention:
```ts
export function useTrendData(metric: 'weekly' | 'myPlan') {
  const { selectedNode, isLoaded } = useFilter()
  return useQuery({
    queryKey: ['trend', metric, selectedNode?.code],
    queryFn: () => (metric === 'weekly' ? getWeeklyFacts : getMyPlan)(selectedNode!.code),
    enabled: isLoaded && !!selectedNode?.code,
    staleTime: 0,
  })
}
```

### Page component — `src/pages/quick-facts/TrendPage.tsx`

Props: `{ metric: 'weekly' | 'myPlan' }`. Responsibilities:

1. Fetch via `useTrendData(metric)`.
2. Local state: `selectedTabKey` (View as), `selectedDateFilter` (Time Period), `showVariance`.
3. On data load, default `selectedTabKey` to `cards[0].key`, `showVariance` to
   `varianceFlag?.value ?? false`.
4. Derive `activeCard = cards.find(c => c.key === selectedTabKey)`.
5. Derive `selectedTab`: if `activeCard.cardContents` is an array, filter by
   `card[activeCard.dateFilterKey || 'weekNo'] === selectedDateFilter` (default to first entry /
   `dateFilterValues[0]`); otherwise use `cardContents` directly.
6. Render:
   - Toolbar: "View results" toggle (Weekly Facts / My Plan) — clicking navigates via `useNavigate`
     to `/quick-facts/weekly` or `/quick-facts/myplan`, preserving current `?code=&date=` search
     params. "View as" `<select>`-style dropdown (only if `cards.length > 1`). "Time Period" dropdown
     (only if `activeCard.dateFilterValues?.length`). "Show variance" toggle (only if `varianceFlag`
     present). "Subscription preferences" link rendered statically, no `onClick` handler (deferred).
   - Title block: `"{Weekly Facts|My Plan} - {activeCard.displayName}"`, then
     `"{activeCard.durationLabel || 'Time period'}: {selectedTab.timePeriod}"`, "Metrics Info" popover
     trigger (if `metricsInfo` present — simple click-to-toggle `<div>` popover, not a modal), and
     "Last updated: {refreshFiscalPeriod ? refreshFiscalPeriod + ' (' : ''}{formatted refreshTime}{')'
     if fiscalPeriod present}".
   - `<TrendTable tableData={selectedTab.tableData} showVariance={showVariance} />`.
7. Loading: skeleton table (reuse existing skeleton conventions). Error: error banner matching
   `SummaryPage`/`DetailsPage` style, reading `error.errorTitle`/`errorMsg` from the 404/500 payload
   shape returned by `data.py` (`hasError`, `errorTitle`, `errorMsg`, `email`, `subErrorMsg`).

### Table component — `src/components/trend/TrendTable/TrendTable.tsx`

Props: `{ tableData: IWFTableData; showVariance: boolean }`. Internal state: `isExpanded` (KPI
expand/collapse), defaulting from `tableData.defaultExpanded` when `kpiFilterEnabled`.

Rendering logic (ported from `wf-table.component.ts` `initTable`/`filterTableData`):
1. Determine `isHeaderString = typeof headers[0] === 'string'`.
2. Compute `displayedColumnsIndex`: keep columns whose `colType` is one of
   `['', 'parentNode', 'selectedNode', 'peerNode', 'childNode']` (desktop, no child-level toggle this
   pass), or all columns when headers are plain strings.
3. Build filtered/display rows: for each row, keep only cells in `displayedColumnsIndex`; recompute
   group-column (`columnid === 0`) `rowSpan` across consecutive rows sharing the same group (first
   visible row in a group gets `rowSpan = count`, subsequent rows render no cell in that column);
   respect `kpiFilterEnabled`/`measureColumnId`/`tags.includes('KPI')` filtering when collapsed.
4. Render a `<table>`:
   - Header row: `<th>` per displayed column, `colSpan` from header config, sticky first
     one/two columns (group + measure), alert icon if `header.alert` present, "expand all measures"
     icon in the measure header when `kpiFilterEnabled`.
   - Body rows: `<td>` per cell — group column only rendered on rows where computed `rowSpan > 0`
     (with `rowSpan` attribute), inline `background-color`/`border-left`/`border-right` style from
     the cell, `cssClass` appended to `className`, content via
     `dangerouslySetInnerHTML={{ __html: cell.displayValue }}` (same trust model as Angular's
     `bypassSecurityTrustHtml` — content is backend-authored, not user input), native `title` attribute
     for plain-text tooltips, a small custom hover popover for HTML tooltips (mirroring
     `appHtmlTooltip`).
5. Root `<table>` gets class `wf-table` plus `wf-table--show-variance` when `showVariance` is true —
   this is the only "variance" logic needed client-side; the pos/neg text and its show/hide behavior
   live entirely in backend-authored HTML + the CSS described below.

### Styling

New `src/styles/trend.css` (imported globally, e.g. from `main.tsx` or `globals.css`), porting the
cell-content classes verbatim from `store-insights/src/styles/app.scss` (lines ~2807-2920):
`.wf-primary-val`, `.wf-var-text` (+ `--pos`/`--neg`), `.wf-var-compact`,
`.wf-table.wf-table--show-variance .wf-var-text/.wf-var-compact { display: block/inline }`,
`.wf-goal__*` (bar track/segments/colors), `.wf-tt__*` tooltip content classes, `.tt-badge--*`.
Plus new component CSS modules for `TrendPage` (toolbar, dropdowns, toggle, title block) and
`TrendTable` (table layout, sticky columns, grouping borders) built to match the wireframes/screenshots.

## Data flow summary

```
FilterContext (selectedNode.code)
        │
        ▼
useTrendData(metric) ──GET /wf/{code} or /myPlan/{code}──▶ IWFPageData
        │
        ▼
TrendPage: selectedTabKey / selectedDateFilter / showVariance (local state)
        │
        ▼
activeCard → selectedTab.tableData
        │
        ▼
TrendTable: column filtering + row grouping + variance class
```

## Testing

- `src/api/trend.ts` — unit test verifying correct URL construction (`/wf/{code}`, `/myPlan/{code}`).
- `src/hooks/useTrendData.ts` — test `enabled` gating and query key.
- `TrendTable.test.tsx` — group `rowSpan` computation across consecutive rows, `colType` column
  filtering, KPI expand/collapse row filtering, `showVariance` class toggling.
- `TrendPage.test.tsx` — tab switching (View as), time period switching, Weekly Facts/My Plan toggle
  navigation (preserves `?code=&date=`), loading/error states.
- `SideNav.test.tsx`/`MobileNav.test.tsx` — update existing "Trend" assertions to target
  `/quick-facts/weekly` instead of `/trend`.

## Assumptions / simplifications (call out explicitly)

- Both "Weekly Facts" and "My Plan" tabs are always shown (no permission gating) since the React
  app's `AuthContext` is a stub with no `weekly_facts_enabled`/`my_plan_enabled` equivalent.
- `code` is taken from `FilterContext.selectedNode.code`; the `date` query param continues to be
  managed by `FilterContext` for consistency with the rest of the app, but per the confirmed backend
  contract it is **not** sent to `/wf`/`/myPlan` (those endpoints don't accept it).
- HTML `tooltip`/`displayValue` values are rendered as trusted HTML (matches Angular's
  `bypassSecurityTrustHtml`) since they originate from the backend's own data pipeline, not user input.
