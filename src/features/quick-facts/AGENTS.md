# Quick Facts contributor context

Follow the [root guide](../../../AGENTS.md); these are additional local
contracts, not replacement rules. Ownership covers summary/details and
generic, seasonal and profile cards, not the shared Weekly/MyPlan renderer.

## Trace a change

| Concern | Read first |
|---|---|
| Summary composition and config gates | `pages/SummaryPage.tsx`, `hooks/useEnrichedSummaryCards.ts` |
| Details, ordering and drill-down | `pages/DetailsPage.tsx`, `components/DetailsCard/DetailsCard.tsx` |
| Wire mapping | `api/sqf.ts`, `api/seasonal.ts`, `api/storeProfile.ts` |
| Period/breakdown projection | `hooks/usePeriodCards.ts`, `hooks/useAxisCard.ts`, `utils/periods.ts`, `utils/breakdown.ts` |
| Table/chart rendering | `components/MetricCard/MetricCardTable.tsx`, `components/MetricCard/MetricCardChart.tsx` |

Use the [feature guide](../../../docs/feature-guide.md#quick-facts-summary-and-details)
and [traceability register](../../../docs/migration-traceability.md#quick-facts-and-shared-foundation)
for cross-file evidence. Shared URL state is in `src/shared/context/FilterContext.tsx`;
shell composition belongs to `src/app`, not this feature.

## Invariants

- Period/axis changes project existing data; location/date/depth affect HTTP
  keys. Period fallback must not silently rewrite the requested URL.
- Generic mapping assigns non-error cards stable export IDs. Seasonal/profile
  adapters have different wire shapes and gates; do not merge them blindly.
- Preserve API card order until explicit sorting, including seasonal defaults
  and API metadata that affects sort-control display separately.
- Drill-down uses permitted hierarchy nodes/API depth. Portal branding and
  card availability branches do not establish actual identity or BU acceptance.
- Preserve table HTML/global classes, runtime themes, gauge callbacks, DOM IDs
  and capture selectors. CSS/canvas mocks do not prove visual parity.

## Focused checks

Run from the repository root; select only the relevant tests during iteration:

```bash
npm test -- --run src/features/quick-facts/hooks/sqfQueries.test.tsx src/features/quick-facts/hooks/usePeriodCards.test.ts src/features/quick-facts/utils/breakdown.test.ts
npm test -- --run src/features/quick-facts/pages/SummaryPage.test.tsx src/features/quick-facts/pages/DetailsPage.test.tsx
```

For table/chart changes, use the colocated `MetricCardTable.test.tsx` /
`MetricCardChart.test.tsx` plus appropriate browser/style checks. Finish code
changes with `npm run check:code`; update the register when evidence changes.
