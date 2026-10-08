import { describe, it, expect } from 'vitest'
import { normalizePeriods, resolveActivePeriod } from './periods'

const card = (cardName: string) => ({ cardName, cardType: 'summary' as const })

describe('normalizePeriods', () => {
  it('handles the { WTD, YDAY } array shape', () => {
    const r = normalizePeriods({ WTD: [card('a')], YDAY: [card('b')] })
    expect(r.periods.WTD?.[0].cardName).toBe('a')
    expect(r.periods.YDAY?.[0].cardName).toBe('b')
  })

  it('handles the { cards, sortBy } per-period shape', () => {
    const r = normalizePeriods({ WTD: { cards: [card('a')], sortBy: 'za' } })
    expect(r.periods.WTD).toHaveLength(1)
    expect(r.sortBy.WTD).toBe('za')
    expect(r.periods.YDAY).toBeUndefined()
  })

  it('treats a legacy array as WTD', () => {
    const r = normalizePeriods([card('a')])
    expect(r.periods.WTD).toHaveLength(1)
    expect(r.periods.YDAY).toBeUndefined()
  })

  it('drops invalid values and handles single period', () => {
    expect(normalizePeriods({ WTD: 'x', YDAY: null }).periods).toEqual({})
    expect(normalizePeriods(undefined).periods).toEqual({})
    expect(normalizePeriods({}).periods).toEqual({})
    expect(Object.keys(normalizePeriods({ YDAY: [] }).periods)).toEqual(['YDAY'])
  })
})

describe('resolveActivePeriod', () => {
  it('keeps the selected period when available', () => {
    expect(resolveActivePeriod('YDAY', ['WTD', 'YDAY'])).toBe('YDAY')
  })
  it('falls back to the first available period', () => {
    expect(resolveActivePeriod('YDAY', ['WTD'])).toBe('WTD')
  })
  it('keeps the selection when nothing is available yet', () => {
    expect(resolveActivePeriod('YDAY', [])).toBe('YDAY')
  })
})
