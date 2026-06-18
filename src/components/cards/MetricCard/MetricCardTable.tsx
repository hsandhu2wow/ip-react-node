// src/components/cards/MetricCard/MetricCardTable.tsx
import { useState } from 'react'
import type { ISQFTableData, ISQFTableRow } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

/** Resolve header label whether it's a string or {text, tooltip} object */
function headerLabel(h: string | { text: string; tooltip?: string }): string {
  return typeof h === 'string' ? h : h.text
}

export function MetricCardTable({ tableData }: { tableData: ISQFTableData }) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const headers = Array.isArray(tableData?.headers) ? tableData.headers : []
  const rows = Array.isArray(tableData?.data) ? tableData.data : []

  if (headers.length === 0 && rows.length === 0) return null

  const columnCount = headers.length
  const displayedColumns = Array.from({ length: columnCount }, (_, i) => `column${i}`)
  const isNested = tableData.type === 'nested'

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
    <div className={styles.tableArea}>
      <table className={styles.table}>
        <thead>
          <tr>
            {displayedColumns.map((_, i) => (
              <th key={i}>{headerLabel(headers[i])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flatRows.map((row) => {
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
                  const cell = row[col] as { displayValue?: string | number; color?: string; cssClass?: string } | undefined
                  return (
                    <td
                      key={i}
                      className={cell?.cssClass || ''}
                      style={{ color: cell?.color || 'inherit' }}
                      dangerouslySetInnerHTML={{ __html: String(cell?.displayValue ?? '') }}
                    />
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

