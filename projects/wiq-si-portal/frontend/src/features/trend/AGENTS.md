# Weekly Facts / My Plan contributor context

Follow the [root guide](../../../AGENTS.md). Both metrics use one renderer;
do not fork it into separate Weekly/MyPlan implementations.

## Trace a change

| Concern | Read first |
|---|---|
| Viewport state, actions and lifecycle | `pages/TrendPage.tsx` |
| View/history/hierarchy matching | `utils/trendSelection.ts` |
| Column projection and grouping | `utils/tableTransform.ts`, `components/TrendTable.tsx` |
| Mobile draft/commit interaction | `components/TrendMobileFilters.tsx` |
| Dialogs/preferences | `components/TrendInfoDialog.tsx`, `components/SubscriptionDialog.tsx`, `components/subscription.ts` |
| Endpoint shapes and keys | `api/trend.ts`, `hooks/useTrendData.ts`, `types/wf.types.ts` |

The [traceability register](../../../docs/migration-traceability.md#weekly-facts-and-my-plan)
maps WF01-WF15 to current code/tests. Read the
[source assessment](../../../docs/weekly-facts-myplan-parity.md#source-discrepancies-requiring-characterization)
before changing a source quirk, and the
[feature guide](../../../docs/feature-guide.md#weekly-facts-and-my-plan)
for current implementation boundaries.

## Invariants

- Backend order, history keys and original column IDs are contracts. Page
  requests use metric/location, not SQF date/period/depth.
- Desktop/mobile state is separate. Mobile tabs are drafts until a committed
  date; equal-date preview does not commit. My Plan Half Year is card-level.
- Date and hierarchy resolvers are intentionally asymmetric; unmatched
  selections retain previous contents. Do not invent a universal first-table
  fallback.
- Retain server variance/expansion defaults and response/metric reset rules.
  Keep the existing child-toggle retention distinct from selection reset.
- JavaScript uses 767px; some style/header rules use 768px. Preserve both and
  test boundary transitions rather than standardizing without source evidence.
- Subscription save compares locations, not just view changes; real store
  defaults depend on missing identity wiring. Qualification remains open.
- Banner sanitization does not sanitize table/dialog/tooltip HTML globally.
  Preserve cleanup for action registration, resize listeners, focus and capture.

## Focused checks

```bash
npm test -- --run src/features/trend/utils/trendSelection.test.ts src/features/trend/utils/tableTransform.test.ts src/features/trend/components/TrendMobileFilters.test.tsx
npm test -- --run src/features/trend/pages/TrendPage.test.tsx src/features/trend/pages/TrendPage.actions.test.tsx src/features/trend/pages/TrendPage.banner.test.tsx
```

Use colocated dialog tests for dialogs and `api/trend.http.test.ts` for actual
multipart/path contracts. Finish code changes with `npm run check:code`.
Test presence and fixture-driven browser checks do not qualify any BU.
