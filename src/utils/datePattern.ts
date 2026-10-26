/**
 * Subset of Angular DatePipe patterns used by the Quick Facts exports:
 * 'M_d_yy_h_mm', 'M_d_yy_h_mm_a' and 'dd-MM-yyyy'.
 * Supported tokens: yyyy, yy, MM, M, dd, d, h, mm, a.
 */
export function formatDatePattern(date: Date, pattern: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours12 = date.getHours() % 12 || 12
  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    yy: pad(date.getFullYear() % 100),
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    dd: pad(date.getDate()),
    d: String(date.getDate()),
    h: String(hours12),
    mm: pad(date.getMinutes()),
    a: date.getHours() < 12 ? 'AM' : 'PM',
  }
  return pattern.replace(/yyyy|yy|MM|M|dd|d|h|mm|a/g, t => tokens[t])
}

/** Parses the filter's "yyyy-MM-dd" date as a local date (Angular keeps a Date). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
