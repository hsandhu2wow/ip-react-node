# Quick Facts actions — Angular parity plan

Goal: port Angular SQF actions one-to-one (UI text, flows, endpoints, file names). Backend endpoints verified live on :8080 via /api proxy.

## Phase 0 — Shared infrastructure (blocks 1–3, 6)
- Deps: `html2canvas-pro@^1.6.5`, `jspdf@4.2.1` (dynamic import, like Angular).
- `components/shared/Dialog` (Material-dialog equivalent: backdrop, close, panel sizes modal-size-60 / 550 / 35%), `ConfirmDialog` (No/Yes).
- `components/shared/Snackbar` + `useSnackbar` context (info/error, center/top).
- `utils/pdf.ts` — port PdfGenerationService (A3 when orientation, px→mm 0.264583, /2 +10, scale-to-fit, centre, posY=(pageH-imgH)/6, page per canvas; download/print(bloburl+autoPrint)/blob).
- `utils/cardsCapture.ts` — port QfCardsPreviewService: elements by `jsId`, add `*__preview` classes, html2canvas-pro {scale:2, scrollY:-scrollY, ignore overlays}, common-ancestor capture + crop, sequential fallback, cleanup; preview-mode class on page scroll container.
- Preview CSS: port `qf-summary-card__preview`, `qf-details-card__preview`, `*-preview-wf` rules to card modules (data attribute/class toggles).
- `PreviewDialog` — "Generating..." loader, JPEG previews, modes pdf | print | recognize | slide; filename `${title}-${cardType}_${M_d_yy_h_mm}`; hidden iframe for print, close on window focus.

## Phase 1 — Download PDF & Print (header + mobile)
- Enable FilterBar download (icon `play_for_work`, tooltip "Download") and print buttons → preview('pdf' | 'print'); hide on Quick Assist; desktop only (hide-xsm).
- Summary/Details pages register their currently displayed cards (Angular summary-home 142-154 / details-home 137-142).
- Weekly / My Plan: whole-page landscape export (previewAndProcessPageData / getPageCanvases). `#qf-scroll-container` class swapped to `qf-summary-card__preview-wf` during capture (full table, no scroll crop), page gets `js-weekly-card__preview` (1500px, toolbar hidden); both restored afterwards.

## Phase 2 — Recognise (thank-you card)
- Card celebrate button (summary + details; existing visibility rules) → capture that card → PDF blob → `RecognizeDialog`.
- Port QfRecognizeComponent: header "QUICK FACTS THANK YOU CARD", thank_you image, recipient (required) + line manager (optional) autocomplete via `GET /users/userSearch/{name}` (400ms debounce, email from `employee_name` <…>), store-account warning (PEL .co.nz vs .com.au), message (required, max 4000, 7 rows), attachment name `${cardLevel} - ${cardType} - ${dd-MM-yyyy}.pdf`, Submit.
- `POST /sqf/recognize` multipart (CardPDF, send_to, cc_to, recipient_emp_number, line_manager_emp_number, qf_access_validation, card_level, card_title, card_type, card_id, card_desc, card_code, filter_date, body).
- NoQfAccess → ConfirmDialog → resubmit with qf_access_validation=N; success/error snackbars with Angular text.

## Phase 3 — Feedback dialog
- Header forum button + mobile "Give Feedback" → `FeedbackDialog` (35% width): "Help us improve!", issue type from `GET /feedbackIssuesType/{pageSection}` (first preselected), reason textarea, contact checkbox, image attachments (click + drag/drop, chips), Submit.
- `POST /feedbackPopup` multipart (image0..N, reason, contactMe, requestOrigin='Support '+page, issueType, url); success snackbar "Thank you for the feedback!".

## Phase 4 — Email subscription preferences (Weekly / My Plan)
- Button + mobile item when `is_web_subscription_enabled` on Weekly/My Plan pages.
- Dialog: views + locations selection, validation messages, `GET /{wf|myplan}/userSubscriptions`, `POST /{key}/updateUserSubscriptions` (locations, selected_views JSON strings), success/error snackbars.

## Phase 5 — AI Insights panel (Weekly / My Plan)
- Header button (`auto_awesome`, `button_text || 'AI Insights'`) when `config.ai_insights_enabled`; right side panel rendering `ai_insights.insights` sanitized HTML; no extra endpoint.

## Phase 6 — Google Slides export
- Menu option (not on Weekly Facts) → preview('slide'): upload images `POST /uploadImageForSlide`, Drive folder "QuickFacts", create presentation `Quick_Facts_Card_M_d_yy_h_mm_a`, one slide per card + title, open webViewLink, `POST /deleteImageForSlide`.
- Needs Google API key + OAuth client id. Angular uses deprecated `gapi.auth2`; React must use Google Identity Services token client (same scopes) — only behavioural deviation.

## Phase 7 — Mobile overflow menu
- `more_vert` menu (≤768): Subscription preferences (conditional), Give Feedback, PDF.

## Verification per phase
- Vitest unit tests (API payloads, filename/date formats, pdf maths, dialogs' validation), tsc, build.
- Live Playwright comparison vs Angular (:4200) for dialogs and generated output.

## Execution
- Phase 0→1→2 sequential (one agent). Phases 3, 4+5 in parallel agents (FilterBar edits coordinated: Phase 0 agent owns FilterBar; others expose components only, wired at the end).
- Phase 6 after credentials are provided. Phase 7 last.

## Status (2026-10-10 08:5x)
- All phases 0–7 implemented (uncommitted). vitest 244/244, tsc and build pass. Mobile overflow menu mirrors Angular: Subscription preferences (conditional) + Give Feedback only.
- Pending: Google API key + OAuth client id for Slides.
- Decision: Google Slides — implement code now (Google Identity Services, same scopes); user will supply API key + OAuth client id later (env vars, e.g. VITE_GOOGLE_API_KEY / VITE_GOOGLE_CLIENT_ID).
- Prior work in working tree (uncommitted): layout parity, Sales Challenge gauge, table parity, chart memoization, fixed table shadow.

## Details-page corrections (2026-10-18)
- Generic drill-down uses `apiType` and `childCode`; non-availability cards retain their store-level links. Availability department options navigate through the processed location tree.
- Raw `leafChildren` become selectable department/category nodes, preserving Angular's composite codes, API depth 5 and ancestor breadcrumbs, including direct URL restoration.
- Sorting retains card component identity (and selected tabs) rather than remounting graphs. API sort labels and legacy top-level `{ cards, sortBy }` responses are supported.
- Tabs render API `tabName`, rich-text content and reporting times; empty/refreshed tab sets no longer crash. Headerless tables, explanatory HTML and minimum column widths are supported.
- Breakdown changes use the selected child header colour. Missing breakdown data shows an unavailable state instead of retaining stale data; nested rows reset when their table data changes.
- Details tables remain visible with Angular's scrolling limits. PDF/print capture the displayed cards and active tab; exports do not force every tab or nested row open.
- Initial controlled-data browser checks cover desktop Details navigation, filters, sorting, nested rows, Metrics Info, feedback context, PDF/print and recognition-form opening. The APIs were unavailable during that pass; the subsequent live-data recheck is recorded below.
- This pass covers the shared generic Details page. Legacy seasonal-card rendering, analytics and the existing Google Slides credential dependency are not certified by these checks.

## Details-page full recheck (2026-10-18)
- Restored recognition buttons for nested cards without an outer `cardHeader`, matching Angular's eligibility rule. This affects Stock Loss, Wages and the VOC CFC card.
- Recognition immediately invalidates a selected recipient/manager when its input changes, including short inputs and the debounce window. Clearing an optional manager clears both email and employee number; changing recipients restores access validation. Failed searches stop their spinner and display an error.
- Capture failures, empty previews and PDF-generation failures now display an error and release the generating state. Printing preserves existing window-focus handlers and revokes its temporary PDF URL on cleanup.
- Browser back/forward navigation restores location, date, period and breakdown from the URL instead of retaining filters from the previous page.
- Generic API cards derive the table-only layout as Angular does. Basic table body/footer row heights are preserved. KPI explanations support click/touch and keyboard toggling, dismiss on scrolling/resizing, and are excluded from exports. Terminal card titles explain that no further drill-down is available.
- Failed feedback submissions now display an error instead of closing silently.
- Compared 92 live-data metric/period/axis combinations against Angular using identical saved API responses: all eight enabled metrics at National and a representative State for both periods and axes; representative Zone, Group, Store and Department nodes for WTD/child-level, subject to configured depth limits. Table/footer values, chart counts, recognition eligibility, drill links and available/unavailable states matched. Most deeper metrics returned the same explicit no-data payload in both apps; Fruit & Veg supplied additional lower-level content. This is functional coverage, not certification of every location/date or pixel-perfect error-header history.
- Exercised real-data PDF export for all eight metrics: 36 pages, one per displayed card. Every card capture contained nonblank rasterised table content; the Sales capture was also inspected visually. Exports retain Angular's visible table viewport rather than revealing hidden columns, inactive tabs or collapsed nested rows.
- Re-ran controlled desktop actions/navigation and raw leaf-department URL/reload checks. Mobile checks exercise DOM handlers; native mouse input intermittently crashes the installed macOS Chrome. Some deeper comparisons and real-data export buttons also use DOM-dispatched clicks to avoid that browser crash.
- User decision: preserve Angular's exact breakdown-key handling. The shared Online `Proposition` and Wages `labour_department` department-axis mismatch remains intentionally unchanged.
- Verification: 282 tests across 43 files, TypeScript/production build and whitespace checks pass. ESLint could not run because this repository has no ESLint configuration; no unrelated tooling was added. The existing bundle-size warning remains.
- Remaining limitations: Google Slides needs API/OAuth credentials; disabled legacy Seasonal Details and analytics are not certified. No real recognition or feedback messages were sent during browser verification.

## Responsive recheck

Compared Angular vs React Summary/Details at 360x740, 390x844, 740x360, 844x390, 768x1024, 1023x768, 1024x768, 1200x900, 1280x800, 1440x900, 1728x1000 and 1920x1080 (live data, Playwright geometry + behaviour probes).

Fixes:
- Mobile/desktop shell switch now at 768/769px (Angular `xsm`/`sm`), not 767/768px.
- Details mobile card list padding (`0 12px` ≤360px, `12px` 361–767px) — cards no longer overflow.
- Details cards `margin: 0 auto 16px` at ≤1200px; 16px top band at 769–1023px.
- Landscape rules: tablet-sm (768–1023) single column, 714px max; mobile-lg (361–767) 600px cards; footer and Back to top hidden in landscape ≤1023px.
- Sort Cards button padding `0 8px` (was 4px wider).

Known/intentional differences:
- Mobile Daily/Weekly/Trend page bar removed by request (content sits 52px higher).
- Shared mobile app bar is 56px ("Quick Facts") vs Angular 60px ("My Insights") — shell outside Quick Facts scope.
- CSS media-query changes verified in a real browser (jsdom cannot evaluate them); native touch clicks not verified in headless Chrome.

## Recognise icon & scroll behaviour recheck

- Recognise (celebration) icon: Summary now reads the header colour from the resolved child card (Angular `setComponentValues` → `cardHeader`), so axis-driven cards such as Stock Loss show the icon and child colour. A missing header no longer hides the icon (Angular `undefined != '#eb5757'`). Details keeps Angular's parent `card.cardHeader` rule for the icon; its border now uses only the resolved card's header. Verified live: icon/border match on all Summary and Details cards for the same date.
- Filter bar scroll (Angular `SqfCardsService.makeFilterSticky`): scrolling down past the bar height (desktop) or any amount (≤768px) sets `z-index:-1` so content slides over it; scrolling up restores it. Pages with <50px scroll range ignore downward scrolls. The kebab menu closes on scroll (Angular `SqfFilterComponent.onScroll`). React restores its CSS z-index (900) instead of Angular's literal 101 so sticky table headers (z 101) never paint over it.
- Already in parity: table scroll help text, 8px scrollbars, 320px tab-table max height.
- Kept intentionally (user decision): on mobile the bar reappears below the app bar (Angular overlaps the header because its `top:60px` is commented out); React honours `?date=` on load (Angular resets it to yesterday).

## Missing features analysis (Summary & Details vs Angular)

Verified against Angular source (`sqf/**`, `core-qf/**`, `shared/components/universal-filter`).

### Missing in React
| Priority | Feature | Angular reference | Live data exercises it? |
|---|---|---|---|
| High | GA analytics (`dataLayer` `quick_facts_element_click`: period, axis, card dropdown, sort, export/recognise, date) | `sqf-cards.service.ts` `sendQFDataToAnalytics`; GTM in `index.html` | Yes (every interaction) |
| High | NPS survey popup on Summary/Details load | `sqfCardsService.showNPSSurvey()` → `helpService.npsSurveyOpen`; `core-qf/qf-nps-survey` | Depends on user flag |
| High | Store locator ("YOUR LOCATION" nearby stores) | `universal-filter` `showNearbyStore()` + `SqfStoreLocatorService` | React row is inert |
| Medium | Seasonal summary/details cards (chart + table) | `sqf/components/seasonal/*`, shown when `availableCards.seasonal` | No (not in current card status) |
| Medium | Comments table (`tableData.type === 'comments'`) | `sqf-comments-table` | No (falls back to basic table) |
| Medium | X-axis label hover → tooltip | `chart-plugins/x-axis-label-hover.plugin.ts` (registered globally in `sqf-layout`) | Yes (bar charts) |
| Low | Store profile card at store level | `sqf-profile-card`, `/sqf/storeProfileDetails/{code}`; only `METRO`/`PEL` portals | No (React portal is `SI`) |

### Checked – not gaps
- Google Slide menu: `#showMenuOption` has no trigger in `sqf-filter` (unreachable).
- HTML tooltip & resizable drawer directives: Weekly Facts only.
- Pin board service: no SQF references.
- `isMyMetric`/card origin: Quick Facts always `quick-facts`.
- Polling: none in Angular SQF.
- Department/category tree nodes: built from `leafChildren` in both apps.
- Nested-table sort: Angular uses `matSortDisabled`; React matches.

## Missing-feature port — implementation notes

- Analytics, NPS, x-axis hover: implemented.
- Comments table (`CommentsTable.tsx`): port of `sqf-comments-table`; fixture-tested (no live comments data).
- Store locator (`LocationTree.tsx`): "YOUR LOCATION" toggle via `/sqf/getNearbyStores/{lat}/{lng}`.
- Store profile card (`ProfileCard/*`, `api/storeProfile.ts`): METRO/PEL at Store level; verified live vs Angular (row heights 37px).
- Seasonal (`SeasonalCard/*`, `api/seasonal*`): full port; fixture-tested only because the backend omits seasonal from card status.
- Verification: 367/367 tests, `tsc -b`, build, `git diff --check` all pass.

## Final visual/scroll recheck

- Scrollbars: Angular `app.scss` styles `*::-webkit-scrollbar` globally (8px, always visible on macOS). React only styled table areas, so the page used overlay scrollbars that appear only while scrolling. Moved the rule to `globals.css` (global).
- Page bottom: Summary/Details `.page` padding-bottom reduced from `footer-height + 48px` to Angular's `.si-container` 48px. Details now renders Angular's invisible `mat-divider.qf-card-divider` after the last card.
- Details text colours: card text `#4a4a4a` (mat-card), back link/Sort Cards `rgba(0,0,0,.87)`, Sort icon 18px high, details filter label bold.
- Verified live at 1440/768/360: page scrollbar 8px in both, end-of-scroll positions match (except agreed mobile header/tab differences).

## Filter-bar popups & info popup parity (Angular visual match)

- Location tree: universal-filter geometry (8px/level indent, 48px toggles, fit-content panel, 280px at ≤768).
- Period / axis / card-type / mobile kebab menus: plain `mat-menu` look (112px min, elevation-8, 48px rows, 12px text); kebab sits 8px from the viewport edge.
- Date picker: `mat-calendar` port (month / multi-year / year views, min/max nav, WTD/Day toggle at ≤768) anchored after the date text and clamped to an 8px viewport margin like the CDK overlay.
- Metrics Info popup: `qf-popup` (info_outlined icon, 16px bold title, 14px/140% body, faded `hr`, 530×648 max).
- Print/download preview: `#333` close icon, "Generating..." 13px `#178841` with 16px bottom margin.
- Angular's local feedback dialog fails to load its form, so React keeps the intended design.

## Escape closes filter-bar popups

Angular `mat-menu`/`mat-datepicker` close on Escape. `useEscapeToClose` (FilterBar) now does the same for location, date, period, breakdown, card-type and kebab popups. E2E (Playwright, mutations intercepted): summary/details load, filters, date, location, download, print, feedback (+image), recognise (PDF attached), kebab menu — all pass.
