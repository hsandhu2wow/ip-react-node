# Quick Facts: WTD/YDAY period + breakdown-axis filters (Angular parity)

Date: 2026-10-08
Source of truth: `dsa-buying-insights` (backend `store-insights/backend/sqf/metric_card_v2.py`, Angular `sqf-filter`, `sqf-cards.service.ts`, `sqf-filter.service.ts`), commits Aug–Oct 2026.

> **Historical design, reviewed 2026-10-14:** The feature landed in `c97525f`,
> but this document describes intent, not verified parity. Current hooks return
> raw responses (no query `select`); period fallback is derived without context/
> URL writeback; and the date picker remains rendered on Trend routes.
> Analytics exclusions apply only to that earlier slice. See the
> [current implementation](../../technical-architecture.md) and
> [full migration plan](../plans/2026-10-14-angular-react-migration.md).

## Problem

The backend `summaryCards` and `detailCard` endpoints now return period-keyed data
`{ WTD?: X, YDAY?: X }` instead of a card array, where `X` is either `ISQFMetricCard[]`
or `{ cards: ISQFMetricCard[], sortBy?: string }`. Only periods that have data are present
(so a single-period response is normal, e.g. for previous dates). The React app assumes an
array, and the uncommitted `Array.isArray(...) ? ... : []` guards turn the new shape into an
empty page. Angular also added a global breakdown axis (child level vs department) that
selects which entry of `card.cards[]` is shown, replacing per-card dropdowns.

## Out of scope

Google Analytics events (the React app has no analytics code). Quick Assist, Weekly Facts, MyPlan.

## Design

### 1. Data contract
- `src/types/sqf.types.ts`: add `Period = 'WTD' | 'YDAY'`, `ISQFPeriodResponse`, `BreakdownAxis`.
- `src/utils/periods.ts`: `normalizePeriods(raw)` returns `{ periods: Partial<Record<Period, ISQFMetricCard[]>>, sortBy: Partial<Record<Period, string>> }`.
  Accepts the object shape, either per-period value shape, and a legacy plain array (treated as `{ WTD: array }`).
  Ignores non-array/invalid period values.
- `src/api/sqf.ts`: `getSummaryCards` / `getDetailCard` return the raw period-keyed response typed as `ISQFPeriodResponse | ISQFMetricCard[]`; remove the `Array.isArray → []` guard.

### 2. Filter state (`FilterContext`)
- Add `selectedPeriod` (default `WTD`), `selectedBreakdownAxis` (default `childLevel`), `setSelectedPeriod`, `setSelectedBreakdownAxis`.
- Persist as `?period=` and `?axis=` (replace history entries), initialise from URL.
- The axis and period are NOT reset on node/date change. If the selected period is absent from the response, the hooks fall back to the first available period and update the context.

### 3. Hooks
- `useSummaryCards` / `useDetailsCard` keep their query keys (one fetch holds both periods; switching period is client-side, no refetch). They expose the normalized periods via `select`.
- New `usePeriodCards(query)`: returns `{ cards, availablePeriods, hasMultiplePeriods, sortBy }` for the active period.
- `useEnrichedSummaryCards` and `DetailsPage` use it. Error cards (`hasError`) remain in the list as in Angular.

### 4. Axis-based card resolution (`src/utils/breakdown.ts`)
Ported from Angular `resolveChildCardForAxis` / `isLegacyBreakdownCard`:
- childLevel axis ⇄ dropdown option key `hierarchy`; department axis ⇄ `department` | `proposition`.
- For each `filterKeys` dimension use the axis-matching option, otherwise the dropdown's first option; find `card.cards[]` entry whose `keys` match. Return null when unresolved.
- Cards whose dropdowns offer none of those keys are legacy: they keep their own per-card dropdown; all others render the resolved child card (previous display kept when null).

### 5. FilterBar UI
- Period dropdown ("Week to Date" / "Day") beside the date picker; hidden when `!hasMultiplePeriods` (default shown until data loads).
- Breakdown dropdown (`childLevelLabel` / "Departments"); hidden when `selectedNode.level_desc` is `Store` or `Department`.
- `childLevelLabel`: first child's `level_desc`, pluralized (`y→ies`, `s|x|z|ch|sh→es`, else `s`), default "Departments"; BIGW overrides Zone→Regions, Group→Areas, Department→Business.
- Period/breakdown/date controls hidden on pages that don't use them; the Details page uses the details period availability.

### 6. Misc
- `updatedTime` is now ISO UTC with `Z`; format with local timezone.

## Testing (vitest)
- `periods.test.ts`: object shape, `{cards,sortBy}` shape, legacy array, invalid values, single period.
- `breakdown.test.ts`: both axes, partial rollout (null), legacy detection, multi-dimension filterKeys.
- Label util tests incl. BIGW overrides and pluralization.
- FilterBar: toggle visibility rules; selection updates context/URL.
- Summary/Details pages: render active period cards, switching period changes cards without refetch, fallback when period missing.
