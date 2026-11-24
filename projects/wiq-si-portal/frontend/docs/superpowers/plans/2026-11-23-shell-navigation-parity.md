# Shell Navigation Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining desktop/mobile navigation and account-action gaps against Angular `master`.

**Architecture:** Refine the existing nav model and shell components. Keep desktop sign-out behavior separate from the mobile bottom-sheet flow, and preserve Coming Soon badges and routes.

**Tech Stack:** React 19, React Router, TypeScript, SCSS modules, Vitest, Testing Library.

---

### Task 1: Match non-SI navigation ordering

**Files:**
- Modify: `src/app/layout/navItems.ts`
- Test: `src/app/layout/navItems.test.ts`

- [ ] **Step 1: Add a failing ordering regression**

Add a non-SI user with Quick Facts, Quick Assist, and Weekly Facts enabled:

```ts
it('orders non-SI Store items as Quick Facts, Weekly Facts, then Quick Assist', () => {
  const user: IUserDetails = {
    sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1,
    wf: 1, weekly_facts_enabled: 1,
  }
  expect(labels(user, false, 'BIG W')).toEqual([
    'Quick Facts', 'Weekly Facts', 'Quick Assist', 'Dashboards', 'Help',
  ])
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run from `projects/wiq-si-portal/frontend`:

```bash
npm test -- --run src/app/layout/navItems.test.ts -t 'orders non-SI Store'
```

Expected: FAIL because the current non-SI model inserts Quick Assist before Weekly Facts.

- [ ] **Step 3: Change only non-SI item insertion order**

In `buildNavGroups` in `src/app/layout/navItems.ts`, build the `store` array in this order for non-short-label portals: Quick Facts, Weekly Facts/My Plan, Quick Assist, then Store Dashboards. Keep SI/METRO order Daily, Weekly, Trend, Dashboards.

- [ ] **Step 4: Run nav-model regressions**

Run:

```bash
npm test -- --run src/app/layout/navItems.test.ts
```

Expected: PASS, including existing SI/METRO ordering, CFC visibility, labels, and active-route cases.

### Task 2: Match mobile header and drawer

**Files:**
- Modify: `src/app/layout/MobileNav/MobileNav.tsx`
- Modify: `src/app/layout/MobileNav/MobileNav.module.scss`
- Test: `src/app/layout/MobileNav/MobileNav.test.tsx`

- [ ] **Step 1: Add failing mobile header/drawer assertions**

Replace the existing Dashboard-search visibility assertion with:

```ts
it('does not render Dashboard search on mobile', () => {
  renderNav('/dashboards')
  expect(screen.queryByRole('searchbox', { name: 'Search Dashboards' })).not.toBeInTheDocument()
})
```

Add assertions that Admin has no title, the non-SI drawer renders Quick Facts/Weekly Facts/Quick Assist in that order, the Help link points to `/help/access`, and no `New!` text appears inside the drawer. Keep assertions that Soon remains present for Coming Soon destinations.

- [ ] **Step 2: Run the focused component tests and confirm failure**

Run:

```bash
npm test -- --run src/app/layout/MobileNav/MobileNav.test.tsx
```

Expected: FAIL on the existing mobile search, Admin title, Help path, ordering, and drawer New! assertions.

- [ ] **Step 3: Implement Angular-equivalent mobile header behavior**

In `MobileNav.tsx`, resolve the title and its destination from the active Angular header-nav item/access model. Render the title as a `Link`; render no title for `/admin` routes. Remove the Dashboard search control. Point the drawer Help item to `/help/access`, and render drawer items without `New!` while retaining `Soon`.

- [ ] **Step 4: Run mobile header/drawer tests**

Run:

```bash
npm test -- --run src/app/layout/MobileNav/MobileNav.test.tsx src/app/layout/navItems.test.ts
```

Expected: PASS, with mobile search absent and the title, link order, active state, accessibility, and dismissal behaviors covered.

### Task 3: Match mobile account and sign-out sheets

**Files:**
- Modify: `src/app/layout/MobileNav/MobileAccountSheet.tsx`
- Modify: `src/app/layout/MobileNav/MobileAccountSheet.module.scss`
- Test: `src/app/layout/MobileNav/MobileAccountSheet.test.tsx`
- Test: `src/app/layout/MobileNav/MobileNav.test.tsx`

- [ ] **Step 1: Add failing account-sheet behavior tests**

Add tests that:

```tsx
it('shows Switch Account and Sign Out disabled when their URLs are missing', () => {
  render(<MobileAccountSheet user={{ ...fullAccessUser, switch_account_url: undefined, logoutUrl: undefined }} onClose={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Switch Account' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Sign Out' })).toBeDisabled()
})
```

Also assert that Sign Out replaces the user sheet with an Angular-style confirmation sheet, Cancel closes the confirmation, and `popstate` closes whichever sheet is active without navigating. Keep the existing desktop `LogoutConfirmationDialog` tests unchanged.

- [ ] **Step 2: Run account-sheet tests and confirm failure**

Run:

```bash
npm test -- --run src/app/layout/MobileNav/MobileAccountSheet.test.tsx
```

Expected: FAIL because the current account sheet omits missing-URL actions and opens the desktop dialog.

- [ ] **Step 3: Implement the mobile confirmation state**

Always render the two Angular account actions. Disable each action if its required URL is missing. On Sign Out, close/replace the account sheet and show a mobile confirmation sheet with title `Sign out?`, Angular subtitle text, a red `Sign Out` button and `Cancel`. On confirmation, navigate to `logoutUrl`; on Cancel, Escape, backdrop or `popstate`, close the confirmation. Preserve the existing `switchedAccount=yes` behavior and restore the account-button focus/body overflow when the account flow ends.

- [ ] **Step 4: Run account-sheet and shell tests**

Run:

```bash
npm test -- --run src/app/layout/MobileNav/MobileAccountSheet.test.tsx src/app/layout/MobileNav/MobileNav.test.tsx src/app/layout/SideNav/SideNav.test.tsx
```

Expected: PASS; desktop menu/dialog behavior remains unchanged and mobile confirmation does not use the desktop dialog.

### Task 4: Verify shell parity

**Files:**
- No additional files.

- [ ] **Step 1: Run all shell tests**

Run:

```bash
npm test -- --run src/app/layout/navItems.test.ts src/app/layout/SideNav/SideNav.test.tsx src/app/layout/MobileNav/MobileNav.test.tsx src/app/layout/MobileNav/MobileAccountSheet.test.tsx
```

Expected: all selected tests pass.

- [ ] **Step 2: Type-check the frontend**

Run:

```bash
npx tsc -b
```

Expected: exit code 0.

- [ ] **Step 3: Compare the shell visually**

At 390×844, compare Angular `master` and React mobile header, drawer, user sheet, and sign-out confirmation. At 1440×900, verify the existing desktop rail and account menu did not regress.

Do not commit or push implementation changes unless requested.
