# Quick Facts — Details Page & "Go to Details" Link Design

**Date:** 2026-07-16  
**Status:** Approved  
**Reference:** Angular implementation in `store-insights/src/app/sqf/`

---

## Problem

Two gaps exist in the React `ip-react-node` app compared to the Angular `store-insights` app:

1. **"Go to Details" link never shows on the Summary page.** `SummaryCard` renders the link only when `card.isDetailsPageAvailable` is `true`, but no React code ever sets this field. In the Angular app, `SqfCardsService.setupCommonProps()` computes it from `cardStatus` config + the selected node's `apiDepth`. The React equivalent is missing.

2. **Details page lacks the left sidebar.** The Angular details page (`sqf-details-home`) has a two-column layout: a left panel listing all available card types (clickable to switch) and a right panel with the selected card's detail cards. The React `DetailsPage.tsx` only has a flat full-width list.

---

## Solution

### 1. New hook: `useEnrichedSummaryCards`

**File:** `src/hooks/useEnrichedSummaryCards.ts`

Combines `useSummaryCards`, `useCardStatus`, and `useFilter`. After both queries resolve, maps each summary card to set:

```
card.isDetailsPageAvailable =
  cardStatus[card.cardName]?.details === true &&
  selectedNode.apiDepth <= (cardStatus[card.cardName]?.details_last_level ?? 99)
```

Returns the same query shape as `useSummaryCards` (`{ data, isLoading, isError }`), plus a `cardStatus` field for sequence/config access.

**Used by:** `SummaryPage` (replacing `useSummaryCards` + `useCardStatus`) and `DetailsPage` (for sidebar data).

---

### 2. `SummaryPage` update

**File:** `src/pages/quick-facts/SummaryPage.tsx`

Replace the two separate hook calls (`useSummaryCards` + `useCardStatus`) with `useEnrichedSummaryCards`. The rest of the component is unchanged — `SummaryCard` already has the "Go to details" link in its footer; it just needs `card.isDetailsPageAvailable` to be `true`.

---

### 3. New component: `CardSidebar`

**File:** `src/components/cards/CardSidebar/CardSidebar.tsx`  
**CSS:** `src/components/cards/CardSidebar/CardSidebar.module.css`

Props:
```ts
interface Props {
  cards: ISQFMetricCard[]      // enriched summary cards (isDetailsPageAvailable = true ones shown)
  selectedType: string         // current card type from URL :type param
}
```

Renders a narrow panel (~220px) with one mini-card per entry:
- Card title
- Status indicator (left border colour from `card.cardHeader`)
- First KPI value (`card.infoNumbers?.[0]?.displayValue`)
- `<Link to="/quick-facts/details/:cardName">` wraps each item
- Selected card highlighted with a solid primary-colour border
- Hidden on screens < 960px (`@media (max-width: 959px) { display: none }`)

Only cards where `card.isDetailsPageAvailable` is `true` are shown (matches Angular's available-cards list).

---

### 4. `DetailsPage` update

**File:** `src/pages/quick-facts/DetailsPage.tsx`  
**CSS:** `src/pages/quick-facts/DetailsPage.module.css`

**Layout changes:**
- Outer wrapper: `display: flex; gap: 24px; padding: 0 24px`
- Left: `<CardSidebar>` (renders enriched summary cards, highlights `type` param)
- Right: existing content (breadcrumbs → "Back to all cards" link → title + sort → detail cards)

**"Back to all cards" link:** Added above the page title in the right panel, linking to `/quick-facts/summary`.

**Data:** Imports `useEnrichedSummaryCards` for sidebar data. Retains `useDetailsCard(type)` for the main detail cards column.

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useEnrichedSummaryCards.ts` | **New** — enriches summary cards with `isDetailsPageAvailable` |
| `src/pages/quick-facts/SummaryPage.tsx` | **Update** — use `useEnrichedSummaryCards` instead of two separate hooks |
| `src/components/cards/CardSidebar/CardSidebar.tsx` | **New** — left sidebar listing all available card types |
| `src/components/cards/CardSidebar/CardSidebar.module.css` | **New** — sidebar styles, hidden < 960px |
| `src/pages/quick-facts/DetailsPage.tsx` | **Update** — two-column layout, add `CardSidebar` + "Back to all cards" link |
| `src/pages/quick-facts/DetailsPage.module.css` | **Update** — flex layout rules |

---

## Out of Scope

- Seasonal card sidebar entry (Angular shows seasonal as a card type — can be added later)
- `MetricCard` and `MetricCardFooter` components (older components, not used on the summary page)
- Mobile-specific back navigation (handled by existing `PageBar`)
