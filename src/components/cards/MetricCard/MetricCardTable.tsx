// src/components/cards/MetricCard/MetricCardTable.tsx
import { useState } from 'react'
import type { ISQFTableData } from '../../../types/sqf.types'
import styles from './MetricCard.module.css'

const DEFAULT_ROWS = 5

export function MetricCardTable({ tableData }: { tableData: ISQFTableData }) {
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? tableData.rows : tableData.rows.slice(0, DEFAULT_ROWS)
  return (
    <div className={styles.tableArea}>
      <table className={styles.table}>
        <thead>
          <tr>{tableData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell ?? '—'}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {tableData.rows.length > DEFAULT_ROWS && (
        <button className={styles.expandToggle} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less ▴' : `Show all ${tableData.rows.length} ▾`}
        </button>
      )}
    </div>
  )
}
