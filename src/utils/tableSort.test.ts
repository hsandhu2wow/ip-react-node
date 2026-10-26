import { describe, it, expect } from 'vitest'
import { sortAccessor, sortTableRows } from './tableSort'

const row = (name: string, value: unknown) => ({ column0: { displayValue: name, value } })

describe('sortAccessor', () => {
  it('mirrors Angular CustomGenericTableDataSource format', () => {
    expect(sortAccessor(null)).toBe(Number.MAX_SAFE_INTEGER)
    expect(sortAccessor('12.5')).toBe(12.5)
    expect(sortAccessor('Zone 12')).toBe(12)
    expect(sortAccessor('Group 3 North')).toBe(3)
    expect(sortAccessor('NSW')).toBe('NSW')
  })
})

describe('sortTableRows', () => {
  it('sorts by column value in the requested order', () => {
    const rows = [row('a', '2'), row('b', '10'), row('c', '-1')]
    expect(sortTableRows(rows, 'column0', 'desc').map(r => r.column0.displayValue)).toEqual(['b', 'a', 'c'])
    expect(sortTableRows(rows, 'column0', 'asc').map(r => r.column0.displayValue)).toEqual(['c', 'a', 'b'])
  })

  it('orders Zone labels numerically rather than lexically', () => {
    const rows = [row('Zone 10', 'Zone 10'), row('Zone 2', 'Zone 2')]
    expect(sortTableRows(rows, 'column0', 'asc').map(r => r.column0.displayValue)).toEqual(['Zone 2', 'Zone 10'])
  })

  it('keeps API order when no sort column is set', () => {
    const rows = [row('b', 'b'), row('a', 'a')]
    expect(sortTableRows(rows, undefined, undefined)).toBe(rows)
  })
})
