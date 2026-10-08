# Quick Facts Period/Breakdown Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the React Quick Facts app consume the new `{WTD, YDAY}` backend responses and add the Angular-parity Period and Breakdown-axis filters.

**Architecture:** Pure utils (`periods.ts`, `breakdown.ts`, `levelLabels.ts`) hold all logic; `FilterContext` stores `selectedPeriod`/`selectedBreakdownAxis` (URL-synced); hooks select the active period from one cached fetch; cards take an optional `axis` prop; `FilterBar` renders two new dropdowns.

**Tech Stack:** React, TypeScript, react-router, @tanstack/react-query, vitest + testing-library.

Spec: `docs/superpowers/specs/2026-10-08-quick-facts-period-breakdown-filters-design.md`

---

### Task 1: Types + `normalizePeriods`
**Files:** Modify `src/types/sqf.types.ts`; Create `src/utils/periods.ts`, `src/utils/periods.test.ts`
- [ ] Add to types: `Period`, `BreakdownAxis`, `ISQFPeriodResponse`.
- [ ] Write tests (object shape, `{cards,sortBy}` shape, legacy array, invalid values, single period, `resolveActivePeriod` fallback).
- [ ] Implement `normalizePeriods(raw)` and `resolveActivePeriod(selected, available)`.
- [ ] Run `npx vitest run src/utils/periods.test.ts`; commit.

### Task 2: Breakdown resolution + level labels
**Files:** Create `src/utils/breakdown.ts`, `src/utils/breakdown.test.ts`, `src/utils/levelLabels.ts`, `src/utils/levelLabels.test.ts`
- [ ] Tests then implement `resolveChildCardForAxis`, `isLegacyBreakdownCard`, `childLevelLabel(node, portal)`, `pluralize`.
- [ ] Run tests; commit.

### Task 3: API + hooks
**Files:** Modify `src/api/sqf.ts`, `src/hooks/useSummaryCards.ts`, `useDetailsCard.ts`, `useEnrichedSummaryCards.ts` (+ its test); Create `src/hooks/usePeriodCards.ts`, `usePeriodCards.test.ts`
- [ ] API returns raw `ISQFPeriodResponse | ISQFMetricCard[]` (drop the `Array.isArray → []` guard).
- [ ] `usePeriodCards(raw)`: memoised `normalizePeriods`, active period via `resolveActivePeriod`, returns `{ cards, availablePeriods, hasMultiplePeriods, activePeriod, sortBy }`. No effects (keeps the hook unit-testable).
- [ ] `useEnrichedSummaryCards` and `DetailsPage` use it; error cards kept.
- [ ] Run hook tests; commit.

### Task 4: FilterContext state
**Files:** Modify `src/context/FilterContext.tsx`; Create `src/context/FilterContext.test.tsx`
- [ ] Add `selectedPeriod`, `selectedBreakdownAxis`, setters, URL params `period`/`axis` (init from URL, validated; not reset on node/date change).
- [ ] Test init-from-URL, setters, not reset on node change; commit.

### Task 5: Cards honour the axis
**Files:** Modify `SummaryCard.tsx`, `DetailsCard.tsx`, `SummaryPage.tsx`, `DetailsPage.tsx`; Create `src/hooks/useAxisCard.ts`; update card tests
- [ ] `useAxisCard(card, axis, fallback)` returns resolved child card (keeps last resolved when null); card hides per-card dropdowns when axis-driven (`axis` set and not legacy).
- [ ] Pages pass `axis={selectedBreakdownAxis}`; DetailsPage applies per-period `sortBy`.
- [ ] Tests: axis-driven card shows resolved card with no dropdown; legacy card keeps dropdown; no `axis` prop = old behaviour; commit.

### Task 6: FilterBar controls
**Files:** Modify `FilterBar.tsx`, `FilterBar.module.css`; Create `FilterBar.test.tsx`
- [ ] Period dropdown ("Week to Date"/"Day") hidden when `!hasMultiplePeriods`; Breakdown dropdown (`childLevelLabel`/"Departments") hidden for Store/Department; both only on summary/details routes.
- [ ] Tests for visibility and selection; commit.

### Task 7: Verify
- [ ] `npx vitest run` and `npx tsc -b --noEmit`; fix failures; final commit.
