import type { ISQFTableRow } from '../types/sqf.types'

export type SortOrder = 'asc' | 'desc'

/** Mirrors the `format` accessor in Angular's CustomGenericTableDataSource */
export function sortAccessor(value: unknown): string | number {
  if (value === null) return Number.MAX_SAFE_INTEGER
  if (!value || !isNaN(Number(value))) return parseFloat(value as string)
  const str = String(value)
  if (str.includes('Group') || str.includes('Zone')) {
    const match = str.match(/\d+/)
    if (match) return parseInt(match[0])
  }
  return str
}

/** Mirrors MatTableDataSource.sortData's comparator (mixed types compared as strings) */
function compare(a: string | number, b: string | number): number {
  let valueA: string | number = a
  let valueB: string | number = b
  if (typeof valueA !== typeof valueB) {
    valueA = String(valueA)
    valueB = String(valueB)
  }
  if (valueA > valueB) return 1
  if (valueA < valueB) return -1
  return 0
}

/** Sorts rows by `row[col].value`, like Angular's mat-table + matSort. */
export function sortTableRows<T extends ISQFTableRow>(rows: T[], col: string | undefined, order: SortOrder | undefined): T[] {
  if (!col || !order) return rows
  const dir = order === 'asc' ? 1 : -1
  const val = (row: T) => sortAccessor((row[col] as { value?: unknown } | undefined)?.value)
  return [...rows].sort((a, b) => compare(val(a), val(b)) * dir)
}
