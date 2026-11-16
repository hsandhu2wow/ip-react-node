# Quick Facts Feature Parity — Design Spec

**Date:** 2026-06-30  
**Reference:** Angular `dsa-buying-insights` repo, branch `navigation-and-dashboards-changes`  
**Angular components:** `app-sqf-summary-card`, `app-sqf-details-card`  
**Target:** `ip-react-node` React app, `/quick-facts` routes

---

## 1. Goal

Bring the React Quick Facts pages to full feature parity with the Angular DSA `app-sqf-summary-card` and `app-sqf-details-card` components. The React app currently has a generic `MetricCard` with a minimal subset of these features.

---

## 2. Architecture

Two purpose-built card components replace `MetricCard` usage in the quick-facts routes:

| Component | Page | Angular equivalent |
|---|---|---|
| `SummaryCard` | `/quick-facts/summary` | `app-sqf-summary-card` |
| `DetailsCard` | `/quick-facts/details/:type` | `app-sqf-details-card` |

The existing `MetricCard` is preserved as-is (not deleted).

---

## 3. File Changes

### New files

```
src/components/cards/SummaryCard/
  SummaryCard.tsx
  SummaryCard.module.css

src/components/cards/DetailsCard/
  DetailsCard.tsx
  DetailsCard.module.css

src/components/shared/InfoModal/
  InfoModal.tsx
  InfoModal.module.css

src/utils/sqf.ts               ← shared helpers (reportingPeriods map, isCutOffTimePast)
```

### Modified files

```
src/types/sqf.types.ts         ← add missing fields (see §5)
src/pages/quick-facts/SummaryPage.tsx   ← swap MetricCard → SummaryCard
src/pages/quick-facts/DetailsPage.tsx   ← swap MetricCard → DetailsCard
```

---

## 4. SummaryCard

Matches `app-sqf-summary-card` exactly.

### 4.1 Header
- Colored `border-top` from `card.cardHeader` (hex color string)
- Left side: card title, subtitle row with:
  - 📍 location icon + `card.location` (trimmed at `-`)
  - 📅 reporting period label (mapped via `REPORTING_PERIODS`, see §7.1)
  - Dropdown filters (one `<select>` per `card.dropdowns` entry)
- Right side: Recognize (🎉) button — visible when `cardHeader` is not `#eb5757` (red) or `#ebecec` (neutral). UI-only (no real export yet); shows spinner while "loading".

### 4.2 Content — top section
Shown when any of `infoNumbers`, `customInfoNumbers`, or `chartData` exist.

- **subHeading** — text above the KPI numbers block
- **infoNumbers** — row of KPI values. Each has:
  - `displayValue` styled with `color` (hex)
  - `text` label below
  - ℹ icon + tooltip when `infoMessage` is present
- **customInfoNumbers** — raw HTML rendered via `dangerouslySetInnerHTML` (treated as trusted content from API)
- **chartData** — bar, horizontalBar, pie, doughnut, or gauge via existing `MetricCardChart` logic
- **richText** — raw HTML block below chart

### 4.3 Tabs
Rendered when `card.tabs` exists. Wrapped in an expand/collapse container (collapsed by default on desktop, auto-expanded on mobile when `card.autoExpandForMobile` is true).

### 4.4 Table
Rendered when `card.tableData` exists (basic, nested, or comments type). Same expand/collapse container as tabs.

### 4.5 Expandable List
Rendered when `card.expandable_list` exists. Each item has:
- Clickable header (HTML) that toggles a collapsible content block (HTML)
- Last item has `lastChild` CSS class

### 4.6 Footer
Shown when `card.isDetailsPageAvailable`, `card.customDrillDownText`, `card.updatedTime`, or `tableData` exist.

- **Left:** "Go to `customDrillDownText ?? 'details'`" link → `/quick-facts/details/:cardName`
- **Right:** Expand/Collapse toggle (hidden when table is force-expanded via prop)
- **Bottom row:** "Updated at [date]" + "Metrics Info" button (opens `InfoModal` with `card.dataInfo.title` and `card.dataInfo.body`)

### 4.7 Error states
- **Filter error** (dropdown combo returns no data): "Data temporarily unavailable" message with support email.
- **Card error with cutOffTime (not yet past):** placeholder text "Data refresh is expected to complete by [cutOffTime]" (no SVG needed for MVP, use text).
- **Card error otherwise:** "Data temporarily unavailable — for concerns contact [supportEmail]".
- **Loading:** skeleton (reuse existing `MetricCardSkeleton`).

### 4.8 Dropdown filter logic
- `setUpFilters()`: initialise `selectedFilters` map from first value of each dropdown keyed by `card.filterKeys`.
- `filterCards()`: filter `card.cards[]` by matching all keys; if no match → set `filterError`.
- `filterUpdated(value, key)`: update `selectedFilters`, re-run `filterCards()`, auto-expand table.

---

## 5. DetailsCard

Matches `app-sqf-details-card`.

### 5.1 Header
Same as SummaryCard header but **without** location icon (only reporting period + dropdowns + Recognize button).

### 5.2 Content layout
Two-column flex layout:

| Left column | Right column |
|---|---|
| KPI numbers | Tabs (if `card.tabs`) |
| Chart | Table (if `card.tableData`) |
| _(hidden when `card.tableOnly`)_ | Drill-down link |

- When `card.tableOnly` is true: right column is full width, left is hidden.
- When there is no `chartData`: right column is full width.

### 5.3 Drill-down link
"View [nextLevel] details" — where `nextLevel` is computed from `selectedNode.children`:
- If `selectedNode.children[0].apiDepth === 5` → show department `<select>` (C1Availability special case)
- Otherwise → show plain link that calls `card.selected()` when `card.canDrillDown` and the current depth ≤ `details_last_level` from card status config

### 5.4 Footer
Always shown (when no error):
- "Updated at [card.updatedTime | formatted date]"
- "Metrics Info" button → opens `InfoModal`

### 5.5 Error and filter error states
Same as SummaryCard (§4.7).

### 5.6 Dropdown filter logic
Same as SummaryCard (§4.8).

---

## 6. InfoModal

A simple modal dialog component:

- Props: `title: string`, `body: string`, `onClose: () => void`
- Renders title in a header, `body` as raw HTML in content area
- Closes on backdrop click or close button
- Accessible: focus trap, `role="dialog"`, `aria-modal`

---

## 7. Shared Utilities (`src/utils/sqf.ts`)

### 7.1 `REPORTING_PERIODS` map
```ts
export const REPORTING_PERIODS: Record<string, string> = {
  WTD: 'Week-to-date',
  MTD: 'Month-to-date',
  YTD: 'Year-to-date',
  YDAY: 'Yesterday',
  ETD: 'Event-to-date',
  L7D: 'Last 7-Days',
  LW: 'Last week',
  CW: 'Current week',
  '7DR': '7-day rolling',
  HTD: 'Half-to-date',
  QTD: 'Quarter-to-date',
  '3MR': '3-month rolling',
  '12MR': '12-month rolling',
  MIT: 'Moment in time',
}
```

### 7.2 `isCutOffTimePast(cutOffTime: string): boolean`
Parses the cut-off time string (HH:MM:SS UTC) and compares against current time.

---

## 8. Type additions (`src/types/sqf.types.ts`)

```ts
// ISQFMetricCard additions
updatedTime?: string                    // ISO date or "MMM d, h:mm a" string from API
dataInfo?: { title: string; body: string }
subHeading?: string
customInfoNumbers?: string              // raw HTML
richText?: string                       // raw HTML
expandable_list?: IExpandableListItem[]
customDrillDownText?: string
filterKeys?: Record<string, string>     // { colKey → dropdownKey } (was string[])
children?: Array<{ code: string; label: string }>  // dept children for C1Availability
autoExpandForMobile?: boolean
tableOnly?: boolean

// New interface
export interface IExpandableListItem {
  header: string       // raw HTML
  content?: string     // raw HTML
  isExpanded?: boolean
}

// ISQFInfoNumber addition
val?: number            // raw numeric value used for sorting in DetailsPage
```

---

## 9. Page changes

### SummaryPage
- Import and render `SummaryCard` instead of `MetricCard`
- Pass `card` prop; skeleton count stays at 6

### DetailsPage
- Import and render `DetailsCard` instead of `MetricCard`
- Pass `card`, `last` (for divider), and `selectedNode` props
- Remove internal `MetricCard` import

---

## 10. What is NOT in scope

- Real Recognize/preview/export flow (button is UI-only)
- Analytics tracking calls (Angular's `sendQFDataToAnalytics`)
- Comments-type table (render as generic table for now if data exists)
- Seasonal cards (separate route/hook, unchanged)

---

## 11. Testing

Existing tests in `src/test/` and `MetricCard.test.tsx` are unaffected (MetricCard is not removed). No new test files are required for this spec — the existing test suite must continue to pass.
