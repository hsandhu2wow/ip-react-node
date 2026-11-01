// src/components/layout/MobileNav/MobileNav.tsx
import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { getActivePrefix } from '../navActiveMatch'
import { BUCKET_URL, logoLabelForPortal } from '../../config/theme'
import styles from './MobileNav.module.scss'

const ROUTE_TITLES: Record<string, { title: string; tagline?: string }> = {
  '/quick-facts': { title: 'Quick Facts', tagline: 'powered by Quick Facts' },
  '/weekly':      { title: 'Weekly' },
  '/trend':       { title: 'Trend' },
  '/quick-facts/weekly': { title: 'Trend', tagline: 'powered by Weekly Facts and My Plan' },
  '/quick-facts/myplan': { title: 'Trend', tagline: 'powered by Weekly Facts and My Plan' },
  '/dashboards':  { title: 'Dashboards' },
  '/pricing-simulator':     { title: 'Pricing Simulator' },
  '/availability-navigator':{ title: 'Availability Navigator' },
}

interface NavItem {
  icon: string
  label: string
  to: string
  altPrefixes?: string[]
  isSymbol?: boolean
}

const BUYING_ITEMS: NavItem[] = [
  { icon: 'calendar_today', label: 'Quick Facts',       to: '/quick-facts' },
  { icon: 'dashboard',      label: 'Dashboards',        to: '/dashboards' },
  { icon: 'attach_money',   label: 'Pricing Simulator', to: '/pricing-simulator' },
]

const STORE_ITEMS: NavItem[] = [
  { icon: 'today',        label: 'Daily',      to: '/quick-facts' },
  { icon: 'date_range',   label: 'Weekly',     to: '/weekly' },
  { icon: 'view_week',    label: 'Trend',      to: '/quick-facts/weekly', altPrefixes: ['/quick-facts/myplan'] },
  { icon: 'dashboard',    label: 'Dashboards', to: '/dashboards' },
]

const STANDALONE_ITEMS: NavItem[] = [
  { icon: 'shelves', label: 'Availability Navigator', to: '/availability-navigator', isSymbol: true },
]


function getRouteInfo(pathname: string) {
  const keys = Object.keys(ROUTE_TITLES).sort((a, b) => b.length - a.length)
  const key = keys.find(k => pathname === k || pathname.startsWith(k + '/'))
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

  const activePrefix = getActivePrefix(
    location.pathname,
    [...BUYING_ITEMS, ...STORE_ITEMS, ...STANDALONE_ITEMS].flatMap((item) => [item.to, ...(item.altPrefixes ?? [])])
  )

  function isItemActive(item: NavItem) {
    return item.to === activePrefix || (item.altPrefixes?.includes(activePrefix) ?? false)
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
          <div className={styles.drawerLogoIcon}>
            <img src={`${BUCKET_URL}logo.svg`} width={48} height={38} alt="Logo" />
          </div>
          <span className={styles.drawerLogoLabel}>{logoLabelForPortal(user.portal)}</span>
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
              <DrawerItem key={item.to + item.label} {...item} isActive={isItemActive(item)} onClick={close} />
            ))}
          </div>

          {/* Store group */}
          <div>
            <div className={styles.groupLabel}>
              <div className={styles.groupLabelLine} />
              <span className={styles.groupLabelText}>Store</span>
            </div>
            {STORE_ITEMS.map(item => (
              <DrawerItem key={item.to + item.label} {...item} isActive={isItemActive(item)} onClick={close} />
            ))}
          </div>

          {/* Standalone group */}
          <div>
            <div className={styles.groupLabel}>
              <div className={styles.groupLabelLine} />
            </div>
            {STANDALONE_ITEMS.map(item => (
              <DrawerItem key={item.to} {...item} isActive={isItemActive(item)} onClick={close} />
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
