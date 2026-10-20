import { describe, it, expect } from 'vitest'
import { mapGenericCards } from './sqf'
import type { ISQFMetricCard } from '../types/sqf.types'

const card = (cardName: string, extra: object = {}) => ({ cardName, cardType: 'summary', ...extra }) as ISQFMetricCard

describe('mapGenericCards (SqfMetricCardService.mapData)', () => {
  it('assigns jsId by index among non-error cards and apiType generic', () => {
    const out = mapGenericCards([card('sales'), card('nps', { hasError: true }), card('wastage')]) as ISQFMetricCard[]
    expect(out.map(c => c.jsId)).toEqual(['js-sales-summary-card-0', undefined, 'js-wastage-summary-card-1'])
    expect(out.map(c => c.apiType)).toEqual(['generic', undefined, 'generic'])
  })

  it('maps each period of a multi-period response, plain or wrapped', () => {
    const out = mapGenericCards({ WTD: [card('sales')], YDAY: { cards: [card('sales')], sortBy: 'az' } } as never) as Record<string, unknown>
    expect((out.WTD as ISQFMetricCard[])[0].jsId).toBe('js-sales-summary-card-0')
    expect((out.YDAY as { cards: ISQFMetricCard[]; sortBy: string }).cards[0].jsId).toBe('js-sales-summary-card-0')
    expect((out.YDAY as { sortBy: string }).sortBy).toBe('az')
  })

  it('derives the table-only layout from direct API content like Angular', () => {
    const tableData = { type: 'basic', headers: ['State'], data: [] }
    const out = mapGenericCards([
      card('table', { tableData }),
      card('chart', { tableData, chartData: { chartType: 'bar' } }),
      card('nested', { cards: [card('child', { tableData })] }),
    ]) as ISQFMetricCard[]
    expect(out.map(c => c.tableOnly)).toEqual([true, false, false])
  })
})
