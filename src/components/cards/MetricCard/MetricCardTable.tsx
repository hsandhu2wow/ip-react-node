// src/components/cards/MetricCard/MetricCardTable.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import type React from 'react'
import type { ISQFTableData, ISQFTableRow } from '../../../types/sqf.types'
import { sortTableRows, type SortOrder } from '../../../utils/tableSort'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import { CommentsTable } from './CommentsTable'
import styles from './MetricCard.module.css'

/** Resolve header label whether it's a string or {text, tooltip} object */
function headerLabel(h: string | { text: string; tooltip?: string }): string {
  return typeof h === 'string' ? h : h.text
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Angular UTIL.browser.mobile(): user-agent sniff deciding the scroll-help variant
const isMobileBrowser = () =>
  typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

type Cell = { displayValue?: string | number; color?: string; cssClass?: string } | undefined

function TableCell({ cell, className, style }: { cell: Cell; className?: string; style?: React.CSSProperties }) {
  return (
    <td className={className ?? (cell?.cssClass || '')} style={style}>
      <span
        style={{ color: cell?.color || 'inherit' }}
        dangerouslySetInnerHTML={{ __html: String(cell?.displayValue || '-') }}
      />
    </td>
  )
}

interface MetricCardTableProps {
  tableData: ISQFTableData
  /** Angular isSummary: picks the first-column width classes */
  isSummary?: boolean
  /** Summary card expanded (Angular qf-summary-card__table--expanded): no max-height at ≥1024px */
  expanded?: boolean
  /** Rendered inside sqf-tabs (.sqf-tab-content-table) */
  inTabs?: boolean
}

export function MetricCardTable(props: MetricCardTableProps) {
  // Angular cards/tabs switch on tableData.type: comments tables use sqf-comments-table
  return props.tableData.type === 'comments' ? <CommentsTable tableData={props.tableData} /> : <StandardTable {...props} />
}

function StandardTable({ tableData, isSummary = false, expanded = false, inTabs = false }: MetricCardTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showShadow, setShowShadow] = useState(false)
  const [showScrollHelp, setShowScrollHelp] = useState(false)
  const [tooltipsOpen, setTooltipsOpen] = useState(false)
  const freezeFirstColumn = !!tableData.freeze_first_column
  // Mirrors Angular matSort: initial sort from the API, header click toggles asc/desc (no clear)
  const [sort, setSort] = useState<{ col?: string; order?: SortOrder }>({})
  useEffect(() => {
    setSort({ col: tableData.sortCol, order: tableData.sortOrder as SortOrder | undefined })
    setExpandedKey(null)
  }, [tableData])

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

  // Angular updateScrollHelpTextFlag: hint shown only when the table overflows horizontally
  const updateScrollHelp = useCallback(() => {
    const el = scrollRef.current
    setShowScrollHelp(!!(el && el.scrollWidth > el.clientWidth))
  }, [])

  useEffect(() => {
    const onResize = () => { updateShadow(); updateScrollHelp() }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [updateShadow, updateScrollHelp, tableData, expanded])

  const headers = Array.isArray(tableData?.headers) ? tableData.headers : []
  const rows = Array.isArray(tableData?.data) ? tableData.data : []
  const footerRows = Array.isArray(tableData?.footer) ? tableData.footer : []

  if (headers.length === 0 && rows.length === 0) return null

  const tooltips = headers.flatMap(h =>
    typeof h !== 'string' && h.tooltip ? [{ column: h.text, tooltip: h.tooltip }] : []
  )
  const scrollHelpText = isMobileBrowser() ? tableData.scrollHelpText?.mobile : tableData.scrollHelpText?.desktop
  const columnCount = headers.length
  const displayedColumns = Array.from({ length: columnCount }, (_, i) => `column${i}`)
  const isNested = tableData.type === 'nested'
  const tableWithoutHeaders = tableData.type !== 'nested' && !!tableData.tableWithoutHeaders
  const columnWidth = tableData.columnWidth ?? []
  const widthStyle = (i: number): React.CSSProperties | undefined =>
    columnWidth[i] ? { width: columnWidth[i], minWidth: columnWidth[i], maxWidth: columnWidth[i] } : undefined

  function handleSort(col: string) {
    setSort(prev =>
      prev.col === col ? { col, order: prev.order === 'asc' ? 'desc' : 'asc' } : { col, order: 'asc' }
    )
  }

  // Flatten nested rows: parent row followed by its breakdown children
  type FlatRow = ISQFTableRow & { _isChild?: boolean; _parentKey?: string; _hasChildren?: boolean }
  const flatRows: FlatRow[] = []
  sortTableRows(rows, sort.col, sort.order).forEach((row, idx) => {
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
    <>
      {tooltips.length > 0 && (
        <button type="button" className={styles.tooltipBanner} onClick={() => setTooltipsOpen(true)}>
          <span className={`material-icons ${styles.tooltipBannerIcon}`} aria-hidden="true">info_outlined</span>
          Column header definitions
        </button>
      )}
      {tableData.scrollHelpText && showScrollHelp && (
        <div className={styles.scrollHelp} data-testid="scroll-help">
          <span className={`material-icons-outlined ${styles.scrollHelpIcon}`} aria-hidden="true">
            {isMobileBrowser() ? 'swipe' : 'mouse'}
          </span>
          <span dangerouslySetInnerHTML={{ __html: scrollHelpText ?? '' }} />
        </div>
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
      {/* Angular .qf-scroll-container-wrapper: holds the right-edge shadow so it stays
          fixed while the inner .qf-scroll-container scrolls */}
      <div className={`${styles.tableShadowWrap} ${showShadow ? styles.tableAreaShadow : ''}`}>
      <div
        ref={scrollRef}
        className={`${styles.tableArea} ${inTabs ? styles.tableAreaInTabs : ''} ${expanded ? styles.tableAreaExpanded : ''}`}
        onScroll={updateShadow}
      >
        <table className={`${styles.table} ${isNested ? '' : styles.basicTable} ${tableWithoutHeaders ? styles.plainTable : ''} ${freezeFirstColumn ? styles.stickyCol : ''}`}>
          {!tableWithoutHeaders && <thead>
            <tr>
              {displayedColumns.map((col, i) => {
                const active = sort.col === col && !!sort.order
                const widthClass = i === 0 && columnCount > 5
                  ? (isSummary ? `${styles.w70} ${styles.xsmW70}` : `${styles.smW125} ${styles.xsmW70}`)
                  : ''
                return (
                  <th
                    key={i}
                    className={`${tableData.headersCssClass?.[i] || ''} ${widthClass} ${isNested ? '' : styles.sortableHeader}`}
                    style={{ ...(i > 0 && tableData.customMinWidth ? { minWidth: tableData.customMinWidth } : {}), ...widthStyle(i) }}
                    // Angular nested tables use matSortDisabled: initial API sort only, no header clicks
                    onClick={isNested ? undefined : () => handleSort(col)}
                    aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className={styles.headerContent}>
                      <div className={styles.headerLabel}>
                        {tableData.hasHTMLHeaders ? (
                          <div dangerouslySetInnerHTML={{ __html: headerLabel(headers[i]) }} />
                        ) : (
                          <div>{headerLabel(headers[i])}</div>
                        )}
                      </div>
                      {/* mat-sort-header-arrow: 24px Material Symbols arrow in a 12px box, flipped when descending */}
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
          </thead>}
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
                  style={{ height: isNested ? undefined : row.rowHeight, cursor: hasChildren ? 'pointer' : undefined }}
                >
                  {displayedColumns.map((col, i) => {
                    const cell = row[col] as Cell
                    if (i === 0 && isNested && !isChild) {
                      return (
                        <td key={i} className={cell?.cssClass || ''} style={{ ...widthStyle(i), color: cell?.color || 'inherit' }}>
                          <span className={styles.firstCol}>
                            {hasChildren && (
                              <span className={`material-icons ${styles.expandIcon}`}>
                                {expandedKey === rowKey ? 'expand_more' : 'navigate_next'}
                              </span>
                            )}
                            <span dangerouslySetInnerHTML={{ __html: String(cell?.displayValue || '-') }} />
                          </span>
                        </td>
                      )
                    }
                    return <TableCell key={i} cell={cell} style={widthStyle(i)} />
                  })}
                </tr>
              )
            })}
          </tbody>
          {footerRows.length > 0 && (
            <tfoot>
              {footerRows.map((row, ri) => (
                <tr key={(row.key as string) ?? ri} className={styles.footerRow} style={{ height: isNested ? undefined : row.rowHeight }}>
                  {/* Angular footer cells take the header's css class, keeping Total aligned with its column */}
                  {displayedColumns.map((col, i) => (
                    <TableCell
                      key={i}
                      cell={row[col] as Cell}
                      className={tableData.headersCssClass?.[i] || ''}
                      style={widthStyle(i)}
                    />
                  ))}
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>
      </div>
      {tableData.richText && <div className={styles.tableRichText} dangerouslySetInnerHTML={{ __html: tableData.richText }} />}
    </>
  )
}
