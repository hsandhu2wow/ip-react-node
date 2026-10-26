// src/components/layout/SideNav/SideNav.tsx
import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getActivePrefix } from '../navActiveMatch'
import { BUCKET_URL, logoLabelForPortal } from '../../../config/theme'
import styles from './SideNav.module.css'

const NAV_ITEMS = [
  { icon: 'today', label: 'Daily', to: '/quick-facts', prefix: '/quick-facts', badge: false },
  { icon: 'date_range', label: 'Weekly', to: '/weekly', prefix: '/weekly', badge: true },
  { icon: 'view_week', label: 'Trend', to: '/quick-facts/weekly', prefix: '/quick-facts/weekly', altPrefixes: ['/quick-facts/myplan'], badge: false },
  { icon: 'dashboard', label: 'Dashboards', to: '/dashboards', prefix: '/dashboards', badge: true },
]

function allPrefixes(items: { prefix: string; altPrefixes?: string[] }[]): string[] {
  return items.flatMap((item) => [item.prefix, ...(item.altPrefixes ?? [])])
}

export function SideNav() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const activePrefix = getActivePrefix(location.pathname, allPrefixes(NAV_ITEMS))

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
    <nav className={`${styles.sidenav} ${menuOpen ? styles.sidenavExpanded : ''}`} aria-label="Main navigation">
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <img src={`${BUCKET_URL}logo.svg`} width={56} height={45} alt="Logo" />
        </div>
        <span className={styles.logoLabel}>{logoLabelForPortal(user.portal)}</span>
      </div>

      {/* Nav items */}
      <div className={styles.nav}>
        {NAV_ITEMS.map(({ icon, label, to, prefix, altPrefixes: itemAltPrefixes, badge }) => {
          const isActive = prefix === activePrefix || (itemAltPrefixes?.includes(activePrefix) ?? false)
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
            aria-haspopup="true"
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
