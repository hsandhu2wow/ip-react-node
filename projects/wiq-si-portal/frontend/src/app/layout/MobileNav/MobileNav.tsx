import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { getActivePrefix } from '../navActiveMatch'
import { isNavItemActive, navPrefixes, type NavItem, type NavGroup } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import { BUCKET_URL, logoLabelForPortal } from '../../config/theme'
import { MobileAccountSheet } from './MobileAccountSheet'
import styles from './MobileNav.module.scss'

function getRouteTitle(pathname: string): string | undefined {
  if (/^\/quick-facts(?:\/|$)/.test(pathname) || ['/weekly', '/trend'].includes(pathname)) return 'My Insights'
  if (pathname.startsWith('/dashboards')) return 'Dashboards'
  if (pathname.startsWith('/bqf')) return 'Buying Quick Facts'
  if (pathname.startsWith('/price-simulator')) return 'Pricing Simulator'
  if (pathname.startsWith('/act')) return 'Availability Navigator'
  if (pathname.startsWith('/admin')) return undefined
  if (pathname.startsWith('/help')) return 'Help'
  return 'My Insights'
}

function DrawerItem({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const iconClass = item.isSymbol ? 'material-symbols-outlined' : 'material-icons-outlined'
  const to = item.key === 'help' ? '/help/access' : item.to
  return (
    <NavLink
      to={to}
      className={`${styles.drawerItem} ${active ? styles.drawerItemActive : ''}`}
      onClick={onClick}
    >
      <span className={`${iconClass} ${styles.drawerItemIcon}`} aria-hidden="true">{item.icon}</span>
      <span>{item.label}</span>
      {!item.live && <span className={styles.soon}>Soon</span>}
    </NavLink>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div className={styles.groupLabel} aria-hidden="true">
      <span className={styles.groupLabelLine} />
      <span className={styles.groupLabelText}>{label}</span>
    </div>
  )
}

function NavGroupItems({
  group,
  isActive,
  onItemClick,
}: {
  group: NavGroup
  isActive: (item: NavItem) => boolean
  onItemClick: () => void
}) {
  return (
    <div key={group.key}>
      {group.label && <GroupLabel label={group.label} />}
      {group.items.map(item => (
        <DrawerItem key={item.key} item={item} active={isActive(item)} onClick={onItemClick} />
      ))}
    </div>
  )
}

export function MobileNav() {
  const location = useLocation()
  const { groups, user, dashboardSettingsError } = useNavGroups()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)
  const accountButtonRef = useRef<HTMLButtonElement>(null)
  const drawerWasOpen = useRef(false)
  const accountWasOpen = useRef(false)
  const title = getRouteTitle(location.pathname)
  const activePrefix = getActivePrefix(location.pathname, navPrefixes(groups.flatMap(group => group.items)))
  const activeHeaderItem = groups
    .flatMap(group => group.items)
    .find(item => isNavItemActive(item, activePrefix))
  const titleTo = activeHeaderItem
    ? activeHeaderItem.key === 'help' ? '/help/access' : activeHeaderItem.to
    : undefined
  const navGroups = groups.filter(group => group.key !== 'other')
  const otherItems = groups.find(group => group.key === 'other')?.items ?? []
  const mainOtherItems = otherItems.filter(item => item.key !== 'admin' && item.key !== 'help')
  const footerItems = otherItems.filter(item => item.key === 'admin' || item.key === 'help')

  function isItemActive(item: NavItem) {
    return isNavItemActive(item, activePrefix)
  }

  useEffect(() => {
    if (!drawerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerCloseRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setDrawerOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  useEffect(() => {
    if (drawerWasOpen.current && !drawerOpen) menuButtonRef.current?.focus()
    drawerWasOpen.current = drawerOpen
  }, [drawerOpen])

  useEffect(() => {
    if (accountWasOpen.current && !accountOpen) accountButtonRef.current?.focus()
    accountWasOpen.current = accountOpen
  }, [accountOpen])

  function closeDrawer() {
    setDrawerOpen(false)
  }

  return (
    <>
      <header className={styles.appbar} data-testid="mobile-appbar" role="navigation" aria-label="Mobile header">
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={drawerOpen}
          aria-controls="mobile-navigation-drawer"
          data-testid="mobile-menu-btn"
        >
          <span className="material-icons" aria-hidden="true">{drawerOpen ? 'menu_open' : 'menu'}</span>
        </button>
        {title && (
          <div className={styles.title}>
            {titleTo ? (
              <Link to={titleTo} className={styles.titleLabel} data-testid="mobile-title">{title}</Link>
            ) : (
              <span className={styles.titleLabel} data-testid="mobile-title">{title}</span>
            )}
          </div>
        )}
        {user?.name && (
          <button
            ref={accountButtonRef}
            type="button"
            className={styles.accountButton}
            aria-label="User menu"
            aria-expanded={accountOpen}
            aria-controls={accountOpen ? 'mobile-account-sheet' : undefined}
            onClick={() => setAccountOpen(true)}
          >
            {user.profile_photo && !user.profile_photo.includes('silhouette200.png') ? (
              <img src={user.profile_photo} alt="" />
            ) : (
              <span className="material-icons" aria-hidden="true">account_circle</span>
            )}
            <span className="material-icons-outlined" aria-hidden="true">arrow_drop_down</span>
          </button>
        )}
      </header>

      <div
        className={`${styles.backdrop} ${drawerOpen ? styles.backdropOpen : ''}`}
        onClick={closeDrawer}
        data-testid="mobile-backdrop"
        aria-hidden={!drawerOpen}
      />

      <div
        id="mobile-navigation-drawer"
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        data-testid="mobile-drawer"
      >
        <div className={styles.drawerHeader}>
          <Link to="/" className={styles.drawerLogo} onClick={closeDrawer}>
            <img src={`${BUCKET_URL}logo.svg`} width={40} height={32} alt="Wiq Logo" />
            <span>{logoLabelForPortal(user?.portal ?? '')}</span>
          </Link>
          <button
            ref={drawerCloseRef}
            type="button"
            className={styles.drawerClose}
            onClick={closeDrawer}
            aria-label="Close navigation"
            data-testid="mobile-drawer-close"
          >
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Main navigation links">
          {dashboardSettingsError && (
            <div className={styles.error} role="alert">
              Dashboard navigation settings could not be loaded.
            </div>
          )}
          {navGroups.map(group => (
            <NavGroupItems
              key={group.key}
              group={group}
              isActive={isItemActive}
              onItemClick={closeDrawer}
            />
          ))}
          {mainOtherItems.map(item => (
            <Fragment key={item.key}>
              <div className={styles.groupDivider} aria-hidden="true" />
              <DrawerItem item={item} active={isItemActive(item)} onClick={closeDrawer} />
            </Fragment>
          ))}
        </nav>

        {footerItems.length > 0 && (
          <div className={styles.drawerFooter}>
            {footerItems.map(item => (
              <DrawerItem key={item.key} item={item} active={isItemActive(item)} onClick={closeDrawer} />
            ))}
          </div>
        )}
      </div>

      {accountOpen && user && <MobileAccountSheet user={user} onClose={() => setAccountOpen(false)} />}
    </>
  )
}
