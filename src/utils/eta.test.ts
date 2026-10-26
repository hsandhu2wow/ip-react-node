import { describe, it, expect } from 'vitest'
import { mapToETAMap, getETAString, stampCutOffTimes } from './eta'
import { formatDate, getYesterdayDate } from './formatters'
import type { ISQFMetricCard } from '../types/sqf.types'

const yesterday = formatDate(getYesterdayDate())

describe('mapToETAMap', () => {
  it('maps METRIC names and normalises the ETA onto the local "today"', () => {
    const now = new Date()
    const eta = mapToETAMap(
      [{ METRIC: 'Sales', Expected_Time: '22:00:00' }, { METRIC: 'Custom', Expected_Time: '01:00:00' }],
      now
    )
    expect(Object.keys(eta)).toEqual(['sales', 'Custom'])
    for (const { time } of Object.values(eta)) {
      expect(formatDate(time)).toBe(formatDate(now))
    }
    expect(eta.sales.time.getUTCHours()).toBe(22)
  })
})

describe('getETAString', () => {
  const eta = { sales: { time: new Date(2026, 9, 10, 7, 30) } }

  it("returns 'h:mm a' only when yesterday's data is selected", () => {
    expect(getETAString(eta, 'sales', yesterday)).toBe('7:30 AM')
    expect(getETAString(eta, 'sales', '2000-01-01')).toBeNull()
    expect(getETAString(eta, 'voc', yesterday)).toBeNull()
  })
})

describe('stampCutOffTimes', () => {
  const card = (status: string): ISQFMetricCard => ({
    cardName: 'sales',
    cardType: 'summary',
    status,
    error: { message: 'Data refresh failed' },
  })
  const time = new Date(Date.now() + 3_600_000)

  it('stamps cutOffTime/cutOffAt on error-NoDataFound cards only', () => {
    const [noData, other] = stampCutOffTimes(
      [card('error-NoDataFound'), card('error-Other')],
      { sales: { time } },
      yesterday
    )
    expect(noData.error?.cutOffTime).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
    expect(noData.error?.cutOffAt).toBe(time.getTime())
    expect(other.error?.cutOffTime).toBeUndefined()
  })
})
