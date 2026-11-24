# App Route Lifecycle Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Angular-compatible route analytics, configured first-visit intro videos, and one-time stale-chunk recovery.

**Architecture:** Keep route-dependent behavior in a small app-level lifecycle component, Quick Facts location analytics inside the existing filter provider, video transport in the shared user API, and Vite preload recovery in a small app startup utility.

**Tech Stack:** React 19, React Router, TanStack Query, TypeScript, Fetch API, Vite, Vitest, Testing Library, MSW.

---

### Task 1: Restore route-navigation analytics

**Files:**
- Create: `src/app/RouteLifecycle/RouteLifecycle.tsx`
- Create: `src/app/RouteLifecycle/RouteLifecycle.test.tsx`
- Create: `src/app/RouteLifecycle/routeAnalytics.ts`
- Create: `src/app/RouteLifecycle/routeAnalytics.test.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/layout/QuickFactsLayout/QuickFactsLayout.tsx`
- Create: `src/app/RouteLifecycle/QuickFactsAnalytics.tsx`
- Create: `src/app/RouteLifecycle/QuickFactsAnalytics.test.tsx`
- Modify: `src/shared/api/users.ts`

- [ ] **Step 1: Add failing route-event tests**

Use `MemoryRouter` and a synthetic user to assert each non-Quick-Facts path pushes the Angular navigation-event keys, with undefined dashboard metadata for placeholders and `Information Page` for `/dashboards/info`. Assert the GTM bootstrap is not duplicated. In the Quick Facts provider test, assert the event includes the selected node code and changes when the selected location changes.

- [ ] **Step 2: Run the tests and confirm failure**

Run:

```bash
npm test -- --run src/app/RouteLifecycle/routeAnalytics.test.ts src/app/RouteLifecycle/QuickFactsAnalytics.test.tsx
```

Expected: FAIL because navigation analytics do not exist.

- [ ] **Step 3: Add a typed route-event helper**

In `routeAnalytics.ts`, export a typed `pushRouteAnalytics` helper and push:

```ts
{
  'gtm.start': Date.now(),
  event: 'gtm.js',
  dashboardTitle,
  dashboardType,
  employeeNumber: user.employee_number,
  siRole: user.Store_Insights_Role,
  selectedLocation,
}
```

Use the existing `['user-details']` Query entry; do not call the API again outside the cache. `RouteLifecycle.tsx` calls the helper once for each non-QF route transition. Handle `/dashboards/info` with `dashboardType: 'Information Page'`; use undefined title/type when dashboard metadata is not loaded.

- [ ] **Step 4: Add Quick Facts location events in the filter scope**

Render `QuickFactsAnalytics` inside `QuickFactsLayout`'s `FilterProvider`. On each Quick Facts route/filter transition after `selectedNode` is present, emit the same event shape with `selectedLocation: selectedNode.code`. Exclude Quick Facts in the global route component to avoid duplicate navigation events. Do not change existing `quick_facts_element_click` calls.

- [ ] **Step 5: Run analytics regressions**

Run:

```bash
npm test -- --run src/app/RouteLifecycle/routeAnalytics.test.ts src/app/RouteLifecycle/QuickFactsAnalytics.test.tsx src/shared/utils/analytics.test.ts
```

Expected: PASS with no duplicate QF route events or regressions to existing element-click analytics.

### Task 2: Add Angular-compatible first-visit intro videos

**Files:**
- Modify: `src/shared/api/users.ts`
- Create: `src/shared/api/users.http.test.ts`
- Create: `src/shared/components/IntroVideoDialog/IntroVideoDialog.tsx`
- Create: `src/shared/components/IntroVideoDialog/IntroVideoDialog.module.scss`
- Create: `src/shared/components/IntroVideoDialog/IntroVideoDialog.test.tsx`
- Modify: `src/app/RouteLifecycle/RouteLifecycle.tsx`
- Modify: `src/app/RouteLifecycle/RouteLifecycle.test.tsx`
- Modify: `src/app/App.test.tsx`

- [ ] **Step 1: Add failing user API contract tests**

Add HTTP tests for:

```ts
await updateIntroVideoFlag({ sqf_video_flag: 1 })
expect(request).toHaveBeenCalledWith('/updatevideoflag', { sqf_video_flag: 1 })
```

Also assert the user type accepts the four Angular video URL fields and three persisted flags, and that non-2xx flag updates reject.

- [ ] **Step 2: Run the API test and confirm failure**

Run:

```bash
npm test -- --run src/shared/api/users.http.test.ts
```

Expected: FAIL because the flag updater and intro-video fields are absent.

- [ ] **Step 3: Add the typed endpoint**

Extend `IUserDetails` with `sqf_video`, `bqf_video`, `dashboards_video`, `psim_video`, `sqf_video_flag`, `bqf_video_flag`, and `dashboards_video_flag`. Add `updateIntroVideoFlag(payload)` using `client.post('/updatevideoflag', payload)` and return its response without swallowing errors.

- [ ] **Step 4: Add failing intro-video dialog tests**

Assert the component:

- converts a Google Drive `/view` URL to `/preview` for the iframe;
- provides a Google Drive `/view` fallback link;
- does not close on backdrop or Escape;
- invokes its explicit close callback and shows an update error without closing when the flag mutation rejects.

- [ ] **Step 5: Run the component test and confirm failure**

Run:

```bash
npm test -- --run src/shared/components/IntroVideoDialog/IntroVideoDialog.test.tsx
```

Expected: FAIL because the dialog does not exist.

- [ ] **Step 6: Implement the video dialog**

Use the existing `Dialog` with `disableClose`, Angular's welcome text, a responsive iframe with `allow="autoplay"`, the fallback anchor, and an explicit close button. Keep update errors visible and the dialog open until the user-flag update succeeds.

- [ ] **Step 7: Select videos by route and persisted flags**

In `RouteLifecycle.tsx`, choose only one video using Angular's route order:

```ts
if (pathname.startsWith('/bqf') && user.bqf_video && !user.bqf_video_flag) { /* BQF */ }
else if (pathname.startsWith('/quick-facts') && user.sqf_video && !user.sqf_video_flag) { /* SQF */ }
else if (pathname.startsWith('/dashboards') && user.dashboards_video && !user.dashboards_video_flag) { /* dashboards */ }
else if (pathname.startsWith('/price-simulator') && user.psim_video &&
         localStorage.getItem('psimVideoFlag') !== 'yes' &&
         localStorage.getItem('corsErrorHappened') === 'yes') { /* price simulator */ }
```

On explicit close, post the matching flag (`bqf_video_flag`, `sqf_video_flag`, or `dashboards_video_flag`) as `1`; for Pricing Simulator, set `psimVideoFlag=yes` without the API call. Render the lifecycle component for Coming Soon routes too.

- [ ] **Step 8: Test route/flag selection and persistence**

Extend `App.test.tsx` using the existing mocked client to cover each route, already-viewed flags, missing URLs, Pricing Simulator local-storage conditions, successful close, and API failure. Run:

```bash
npm test -- --run src/shared/api/users.http.test.ts src/shared/components/IntroVideoDialog/IntroVideoDialog.test.tsx src/app/App.test.tsx
```

Expected: PASS, with no popup when a route does not match or its video is already marked viewed.

### Task 3: Recover from one stale Vite chunk load per session

**Files:**
- Create: `src/app/staleChunkRecovery.ts`
- Create: `src/app/staleChunkRecovery.test.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add a failing stale-chunk listener test**

Assert that a cancelable `vite:preloadError` event is prevented, sets `sessionStorage['si-stale-chunk-reload']`, and calls the supplied reload callback once. With the guard already set, dispatching the event must not reload again.

- [ ] **Step 2: Run the test and confirm failure**

Run:

```bash
npm test -- --run src/app/staleChunkRecovery.test.ts
```

Expected: FAIL because no listener exists.

- [ ] **Step 3: Implement the one-time recovery utility**

Export `installStaleChunkRecovery(reload = () => window.location.reload())` from `staleChunkRecovery.ts`. Register a `vite:preloadError` listener, call `preventDefault()`, and reload only if `sessionStorage.getItem('si-stale-chunk-reload')` is empty; set it to `1` before reload. Do not intercept ordinary `error` or `unhandledrejection` events.

- [ ] **Step 4: Install recovery before rendering**

Call `installStaleChunkRecovery()` in `main.tsx` before `createRoot(...).render(...)`, so the listener is available before route chunks can load.

- [ ] **Step 5: Run stale-chunk tests**

Run:

```bash
npm test -- --run src/app/staleChunkRecovery.test.ts
```

Expected: PASS for first recovery and loop prevention.

### Task 4: Verify route lifecycle behavior

**Files:**
- No additional files.

- [ ] **Step 1: Run lifecycle and route integration tests**

Run:

```bash
npm test -- --run src/app/RouteLifecycle src/app/staleChunkRecovery.test.ts src/app/App.test.tsx src/shared/api/users.http.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 2: Type-check**

Run `npx tsc -b` from `projects/wiq-si-portal/frontend`; expected exit code 0.

- [ ] **Step 3: Verify browser behavior**

At 390×844 and 1440×900, verify the explicit video close/update lifecycle, iframe fallback link, route-specific video selection on Coming Soon pages, and that unrelated page transitions do not show videos.

Do not commit or push implementation changes unless requested.
