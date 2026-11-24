# Quick Facts Shell Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match Angular Quick Facts page-bar eligibility, route-specific alert selection, and optional title-widget presentation.

**Architecture:** Keep page-bar rules in the app layout, alert selection in `AlertList`, and widget payload/rendering in the Quick Facts feature. Reuse existing card-status, Summary-card, and Details-card requests.

**Tech Stack:** React 19, React Router, TanStack Query, TypeScript, Chart.js/react-chartjs-2, SCSS modules, Vitest, MSW.

---

### Task 1: Match Quick Facts page-bar rules

**Files:**
- Modify: `src/app/layout/useNavGroups.ts`
- Test: `src/app/layout/useNavGroups.test.tsx`
- Modify: `src/app/layout/QuickFactsPageBar/QuickFactsPageBar.tsx`
- Modify: `src/app/layout/QuickFactsPageBar/QuickFactsPageBar.module.scss`
- Test: `src/app/layout/QuickFactsPageBar/QuickFactsPageBar.test.tsx`

- [ ] **Step 1: Add failing page-bar rule tests**

Add cases proving that CFC Quick Assist is excluded from page-bar candidates even for SI/METRO, My Plan is not rendered as a mobile page-bar tab, the bar disappears with one remaining eligible item, and all query parameters survive tab navigation:

```tsx
it('preserves every query parameter when switching tabs', () => {
  renderPageBar('/quick-facts/summary?code=fixture-state&date=2026-10-19&axis=department')
  expect(screen.getByRole('link', { name: 'Weekly' })).toHaveAttribute(
    'href',
    '/quick-facts/quick-assist?code=fixture-state&date=2026-10-19&axis=department',
  )
})
```

Retain the existing New! and access tests; ensure the page-bar My Plan tag maps to `weekly_facts` independently of the desktop nav badge.

- [ ] **Step 2: Run the page-bar tests and confirm failure**

Run:

```bash
npm test -- --run src/app/layout/QuickFactsPageBar/QuickFactsPageBar.test.tsx src/app/layout/useNavGroups.test.tsx
```

Expected: FAIL on CFC Quick Assist, My Plan visibility, and full query preservation.

- [ ] **Step 3: Expose loaded CFC state to the page-bar**

Extend `NavGroupsResult` in `useNavGroups.ts` with `isCfc: boolean | undefined`, compute it once from the loaded CFC codes and user's area, and include it in the returned memoized value. Keep `buildNavGroups`' SI/METRO rail behavior unchanged.

- [ ] **Step 4: Apply page-bar-specific filtering**

In `QuickFactsPageBar.tsx`, filter out `trend` (My Plan) and CFC-ineligible `weekly`/Quick Assist items before checking the number of tabs. Build links with the complete `search` value from `useLocation`; derive My Plan's page-bar badge from the Angular `weekly_facts` key. Add the expected class in the component SCSS for any item that Angular hides at the mobile breakpoint.

- [ ] **Step 5: Run page-bar regressions**

Run:

```bash
npm test -- --run src/app/layout/QuickFactsPageBar/QuickFactsPageBar.test.tsx src/app/layout/useNavGroups.test.tsx src/app/layout/QuickFactsLayout/QuickFactsLayout.test.tsx
```

Expected: PASS; only mobile-eligible tabs render, the bar requires two visible tabs, and query parameters are preserved.

### Task 2: Select Quick Assist alerts on its route

**Files:**
- Modify: `src/app/layout/AlertList/AlertList.tsx`
- Test: `src/app/layout/AlertList/AlertList.test.tsx`

- [ ] **Step 1: Add a failing Quick Assist alert test**

In the existing navigation test harness, navigate to `/quick-facts/quick-assist`; provide an alert with `sqa: 1` and a separate alert with `sqf: 1`. Assert only the SQA alert is visible for both inline and pop-up lists.

- [ ] **Step 2: Run the targeted test and confirm failure**

Run:

```bash
npm test -- --run src/app/layout/AlertList/AlertList.test.tsx -t 'Quick Assist'
```

Expected: FAIL because the current pathname mapping falls back to `sqf`.

- [ ] **Step 3: Map the route to SQA**

Add `sqa` to the `AlertPage` union and map the exact pathname segment `quick-assist` to it in `PAGES`. Keep Weekly, My Plan, and Summary filters unchanged.

- [ ] **Step 4: Run alert-list tests**

Run:

```bash
npm test -- --run src/app/layout/AlertList/AlertList.test.tsx
```

Expected: PASS, including existing popup acknowledgment and rich-text sanitization tests.

### Task 3: Preserve and expose title-widget payloads

**Files:**
- Modify: `src/shared/types/sqf.types.ts`
- Modify: `src/features/quick-facts/api/sqf.ts`
- Modify: `src/features/quick-facts/hooks/useEnrichedSummaryCards.ts`
- Test: `src/features/quick-facts/api/sqf.test.ts` (create only if no colocated API test exists)
- Test: `src/features/quick-facts/hooks/useEnrichedSummaryCards.test.tsx` (create only if no existing hook integration test covers the response)

- [ ] **Step 1: Add a failing response-preservation test**

Use the existing response-mapping test setup and assert that:

```ts
const widget = { card_identifier: 'widget_card', card_position: 0, metric_key: 'widget_card' }
expect(getTitleWidgetCard({ WTD: [], widget_card: widget })).toEqual(widget)
expect(getTitleWidgetCard({ WTD: [], widget_card: { ...widget, hasError: true } })).toBeNull()
```

Also cover an invalid/errored widget being treated as absent at the presentation boundary, not as a fabricated empty card.

- [ ] **Step 2: Run the API test and confirm the type/contract gap**

Run:

```bash
npm test -- --run src/features/quick-facts/api/sqf.test.ts
```

Expected: FAIL because `getTitleWidgetCard` has no implementation.

- [ ] **Step 3: Add the typed widget shape and response helper**

Add `IQuickFactsTitleWidget` to `sqf.types.ts` with `card_identifier`, `card_position`, `metric_key`, optional `hasError`, and `card_contents` fields `card_header_title`, `rich_text`, and `mixed_chart`. Model the Angular chart fields used by the title widget (`chart_type`, `data[].value/colour/legend`, `caption`, and chart config). Add `widget_card?: IQuickFactsTitleWidget` to the object response forms and export `getTitleWidgetCard(response)`, which returns only a non-error widget whose `card_identifier` is `widget_card`, otherwise `null`.

Keep `mapGenericCards`' spread-based normalization so the widget key survives both WTD/YDAY and widget-only responses. Return the parsed widget from `useEnrichedSummaryCards`; expose the parsed raw Details response to `DetailsPage` without changing the array returned by `usePeriodCards`.

- [ ] **Step 4: Run API and hook tests**

Run:

```bash
npm test -- --run src/features/quick-facts/api/sqf.test.ts src/features/quick-facts/hooks/sqfQueries.test.tsx
```

Expected: PASS for period card mapping and widget preservation.

### Task 4: Render the Angular title widget on Summary and Details

**Files:**
- Create: `src/features/quick-facts/components/TitleWidget/TitleWidget.tsx`
- Create: `src/features/quick-facts/components/TitleWidget/TitleWidget.module.scss`
- Create: `src/features/quick-facts/components/TitleWidget/TitleWidget.test.tsx`
- Modify: `src/features/quick-facts/pages/SummaryPage.tsx`
- Modify: `src/features/quick-facts/pages/SummaryPage.module.scss`
- Test: `src/features/quick-facts/pages/SummaryPage.test.tsx`
- Modify: `src/features/quick-facts/pages/DetailsPage.tsx`
- Modify: `src/features/quick-facts/pages/DetailsPage.module.scss`
- Test: `src/features/quick-facts/pages/DetailsPage.test.tsx`

- [ ] **Step 1: Add failing renderer and page-composition tests**

Test a widget with a header, sanitized rich text, doughnut data, legend, and caption; test that missing/error widgets render nothing. Add Summary and Details assertions that the widget appears in the title row, including Details when only the widget is available.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
npm test -- --run src/features/quick-facts/components/TitleWidget/TitleWidget.test.tsx src/features/quick-facts/pages/SummaryPage.test.tsx src/features/quick-facts/pages/DetailsPage.test.tsx
```

Expected: FAIL because the component and title-row integration do not exist.

- [ ] **Step 3: Implement the title-widget renderer**

Render the Angular structure: optional uppercase header, sanitized `rich_text`, optional 56px doughnut dial, first nonempty segment legend as the dial label, and caption. Use existing Chart.js registrations and `react-chartjs-2` chart primitives. Add a typed bar/line conversion for the mixed-chart forms accepted by `IQuickFactsTitleWidget`; use the Angular axis orientation, chart size, visible series, tooltip labels, and target-line data. Do not silently substitute content for unsupported or invalid data.

- [ ] **Step 4: Integrate Summary and Details title rows**

Place `<TitleWidget card={widgetCard} />` beside the Summary title and in the Details title row. Keep the widget outside `StellaPanel`, matching Angular's layout composition. When Details has a widget but no regular view title, render a widget-only title row.

- [ ] **Step 5: Run title-widget, page, and layout tests**

Run:

```bash
npm test -- --run src/features/quick-facts/components/TitleWidget/TitleWidget.test.tsx src/features/quick-facts/pages/SummaryPage.test.tsx src/features/quick-facts/pages/DetailsPage.test.tsx src/app/layout/QuickFactsLayout
```

Expected: PASS, with no widget for absent/error data and no regressions in page titles, card grids, or details sorting.

### Task 5: Verify Quick Facts parity

**Files:**
- No additional files.

- [ ] **Step 1: Run the full targeted slice**

Run:

```bash
npm test -- --run src/app/layout/QuickFactsPageBar src/app/layout/AlertList src/features/quick-facts/api/sqf.test.ts src/features/quick-facts/hooks/sqfQueries.test.tsx src/features/quick-facts/components/TitleWidget src/features/quick-facts/pages/SummaryPage.test.tsx src/features/quick-facts/pages/DetailsPage.test.tsx
```

Expected: all selected tests pass. If a target test file was not needed because the same behavior is covered in an existing test, omit only that nonexistent path and keep the existing assertion.

- [ ] **Step 2: Type-check**

Run `npx tsc -b` from `projects/wiq-si-portal/frontend`; expected exit code 0.

- [ ] **Step 3: Compare visual output**

Compare Angular `master` and React at 1440×900, 900×800, and 390×844 for page-bar visibility, query-driven tabs, title-widget placement, mixed/doughnut chart, and Details widget-only row.

Do not commit or push implementation changes unless requested.
