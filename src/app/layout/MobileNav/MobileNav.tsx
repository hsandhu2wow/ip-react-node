// src/components/layout/MobileNav/MobileNav.tsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { getActivePrefix } from '../navActiveMatch'
import { isNavItemActive, navPrefixes, type NavItem } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import { BUCKET_URL, logoLabelForPortal } from '../../config/theme'
import styles from './MobileNav.module.scss'

const ROUTE_TITLES: Record<string, { title: string; tagline?: string }> = {
  '/quick-facts': { title: 'Quick Facts', tagline: 'powered by Quick Facts' },
  '/weekly':      { title: 'Weekly' },
  '/trend':       { title: 'Trend' },
  '/quick-facts/weekly': { title: 'Trend', tagline: 'powered by Weekly Facts and My Plan' },
  '/quick-facts/myplan': { title: 'Trend', tagline: 'powered by Weekly Facts and My Plan' },
  '/dashboards':  { title: 'Dashboards' },
  '/bqf':         { title: 'Quick Facts' },
  '/price-simulator':       { title: 'Pricing Simulator' },
  '/act':                   { title: 'Availability Navigator' },
  '/admin':                 { title: 'Admin' },
  '/help':                  { title: 'Help' },
}

function getRouteInfo(pathname: string) {
  const keys = Object.keys(ROUTE_TITLES).sort((a, b) => b.length - a.length)
  const key = keys.find(k => pathname === k || pathname.startsWith(k + '/'))
  return key ? ROUTE_TITLES[key] : { title: 'My Insights' }
}

function DrawerItem({
  icon, label, to, isActive, isSymbol, live, onClick,
}: {
  icon: string; label: string; to: string; isActive: boolean; isSymbol?: boolean; live?: boolean; onClick: () => void
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
      {live === false && <span className={styles.soon}>Soon</span>}
    </NavLink>
  )
}

export function MobileNav() {
  const { user } = useAuth()
  const location = useLocation()
  const isTrend = /^\/quick-facts\/(weekly|myplan)\/?$/.test(location.pathname)
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

  const groups = useNavGroups()
  const activePrefix = getActivePrefix(location.pathname, navPrefixes(groups.flatMap(g => g.items)))

  function isItemActive(item: NavItem) {
    return isNavItemActive(item, activePrefix)
  }

  return (
    <>
      {/* App bar */}
      <header className={`${styles.appbar} ${isTrend ? styles.trendAppbar : ''}`} data-testid="mobile-appbar">
        <button
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          data-testid="mobile-menu-btn"
        >
          <span className="material-icons">menu</span>
        </button>
        <div className={styles.title}>
          <span className={styles.titleLabel} data-testid="mobile-title">{isTrend ? 'My Insights' : title}</span>
          {!isTrend && tagline && <span className={styles.titleTagline}>{tagline}</span>}
        </div>
        {!isTrend && <button className={styles.iconBtn} aria-label="Help">
          <span className="material-icons-outlined">help_outline</span>
        </button>}
        <button className={isTrend ? styles.account : styles.avatar} aria-label="User menu">
          {isTrend ? <><span className="material-icons">account_circle</span><span className="material-icons">arrow_drop_down</span></> : initials}
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
          {groups.filter(group => group.items.length > 0).map(group => (
            <div key={group.key}>
              <div className={styles.groupLabel}>
                <div className={styles.groupLabelLine} />
                {group.label && <span className={styles.groupLabelText}>{group.label}</span>}
              </div>
              {group.items.map(item => (
                <DrawerItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  isSymbol={item.isSymbol}
                  live={item.live}
                  isActive={isItemActive(item)}
                  onClick={close}
                />
              ))}
            </div>
          ))}
        </div>

        <div className={styles.drawerFooter}>
          <Link to="/help" className={styles.drawerItem} onClick={close}>
            <span className={`material-icons-outlined ${styles.drawerItemIcon}`}>help_outline</span>
            <span>Help</span>
            <span className={styles.soon}>Soon</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
