import type { IUserDetails } from '../../shared/api/users'

export interface NavItem {
  key: string
  icon: string
  label: string
  to: string
  altPrefixes?: string[]
  /** Material Symbols (not Material Icons) glyph */
  isSymbol?: boolean
  /** false while the destination is still a Coming Soon placeholder */
  live: boolean
}

export interface NavGroup {
  key: 'buying' | 'store' | 'other'
  label?: string
  items: NavItem[]
}

/**
 * Builds the navigation from the fetched account, mirroring the Angular
 * auth-guard/NavService rules: numeric role flags (`sqf`, `bqf`, `sqa`, `wf`,
 * `psf`, `act`, `admin`) plus the per-feature enabled flags, with CFC
 * responsibilities excluded from Quick Assist, Weekly and My Plan.
 * `isCfc` is undefined until the CFC directory has loaded; CFC-gated links stay hidden until then.
 */
export function buildNavGroups(user: IUserDetails | undefined, isCfc: boolean | undefined, portal: string): NavGroup[] {
  const u = user ?? {}
  const isSI = ['SI', 'METRO'].includes(portal)
  const cfcAllowed = isCfc === false

  const dashboards: NavItem = { key: 'dashboards', icon: 'dashboard', label: 'Dashboards', to: '/dashboards', live: false }

  const buying: NavItem[] = [
    ...(u.bqf === 1
      ? [{ key: 'bqf', icon: 'calendar_today', label: 'Quick Facts', to: '/bqf', live: false }]
      : []),
    dashboards,
    ...(u.psf === 1 && u.psf_enabled
      ? [{ key: 'price-simulator', icon: 'attach_money', label: 'Pricing Simulator', to: '/price-simulator', live: false }]
      : []),
  ]

  const trendTo = u.weekly_facts_enabled ? '/quick-facts/weekly' : '/quick-facts/myplan'
  const showTrend = !!u.wf && !!(u.weekly_facts_enabled || u.my_plan_enabled) && cfcAllowed
  const store: NavItem[] = [
    ...(u.sqf === 1 && u.sqf_enabled
      ? [{ key: 'daily', icon: 'today', label: isSI ? 'Daily' : 'Quick Facts', to: '/quick-facts', live: true }]
      : []),
    ...(u.sqa && u.quick_assist_enabled && cfcAllowed
      ? [{ key: 'weekly', icon: 'date_range', label: isSI ? 'Weekly' : 'Quick Assist', to: '/weekly', live: false }]
      : []),
    ...(showTrend
      ? [{
          key: 'trend', icon: 'view_week', label: isSI ? 'Trend' : 'Weekly Facts', to: trendTo,
          altPrefixes: ['/quick-facts/weekly', '/quick-facts/myplan'], live: true,
        }]
      : []),
    dashboards,
  ]

  const other: NavItem[] = [
    ...(u.act === 1
      ? [{ key: 'act', icon: 'shelves', label: 'Availability Navigator', to: '/act/avnav', isSymbol: true, live: false }]
      : []),
    ...(u.admin === 1
      ? [{ key: 'admin', icon: 'admin_panel_settings', label: 'Admin', to: '/admin', live: false }]
      : []),
  ]

  return [
    { key: 'buying', label: 'Buying', items: buying },
    { key: 'store', label: 'Store', items: store },
    { key: 'other', items: other },
  ]
}

/** Flat list for the desktop sidebar; an item shared by several groups (Dashboards) appears once, at its last position. */
export function flattenNavGroups(groups: NavGroup[]): NavItem[] {
  const all = groups.flatMap(g => g.items)
  return all.filter((item, i) => all.findLastIndex(o => o.key === item.key) === i)
}

export function navPrefixes(items: NavItem[]): string[] {
  return items.flatMap(item => [item.to, ...(item.altPrefixes ?? [])])
}

export function isNavItemActive(item: NavItem, activePrefix: string): boolean {
  return item.to === activePrefix || (item.altPrefixes?.includes(activePrefix) ?? false)
}
