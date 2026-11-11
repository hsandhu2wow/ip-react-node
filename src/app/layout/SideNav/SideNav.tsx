// src/components/layout/SideNav/SideNav.tsx
import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/context/AuthContext'
import { getActivePrefix } from '../navActiveMatch'
import { flattenNavGroups, isNavItemActive, navPrefixes } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import { BUCKET_URL, logoLabelForPortal } from '../../config/theme'
import styles from './SideNav.module.scss'

export function SideNav() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navItems = flattenNavGroups(useNavGroups())
  const activePrefix = getActivePrefix(location.pathname, navPrefixes(navItems))

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
        {navItems.map(item => {
          const isActive = isNavItemActive(item, activePrefix)
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
              data-active={isActive ? 'true' : undefined}
            >
              <span className={`${item.isSymbol ? 'material-symbols-outlined' : 'material-icons-outlined'} ${styles.itemIcon}`}>{item.icon}</span>
              <span className={styles.itemLabel}>{item.label}</span>
              {!item.live && <span className={styles.badge}>Soon</span>}
            </NavLink>
          )
        })}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Link to="/help" className={styles.item}>
          <span className={`material-icons-outlined ${styles.itemIcon}`}>help_outline</span>
          <span className={styles.itemLabel}>Help</span>
          <span className={styles.badge}>Soon</span>
        </Link>

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
