# React Shell Parity Gaps — Design Spec

**Date:** 2026-11-23
**Reference:** Angular Store Insights on `master`
**Scope:** Implement the remaining verified header, navigation, Quick Facts page-bar/alert/title-widget, and app-level route behavior gaps. Preserve the existing React migration boundary and all current worktree changes.

## 1. Goals and non-goals

### Goals

- Match the Angular desktop and mobile navigation behaviors where the React shell still differs.
- Match Angular Quick Facts page-bar eligibility, labels, badges, visibility, and query preservation.
- Use the Quick Assist alert category on the Quick Assist route.
- Render the optional Angular title widget from the existing card response on Summary and Details.
- Restore Angular route analytics, first-visit intro videos, and one-time stale-chunk recovery for the corresponding React routes.
- Keep each concern testable and owned by the existing shell or feature boundary.

### Non-goals

- Migrate BQF notifications or other placeholder page functionality. BQF, Dashboards, and Pricing Simulator remain Coming Soon routes, but configured Angular intro videos must display before those placeholders.
- Add the Angular feedback banner: it is not triggered on the Angular `master` baseline.
- Change the shared footer or ordinary alert rendering, which already match.
- Add the global Processing overlay; it is not part of the Quick Facts layout being migrated.
- Rework the existing optional per-popup title change (`title` from `/popUpAlerts`); retain it.
- Commit, push, or merge implementation changes without a separate explicit request.

## 2. Architecture and data flow

Implement three focused slices without introducing a generic Angular-compatibility framework:

1. **Shell/navigation:** Refine existing `navItems.ts`, `SideNav`, `MobileNav`, `MobileAccountSheet`, and `QuickFactsPageBar`. Keep rail/drawer and page-bar eligibility separate where Angular intentionally applies different rules.
2. **Quick Facts page behavior:** Keep alert selection in `AlertList`; carry the optional `widget_card` payload through the existing summary/detail API and typed card hooks, and render it through a focused title-widget component beside the page title.
3. **App-level route behavior:** Add a small router lifecycle integration for route analytics and intro-video selection, plus a one-time Vite preload-error recovery listener. Reuse the current user-details query, API client, router, Dialog, and existing GTM bootstrap.

Use the Angular `master` implementation as the behavior and content reference, but keep React responsibilities in their existing app/feature/shared layers. Do not introduce a new backend endpoint or change existing API paths.

## 3. Shell and navigation behavior

### Desktop rail and mobile drawer

- Preserve the current grouped navigation model and Coming Soon routes.
- Order non-SI Store items as Quick Facts, Weekly Facts/My Plan, then Quick Assist, matching Angular.
- Use `/help/access` for the drawer Help destination.
- Do not render New! tags in the mobile drawer; retain Soon markers for unmigrated destinations as the intentional React migration affordance.
- Make the mobile active title a link to the corresponding Angular destination. Render no title on Admin routes.
- Remove the mobile Dashboard search control; Angular's conditions make it unavailable on mobile.
- Render Switch Account and Sign Out in the account menu as Angular does. If an action's required URL is missing, keep the item visible but disabled and do not navigate to an invalid target.
- On mobile, Sign Out opens the Angular confirmation bottom sheet with “Sign out?”, explanatory text, a red Sign Out action, and Cancel. Browser Back, Escape, backdrop, and explicit close must close the active sheet and restore body scrolling/focus.

### Quick Facts page bar

- Keep the page bar mobile-only and hide it unless at least two eligible items remain.
- Apply Angular page-bar eligibility independently from the desktop rail. In particular, Quick Assist is excluded for CFC accounts in the page bar even where the SI/METRO desktop rail retains it.
- Hide My Plan as a page-bar tab at mobile widths.
- Use `weekly_facts` for the page-bar My Plan New! badge, as Angular does; this is separate from the desktop navigation badge mapping.
- Preserve the full current query string when changing tabs.

## 4. Quick Facts alerts and title widget

### Alert selection

Map `/quick-facts/quick-assist` to `sqa` for both inline and pop-up alerts. Keep current route-specific selection, sanitization, dismissal, acknowledgment, and alert-fetch timing unchanged.

### Title widget

- Read `widget_card` from the existing Summary/Details card response; do not add a separate request.
- Show the title widget only when the server returns a valid widget card; do not synthesize placeholder content on missing or errored responses.
- Match the Angular widget fields and layout: `card_header_title`, `rich_text`, and optional `mixed_chart`, including the legend-derived dial label and caption.
- Render the widget beside the page title on Summary and Details, including the details-only title-row case.
- Sanitize backend rich text before rendering. Keep chart rendering bounded to the widget payload's supported mixed-chart format.

## 5. App-level lifecycle behavior

### Route analytics

- Emit the Angular-compatible GTM navigation event once for each route transition using the existing `window.dataLayer` bootstrap.
- Include `dashboardTitle`, `dashboardType`, `employeeNumber`, `siRole`, and `selectedLocation` with the same route-specific values as Angular.
- For Quick Facts, emit after the selected location is available and include its code. Do not duplicate existing Quick Facts element-click analytics.
- For dashboard placeholders without loaded dashboard metadata, use the same undefined metadata values Angular uses when no dashboard record is resolved; do not fabricate titles or types.

### Intro videos

- Match Angular's route and account-flag checks:
  - Quick Facts: `sqf_video` when `sqf_video_flag` is not set.
  - BQF: `bqf_video` when `bqf_video_flag` is not set.
  - Dashboards: `dashboards_video` when `dashboards_video_flag` is not set.
  - Pricing Simulator: `psim_video` only when `psimVideoFlag` is not `yes` and `corsErrorHappened` is `yes`.
- Apply these checks on matching Coming Soon routes as well as implemented routes.
- Show the Angular-style modal with the video preview URL, external fallback link, and explicit close action. Backdrop/Escape must not silently dismiss it.
- On close, update the matching account flag through Angular's `POST /updatevideoflag` contract; Pricing Simulator uses the same local-storage marker as Angular. Keep the dialog open and surface an error if a required flag update fails.

### Stale chunks

- Listen for Vite's `vite:preloadError` event and reload the current page at most once per session using Angular's `si-stale-chunk-reload` session-storage guard.
- Prevent repeated reload loops. Do not catch unrelated route or network errors as stale chunk failures.

## 6. Error handling, accessibility, and testing

- Continue to use the current typed API client, query cache, and structured HTTP errors. Do not add broad catches or success-shaped fallback data.
- Keep disabled account actions accessible with a clear disabled state.
- Preserve dialog semantics, keyboard focus, focus restoration, and body-scroll cleanup.
- Add focused tests for navigation order/visibility, account sheet actions/history behavior, page-bar CFC/My Plan/query cases, Quick Assist alert filtering, widget response validity/rendering, route analytics payloads, intro-video route/flag handling and failed updates, and one-shot stale-chunk reload.
- Use MSW for API integration and synthetic user/card data; do not submit real feedback or mutate live service state.
- Compare Angular `master` and React at 1440×900, 900×800, and 390×844 for the changed shell and title-widget states.
- Run the focused Vitest tests, `npx tsc -b`, documentation checks for doc changes, and the repository's configured code checks before reporting completion.

## 7. Implementation order

1. Add failing tests and implement shell/navigation/account parity.
2. Add failing tests and implement page-bar, Quick Assist alert selection, and title-widget data/rendering.
3. Add failing tests and implement route analytics, intro-video lifecycle, and stale-chunk recovery.
4. Run targeted checks after each slice, then full required checks and responsive visual comparison.

Preserve all existing uncommitted work, including the Quick Facts page-bar and configurable popup-title changes. Stage or modify only files required by this design.
