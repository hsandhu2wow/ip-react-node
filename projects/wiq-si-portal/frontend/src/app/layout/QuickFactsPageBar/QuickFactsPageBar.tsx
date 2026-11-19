import { Link, useLocation } from 'react-router-dom'
import { getActivePrefix } from '../navActiveMatch'
import { isNavItemActive, navPrefixes } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import styles from './QuickFactsPageBar.module.scss'

const PAGE_BAR_ITEM_KEYS = new Set(['daily', 'weekly', 'trend'])

export function QuickFactsPageBar() {
  const { pathname, search } = useLocation()
  const { groups } = useNavGroups()
  const items = groups
    .find(group => group.key === 'store')
    ?.items.filter(item => PAGE_BAR_ITEM_KEYS.has(item.key)) ?? []

  if (items.length === 0) return null

  const params = new URLSearchParams(search)
  const selectedCode = params.get('code')
  const query = selectedCode ? `?${new URLSearchParams({ code: selectedCode }).toString()}` : ''
  const activePrefix = getActivePrefix(pathname, navPrefixes(groups.flatMap(group => group.items)))

  return (
    <nav className={styles.pageBar} aria-label="Quick Facts navigation" data-testid="quick-facts-page-bar">
      {items.map(item => {
        const active = isNavItemActive(item, activePrefix)
        return (
          <Link
            key={item.key}
            to={`${item.to}${query}`}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
