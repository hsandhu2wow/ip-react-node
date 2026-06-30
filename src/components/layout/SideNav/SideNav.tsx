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
