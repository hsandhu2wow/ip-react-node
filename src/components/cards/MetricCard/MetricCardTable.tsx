// src/components/cards/MetricCard/MetricCardTable.tsx
import { useState } from 'react'
import type { ISQFTableData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

const DEFAULT_ROWS = 5

export function MetricCardTable({ tableData }: { tableData: ISQFTableData }) {
  const [expanded, setExpanded] = useState(false)
  // Guard: backend can return rows/headers as non-array values at runtime
  const allRows = Array.isArray(tableData?.rows) ? tableData.rows : []
  const allHeaders = Array.isArray(tableData?.headers) ? tableData.headers : []
  const rows = expanded ? allRows : allRows.slice(0, DEFAULT_ROWS)
  return (
    <div className={styles.tableArea}>
      <table className={styles.table}>
        <thead>
          <tr>{allHeaders.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell ?? '—'}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {allRows.length > DEFAULT_ROWS && (
        <button className={styles.expandToggle} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less ▴' : `Show all ${allRows.length} ▾`}
        </button>
      )}
    </div>
  )
}
