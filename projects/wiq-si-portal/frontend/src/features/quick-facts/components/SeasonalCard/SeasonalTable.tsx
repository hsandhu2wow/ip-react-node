import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ISeasonalTable } from '../../../../shared/types/sqf.types'
import type { SortOrder } from '../../../../shared/utils/tableSort'
import { InfoModal } from '../../../../shared/components/InfoModal/InfoModal'
import metricStyles from '../MetricCard/MetricCard.module.scss'
import styles from './SeasonalTable.module.scss'

interface Props {
  tableData: ISeasonalTable[]
  childCode?: string
  cardLevel?: string
  zeroSalesSohArticles?: number | null
}
type Column = keyof ISeasonalTable
const defaultColumns: Column[] = ['state', 'sellThruByCommitment', 'sellThruBySOH', 'salesQtyTy', 'salesQtyTyVsLyPerc', 'salesETD', 'salesVsLyETD']
const articleColumns: Column[] = ['state', 'sellThruByCommitment', 'optimized_sell_thru', 'soh', 'salesQtyTy', 'salesETD']
const definitions = {
  commitment: { column: 'Sell Thru by Commitment', tooltip: 'The sell-through by Commitment is calculated as sales units divided by commitment units.' },
  soh: { column: 'Sell Through by SOH', tooltip: 'The Sell Through by SOH is calculated as sales units divided by the sum of sales units and stock on hand (SOH) units' },
  qty: { column: 'Sales QTY', tooltip: 'Event to date total sales quantity' },
  ly: { column: 'QTY vs LY', tooltip: 'Percentage change in event to date sales unit compared with last year.(Sales Qty TY / Sales Qty LY) -1' },
  optimized: { column: 'Optimised Sell-Through', tooltip: "This metric represents a target sell-through rate based on last year's performance. ETD Sales Quantity TY  /Total Sales Quantity LY" },
}
const currency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
const titlecase = (value: string) => value.replace(/\S+/g, word => word[0].toUpperCase() + word.slice(1).toLowerCase())

// The legacy CustomTableDataSource parses only salesVsLyETD, not every %-formatted column.
function sortValue(row: ISeasonalTable, column: string): string | number | null | undefined {
  if (column === 'salesETD') return row.salesETDUnFormatted
  if (column === 'salesLyETD') return undefined
  if (column === 'salesVsLyETD') return parseFloat(row.salesVsLyETD || '') || 0
  const value = row[column as Column]
  if (typeof value === 'string' && /Group|Zone/.test(value)) return parseInt(value.match(/\d+/)?.[0] || '')
  return value
}
function sortedRows(rows: ISeasonalTable[], column: string, order: SortOrder) {
  return [...rows].sort((a, b) => {
    let av = sortValue(a, column)
    let bv = sortValue(b, column)
    let result = 0
    if (av != null && bv != null) {
      if (typeof av !== typeof bv) { av = String(av); bv = String(bv) }
      result = av > bv ? 1 : av < bv ? -1 : 0
    } else if (av != null) result = 1
    else if (bv != null) result = -1
    return result * (order === 'asc' ? 1 : -1)
  })
}

export function SeasonalTable({ tableData, childCode = '', cardLevel, zeroSalesSohArticles }: Props) {
  const [sort, setSort] = useState<{ column: string; order: SortOrder }>({ column: 'salesWTD', order: 'desc' })
  const [tooltipsOpen, setTooltipsOpen] = useState(false)
  const articles = childCode.includes('NSLS')
  const columns = articles ? articleColumns : defaultColumns
  const tooltips = articles ? [definitions.commitment, definitions.optimized, definitions.soh, definitions.qty]
    : [definitions.commitment, definitions.soh, definitions.qty, definitions.ly]
  const labels: Partial<Record<Column, ReactNode>> = {
    state: articles ? 'Articles' : cardLevel === 'Department' ? 'Category' : 'Focus Segments',
    sellThruByCommitment: <>Commit<br />Sell Thru</>, sellThruBySOH: 'SOH Sell Thru',
    salesQtyTy: <>Sales<br />QTY</>, salesQtyTyVsLyPerc: <>QTY<br />vs LY</>, salesETD: 'Sales',
    salesVsLyETD: 'Sales vs LY', optimized_sell_thru: <>Optimized <br />Sell Thru</>, soh: 'SOH',
  }
  const header = articles ? '<strong>The metric provides list of articles which have SOH but No Sales /Low Sales.</strong>' : ''
  const footer = !articles && cardLevel === 'Department' ? 'Note :Overall metric values will be slightly different from category metric values' : ''
  return (
    <div className={styles.root}>
      <button className={styles.tooltipBanner} onClick={() => setTooltipsOpen(true)} aria-label="Column header definitions">
        <span aria-hidden="true" className={`material-icons ${styles.tooltipIcon}`}>info_outlined</span> Column header definitions
      </button>
      {tooltipsOpen && <InfoModal title="Column Header Definitions" body={`${header}<table class="${metricStyles.tooltipTable}"><tr><th>Column Header</th><th>Column Definition</th></tr>${tooltips.map(t => `<tr><td>${t.column}</td><td>${t.tooltip}</td></tr>`).join('')}</table>${footer}`} onClose={() => setTooltipsOpen(false)} />}
      <table className={`qf-table ${styles.table}`}>
        <thead><tr>{columns.map(column => <th key={column} className={`qf-table__header ${metricStyles.sortableHeader} ${column === 'state' ? '' : 'right-align'}`}
          aria-sort={sort.column === column ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
          <button onClick={() => setSort(s => ({ column, order: s.column === column && s.order === 'asc' ? 'desc' : 'asc' }))}>
            <span>{labels[column]}</span>
            <span aria-hidden="true" className={`${metricStyles.sortIcon} ${sort.column === column ? metricStyles.sortIconActive : ''} ${sort.column === column && sort.order === 'desc' ? metricStyles.sortIconDesc : ''}`}>
              <svg viewBox="0 -960 960 960" focusable="false"><path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" /></svg>
            </span>
          </button>
        </th>)}</tr></thead>
        <tbody>{sortedRows(tableData, sort.column, sort.order).map((row, i) => <tr key={i} className="qf-table__row qf-table__row--large">
          {columns.map(column => {
            const color = (row as unknown as Record<string, unknown>)[`${column}ColorVal`]
            return <td key={column} className={`qf-table__data ${column === 'state' ? '' : 'right-align'}${color ? ` qf-table__data--${color}` : ''}`}
              title={column === 'salesETD' ? currency(row.salesETDUnFormatted) : undefined}>
              {column === 'state' ? titlecase(row.state) : row[column]}
            </td>
          })}
        </tr>)}</tbody>
      </table>
      {!!zeroSalesSohArticles && zeroSalesSohArticles > 0 && <div className={styles.tableInfo}><span>Article Count of SOH &amp; No Sales: {zeroSalesSohArticles}</span></div>}
    </div>
  )
}
