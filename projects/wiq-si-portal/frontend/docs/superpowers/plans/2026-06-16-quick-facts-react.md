# React Store Insights — Quick Facts Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready React application that replicates the Angular Store Insights `/quick-facts` module (Summary + Details pages) using the same Python backend APIs.

**Architecture:** Vite + React 18 + TypeScript app with React Router v6 nested routes. A `FilterContext` holds the selected location node and date, synced to URL params. React Query hooks fetch data with the filter values as cache keys — auto-refetching on filter change (mirrors Angular's BehaviorSubject pattern).

**Tech Stack:** Vite 5, React 18, TypeScript 5, React Router v6, TanStack React Query v5, Axios, Chart.js 4 + react-chartjs-2, CSS Modules, Vitest + React Testing Library.

---

## File Map

```
ip-react-node/
├── src/
│   ├── types/sqf.types.ts           # All TypeScript interfaces (IQFTree, ISQFMetricCard, etc.)
│   ├── api/
│   │   ├── client.ts                # Axios instance with VITE_API_URL base URL
│   │   └── sqf.ts                   # All /sqf/* API functions
│   ├── utils/
│   │   ├── formatters.ts            # colorVal, beautify, beautifyUpwards, formatDate
│   │   └── tree.ts                  # processFilterResponse, flattenTree, findNodeByCode, addParents
│   ├── context/
│   │   ├── AuthContext.tsx          # Phase 1 stub — always authenticated
│   │   └── FilterContext.tsx        # selectedNode + selectedDate, URL sync, tree data
│   ├── hooks/
│   │   ├── useFilterTree.ts         # Loads hierarchy tree, calls setTreeData on context
│   │   ├── useCardStatus.ts         # Loads getSQFMetricCardsStatus (cached indefinitely)
│   │   ├── useSummaryCards.ts       # Loads summary cards per filter
│   │   ├── useDetailsCard.ts        # Loads detail card per metric + filter
│   │   ├── useSeasonalCard.ts       # Loads seasonal metric per filter
│   │   └── useDataLoadETA.ts        # Loads ETA map (cached 5 min)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header/Header.tsx + Header.module.css
│   │   │   ├── PageBar/PageBar.tsx + PageBar.module.css
│   │   │   └── FilterBar/FilterBar.tsx + FilterBar.module.css
│   │   └── cards/MetricCard/
│   │       ├── MetricCard.tsx           # Root: guards hidden/error/loading, picks variant
│   │       ├── MetricCard.module.css
│   │       ├── MetricCardSkeleton.tsx   # CSS pulse-animation placeholder
│   │       ├── MetricCardError.tsx      # Error states (cut-off, no data, generic)
│   │       ├── MetricCardHeader.tsx     # Title, colour bar, sub-title, reporting period
│   │       ├── MetricCardKpiRow.tsx     # infoNumbers[] — KPI values + labels
│   │       ├── MetricCardChart.tsx      # Chart.js bar/pie via react-chartjs-2
│   │       ├── MetricCardTable.tsx      # tableData, expandable rows
│   │       ├── MetricCardTabs.tsx       # tabs[] switcher
│   │       ├── MetricCardFooter.tsx     # "See details" link, info icon
│   │       └── index.ts
│   ├── pages/quick-facts/
│   │   ├── QuickFactsLayout.tsx + .module.css   # Route shell, FilterProvider wrapper
│   │   ├── SummaryPage.tsx + .module.css        # /quick-facts/summary
│   │   └── DetailsPage.tsx + .module.css        # /quick-facts/details/:type
│   ├── styles/globals.css            # CSS variables, reset, card grid breakpoints
│   ├── test/setup.ts                 # @testing-library/jest-dom import
│   ├── App.tsx                       # Router root
│   └── main.tsx                      # Vite entry point + QueryClient + BrowserRouter
├── .env                              # VITE_API_URL=/api (committed)
├── vite.config.ts                    # Vite config + dev proxy /api → localhost:8080
├── vitest.config.ts                  # Vitest config with jsdom
└── package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.env`, `src/test/setup.ts`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1.1: Initialize Vite + React + TypeScript project**

From inside `/Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node/`:

```bash
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose to remove and continue (wireframes will be preserved if you answer no, but the `.git` is what matters and Vite won't touch it).

Actually: since `.git` and `wireframes/` and `docs/` already exist, run:
```bash
# Scaffold into a temp dir then copy relevant files
cd /tmp && npm create vite@latest react-app -- --template react-ts
cp -r /tmp/react-app/src /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node/
cp /tmp/react-app/package.json /tmp/react-app/tsconfig.json /tmp/react-app/tsconfig.app.json /tmp/react-app/tsconfig.node.json /tmp/react-app/vite.config.ts /tmp/react-app/index.html /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node/
```

- [ ] **Step 1.2: Replace `vite.config.ts` with project config**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  }
})
```

- [ ] **Step 1.3: Install all dependencies**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npm install react-router-dom @tanstack/react-query axios chart.js react-chartjs-2 chartjs-plugin-datalabels chartjs-plugin-annotation
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 1.4: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 1.5: Create `src/test/setup.ts`**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 1.6: Create `.env`**

```bash
# .env  (committed — works in both dev and production)
VITE_API_URL=/api
```

- [ ] **Step 1.7: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts on `http://localhost:5173`. Open it — you'll see the default Vite + React welcome page. That's correct for now.

- [ ] **Step 1.8: Verify tests run**

```bash
npm run test -- --run
```

Expected: any default tests pass (or "No test files found" — both are fine).

- [ ] **Step 1.9: Commit**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
git add package.json package-lock.json vite.config.ts vitest.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/ .env
git commit -m "chore: scaffold Vite + React + TypeScript project

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: TypeScript Type Definitions

**Files:**
- Create: `src/types/sqf.types.ts`

- [ ] **Step 2.1: Create `src/types/sqf.types.ts`**

These interfaces are derived from the Angular app's global typings and API response shapes:

```typescript
// src/types/sqf.types.ts

/** Raw API response from getUniversalFilterGeneric */
export interface ISQFGenericFilter {
  name: string
  code: string
  level: number | string
  level_desc: string
  children?: ISQFGenericFilter[]
  leafChildren?: ISQFGenericFilter[]
  selected?: boolean
  nonClickable?: boolean
  alwaysHidden?: boolean
}

/** Processed tree node used throughout the UI */
export interface IQFTree {
  name: string
  code: string
  level: string
  level_desc: string
  depth: number
  apiDepth: number
  children?: IQFTree[]
  expandable: boolean
  parent?: IQFTree
  selected?: boolean
  leafChildren?: ISQFGenericFilter[] | null
  alwaysHidden?: boolean
  hidden?: boolean
  isChecked?: boolean
  nonClickable?: boolean
}

/** KPI value displayed in a card */
export interface ISQFInfoNumber {
  val: string | number
  label: string
  color?: 'positive' | 'negative' | 'neutral'
}

/** Chart.js compatible data structure */
export interface ISQFChartData {
  labels: string[]
  datasets: Array<{
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    label?: string
    type?: string
  }>
}

/** Table data returned by the backend */
export interface ISQFTableData {
  headers: string[]
  rows: Array<(string | number | null)[]>
  /** Optional footer row (totals) */
  footer?: (string | number | null)[]
}

/** One tab within a tabbed metric card */
export interface ISQFTabData {
  label: string
  chartData?: ISQFChartData
  tableData?: ISQFTableData
  infoNumbers?: ISQFInfoNumber[]
}

/** Error payload from the backend (mapped from Angular's error handling) */
export interface ISQFCardError {
  cutOffTime?: string | null
  generic?: boolean
  level?: boolean
  wmd?: boolean
  support_email?: string
}

/** Core metric card shape — returned by /sqf/summaryCards and /sqf/detailCard */
export interface ISQFMetricCard {
  cardName: string
  cardType: 'summary' | 'details'
  cardTitle?: string
  cardHeader?: string
  reportingPeriod?: string
  seq?: number
  location?: string
  infoNumbers?: ISQFInfoNumber[]
  chartData?: ISQFChartData
  tableData?: ISQFTableData
  tabs?: ISQFTabData[]
  error?: ISQFCardError
  hidden?: boolean
  isDetailsPageAvailable?: boolean
  canDrillDown?: boolean
  childCode?: string
  jsId?: string
  // Tabbed/filtered card variant
  cards?: ISQFMetricCard[]
  filterKeys?: string[]
  dropdowns?: Array<{ key: string; data: Array<{ key: string; label: string }> }>
  // Computed at fetch time
  isGenericCardApi?: boolean
  apiType?: string
  tableOnly?: boolean
  sortByVal?: number
}

/** Config entry from getSQFMetricCardsStatus */
export interface IAvailableCardConfig {
  titleText?: string
  sequence: number
  summary?: boolean
  details?: boolean
  summary_start_level?: number
  summary_last_level?: number
  details_start_level?: number
  details_last_level?: number
  is_generic_api?: boolean
  hide_cfc?: boolean
  show_only_cfc?: boolean
}

/** Map of cardName → config, from getSQFMetricCardsStatus */
export type IAvailableMetricCards = Record<string, IAvailableCardConfig>

/** One entry from getDataLoadETA */
export interface IDataLoadETA {
  METRIC: string
  Expected_Time: string // "HH:MM:SS" UTC
}

/** Computed ETA map keyed by metric name */
export type ETAMap = Record<string, { time: Date; day?: string }>
```

- [ ] **Step 2.2: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for SQF module

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Global CSS Variables and Reset

**Files:**
- Create: `src/styles/globals.css`
- Modify: `src/main.tsx` (import globals)

- [ ] **Step 3.1: Replace `src/styles/globals.css` (or create if absent)**

```css
/* src/styles/globals.css */

:root {
  /* Brand */
  --color-primary: #0C482C;
  --color-primary-text: #ffffff;

  /* Metric card status colours */
  --color-positive: #219653;
  --color-negative: #EB5757;
  --color-amber: #EF9C48;
  --color-neutral: #E1E0E1;
  --color-blue: #3F69AE;

  /* Typography */
  --color-text: #333333;
  --color-text-secondary: #676d70;
  --font-family: Arial, Helvetica, sans-serif;

  /* Surfaces */
  --color-border: #d3d3d3;
  --color-bg: #fafafa;
  --color-surface: #ffffff;

  /* Chrome heights — used for page-content padding-top */
  --header-height: 60px;
  --page-bar-height: 48px;
  --filter-bar-height: 48px;
  --chrome-height: calc(var(--header-height) + var(--page-bar-height) + var(--filter-bar-height));

  /* Footer */
  --footer-height: 44px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  overflow-x: hidden;
}

/* ── Card grid — used by SummaryPage and DetailsPage ── */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}

/* Card widths at each breakpoint (from wireframe) */
.metric-card-slot {
  width: 100%;
  max-width: 503px;
}
@media (min-width: 768px)  { .metric-card-slot { max-width: 332px; } }
@media (min-width: 1024px) { .metric-card-slot { max-width: 440px; } }
@media (min-width: 1440px) { .metric-card-slot { max-width: 410px; } }
@media (min-width: 1920px) { .metric-card-slot { max-width: 392px; } }

/* Skeleton animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.skeleton-block {
  background: #e0e0e0;
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

- [ ] **Step 3.2: Import globals in `src/main.tsx`**

Open `src/main.tsx` and add the globals import at the top:

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3.3: Commit**

```bash
git add src/styles/ src/main.tsx
git commit -m "feat: add global CSS variables, reset, and card grid

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Formatter Utilities (TDD)

**Files:**
- Create: `src/utils/formatters.ts`
- Create: `src/utils/formatters.test.ts`

- [ ] **Step 4.1: Write failing tests**

```typescript
// src/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import {
  colorVal,
  beautify,
  beautifyUpwards,
  formatDate,
  getYesterdayDate,
  REPORTING_PERIODS,
} from './formatters'

describe('colorVal', () => {
  it('returns positive for values > 0', () => {
    expect(colorVal(5)).toBe('positive')
    expect(colorVal('3.14')).toBe('positive')
  })
  it('returns negative for values < 0', () => {
    expect(colorVal(-2)).toBe('negative')
    expect(colorVal('-0.5')).toBe('negative')
  })
  it('returns neutral for zero', () => {
    expect(colorVal(0)).toBe('neutral')
    expect(colorVal('0')).toBe('neutral')
  })
  it('returns neutral for NaN/empty', () => {
    expect(colorVal('')).toBe('neutral')
    expect(colorVal('abc')).toBe('neutral')
  })
  it('reverses logic when reversed=true', () => {
    expect(colorVal(5, true)).toBe('negative')
    expect(colorVal(-2, true)).toBe('positive')
  })
})

describe('beautify', () => {
  it('formats thousands with K', () => {
    expect(beautify(1000)).toBe('$1K')
    expect(beautify(1500)).toBe('$1.5K')
  })
  it('formats millions with M', () => {
    expect(beautify(1200000)).toBe('$1.2M')
  })
  it('formats negative values with - prefix', () => {
    expect(beautify(-5000)).toBe('-$5K')
  })
  it('omits dollar sign when appendDollar=false', () => {
    expect(beautify(1000, 1, false)).toBe('1K')
  })
  it('handles values < 1000', () => {
    expect(beautify(500)).toBe('$500')
  })
})

describe('beautifyUpwards', () => {
  it('returns 0 for falsy input', () => {
    expect(beautifyUpwards(0)).toBe(0)
    expect(beautifyUpwards('')).toBe(0)
  })
  it('formats thousands', () => {
    const result = String(beautifyUpwards(1500))
    expect(result).toContain('K')
  })
})

describe('formatDate', () => {
  it('formats a Date to yyyy-MM-dd', () => {
    const d = new Date(2026, 5, 16) // June 16 2026
    expect(formatDate(d)).toBe('2026-06-16')
  })
  it('pads month and day with zeros', () => {
    const d = new Date(2026, 0, 5) // Jan 5 2026
    expect(formatDate(d)).toBe('2026-01-05')
  })
})

describe('getYesterdayDate', () => {
  it('returns a Date that is before now', () => {
    const yesterday = getYesterdayDate()
    expect(yesterday.getTime()).toBeLessThan(Date.now())
  })
})

describe('REPORTING_PERIODS', () => {
  it('maps WTD to Week-to-date', () => {
    expect(REPORTING_PERIODS['WTD']).toBe('Week-to-date')
  })
  it('maps MTD to Month-to-date', () => {
    expect(REPORTING_PERIODS['MTD']).toBe('Month-to-date')
  })
})
```

- [ ] **Step 4.2: Run tests — expect failures**

```bash
npm run test -- --run src/utils/formatters.test.ts
```

Expected: Fails with "Cannot find module './formatters'"

- [ ] **Step 4.3: Implement `src/utils/formatters.ts`**

```typescript
// src/utils/formatters.ts

/** Maps API reporting period codes to display text (mirrors Angular SqfCardsService) */
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

/** CSS class name for a numeric value (mirrors Angular SqfCardsService.colorVal) */
export function colorVal(
  value: number | string,
  reversed = false
): 'positive' | 'negative' | 'neutral' {
  const parsed = parseFloat(String(value))
  if (isNaN(parsed) || parsed === 0) return 'neutral'
  if (reversed) return parsed > 0 ? 'negative' : 'positive'
  return parsed < 0 ? 'negative' : 'positive'
}

/** Formats large numbers with K/M/B/T suffixes and optional $ prefix */
export function beautify(
  n: number | string,
  decimal = 1,
  appendDollar = true
): string {
  const num = parseFloat(String(n))
  if (isNaN(num)) return String(n)
  const negative = num < 0
  const abs = Math.abs(num)
  let result: string
  if (abs < 1e3) {
    result = String(abs)
  } else if (abs < 1e6) {
    result = `${+(abs / 1e3).toFixed(decimal)}K`
  } else if (abs < 1e9) {
    result = `${+(abs / 1e6).toFixed(decimal)}M`
  } else if (abs < 1e12) {
    result = `${+(abs / 1e9).toFixed(decimal)}B`
  } else {
    result = `${+(abs / 1e12).toFixed(decimal)}T`
  }
  const prefix = appendDollar ? '$' : ''
  return negative ? `-${prefix}${result}` : `${prefix}${result}`
}

/** Formats numbers upward (no $ prefix, matches Angular SqfCardsService.beautifyUpwards) */
export function beautifyUpwards(value: number | string, decimal = 1): string | number {
  if (!value) return 0
  const val = parseFloat(parseFloat(String(value)).toFixed(2))
  const suffixes = ['', 'K', 'M', 'B', 'T']
  const suffixNum = Math.floor(('' + parseInt(String(val))).length / 3)
  let shortValue: any = parseFloat(
    (suffixNum !== 0 ? val / Math.pow(1000, suffixNum) : val).toPrecision(2)
  )
  if (shortValue % 1 !== 0) {
    shortValue = shortValue.toFixed(decimal)
  }
  return shortValue + suffixes[suffixNum]
}

/** Formats a Date to yyyy-MM-dd string */
export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Returns yesterday as a Date */
export function getYesterdayDate(): Date {
  return new Date(Date.now() - 86_400_000)
}

/** CSS colour variables keyed by colorVal result */
export const COLOR_CSS_VAR: Record<string, string> = {
  positive: 'var(--color-positive)',
  negative: 'var(--color-negative)',
  neutral:  'var(--color-neutral)',
  amber:    'var(--color-amber)',
}
```

- [ ] **Step 4.4: Run tests — expect all pass**

```bash
npm run test -- --run src/utils/formatters.test.ts
```

Expected: All tests pass (✓).

- [ ] **Step 4.5: Commit**

```bash
git add src/utils/formatters.ts src/utils/formatters.test.ts
git commit -m "feat: add formatter utilities with tests

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Tree Utilities (TDD)

**Files:**
- Create: `src/utils/tree.ts`
- Create: `src/utils/tree.test.ts`

The Angular app's `SqfFilterService` processes the raw API response (array of `ISQFGenericFilter`) into an `IQFTree`. These utilities replicate that logic as pure functions.

- [ ] **Step 5.1: Write failing tests**

```typescript
// src/utils/tree.test.ts
import { describe, it, expect } from 'vitest'
import type { ISQFGenericFilter, IQFTree } from '../types/sqf.types'
import {
  processFilterResponse,
  flattenTree,
  findNodeByCode,
  addParents,
  getFirstSelectableNode,
} from './tree'

const NATIONAL_RESPONSE: ISQFGenericFilter[] = [
  {
    name: 'National',
    code: 'National',
    level: 0,
    level_desc: 'National',
    children: [
      {
        name: 'NSW',
        code: 'NSW',
        level: 1,
        level_desc: 'State',
        children: [
          {
            name: 'Store 1234',
            code: '1234',
            level: 3,
            level_desc: 'Store',
            children: [],
          },
        ],
      },
    ],
  },
]

const MULTI_NODE_RESPONSE: ISQFGenericFilter[] = [
  { name: 'Retail', code: 'w_retail', level: 1, level_desc: 'Division', children: [] },
  { name: 'Metro', code: 'metro', level: 1, level_desc: 'Division', children: [] },
]

describe('processFilterResponse', () => {
  it('converts single-root response to a tree', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)
    expect(tree.code).toBe('National')
    expect(tree.children).toHaveLength(1)
    expect(tree.children![0].code).toBe('NSW')
  })

  it('wraps multi-root response in a hidden root node', () => {
    const tree = processFilterResponse(MULTI_NODE_RESPONSE)
    expect(tree.alwaysHidden).toBe(true)
    expect(tree.children).toHaveLength(2)
    expect(tree.children![0].code).toBe('w_retail')
  })
})

describe('flattenTree', () => {
  it('returns all non-hidden nodes in depth-first order', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)
    const flat = flattenTree(tree)
    const codes = flat.map(n => n.code)
    expect(codes).toContain('National')
    expect(codes).toContain('NSW')
    expect(codes).toContain('1234')
  })

  it('excludes hidden/alwaysHidden nodes', () => {
    const tree = processFilterResponse(MULTI_NODE_RESPONSE)
    const flat = flattenTree(tree)
    // root node is hidden, but its children are not
    expect(flat.some(n => n.alwaysHidden)).toBe(false)
  })
})

describe('findNodeByCode', () => {
  it('finds a node by code in a flat list', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)
    const flat = flattenTree(tree)
    const node = findNodeByCode(flat, '1234')
    expect(node).not.toBeNull()
    expect(node!.level_desc).toBe('Store')
  })

  it('returns null when code not found', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)
    const flat = flattenTree(tree)
    expect(findNodeByCode(flat, 'NOT_EXISTS')).toBeNull()
  })
})

describe('addParents', () => {
  it('sets parent references on children', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)
    addParents(tree)
    expect(tree.children![0].parent).toBe(tree)
    expect(tree.children![0].children![0].parent).toBe(tree.children![0])
  })
})

describe('getFirstSelectableNode', () => {
  it('returns the first non-hidden selectable node', () => {
    const tree = processFilterResponse(NATIONAL_RESPONSE)
    addParents(tree)
    const node = getFirstSelectableNode(flattenTree(tree))
    expect(node).not.toBeNull()
    expect(node!.code).toBe('National')
  })
})
```

- [ ] **Step 5.2: Run tests — expect failures**

```bash
npm run test -- --run src/utils/tree.test.ts
```

Expected: Fails with "Cannot find module './tree'"

- [ ] **Step 5.3: Implement `src/utils/tree.ts`**

```typescript
// src/utils/tree.ts
import type { ISQFGenericFilter, IQFTree } from '../types/sqf.types'

/**
 * Converts the raw API response from getUniversalFilterGeneric into an IQFTree.
 * Mirrors Angular SqfFilterService.convertToMultiNodeTree / convertToGenericTree.
 */
export function processFilterResponse(res: ISQFGenericFilter[]): IQFTree {
  if (res.length > 1) {
    return convertToMultiNodeTree(res)
  }
  return convertToSingleTree(res[0], 0)
}

function convertToSingleTree(req: ISQFGenericFilter, depth: number): IQFTree {
  const hasChildren = !!(req.children && req.children.length)
  const hasLeafChildren = !!req.leafChildren?.length
  const expandable = hasChildren || hasLeafChildren
  const isLastNode = !hasChildren

  return {
    name: isLastNode
      ? req.name ? `${req.name} - ${req.code}` : 'n/a'
      : req.name || 'n/a',
    code: req.code,
    level: String(req.level),
    level_desc: String(req.level_desc),
    apiDepth: Number(req.level) || depth,
    depth,
    children: (req.children || []).map(child => convertToSingleTree(child, depth + 1)),
    expandable,
    leafChildren: req.leafChildren || null,
    alwaysHidden: req.alwaysHidden,
  }
}

function convertToMultiNodeTree(reqs: ISQFGenericFilter[]): IQFTree {
  const children = reqs.map(req => convertToSingleTree(req, 1))
  return {
    name: 'n/a',
    code: '',
    level: 'root',
    level_desc: 'root',
    depth: 0,
    apiDepth: 0,
    children,
    expandable: true,
    alwaysHidden: true,
    hidden: true,
  }
}

/**
 * Recursively sets .parent on every child node.
 * Must be called after processFilterResponse.
 */
export function addParents(node: IQFTree, parent?: IQFTree): void {
  if (parent) node.parent = parent
  ;(node.children || []).forEach(child => addParents(child, node))
}

/**
 * Returns a flat array of all non-hidden, non-alwaysHidden nodes (depth-first).
 */
export function flattenTree(node: IQFTree): IQFTree[] {
  const result: IQFTree[] = []
  if (!node.alwaysHidden && !node.hidden) {
    result.push(node)
  }
  ;(node.children || []).forEach(child => {
    result.push(...flattenTree(child))
  })
  return result
}

/**
 * Finds a node by code in a flat array (from flattenTree).
 */
export function findNodeByCode(nodes: IQFTree[], code: string): IQFTree | null {
  return nodes.find(n => n.code === code) || null
}

/**
 * Returns the first selectable node from a flat list.
 * Prefers nodes with a non-empty code.
 */
export function getFirstSelectableNode(nodes: IQFTree[]): IQFTree | null {
  return nodes.find(n => n.code !== '' && !n.alwaysHidden && !n.hidden) || null
}
```

- [ ] **Step 5.4: Run tests — expect all pass**

```bash
npm run test -- --run src/utils/tree.test.ts
```

Expected: All tests pass (✓).

- [ ] **Step 5.5: Commit**

```bash
git add src/utils/tree.ts src/utils/tree.test.ts
git commit -m "feat: add tree processing utilities with tests

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: API Layer

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/sqf.ts`

- [ ] **Step 6.1: Create `src/api/client.ts`**

```typescript
// src/api/client.ts
import axios from 'axios'

/**
 * Axios instance with base URL from VITE_API_URL env var.
 * Dev: Vite proxy forwards /api → http://127.0.0.1:8080
 * Production: /api is served by the Python backend on the same origin.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send session cookie with every request
  timeout: 30_000,
})

export default client
```

- [ ] **Step 6.2: Create `src/api/sqf.ts`**

The URL construction for summary/detail cards mirrors Angular's SqfCardsService:
- `apiDepth === 0` (national) → `/sqf/summaryCards/0/{date}` (no code)
- `apiDepth > 0` → `/sqf/summaryCards/{apiDepth}/{date}/{code}`

```typescript
// src/api/sqf.ts
import client from './client'
import type {
  ISQFGenericFilter,
  ISQFMetricCard,
  IAvailableMetricCards,
  IDataLoadETA,
} from '../types/sqf.types'

/** Returns the hierarchy tree for the filter dropdown */
export async function getUniversalFilter(): Promise<ISQFGenericFilter[]> {
  const res = await client.get<ISQFGenericFilter[]>('/sqf/getUniversalFilterGeneric')
  return res.data
}

/** Returns ETA timestamps for each metric's data load */
export async function getDataLoadETA(): Promise<IDataLoadETA[]> {
  const res = await client.get<IDataLoadETA[]>('/sqf/getDataLoadETA')
  return res.data
}

/** Returns which cards are available and their configuration */
export async function getSQFCardStatus(): Promise<IAvailableMetricCards> {
  const res = await client.get<IAvailableMetricCards>('/sqf/getSQFMetricCardsStatus')
  return res.data
}

/**
 * Returns summary metric cards for the selected location and date.
 * @param apiDepth  0 = national (no code), >0 = regional/store (requires code)
 * @param date      "yyyy-MM-dd"
 * @param code      Location code (omit or undefined when apiDepth === 0)
 */
export async function getSummaryCards(
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/summaryCards/${apiDepth}/${date}/${code}`
    : `/sqf/summaryCards/0/${date}`
  const res = await client.get<ISQFMetricCard[]>(path)
  return res.data
}

/**
 * Returns detail cards for a specific metric type.
 * @param metric   Card name, e.g. "sales", "stockloss"
 * @param apiDepth 0 = national (no code), >0 = regional/store
 * @param date     "yyyy-MM-dd"
 * @param code     Location code (omit when apiDepth === 0)
 */
export async function getDetailCard(
  metric: string,
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/detailCard/${metric}/${apiDepth}/${date}/${code}`
    : `/sqf/detailCard/${metric}/0/${date}`
  const res = await client.get<ISQFMetricCard[]>(path)
  return res.data
}

/**
 * Returns the seasonal metric card.
 */
export async function getSeasonalMetric(
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/seasonalMetric/${apiDepth}/${date}/${code}`
    : `/sqf/seasonalMetric/0/${date}`
  const res = await client.get<ISQFMetricCard[]>(path)
  return res.data
}
```

- [ ] **Step 6.3: Commit**

```bash
git add src/api/
git commit -m "feat: add Axios API client and SQF endpoint functions

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Auth Context Stub

**Files:**
- Create: `src/context/AuthContext.tsx`

This is a Phase 1 stub. All users are considered authenticated so we can focus on the `/quick-facts` pages. Real OAuth auth is Phase 2.

- [ ] **Step 7.1: Create `src/context/AuthContext.tsx`**

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, ReactNode } from 'react'

interface AuthUser {
  name: string
  portal: string
}

interface AuthContextType {
  user: AuthUser
  isAuthenticated: boolean
}

// Phase 1 stub: hardcoded authenticated user.
// Replace with real OAuth/Firebase auth in Phase 2.
const STUB_USER: AuthUser = {
  name: 'Demo User',
  portal: 'WW', // Woolworths
}

const AuthContext = createContext<AuthContextType>({
  user: STUB_USER,
  isAuthenticated: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: STUB_USER, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

/** Route guard — in Phase 1 always renders children */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    // Phase 2: replace with <Navigate to="/login" />
    return <div>Please log in.</div>
  }
  return <>{children}</>
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: add auth context stub (Phase 1)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: FilterContext with URL Sync

**Files:**
- Create: `src/context/FilterContext.tsx`

This is the core state container. It holds the selected location node and date, syncs them to URL query params, and exposes the tree data loaded from the API.

- [ ] **Step 8.1: Create `src/context/FilterContext.tsx`**

```typescript
// src/context/FilterContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import type { IQFTree } from '../types/sqf.types'
import { formatDate, getYesterdayDate } from '../utils/formatters'
import { flattenTree, findNodeByCode, getFirstSelectableNode, addParents } from '../utils/tree'
import { processFilterResponse } from '../utils/tree'
import type { ISQFGenericFilter } from '../types/sqf.types'

interface FilterContextType {
  /** Flat list of all selectable nodes — used by the location dropdown */
  treeNodes: IQFTree[]
  /** Currently selected location node */
  selectedNode: IQFTree | null
  /** Currently selected date as "yyyy-MM-dd" */
  selectedDate: string
  /** True once the tree is loaded and a node is selected */
  isLoaded: boolean
  /** Called by useFilterTree once the raw API response arrives */
  initTree: (raw: ISQFGenericFilter[]) => void
  setSelectedNode: (node: IQFTree) => void
  setSelectedDate: (date: string) => void
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [treeNodes, setTreeNodes] = useState<IQFTree[]>([])
  const [selectedNode, setSelectedNodeState] = useState<IQFTree | null>(null)

  // Initialise date from URL ?date= param, defaulting to yesterday
  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    return searchParams.get('date') || formatDate(getYesterdayDate())
  })

  /**
   * Called once by useFilterTree when the raw filter response arrives.
   * Processes the tree, sets parent refs, and restores the node from ?code= param.
   */
  const initTree = useCallback(
    (raw: ISQFGenericFilter[]) => {
      const tree = processFilterResponse(raw)
      addParents(tree)
      const flat = flattenTree(tree)
      setTreeNodes(flat)

      const code = searchParams.get('code')
      const restoredNode = code ? findNodeByCode(flat, code) : null
      const defaultNode = restoredNode || getFirstSelectableNode(flat)
      if (defaultNode) setSelectedNodeState(defaultNode)
    },
    // searchParams is stable for the lifetime of this context mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const setSelectedNode = useCallback(
    (node: IQFTree) => {
      setSelectedNodeState(node)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('code', node.code)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const setSelectedDate = useCallback(
    (date: string) => {
      setSelectedDateState(date)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('date', date)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const isLoaded = treeNodes.length > 0 && selectedNode !== null

  return (
    <FilterContext.Provider
      value={{
        treeNodes,
        selectedNode,
        selectedDate,
        isLoaded,
        initTree,
        setSelectedNode,
        setSelectedDate,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter(): FilterContextType {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilter must be used within a FilterProvider')
  return ctx
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/context/FilterContext.tsx
git commit -m "feat: add FilterContext with URL sync

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: React Query Hooks

**Files:**
- Create: `src/hooks/useFilterTree.ts`
- Create: `src/hooks/useCardStatus.ts`
- Create: `src/hooks/useSummaryCards.ts`
- Create: `src/hooks/useDetailsCard.ts`
- Create: `src/hooks/useSeasonalCard.ts`
- Create: `src/hooks/useDataLoadETA.ts`

- [ ] **Step 9.1: Create `src/hooks/useFilterTree.ts`**

```typescript
// src/hooks/useFilterTree.ts
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getUniversalFilter } from '../api/sqf'
import { useFilter } from '../context/FilterContext'

/**
 * Loads the location hierarchy tree from the backend (cached forever).
 * Calls initTree on FilterContext once data arrives.
 */
export function useFilterTree() {
  const { initTree } = useFilter()

  const query = useQuery({
    queryKey: ['sqf', 'filter-tree'],
    queryFn: getUniversalFilter,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  useEffect(() => {
    if (query.data) {
      initTree(query.data)
    }
  }, [query.data, initTree])

  return query
}
```

- [ ] **Step 9.2: Create `src/hooks/useCardStatus.ts`**

```typescript
// src/hooks/useCardStatus.ts
import { useQuery } from '@tanstack/react-query'
import { getSQFCardStatus } from '../api/sqf'

/**
 * Loads the available metric cards configuration (cached forever).
 * Used to know which cards to show and their ordering.
 */
export function useCardStatus() {
  return useQuery({
    queryKey: ['sqf', 'card-status'],
    queryFn: getSQFCardStatus,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
```

- [ ] **Step 9.3: Create `src/hooks/useSummaryCards.ts`**

```typescript
// src/hooks/useSummaryCards.ts
import { useQuery } from '@tanstack/react-query'
import { getSummaryCards } from '../api/sqf'
import { useFilter } from '../context/FilterContext'

/**
 * Fetches summary metric cards for the current filter selection.
 * Auto-refetches whenever selectedNode or selectedDate changes.
 */
export function useSummaryCards() {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    queryKey: ['sqf', 'summary-cards', selectedNode?.apiDepth, selectedNode?.code, selectedDate],
    queryFn: () =>
      getSummaryCards(
        selectedNode!.apiDepth,
        selectedDate,
        selectedNode!.code || undefined
      ),
    enabled: isLoaded,
    staleTime: 0,
  })
}
```

- [ ] **Step 9.4: Create `src/hooks/useDetailsCard.ts`**

```typescript
// src/hooks/useDetailsCard.ts
import { useQuery } from '@tanstack/react-query'
import { getDetailCard } from '../api/sqf'
import { useFilter } from '../context/FilterContext'

/**
 * Fetches detail cards for a specific metric type.
 * @param metric Card name from the URL param, e.g. "sales"
 */
export function useDetailsCard(metric: string | undefined) {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    queryKey: ['sqf', 'detail-card', metric, selectedNode?.apiDepth, selectedNode?.code, selectedDate],
    queryFn: () =>
      getDetailCard(
        metric!,
        selectedNode!.apiDepth,
        selectedDate,
        selectedNode!.code || undefined
      ),
    enabled: isLoaded && !!metric,
    staleTime: 0,
  })
}
```

- [ ] **Step 9.5: Create `src/hooks/useSeasonalCard.ts`**

```typescript
// src/hooks/useSeasonalCard.ts
import { useQuery } from '@tanstack/react-query'
import { getSeasonalMetric } from '../api/sqf'
import { useFilter } from '../context/FilterContext'

export function useSeasonalCard() {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    queryKey: ['sqf', 'seasonal', selectedNode?.apiDepth, selectedNode?.code, selectedDate],
    queryFn: () =>
      getSeasonalMetric(
        selectedNode!.apiDepth,
        selectedDate,
        selectedNode!.code || undefined
      ),
    enabled: isLoaded,
    staleTime: 0,
  })
}
```

- [ ] **Step 9.6: Create `src/hooks/useDataLoadETA.ts`**

```typescript
// src/hooks/useDataLoadETA.ts
import { useQuery } from '@tanstack/react-query'
import { getDataLoadETA } from '../api/sqf'
import type { ETAMap, IDataLoadETA } from '../types/sqf.types'

// Maps METRIC field from API to card name keys used in the app
const METRIC_KEY_MAP: Record<string, string> = {
  Sales: 'sales',
  Stockloss: 'stockloss',
  'Online-Sales': 'online',
  VOC: 'voc',
  WMD: 'wmd',
  Wages: 'wages',
  Event: 'seasonal',
  LSM: 'lsm',
  Availability: 'availability',
  StoreProcess: 'storeprocess',
  RT3: 'rt3',
}

function mapToETAMap(raw: IDataLoadETA[]): ETAMap {
  const eta: ETAMap = {}
  raw.forEach(entry => {
    const [hh, mm, ss] = entry.Expected_Time.split(':').map(Number)
    const now = new Date()
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let cutOff = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh, mm, ss)
    )
    const cutOffLocal = new Date(cutOff.getFullYear(), cutOff.getMonth(), cutOff.getDate())
    const dayDiff = Math.round(
      (cutOffLocal.getTime() - todayLocal.getTime()) / 86_400_000
    )
    if (dayDiff !== 0) cutOff = new Date(cutOff.getTime() - dayDiff * 86_400_000)
    const key = METRIC_KEY_MAP[entry.METRIC] || entry.METRIC
    eta[key] = { time: cutOff }
  })
  return eta
}

export function useDataLoadETA() {
  return useQuery({
    queryKey: ['sqf', 'data-load-eta'],
    queryFn: async () => {
      const raw = await getDataLoadETA()
      return mapToETAMap(raw)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })
}
```

- [ ] **Step 9.7: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React Query hooks for SQF data

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: Header Component

**Files:**
- Create: `src/components/layout/Header/Header.tsx`
- Create: `src/components/layout/Header/Header.module.css`

- [ ] **Step 10.1: Create `src/components/layout/Header/Header.tsx`**

```tsx
// src/components/layout/Header/Header.tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import styles from './Header.module.css'

export function Header() {
  const { user } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Logo placeholder — replace with actual logo in production */}
        <span className={styles.logo} aria-label="Store Insights">🍀</span>
        <nav className={styles.nav}>
          <NavLink
            to="/quick-facts"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            Quick Facts
          </NavLink>
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.user}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 10.2: Create `src/components/layout/Header/Header.module.css`**

```css
/* src/components/layout/Header/Header.module.css */
.header {
  height: var(--header-height);
  background: var(--color-primary);
  color: var(--color-primary-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 0 12px;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-size: 22px;
  margin-right: 4px;
}

.nav {
  display: flex;
}

.navItem {
  color: var(--color-primary-text);
  opacity: 0.6;
  text-decoration: none;
  font-size: 16px;
  padding: 2px 4px;
  margin: 0 8px;
  height: var(--header-height);
  display: inline-flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  transition: opacity 0.1s;
}

.navItemActive {
  opacity: 1;
  border-bottom-color: var(--color-primary-text);
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.userInfo {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.userName {
  font-size: 12px;
  font-weight: 700;
}
```

- [ ] **Step 10.3: Commit**

```bash
git add src/components/layout/Header/
git commit -m "feat: add Header component

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: PageBar Component

**Files:**
- Create: `src/components/layout/PageBar/PageBar.tsx`
- Create: `src/components/layout/PageBar/PageBar.module.css`

The PageBar shows tabs like "Quick Facts", "Weekly" etc. For Phase 1, only Summary and Details are active.

- [ ] **Step 11.1: Create `src/components/layout/PageBar/PageBar.tsx`**

```tsx
// src/components/layout/PageBar/PageBar.tsx
import { NavLink, useLocation } from 'react-router-dom'
import styles from './PageBar.module.css'

export function PageBar() {
  const location = useLocation()
  const isDetails = location.pathname.includes('/details/')

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <NavLink
          to="/quick-facts/summary"
          className={`${styles.item} ${!isDetails ? styles.itemActive : ''}`}
        >
          Quick Facts
        </NavLink>
        {isDetails && (
          <span className={`${styles.item} ${styles.itemActive}`}>
            Details
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 11.2: Create `src/components/layout/PageBar/PageBar.module.css`**

```css
/* src/components/layout/PageBar/PageBar.module.css */
.container {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  z-index: 950;
  background: var(--color-surface);
}

.bar {
  display: flex;
  width: 100%;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  /* Hide scrollbar on mobile */
  scrollbar-width: none;
}
.bar::-webkit-scrollbar { display: none; }

.item {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 16px;
  line-height: 1.5;
  flex: 0 0 auto;
  padding: 0 16px;
  height: var(--page-bar-height);
  display: flex;
  align-items: center;
  border-bottom: 4px solid transparent;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.1s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: var(--font-family);
}

.itemActive {
  opacity: 1;
  border-bottom-color: var(--color-primary);
}
```

- [ ] **Step 11.3: Commit**

```bash
git add src/components/layout/PageBar/
git commit -m "feat: add PageBar component

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 12: FilterBar Component

**Files:**
- Create: `src/components/layout/FilterBar/FilterBar.tsx`
- Create: `src/components/layout/FilterBar/FilterBar.module.css`

The FilterBar shows the location dropdown (hierarchy tree) and a date picker. The location selector is a custom dropdown showing flat tree nodes with indentation.

- [ ] **Step 12.1: Create `src/components/layout/FilterBar/FilterBar.tsx`**

```tsx
// src/components/layout/FilterBar/FilterBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useFilter } from '../../../context/FilterContext'
import { useFilterTree } from '../../../hooks/useFilterTree'
import { formatDate, getYesterdayDate } from '../../../utils/formatters'
import type { IQFTree } from '../../../types/sqf.types'
import styles from './FilterBar.module.css'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function FilterBar() {
  useFilterTree() // loads tree and calls initTree on FilterContext

  const { treeNodes, selectedNode, selectedDate, isLoaded, setSelectedNode, setSelectedDate } =
    useFilter()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const yesterday = getYesterdayDate()
  const minDate = formatDate(new Date(Date.now() - THIRTY_DAYS_MS))
  const maxDate = formatDate(yesterday)

  function handleNodeSelect(node: IQFTree) {
    setSelectedNode(node)
    setDropdownOpen(false)
  }

  return (
    <div className={styles.filterBar}>
      {/* Location selector */}
      <div className={styles.left}>
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={styles.dropdownTrigger}
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span className={styles.locationIcon}>📍</span>
            <span className={styles.locationText}>
              {selectedNode ? selectedNode.name : 'Loading...'}
            </span>
            <span className={styles.caret}>{dropdownOpen ? '▴' : '▾'}</span>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu} role="listbox">
              {treeNodes.map(node => (
                <button
                  key={`${node.code}-${node.depth}`}
                  className={`${styles.dropdownItem} ${
                    node.code === selectedNode?.code ? styles.dropdownItemSelected : ''
                  }`}
                  style={{ paddingLeft: `${8 + node.depth * 12}px` }}
                  role="option"
                  aria-selected={node.code === selectedNode?.code}
                  onClick={() => handleNodeSelect(node)}
                >
                  {node.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date picker */}
        <div className={styles.datePicker}>
          <span className={styles.dateIcon}>📅</span>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={e => {
              if (e.target.value) setSelectedDate(e.target.value)
            }}
            disabled={!isLoaded}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.2: Create `src/components/layout/FilterBar/FilterBar.module.css`**

```css
/* src/components/layout/FilterBar/FilterBar.module.css */
.filterBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  min-height: var(--filter-bar-height);
  width: 100%;
  position: fixed;
  top: calc(var(--header-height) + var(--page-bar-height));
  left: 0;
  right: 0;
  z-index: 900;
}

.left {
  display: flex;
  align-items: center;
  height: 100%;
}

/* Location dropdown */
.dropdown {
  position: relative;
  height: 100%;
}

.dropdownTrigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: var(--filter-bar-height);
  border: none;
  border-right: 1px solid var(--color-border);
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  font-family: var(--font-family);
  white-space: nowrap;
}

.dropdownTrigger:hover {
  background: rgba(0, 0, 0, 0.04);
}

.locationIcon { font-size: 14px; }
.locationText { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.caret { font-size: 10px; margin-left: 4px; }

.dropdownMenu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  min-width: 240px;
  max-width: 360px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 1100;
}

.dropdownItem {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text);
  font-family: var(--font-family);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdownItem:hover { background: rgba(0, 0, 0, 0.04); }

.dropdownItemSelected {
  background: rgba(12, 72, 44, 0.08);
  font-weight: 600;
  color: var(--color-primary);
}

/* Date picker */
.datePicker {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: var(--filter-bar-height);
  border-right: 1px solid var(--color-border);
}

.dateIcon { font-size: 14px; }

.dateInput {
  border: none;
  background: none;
  font-size: 13px;
  color: var(--color-text);
  font-family: var(--font-family);
  cursor: pointer;
  outline: none;
}

.dateInput:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 12.3: Commit**

```bash
git add src/components/layout/FilterBar/
git commit -m "feat: add FilterBar with location dropdown and date picker

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 13: MetricCard — Skeleton and Error States (TDD)

**Files:**
- Create: `src/components/cards/MetricCard/MetricCardSkeleton.tsx`
- Create: `src/components/cards/MetricCard/MetricCardError.tsx`
- Create: `src/components/cards/MetricCard/MetricCard.test.tsx`

- [ ] **Step 13.1: Write failing tests for MetricCard rendering**

```tsx
// src/components/cards/MetricCard/MetricCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MetricCard } from './MetricCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

function renderCard(props: Parameters<typeof MetricCard>[0]) {
  return render(
    <MemoryRouter>
      <MetricCard {...props} />
    </MemoryRouter>
  )
}

describe('MetricCard', () => {
  it('renders skeleton when isLoading=true', () => {
    renderCard({ isLoading: true })
    expect(document.querySelector('[data-testid="metric-card-skeleton"]')).not.toBeNull()
  })

  it('renders nothing when card.hidden=true', () => {
    const card: ISQFMetricCard = { cardName: 'sales', cardType: 'summary', hidden: true }
    const { container } = renderCard({ card })
    expect(container.firstChild).toBeNull()
  })

  it('renders error when card.error is set', () => {
    const card: ISQFMetricCard = {
      cardName: 'sales',
      cardType: 'summary',
      cardTitle: 'Sales',
      error: { generic: true, support_email: 'support@example.com' },
    }
    renderCard({ card })
    expect(screen.getByTestId('metric-card-error')).toBeDefined()
  })

  it('renders card title when card is valid', () => {
    const card: ISQFMetricCard = {
      cardName: 'sales',
      cardType: 'summary',
      cardTitle: 'Sales',
      cardHeader: 'Sales',
      infoNumbers: [{ val: '$1.2M', label: 'WTD', color: 'positive' }],
    }
    renderCard({ card })
    expect(screen.getByText('Sales')).toBeDefined()
  })

  it('renders error with cut-off time message', () => {
    const card: ISQFMetricCard = {
      cardName: 'sales',
      cardType: 'summary',
      cardTitle: 'Sales',
      error: { cutOffTime: '9:00 AM' },
    }
    renderCard({ card })
    expect(screen.getByText(/9:00 AM/)).toBeDefined()
  })
})
```

- [ ] **Step 13.2: Run tests — expect failures**

```bash
npm run test -- --run src/components/cards/MetricCard/MetricCard.test.tsx
```

Expected: Fails with "Cannot find module './MetricCard'"

- [ ] **Step 13.3: Create `src/components/cards/MetricCard/MetricCardSkeleton.tsx`**

```tsx
// src/components/cards/MetricCard/MetricCardSkeleton.tsx
import styles from './MetricCard.module.css'

export function MetricCardSkeleton() {
  return (
    <div
      className={`${styles.card} ${styles.skeleton}`}
      data-testid="metric-card-skeleton"
      aria-label="Loading metric card"
    >
      <div className={`skeleton-block ${styles.skeletonBar}`} />
      <div className={styles.skeletonContent}>
        <div className={`skeleton-block ${styles.skeletonTitle}`} />
        <div className={`skeleton-block ${styles.skeletonSubtitle}`} />
        <div className={`skeleton-block ${styles.skeletonKpi}`} />
        <div className={`skeleton-block ${styles.skeletonChart}`} />
      </div>
    </div>
  )
}
```

- [ ] **Step 13.4: Create `src/components/cards/MetricCard/MetricCardError.tsx`**

```tsx
// src/components/cards/MetricCard/MetricCardError.tsx
import type { ISQFCardError } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

interface Props {
  error: ISQFCardError
  cardTitle?: string
}

export function MetricCardError({ error, cardTitle }: Props) {
  return (
    <div className={styles.errorCard} data-testid="metric-card-error">
      <div className={styles.errorTitle}>{cardTitle || 'Data unavailable'}</div>

      {error.cutOffTime ? (
        <div className={styles.errorMsg}>
          <p>Data is being loaded and will be available by:</p>
          <strong>{error.cutOffTime}</strong>
        </div>
      ) : error.wmd ? (
        <div className={styles.errorMsg}>
          <p>Wasted Markdown data is currently unavailable.</p>
        </div>
      ) : (
        <div className={styles.errorMsg}>
          <p>Data is currently unavailable for this selection.</p>
          {error.support_email && (
            <p>
              Contact{' '}
              <a href={`mailto:${error.support_email}`}>{error.support_email}</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 13.5: Create `src/components/cards/MetricCard/MetricCard.module.css`**

```css
/* src/components/cards/MetricCard/MetricCard.module.css */

/* ── Base card ── */
.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ── Skeleton ── */
.skeleton { min-height: 380px; }
.skeletonBar { height: 4px; margin-bottom: 0; border-radius: 0; }
.skeletonContent { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.skeletonTitle { height: 22px; width: 60%; }
.skeletonSubtitle { height: 14px; width: 40%; }
.skeletonKpi { height: 32px; width: 50%; }
.skeletonChart { height: 146px; flex: 1; }

/* ── Error card ── */
.errorCard {
  width: 100%;
  min-height: 200px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.errorTitle { font-size: 18px; font-weight: 700; color: var(--color-text); }
.errorMsg { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
.errorMsg a { color: var(--color-blue); }

/* ── Header ── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-top: 4px solid var(--color-neutral);
  padding: 10px 12px 0;
}
.header.positive { border-top-color: var(--color-positive); }
.header.negative { border-top-color: var(--color-negative); }
.header.amber    { border-top-color: var(--color-amber);    }
.header.neutral  { border-top-color: var(--color-neutral);  }

.cardTitle  { font-size: 18px; font-weight: 700; color: var(--color-text); }
.subTitle   { display: flex; gap: 16px; color: var(--color-text-secondary); font-size: 12px; margin-top: 4px; flex-wrap: wrap; }

/* ── KPI row ── */
.kpiRow { display: flex; align-items: stretch; padding: 4px 12px 8px; }
.kpiCol { display: flex; flex-direction: column; padding-right: 14px; }
.kpiCol:not(:first-child) { padding-left: 14px; }
.kpiValue { font-size: 20px; font-weight: 700; line-height: 1.1; color: var(--color-text); }
.kpiValue.positive { color: var(--color-positive); }
.kpiValue.negative { color: var(--color-negative); }
.kpiLabel { font-size: 12px; color: var(--color-text); margin-top: 3px; white-space: nowrap; }
.kpiDivider { width: 1px; background: #e0e0e0; margin: 2px 0; flex-shrink: 0; }

/* ── Chart ── */
.chartArea { padding: 0 12px; margin: 8px 0; flex: 1; }

/* ── Table ── */
.tableArea { padding: 0 12px 8px; overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: 13px; }
.table th { text-align: left; padding: 6px 8px; font-weight: 600; border-bottom: 2px solid var(--color-border); color: var(--color-text); }
.table td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; color: var(--color-text); }
.table tr:last-child td { border-bottom: none; }
.expandToggle { color: var(--color-blue); cursor: pointer; font-size: 12px; padding: 4px 12px; background: none; border: none; font-family: var(--font-family); }

/* ── Tabs ── */
.tabs { display: flex; border-bottom: 1px solid var(--color-border); margin: 0 12px; }
.tab { padding: 6px 12px; font-size: 13px; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; color: var(--color-text-secondary); font-family: var(--font-family); }
.tabActive { border-bottom-color: var(--color-primary); color: var(--color-primary); font-weight: 600; }

/* ── Footer ── */
.footer { margin-top: auto; }
.footerLinks { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
.detailsLink { color: var(--color-blue); cursor: pointer; font-size: 14px; text-decoration: none; }
.footerMeta { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; min-height: 36px; }
.updateDate { font-size: 12px; color: var(--color-text-secondary); display: flex; gap: 4px; align-items: center; }
```

- [ ] **Step 13.6: Create `src/components/cards/MetricCard/MetricCard.tsx` (stub — enough to pass tests)**

```tsx
// src/components/cards/MetricCard/MetricCard.tsx
import type { ISQFMetricCard } from '../../../types/sqf.types'
import { MetricCardSkeleton } from './MetricCardSkeleton'
import { MetricCardError } from './MetricCardError'
import { MetricCardHeader } from './MetricCardHeader'
import { MetricCardKpiRow } from './MetricCardKpiRow'
import { MetricCardChart } from './MetricCardChart'
import { MetricCardTable } from './MetricCardTable'
import { MetricCardTabs } from './MetricCardTabs'
import { MetricCardFooter } from './MetricCardFooter'
import styles from './MetricCard.module.css'

interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
}

export function MetricCard({ card, isLoading }: Props) {
  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null
  if (card.error) return <MetricCardError error={card.error} cardTitle={card.cardTitle} />

  return (
    <div className={styles.card} id={card.jsId}>
      <MetricCardHeader card={card} />
      <MetricCardKpiRow infoNumbers={card.infoNumbers} />
      {card.tabs ? (
        <MetricCardTabs tabs={card.tabs} />
      ) : card.chartData ? (
        <MetricCardChart chartData={card.chartData} />
      ) : null}
      {card.tableData && <MetricCardTable tableData={card.tableData} />}
      <MetricCardFooter card={card} />
    </div>
  )
}
```

Create stub sub-components so the import chain resolves:

```tsx
// src/components/cards/MetricCard/MetricCardHeader.tsx
import type { ISQFMetricCard } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'
export function MetricCardHeader({ card }: { card: ISQFMetricCard }) {
  const color = card.infoNumbers?.[0]?.color || 'neutral'
  return (
    <div className={`${styles.header} ${styles[color]}`}>
      <div>
        <div className={styles.cardTitle}>{card.cardTitle || card.cardHeader}</div>
        <div className={styles.subTitle}>
          {card.location && <span>{card.location}</span>}
          {card.reportingPeriod && <span>{card.reportingPeriod}</span>}
        </div>
      </div>
    </div>
  )
}
```

```tsx
// src/components/cards/MetricCard/MetricCardKpiRow.tsx
import { Fragment } from 'react'
import type { ISQFInfoNumber } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'
export function MetricCardKpiRow({ infoNumbers }: { infoNumbers?: ISQFInfoNumber[] }) {
  if (!infoNumbers?.length) return null
  return (
    <div className={styles.kpiRow}>
      {infoNumbers.map((kpi, i) => (
        <Fragment key={i}>
          {i > 0 && <div className={styles.kpiDivider} />}
          <div className={styles.kpiCol}>
            <div className={`${styles.kpiValue} ${styles[kpi.color || 'neutral']}`}>{kpi.val}</div>
            <div className={styles.kpiLabel}>{kpi.label}</div>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
```

```tsx
// src/components/cards/MetricCard/MetricCardChart.tsx
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import type { ISQFChartData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function MetricCardChart({ chartData }: { chartData: ISQFChartData }) {
  return (
    <div className={styles.chartArea}>
      <Bar
        data={chartData as any}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, datalabels: { display: false } as any },
          scales: { x: { grid: { display: false } }, y: { display: false } },
        }}
        height={146}
      />
    </div>
  )
}
```

```tsx
// src/components/cards/MetricCard/MetricCardTable.tsx
import { useState } from 'react'
import type { ISQFTableData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

const DEFAULT_ROWS = 5

export function MetricCardTable({ tableData }: { tableData: ISQFTableData }) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? tableData.rows : tableData.rows.slice(0, DEFAULT_ROWS)
  return (
    <div className={styles.tableArea}>
      <table className={styles.table}>
        <thead>
          <tr>{tableData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell ?? '—'}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {tableData.rows.length > DEFAULT_ROWS && (
        <button className={styles.expandToggle} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less ▴' : `Show all ${tableData.rows.length} ▾`}
        </button>
      )}
    </div>
  )
}
```

```tsx
// src/components/cards/MetricCard/MetricCardTabs.tsx
import { useState } from 'react'
import type { ISQFTabData } from '../../../types/sqf.types'
import { MetricCardChart } from './MetricCardChart'
import { MetricCardTable } from './MetricCardTable'
import styles from './MetricCard.module.css'

export function MetricCardTabs({ tabs }: { tabs: ISQFTabData[] }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = tabs[activeIdx]
  return (
    <>
      <div className={styles.tabs}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            className={`${styles.tab} ${i === activeIdx ? styles.tabActive : ''}`}
            onClick={() => setActiveIdx(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active.chartData && <MetricCardChart chartData={active.chartData} />}
      {active.tableData && <MetricCardTable tableData={active.tableData} />}
    </>
  )
}
```

```tsx
// src/components/cards/MetricCard/MetricCardFooter.tsx
import { Link } from 'react-router-dom'
import type { ISQFMetricCard } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

export function MetricCardFooter({ card }: { card: ISQFMetricCard }) {
  return (
    <div className={styles.footer}>
      {card.isDetailsPageAvailable && (
        <div className={styles.footerLinks}>
          <Link
            to={`/quick-facts/details/${card.cardName}`}
            className={styles.detailsLink}
          >
            See details →
          </Link>
        </div>
      )}
      <div className={styles.footerMeta}>
        <span className={styles.updateDate}>
          {card.reportingPeriod || ''}
        </span>
      </div>
    </div>
  )
}
```

```typescript
// src/components/cards/MetricCard/index.ts
export { MetricCard } from './MetricCard'
export { MetricCardSkeleton } from './MetricCardSkeleton'
export { MetricCardError } from './MetricCardError'
```

- [ ] **Step 13.7: Run tests — expect all pass**

```bash
npm run test -- --run src/components/cards/MetricCard/MetricCard.test.tsx
```

Expected: All 5 tests pass (✓).

- [ ] **Step 13.8: Commit**

```bash
git add src/components/cards/MetricCard/
git commit -m "feat: add MetricCard component with all sub-components

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 14: SummaryPage

**Files:**
- Create: `src/pages/quick-facts/SummaryPage.tsx`
- Create: `src/pages/quick-facts/SummaryPage.module.css`

- [ ] **Step 14.1: Create `src/pages/quick-facts/SummaryPage.tsx`**

```tsx
// src/pages/quick-facts/SummaryPage.tsx
import { useSummaryCards } from '../../hooks/useSummaryCards'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useFilter } from '../../context/FilterContext'
import { MetricCard } from '../../components/cards/MetricCard'
import type { ISQFMetricCard } from '../../types/sqf.types'
import styles from './SummaryPage.module.css'

export function SummaryPage() {
  const { isLoaded, selectedNode } = useFilter()
  const cardStatusQuery = useCardStatus()
  const summaryQuery = useSummaryCards()

  const isLoading = !isLoaded || summaryQuery.isLoading || cardStatusQuery.isLoading
  const cardStatus = cardStatusQuery.data || {}
  const cards: ISQFMetricCard[] = summaryQuery.data || []

  // Sort by sequence number from card status config, then by card.seq
  const sortedCards = [...cards]
    .filter(c => !c.hidden)
    .sort((a, b) => {
      const seqA = a.seq ?? (cardStatus[a.cardName]?.sequence ?? 999)
      const seqB = b.seq ?? (cardStatus[b.cardName]?.sequence ?? 999)
      return seqA - seqB
    })

  // Show skeleton cards while loading (show 6 placeholders)
  const SKELETON_COUNT = 6

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <span className={styles.pageTitleLabel}>Quick Facts</span>
        {selectedNode && (
          <>
            <span className={styles.pageTitleDot}>·</span>
            <span className={styles.pageTitleSub}>{selectedNode.name}</span>
          </>
        )}
      </div>

      {summaryQuery.isError && (
        <div className={styles.errorBanner}>
          Failed to load metrics. Please try again.
        </div>
      )}

      <div className="card-grid">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="metric-card-slot">
                <MetricCard isLoading />
              </div>
            ))
          : sortedCards.map(card => (
              <div key={card.cardName} className="metric-card-slot">
                <MetricCard card={card} />
              </div>
            ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 14.2: Create `src/pages/quick-facts/SummaryPage.module.css`**

```css
/* src/pages/quick-facts/SummaryPage.module.css */
.page {
  padding-top: 24px;
  padding-bottom: calc(var(--footer-height) + 24px);
}

.pageTitle {
  display: flex;
  align-items: baseline;
  gap: 0;
  flex-wrap: wrap;
  margin-left: auto;
  margin-right: auto;
  padding: 12px 24px 20px;
  max-width: 1640px;
}

.pageTitleLabel {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.pageTitleDot {
  margin: 0 6px;
  color: #b0b7bb;
  font-size: 14px;
}

.pageTitleSub {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.errorBanner {
  margin: 0 24px 16px;
  padding: 12px 16px;
  background: #fff3f3;
  border: 1px solid var(--color-negative);
  border-radius: 4px;
  color: var(--color-negative);
  font-size: 14px;
}
```

- [ ] **Step 14.3: Commit**

```bash
git add src/pages/quick-facts/SummaryPage.tsx src/pages/quick-facts/SummaryPage.module.css
git commit -m "feat: add SummaryPage with metric card grid

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 15: DetailsPage

**Files:**
- Create: `src/pages/quick-facts/DetailsPage.tsx`
- Create: `src/pages/quick-facts/DetailsPage.module.css`

- [ ] **Step 15.1: Create `src/pages/quick-facts/DetailsPage.tsx`**

```tsx
// src/pages/quick-facts/DetailsPage.tsx
import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useDetailsCard } from '../../hooks/useDetailsCard'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useFilter } from '../../context/FilterContext'
import { MetricCard } from '../../components/cards/MetricCard'
import type { ISQFMetricCard } from '../../types/sqf.types'
import styles from './DetailsPage.module.css'

type SortType = 'az' | 'za' | 'lowhigh' | 'highlow'

function sortCards(cards: ISQFMetricCard[], sortType: SortType): ISQFMetricCard[] {
  const sorted = [...cards]
  const SKIP = ['UNK', 'REGIONEX', 'CLOSED']
  const shouldSkip = (card: ISQFMetricCard) =>
    SKIP.some(k => (card.cardTitle || '').toUpperCase().includes(k))

  switch (sortType) {
    case 'az':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return (a.cardTitle || '').localeCompare(b.cardTitle || '', undefined, { numeric: true })
      })
    case 'za':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return (b.cardTitle || '').localeCompare(a.cardTitle || '', undefined, { numeric: true })
      })
    case 'lowhigh':
      return sorted.sort((a, b) => {
        const aVal = a.sortByVal ?? parseFloat(String(a.infoNumbers?.[0]?.val ?? 0))
        const bVal = b.sortByVal ?? parseFloat(String(b.infoNumbers?.[0]?.val ?? 0))
        return aVal - bVal
      })
    case 'highlow':
      return sorted.sort((a, b) => {
        const aVal = a.sortByVal ?? parseFloat(String(a.infoNumbers?.[0]?.val ?? 0))
        const bVal = b.sortByVal ?? parseFloat(String(b.infoNumbers?.[0]?.val ?? 0))
        return bVal - aVal
      })
  }
}

const SKELETON_COUNT = 9

export function DetailsPage() {
  const { type } = useParams<{ type: string }>()
  const { isLoaded, selectedNode } = useFilter()
  const cardStatusQuery = useCardStatus()
  const detailsQuery = useDetailsCard(type)
  const [sortType, setSortType] = useState<SortType>('az')

  // If card type doesn't exist in available cards, redirect to summary
  const cardStatus = cardStatusQuery.data
  if (cardStatus && type && !cardStatus[type]) {
    return <Navigate to="/quick-facts/summary" replace />
  }

  const isLoading = !isLoaded || detailsQuery.isLoading
  const raw: ISQFMetricCard[] = detailsQuery.data || []
  const cards = sortCards(raw.filter(c => !c.hidden), sortType)

  const cardConfig = cardStatus?.[type || '']
  const pageTitle = cardConfig?.titleText || type || ''

  // Build breadcrumb path from selected node
  const breadcrumbs: string[] = []
  let node = selectedNode
  while (node) {
    if (!node.hidden && !node.alwaysHidden) breadcrumbs.unshift(node.name)
    node = node.parent || null
  }

  return (
    <main className={styles.page}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className={styles.breadcrumb}>
              {i > 0 && <span className={styles.breadcrumbSep}> › </span>}
              {crumb}
            </span>
          ))}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>{pageTitle}</div>

        {/* Sort controls */}
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Sort:</span>
          {([
            ['az', 'A → Z'],
            ['za', 'Z → A'],
            ['lowhigh', 'Low → High'],
            ['highlow', 'High → Low'],
          ] as [SortType, string][]).map(([type, label]) => (
            <button
              key={type}
              className={`${styles.sortBtn} ${sortType === type ? styles.sortBtnActive : ''}`}
              onClick={() => setSortType(type)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {detailsQuery.isError && (
        <div className={styles.errorBanner}>
          Failed to load details. Please try again.
        </div>
      )}

      <div className="card-grid">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="metric-card-slot">
                <MetricCard isLoading />
              </div>
            ))
          : cards.map((card, i) => (
              <div key={card.cardName + i} className="metric-card-slot">
                <MetricCard card={card} />
              </div>
            ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 15.2: Create `src/pages/quick-facts/DetailsPage.module.css`**

```css
/* src/pages/quick-facts/DetailsPage.module.css */
.page {
  padding-top: 24px;
  padding-bottom: calc(var(--footer-height) + 24px);
}

.breadcrumbs {
  padding: 8px 24px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.breadcrumb { }
.breadcrumbSep { margin: 0 4px; color: var(--color-border); }

.pageHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 24px 20px;
}

.pageTitle {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  text-transform: capitalize;
}

.sortControls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.sortLabel { font-size: 13px; color: var(--color-text-secondary); }
.sortBtn {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  font-family: var(--font-family);
}
.sortBtn:hover { background: rgba(0,0,0,0.04); }
.sortBtnActive {
  background: var(--color-primary);
  color: var(--color-primary-text);
  border-color: var(--color-primary);
}

.errorBanner {
  margin: 0 24px 16px;
  padding: 12px 16px;
  background: #fff3f3;
  border: 1px solid var(--color-negative);
  border-radius: 4px;
  color: var(--color-negative);
  font-size: 14px;
}
```

- [ ] **Step 15.3: Commit**

```bash
git add src/pages/quick-facts/DetailsPage.tsx src/pages/quick-facts/DetailsPage.module.css
git commit -m "feat: add DetailsPage with sort controls and card grid

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 16: QuickFactsLayout and App Routing

**Files:**
- Create: `src/pages/quick-facts/QuickFactsLayout.tsx`
- Create: `src/pages/quick-facts/QuickFactsLayout.module.css`
- Modify: `src/App.tsx`

- [ ] **Step 16.1: Create `src/pages/quick-facts/QuickFactsLayout.tsx`**

```tsx
// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { Header } from '../../components/layout/Header/Header'
import { PageBar } from '../../components/layout/PageBar/PageBar'
import { FilterBar } from '../../components/layout/FilterBar/FilterBar'
import styles from './QuickFactsLayout.module.css'

export function QuickFactsLayout() {
  return (
    <FilterProvider>
      <Header />
      <PageBar />
      <FilterBar />
      <div className={styles.content}>
        <Outlet />
      </div>
      <footer className={styles.footer}>
        <span>Store Insights · Powered by Quick Facts</span>
      </footer>
    </FilterProvider>
  )
}
```

- [ ] **Step 16.2: Create `src/pages/quick-facts/QuickFactsLayout.module.css`**

```css
/* src/pages/quick-facts/QuickFactsLayout.module.css */
.content {
  padding-top: var(--chrome-height);
}

.footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  height: var(--footer-height);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #999;
  z-index: 100;
}
```

- [ ] **Step 16.3: Replace `src/App.tsx` with final routing**

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { QuickFactsLayout } from './pages/quick-facts/QuickFactsLayout'
import { SummaryPage } from './pages/quick-facts/SummaryPage'
import { DetailsPage } from './pages/quick-facts/DetailsPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/quick-facts"
          element={
            <ProtectedRoute>
              <QuickFactsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="summary" replace />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="details/:type" element={<DetailsPage />} />
        </Route>
        {/* Catch-all: redirect to quick-facts */}
        <Route path="*" element={<Navigate to="/quick-facts" replace />} />
      </Routes>
    </AuthProvider>
  )
}
```

- [ ] **Step 16.4: Verify the full app builds without errors**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors. Output in `dist/`.

- [ ] **Step 16.5: Start dev server and verify manually**

```bash
npm run dev
```

Open http://localhost:5173 in the browser. You should be redirected to `/quick-facts/summary`. The page will show loading skeletons (since the Python backend isn't running yet). No console errors.

- [ ] **Step 16.6: Run all tests**

```bash
npm run test -- --run
```

Expected: All tests pass.

- [ ] **Step 16.7: Commit**

```bash
git add src/pages/quick-facts/QuickFactsLayout.tsx src/pages/quick-facts/QuickFactsLayout.module.css src/App.tsx
git commit -m "feat: add QuickFactsLayout and App routing — Phase 1 complete

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 17: Integration Verification with Python Backend

**Files:** No new files — manual verification only.

- [ ] **Step 17.1: Start the Python backend**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights/store-insights/backend
# Follow the existing Python startup instructions for local dev
# Usually something like:
python main.py
# or
flask run --port 8080
```

Expected: Python backend running on http://127.0.0.1:8080

- [ ] **Step 17.2: Start the React dev server**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npm run dev
```

- [ ] **Step 17.3: Verify filter tree loads**

Open http://localhost:5173/quick-facts/summary. In browser DevTools → Network tab:
- `GET /api/sqf/getUniversalFilterGeneric` → 200
- `GET /api/sqf/getSQFMetricCardsStatus` → 200

The location dropdown in the FilterBar should populate with nodes.

- [ ] **Step 17.4: Verify summary cards load**

After filter tree loads and a node is selected:
- `GET /api/sqf/summaryCards/...` → 200
- Skeleton cards should replace with actual metric cards

- [ ] **Step 17.5: Verify filter change triggers refetch**

Select a different location from the dropdown. Network tab should show a new `summaryCards` request with the updated code.

- [ ] **Step 17.6: Verify Details navigation**

Click "See details →" on a card that has `isDetailsPageAvailable: true`. URL should change to `/quick-facts/details/<cardName>`. Network tab should show `GET /api/sqf/detailCard/<metric>/...`.

- [ ] **Step 17.7: Verify URL state persistence**

On the summary page, select a location and date. Copy the URL with `?code=xxx&date=yyyy-MM-dd`. Open that URL in a new tab. The same node and date should be selected (URL sync working).

- [ ] **Step 17.8: Final commit with verification note**

```bash
git tag v0.1.0-phase1
git push origin main --tags 2>/dev/null || echo "No remote configured — tag saved locally"
```

---

## Post-Implementation Checklist

After all tasks are complete, verify these Phase 1 requirements are met:

- [ ] `/quick-facts` redirects to `/quick-facts/summary`
- [ ] `/quick-facts/summary` shows skeleton cards while loading, then real cards
- [ ] `/quick-facts/details/:type` loads detail cards for the metric type
- [ ] Changing location in FilterBar triggers card refetch
- [ ] Changing date in FilterBar triggers card refetch
- [ ] URL params `?code=` and `?date=` persist filter state across page reloads
- [ ] `?code=xxx` in URL pre-selects the correct node on page load
- [ ] Invalid `:type` in details route redirects to summary
- [ ] `hidden: true` cards are not rendered
- [ ] Cards with `error` set show the error state (not a crash)
- [ ] `npm run build` produces a clean `dist/` folder with no errors
- [ ] `npm run test -- --run` passes all tests
- [ ] No hardcoded `localhost` URLs anywhere in `src/` (search: `grep -r "localhost" src/`)
- [ ] Responsive layout: at 768px wide shows 2 columns of cards
