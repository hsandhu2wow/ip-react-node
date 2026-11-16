import { describe, it, expect } from 'vitest'
import { getOrderedCardDropDown } from './cardDropdown'
import type { IAvailableMetricCards } from '../types/sqf.types'

const status = {
  sales: { details: 1, details_last_level: 3, sequence: 2, titleText: 'Sales' },
  wages: { details: 1, details_last_level: 1, sequence: 1, titleText: 'Wages' },
  voc: { details: 0, details_last_level: 3, sequence: 0 },
  cfc: { details: 1, details_last_level: 3, sequence: 3, show_only_cfc: true },
  online: { details: 1, details_last_level: 3, sequence: 4 },
} as unknown as IAvailableMetricCards

describe('getOrderedCardDropDown', () => {
  it('keeps details-enabled, non-CFC cards ordered by sequence', () => {
    expect(getOrderedCardDropDown(status, 0)).toEqual([
      { name: 'wages', displayName: 'Wages' },
      { name: 'sales', displayName: 'Sales' },
      { name: 'online', displayName: 'online' },
    ])
  })

  it('includes a CFC-only Seasonal details entry only for CFC selections', () => {
    const cards = { seasonal: { details: 1, sequence: 1, show_only_cfc: true },
      hiddenAtCFC: { details: 1, sequence: 2, hide_cfc: true } }
    expect(getOrderedCardDropDown(cards, 0, true).map(c => c.name)).toEqual(['seasonal'])
    expect(getOrderedCardDropDown(cards, 0, false).map(c => c.name)).toEqual(['hiddenAtCFC'])
  })

  it('drops cards whose details_last_level is above the selected depth', () => {
    expect(getOrderedCardDropDown(status, 2).map(c => c.name)).toEqual(['sales', 'online'])
  })
})
