// src/components/layout/MobileNav/MobileNav.tsx
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && drawerOpen) close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

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
        role="dialog"
        aria-modal="true"
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
