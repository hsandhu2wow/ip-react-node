import { describe, it, expect } from 'vitest'
import type { IUserDetails } from '../../shared/api/users'
import { buildNavGroups, flattenNavGroups, isNavItemActive } from './navItems'

const labels = (
  user: IUserDetails | undefined,
  cfc: boolean | undefined,
  portal = 'SI',
  segregated = false,
) => flattenNavGroups(buildNavGroups(user, cfc, portal, segregated)).map(item => item.label)

const fullAccessUser: IUserDetails = {
  sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1, wf: 1,
  weekly_facts_enabled: 1, my_plan_enabled: 1, bqf: 1, admin: 1,
  psf: 1, psf_enabled: 1, act: 1,
}

describe('buildNavGroups', () => {
  it('shows only Dashboards without user details', () => {
    expect(labels(undefined, undefined)).toEqual(['Dashboards'])
  })
  it('gates by flags and uses SI labels', () => {
    expect(labels({ sqf: 1, sqf_enabled: true, wf: 1, my_plan_enabled: 1 }, false, 'SI', true))
      .toEqual(['Daily', 'My Plan', 'Dashboards', 'Help'])
  })
  it('uses non-SI labels', () => {
    expect(labels({ sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1 }, false, 'BIG W'))
      .toEqual(['Quick Facts', 'Quick Assist', 'Dashboards', 'Help'])
  })
  it('orders non-SI Store items as Quick Facts, Weekly Facts, then Quick Assist', () => {
    const user: IUserDetails = {
      sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1,
      wf: 1, weekly_facts_enabled: 1,
    }

    expect(labels(user, false, 'BIG W')).toEqual([
      'Quick Facts', 'Weekly Facts', 'Quick Assist', 'Dashboards', 'Help',
    ])
  })
  it('keeps Quick Assist for CFC SI/METRO but hides it for other portals', () => {
    const user: IUserDetails = { sqa: 1, quick_assist_enabled: 1, wf: 1, weekly_facts_enabled: 1 }
    expect(labels(user, true, 'SI', true)).toContain('Weekly')
    expect(labels(user, true, 'METRO', true)).toContain('Weekly')
    expect(labels(user, true, 'BIG W')).not.toContain('Quick Assist')
    expect(labels(user, true, 'BIG W')).not.toContain('Weekly Facts')
  })
  it('uses Angular routes and grouped dashboard links for a fully enabled SI account', () => {
    const groups = buildNavGroups(fullAccessUser, false, 'SI', true)
    expect(groups.find(group => group.key === 'buying')?.items.map(item => item.to)).toEqual([
      '/bqf/summary', '/dashboards/app/buying', '/price-simulator/simulations',
    ])
    expect(groups.find(group => group.key === 'store')?.items.map(item => item.to)).toEqual([
      '/quick-facts', '/quick-facts/quick-assist', '/quick-facts/weekly', '/dashboards/app/store',
    ])
    expect(groups.flatMap(group => group.items).map(item => item.to)).toContain('/act')
    expect(groups.flatMap(group => group.items).map(item => item.to)).toContain('/admin')
  })
  it('uses one standalone Dashboards item when dashboards are not segregated', () => {
    const groups = buildNavGroups(fullAccessUser, false, 'BIG W', false)
    const dashboards = groups.flatMap(group => group.items).filter(item => item.key === 'dashboards')
    expect(dashboards).toHaveLength(1)
    expect(dashboards[0].to).toBe('/dashboards/app/all')
  })
  it('marks New tags separately from Coming Soon badges', () => {
    const user: IUserDetails = {
      sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1,
      new_tags: ['quick_facts', 'quick_assist'],
    }
    const groups = buildNavGroups(user, false, 'SI', true)
    const items = groups.flatMap(group => group.items)
    expect(items.find(item => item.key === 'daily')?.newTag).toBe(true)
    expect(items.find(item => item.key === 'weekly')?.newTag).toBe(true)
    expect(items.find(item => item.key === 'weekly')?.live).toBe(false)
  })
  it('applies route inclusions and exclusions without activating two Dashboard links', () => {
    const groups = buildNavGroups(fullAccessUser, false, 'SI', true)
    const buyingDashboards = groups.find(group => group.key === 'buying')!.items.find(item => item.key === 'dashboards')!
    const storeDashboards = groups.find(group => group.key === 'store')!.items.find(item => item.key === 'dashboards')!
    expect(isNavItemActive(buyingDashboards, '/dashboards/app/buying')).toBe(true)
    expect(isNavItemActive(buyingDashboards, '/dashboards/app/store')).toBe(false)
    expect(isNavItemActive(storeDashboards, '/dashboards/app/store')).toBe(true)
    expect(isNavItemActive(storeDashboards, '/dashboards/app/buying')).toBe(false)
  })
  it('does not expose role-gated links for an SI account with no user details', () => {
    expect(flattenNavGroups(buildNavGroups(undefined, undefined, 'SI', true))).toEqual([])
  })
})
