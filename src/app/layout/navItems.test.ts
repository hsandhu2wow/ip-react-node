import { describe, it, expect } from 'vitest'
import type { IUserDetails } from '../../shared/api/users'
import { buildNavGroups, flattenNavGroups } from './navItems'

const labels = (u: IUserDetails | undefined, cfc: boolean | undefined, portal = 'SI') =>
  flattenNavGroups(buildNavGroups(u, cfc, portal)).map(i => i.label)

describe('buildNavGroups', () => {
  it('shows only Dashboards without user details', () => {
    expect(labels(undefined, undefined)).toEqual(['Dashboards'])
  })
  it('gates by flags and uses SI labels', () => {
    expect(labels({ sqf: 1, sqf_enabled: true, wf: 1, my_plan_enabled: 1 }, false)).toEqual(['Daily', 'Trend', 'Dashboards'])
  })
  it('uses non-SI labels', () => {
    expect(labels({ sqf: 1, sqf_enabled: true, sqa: 1, quick_assist_enabled: 1 }, false, 'BIG W')).toEqual(['Quick Facts', 'Quick Assist', 'Dashboards'])
  })
  it('hides Weekly/Trend for CFC', () => {
    expect(labels({ sqa: 1, quick_assist_enabled: 1, wf: 1, weekly_facts_enabled: 1 }, true)).toEqual(['Dashboards'])
  })
  it('adds BQF, pricing, availability and admin links; Trend prefers weekly', () => {
    const groups = buildNavGroups({ bqf: 1, psf: 1, psf_enabled: 1, act: 1, admin: 1, wf: 1, weekly_facts_enabled: 1 }, false, 'SI')
    expect(flattenNavGroups(groups).map(i => i.to)).toEqual(
      ['/bqf', '/price-simulator', '/quick-facts/weekly', '/dashboards', '/act/avnav', '/admin'])
  })
})
