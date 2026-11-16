# Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `Header` component with a full app shell: collapsible left sidebar on desktop (56px → 290px on hover), top app bar + slide-in drawer on mobile. Add coming-soon stub pages for all non-live routes.

**Architecture:** New `AppShell` component wraps all routes and renders either `SideNav` (desktop, CSS-only hover expansion) or `MobileNav` (mobile, React state drawer toggle). PageBar and FilterBar switch from `position: fixed` to `position: sticky` to avoid left-offset math with the sidenav. CSS variables control breakpoint-specific offsets.

**Tech Stack:** React 18, TypeScript, React Router v6, CSS Modules, Vitest + React Testing Library

**Reference wireframes:**
- Desktop: `wireframes/wiq-dashboards-desktop-v2.html` — sidenav CSS at line ~5351, HTML at line ~6820
- Mobile: `wireframes/wiq-portal-mobile.html` — mob-appbar CSS at line ~5497, drawer CSS at line ~5646, HTML at line ~7300

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `index.html` | Add Material Icons + Material Symbols font links |
| Modify | `src/styles/globals.css` | Add `--sidenav-width`, `--mob-appbar-height`; simplify `--chrome-height` |
| Modify | `src/context/AuthContext.tsx` | Add `logout` function to context |
| Create | `src/pages/coming-soon/ComingSoon.tsx` | Shared coming-soon page |
| Create | `src/pages/coming-soon/ComingSoon.module.css` | Coming-soon styles |
| Create | `src/pages/coming-soon/ComingSoon.test.tsx` | Coming-soon tests |
| Create | `src/components/layout/SideNav/SideNav.tsx` | Desktop left sidebar |
| Create | `src/components/layout/SideNav/SideNav.module.css` | Sidebar styles |
| Create | `src/components/layout/SideNav/SideNav.test.tsx` | Sidebar tests |
| Create | `src/components/layout/MobileNav/MobileNav.tsx` | Mobile top bar + drawer |
| Create | `src/components/layout/MobileNav/MobileNav.module.css` | Mobile nav styles |
| Create | `src/components/layout/MobileNav/MobileNav.test.tsx` | Mobile nav tests |
| Create | `src/components/layout/AppShell/AppShell.tsx` | App shell wrapper |
| Create | `src/components/layout/AppShell/AppShell.module.css` | Shell layout |
| Create | `src/components/layout/AppShell/AppShell.test.tsx` | Shell tests |
| Modify | `src/App.tsx` | Wrap routes in AppShell; add 5 new routes |
| Modify | `src/pages/quick-facts/QuickFactsLayout.tsx` | Remove Header import |
| Modify | `src/pages/quick-facts/QuickFactsLayout.module.css` | Remove padding-top (sticky now handles it) |
| Modify | `src/components/layout/PageBar/PageBar.module.css` | Switch to `position: sticky` |
| Modify | `src/components/layout/FilterBar/FilterBar.module.css` | Switch to `position: sticky` |
| Delete | `src/components/layout/Header/Header.tsx` | Replaced by AppShell |
| Delete | `src/components/layout/Header/Header.module.css` | Replaced by AppShell |

---

## Task 1: Foundations — fonts, CSS vars, AuthContext logout

**Files:**
- Modify: `index.html`
- Modify: `src/styles/globals.css`
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Add Material Icons font links to index.html**

Replace `<title>react-scaffold-tmp</title>` with:

```html
    <title>My Insights</title>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
```

- [ ] **Step 2: Update CSS variables in globals.css**

Replace the `:root` block entirely:

```css
:root {
  /* Brand */
  --color-primary: #0C482C;
  --color-primary-text: #ffffff;

  /* Metric card status colours */
  --color-positive: #219653;
  --color-negative: #EB5757;
  --color-amber: #EF9C48;
  --color-neutral: #E1E0E1;
  --color-blue: #3F69AE;

  /* Typography */
  --color-text: #333333;
  --color-text-secondary: #676d70;
  --font-family: Arial, Helvetica, sans-serif;

  /* Surfaces */
  --color-border: #d3d3d3;
  --color-bg: #fafafa;
  --color-surface: #ffffff;

  /* Navigation layout — desktop defaults */
  --sidenav-width: 56px;
  --mob-appbar-height: 0px;

  /* Chrome heights */
  --page-bar-height: 48px;
  --filter-bar-height: 48px;

  /* Footer */
  --footer-height: 44px;
}

/* Mobile overrides */
@media (max-width: 767px) {
  :root {
    --sidenav-width: 0px;
    --mob-appbar-height: 56px;
  }
}
```

- [ ] **Step 3: Add logout to AuthContext**

Replace `src/context/AuthContext.tsx` entirely:

```tsx
// src/context/AuthContext.tsx
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface AuthUser {
  name: string
  portal: string
}

interface AuthContextType {
  user: AuthUser
  isAuthenticated: boolean
  logout: () => void
}

const STUB_USER: AuthUser = {
  name: 'Demo User',
  portal: 'WW',
}

const AuthContext = createContext<AuthContextType>({
  user: STUB_USER,
  isAuthenticated: true,
  logout: () => window.location.reload(),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  function logout() {
    // Phase 2: replace with real sign-out
    window.location.reload()
  }
  return (
    <AuthContext.Provider value={{ user: STUB_USER, isAuthenticated: true, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

/** Route guard — in Phase 1 always renders children */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <div>Please log in.</div>
  }
  return <>{children}</>
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "^src/" | grep -v "tree.test.ts"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
git add index.html src/styles/globals.css src/context/AuthContext.tsx
git commit -m "chore: add Material Icons fonts, navigation CSS vars, AuthContext logout

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: ComingSoon page

**Files:**
- Create: `src/pages/coming-soon/ComingSoon.tsx`
- Create: `src/pages/coming-soon/ComingSoon.module.css`
- Create: `src/pages/coming-soon/ComingSoon.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/pages/coming-soon/ComingSoon.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ComingSoon } from './ComingSoon'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<ComingSoon />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ComingSoon', () => {
  it('renders heading', () => {
    renderAt('/weekly')
    expect(screen.getByText('Coming Soon')).toBeDefined()
  })

  it('renders subtext', () => {
    renderAt('/weekly')
    expect(screen.getByText(/currently in development/i)).toBeDefined()
  })

  it('renders route name badge for /weekly', () => {
    renderAt('/weekly')
    expect(screen.getByTestId('coming-soon-badge').textContent).toBe('weekly')
  })

  it('renders route name badge for /dashboards', () => {
    renderAt('/dashboards')
    expect(screen.getByTestId('coming-soon-badge').textContent).toBe('dashboards')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/pages/coming-soon/ComingSoon.test.tsx 2>&1 | tail -8
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create ComingSoon.module.css**

```css
/* src/pages/coming-soon/ComingSoon.module.css */
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 12px;
  text-align: center;
  padding: 24px;
}

.icon {
  font-size: 56px;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.heading {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.subtext {
  font-size: 15px;
  color: var(--color-text-secondary);
  max-width: 320px;
  line-height: 1.6;
}

.badge {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  background: rgba(12, 72, 44, 0.08);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
}
```

- [ ] **Step 4: Create ComingSoon.tsx**

```tsx
// src/pages/coming-soon/ComingSoon.tsx
import { useLocation } from 'react-router-dom'
import styles from './ComingSoon.module.css'

export function ComingSoon() {
  const { pathname } = useLocation()
  const routeName = pathname.replace(/^\//, '').split('/')[0]

  return (
    <div className={styles.page}>
      <span className={`material-icons-outlined ${styles.icon}`}>rocket_launch</span>
      <h1 className={styles.heading}>Coming Soon</h1>
      <p className={styles.subtext}>This feature is currently in development.</p>
      <span className={styles.badge} data-testid="coming-soon-badge">{routeName}</span>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/pages/coming-soon/ComingSoon.test.tsx 2>&1 | tail -8
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/coming-soon/
git commit -m "feat: add ComingSoon stub page

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: SideNav component

**Files:**
- Create: `src/components/layout/SideNav/SideNav.tsx`
- Create: `src/components/layout/SideNav/SideNav.module.css`
- Create: `src/components/layout/SideNav/SideNav.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/layout/SideNav/SideNav.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import { SideNav } from './SideNav'

function renderNav(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <SideNav />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('SideNav', () => {
  it('renders all four nav items', () => {
    renderNav()
    expect(screen.getByText('Daily')).toBeDefined()
    expect(screen.getByText('Weekly')).toBeDefined()
    expect(screen.getByText('Trend')).toBeDefined()
    expect(screen.getByText('Dashboards')).toBeDefined()
  })

  it('marks Daily as active on /quick-facts', () => {
    renderNav('/quick-facts/summary')
    const daily = screen.getByText('Daily').closest('a')
    expect(daily?.dataset.active).toBe('true')
  })

  it('does not mark Weekly as active on /quick-facts', () => {
    renderNav('/quick-facts/summary')
    const weekly = screen.getByText('Weekly').closest('a')
    expect(weekly?.dataset.active).not.toBe('true')
  })

  it('marks Weekly as active on /weekly', () => {
    renderNav('/weekly')
    const weekly = screen.getByText('Weekly').closest('a')
    expect(weekly?.dataset.active).toBe('true')
  })

  it('renders user name from AuthContext', () => {
    renderNav()
    expect(screen.getByText('Demo User')).toBeDefined()
  })

  it('shows user menu when user row is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    expect(screen.getByText('Log out')).toBeDefined()
  })

  it('closes user menu when clicking outside', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    expect(screen.getByText('Log out')).toBeDefined()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Log out')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/components/layout/SideNav/SideNav.test.tsx 2>&1 | tail -8
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create SideNav.module.css**

```css
/* src/components/layout/SideNav/SideNav.module.css */

/* ── Hide on mobile ── */
@media (max-width: 767px) {
  .sidenav { display: none !important; }
}

.sidenav {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 56px;
  background: #0C482C;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  transition: width 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidenav:hover {
  width: 290px;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.18);
}

/* ── Logo ── */
.logo {
  display: flex;
  align-items: center;
  height: 64px;
  flex-shrink: 0;
  overflow: hidden;
  gap: 10px;
}

.logoIcon {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logoLabel {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.02em;
}

.sidenav:hover .logoLabel { opacity: 1; }

/* ── Nav items ── */
.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  gap: 2px;
  overflow: hidden;
}

.item {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px 0 13px;
  gap: 16px;
  cursor: pointer;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.65);
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-decoration: none;
  border-left: 3px solid transparent;
  box-sizing: border-box;
  transition: background 150ms, color 150ms;
  width: 100%;
}

.item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.itemActive {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #fff !important;
  border-left-color: #fff;
}

.itemIcon {
  font-size: 22px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
  color: inherit;
}

.itemLabel {
  opacity: 0;
  transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  line-height: 1;
}

.sidenav:hover .itemLabel { opacity: 1; }

.badge {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 3px;
  padding: 2px 5px;
  margin-left: auto;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.sidenav:hover .badge { opacity: 1; }

/* ── Footer ── */
.footer {
  margin-top: auto;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 0;
}

/* ── User section ── */
.userContainer { position: relative; }

.userRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
}

.userRow:hover { background: rgba(255, 255, 255, 0.06); }

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.userInfo {
  display: flex;
  flex-direction: column;
  opacity: 0;
  transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  min-width: 0;
}

.sidenav:hover .userInfo { opacity: 1; }

.userName {
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.userRole {
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  white-space: nowrap;
}

.userChevron {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0;
  transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidenav:hover .userChevron { opacity: 1; }

/* ── User popup menu ── */
.userMenu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  z-index: 1200;
  padding: 0 8px 4px;
}

.menuPanel {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px 0 rgba(0,0,0,.14), 0 1px 10px 0 rgba(0,0,0,.12);
  overflow: hidden;
  padding: 8px 0;
}

.menuItem {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  font-size: 14px;
  font-family: inherit;
  color: rgba(0, 0, 0, 0.87);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.menuItem:hover { background: rgba(0, 0, 0, 0.04); }

.menuIcon {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.54);
  flex-shrink: 0;
}
```

- [ ] **Step 4: Create SideNav.tsx**

```tsx
// src/components/layout/SideNav/SideNav.tsx
import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import styles from './SideNav.module.css'

const NAV_ITEMS = [
  { icon: 'today', label: 'Daily', to: '/quick-facts', prefix: '/quick-facts', badge: false },
  { icon: 'date_range', label: 'Weekly', to: '/weekly', prefix: '/weekly', badge: true },
  { icon: 'table_chart', label: 'Trend', to: '/trend', prefix: '/trend', badge: true },
  { icon: 'dashboard', label: 'Dashboards', to: '/dashboards', prefix: '/dashboards', badge: true },
]

const WW_LOGO = (
  <svg width="40" height="32" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#6BB453" d="M49.32,48.93c-1.21,0-2.35-.15-3.43-.42-1.78,2.44-4.07,4.55-6.73,6 2.35,1.28 4.98,2.04 7.79,2.04 10.77,0 18.09-11.2 18.96-20.72-.34,1.26-2.56,13.1-16.59,13.1z"/>
    <path fill="#5AB450" d="M52,19.17c-5.18,0-7.67,3.01-7.67,3.01 5.35,.54 11.91,4.31 11.91,12.12 0,7.59-4.97,11.03-9.03,12.18-.4,.7-.84,1.37-1.31,2.02 1.08,.27 2.22,.42 3.43,.42 14.04,0 16.25-11.84 16.59-13.1 .05-.6 .08-1.23 .08-1.86 0-10.67-8.15-14.77-14-14.77z"/>
    <path fill="#5AB450" d="M29.01,48.93c2.98,0 5.58-.91 7.67-2.37-.71,.21-1.59,.39-2.47,.39-3.96,0-12.11-2.93-12.11-12.65 0-7.81 6.57-11.58 11.91-12.12 0,0-2.49-3.01-7.67-3.01-5.85,0-14,4.09-14,14.77 0,.62 .03,1.25 .09,1.88 .32,1.28 2.5,13.11 16.58,13.11z"/>
    <path fill="#74B753" d="M34.2,46.95c.88,0 1.76-.18 2.47-.39 .96-.67 1.81-1.46 2.53-2.33-.49-.62-2.79-3.73-2.79-7.88 0-3.89 2.08-5.55 2.77-5.99-1.43-1.07-3.04-1.37-3.96-1.37-1.48,0-5.47,1.01-6.41,5.57-.03,.18-.06,.36-.09,.55-.1,.76-.15,1.6-.15,2.52 0,3.65 1.56,6.92 2.77,8.92 1.06,.27 2.05,.39 2.86,.39z"/>
    <path fill="#32A451" d="M39.24,25.37c-6.5,0-9.59,4.78-10.42,9.17 .94-4.56 4.93-5.57 6.41-5.57 .92,0 2.53,.31 3.96,1.37 1.56,1.16 2.9,3.12 2.9,6.26 0,2.67-1.04,5.4-2.88,7.61-2.3,2.76-5.85,4.7-10.2,4.7-14.08,0-16.25-11.83-16.59-13.1 .87,9.52 8.2,20.72 18.96,20.72 10.51,0 18.54-10.61 18.54-19.5 0-6.15-3.5-11.66-10.68-11.66z"/>
    <path fill="#88C14E" d="M39.43,21.75s-2.24-2.16-2.4-5.09c-.11-2.14 .75-5.41 4.14-7.22 7.92-4.24 14.81,1.93 14.01,5.92 0,0-5.9-2.68-11.34,.53-3.99,2.35-4.41,5.86-4.41,5.86z"/>
  </svg>
)

export function SideNav() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <nav className={styles.sidenav} aria-label="Main navigation">
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>{WW_LOGO}</div>
        <span className={styles.logoLabel}>My Insights</span>
      </div>

      {/* Nav items */}
      <div className={styles.nav}>
        {NAV_ITEMS.map(({ icon, label, to, prefix, badge }) => {
          const isActive = location.pathname === prefix || location.pathname.startsWith(prefix + '/')
          return (
            <NavLink
              key={to}
              to={to}
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
              data-active={isActive ? 'true' : undefined}
            >
              <span className={`material-icons-outlined ${styles.itemIcon}`}>{icon}</span>
              <span className={styles.itemLabel}>{label}</span>
              {badge && <span className={styles.badge}>Soon</span>}
            </NavLink>
          )
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.item}>
          <span className={`material-icons-outlined ${styles.itemIcon}`}>help_outline</span>
          <span className={styles.itemLabel}>Help</span>
        </button>

        <div className={styles.userContainer} ref={menuRef}>
          {menuOpen && (
            <div className={styles.userMenu}>
              <div className={styles.menuPanel}>
                <button className={styles.menuItem} onClick={() => setMenuOpen(false)}>
                  <span className={`material-icons-outlined ${styles.menuIcon}`}>supervised_user_circle</span>
                  Switch account
                </button>
                <button className={styles.menuItem} onClick={logout}>
                  <span className={`material-icons-outlined ${styles.menuIcon}`}>logout</span>
                  Log out
                </button>
              </div>
            </div>
          )}
          <button
            className={styles.userRow}
            onClick={() => setMenuOpen(o => !o)}
            data-testid="sidenav-user-trigger"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className={styles.avatar}>
              <span className="material-icons" style={{ fontSize: '22px' }}>account_circle</span>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.portal}</span>
            </div>
            <span className={`material-icons ${styles.userChevron}`}>
              {menuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/components/layout/SideNav/SideNav.test.tsx 2>&1 | tail -8
```

Expected: 7 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/SideNav/
git commit -m "feat: add SideNav desktop sidebar component

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: MobileNav component

**Files:**
- Create: `src/components/layout/MobileNav/MobileNav.tsx`
- Create: `src/components/layout/MobileNav/MobileNav.module.css`
- Create: `src/components/layout/MobileNav/MobileNav.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/layout/MobileNav/MobileNav.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import { MobileNav } from './MobileNav'

function renderNav(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <MobileNav />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('MobileNav', () => {
  it('renders app bar', () => {
    renderNav()
    expect(screen.getByTestId('mobile-appbar')).toBeDefined()
  })

  it('shows "Quick Facts" title on /quick-facts', () => {
    renderNav('/quick-facts/summary')
    expect(screen.getByTestId('mobile-title').textContent).toBe('Quick Facts')
  })

  it('shows "Weekly" title on /weekly', () => {
    renderNav('/weekly')
    expect(screen.getByTestId('mobile-title').textContent).toBe('Weekly')
  })

  it('shows "Trend" title on /trend', () => {
    renderNav('/trend')
    expect(screen.getByTestId('mobile-title').textContent).toBe('Trend')
  })

  it('drawer is closed by default', () => {
    renderNav()
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('opens drawer when hamburger is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('false')
  })

  it('closes drawer when close button is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    fireEvent.click(screen.getByTestId('mobile-drawer-close'))
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('closes drawer when backdrop is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    fireEvent.click(screen.getByTestId('mobile-backdrop'))
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders all nav groups', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    expect(screen.getByText('Buying')).toBeDefined()
    expect(screen.getByText('Store')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/components/layout/MobileNav/MobileNav.test.tsx 2>&1 | tail -8
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create MobileNav.module.css**

```css
/* src/components/layout/MobileNav/MobileNav.module.css */

/* ── Hide on desktop ── */
@media (min-width: 768px) {
  .appbar { display: none !important; }
  .backdrop { display: none !important; }
  .drawer { display: none !important; }
}

/* ── App bar ── */
.appbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #0C482C;
  display: flex;
  align-items: center;
  padding: 0 4px;
  z-index: 1100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
}

.iconBtn {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms;
}

.iconBtn:hover { background: rgba(255, 255, 255, 0.08); }

.title {
  flex: 1;
  display: flex;
  align-items: center;
  margin-left: 4px;
  overflow: hidden;
  color: #fff;
  gap: 0;
}

.titleLabel {
  font-size: 18px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.titleTagline {
  font-size: 11px;
  font-weight: 400;
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.titleTagline::before {
  content: " · ";
  color: rgba(255, 255, 255, 0.5);
  font-style: normal;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #146a30;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  margin: 0 8px;
  flex-shrink: 0;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
}

/* ── Backdrop ── */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1198;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}

.backdropOpen {
  opacity: 1;
  pointer-events: auto;
}

/* ── Drawer ── */
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 296px;
  max-width: 85vw;
  background: #fff;
  z-index: 1200;
  transform: translateX(-100%);
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.18);
  color: var(--color-text);
  font-family: var(--font-family);
}

.drawerOpen { transform: translateX(0); }

.drawerHeader {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
}

.drawerLogoIcon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.drawerLogoLabel {
  color: var(--color-text);
  font-size: 16px;
  font-weight: 700;
  flex: 1;
}

.drawerClose {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  color: #616161;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms;
}

.drawerClose:hover { background: rgba(0, 0, 0, 0.04); }

.drawerNav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ── Group label ── */
.groupLabel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px 16px 6px;
  height: 20px;
}

.groupLabelLine {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

.groupLabelText {
  position: relative;
  z-index: 1;
  background: #fff;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* ── Drawer items ── */
.drawerItem {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 48px;
  padding: 0 16px;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 400;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  position: relative;
  overflow: hidden;
  transition: background 150ms;
  text-decoration: none;
}

.drawerItem:hover { background: rgba(0, 0, 0, 0.04); }

.drawerItemActive {
  color: #0C482C !important;
  font-weight: 500;
  background: #edf5f0 !important;
}

.drawerItemActive::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #0C482C;
}

.drawerItemIcon {
  font-size: 22px;
  color: #616161;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.drawerItemActive .drawerItemIcon { color: #0C482C; }

/* ── Drawer footer ── */
.drawerFooter {
  padding: 0 0 16px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}
```

- [ ] **Step 4: Create MobileNav.tsx**

```tsx
// src/components/layout/MobileNav/MobileNav.tsx
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import styles from './MobileNav.module.css'

const ROUTE_TITLES: Record<string, { title: string; tagline?: string }> = {
  '/quick-facts': { title: 'Quick Facts', tagline: 'powered by Quick Facts' },
  '/weekly':      { title: 'Weekly' },
  '/trend':       { title: 'Trend' },
  '/dashboards':  { title: 'Dashboards' },
  '/pricing-simulator':     { title: 'Pricing Simulator' },
  '/availability-navigator':{ title: 'Availability Navigator' },
}

const BUYING_ITEMS = [
  { icon: 'calendar_today', label: 'Quick Facts',       to: '/quick-facts' },
  { icon: 'dashboard',      label: 'Dashboards',        to: '/dashboards' },
  { icon: 'attach_money',   label: 'Pricing Simulator', to: '/pricing-simulator' },
]

const STORE_ITEMS = [
  { icon: 'today',        label: 'Daily',      to: '/quick-facts' },
  { icon: 'date_range',   label: 'Weekly',     to: '/weekly' },
  { icon: 'table_chart',  label: 'Trend',      to: '/trend' },
  { icon: 'dashboard',    label: 'Dashboards', to: '/dashboards' },
]

const STANDALONE_ITEMS = [
  { icon: 'shelves', label: 'Availability Navigator', to: '/availability-navigator', isSymbol: true },
]

const WW_LOGO = (
  <svg width="40" height="32" viewBox="0 0 80 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="#6BB453" d="M49.32,48.93c-1.21,0-2.35-.15-3.43-.42-1.78,2.44-4.07,4.55-6.73,6 2.35,1.28 4.98,2.04 7.79,2.04 10.77,0 18.09-11.2 18.96-20.72-.34,1.26-2.56,13.1-16.59,13.1z"/>
    <path fill="#5AB450" d="M52,19.17c-5.18,0-7.67,3.01-7.67,3.01 5.35,.54 11.91,4.31 11.91,12.12 0,7.59-4.97,11.03-9.03,12.18-.4,.7-.84,1.37-1.31,2.02 1.08,.27 2.22,.42 3.43,.42 14.04,0 16.25-11.84 16.59-13.1 .05-.6 .08-1.23 .08-1.86 0-10.67-8.15-14.77-14-14.77z"/>
    <path fill="#5AB450" d="M29.01,48.93c2.98,0 5.58-.91 7.67-2.37-.71,.21-1.59,.39-2.47,.39-3.96,0-12.11-2.93-12.11-12.65 0-7.81 6.57-11.58 11.91-12.12 0,0-2.49-3.01-7.67-3.01-5.85,0-14,4.09-14,14.77 0,.62 .03,1.25 .09,1.88 .32,1.28 2.5,13.11 16.58,13.11z"/>
    <path fill="#74B753" d="M34.2,46.95c.88,0 1.76-.18 2.47-.39 .96-.67 1.81-1.46 2.53-2.33-.49-.62-2.79-3.73-2.79-7.88 0-3.89 2.08-5.55 2.77-5.99-1.43-1.07-3.04-1.37-3.96-1.37-1.48,0-5.47,1.01-6.41,5.57-.03,.18-.06,.36-.09,.55-.1,.76-.15,1.6-.15,2.52 0,3.65 1.56,6.92 2.77,8.92 1.06,.27 2.05,.39 2.86,.39z"/>
    <path fill="#32A451" d="M39.24,25.37c-6.5,0-9.59,4.78-10.42,9.17 .94-4.56 4.93-5.57 6.41-5.57 .92,0 2.53,.31 3.96,1.37 1.56,1.16 2.9,3.12 2.9,6.26 0,2.67-1.04,5.4-2.88,7.61-2.3,2.76-5.85,4.7-10.2,4.7-14.08,0-16.25-11.83-16.59-13.1 .87,9.52 8.2,20.72 18.96,20.72 10.51,0 18.54-10.61 18.54-19.5 0-6.15-3.5-11.66-10.68-11.66z"/>
    <path fill="#88C14E" d="M39.43,21.75s-2.24-2.16-2.4-5.09c-.11-2.14 .75-5.41 4.14-7.22 7.92-4.24 14.81,1.93 14.01,5.92 0,0-5.9-2.68-11.34,.53-3.99,2.35-4.41,5.86-4.41,5.86z"/>
  </svg>
)

function getRouteInfo(pathname: string) {
  const key = Object.keys(ROUTE_TITLES).find(
    k => pathname === k || pathname.startsWith(k + '/')
  )
  return key ? ROUTE_TITLES[key] : { title: 'My Insights' }
}

function DrawerItem({
  icon, label, to, isActive, isSymbol, onClick,
}: {
  icon: string; label: string; to: string; isActive: boolean; isSymbol?: boolean; onClick: () => void
}) {
  const iconClass = isSymbol ? 'material-symbols-outlined' : 'material-icons-outlined'
  return (
    <NavLink
      to={to}
      className={`${styles.drawerItem} ${isActive ? styles.drawerItemActive : ''}`}
      onClick={onClick}
    >
      <span className={`${iconClass} ${styles.drawerItemIcon}`}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export function MobileNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { title, tagline } = getRouteInfo(location.pathname)
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  function close() { setDrawerOpen(false) }

  function isItemActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  return (
    <>
      {/* App bar */}
      <header className={styles.appbar} data-testid="mobile-appbar">
        <button
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          data-testid="mobile-menu-btn"
        >
          <span className="material-icons">menu</span>
        </button>
        <div className={styles.title}>
          <span className={styles.titleLabel} data-testid="mobile-title">{title}</span>
          {tagline && <span className={styles.titleTagline}>{tagline}</span>}
        </div>
        <button className={styles.iconBtn} aria-label="Help">
          <span className="material-icons-outlined">help_outline</span>
        </button>
        <button className={styles.avatar} aria-label="User menu">
          {initials}
        </button>
      </header>

      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${drawerOpen ? styles.backdropOpen : ''}`}
        onClick={close}
        data-testid="mobile-backdrop"
        aria-hidden="true"
      />

      {/* Drawer */}
      <nav
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!drawerOpen}
        aria-label="Main navigation"
        data-testid="mobile-drawer"
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerLogoIcon}>{WW_LOGO}</div>
          <span className={styles.drawerLogoLabel}>Insights Portal</span>
          <button
            className={styles.drawerClose}
            onClick={close}
            aria-label="Close navigation"
            data-testid="mobile-drawer-close"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className={styles.drawerNav}>
          {/* Buying group */}
          <div>
            <div className={styles.groupLabel}>
              <div className={styles.groupLabelLine} />
              <span className={styles.groupLabelText}>Buying</span>
            </div>
            {BUYING_ITEMS.map(item => (
              <DrawerItem key={item.to + item.label} {...item} isActive={isItemActive(item.to)} onClick={close} />
            ))}
          </div>

          {/* Store group */}
          <div>
            <div className={styles.groupLabel}>
              <div className={styles.groupLabelLine} />
              <span className={styles.groupLabelText}>Store</span>
            </div>
            {STORE_ITEMS.map(item => (
              <DrawerItem key={item.to + item.label} {...item} isActive={isItemActive(item.to)} onClick={close} />
            ))}
          </div>

          {/* Standalone group */}
          <div>
            <div className={styles.groupLabel}>
              <div className={styles.groupLabelLine} />
            </div>
            {STANDALONE_ITEMS.map(item => (
              <DrawerItem key={item.to} {...item} isActive={isItemActive(item.to)} onClick={close} />
            ))}
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button className={styles.drawerItem}>
            <span className={`material-icons-outlined ${styles.drawerItemIcon}`}>help_outline</span>
            <span>Help</span>
          </button>
        </div>
      </nav>
    </>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/components/layout/MobileNav/MobileNav.test.tsx 2>&1 | tail -8
```

Expected: 9 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/MobileNav/
git commit -m "feat: add MobileNav top bar and slide-in drawer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: AppShell component

**Files:**
- Create: `src/components/layout/AppShell/AppShell.tsx`
- Create: `src/components/layout/AppShell/AppShell.module.css`
- Create: `src/components/layout/AppShell/AppShell.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/layout/AppShell/AppShell.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import { AppShell } from './AppShell'

function renderShell(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppShell>
          <div data-testid="content">Hello</div>
        </AppShell>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('AppShell', () => {
  it('renders children', () => {
    renderShell()
    expect(screen.getByTestId('content')).toBeDefined()
  })

  it('renders SideNav', () => {
    renderShell()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined()
  })

  it('renders MobileNav app bar', () => {
    renderShell()
    expect(screen.getByTestId('mobile-appbar')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/components/layout/AppShell/AppShell.test.tsx 2>&1 | tail -8
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create AppShell.module.css**

```css
/* src/components/layout/AppShell/AppShell.module.css */
.shell {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
  /* Desktop: offset for sidenav */
  margin-left: var(--sidenav-width);
  /* Mobile: offset for top app bar */
  padding-top: var(--mob-appbar-height);
  transition: margin-left 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 4: Create AppShell.tsx**

```tsx
// src/components/layout/AppShell/AppShell.tsx
import type { ReactNode } from 'react'
import { SideNav } from '../SideNav/SideNav'
import { MobileNav } from '../MobileNav/MobileNav'
import styles from './AppShell.module.css'

interface Props {
  children: ReactNode
}

export function AppShell({ children }: Props) {
  return (
    <div className={styles.shell}>
      <SideNav />
      <MobileNav />
      <div className={styles.main}>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/components/layout/AppShell/AppShell.test.tsx 2>&1 | tail -8
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/AppShell/
git commit -m "feat: add AppShell layout wrapper

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Wire App.tsx, fix layout, delete Header

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/quick-facts/QuickFactsLayout.tsx`
- Modify: `src/pages/quick-facts/QuickFactsLayout.module.css`
- Modify: `src/components/layout/PageBar/PageBar.module.css`
- Modify: `src/components/layout/FilterBar/FilterBar.module.css`
- Delete: `src/components/layout/Header/Header.tsx`
- Delete: `src/components/layout/Header/Header.module.css`

- [ ] **Step 1: Replace App.tsx**

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell/AppShell'
import { QuickFactsLayout } from './pages/quick-facts/QuickFactsLayout'
import { SummaryPage } from './pages/quick-facts/SummaryPage'
import { DetailsPage } from './pages/quick-facts/DetailsPage'
import { ComingSoon } from './pages/coming-soon/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route
            path="/quick-facts"
            element={
              <ProtectedRoute>
                <QuickFactsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="summary" replace />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="details/:type" element={<DetailsPage />} />
          </Route>

          <Route path="/weekly" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/trend" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/dashboards" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/pricing-simulator" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/availability-navigator" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/quick-facts" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Update QuickFactsLayout.tsx — remove Header**

Replace `src/pages/quick-facts/QuickFactsLayout.tsx` entirely:

```tsx
// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { PageBar } from '../../components/layout/PageBar/PageBar'
import { FilterBar } from '../../components/layout/FilterBar/FilterBar'
import styles from './QuickFactsLayout.module.css'

export function QuickFactsLayout() {
  return (
    <FilterProvider>
      <PageBar />
      <FilterBar />
      <div className={styles.content}>
        <Outlet />
      </div>
      <footer className={styles.footer}>
        <span>Store Insights · Powered by Quick Facts</span>
      </footer>
    </FilterProvider>
  )
}
```

- [ ] **Step 3: Update QuickFactsLayout.module.css — remove chrome padding**

Replace with:

```css
/* src/pages/quick-facts/QuickFactsLayout.module.css */
.content {
  /* PageBar (48px) + FilterBar (48px) are sticky — they take up space naturally */
}

.footer {
  position: fixed;
  bottom: 0;
  left: var(--sidenav-width);
  right: 0;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  height: var(--footer-height);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #999;
  z-index: 100;
}
```

- [ ] **Step 4: Update PageBar.module.css — switch to sticky**

Replace `.container` block:

```css
/* src/components/layout/PageBar/PageBar.module.css */
.container {
  position: sticky;
  top: var(--mob-appbar-height);   /* 0 on desktop, 56px on mobile */
  left: 0;
  right: 0;
  z-index: 950;
  background: var(--color-surface);
}

.bar {
  display: flex;
  width: 100%;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  scrollbar-width: none;
}
.bar::-webkit-scrollbar { display: none; }

.item {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 16px;
  line-height: 1.5;
  flex: 0 0 auto;
  padding: 0 16px;
  height: var(--page-bar-height);
  display: flex;
  align-items: center;
  border-bottom: 4px solid transparent;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.1s;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: var(--font-family);
}

.itemActive {
  opacity: 1;
  border-bottom-color: var(--color-primary);
}
```

- [ ] **Step 5: Update FilterBar.module.css — switch to sticky**

Replace the `top:` and `position:` lines in `.filterBar`:

```css
/* src/components/layout/FilterBar/FilterBar.module.css */
.filterBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  min-height: var(--filter-bar-height);
  width: 100%;
  position: sticky;
  top: calc(var(--mob-appbar-height) + var(--page-bar-height));
  z-index: 900;
}
```

Leave all other rules (`.left`, `.dropdown`, `.dropdownTrigger`, etc.) completely unchanged.

- [ ] **Step 6: Delete Header files**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
rm src/components/layout/Header/Header.tsx
rm src/components/layout/Header/Header.module.css
```

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -E "^src/" | grep -v "tree.test.ts"
```

Expected: no errors.

- [ ] **Step 8: Run all tests**

```bash
npx vitest run 2>&1 | tail -15
```

Expected: all tests pass. If any test imports from `Header`, update it to not reference `Header`. (Currently no test file imports `Header` — verified by search.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: wire AppShell into App, remove Header, fix sticky nav positioning

- App.tsx uses AppShell + adds 5 coming-soon routes
- QuickFactsLayout drops Header (provided by AppShell)
- PageBar and FilterBar switch from fixed to sticky using CSS vars
- QuickFactsLayout footer uses --sidenav-width offset
- Header files deleted

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run 2>&1 | tail -20
```

Expected output: All test files pass. Count should be higher than before (new tests added). No failures.

- [ ] **Step 2: Build check**

```bash
npx vite build 2>&1 | tail -10
```

Expected: `✓ built in Xms` — no errors (chunk size warning is pre-existing, not a failure).

- [ ] **Step 3: Final commit if any loose files**

```bash
git status
# If clean, nothing to do.
# If any untracked files remain, stage and commit them.
```
