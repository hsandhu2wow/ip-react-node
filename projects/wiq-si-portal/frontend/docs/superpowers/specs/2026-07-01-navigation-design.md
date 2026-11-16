# Navigation — Design Spec
**Date:** 2026-07-01  
**Scope:** Replace the existing `Header` component with a full app shell navigation: left sidebar on desktop, top app bar + slide-in drawer on mobile. Add coming-soon stub pages for all non-live routes.

---

## 1. Architecture

### New files
| Path | Purpose |
|---|---|
| `src/components/layout/AppShell/AppShell.tsx` | Renders SideNav + MobileNav + page content |
| `src/components/layout/AppShell/AppShell.module.css` | App shell layout (margin-left offset, mobile padding-top) |
| `src/components/layout/SideNav/SideNav.tsx` | Desktop left sidebar |
| `src/components/layout/SideNav/SideNav.module.css` | Sidebar styles |
| `src/components/layout/MobileNav/MobileNav.tsx` | Mobile top app bar + slide-in drawer |
| `src/components/layout/MobileNav/MobileNav.module.css` | Mobile nav styles |
| `src/pages/coming-soon/ComingSoon.tsx` | Shared coming-soon page |
| `src/pages/coming-soon/ComingSoon.module.css` | Coming-soon page styles |

### Modified files
| Path | Change |
|---|---|
| `src/App.tsx` | Wrap all routes in `<AppShell>`. Add `/weekly`, `/trend`, `/dashboards`, `/pricing-simulator`, `/availability-navigator` routes pointing to `ComingSoon`. |
| `src/pages/quick-facts/QuickFactsLayout.tsx` | Remove `<Header />` import and usage. |

### Deleted files
| Path | Reason |
|---|---|
| `src/components/layout/Header/Header.tsx` | Replaced by AppShell |
| `src/components/layout/Header/Header.module.css` | Replaced by AppShell |

### Unchanged
- `PageBar.tsx`, `FilterBar.tsx` — stay inside `QuickFactsLayout`, no changes.
- `AuthContext.tsx`, `ProtectedRoute` — all routes remain protected.

---

## 2. Routes

| Route | Component | Status | Notes |
|---|---|---|---|
| `/quick-facts/*` | `QuickFactsLayout` → `SummaryPage` / `DetailsPage` | Live | Existing |
| `/weekly` | `ComingSoon` | Coming soon | — |
| `/trend` | `ComingSoon` | Coming soon | — |
| `/dashboards` | `ComingSoon` | Coming soon | — |
| `/pricing-simulator` | `ComingSoon` | Coming soon | — |
| `/availability-navigator` | `ComingSoon` | Coming soon | — |
| `*` | Redirect to `/quick-facts` | — | Catch-all unchanged |

All routes wrapped in `ProtectedRoute`.

---

## 3. AppShell

```tsx
<div className={styles.shell}>
  <SideNav />       {/* desktop only — hidden via CSS on mobile */}
  <MobileNav />     {/* mobile only — hidden via CSS on desktop */}
  <div className={styles.main}>
    {children}      {/* page content */}
  </div>
</div>
```

**Layout:**
- Desktop (`≥ 768px`): `main` has `margin-left: 56px`. MobileNav hidden (`display: none`).
- Mobile (`< 768px`): `main` has `padding-top: 56px`. SideNav hidden (`display: none`).

---

## 4. SideNav (desktop)

### Behaviour
- `position: fixed; top: 0; left: 0; height: 100vh`
- Collapsed width: **56px** (icons only)
- Expanded width: **290px** on CSS `:hover` — no JS state
- Transition: `width 350ms cubic-bezier(0.4, 0, 0.2, 1)`
- Labels and logo text fade in via `opacity: 0 → 1` on hover
- Background: `#0C482C`
- `z-index: 1100`

### Logo area (top, 64px tall)
- Woolworths SVG logo (56px icon area, from wireframe)
- Label "My Insights" — fades in on hover

### Nav items
| Material icon | Label | Route | Badge |
|---|---|---|---|
| `today` (outlined) | Daily | `/quick-facts` | — |
| `date_range` (outlined) | Weekly | `/weekly` | "Soon" |
| `table_chart` (outlined) | Trend | `/trend` | "Soon" |
| `dashboard` (outlined) | Dashboards | `/dashboards` | "Soon" |

**Item styles:**
- Height: 48px. Padding: `0 16px 0 13px`. Gap: 16px.
- Default: `color: rgba(255,255,255,0.65)`
- Hover: `background: rgba(255,255,255,0.08); color: #fff`
- Active: `background: rgba(255,255,255,0.12); color: #fff; border-left: 3px solid #fff`
- Active state: determined by `useLocation()` — active when `pathname` starts with the route prefix (e.g. `/quick-facts` catches `/quick-facts/summary` and `/quick-facts/details/*`)

**"Soon" badge:** `font-size: 10px`, white semi-transparent pill. `opacity: 0` collapsed, `opacity: 1` on hover/expanded. `margin-left: auto`.

### Footer
- **Help button** (icon `help_outline`, label "Help") — non-navigating, no-op for now
- **User section:** avatar circle (account_circle icon) + name + role + email — email truncated with ellipsis
- **User popup menu** — opens on click, anchored above user row, closes on outside click
  - "Switch account" (no-op stub)
  - "Log out" → calls `AuthContext.logout()` (or redirects to login if logout exists)
- User info (name/role/email) fades in on hover, same as labels

---

## 5. MobileNav (mobile, `< 768px`)

### App bar
- `position: fixed; top: 0; left: 0; right: 0; height: 56px`
- Background: `#0C482C`
- `z-index: 1100`
- Left: hamburger `menu` icon button → opens drawer
- Centre: page title + "powered by X" tagline (italic, faded)
- Right: `help_outline` icon + circular avatar (user initials, `#146a30` background) → opens user bottom sheet (stub — shows user name/email, Log out button)
- **Page title** syncs with current route:
  | Route prefix | Title | Tagline |
  |---|---|---|
  | `/quick-facts` | Quick Facts | powered by Quick Facts |
  | `/weekly` | Weekly | — |
  | `/trend` | Trend | — |
  | `/dashboards` | Dashboards | — |
  | `/pricing-simulator` | Pricing Simulator | — |
  | `/availability-navigator` | Availability Navigator | — |

### Slide-in drawer
- White background, 296px wide (max 85vw), slides from left
- Backdrop (semi-transparent black) behind drawer, tap closes
- **Header:** Woolworths logo (40×32 SVG) + "Insights Portal" label + close `×` button

**Nav groups:**

*Buying*
| Icon | Label | Route |
|---|---|---|
| `calendar_today` | Quick Facts | `/quick-facts` |
| `dashboard` | Dashboards | `/dashboards` |
| `attach_money` | Pricing Simulator | `/pricing-simulator` |

*Store*
| Icon | Label | Route |
|---|---|---|
| `today` | Daily | `/quick-facts` |
| `date_range` | Weekly | `/weekly` |
| `table_chart` | Trend | `/trend` |
| `dashboard` | Dashboards | `/dashboards` |

*(unlabelled)*
| Icon | Label | Route |
|---|---|---|
| `shelves` (Material Symbols) | Availability Navigator | `/availability-navigator` |

- **Active item:** green left border (`4px #0C482C`) + green text + `#edf5f0` background
- Clicking a nav item navigates to the route and closes the drawer
- Footer: Help button (no-op)

### User bottom sheet (stub)
- Opens when avatar tapped
- Shows user name, email, "Log out" button

---

## 6. ComingSoon page

```
[ rocket_launch icon, large ]
  Coming Soon
  This feature is currently in development.
  [ Route name badge, e.g. "Weekly" ]
```

- Centred vertically and horizontally
- Uses existing CSS variables (`--color-text`, `--color-text-secondary`, `--color-surface`)
- No data fetching, no FilterProvider wrapping

---

## 7. Material Icons

The wireframe uses Google Material Icons (outlined variant) and Material Symbols Outlined. Add both font links to `index.html`:

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
```

---

## 8. Error handling

- Nav items that are "coming soon" simply navigate to `/weekly` etc. — `ComingSoon` renders, no errors possible.
- Log out: calls existing `logout` from `AuthContext` if available; otherwise redirects to `/login` or reloads.
- No async operations in nav components — no loading/error states needed.

---

## 9. Testing

- Unit test `SideNav`: active item highlighted for current route, badge visible when expanded, non-active routes have no border-left.
- Unit test `MobileNav`: page title syncs with route, drawer opens/closes on hamburger/close/backdrop click.
- Unit test `ComingSoon`: renders route name correctly.
- Existing tests must continue to pass (QuickFactsLayout no longer renders Header — update any Header-dependent tests).
