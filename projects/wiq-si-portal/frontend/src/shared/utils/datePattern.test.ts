import { describe, it, expect } from 'vitest'
import { formatDatePattern, parseIsoDate } from './datePattern'

describe('formatDatePattern (Angular DatePipe subset)', () => {
  it('formats export file-name timestamps', () => {
    const d = new Date(2024, 2, 5, 14, 7)
    expect(formatDatePattern(d, 'M_d_yy_h_mm')).toBe('3_5_24_2_07')
    expect(formatDatePattern(d, 'M_d_yy_h_mm_a')).toBe('3_5_24_2_07_PM')
  })

  it('uses 12 for midnight/noon and AM before noon', () => {
    expect(formatDatePattern(new Date(2024, 11, 25, 0, 30), 'M_d_yy_h_mm_a')).toBe('12_25_24_12_30_AM')
    expect(formatDatePattern(new Date(2024, 11, 25, 12, 0), 'h_mm_a')).toBe('12_00_PM')
  })

  it('formats the recognise filter date', () => {
    expect(formatDatePattern(parseIsoDate('2024-01-09'), 'dd-MM-yyyy')).toBe('09-01-2024')
  })
})
