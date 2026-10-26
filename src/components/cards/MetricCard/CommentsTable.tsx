import { useEffect, useState } from 'react'
import type { ISQFTableData, ISQFTableRow } from '../../../types/sqf.types'
import { sortTableRows, type SortOrder } from '../../../utils/tableSort'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import styles from './MetricCard.module.css'

type Header = string | { text: string; tooltip?: string }
type Cell = { displayValue?: string | number; color?: string } | undefined

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// CDK Breakpoints.XSmall
const isXSmall = () => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 599.98px)').matches

/** Port of Angular sqf-comments-table: sortable comments with fixed first-two-column widths. */
export function CommentsTable({ tableData }: { tableData: ISQFTableData }) {
  const [sort, setSort] = useState<{ col?: string; order?: SortOrder }>({})
  const [tooltipsOpen, setTooltipsOpen] = useState(false)
  useEffect(() => {
    setSort({ col: tableData.sortCol, order: tableData.sortOrder as SortOrder | undefined })
  }, [tableData])

  const isMobile = isXSmall()
  const headers: Header[] = (isMobile ? tableData.mobileHeaders : tableData.headers) ?? []
  const rows: ISQFTableRow[] = (isMobile ? tableData.mobileData : tableData.data) ?? []
  const columns = headers.map((_, i) => `column${i}`)
  const tooltips = headers.flatMap(h => (typeof h !== 'string' && h.tooltip ? [{ column: h.text, tooltip: h.tooltip }] : []))

  function handleSort(col: string) {
    setSort(prev => (prev.col === col ? { col, order: prev.order === 'asc' ? 'desc' : 'asc' } : { col, order: 'asc' }))
  }

  return (
    <>
      {tooltips.length > 0 && (
        <button type="button" className={styles.tooltipBanner} onClick={() => setTooltipsOpen(true)}>
          Column header definitions
          <span className={`material-icons ${styles.tooltipBannerIcon}`} aria-hidden="true">info_outlined</span>
        </button>
      )}
      {tooltipsOpen && (
        <InfoModal
          title="Column Header Definitions"
          body={`<table class="${styles.tooltipTable}"><tr><th>Column Header</th><th>Column Definition</th></tr>${tooltips
            .map(t => `<tr><td>${escapeHtml(t.column)}</td><td>${escapeHtml(t.tooltip)}</td></tr>`)
            .join('')}</table>`}
          onClose={() => setTooltipsOpen(false)}
        />
      )}
      <div className={styles.tableArea}>
        <table className={`${styles.table} ${styles.commentsTable}`} data-testid="comments-table">
          <thead>
            <tr>
              {columns.map((col, i) => {
                const active = sort.col === col && !!sort.order
                const h = headers[i]
                return (
                  <th
                    key={col}
                    className={styles.sortableHeader}
                    style={i === 0 ? { width: '300px' } : i === 1 ? { width: '100px' } : undefined}
                    onClick={() => handleSort(col)}
                    aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className={styles.headerContent}>
                      <div className={styles.headerLabel}>{typeof h === 'string' ? h : h.text}</div>
                      <span
                        className={`${styles.sortIcon} ${active ? styles.sortIconActive : ''} ${active && sort.order === 'desc' ? styles.sortIconDesc : ''}`}
                        aria-hidden="true"
                      >
                        <svg viewBox="0 -960 960 960" focusable="false">
                          <path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" />
                        </svg>
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortTableRows(rows, sort.col, sort.order).map((row, ri) => (
              <tr key={(row.key as string) ?? ri}>
                {columns.map((col, i) => {
                  const cell = row[col] as Cell
                  const cls = [isMobile ? styles.commentsMobileRow : '', i === columns.length - 1 ? styles.commentsLastCell : '']
                  return (
                    <td key={col} className={cls.join(' ').trim() || undefined}>
                      <span style={{ color: cell?.color }} dangerouslySetInnerHTML={{ __html: String(cell?.displayValue || '-') }} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
