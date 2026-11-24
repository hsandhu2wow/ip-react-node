# Header, Footer and Navigation Parity — Design Spec

**Date:** 2026-11-19  
**Branch:** `feat/header-footer-navigation-parity`  
**Reference:** Angular Store Insights on `master`  
**Scope:** Bring the React application shell into functional and visual parity with Angular's navigation, responsive header/drawer, Quick Facts page-bar, account actions and footer.

This spec extends and supersedes the shell-specific assumptions in `2026-07-01-navigation-design.md` where they conflict. The existing React shell remains the implementation starting point; this work replaces approximations with the Angular behavior and styling.

## 1. Goals and non-goals

### Goals

- Match the Angular desktop navigation rail and responsive mobile header/navigation.
- Reproduce Angular's account- and feature-driven nav items, labels, routes, active states, badges, and grouping.
- Restore the Angular Quick Facts page-bar on mobile only.
- Preserve the visible Dashboard search UI without implementing search submission or search results.
- Match shared footer, scroll-hide and Back-to-top behavior.
- Keep routes for unmigrated features navigable to React Coming Soon pages and retain a `Soon` badge for those items.

### Non-goals

- Migrate Dashboard, BQF, Pricing Simulator, ACT, Admin, Help or Quick Assist page functionality.
- Implement Dashboard search behavior; its React control is visual-only.
- Change Quick Facts or Trend page content, filter behavior, APIs or business logic except where required to integrate the shell and page-bar.
- Match route-specific Angular content outside the shared shell.

## 2. Architecture and data

Keep the responsive structures distinct, following Angular's composition rather than creating one schema-driven component for layouts with different markup:

- **Desktop:** `AppShell` renders the fixed navigation rail and page content. The rail is 56px collapsed and 268px expanded on hover; no global top header or Quick Facts page-bar is shown at desktop.
- **Tablet/mobile (≤768px):** `AppShell` renders the 60px header, a slide-in navigation drawer, and the Quick Facts page-bar when applicable. The rail is hidden.
- **Shared:** the Quick Facts layout owns the mobile page-bar; the Footer remains with page content and supports Back-to-top.

Reuse and refine the existing `AppShell`, `SideNav`, `MobileNav`, `Footer`, `navItems.ts` and `useNavGroups` rather than duplicating shell implementations. Add focused components only where the Angular structures have distinct responsibility (for example, mobile account bottom sheet and the Quick Facts page-bar). Keep route definitions centralized in `App.tsx` and retain `ComingSoon` for features not migrated.

Nav visibility must derive from fetched `GET /getUserdetails` data, loaded CFC child codes and the dashboard-segregation setting, not the current Demo User stub. Extend `IUserDetails` with the Angular fields consumed by shell identity/actions (`name`, `email`, `success_factors_role`, `profile_photo`, `switch_account_url`, `logoutUrl`, and `new_tags`) using appropriate optional types. Use the existing authenticated API client and query cache.

Port the Angular `NavService` rules, including:

- Feature/role flags: `sqf`, `sqf_enabled`, `sqa`, `quick_assist_enabled`, `wf`, `weekly_facts_enabled`, `my_plan_enabled`, `bqf`, `psf`, `psf_enabled`, `act` and `admin`.
- Portal-specific CFC behavior: SI/METRO retain Quick Assist; other portals suppress it. CFC users do not see Weekly Facts/My Plan (Trend).
- SI/METRO short labels and portal-specific navigation.
- Dashboard segregation: buying/store Dashboards links when segregated, otherwise one standalone Dashboards item.
- Angular route paths and `matchRoutes`/`excludeRoutes` behavior so only the intended nav item is active.
- Existing `new_tags` as `New!` badges. Keep `Soon` badges for destinations whose React pages are still placeholders.

Known Angular destinations that need Coming Soon coverage include `/quick-facts/quick-assist`, `/dashboards/*`, `/bqf/*`, `/price-simulator/*`, `/act/*`, `/admin/*` and `/help/*`. Existing aliases remain valid. Search UI must not submit or navigate.

## 3. Responsive UI and interactions

### Desktop rail

- Match Angular's 56px collapsed rail, 268px expanded rail, green colors, logo, iconography, labels, group dividers, active/hover states, badges and account block.
- Expand on hover; do not add a pin control that is not present in Angular's navigation template.
- Include the Angular nav links and the account menu (Switch account, Sign out). Switching account uses `switch_account_url` and the `switchedAccount` local-storage marker; sign-out uses `logoutUrl` after confirmation.
- Preserve Help and Admin links/shortcuts according to Angular's visibility rules.

### Mobile header and drawer

- Match Angular's 60px header, active top-level navigation title (for example, “My Insights” on Quick Facts), hamburger and account affordance at ≤768px.
- Hamburger opens the separate Angular-style slide-in navigation drawer; the drawer has a backdrop, logo/portal label, grouped feature-gated links, active state and Soon/New badges.
- Close the drawer on route selection, backdrop, close button or Escape; restore body scrolling on close/unmount.
- Account opens a bottom sheet showing available profile details and Switch Account/Sign Out actions. Sign out requires confirmation. Closing mechanisms must restore focus and body scrolling.
- Include the Dashboard search control/input UI where Angular presents it, but do not wire search execution, result navigation or search APIs.

### Quick Facts page-bar and footer

- On mobile Quick Facts routes only, show Angular-equivalent tabs determined by the same access flags, CFC rules and portal labels: Daily/Quick Facts, Weekly/Quick Assist, and Trend/Weekly Facts/My Plan.
- Active tab follows the route. Links preserve the relevant selected location/query state where Angular does. Quick Assist remains a Coming Soon destination.
- Keep the page-bar hidden on desktop and unrelated routes.
- Match the Angular shared footer and its scroll-hide and Back-to-top behavior, including the Weekly-related Back-to-top visibility rule already represented by the React footer.

## 4. Error handling and accessibility

- Do not silently substitute Demo User or fabricate account URLs when the user-details request fails; keep shell controls unavailable until required data is present and follow existing query/error handling conventions.
- Omit switch-account actions when the URL is absent. Do not navigate to an invalid target.
- Keep links as links and actions as buttons; expose expanded state and accessible names for menus/drawers. Preserve keyboard access, Escape handling, focus restoration and modal semantics.
- Do not add broad error catches around API or account actions.

## 5. Testing and acceptance

### Automated tests

- Nav-model tests for each access flag, portal-specific CFC behavior, portal labels, dashboard segregation, New!/Soon badges, route matching and exclusive active states.
- Component tests for desktop rail expansion, user menu and actions; mobile header, drawer, bottom sheet, keyboard/outside-click behavior and body-scroll cleanup.
- Page-bar tests for eligible items, labels, active routes, query preservation and mobile-only visibility.
- Footer tests for scroll-hide and Back-to-top behavior, including Weekly routes.
- Route tests confirm unmigrated destinations render Coming Soon rather than falling through to an unrelated redirect.

### Visual parity

Compare Angular `master` and React with equivalent user/feature fixtures at 1440×900, 900×800 and 390×844. Capture collapsed and expanded desktop rail, mobile drawer, page-bar and account states. Match component geometry, typography, icons, colors, spacing and responsive visibility against Angular templates and styles. Validate the Dashboard search UI visually without asserting search behavior.

Run the focused frontend tests and TypeScript build after implementation; do not claim visual parity based only on unit tests.

## 6. Phased implementation

1. Port the nav data model and required user/account data; add focused model tests.
2. Bring the desktop rail and its active/menu behavior into parity.
3. Bring the mobile header, drawer, account bottom sheet, visual-only search control and Quick Facts page-bar into parity.
4. Verify/refine shared footer behavior and run visual comparisons across the agreed viewports.

Each phase keeps existing React routes and Quick Facts functionality working. No unrelated pages are migrated as part of these phases.
