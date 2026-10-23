# React Store Insights — Phase 1 Design Spec
# `/quick-facts` Pages

**Date:** 2026-06-16  
**Author:** GitHub Copilot (brainstorming session)  
**Status:** Approved  
**Scope:** Phase 1 — `/quick-facts` Summary and Details pages only

> **Historical specification:** This records the initial June scope and stack.
> The current implementation uses React 19/Router 7/Vite 8, and Weekly/My Plan
> core tables now exist. Full-app migration follows the committed Angular
> baseline, not the earlier wireframe-only scope. See the
> [current architecture](../../technical-architecture.md),
> [parity status](../../migration-status.md) and
> [October 14 roadmap](../plans/2026-10-14-angular-react-migration.md).

---

## 1. Project Overview

Create a new React application at `/Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node/` that is functionally equivalent to the Angular Store Insights app's `/quick-facts` section.

**Angular source:** `/Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights/store-insights/`  
**Python backend:** `http://127.0.0.1:8080` (dev) / same origin `/api` (production)  
**Target runtime:** Local dev + GCP (Cloud Run or App Engine)

The React app must:
- Use the same Python backend API endpoints as the Angular app (no backend changes)
- Match the wireframe designs from `wireframes/wiq-portal-desktop.html` and `wireframes/wiq-portal-mobile.html`
- Be production-ready with environment-based configuration, no hardcoded localhost URLs

---

## 2. Technology Stack

| Concern | Technology | Reason |
|---------|------------|--------|
| Framework | React 18 + TypeScript | Modern, production-ready |
| Build tool | Vite | Fast dev server, clean `dist/` output for GCP |
| Routing | React Router v6 | Industry standard, nested routes |
| Data fetching | TanStack React Query v5 | Caching, loading states, auto-refetch |
| Charts | Chart.js + react-chartjs-2 | Same library as Angular app |
| HTTP client | Axios | Consistent interceptors, env-based base URL |
| Styling | CSS Modules + CSS variables | Scoped, no runtime overhead, matches wireframe CSS |
| State | React Context | Filter state (node + date); no extra dependency needed |

---

## 3. Phase 1 Scope

### Routes Implemented

| React Route | Angular Equivalent | Component |
|-------------|-------------------|-----------|
| `/quick-facts` | `/quick-facts` | Redirect to `/quick-facts/summary` |
| `/quick-facts/summary` | `/quick-facts/summary` | `SummaryPage` |
| `/quick-facts/details/:type` | `/quick-facts/details/:type` | `DetailsPage` |

### Routes Deferred (Phase 2)

- `/quick-facts/quick-assist` → `QuickAssistPage`
- `/quick-facts/weekly` → `WeeklyFactsPage`
- `/quick-facts/myplan` → `MyPlanPage`

---

## 4. Folder Structure

```
ip-react-node/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance, base URL from VITE_API_URL
│   │   └── sqf.ts                 # All /sqf/* endpoint functions
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header/            # App header (dark green bar, nav, user)
│   │   │   ├── PageBar/           # Tab bar below header (Summary, Details, ...)
│   │   │   └── FilterBar/         # Location dropdown + date picker
│   │   ├── cards/
│   │   │   └── MetricCard/        # Core metric card (see Section 6)
│   │   ├── charts/
│   │   │   ├── BarChart.tsx       # Chart.js bar chart wrapper
│   │   │   └── PieChart.tsx       # Chart.js pie/doughnut chart wrapper
│   │   └── ui/
│   │       ├── Breadcrumbs.tsx
│   │       ├── Spinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── context/
│   │   ├── FilterContext.tsx      # selectedNode + selectedDate; syncs to URL
│   │   └── AuthContext.tsx        # Stub for Phase 1 (user always authenticated)
│   ├── hooks/
│   │   ├── useFilterTree.ts       # getUniversalFilterGeneric (cached indefinitely)
│   │   ├── useCardStatus.ts       # getSQFMetricCardsStatus (cached indefinitely)
│   │   ├── useSummaryCards.ts     # summaryCards/<level>/<date>/<code>
│   │   ├── useDetailsCard.ts      # detailCard/<metric>/<level>/<date>/<code>
│   │   ├── useSeasonalCard.ts     # seasonalMetric/<level>/<date>/<code>
│   │   └── useDataLoadETA.ts      # getDataLoadETA (cached 5 min)
│   ├── pages/
│   │   └── quick-facts/
│   │       ├── QuickFactsLayout.tsx   # Route shell: wraps FilterContext, renders layout
│   │       ├── SummaryPage.tsx        # /quick-facts/summary
│   │       └── DetailsPage.tsx        # /quick-facts/details/:type
│   ├── styles/
│   │   └── globals.css            # CSS variables, resets, card grid breakpoints
│   ├── utils/
│   │   └── formatters.ts          # colorVal, beautify, beautifyUpwards, decimalFormat
│   ├── App.tsx                    # Router root
│   └── main.tsx                   # Vite entry point
├── public/
├── .env.local                     # VITE_API_URL=/api (proxied by Vite to localhost:8080)
├── .env.production                # VITE_API_URL=/api (served by Python on same origin)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Architecture: Filter State

The Angular app's `SqfFilterService` manages:
1. The hierarchy tree (loaded once from `getUniversalFilterGeneric`)
2. The selected node (store/region/national)
3. The selected date
4. Broadcasts changes so all cards refetch

The React equivalent:

```
FilterContext
├── treeData: IQFTree | null          # loaded once, cached in context
├── selectedNode: IQFTree | null      # currently selected location
├── selectedDate: string              # "yyyy-MM-dd"
├── setSelectedNode(node): void       # updates context + URL ?code=
├── setSelectedDate(date): void       # updates context + URL ?date=
└── isLoaded: boolean                 # true once tree is loaded + node is set
```

**URL sync:** `code` and `date` query params are kept in sync with context state. On page load, context reads from URL params to restore state (deep-link support, matches Angular behavior).

**React Query integration:** All data hooks use `[selectedNode.apiDepth, selectedNode.code, selectedDate]` as query keys. When context updates, hooks auto-refetch. `staleTime: 0` ensures fresh data on every filter change.

---

## 6. MetricCard Component

The MetricCard is the primary display unit. The backend returns a polymorphic `ISQFMetricCard` shape.

### Sub-components

| Component | Purpose |
|-----------|---------|
| `MetricCard.tsx` | Root: guards for hidden/error/loading; picks variant |
| `MetricCardHeader.tsx` | Title, colour bar (green/red/amber/grey), sub-title, reporting period |
| `MetricCardKpiRow.tsx` | `infoNumbers[]` — large KPI values + labels with dividers |
| `MetricCardChart.tsx` | Chart.js bar or pie chart via react-chartjs-2 |
| `MetricCardTable.tsx` | `tableData` — expandable table with expand toggle |
| `MetricCardTabs.tsx` | `tabs[]` — tab switcher; each tab has own chart/table |
| `MetricCardFooter.tsx` | "See details" link, last-updated date, info tooltip icon |
| `MetricCardError.tsx` | Error states: cut-off ETA, no data, generic error + support email |
| `MetricCardSkeleton.tsx` | Pulse-animation placeholder during loading |

### Card rendering logic

```
if (card.hidden) → render nothing
if (card.error) → <MetricCardError error={card.error} />
if (loading) → <MetricCardSkeleton />
else:
  <MetricCardHeader />
  <MetricCardKpiRow />
  {card.tabs ? <MetricCardTabs /> : card.chartData ? <MetricCardChart /> : null}
  {card.tableData && <MetricCardTable />}
  <MetricCardFooter />
```

### Colour logic

The `colorVal(value, reversed)` utility mirrors the Angular service:
- `value > 0` → `"positive"` → green `#219653`
- `value < 0` → `"negative"` → red `#EB5757`
- `reversed=true` flips the mapping (e.g. stock loss where positive is bad)
- No data → grey `#E1E0E1`

### Responsive grid (CSS variables)

```css
:root { --card-cols: 1; --card-max-width: 503px; }
@media (min-width: 768px)  { --card-cols: 2; --card-max-width: 332px; }
@media (min-width: 1024px) { --card-cols: 2; --card-max-width: 440px; }
@media (min-width: 1440px) { --card-cols: 3; --card-max-width: 410px; }
@media (min-width: 1920px) { --card-cols: 4; --card-max-width: 392px; }

.card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
}
```

---

## 7. API Layer

### client.ts

```ts
import axios from 'axios';
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

`VITE_API_URL` is set per environment:
- **Dev:** `/api` (Vite proxies `/api` to `http://127.0.0.1:8080`)
- **Production:** `/api` (same origin, no CORS)

Both environments use `/api` as the value. The difference is that Vite's dev server handles the proxy in dev, while the production server routes `/api` directly to Flask.

### sqf.ts — API functions

| Function | Endpoint | Notes |
|----------|----------|-------|
| `getUniversalFilter()` | `GET /sqf/getUniversalFilterGeneric` | Returns hierarchy tree |
| `getDataLoadETA()` | `GET /sqf/getDataLoadETA` | Returns ETA per metric type |
| `getSQFCardStatus()` | `GET /sqf/getSQFMetricCardsStatus` | Available cards + config |
| `getSummaryCards(level, date, code?)` | `GET /sqf/summaryCards/{level}/{date}[/{code}]` | Summary card data |
| `getDetailCard(metric, level, date, code?)` | `GET /sqf/detailCard/{metric}/{level}/{date}[/{code}]` | Detail card data |
| `getSeasonalMetric(level, date, code?)` | `GET /sqf/seasonalMetric/{level}/{date}[/{code}]` | Seasonal card |

### Vite dev proxy

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://127.0.0.1:8080'
  }
}
```

This means `VITE_API_URL=/api` works in dev too (Vite proxies it). Both `.env.local` and `.env.production` can use `/api`.

---

## 8. Error Handling

| Error status | Backend response | React behaviour |
|---|---|---|
| `error-NoDataForThisLevel` | Card not applicable at this hierarchy level | `hidden: true` → card not rendered |
| `error-NoDataFound` | Data not yet loaded | Show cut-off ETA from `useDataLoadETA` |
| `error-NoDataFoundForSelection` | No data for this filter combo | Show "No data available" message |
| Network/server error | HTTP 4xx/5xx | React Query retries 3×; then shows error card with support email |
| Loading | In-flight request | `MetricCardSkeleton` for each expected card slot |
| Filter change | Node or date changes | React Query refetches; shows stale data during fetch (no blank flash) |

**Error Boundary:** A React `ErrorBoundary` wraps `QuickFactsLayout` to catch unexpected JS errors and show a friendly fallback.

---

## 9. SummaryPage

- Loads `getSQFCardStatus` (once) and `getSummaryCards` (per filter change)
- Renders a responsive grid of `MetricCard` components sorted by `card.seq`
- Hidden cards (`card.hidden`) are excluded from the grid
- Page title: "Daily · powered by Quick Facts" (matches Angular + wireframe)
- Loading state: shows skeleton cards in the grid before data arrives

---

## 10. DetailsPage

- Route param `:type` is the card metric name (e.g. `sales`, `stockloss`)
- Loads `getDetailCard(type, ...)` when filter changes
- Also loads summary cards (displayed in a compact sidebar column on desktop, per Angular layout)
- Breadcrumbs show the hierarchy path to the selected node
- Sort controls: A→Z / Z→A, Low→High / High→Low (matches Angular `SortTypes`)
- Cards are sorted in-memory (no re-fetch on sort)
- If `:type` is not in available cards list, redirect to `/quick-facts/summary`

---

## 11. Authentication (Phase 1 Stub)

`AuthContext` provides `{ user: mockUser, isAuthenticated: true }`. No login page. The React app assumes the Python backend has a valid session (cookies set by the existing auth flow).

In production Phase 1, the React app will be deployed alongside the existing Angular app. If a user is already authenticated with the Angular app, the same session cookie will be sent with API requests (`withCredentials: true`).

Auth guard: `<ProtectedRoute>` wrapper component checks `isAuthenticated`. If false (stub always returns true in Phase 1), redirects to a placeholder login page.

---

## 12. GCP Deployment

**Option A (recommended): Python serves React static files**
- `vite build` outputs to `dist/`
- Python's Flask backend serves `dist/index.html` for all non-`/api` routes (SPA fallback)
- One deployment, one service, no CORS

**Option B: Separate Cloud Run service**
- React app as static Cloud Run service
- Nginx serves `dist/`, proxies `/api` to the Python backend Cloud Run service
- Requires CORS configuration on the Python side

Phase 1 targets Option A (simpler, matches existing Angular deployment pattern using `app.yaml`/Cloud Build).

**Build steps:**
```bash
npm ci
npm run build        # → dist/
# dist/ is then served by Flask or included in the Docker image
```

---

## 13. Testing Strategy

Phase 1 focuses on getting a working, deployable app. Tests to add:

- **Unit tests** (Vitest): `colorVal`, `beautify`, `formatters.ts` utility functions
- **Component tests** (React Testing Library): `MetricCard` variants (loading, error, with chart, with table)
- **No E2E tests in Phase 1** (requires backend; defer to Phase 2)

---

## 14. What Is NOT in Scope (Phase 1)

- Quick Assist page (`/quick-facts/quick-assist`)
- Weekly Facts / My Plan pages (`/quick-facts/weekly`, `/quick-facts/myplan`)
- PDF export (`jsPDF + html2canvas`)
- Google OAuth / Firebase auth (stubbed)
- NPS survey integration
- Analytics event tracking (e.g. `sendQFDataToAnalytics`)
- Admin portal
- BQF / ACT / Price Simulator / Me at Woolies modules
- Push notifications / Firebase messaging
