// src/components/cards/MetricCard/MetricCardTable.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import type { ISQFTableData, ISQFTableRow } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

/** Resolve header label whether it's a string or {text, tooltip} object */
function headerLabel(h: string | { text: string; tooltip?: string }): string {
  return typeof h === 'string' ? h : h.text
}

/** "column2" → 2 */
function columnIndex(colKey?: string): number | null {
  if (!colKey) return null
  const match = /column(\d+)/.exec(colKey)
  return match ? Number(match[1]) : null
}

type Cell = { displayValue?: string | number; color?: string; cssClass?: string } | undefined

function TableCell({ cell }: { cell: Cell }) {
  return (
    <td
      className={cell?.cssClass || ''}
      style={{ color: cell?.color || 'inherit' }}
      dangerouslySetInnerHTML={{ __html: String(cell?.displayValue ?? '-') }}
    />
  )
}

export function MetricCardTable({ tableData }: { tableData: ISQFTableData }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showShadow, setShowShadow] = useState(false)
  const freezeFirstColumn = !!tableData.freeze_first_column

  // Right-edge shadow hints that there are more columns to scroll to — hidden
  // once the table is scrolled all the way to its end (mirrors Angular's
  // sqf-basic-table showShadow/updateShadow logic).
  const updateShadow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowShadow(
      freezeFirstColumn &&
      el.scrollWidth > el.clientWidth &&
      el.scrollWidth - el.scrollLeft > el.clientWidth + 1
    )
  }, [freezeFirstColumn])

  useEffect(() => {
    updateShadow()
    window.addEventListener('resize', updateShadow)
    return () => window.removeEventListener('resize', updateShadow)
  }, [updateShadow, tableData])

  const headers = Array.isArray(tableData?.headers) ? tableData.headers : []
  const rows = Array.isArray(tableData?.data) ? tableData.data : []
  const footerRows = Array.isArray(tableData?.footer) ? tableData.footer : []

  if (headers.length === 0 && rows.length === 0) return null

  const columnCount = headers.length
  const displayedColumns = Array.from({ length: columnCount }, (_, i) => `column${i}`)
  const isNested = tableData.type === 'nested'
  const sortColIndex = columnIndex(tableData.sortCol)
  const sortAscending = tableData.sortOrder === 'asc'

  // Flatten nested rows: parent row followed by its breakdown children
  type FlatRow = ISQFTableRow & { _isChild?: boolean; _parentKey?: string; _hasChildren?: boolean }
  const flatRows: FlatRow[] = []
  rows.forEach((row, idx) => {
    const key = (row.key as string) || `row-${idx}`
    const hasChildren = isNested && Array.isArray(row.breakdown_table_data) && (row.breakdown_table_data as ISQFTableRow[]).length > 0
    flatRows.push({ ...row, _hasChildren: hasChildren, key })
    if (hasChildren) {
      ;(row.breakdown_table_data as ISQFTableRow[]).forEach((child, ci) => {
        flatRows.push({ ...child, _isChild: true, _parentKey: key, key: `${key}-child-${ci}` })
      })
    }
  })

  return (
    <div
      ref={scrollRef}
      className={`${styles.tableArea} ${showShadow ? styles.tableAreaShadow : ''}`}
      onScroll={updateShadow}
    >
      <table className={`${styles.table} ${freezeFirstColumn ? styles.stickyCol : ''}`}>
        <thead>
          <tr>
            {displayedColumns.map((_, i) => (
              <th key={i} className={tableData.headersCssClass?.[i] || ''}>
                {tableData.hasHTMLHeaders ? (
                  <div dangerouslySetInnerHTML={{ __html: headerLabel(headers[i]) }} />
                ) : (
                  <div>
                    {headerLabel(headers[i])}
                    {sortColIndex === i && (
                      <span className={`material-icons ${styles.sortIcon}`}>
                        {sortAscending ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flatRows.map(row => {
            const rowKey = row.key as string
            const isChild = row._isChild
            const hasChildren = row._hasChildren
            const parentKey = row._parentKey as string

            // Only show children when parent row is expanded
            if (isChild && expandedKey !== parentKey) return null

            return (
              <tr
                key={rowKey}
                className={isChild ? styles.childRow : ''}
                onClick={() => {
                  if (hasChildren) setExpandedKey(expandedKey === rowKey ? null : rowKey)
                }}
                style={{ cursor: hasChildren ? 'pointer' : 'default' }}
              >
                {displayedColumns.map((col, i) => {
                  const cell = row[col] as Cell
                  if (i === 0 && isNested && !isChild) {
                    return (
                      <td key={i} className={cell?.cssClass || ''} style={{ color: cell?.color || 'inherit' }}>
                        <span className={styles.firstCol}>
                          {hasChildren && (
                            <span className={`material-icons ${styles.expandIcon}`}>
                              {expandedKey === rowKey ? 'expand_more' : 'navigate_next'}
                            </span>
                          )}
                          <span dangerouslySetInnerHTML={{ __html: String(cell?.displayValue ?? '-') }} />
                        </span>
                      </td>
                    )
                  }
                  return <TableCell key={i} cell={cell} />
                })}
              </tr>
            )
          })}
        </tbody>
        {footerRows.length > 0 && (
          <tfoot>
            {footerRows.map((row, ri) => (
              <tr key={(row.key as string) ?? ri} className={styles.footerRow}>
                {displayedColumns.map((col, i) => (
                  <TableCell key={i} cell={row[col] as Cell} />
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  )
}
