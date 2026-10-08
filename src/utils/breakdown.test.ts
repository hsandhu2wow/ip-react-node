import { describe, it, expect } from 'vitest'
import { resolveChildCardForAxis, isLegacyBreakdownCard } from './breakdown'
import type { ISQFMetricCard } from '../types/sqf.types'

const sub = (cardName: string, keys: Record<string, string>) =>
  ({ cardName, cardType: 'summary', keys } as ISQFMetricCard)

const axisCard: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'summary',
  filterKeys: { view: 'view' },
  dropdowns: [{ key: 'view', data: [{ key: 'hierarchy', text: 'Zones' }, { key: 'department', text: 'Depts' }] }],
  cards: [sub('h', { view: 'hierarchy' }), sub('d', { view: 'department' })],
}

describe('resolveChildCardForAxis', () => {
  it('resolves the childLevel axis via the hierarchy key', () => {
    expect(resolveChildCardForAxis(axisCard, 'childLevel')?.cardName).toBe('h')
  })
  it('resolves the department axis', () => {
    expect(resolveChildCardForAxis(axisCard, 'department')?.cardName).toBe('d')
  })
  it('accepts proposition as a department key', () => {
    const card: ISQFMetricCard = {
      ...axisCard,
      dropdowns: [{ key: 'view', data: [{ key: 'proposition', text: 'P' }] }],
      cards: [sub('p', { view: 'proposition' })],
    }
    expect(resolveChildCardForAxis(card, 'department')?.cardName).toBe('p')
  })
  it('defaults non-axis dimensions to their first option', () => {
    const card: ISQFMetricCard = {
      cardName: 'x',
      cardType: 'summary',
      filterKeys: { view: 'view', per: 'per' },
      dropdowns: [
        { key: 'view', data: [{ key: 'hierarchy', text: 'Z' }] },
        { key: 'per', data: [{ key: 'WTD', text: 'W' }, { key: 'ETD', text: 'E' }] },
      ],
      cards: [sub('a', { view: 'hierarchy', per: 'ETD' }), sub('b', { view: 'hierarchy', per: 'WTD' })],
    }
    expect(resolveChildCardForAxis(card, 'childLevel')?.cardName).toBe('b')
  })
  it('returns null when the card has no option for the axis (partial rollout)', () => {
    const card: ISQFMetricCard = {
      ...axisCard,
      dropdowns: [{ key: 'view', data: [{ key: 'hierarchy', text: 'Z' }] }],
    }
    expect(resolveChildCardForAxis(card, 'department')).toBeNull()
  })
  it('returns null for cards without filter config', () => {
    expect(resolveChildCardForAxis({ cardName: 'a', cardType: 'summary' }, 'childLevel')).toBeNull()
  })
})

describe('isLegacyBreakdownCard', () => {
  it('is false for axis cards', () => {
    expect(isLegacyBreakdownCard(axisCard)).toBe(false)
  })
  it('is true when no dropdown offers an axis option', () => {
    const card: ISQFMetricCard = {
      ...axisCard,
      dropdowns: [{ key: 'view', data: [{ key: 'ETD', text: 'E' }, { key: 'WTD', text: 'W' }] }],
    }
    expect(isLegacyBreakdownCard(card)).toBe(true)
  })
  it('is false for cards without filter config', () => {
    expect(isLegacyBreakdownCard({ cardName: 'a', cardType: 'summary' })).toBe(false)
  })
})
