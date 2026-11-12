// src/utils/formatters.ts

/** Maps API reporting period codes to display text (mirrors Angular SqfCardsService) */
export const REPORTING_PERIODS: Record<string, string> = {
  WTD: 'Week-to-date',
  MTD: 'Month-to-date',
  YTD: 'Year-to-date',
  YDAY: 'Yesterday',
  ETD: 'Event-to-date',
  L7D: 'Last 7-Days',
  LW: 'Last week',
  CW: 'Current week',
  '7DR': '7-day rolling',
  HTD: 'Half-to-date',
  QTD: 'Quarter-to-date',
  '3MR': '3-month rolling',
  '12MR': '12-month rolling',
  MIT: 'Moment in time',
}

/** CSS class name for a numeric value (mirrors Angular SqfCardsService.colorVal) */
export function colorVal(
  value: number | string,
  reversed = false
): 'positive' | 'negative' | 'neutral' {
  const parsed = parseFloat(String(value))
  if (isNaN(parsed) || parsed === 0) return 'neutral'
  if (reversed) return parsed > 0 ? 'negative' : 'positive'
  return parsed < 0 ? 'negative' : 'positive'
}

/** Formats large numbers with K/M/B/T suffixes and optional $ prefix */
export function beautify(
  n: number | string,
  decimal = 1,
  appendDollar = true
): string {
  const num = parseFloat(String(n))
  if (isNaN(num)) return String(n)
  const negative = num < 0
  const abs = Math.abs(num)
  let result: string
  if (abs < 1e3) {
    result = String(abs)
  } else if (abs < 1e6) {
    result = `${+(abs / 1e3).toFixed(decimal)}K`
  } else if (abs < 1e9) {
    result = `${+(abs / 1e6).toFixed(decimal)}M`
  } else if (abs < 1e12) {
    result = `${+(abs / 1e9).toFixed(decimal)}B`
  } else {
    result = `${+(abs / 1e12).toFixed(decimal)}T`
  }
  const prefix = appendDollar ? '$' : ''
  return negative ? `-${prefix}${result}` : `${prefix}${result}`
}

/** Formats numbers upward (no $ prefix, matches Angular SqfCardsService.beautifyUpwards) */
export function beautifyUpwards(value: number | string, decimal = 1): string | number {
  if (!value) return 0
  const val = parseFloat(parseFloat(String(value)).toFixed(2))
  const suffixes = ['', 'K', 'M', 'B', 'T']
  const suffixNum = Math.floor(('' + parseInt(String(val))).length / 3)
  let shortValue: any = parseFloat(
    (suffixNum !== 0 ? val / Math.pow(1000, suffixNum) : val).toPrecision(2)
  )
  if (shortValue % 1 !== 0) {
    shortValue = shortValue.toFixed(decimal)
  }
  return shortValue + suffixes[suffixNum]
}

/** Formats a Date to yyyy-MM-dd string */
export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Returns yesterday as a Date */
export function getYesterdayDate(): Date {
  return new Date(Date.now() - 86_400_000)
}

/**
 * Mirrors Angular SqfCardsService.isCutOffTimePast: true when the card's data-load
 * ETA (stamped as error.cutOffAt) has already passed.
 */
export function isCutOffTimePast(error?: { cutOffTime?: string | null; cutOffAt?: number }): boolean {
  if (!error?.cutOffTime || error.cutOffAt == null) return false
  return error.cutOffAt < Date.now()
}

/** Formats a date like Angular's DatePipe 'MMM d, h:mm a', e.g. "Oct 10, 4:55 AM" */
export function formatUpdatedTime(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const month = d.toLocaleString('en-US', { month: 'short' })
  const h = d.getHours() % 12 || 12
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${month} ${d.getDate()}, ${h}:${mm} ${d.getHours() < 12 ? 'AM' : 'PM'}`
}
