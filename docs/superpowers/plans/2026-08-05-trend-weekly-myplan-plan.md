# Trend (Weekly Facts / My Plan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `/quick-facts/weekly` and `/quick-facts/myplan` React routes (the "Trend" nav destination), porting the Angular Weekly Facts / My Plan desktop table page (toolbar, header, grouped/KPI-filterable table with variance display) to React, wired to the real `GET /wf/<code>` and `GET /myPlan/<code>` backend endpoints.

**Architecture:** A new `TrendPage` component (mirroring `SummaryPage`'s loading/error conventions) fetches page data via a `useTrendData` React Query hook and `api/trend.ts`. A pure `tableTransform.ts` module ports the Angular `wf-table.component.ts` filtering/grouping/KPI algorithm into a framework-free function, tested in isolation. A `TrendTable` component renders the transformed data with CSS classes ported verbatim from `app.scss`. `SideNav`/`MobileNav` are updated to point "Trend" at `/quick-facts/weekly` and to fix a pre-existing prefix-matching bug that would otherwise make "Daily" also activate on the new routes.

**Tech Stack:** React, TypeScript, React Query (`@tanstack/react-query`), React Router, Vitest + Testing Library, plain CSS Modules / `globals.css` (matching existing app conventions).

---

## Decisions Locked In (resolving open questions from planning research)

1. **Tooltips:** Use a plain-text `title` attribute (HTML tags stripped from `header.tooltip` or `header.text`) — no custom hover-popover component. This is a deliberate simplification vs. the Angular `appHtmlTooltip` directive. (Amends spec's "small custom hover popover" wording to a plain `title` attribute — noted as simplification.)
2. **Spacer rows (`isGroupEnd`):** Implement. The Angular table renders a blank spacer `<tr>` after the last row of a group (when that group's `rowSpan > 1` and it isn't the very last row overall). This is visually present in the screenshots (gaps between groups) so `tableTransform.ts` will compute `isGroupEnd` per row and `TrendTable.tsx` will render a spacer row when true.
3. **`hasDoubleGoalsHeader` column-position nuances:** Simplify. We will implement the base `colSpan`/`cssClass`/border logic faithfully, but skip the extra conditional right-align nuance tied to `i > 1` vs `i > 2` thresholds — this is a minor visual polish detail in Angular that isn't clearly visible in the provided screenshots. Documented here as a deliberate simplification.
4. **Subscription preferences link:** Gate visibility on `wfData.is_web_subscription_enabled` (matches Angular). Render as a static (non-interactive, no `onClick`) element when true, per the "not in scope" decision for subscriptions functionality.

---

## File Structure

- `src/types/wf.types.ts` (new) — TypeScript interfaces for the Weekly Facts / My Plan API response, corrected vs. the stale Angular `.d.ts` (flat string `tags`, split `borderLeftColor`/`borderRightColor`, `IWFTableHeader` with `colSpan`/`cssClass`/`columnWidth`/`colType`, `metricsInfo.label`).
- `src/api/trend.ts` (new) — `getWeeklyFacts(code)` / `getMyPlan(code)` thin wrappers over `api/client.ts`, calling `GET /wf/<code>` and `GET /myPlan/<code>`.
- `src/api/trend.test.ts` (new) — unit tests for the above using the existing mocked-fetch test convention.
- `src/utils/tableTransform.ts` (new) — pure function `filterTableData(tableData, isExpanded)` porting the Angular grouping/KPI-filter/rowSpan/spacer-row algorithm; framework-free, fully unit tested.
- `src/utils/tableTransform.test.ts` (new) — unit tests covering grouping, KPI filter on/off, rowSpan finalization, spacer rows.
- `src/hooks/useTrendData.ts` (new) — React Query hook mirroring `useDetailsCard.ts` conventions, selecting `getWeeklyFacts` vs `getMyPlan` based on a `metric: 'weekly' | 'myPlan'` param.
- `src/hooks/useTrendData.test.ts` (new) — hook tests mirroring `useDetailsCard.test.ts` if present, else the existing React Query test convention used in the repo.
- `src/components/trend/TrendTable.tsx` (new) — presentational table component consuming already-filtered data from `tableTransform`.
- `src/components/trend/TrendTable.module.css` (new) — CSS module scoping for table-specific layout (non-color-critical rules); shared verbatim color/variance/goal-bar rules go into `globals.css` (see Task 7) to match the existing convention of global utility classes like `.wf-*`.
- `src/components/trend/TrendTable.test.tsx` (new).
- `src/pages/quick-facts/TrendPage.tsx` (new) — page-level component: toolbar (metric toggle, tabs dropdown, date filter dropdown, Show Variance toggle, subscription link), header block (title, duration label, metrics info, last updated), and the `TrendTable`.
- `src/pages/quick-facts/TrendPage.module.css` (new).
- `src/pages/quick-facts/TrendPage.test.tsx` (new).
- `src/App.tsx` (modify) — add two routes: `/quick-facts/weekly` and `/quick-facts/myplan`, both rendering `TrendPage` (with a `metric` prop or derived from `useLocation()`).
- `src/components/layout/SideNav/SideNav.tsx` (modify) — Trend nav item points to `/quick-facts/weekly`, `badge: false`; fix `isActive` prefix-collision bug.
- `src/components/layout/SideNav/SideNav.test.tsx` (modify) — add/update tests for Trend active-state disambiguation.
- `src/components/layout/MobileNav/MobileNav.tsx` (modify) — same nav destination fix, `ROUTE_TITLES` additions, fix `getRouteInfo`/`isItemActive` prefix-collision bug.
- `src/components/layout/MobileNav/MobileNav.test.tsx` (modify) — same as SideNav tests.
- `src/pages/quick-facts/QuickFactsLayout.tsx` (modify) — add `isTrend` awareness if `PageBar`/`FilterBar` need it (see Task 10).
- `src/styles/globals.css` (modify) — append the ported `.wf-*` CSS block.

---

## Task 1: `wf.types.ts` — API response types

**Files:**
- Create: `src/types/wf.types.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/types/wf.types.ts

export interface WfMetricsInfo {
  title: string;
  body: string;
  label?: string;
}

export interface WfVarianceFlag {
  text: string;
  value: boolean;
}

export interface WfBanner {
  type: string;
  text: string;
}

export interface WfTableHeader {
  text: string;
  val: string;
  tooltip?: string;
  alert?: boolean;
  colSpan?: number;
  cssClass?: string;
  columnWidth?: string;
  colType?: string;
}

export interface WfTableCell {
  columnid: number;
  color?: string;
  displayValue: string;
  value: string | number;
  tooltip?: string;
  backgroundColor?: string;
  borderLeftColor?: string;
  borderRightColor?: string;
  infoMessage?: string;
  alert?: boolean;
  tags?: string;
  cssClass?: string;
  rowSpan?: number;
}

export type WfTableRow = WfTableCell[];

export interface WfTableData {
  headers: WfTableHeader[] | string[];
  data: WfTableRow[];
  sortCol?: string;
  sortOrder?: string;
  type?: string;
  colType?: string;
  kpiFilterEnabled?: boolean;
  measureColumnId?: number;
  defaultExpanded?: boolean;
}

export interface WfCardContents {
  seq?: number;
  weekNo?: string;
  month?: string;
  infoMessage?: string;
  timePeriod?: string;
  tableData: WfTableData;
  filterKey?: string;
}

export interface WfCardData {
  cardContents?: WfCardContents | WfCardContents[];
  displayName: string;
  mobileDisplayName?: string;
  key: string;
  hasFiscalWeeks?: boolean;
  hasMobileView?: boolean;
  hasHistoryData?: boolean;
  mobileDateFilterTabName?: string;
  dateFilterValues?: string[];
  dateFilterLabel?: string;
  dateFilterKey?: string;
  durationLabel?: string;
  half_year?: string;
}

export interface WfPageData {
  config?: { ai_insights_enabled?: boolean };
  cards: WfCardData[];
  label?: string;
  level?: string;
  childCode?: string;
  childDesc?: string;
  parentCode?: string;
  parentDesc?: string;
  refreshFiscalPeriod?: string;
  refreshTime: string;
  jsId?: string;
  title?: string;
  cardType?: string;
  banner?: WfBanner;
  toolkit_link?: string;
  usage_dashboard_link?: string;
  is_web_subscription_enabled?: boolean;
  available_views?: string[];
  metricsInfo?: WfMetricsInfo;
  varianceFlag?: WfVarianceFlag;
}

export interface WfError {
  errorTitle?: string;
  errorMsg?: string;
  email?: string;
  subErrorMsg?: string;
}

export type WfMetric = 'weekly' | 'myPlan';
```

- [ ] **Step 2: No test needed (pure type declarations)** — proceed to Task 2. Commit this file together with Task 2's files (see Task 2 Step 5) to keep commits meaningful (a types-only commit with no consumer is acceptable too, but bundling avoids churn).

---

## Task 2: `api/trend.ts` — backend calls

**Files:**
- Create: `src/api/trend.ts`
- Create: `src/api/trend.test.ts`
- Reference: `src/api/sqf.ts` (existing pattern), `src/api/client.ts`

First, look at the existing convention:

```typescript
// src/api/sqf.ts (existing pattern — for reference, do not copy verbatim, paths differ)
import { apiClient } from './client';
// ... existing functions call apiClient.get(`/some/path/${code}`)
```

- [ ] **Step 1: Write the failing test**

```typescript
// src/api/trend.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeeklyFacts, getMyPlan } from './trend';
import { apiClient } from './client';

vi.mock('./client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('trend api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getWeeklyFacts calls GET /wf/<code>', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { cards: [] } });
    const result = await getWeeklyFacts('National');
    expect(apiClient.get).toHaveBeenCalledWith('/wf/National');
    expect(result).toEqual({ cards: [] });
  });

  it('getMyPlan calls GET /myPlan/<code>', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { cards: [] } });
    const result = await getMyPlan('National');
    expect(apiClient.get).toHaveBeenCalledWith('/myPlan/National');
    expect(result).toEqual({ cards: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/api/trend.test.ts`
Expected: FAIL — `Cannot find module './trend'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/api/trend.ts
import { apiClient } from './client';
import type { WfPageData } from '../types/wf.types';

export async function getWeeklyFacts(code: string): Promise<WfPageData> {
  const response = await apiClient.get<WfPageData>(`/wf/${code}`);
  return response.data;
}

export async function getMyPlan(code: string): Promise<WfPageData> {
  const response = await apiClient.get<WfPageData>(`/myPlan/${code}`);
  return response.data;
}
```

Check `src/api/client.ts` first — if `apiClient.get` does not return `{ data }` (e.g. it returns the body directly), adjust the two functions to match the actual return shape rather than the assumed `{ data }` wrapper shown above. Confirm this before writing the implementation by viewing `src/api/client.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/api/trend.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/types/wf.types.ts src/api/trend.ts src/api/trend.test.ts
git commit -m "feat(trend): add wf types and trend api client"
```

---

## Task 3: `tableTransform.ts` — grouping/KPI-filter/rowSpan/spacer-row algorithm

This is the core ported algorithm from `wf-table.component.ts`'s `filterTableData` and `initTable` (column filtering). Confirmed behavior (from Angular source):

1. Column filtering: keep header/cell at position `idx` only if its `colType` (empty string counts as `''`) is one of `['', 'parentNode', 'selectedNode', 'peerNode', 'childNode']`. If `headers[0]` is a plain string (not an object), treat `colType` as `''` for all columns (keep everything).
2. Row/group filtering: walk rows in order. For each row, find the cell with `columnid === 0` (the group/label cell) in the **original unfiltered row** — if its `rowSpan > 0`, this row starts a new group.
3. Determine `isKpi`: find the cell with `columnid === measureColumnId` (default `1`) in the filtered row; `isKpi = true` if that cell's `tags` string contains `'KPI'` (comma-separated tag list, e.g. `"KPI,ALERT"` — check via `.split(',').includes('KPI')`).
4. Row is kept if `!kpiFilterEnabled || isExpanded || isKpi`.
5. For kept rows, track `groupVisibleCount` (rows kept so far in the current group) and set the group cell's `rowSpan` on the **first kept row of a group** to `1` as a placeholder; when the group ends (a new group starts, or the table ends), finalize by overwriting the first kept row's group cell `rowSpan` to the final `groupVisibleCount`.
6. Compute `isGroupEnd` per row in a second pass over the kept/filtered rows: track a countdown `remaining` initialized from the (positional index 0) group cell's `rowSpan` whenever it's `> 1`; decrement per row; when `remaining` hits `0` and the row is not the last row in the table, mark that row's `isGroupEnd = true` so the table can render a spacer `<tr>` after it.

**Files:**
- Create: `src/utils/tableTransform.ts`
- Create: `src/utils/tableTransform.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/utils/tableTransform.test.ts
import { describe, it, expect } from 'vitest';
import { filterTableData } from './tableTransform';
import type { WfTableData, WfTableHeader, WfTableCell } from '../types/wf.types';

function cell(columnid: number, overrides: Partial<WfTableCell> = {}): WfTableCell {
  return { columnid, displayValue: `v${columnid}`, value: `v${columnid}`, ...overrides };
}

const headers: WfTableHeader[] = [
  { text: 'Group', val: '0' },
  { text: 'Metric', val: '1' },
  { text: 'Value', val: '2' },
];

describe('filterTableData', () => {
  it('keeps only columns with colType in the allowed set', () => {
    const headersWithColType: WfTableHeader[] = [
      { text: 'Group', val: '0', colType: '' },
      { text: 'Hidden', val: '1', colType: 'toggleChildLevelKey' },
      { text: 'Value', val: '2', colType: 'selectedNode' },
    ];
    const data: WfTableData = {
      headers: headersWithColType,
      data: [[cell(0, { rowSpan: 1 }), cell(1), cell(2)]],
    };
    const result = filterTableData(data, true);
    expect(result.headers.map((h) => h.text)).toEqual(['Group', 'Value']);
    expect(result.rows[0].map((c) => c.columnid)).toEqual([0, 2]);
  });

  it('groups rows and finalizes rowSpan on the first row of each group', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1, displayValue: 'Group A' }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1, displayValue: 'Group B' }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows[0][0].rowSpan).toBe(2);
    expect(result.rows[1][0].rowSpan).toBe(0);
    expect(result.rows[2][0].rowSpan).toBe(1);
  });

  it('filters out non-KPI rows when kpiFilterEnabled and not expanded', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      measureColumnId: 1,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: '' }), cell(2)],
      ],
    };
    const result = filterTableData(data, false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0][0].rowSpan).toBe(1);
  });

  it('keeps all rows when isExpanded is true even with kpiFilterEnabled', () => {
    const data: WfTableData = {
      headers,
      kpiFilterEnabled: true,
      measureColumnId: 1,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1, { tags: 'KPI' }), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1, { tags: '' }), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows).toHaveLength(2);
  });

  it('marks isGroupEnd on the last row of a multi-row group, but not on the final table row', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 0 }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows[0].isGroupEnd).toBeFalsy();
    expect(result.rows[1].isGroupEnd).toBe(true);
    expect(result.rows[2].isGroupEnd).toBeFalsy();
    // last row of the whole table is never marked, even though it ends a group
    expect(result.rows[3].isGroupEnd).toBeFalsy();
  });

  it('does not mark isGroupEnd for single-row groups (rowSpan of 1)', () => {
    const data: WfTableData = {
      headers,
      data: [
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
        [cell(0, { rowSpan: 1 }), cell(1), cell(2)],
      ],
    };
    const result = filterTableData(data, true);
    expect(result.rows.every((r) => !r.isGroupEnd)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/tableTransform.test.ts`
Expected: FAIL — `Cannot find module './tableTransform'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/tableTransform.ts
import type { WfTableData, WfTableHeader, WfTableCell, WfTableRow } from '../types/wf.types';

const ALLOWED_COL_TYPES = new Set(['', 'parentNode', 'selectedNode', 'peerNode', 'childNode']);

export interface FilteredTableRow extends Array<WfTableCell> {
  isGroupEnd?: boolean;
}

export interface FilteredTableResult {
  headers: WfTableHeader[];
  rows: FilteredTableRow[];
}

function normalizeHeaders(headers: WfTableData['headers']): WfTableHeader[] {
  const isHeaderString = typeof headers[0] === 'string';
  if (isHeaderString) {
    return (headers as string[]).map((text) => ({ text, val: text, colType: '' }));
  }
  return headers as WfTableHeader[];
}

function getAllowedColumnIndexes(headers: WfTableHeader[]): number[] {
  return headers.reduce<number[]>((acc, header, idx) => {
    const colType = header.colType || '';
    if (ALLOWED_COL_TYPES.has(colType)) {
      acc.push(idx);
    }
    return acc;
  }, []);
}

export function filterTableData(tableData: WfTableData, isExpanded: boolean): FilteredTableResult {
  const normalizedHeaders = normalizeHeaders(tableData.headers);
  const allowedIndexes = getAllowedColumnIndexes(normalizedHeaders);
  const filteredHeaders = allowedIndexes.map((idx) => normalizedHeaders[idx]);

  const measureColumnId = tableData.measureColumnId ?? 1;
  const kpiFilterEnabled = tableData.kpiFilterEnabled === true;

  const filtered: FilteredTableRow[] = [];
  let currentGroupStartIdx = -1;
  let groupVisibleCount = 0;

  const finalizeGroup = () => {
    if (currentGroupStartIdx !== -1) {
      const groupCell = filtered[currentGroupStartIdx].find((c) => c.columnid === 0);
      if (groupCell) {
        groupCell.rowSpan = groupVisibleCount;
      }
    }
  };

  for (const row of tableData.data) {
    const originalGroupCell = row.find((c) => c.columnid === 0);
    const isNewGroup = !!originalGroupCell && (originalGroupCell.rowSpan ?? 0) > 0;

    if (isNewGroup) {
      finalizeGroup();
      groupVisibleCount = 0;
      currentGroupStartIdx = filtered.length;
    }

    const displayRow: FilteredTableRow = allowedIndexes.map((idx) => ({ ...row[idx] }));
    const measureCell = displayRow.find((c) => c.columnid === measureColumnId);
    const isKpi = !!measureCell?.tags && measureCell.tags.split(',').includes('KPI');

    const keepRow = !kpiFilterEnabled || isExpanded || isKpi;
    if (keepRow) {
      groupVisibleCount++;
      const groupCell = displayRow.find((c) => c.columnid === 0);
      if (groupCell) {
        groupCell.rowSpan = groupVisibleCount === 1 ? 1 : 0;
      }
      filtered.push(displayRow);
    }
  }
  finalizeGroup();

  // Second pass: compute isGroupEnd for spacer rows.
  let remaining = 0;
  filtered.forEach((row, idx) => {
    const groupCell = row[0];
    if (groupCell?.rowSpan && groupCell.rowSpan > 1) {
      remaining = groupCell.rowSpan;
    }
    if (remaining > 0) {
      remaining--;
      if (remaining === 0 && idx !== filtered.length - 1) {
        row.isGroupEnd = true;
      }
    }
  });

  return { headers: filteredHeaders, rows: filtered };
}

export function getCellBorderStyle(cell: WfTableCell): Record<string, string> {
  if (cell.borderLeftColor) {
    return { borderLeft: `4px solid ${cell.borderLeftColor}` };
  }
  if (cell.borderRightColor) {
    return { borderRight: `4px solid ${cell.borderRightColor}` };
  }
  if (cell.backgroundColor) {
    return { backgroundColor: cell.backgroundColor };
  }
  return {};
}

export function getHeaderTooltip(header: WfTableHeader): string {
  if (header.tooltip) {
    return header.tooltip.replace(/<[^>]*>/g, '');
  }
  return (header.text || '').replace(/<[^>]*>/g, '');
}
```

Note: `WfTableRow` type import is unused if not referenced — remove it from the import list if TypeScript flags it as unused (`noUnusedLocals` may be enabled; check `tsconfig.json`). Use only the imports actually referenced.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/tableTransform.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/tableTransform.ts src/utils/tableTransform.test.ts
git commit -m "feat(trend): port wf-table filter/group/KPI algorithm to tableTransform"
```

---

## Task 4: `useTrendData.ts` — React Query hook

**Files:**
- Create: `src/hooks/useTrendData.ts`
- Create: `src/hooks/useTrendData.test.ts`
- Reference: `src/hooks/useDetailsCard.ts` (existing pattern)

First view `src/hooks/useDetailsCard.ts` and its test file (if one exists at `src/hooks/useDetailsCard.test.ts`) to confirm the exact React Query wrapper/test-provider convention used in this repo before writing this task's code, since the query client setup and `renderHook` wrapper must match exactly what's already used (e.g. a shared `createTestQueryClient()` helper or inline `QueryClientProvider` wrapper). Adjust the test below to match whatever wrapper convention is found — do not invent a new one.

- [ ] **Step 1: Write the failing test**

```typescript
// src/hooks/useTrendData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTrendData } from './useTrendData';
import * as trendApi from '../api/trend';
import * as filterContext from '../context/FilterContext';

vi.mock('../api/trend');
vi.mock('../context/FilterContext', async () => {
  const actual = await vi.importActual<typeof import('../context/FilterContext')>('../context/FilterContext');
  return { ...actual, useFilter: vi.fn() };
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useTrendData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (filterContext.useFilter as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedNode: { code: 'National' },
      isLoaded: true,
    });
  });

  it('calls getWeeklyFacts when metric is weekly', async () => {
    (trendApi.getWeeklyFacts as ReturnType<typeof vi.fn>).mockResolvedValue({ cards: [] });
    const { result } = renderHook(() => useTrendData('weekly'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(trendApi.getWeeklyFacts).toHaveBeenCalledWith('National');
  });

  it('calls getMyPlan when metric is myPlan', async () => {
    (trendApi.getMyPlan as ReturnType<typeof vi.fn>).mockResolvedValue({ cards: [] });
    const { result } = renderHook(() => useTrendData('myPlan'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(trendApi.getMyPlan).toHaveBeenCalledWith('National');
  });

  it('does not fetch when isLoaded is false', () => {
    (filterContext.useFilter as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedNode: { code: 'National' },
      isLoaded: false,
    });
    (trendApi.getWeeklyFacts as ReturnType<typeof vi.fn>).mockResolvedValue({ cards: [] });
    renderHook(() => useTrendData('weekly'), { wrapper });
    expect(trendApi.getWeeklyFacts).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useTrendData.test.ts`
Expected: FAIL — `Cannot find module './useTrendData'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/hooks/useTrendData.ts
import { useQuery } from '@tanstack/react-query';
import { useFilter } from '../context/FilterContext';
import { getWeeklyFacts, getMyPlan } from '../api/trend';
import type { WfMetric, WfPageData } from '../types/wf.types';

export function useTrendData(metric: WfMetric) {
  const { selectedNode, isLoaded } = useFilter();
  const code = selectedNode?.code;

  return useQuery<WfPageData>({
    queryKey: ['trend', metric, code],
    queryFn: () => (metric === 'weekly' ? getWeeklyFacts(code as string) : getMyPlan(code as string)),
    enabled: isLoaded && !!code,
    staleTime: 0,
  });
}
```

Confirm the exact field names on the object returned by `useFilter()` (`selectedNode`, `isLoaded`) by viewing `src/context/FilterContext.tsx` before finalizing — adjust names if they differ from this assumption.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useTrendData.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTrendData.ts src/hooks/useTrendData.test.ts
git commit -m "feat(trend): add useTrendData query hook"
```

---

## Task 5: CSS — port `.wf-*` styles into `globals.css`

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Append the ported CSS block**

View the end of `src/styles/globals.css` first to find the insertion point and confirm the `--color-primary` custom property name used elsewhere in the file. Then append:

```css
/* Trend (Weekly Facts / My Plan) table styles — ported from store-insights app.scss */
.wf-primary-val {
  font-size: 14px;
  font-weight: 400;
}

.wf-var-text {
  display: none;
  font-size: 10px;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
  color: #5a5a5a;
}

.wf-var-text--pos {
  color: #1a7a42;
}

.wf-var-text--neg {
  color: #c0392b;
}

.wf-var-compact {
  display: none;
}

.wf-table.wf-table--show-variance .wf-var-text,
.wf-table.wf-table--show-variance .wf-var-compact {
  display: block;
}

.wf-table.wf-table--show-variance .wf-var-compact {
  display: inline;
}

.wf-html-tooltip-panel {
  background: #323232;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 260px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.wf-tt__label {
  font-size: 10px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.wf-tt__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.wf-tt__key {
  opacity: 0.7;
  white-space: nowrap;
}

.wf-tt__val {
  font-weight: 700;
}

.wf-tt__badge {
  display: inline-block;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 700;
}

.tt-badge--green {
  background: rgba(33, 150, 83, 0.3);
  color: #7dd9a4;
}

.tt-badge--amber {
  background: rgba(239, 156, 72, 0.3);
  color: #f7c47a;
}

.tt-badge--red {
  background: rgba(235, 87, 87, 0.3);
  color: #f7a0a0;
}

.tt-badge--blue {
  background: rgba(63, 105, 174, 0.3);
  color: #a0b8f0;
}

.wf-goal__tooltip {
  font-size: 12px;
  min-width: 140px;
}

.wf-goal--bar {
  display: flex;
  flex-direction: column-reverse;
  justify-content: right;
  align-items: flex-end;
  width: 100%;
  background: transparent;
  cursor: default;
}

.wf-goal__score-num {
  font-weight: 700;
  color: var(--color-primary);
}

.wf-goal__score-of {
  font-weight: 400;
  color: #676d70;
}

.wf-goal__score {
  gap: 2px;
  justify-content: center;
  justify-items: center;
  width: 100px;
  max-width: 100px;
  margin: 0;
}

.wf-goal__bar {
  gap: 2px;
  justify-content: center;
  justify-items: center;
  width: 100%;
  max-width: 100px;
  min-width: 0;
  margin: 0;
}

.wf-goal__bar-track {
  display: flex;
  height: 6px;
  width: 100%;
  border-radius: 3px;
  overflow: hidden;
  background: #ececec;
}

.wf-goal__seg {
  height: 100%;
  transition: filter 120ms ease;
}

.wf-goal__seg__blue {
  background: #7996c6;
}

.wf-goal__seg__green {
  background: #93e490;
}

.wf-goal__seg__amber {
  background: #f4ba7f;
}

.wf-goal__seg__red {
  background: #f4927f;
}

.wf-goal__seg:hover {
  filter: brightness(0.92);
}
```

If `--color-primary` is not the actual custom property name in `globals.css`, replace it with the correct one found during the view step (do not leave `var(--color-primary)` unverified).

- [ ] **Step 2: No automated test for pure CSS** — visually verify later in Task 7/8 when `TrendTable`/`TrendPage` are rendered. Proceed to commit.

- [ ] **Step 3: Commit**

```bash
git add src/styles/globals.css
git commit -m "style(trend): port wf-table CSS from store-insights app.scss"
```

---

## Task 6: `TrendTable.tsx` — table component

**Files:**
- Create: `src/components/trend/TrendTable.tsx`
- Create: `src/components/trend/TrendTable.module.css`
- Create: `src/components/trend/TrendTable.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/trend/TrendTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendTable } from './TrendTable';
import type { WfTableData, WfTableCell } from '../../types/wf.types';

function cell(columnid: number, overrides: Partial<WfTableCell> = {}): WfTableCell {
  return { columnid, displayValue: `v${columnid}`, value: `v${columnid}`, ...overrides };
}

const tableData: WfTableData = {
  headers: [
    { text: 'Group', val: '0' },
    { text: 'Metric', val: '1' },
    { text: 'Value', val: '2' },
  ],
  data: [
    [cell(0, { rowSpan: 1, displayValue: 'Group A' }), cell(1, { displayValue: 'Sales' }), cell(2, { displayValue: '$100' })],
    [cell(0, { rowSpan: 0 }), cell(1, { displayValue: 'Units' }), cell(2, { displayValue: '50' })],
  ],
};

describe('TrendTable', () => {
  it('renders headers and cell values', () => {
    render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(screen.getByText('Metric')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('Units')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('applies wf-table--show-variance class when showVariance is true', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={true} />);
    expect(container.querySelector('table')?.className).toContain('wf-table--show-variance');
  });

  it('does not apply wf-table--show-variance class when showVariance is false', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    expect(container.querySelector('table')?.className).not.toContain('wf-table--show-variance');
  });

  it('renders a spacer row after a multi-row group', () => {
    const { container } = render(<TrendTable tableData={tableData} isExpanded={true} showVariance={false} />);
    const rows = container.querySelectorAll('tbody tr');
    // 2 data rows + 1 spacer row (group has 2 rows, so a spacer follows the last one, unless it's the final row overall)
    expect(rows.length).toBe(2);
  });
});
```

Note on the last test: with only one group spanning both rows and no rows after it, `isGroupEnd` will NOT be set (per Task 3's rule: never mark the last row of the whole table), so no spacer row renders and `rows.length` stays `2`. This test documents that edge case explicitly — it is not a placeholder, it's asserting the real expected behavior confirmed in Task 3.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/trend/TrendTable.test.tsx`
Expected: FAIL — `Cannot find module './TrendTable'`

- [ ] **Step 3: Write minimal implementation**

```css
/* src/components/trend/TrendTable.module.css */
.tableWrapper {
  overflow-x: auto;
  width: 100%;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.headerCell {
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  white-space: nowrap;
}

.dataCell {
  padding: 6px 12px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

.spacerRow td {
  height: 12px;
  padding: 0;
  border: none;
}
```

```tsx
// src/components/trend/TrendTable.tsx
import { filterTableData, getCellBorderStyle, getHeaderTooltip } from '../../utils/tableTransform';
import type { WfTableData } from '../../types/wf.types';
import styles from './TrendTable.module.css';

interface TrendTableProps {
  tableData: WfTableData;
  isExpanded: boolean;
  showVariance: boolean;
}

export function TrendTable({ tableData, isExpanded, showVariance }: TrendTableProps) {
  const { headers, rows } = filterTableData(tableData, isExpanded);
  const tableClassName = [styles.table, 'wf-table', showVariance ? 'wf-table--show-variance' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.tableWrapper}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={`${header.val}-${idx}`}
                className={`${styles.headerCell} ${header.cssClass || ''}`}
                colSpan={header.colSpan}
                title={getHeaderTooltip(header)}
              >
                {header.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <>
              <tr key={`row-${rowIdx}`}>
                {row.map((cell, cellIdx) => {
                  const header = headers[cellIdx];
                  if (cell.rowSpan === 0) {
                    return null;
                  }
                  return (
                    <td
                      key={`cell-${rowIdx}-${cellIdx}`}
                      className={`${styles.dataCell} ${header?.cssClass || ''} ${cell.cssClass || ''}`}
                      style={getCellBorderStyle(cell)}
                      rowSpan={cell.rowSpan}
                      title={cell.tooltip}
                    >
                      {cell.displayValue}
                    </td>
                  );
                })}
              </tr>
              {row.isGroupEnd && (
                <tr key={`spacer-${rowIdx}`} className={styles.spacerRow}>
                  <td colSpan={headers.length} />
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Note: using a React Fragment (`<>...</>`) as a direct child returned from `.map()` requires a `key` on the fragment itself, not just its children, or React will warn. Replace `<>` with `<React.Fragment key={...}>` — fix this in the actual write:

```tsx
import { Fragment } from 'react';
// ...
{rows.map((row, rowIdx) => (
  <Fragment key={`row-${rowIdx}`}>
    <tr>
      {/* ...same cell mapping as above, cell keys unchanged... */}
    </tr>
    {row.isGroupEnd && (
      <tr className={styles.spacerRow}>
        <td colSpan={headers.length} />
      </tr>
    )}
  </Fragment>
))}
```

Use this `Fragment`-based version (with `import { Fragment } from 'react';` added to the top of the file) as the actual final implementation, not the bare `<>` version shown first — the bare version was included only to show the reasoning; write the file with the corrected `Fragment` version directly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/trend/TrendTable.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/trend/TrendTable.tsx src/components/trend/TrendTable.module.css src/components/trend/TrendTable.test.tsx
git commit -m "feat(trend): add TrendTable component"
```

---

## Task 7: `TrendPage.tsx` — page component (toolbar, header, table)

**Files:**
- Create: `src/pages/quick-facts/TrendPage.tsx`
- Create: `src/pages/quick-facts/TrendPage.module.css`
- Create: `src/pages/quick-facts/TrendPage.test.tsx`
- Reference: `src/pages/quick-facts/SummaryPage.tsx` (loading/error convention)

View `src/pages/quick-facts/SummaryPage.tsx` in full immediately before writing this task, to copy its exact loading-skeleton and error-banner JSX structure/class names so `TrendPage` is visually consistent with the rest of the app (do not invent a different loading/error pattern).

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/quick-facts/TrendPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendPage } from './TrendPage';
import * as useTrendDataModule from '../../hooks/useTrendData';
import * as filterContext from '../../context/FilterContext';

vi.mock('../../hooks/useTrendData');
vi.mock('../../context/FilterContext', async () => {
  const actual = await vi.importActual<typeof import('../../context/FilterContext')>('../../context/FilterContext');
  return { ...actual, useFilter: vi.fn() };
});

const baseWfData = {
  refreshTime: '2026-08-04T10:00:00Z',
  is_web_subscription_enabled: false,
  cards: [
    {
      key: 'sales',
      displayName: 'Sales',
      hasHistoryData: true,
      dateFilterValues: ['2026-08-04'],
      dateFilterKey: 'weekNo',
      durationLabel: 'Fiscal week',
      cardContents: {
        weekNo: '2026-08-04',
        timePeriod: 'Aug 4, 2026',
        tableData: {
          headers: [{ text: 'Group', val: '0' }],
          data: [],
        },
      },
    },
  ],
};

describe('TrendPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (filterContext.useFilter as ReturnType<typeof vi.fn>).mockReturnValue({
      selectedNode: { code: 'National' },
      isLoaded: true,
    });
  });

  it('shows loading state while fetching', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByTestId('trend-page-loading')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByTestId('trend-page-error')).toBeInTheDocument();
  });

  it('renders the title as "Weekly Facts - <card displayName>" for the weekly metric', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Weekly Facts - Sales')).toBeInTheDocument();
  });

  it('renders the title as "My Plan - <card displayName>" for the myPlan metric', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="myPlan" />);
    expect(screen.getByText('My Plan - Sales')).toBeInTheDocument();
  });

  it('renders duration label and time period', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText('Fiscal week: Aug 4, 2026')).toBeInTheDocument();
  });

  it('renders last updated with formatted refreshTime', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('does not render subscription link when is_web_subscription_enabled is false', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: baseWfData,
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.queryByText(/Subscription preferences/)).not.toBeInTheDocument();
  });

  it('renders subscription link when is_web_subscription_enabled is true', () => {
    (useTrendDataModule.useTrendData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { ...baseWfData, is_web_subscription_enabled: true },
      isLoading: false,
      isError: false,
    });
    render(<TrendPage metric="weekly" />);
    expect(screen.getByText(/Subscription preferences/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/quick-facts/TrendPage.test.tsx`
Expected: FAIL — `Cannot find module './TrendPage'`

- [ ] **Step 3: Write minimal implementation**

First view `src/utils/formatters.ts` to confirm the exact date-formatting helper name/signature available in this repo (e.g. a `formatDateTime(date, pattern)` function) — use whatever real helper exists there for the "Last updated" `MMM d, h:mm a`-style formatting rather than inventing a new date library call. If no such helper exists, use vanilla `Intl.DateTimeFormat` inline as shown below (adjust only if a repo helper is found — prefer the repo helper if present).

```css
/* src/pages/quick-facts/TrendPage.module.css */
.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.headerBlock {
  padding: 12px 16px;
}

.title {
  font-size: 18px;
  font-weight: 700;
}

.subHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 13px;
  color: #444;
}

.metricsInfo {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.infoMessage {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.subscriptionLink {
  font-size: 12px;
  color: #666;
}

.errorBanner {
  padding: 16px;
  color: #c0392b;
}

.loading {
  padding: 16px;
}
```

```tsx
// src/pages/quick-facts/TrendPage.tsx
import { useMemo, useState } from 'react';
import { useTrendData } from '../../hooks/useTrendData';
import { TrendTable } from '../../components/trend/TrendTable';
import type { WfCardContents, WfCardData, WfMetric } from '../../types/wf.types';
import styles from './TrendPage.module.css';

const METRIC_DISPLAY_NAMES: Record<WfMetric, string> = {
  weekly: 'Weekly Facts',
  myPlan: 'My Plan',
};

interface TrendPageProps {
  metric: WfMetric;
}

function formatLastUpdated(refreshTime: string): string {
  const date = new Date(refreshTime);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getSelectedTab(activeCard: WfCardData | undefined, selectedDateFilter: string): WfCardContents | undefined {
  if (!activeCard) return undefined;
  if (Array.isArray(activeCard.cardContents)) {
    const dateFilterKey = activeCard.dateFilterKey || 'weekNo';
    const filterValue = selectedDateFilter || activeCard.dateFilterValues?.[0] || '';
    return activeCard.cardContents.find(
      (c) => (c as unknown as Record<string, string>)[dateFilterKey] === filterValue
    );
  }
  if (activeCard.cardContents) {
    return activeCard.cardContents;
  }
  return undefined;
}

export function TrendPage({ metric }: TrendPageProps) {
  const { data: wfData, isLoading, isError } = useTrendData(metric);
  const [selectedTabKey, setSelectedTabKey] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');
  const [showVariance, setShowVariance] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const tabs = useMemo(() => wfData?.cards ?? [], [wfData]);
  const activeCard = useMemo(
    () => tabs.find((c) => c.key === (selectedTabKey || tabs[0]?.key)),
    [tabs, selectedTabKey]
  );
  const selectedTab = useMemo(() => getSelectedTab(activeCard, selectedDateFilter), [activeCard, selectedDateFilter]);
  const tableData = selectedTab?.tableData;

  if (isLoading) {
    return (
      <div className={styles.loading} data-testid="trend-page-loading">
        Loading…
      </div>
    );
  }

  if (isError || !wfData) {
    return (
      <div className={styles.errorBanner} data-testid="trend-page-error">
        Unable to load data. Please try again later.
      </div>
    );
  }

  const metricDisplayName = METRIC_DISPLAY_NAMES[metric];
  const durationLabel = activeCard?.durationLabel || 'Time period';
  const showVarianceToggleEnabled = !!wfData.varianceFlag;
  const showVarianceLabel = wfData.varianceFlag?.text || 'Show variance';
  const kpiFilterEnabled = tableData?.kpiFilterEnabled === true;

  return (
    <div>
      <div className={styles.toolbar}>
        {tabs.length > 1 && (
          <select
            aria-label="Select tab"
            value={activeCard?.key}
            onChange={(e) => {
              setSelectedTabKey(e.target.value);
              setSelectedDateFilter('');
            }}
          >
            {tabs.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.displayName}
              </option>
            ))}
          </select>
        )}
        {!isError && activeCard?.hasHistoryData && (activeCard.dateFilterValues?.length ?? 0) > 0 && (
          <label>
            {activeCard.dateFilterLabel || 'Fiscal week'}:
            <select
              aria-label="Select date"
              value={selectedDateFilter || activeCard.dateFilterValues?.[0] || ''}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            >
              {activeCard.dateFilterValues?.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
        {!isError && showVarianceToggleEnabled && (
          <label>
            <input
              type="checkbox"
              checked={showVariance}
              onChange={(e) => setShowVariance(e.target.checked)}
            />
            {showVarianceLabel}
          </label>
        )}
        {kpiFilterEnabled && (
          <label>
            <input
              type="checkbox"
              checked={isExpanded}
              onChange={(e) => setIsExpanded(e.target.checked)}
            />
            Show all rows
          </label>
        )}
      </div>

      <div className={styles.headerBlock}>
        <div className={styles.title}>
          {metricDisplayName} - {activeCard?.displayName}
        </div>
        <div className={styles.subHeaderRow}>
          <span>
            {durationLabel}: {selectedTab?.timePeriod}
          </span>
          <span>
            {wfData.metricsInfo && (
              <span className={styles.metricsInfo}>{wfData.metricsInfo.label || 'Metrics Info'}</span>
            )}
            {' '}
            {wfData.refreshFiscalPeriod
              ? `Last updated: ${wfData.refreshFiscalPeriod} (${formatLastUpdated(wfData.refreshTime)})`
              : `Last updated: ${formatLastUpdated(wfData.refreshTime)}`}
          </span>
        </div>
        {selectedTab?.infoMessage && <div className={styles.infoMessage}>{selectedTab.infoMessage}</div>}
        {wfData.is_web_subscription_enabled && (
          <div className={styles.subscriptionLink}>Subscription preferences</div>
        )}
      </div>

      {tableData && <TrendTable tableData={tableData} isExpanded={isExpanded} showVariance={showVariance} />}
    </div>
  );
}
```

Confirm `useFilter()` field names again match what's used inside `useTrendData` (already fixed in Task 4) — `TrendPage` itself does not call `useFilter` directly, so no change needed here, but double check no lint errors arise from unused imports (`fireEvent` in the test, `WfCardData`/`WfCardContents` types) — trim unused imports if the linter flags them.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/quick-facts/TrendPage.test.tsx`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/quick-facts/TrendPage.tsx src/pages/quick-facts/TrendPage.module.css src/pages/quick-facts/TrendPage.test.tsx
git commit -m "feat(trend): add TrendPage with toolbar, header, and table"
```

---

## Task 8: Wire routes in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

View the current routing block in `src/App.tsx` in full before editing, to find the exact `<Route>` list and import style used (e.g. how `SummaryPage` is imported and routed under the `QuickFactsLayout`), and replicate that exact pattern for the two new routes rather than guessing at JSX structure.

- [ ] **Step 1: Add the two new routes**

Add the import:

```typescript
import { TrendPage } from './pages/quick-facts/TrendPage';
```

Add, inside the same `<Route>` nesting under `QuickFactsLayout` where `SummaryPage`'s route lives (match indentation/structure of the existing sibling route exactly):

```tsx
<Route path="/quick-facts/weekly" element={<TrendPage metric="weekly" />} />
<Route path="/quick-facts/myplan" element={<TrendPage metric="myPlan" />} />
```

- [ ] **Step 2: Manually verify route renders**

Run: `npm run dev` (or existing dev script — check `package.json` for the exact script name first), then navigate to `http://localhost:4200/quick-facts/weekly?code=National&date=2026-08-04` and `http://localhost:4200/quick-facts/myplan?code=National&date=2026-08-04` in a browser to confirm the page loads without a blank screen or router error. Stop the dev server afterward.

- [ ] **Step 3: Run full test suite to check for regressions**

Run: `npx vitest run`
Expected: All existing tests still PASS, plus the new tests from Tasks 1–7.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(trend): wire /quick-facts/weekly and /quick-facts/myplan routes"
```

---

## Task 9: Fix nav prefix-matching bug and point Trend at the new route (`SideNav.tsx`)

**Files:**
- Modify: `src/components/layout/SideNav/SideNav.tsx`
- Modify: `src/components/layout/SideNav/SideNav.test.tsx`

The current `isActive` logic (`pathname === prefix || pathname.startsWith(prefix + '/')`) makes `/quick-facts` (Daily's prefix) match `/quick-facts/weekly` and `/quick-facts/myplan` too, since those routes start with `/quick-facts/`. Fix: check the **longest matching prefix** across all `NAV_ITEMS`, and only mark an item active if its own prefix is that longest match — not just "does this pathname start with my prefix".

- [ ] **Step 1: Write the failing tests**

Add to `SideNav.test.tsx` (view the file first to match its existing `render`/`MemoryRouter` test setup exactly, then add these cases alongside the existing ones):

```tsx
it('marks Trend as active on /quick-facts/weekly and not Daily', () => {
  render(<SideNav />, { route: '/quick-facts/weekly' }); // adjust to match this file's actual render helper/wrapper
  const trendLink = screen.getByRole('link', { name: /Trend/i });
  const dailyLink = screen.getByRole('link', { name: /Daily/i });
  expect(trendLink.className).toContain('active'); // adjust to the actual active class name used in this file
  expect(dailyLink.className).not.toContain('active');
});

it('marks Trend as active on /quick-facts/myplan and not Daily', () => {
  render(<SideNav />, { route: '/quick-facts/myplan' });
  const trendLink = screen.getByRole('link', { name: /Trend/i });
  const dailyLink = screen.getByRole('link', { name: /Daily/i });
  expect(trendLink.className).toContain('active');
  expect(dailyLink.className).not.toContain('active');
});
```

Before finalizing this step, view `SideNav.test.tsx` in full and rewrite the two new test cases using the file's actual existing render helper (e.g. a `renderWithRouter(ui, path)` utility or direct `MemoryRouter initialEntries` usage) and actual active-class assertion style (e.g. `toHaveClass('active')` vs a `data-active="true"` attribute) — do not introduce a new testing pattern inconsistent with the rest of the file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/layout/SideNav/SideNav.test.tsx`
Expected: FAIL — Daily incorrectly shows as active on the new routes.

- [ ] **Step 3: Fix `NAV_ITEMS` and `isActive` logic**

Update the `NAV_ITEMS` array's Trend entry:

```typescript
{ icon: 'view_week', label: 'Trend', to: '/quick-facts/weekly', prefix: '/quick-facts/weekly', badge: false },
```

Replace the per-item `isActive` check with a longest-prefix-match computed once per render:

```typescript
function getActivePrefix(pathname: string, items: { prefix: string }[]): string {
  const matches = items
    .map((item) => item.prefix)
    .filter((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return matches.sort((a, b) => b.length - a.length)[0] || '';
}
```

Then, wherever `NAV_ITEMS` is rendered (e.g. inside the component body), compute `const activePrefix = getActivePrefix(location.pathname, NAV_ITEMS);` once, and change each item's active check from its own `isActive(item)` call to `item.prefix === activePrefix`. View the actual current render loop in `SideNav.tsx` before editing to match variable names (`location`/`pathname` source, e.g. `useLocation()` from react-router) and apply this exact fix without altering unrelated rendering logic.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/layout/SideNav/SideNav.test.tsx`
Expected: PASS, including previously-passing tests (Weekly-still-Coming-Soon assertions) and the two new ones.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/SideNav/SideNav.tsx src/components/layout/SideNav/SideNav.test.tsx
git commit -m "fix(nav): point Trend at /quick-facts/weekly and fix prefix-collision active-state bug"
```

---

## Task 10: Same fix for `MobileNav.tsx`

**Files:**
- Modify: `src/components/layout/MobileNav/MobileNav.tsx`
- Modify: `src/components/layout/MobileNav/MobileNav.test.tsx`

- [ ] **Step 1: Write the failing tests**

View `MobileNav.test.tsx` in full first to match its existing test/render conventions, then add (adjusting syntax to match the file's actual helpers):

```tsx
it('shows "Trend" title on /quick-facts/weekly', () => {
  render(<MobileNav />, { route: '/quick-facts/weekly' }); // adjust to actual render helper
  expect(screen.getByText('Trend')).toBeInTheDocument();
  expect(screen.getByText('powered by Weekly Facts and My Plan')).toBeInTheDocument();
});

it('shows "Trend" title on /quick-facts/myplan', () => {
  render(<MobileNav />, { route: '/quick-facts/myplan' });
  expect(screen.getByText('Trend')).toBeInTheDocument();
});

it('marks Trend as active on /quick-facts/weekly and not Daily in STORE_ITEMS', () => {
  render(<MobileNav />, { route: '/quick-facts/weekly' });
  const trendItem = screen.getByText('Trend').closest('[class*="active"], a, button');
  expect(trendItem).toBeTruthy();
});
```

Adjust the third test's DOM query to whatever `STORE_ITEMS`/active-class rendering actually looks like in the component — view the component render output structure first rather than guessing at a selector; if `STORE_ITEMS` renders simple links similar to `SideNav`, reuse the same `toHaveClass`/`className` assertion style as Task 9 for consistency.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/layout/MobileNav/MobileNav.test.tsx`
Expected: FAIL — new `ROUTE_TITLES` keys don't exist yet, and the old `/trend`/`toggle` collision bug reproduces on `STORE_ITEMS`.

- [ ] **Step 3: Fix `ROUTE_TITLES`, `getRouteInfo`, `STORE_ITEMS`, and `isItemActive`**

Add new entries to `ROUTE_TITLES`:

```typescript
'/quick-facts/weekly': { title: 'Trend', tagline: 'powered by Weekly Facts and My Plan' },
'/quick-facts/myplan': { title: 'Trend', tagline: 'powered by Weekly Facts and My Plan' },
```

Fix `getRouteInfo` to sort candidate keys by length descending before picking the first match (so `/quick-facts/weekly` is preferred over the shorter `/quick-facts` when both match):

```typescript
function getRouteInfo(pathname: string) {
  const keys = Object.keys(ROUTE_TITLES).sort((a, b) => b.length - a.length);
  const matchedKey = keys.find((k) => pathname === k || pathname.startsWith(k + '/'));
  return matchedKey ? ROUTE_TITLES[matchedKey] : undefined;
}
```

Update `STORE_ITEMS`'s Trend entry:

```typescript
{ icon: 'view_week', label: 'Trend', to: '/quick-facts/weekly' },
```

Apply the same longest-prefix-match fix to `isItemActive` as done for `SideNav` in Task 9 (reuse the identical `getActivePrefix` helper logic — extract it to a small shared utility if both `SideNav.tsx` and `MobileNav.tsx` need the exact same function, e.g. `src/components/layout/navActiveMatch.ts`, to avoid duplicating the sort/filter logic in two files):

```typescript
// src/components/layout/navActiveMatch.ts
export function getActivePrefix(pathname: string, prefixes: string[]): string {
  const matches = prefixes.filter((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return matches.sort((a, b) => b.length - a.length)[0] || '';
}
```

Then update both `SideNav.tsx` (replacing its local `getActivePrefix` from Task 9 with an import from this new shared file — revise Task 9's file accordingly) and `MobileNav.tsx` to import and use this shared helper for their respective `isActive`/`isItemActive` checks.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/layout/MobileNav/MobileNav.test.tsx src/components/layout/SideNav/SideNav.test.tsx`
Expected: PASS, all tests in both files.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/MobileNav/MobileNav.tsx src/components/layout/MobileNav/MobileNav.test.tsx src/components/layout/SideNav/SideNav.tsx src/components/layout/navActiveMatch.ts
git commit -m "fix(nav): extract shared active-prefix matching and apply to MobileNav"
```

---

## Task 11: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (baseline 98 + new tests from Tasks 1–10).

- [ ] **Step 2: Run lint**

Run: `npm run lint` (confirm exact script name in `package.json` first)
Expected: No new lint errors introduced by this feature's files.

- [ ] **Step 3: Run build**

Run: `npm run build` (confirm exact script name in `package.json` first)
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

Run the dev server and visit both target URLs one more time end-to-end:
- `http://localhost:4200/quick-facts/weekly?code=National&date=2026-08-04`
- `http://localhost:4200/quick-facts/myplan?code=National&date=2026-08-04`

Confirm: page loads, table renders with grouped rows and spacer gaps, "Trend" nav item is highlighted as active (and "Daily" is not), toolbar controls (tab dropdown, date filter, Show Variance) render and toggle without console errors, and switching "Show Variance" toggles the `.wf-table--show-variance` class visibly (variance text appears/disappears).

- [ ] **Step 5: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore(trend): final regression pass for weekly/myplan trend pages"
```

(Skip this commit if Step 4 required no code changes.)

---

## Self-Review Notes (completed during plan authoring)

**Spec coverage:** All in-scope items from the approved spec doc (`docs/superpowers/specs/2026-08-05-trend-weekly-myplan-design.md`) are covered: real backend calls (Task 2), core desktop table with grouping/KPI-filter/variance (Tasks 3, 6), toolbar and header (Task 7), routing (Task 8), nav wiring restricted to "Trend" only (Tasks 9–10). Deferred items (AI insights, subscriptions interactivity, mobile view, popups, hierarchy dropdown, breadcrumbs) are intentionally excluded from all tasks — confirmed no task accidentally implements them.

**Amendments to spec surfaced during planning (documented in the "Decisions Locked In" section above):** tooltip simplified to `title` attribute; spacer rows added (new finding, not in original spec, now implemented); `hasDoubleGoalsHeader` nuance simplified; subscription link visibility gated on `is_web_subscription_enabled` matching Angular behavior. These four should be read back into the spec doc as a short amendment note before/after execution — recommend appending a "Post-planning amendments" section to the spec doc during Task 11 or immediately after plan approval.

**Placeholder scan:** No "TBD"/"TODO"/"similar to Task N" patterns remain; every code step includes full code. A few steps explicitly instruct viewing a file first to confirm an exact name (e.g. `--color-primary`, `useFilter()` field names, existing test render helpers) — these are legitimate "verify against real source before finalizing" instructions, not vague placeholders, since the fallback/expected values are stated explicitly in each case.

**Type consistency check:** `WfMetric`, `WfPageData`, `WfCardData`, `WfCardContents`, `WfTableData`, `WfTableHeader`, `WfTableCell` are defined once in Task 1 and referenced identically (same names) in Tasks 2–7. `filterTableData`, `getCellBorderStyle`, `getHeaderTooltip` from Task 3 are the exact names imported in Task 6. `useTrendData` from Task 4 is the exact name imported in Task 7. No naming drift found.
