# Migration traceability register

**Mapped:** November 2, 2026, React application baseline `16e8c6f`.
This register connects source requirements to implementation and regression
entry points. It does not certify complete source behavior or any BU.
Test links identify relevant assertions, not a pass result for future changes.

## Evidence boundary and status

Angular references below come from the existing October assessments, against
`store-insights/` at `02a9cf69889d74fb8542ec26c9ecb57aae041278`.
There is **no new Angular checkout or live-BU review** in this register.
Recheck the baseline/intervening changes when resuming migration.

- **Open:** a required foundation is absent or not established.
- **Partial:** code and regression cases exist, but source cases or acceptance
  remain outstanding. This does not mean every item in the requirement is coded.
- **Qualified:** only after recorded, authorized acceptance for the stated
  BU/feature/role/theme and compared commits. No row currently has this status.

Tests use synthetic data/mocks at their stated boundaries. The last integrated
baseline checks are dated in the [README](../README.md#current-status).
Run the relevant checks anew; record browser/BU evidence separately.

## Angular source reference keys

Paths are relative to the **separate Angular repository's `store-insights/`**,
not files expected in this React checkout.

| Key | Recorded source / requirement |
|---|---|
| A1 | `src/app/sqf/components/weekly-facts/weekly-facts-home/weekly-facts-home.component.{ts,html,scss}`: selection, lifecycle, actions and page layout |
| A2 | `src/app/sqf/components/weekly-facts/wf-table/wf-table.component.{ts,html,scss}`: projection, groups, KPI, widths, goals and sticky geometry |
| A3 | `src/app/sqf/components/weekly-facts/wf-popup/`: information and alert dialog |
| A4 | `src/app/sqf/services/weekly-facts.service.ts`, `components/shared/email-subscription-popup/`: endpoints, preference controls, defaults and validation |
| A5 | `src/app/sqf/services/sqf-filter.service.ts`, `components/shared/sqf-filter/`, `components/shared/sqf-layout/`: filter actions and portal shell |
| A6 | `src/app/services/auth-guard.service.ts`, `services/nav.service.ts`, `shared/side-nav-drawer/`, `backend/common/user_details.py`: identity, roles, routes and enablement |
| A7 | `src/styles/{_variables.scss,_mixins.scss,app.scss}`, Weekly `shared/wf-styles.scss`: themes, literal HTML classes and breakpoints |
| A8 | `src/app/core-qf/services/qf-cards-preview.service.ts`: capture, preview and export lifecycle |
| A9 | `backend/weekly_facts/{urls.py,data.py}`: page JSON, errors, subscriptions and settings-based actions |

See the [source map](weekly-facts-myplan-parity.md#source-map),
[recent source changes](weekly-facts-myplan-parity.md#recent-changes-the-migration-must-retain)
and [broader comparison](migration-status.md) for derivation.
For example, `56f18713f` records three-column alignment, `cb7da351d`
unsubscribe behavior, `39262aaa0` / `8970d1b39` group-row geometry and
`4b8613763` capture cleanup. These commits do not replace the full baseline.

## Weekly Facts and My Plan

WF01-WF15 retain the identifiers of the
[October 21 gap ledger](weekly-facts-myplan-parity.md#gap-ledger).
Read its original requirement, not its dated "current React" column as a
present-day implementation inventory.

| ID / status | Source | Current React implementation | Relevant regression entry points | Still required |
|---|---|---|---|---|
| WF01 **Open** | A6 | [Demo auth](../src/shared/context/AuthContext.tsx), [routes](../src/app/App.tsx) | [App integration](../src/app/App.test.tsx) uses demo identity, not trusted bootstrap | Real roles/enablement, CFC access, direct-link authorization and account/cache isolation |
| WF02 **Partial** | A1/A5/A6 | [TrendPage](../src/features/trend/pages/TrendPage.tsx), [FilterBar](../src/app/layout/FilterBar/FilterBar.tsx) | [Page](../src/features/trend/pages/TrendPage.test.tsx), [filter shell](../src/app/layout/FilterBar/FilterBar.test.tsx) | Actual identity-driven feature combinations, portal shell and paired query/navigation behavior |
| WF03 **Partial** | A1/A4 | [Selection helpers](../src/features/trend/utils/trendSelection.ts), [mobile menu](../src/features/trend/components/TrendMobileFilters.tsx) | [Resolver cases](../src/features/trend/utils/trendSelection.test.ts), [mobile commit/cancel](../src/features/trend/components/TrendMobileFilters.test.tsx), [page transitions](../src/features/trend/pages/TrendPage.test.tsx) | Paired source lifecycle/history/hierarchy cases for each enabled view; real Half Year configurations |
| WF04 **Partial** | A1/A2 | [Page defaults/reset](../src/features/trend/pages/TrendPage.tsx), [table](../src/features/trend/components/TrendTable.tsx) | [Page tests](../src/features/trend/pages/TrendPage.test.tsx): new table expansion default and retained page variance | Qualify server-default combinations and reset/retention with actual configured tables |
| WF05 **Partial** | A1/A2 | [Projection](../src/features/trend/utils/tableTransform.ts), [column/header association](../src/features/trend/components/TrendTable.tsx) | [Projection tests](../src/features/trend/utils/tableTransform.test.ts): sparse/reordered IDs, mobile and WFM context; [table tests](../src/features/trend/components/TrendTable.test.tsx) | Actual WFM/child/peer/date/hierarchy variants and resized browser behavior |
| WF06 **Partial** | A2 | [KPI/group projection](../src/features/trend/utils/tableTransform.ts) | [Transform tests](../src/features/trend/utils/tableTransform.test.ts): consecutive empty groups, substring KPI, singleton spacers and non-mutation | Rendered spans/row heights and configured KPI/measure-column combinations |
| WF07 **Partial** | A2/A7 | [Table markup](../src/features/trend/components/TrendTable.tsx), [styles](../src/features/trend/components/TrendTable.module.scss) | [Table unit tests](../src/features/trend/components/TrendTable.test.tsx) cover selected markup, not pixel geometry | Hidden spans, widths, double-goal/three-column/sticky/scroll and print geometry; complete source fidelity not established |
| WF08 **Partial** | A2/A7 | [Global HTML styles](../src/styles/globals.css), [tooltip infrastructure](../src/shared/utils/htmlTooltip.ts) | [Table HTML tests](../src/features/trend/components/TrendTable.test.tsx), [tooltip tests](../src/shared/utils/htmlTooltip.test.ts) | Real theme assets, goal/variance/top-bottom-three styling, WFM and tooltip geometry |
| WF09 **Partial** | A1/A3 | [Information dialog](../src/features/trend/components/TrendInfoDialog.tsx), [page actions](../src/features/trend/pages/TrendPage.tsx) | [Dialog focus/Escape](../src/features/trend/components/TrendInfoDialog.test.tsx), [page alerts/mobile info](../src/features/trend/pages/TrendPage.test.tsx) | Paired content/icon/refresh formatting, browser focus and source dimensions |
| WF10 **Partial** | A4/A5/A9 | [Preferences](../src/features/trend/components/SubscriptionDialog.tsx), [hierarchy helpers](../src/features/trend/components/subscription.ts), [API](../src/features/trend/api/trend.ts) | [Dialog tests](../src/features/trend/components/SubscriptionDialog.test.tsx), [tree tests](../src/features/trend/components/SubscriptionLocationTree.test.tsx), [HTTP tests](../src/features/trend/api/trend.http.test.ts) | Real store defaults/identity, unsubscribe/additional-node branches, deep link and view-only no-save source quirk; authorized side-effect acceptance |
| WF11 **Partial** | A1/A5/A9 | [AI drawer](../src/features/trend/components/AiInsightsSidenav.tsx), [banner](../src/features/trend/components/TrendBanner.tsx), [page](../src/features/trend/pages/TrendPage.tsx) | [AI cleanup](../src/features/trend/components/AiInsightsSidenav.test.tsx), [banner lifecycle](../src/features/trend/pages/TrendPage.banner.test.tsx), [links/actions](../src/features/trend/pages/TrendPage.actions.test.tsx) | Actual settings/AI content, responsive placement and external link behavior across enabled BUs |
| WF12 **Partial** | A1/A9 | [Structured error UI](../src/features/trend/pages/TrendPage.tsx), [HTTP errors](../src/shared/api/client.ts) | [Page errors](../src/features/trend/pages/TrendPage.test.tsx), [transport errors](../src/shared/api/client.test.ts) | Real department/CFC/access/no-data/bootstrap distinctions; full source-specific messages and recovery |
| WF13 **Partial** | A1 | [Analytics adapter](../src/shared/utils/analytics.ts), [page events](../src/features/trend/pages/TrendPage.tsx) | [Envelope/dedup/selection](../src/features/trend/pages/TrendPage.actions.test.tsx), [adapter](../src/shared/utils/analytics.test.ts) | Actual identity metadata and approved analytics delivery/count comparison |
| WF14 **Partial** | A8 | [Preview](../src/shared/components/PreviewDialog/PreviewDialog.tsx), [page capture](../src/shared/utils/cardsCapture.ts), [PDF](../src/shared/utils/pdf.ts), [Slides](../src/shared/utils/gcpSlides.ts) | [Preview orchestration](../src/shared/components/PreviewDialog/PreviewDialog.test.tsx), [capture](../src/shared/utils/cardsCapture.test.ts), [PDF](../src/shared/utils/pdf.test.ts), [Slides](../src/shared/utils/gcpSlides.test.ts) | Real landscape artifacts, fonts, print, attachments, Google access and cleanup; mocks are not artifact acceptance |
| WF15 **Partial** | A1-A9 | [MSW setup](../src/test/setup.ts), [trend HTTP](../src/features/trend/api/trend.http.test.ts) | HTTP tests exercise endpoints/Fetch; page tests mainly mock query boundaries | Broader real-provider trend integration, sanitized configuration cases and a checked-in paired browser harness; all-BU evidence absent |

## Quick Facts and shared foundation

The following QF/SH identifiers are **new register IDs**, not replacements for
historical plan task numbers. Their source references remain in the
[broader assessment](migration-status.md); re-establish exact Angular
component/service references before claiming a new source case is covered.

| ID / status | Contract / source evidence | React and regression entry points | Still required |
|---|---|---|---|
| QF01 **Partial** | Summary/details, card configuration and source ordering | [Summary](../src/features/quick-facts/pages/SummaryPage.tsx), [details](../src/features/quick-facts/pages/DetailsPage.tsx); [summary tests](../src/features/quick-facts/pages/SummaryPage.test.tsx), [details tests](../src/features/quick-facts/pages/DetailsPage.test.tsx) | Refresh source-case inventory and qualify enabled card/level/BU combinations |
| QF02 **Partial** | Period/axis projection and source fallback | [Period hook](../src/features/quick-facts/hooks/usePeriodCards.ts), [breakdown](../src/features/quick-facts/utils/breakdown.ts); [period tests](../src/features/quick-facts/hooks/usePeriodCards.test.ts), [query reuse tests](../src/features/quick-facts/hooks/sqfQueries.test.tsx), [breakdown tests](../src/features/quick-facts/utils/breakdown.test.ts) | Real payload variants, navigation/retention and paired source comparisons |
| QF03 **Partial** | Seasonal/profile availability and distinct wire models | [Seasonal adapter](../src/features/quick-facts/api/seasonal.ts), [profile adapter](../src/features/quick-facts/api/storeProfile.ts); [seasonal tests](../src/features/quick-facts/hooks/useSeasonalCard.test.tsx), [profile tests](../src/features/quick-facts/api/storeProfile.test.ts) | Authorized CFC/portal/level combinations and visual states |
| QF04 **Partial** | Source table/chart/ETA rendering | [MetricCard presentation](../src/features/quick-facts/components/MetricCard/), [ETA](../src/features/quick-facts/utils/eta.ts); [table](../src/features/quick-facts/components/MetricCard/MetricCardTable.test.tsx), [chart](../src/features/quick-facts/components/MetricCard/MetricCardChart.test.tsx), [ETA tests](../src/features/quick-facts/utils/eta.test.ts) | Browser chart/gauge/sort/HTML and actual refresh/theme fidelity |
| SH01 **Partial** | Shared filter URL/hierarchy behavior from source filter service | [FilterContext](../src/shared/context/FilterContext.tsx), [URL/back-forward tests](../src/shared/context/FilterContext.test.tsx) | Trusted permitted tree, account changes, real deep links and invalid/empty hierarchy recovery |
| SH02 **Partial** | Existing Python HTTP contracts; transport implementation choice is [ADR 0002](decisions/0002-fetch-and-tanstack-query.md) | [Client](../src/shared/api/client.ts), [client regressions](../src/shared/api/client.test.ts), [multipart forms](../src/shared/api/forms.http.test.ts) | Authorized backend/session/CORS checks; cancellation not universally wired through Query hooks |
| SH03 **Partial** | Feedback/NPS/recognition source workflows | [Shared API](../src/shared/api/), [form HTTP tests](../src/shared/api/forms.http.test.ts), [recognition payload tests](../src/shared/components/RecognizeDialog/recognize.test.ts) | Actual permission/attachment/confirmation behavior; no unapproved live submissions |
| SH04 **Partial** | Source preview/export lifecycle, A8 | WF14 implementation/test links above | Actual multi-card and whole-page output, external assets and approved external integrations |

## Updating and using the register

For a task, reference its ID and source key, inspect the linked implementation
and assertions, then identify the specific remaining acceptance case.
Do not treat a file link as evidence that every branch in a row is tested.

When adding or changing evidence:

1. Retain the ID; record the source and React commits actually compared.
2. Link the changed code and regression file, naming the case where a file
   contains many unrelated tests. Run targeted checks and the applicable
   [validation commands](testing.md#repeatable-validation).
3. Keep implementation status separate from execution and BU acceptance.
   Record a dated result/evidence reference; do not mark a whole row complete
   because its component exists.
4. For BU qualification, record portal, enabled feature, role, hierarchy,
   theme/version, viewport/scenario and accepted result in an authorized
   evidence location. Link only sanitized summaries here.
5. Update [current feature guidance](feature-guide.md) when behavior changes.
   Preserve dated assessments rather than rewriting their findings.

Unresolved identity/access, an unknown enabled-BU inventory or missing source/
browser evidence blocks all-BU completion. See the
[qualification matrix](weekly-facts-myplan-parity.md#all-bu-scope-and-qualification-matrix)
and [delivery gates](migration-strategy.md#delivery-roadmap-and-acceptance-gates).
