// src/utils/formatters.test.ts
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import {
  colorVal,
  beautify,
  beautifyUpwards,
  formatDate,
  getYesterdayDate,
  REPORTING_PERIODS,
  isCutOffTimePast,
  formatUpdatedTime,
} from './formatters'

describe('colorVal', () => {
  it('returns positive for values > 0', () => {
    expect(colorVal(5)).toBe('positive')
    expect(colorVal('3.14')).toBe('positive')
  })
  it('returns negative for values < 0', () => {
    expect(colorVal(-2)).toBe('negative')
    expect(colorVal('-0.5')).toBe('negative')
  })
  it('returns neutral for zero', () => {
    expect(colorVal(0)).toBe('neutral')
    expect(colorVal('0')).toBe('neutral')
  })
  it('returns neutral for NaN/empty', () => {
    expect(colorVal('')).toBe('neutral')
    expect(colorVal('abc')).toBe('neutral')
  })
  it('reverses logic when reversed=true', () => {
    expect(colorVal(5, true)).toBe('negative')
    expect(colorVal(-2, true)).toBe('positive')
  })
})

describe('beautify', () => {
  it('formats thousands with K', () => {
    expect(beautify(1000)).toBe('$1K')
    expect(beautify(1500)).toBe('$1.5K')
  })
  it('formats millions with M', () => {
    expect(beautify(1200000)).toBe('$1.2M')
  })
  it('formats negative values with - prefix', () => {
    expect(beautify(-5000)).toBe('-$5K')
  })
  it('omits dollar sign when appendDollar=false', () => {
    expect(beautify(1000, 1, false)).toBe('1K')
  })
  it('handles values < 1000', () => {
    expect(beautify(500)).toBe('$500')
  })
})

describe('beautifyUpwards', () => {
  it('returns 0 for falsy input', () => {
    expect(beautifyUpwards(0)).toBe(0)
    expect(beautifyUpwards('')).toBe(0)
  })
  it('formats thousands', () => {
    const result = String(beautifyUpwards(1500))
    expect(result).toContain('K')
  })
})

describe('formatDate', () => {
  it('formats a Date to yyyy-MM-dd', () => {
    const d = new Date(2026, 5, 16) // June 16 2026
    expect(formatDate(d)).toBe('2026-06-16')
  })
  it('pads month and day with zeros', () => {
    const d = new Date(2026, 0, 5) // Jan 5 2026
    expect(formatDate(d)).toBe('2026-01-05')
  })
})

describe('getYesterdayDate', () => {
  it('returns a Date that is before now', () => {
    const yesterday = getYesterdayDate()
    expect(yesterday.getTime()).toBeLessThan(Date.now())
  })
})

describe('REPORTING_PERIODS', () => {
  it('maps WTD to Week-to-date', () => {
    expect(REPORTING_PERIODS['WTD']).toBe('Week-to-date')
  })
  it('maps MTD to Month-to-date', () => {
    expect(REPORTING_PERIODS['MTD']).toBe('Month-to-date')
  })
})

describe('isCutOffTimePast', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is true only when a stamped ETA has passed', () => {
    expect(isCutOffTimePast({ cutOffTime: '7:30 AM', cutOffAt: Date.now() - 1000 })).toBe(true)
    expect(isCutOffTimePast({ cutOffTime: '7:30 AM', cutOffAt: Date.now() + 60_000 })).toBe(false)
  })

  it('is false without a cut-off time or ETA', () => {
    expect(isCutOffTimePast(undefined)).toBe(false)
    expect(isCutOffTimePast({ cutOffTime: null, cutOffAt: Date.now() - 1000 })).toBe(false)
    expect(isCutOffTimePast({ cutOffTime: '7:30 AM' })).toBe(false)
  })
})

describe('formatUpdatedTime', () => {
  it("formats like Angular 'MMM d, h:mm a'", () => {
    expect(formatUpdatedTime(new Date(2026, 9, 10, 4, 55))).toBe('Oct 10, 4:55 AM')
    expect(formatUpdatedTime(new Date(2026, 9, 1, 12, 5))).toBe('Oct 1, 12:05 PM')
  })
})
