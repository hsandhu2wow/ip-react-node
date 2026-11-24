import { Link, useLocation } from 'react-router-dom'
import { getActivePrefix } from '../navActiveMatch'
import { isNavItemActive, navPrefixes } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import styles from './QuickFactsPageBar.module.scss'

const PAGE_BAR_ITEM_KEYS = new Set(['daily', 'weekly', 'trend'])

export function QuickFactsPageBar() {
  const { pathname, search } = useLocation()
  const { groups, isCfc, user } = useNavGroups()
  const storeItems = groups
    .find(group => group.key === 'store')
    ?.items.filter(item => PAGE_BAR_ITEM_KEYS.has(item.key)) ?? []
  const items = storeItems
    .map(item => item.to === '/quick-facts/myplan'
      ? { ...item, newTag: user?.new_tags?.includes('weekly_facts') ?? false }
      : item)
    .filter(item => item.to !== '/quick-facts/myplan' && !(item.key === 'weekly' && isCfc !== false))

  if (items.length <= 1) return null

  const activePrefix = getActivePrefix(pathname, navPrefixes(groups.flatMap(group => group.items)))

  return (
    <nav className={styles.pageBar} aria-label="Quick Facts navigation" data-testid="quick-facts-page-bar">
      {items.map(item => {
        const active = isNavItemActive(item, activePrefix)
        return (
          <Link
            key={item.key}
            to={`${item.to}${search}`}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-label={item.newTag ? `${item.label} New!` : item.label}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
            {item.newTag && <span className={styles.newTag}>New!</span>}
          </Link>
        )
      })}
    </nav>
  )
}
