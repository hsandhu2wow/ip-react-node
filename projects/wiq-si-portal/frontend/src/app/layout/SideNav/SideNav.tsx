import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getActivePrefix } from '../navActiveMatch'
import { isNavItemActive, navPrefixes, type NavItem } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import { BUCKET_URL, logoLabelForPortal } from '../../config/theme'
import { LogoutConfirmationDialog } from '../Account/LogoutConfirmationDialog'
import styles from './SideNav.module.scss'

export function SideNav() {
  const location = useLocation()
  const { groups, user, dashboardSettingsError } = useNavGroups()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const activePrefix = getActivePrefix(location.pathname, navPrefixes(groups.flatMap(group => group.items)))
  const mainItems = groups.filter(group => group.key !== 'other')
  const otherItems = groups.find(group => group.key === 'other')?.items ?? []
  const footerItems = otherItems.filter(item => item.key === 'admin' || item.key === 'help')

  useEffect(() => {
    if (!menuOpen) return

    firstMenuItemRef.current?.focus()

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function renderItem(item: NavItem) {
    const active = isNavItemActive(item, activePrefix)
    return (
      <NavLink
        key={item.key}
        to={item.to}
        className={`${styles.item} ${active ? styles.itemActive : ''}`}
        data-active={active ? 'true' : undefined}
      >
        <span
          aria-hidden="true"
          className={`${item.isSymbol ? 'material-symbols-outlined' : 'material-icons-outlined'} ${styles.itemIcon}`}
        >
          {item.icon}
        </span>
        <span className={styles.itemLabel}>{item.label}</span>
        {item.newTag && <span className={styles.badge}>New!</span>}
        {!item.live && <span className={styles.badge}>Soon</span>}
      </NavLink>
    )
  }

  function switchAccount() {
    if (!user?.switch_account_url) return
    localStorage.setItem('switchedAccount', 'yes')
    setMenuOpen(false)
    window.open(user.switch_account_url, '_self')
  }

  return (
    <>
      <nav
        className={`${styles.sidenav} ${menuOpen ? styles.sidenavExpanded : ''}`}
        aria-label="Main navigation"
        onMouseLeave={() => setMenuOpen(false)}
      >
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <img src={`${BUCKET_URL}logo.svg`} width={56} height={45} alt="Wiq Logo" />
          </div>
          <span className={styles.logoLabel} aria-hidden="true">
            {logoLabelForPortal(user?.portal ?? '')}
          </span>
        </Link>

        <div className={styles.nav}>
          {mainItems.map(group => (
            <div className={styles.group} key={group.key}>
              {group.label && (
                <div className={styles.groupLabel} aria-hidden="true">
                  <span className={styles.groupLabelLine} />
                  <span className={styles.groupLabelText}>{group.label}</span>
                </div>
              )}
              {group.items.map(renderItem)}
            </div>
          ))}
          {otherItems
            .filter(item => item.key !== 'admin' && item.key !== 'help')
            .map(item => (
              <Fragment key={item.key}>
                <div className={styles.rule} aria-hidden="true" />
                {renderItem(item)}
              </Fragment>
            ))}
        </div>

        {dashboardSettingsError && (
          <div className={styles.error} role="alert">
            Dashboard navigation settings could not be loaded.
          </div>
        )}

        {user && (
          <div className={styles.footer}>
            {footerItems.map(renderItem)}
            {user.name && (
              <div className={styles.userContainer} ref={menuRef}>
                {menuOpen && (
                  <div className={styles.userMenu} id="sidenav-user-menu" role="menu" aria-label="Account actions">
                    <div className={styles.menuPanel}>
                      {user.switch_account_url && (
                        <button
                          ref={firstMenuItemRef}
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={switchAccount}
                        >
                          <span className={`material-icons-outlined ${styles.menuIcon}`} aria-hidden="true">
                            supervised_user_circle
                          </span>
                          Switch account
                        </button>
                      )}
                      {user.logoutUrl && (
                        <button
                          ref={!user.switch_account_url ? firstMenuItemRef : undefined}
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false)
                            setLogoutDialogOpen(true)
                          }}
                        >
                          <span className={`material-icons-outlined ${styles.menuIcon}`} aria-hidden="true">
                            logout
                          </span>
                          Sign out
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <button
                  ref={triggerRef}
                  className={styles.userRow}
                  onClick={() => setMenuOpen(open => !open)}
                  data-testid="sidenav-user-trigger"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-controls={menuOpen ? 'sidenav-user-menu' : undefined}
                >
                  <div className={styles.avatar}>
                    {user.profile_photo && !user.profile_photo.includes('silhouette200.png') ? (
                      <img src={user.profile_photo} alt="" />
                    ) : (
                      <span className="material-icons" aria-hidden="true">account_circle</span>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    {user.success_factors_role && <span className={styles.userRole}>{user.success_factors_role}</span>}
                    {user.email && <span className={styles.userEmail}>{user.email}</span>}
                  </div>
                  <span className={`material-icons-outlined ${styles.userChevron}`} aria-hidden="true">
                    {menuOpen ? 'unfold_less' : 'unfold_more'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {logoutDialogOpen && user?.logoutUrl && (
        <LogoutConfirmationDialog
          logoutUrl={user.logoutUrl}
          onClose={() => {
            setLogoutDialogOpen(false)
            triggerRef.current?.focus()
          }}
        />
      )}
    </>
  )
}
