import type { IUserDetails } from '../../shared/api/users'

export interface NavItem {
  key: string
  icon: string
  label: string
  to: string
  matchRoutes?: string[]
  excludeRoutes?: string[]
  /** Material Symbols (not Material Icons) glyph */
  isSymbol?: boolean
  newTag?: boolean
  /** false while the destination is still a Coming Soon placeholder */
  live: boolean
}

export interface NavGroup {
  key: 'buying' | 'store' | 'other'
  label?: string
  items: NavItem[]
}

function hasNewTag(user: IUserDetails, tag: string): boolean {
  return user.new_tags?.includes(tag) ?? false
}

function routeMatches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/**
 * Builds Angular's Buying, Store and standalone navigation groups from account
 * access, CFC membership, portal and dashboard-segregation settings.
 */
export function buildNavGroups(
  user: IUserDetails | undefined,
  isCfc: boolean | undefined,
  portal: string,
  dashboardSegregation: boolean | undefined,
): NavGroup[] {
  const isShortLabelPortal = ['SI', 'METRO'].includes(portal)
  const hasBuyingAccess = !!user && (
    user.bqf === 1 || (user.psf === 1 && !!user.psf_enabled)
  )
  const hasStoreAccess = !!user && (user.sqf === 1 || user.sqa === 1 || user.wf === 1)
  const buying: NavItem[] = []
  const store: NavItem[] = []
  const other: NavItem[] = []

  if (user && hasBuyingAccess) {
    if (user.bqf === 1) {
      buying.push({
        key: 'bqf',
        icon: 'calendar_today',
        label: isShortLabelPortal ? 'Daily' : 'Buying Quick Facts',
        to: '/bqf/summary',
        live: false,
      })
    }

    if (dashboardSegregation === true) {
      buying.push({
        key: 'dashboards',
        icon: 'dashboard',
        label: 'Dashboards',
        to: '/dashboards/app/buying',
        matchRoutes: ['/dashboards/app/buying'],
        excludeRoutes: ['/dashboards/app/store'],
        live: false,
      })
    }

    if (user.psf === 1 && user.psf_enabled) {
      buying.push({
        key: 'price-simulator',
        icon: 'sell',
        label: 'Pricing Simulator',
        to: '/price-simulator/simulations',
        live: false,
      })
    }
  }

  if (user && hasStoreAccess) {
    const quickAssistItem =
      user.sqa === 1 &&
      user.quick_assist_enabled &&
      (isShortLabelPortal || isCfc === false)
        ? {
            key: 'weekly',
            icon: 'date_range',
            label: isShortLabelPortal ? 'Weekly' : 'Quick Assist',
            to: '/quick-facts/quick-assist',
            matchRoutes: ['/quick-facts/quick-assist'],
            newTag: hasNewTag(user, 'quick_assist'),
            live: false,
          }
        : undefined

    if (user.sqf === 1 && user.sqf_enabled) {
      store.push({
        key: 'daily',
        icon: 'today',
        label: isShortLabelPortal ? 'Daily' : 'Quick Facts',
        to: '/quick-facts',
        matchRoutes: ['/quick-facts'],
        excludeRoutes: [
          '/quick-facts/quick-assist',
          '/quick-facts/weekly',
          '/quick-facts/myplan',
        ],
        newTag: hasNewTag(user, 'quick_facts'),
        live: true,
      })
    }

    if (isShortLabelPortal && quickAssistItem) store.push(quickAssistItem)

    const showWeeklyFacts =
      user.wf === 1 &&
      (!!user.weekly_facts_enabled || !!user.my_plan_enabled) &&
      isCfc === false

    if (showWeeklyFacts) {
      const onlyMyPlan = !user.weekly_facts_enabled && !!user.my_plan_enabled
      const label = onlyMyPlan
        ? 'My Plan'
        : isShortLabelPortal
          ? 'Trend'
          : 'Weekly Facts'
      const tagName = onlyMyPlan ? 'my_plan' : 'weekly_facts'
      const route = onlyMyPlan ? '/quick-facts/myplan' : '/quick-facts/weekly'

      store.push({
        key: 'trend',
        icon: 'table_chart',
        label,
        to: route,
        matchRoutes: ['/quick-facts/weekly', '/quick-facts/myplan'],
        newTag: hasNewTag(user, tagName),
        live: true,
      })
    }

    if (!isShortLabelPortal && quickAssistItem) store.push(quickAssistItem)

    if (dashboardSegregation === true) {
      store.push({
        key: 'dashboards',
        icon: 'dashboard',
        label: 'Dashboards',
        to: '/dashboards/app/store',
        matchRoutes: ['/dashboards/app/store'],
        excludeRoutes: ['/dashboards/app/buying'],
        live: false,
      })
    }
  }

  if (dashboardSegregation === false) {
    other.push({
      key: 'dashboards',
      icon: 'dashboard',
      label: 'Dashboards',
      to: '/dashboards/app/all',
      matchRoutes: ['/dashboards'],
      live: false,
    })
  }

  if (user?.act === 1) {
    other.push({
      key: 'act',
      icon: 'inventory_2',
      label: 'Availability Navigator',
      to: '/act',
      live: false,
    })
  }

  if (user?.admin === 1) {
    other.push({
      key: 'admin',
      icon: 'settings',
      label: 'Admin',
      to: '/admin',
      live: false,
    })
  }

  if (user) {
    other.push({
      key: 'help',
      icon: 'help_outline',
      label: 'Help',
      to: '/help',
      live: false,
    })
  }

  const bothGroups = hasBuyingAccess && hasStoreAccess
  return [
    ...(buying.length ? [{ key: 'buying' as const, label: bothGroups ? 'Buying' : undefined, items: buying }] : []),
    ...(store.length ? [{ key: 'store' as const, label: bothGroups ? 'Store' : undefined, items: store }] : []),
    ...(other.length ? [{ key: 'other' as const, items: other }] : []),
  ]
}

/** Flat list for contexts that need unique items; grouped rails render groups directly. */
export function flattenNavGroups(groups: NavGroup[]): NavItem[] {
  const all = groups.flatMap(group => group.items)
  return all.filter((item, index) => all.findLastIndex(other => other.key === item.key) === index)
}

export function navPrefixes(items: NavItem[]): string[] {
  return items.flatMap(item => [item.to, ...(item.matchRoutes ?? [])])
}

export function isNavItemActive(item: NavItem, activePrefix: string): boolean {
  if (!activePrefix) return false
  const matches = (item.matchRoutes ?? [item.to]).some(prefix => routeMatches(activePrefix, prefix))
  const excluded = item.excludeRoutes?.some(prefix => routeMatches(activePrefix, prefix)) ?? false
  return matches && !excluded
}
