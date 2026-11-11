# Feature guide and current code map

Reviewed against `16e8c6f` on November 2, 2026. This is a map of implemented
surfaces and important constraints, not all-BU acceptance. Detailed Angular
source evidence remains in the dated [migration status](migration-status.md)
and [Weekly/MyPlan assessment](weekly-facts-myplan-parity.md).
The [traceability register](migration-traceability.md) links stable requirement
IDs to current implementation, regression entry points and acceptance gaps.

## Quick Facts summary and details

| Concern | Starting point |
|---|---|
| Summary composition/order/profile gate | [SummaryPage](../src/features/quick-facts/pages/SummaryPage.tsx) |
| Details route, sorting and drill-down | [DetailsPage](../src/features/quick-facts/pages/DetailsPage.tsx) |
| Summary/status/ETA enrichment | [useEnrichedSummaryCards](../src/features/quick-facts/hooks/useEnrichedSummaryCards.ts) |
| Period projection | [usePeriodCards](../src/features/quick-facts/hooks/usePeriodCards.ts) |
| Breakdown projection / retention | [useAxisCard](../src/features/quick-facts/hooks/useAxisCard.ts) |
| Seasonal availability/mapping | [useSeasonalCard](../src/features/quick-facts/hooks/useSeasonalCard.ts), [adapter](../src/features/quick-facts/api/seasonal.ts) |
| Card presentation | [SummaryCard](../src/features/quick-facts/components/SummaryCard/SummaryCard.tsx), [DetailsCard](../src/features/quick-facts/components/DetailsCard/DetailsCard.tsx) |
| Shared chart/table inside this feature | [MetricCardChart](../src/features/quick-facts/components/MetricCard/MetricCardChart.tsx), [MetricCardTable](../src/features/quick-facts/components/MetricCard/MetricCardTable.tsx) |

Summary derives active-period cards, detail availability and expected-refresh
metadata. It filters hidden cards and orders by card/config sequence.
Configured seasonal content is inserted by sequence. METRO/PEL Store-level
selection enables profile-card composition; SI/METRO use Daily branding.
These code branches are not proof those BUs have been qualified.

Details uses route metric, shared location/date/axis, configuration levels and
CFC classification. Unavailable metrics redirect to summary with the search
string. Generic card order remains API order until explicit sorting;
seasonal content has source-specific defaults. Sorting UI metadata and actual
initial ordering are not interchangeable. Drill-down changes the selected
permitted-tree node rather than guessing a new depth.

Period fallback derives an available period without changing the requested URL.
Breakdown switching projects cached content, with unresolved-axis retention
handled by the existing helper. Keep table sort, page card sort and breakdown
selection separate.

The table supports expansion, original content/HTML, sorting and scroll
shadows. Nested-table header sorting is disabled while initial API sorting
remains. Chart.js conversion includes gauge labels/needle callbacks.
No unit assertion certifies actual chart pixels, sticky geometry or complete
Angular layout matching.

## Weekly Facts and My Plan

| Concern | Starting point |
|---|---|
| Page composition and viewport state | [TrendPage](../src/features/trend/pages/TrendPage.tsx) |
| Query key and endpoint selection | [useTrendData](../src/features/trend/hooks/useTrendData.ts) |
| View/date/hierarchy selection | [trendSelection](../src/features/trend/utils/trendSelection.ts) |
| Column projection | [tableTransform](../src/features/trend/utils/tableTransform.ts) |
| Table grouping, KPI and header/cell actions | [TrendTable](../src/features/trend/components/TrendTable.tsx) |
| Mobile draft/commit menu | [TrendMobileFilters](../src/features/trend/components/TrendMobileFilters.tsx) |
| Shell action registration | [TrendActionsContext](../src/features/trend/context/TrendActionsContext.tsx) |
| Information/alert dialog | [TrendInfoDialog](../src/features/trend/components/TrendInfoDialog.tsx) |
| Preferences and hierarchy | [SubscriptionDialog](../src/features/trend/components/SubscriptionDialog.tsx), [helpers](../src/features/trend/components/subscription.ts) |
| AI drawer and banner | [AiInsightsSidenav](../src/features/trend/components/AiInsightsSidenav.tsx), [TrendBanner](../src/features/trend/components/TrendBanner.tsx) |

Both routes use one renderer with metric-specific endpoints. Page data supplies
cards/views, dates, hierarchy, HTML and settings; do not hardcode a global list
of measures or assume all BUs have identical configurations.

### Selection contracts

- Desktop starts at the first page card; mobile starts at the first card with
  `hasMobileView`, with source-specific initial contents selection.
- History uses `dateFilterKey`, default `weekNo`, not a fixed `week`/`month`
  model. Date and hierarchy actions have intentionally asymmetric matching.
- An unmatched filter retains the previous displayed contents, matching the
  recorded Angular behavior rather than resetting to an arbitrary first table.
- Desktop/mobile selections are separate across resize. Replacement response
  or metric changes reset selection and close/reset associated overlays.
- Mobile menu tabs are draft state; cancel/outside/Escape does not commit.
  Selecting an equal date after a tab preview does not commit that tab.
- My Plan Half Year is a **card-level** `half_year` match, not necessarily a
  history property on contents.
- Table cells retain original column IDs and matching headers after projection.
  Child/peer, parent/child, hierarchy/date and WFM rules affect visible columns.

The viewport observer uses **767px**; stylesheet/header action rules include
**768px** behavior. Test 767/768/769 explicitly instead of "cleaning up" these
boundaries without source evidence.

### Wired actions and limitations

| Surface | Current behavior / qualification boundary |
|---|---|
| Information and alerts | Dedicated dialog with focus/scroll lifecycle; composed mobile info includes refresh/metric content |
| Variance / all rows | Server defaults and table KPI/filter state drive controls |
| Banner | Shared shell registration, dismissal/reset, DOMPurify for banner HTML |
| Resource links | Response text/URL, safe new-tab opener handling, hidden at 768px and below |
| Analytics | Source-named events through shared dataLayer adapter, including committed mobile actions |
| Subscriptions | Header action/deep link opens preferences; multipart save, hierarchy/view controls and notifications exist |
| AI | Config-gated drawer, resize/cleanup, response/metric reset and feedback handoff |
| Preview/export | Registers page DOM capture with shared preview infrastructure |

The desktop page's inline "Subscription preferences" text is not itself a
click handler; the registered header action/deep link is the implemented entry.
The dialog currently only saves when serialized locations differ from the
initial value, even if view selection changes alone. Its store-user defaults
depend on identity props not supplied by the demo page bootstrap. Preserve and
qualify these source/identity behaviors rather than assuming a generic form.

The detailed assessment records synthetic browser scenarios at 360, 767, 768,
769 and 1024px using intercepted requests. That is not paired visual,
live-data, export or enabled-BU acceptance. WFM/double-goal/three-column/sticky
fidelity and actual permissions/configurations still need evidence.

## Shared workflows

| Workflow | Owner / boundary |
|---|---|
| Location/date/period/axis | [FilterContext](../src/shared/context/FilterContext.tsx), [FilterBar](../src/app/layout/FilterBar/FilterBar.tsx) |
| Page preview registration | [CardsPreviewProvider](../src/shared/components/PreviewDialog/CardsPreviewProvider.tsx) |
| Capture and export | [PreviewDialog](../src/shared/components/PreviewDialog/PreviewDialog.tsx), [capture](../src/shared/utils/cardsCapture.ts), [PDF](../src/shared/utils/pdf.ts), [Slides](../src/shared/utils/gcpSlides.ts) |
| Feedback and NPS | [FeedbackDialog](../src/shared/components/FeedbackDialog/FeedbackDialog.tsx), [NpsSurvey](../src/shared/components/NpsSurvey/NpsSurvey.tsx) |
| Recognition | [RecognizeDialog](../src/shared/components/RecognizeDialog/RecognizeDialog.tsx) and payload helpers |
| Usage events | [analytics](../src/shared/utils/analytics.ts) and shared user metadata |

Preview routes capture to PDF/download, print, Slides or recognition; print is
not just a direct page `window.print()`. Lifecycle includes cancellation,
notifications and URL cleanup. Stable DOM IDs, literal preview classes,
layout and loaded assets matter to export fidelity.

Real OAuth, attachments, printing, external hosts and analytics delivery need
approved browser/staging checks. Unit mocks verify orchestration only.

## Where to continue

Use [migration strategy](migration-strategy.md#delivery-roadmap-and-acceptance-gates)
for current gates. Highest-level gaps are real identity/roles/enablement and
cache isolation, source-specific layout/lifecycle completeness, actual
external integrations, and paired all-BU validation. Top-level Coming Soon
routes remain outside the implemented Quick Facts/trend slice.

Do not resurrect removed generic components because an old plan references
them, or mark whole historical tasks complete solely because a named component
now exists. Trace their acceptance cases to current code and evidence.
