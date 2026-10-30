// src/components/layout/FilterBar/DatePicker.tsx
import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Period } from '../../../shared/types/sqf.types'
import styles from './DatePicker.module.scss'

// NativeDateAdapter (en-AU) short month names, upper-cased like mat-calendar
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC']
const WEEKDAYS = [
  ['M', 'Monday'], ['T', 'Tuesday'], ['W', 'Wednesday'], ['T', 'Thursday'],
  ['F', 'Friday'], ['S', 'Saturday'], ['S', 'Sunday'],
]
export const DATE_PANEL_WIDTH = 296
const YEARS_PER_PAGE = 24
const YEARS_PER_ROW = 4
const MONTHS_PER_ROW = 4

type View = 'month' | 'year' | 'multi-year'

interface Props {
  /** Currently selected date, ISO "yyyy-MM-dd" */
  selectedDate: string
  /** Earliest selectable date, ISO "yyyy-MM-dd" */
  minDate: string
  /** Latest selectable date, ISO "yyyy-MM-dd" */
  maxDate: string
  onSelect: (iso: string) => void
  /** Angular sqf-calendar-header WTD/Day toggle (shown at <=768px) */
  period?: Period
  onPeriodChange?: (period: Period) => void
  style?: CSSProperties
}

const pad = (n: number) => String(n).padStart(2, '0')
const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m: m - 1, d }
}
/** Weekday index with Monday=0..Sunday=6 */
const mondayFirstWeekday = (y: number, m: number) => (new Date(y, m, 1).getDay() + 6) % 7
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))

/**
 * Port of Angular Material's mat-calendar as used by the Store Insights
 * filter (month / year / multi-year views, min/max-aware navigation) plus the
 * sqf-calendar-header period toggle shown on small viewports.
 */
export function DatePicker({ selectedDate, minDate, maxDate, onSelect, period, onPeriodChange, style }: Props) {
  const sel = selectedDate ? parse(selectedDate) : null
  const min = minDate ? parse(minDate) : null
  const max = maxDate ? parse(maxDate) : null
  const initial = sel ?? (() => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() } })()
  const [view, setView] = useState<View>('month')
  const [activeYear, setActiveYear] = useState(initial.y)
  const [activeMonth, setActiveMonth] = useState(initial.m)

  const monthKey = (y: number, m: number) => y * 12 + m
  const minYear = min?.y
  const maxYear = max?.y
  // mat-multi-year-view getActiveOffset: pages are anchored on the max (or min) year
  const startingYear = maxYear != null ? maxYear - YEARS_PER_PAGE + 1 : minYear ?? 0
  const pageStart = activeYear - ((((activeYear - startingYear) % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE)

  const isSameView = (y: number, m: number, bound: { y: number; m: number } | null) => {
    if (!bound) return false
    if (view === 'month') return y === bound.y && m === bound.m
    if (view === 'year') return y === bound.y
    return bound.y >= pageStart && bound.y < pageStart + YEARS_PER_PAGE
  }
  const prevEnabled = !isSameView(activeYear, activeMonth, min)
  const nextEnabled = !isSameView(activeYear, activeMonth, max)

  function setActive(y: number, m: number) {
    // MatCalendar clamps the active date between min and max
    let key = monthKey(y, m)
    if (min) key = Math.max(key, monthKey(min.y, min.m))
    if (max) key = Math.min(key, monthKey(max.y, max.m))
    setActiveYear(Math.floor(key / 12))
    setActiveMonth(key % 12)
  }

  function step(dir: 1 | -1) {
    if (view === 'month') setActive(activeYear, activeMonth + dir)
    else if (view === 'year') setActive(activeYear + dir, activeMonth)
    else setActive(activeYear + dir * YEARS_PER_PAGE, activeMonth)
  }

  const unit = view === 'month' ? 'month' : view === 'year' ? 'year' : '24 years'
  const periodLabel =
    view === 'month'
      ? `${MONTH_NAMES[activeMonth]} ${activeYear}`
      : view === 'year'
        ? String(activeYear)
        : `${pageStart} \u2013 ${pageStart + YEARS_PER_PAGE - 1}`

  const showPeriodToggle = !!onPeriodChange && window.innerWidth <= 768

  function cell(key: string | number, label: string, ariaLabel: string, opts: { disabled: boolean; selected: boolean; wide?: boolean; onClick: () => void }) {
    return (
      <td key={key} className={styles.cellContainer}>
        <button
          type="button"
          className={styles.cell}
          disabled={opts.disabled}
          aria-label={ariaLabel}
          aria-pressed={opts.selected}
          aria-current={opts.selected ? 'date' : undefined}
          onClick={opts.onClick}
        >
          <span className={`${styles.cellContent} ${opts.wide ? styles.cellContentWide : ''} ${opts.selected ? styles.cellSelected : ''}`}>
            {label}
          </span>
        </button>
      </td>
    )
  }

  function renderMonthView() {
    const leading = mondayFirstWeekday(activeYear, activeMonth)
    const total = daysInMonth(activeYear, activeMonth)
    // mat-calendar-body: the label shares the first row only if it fits in >= 3 cells
    const labelInline = leading >= 3
    const cells: ReactNode[] = []
    for (let i = 0; i < (labelInline ? 0 : leading); i++) cells.push(<td key={`blank${i}`} aria-hidden="true" />)
    for (let day = 1; day <= total; day++) {
      const iso = `${activeYear}-${pad(activeMonth + 1)}-${pad(day)}`
      const disabled = (!!minDate && iso < minDate) || (!!maxDate && iso > maxDate)
      cells.push(cell(day, String(day), `${day} ${MONTH_NAMES[activeMonth]} ${activeYear}`, {
        disabled, selected: iso === selectedDate, onClick: () => onSelect(iso),
      }))
    }
    const firstRowLen = labelInline ? 7 - leading : 7
    const rows = [cells.slice(0, firstRowLen), ...chunk(cells.slice(firstRowLen), 7)]
    const label = <td key="label" className={styles.bodyLabel} colSpan={labelInline ? leading : 7}>{MONTH_NAMES[activeMonth]}</td>
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            {WEEKDAYS.map(([short, long], i) => (
              <th key={i} scope="col" className={styles.weekday}><span aria-label={long}>{short}</span></th>
            ))}
          </tr>
          <tr><th className={styles.divider} colSpan={7} aria-hidden="true" /></tr>
        </thead>
        <tbody>
          {!labelInline && <tr>{label}</tr>}
          {rows.map((r, i) => <tr key={i}>{i === 0 && labelInline ? [label, ...r] : r}</tr>)}
        </tbody>
      </table>
    )
  }

  function renderYearView() {
    const cells = MONTH_NAMES.map((name, m) => {
      const key = monthKey(activeYear, m)
      const disabled = (!!min && key < monthKey(min.y, min.m)) || (!!max && key > monthKey(max.y, max.m))
      return cell(name, name, name, {
        disabled, wide: true, selected: !!sel && sel.y === activeYear && sel.m === m,
        onClick: () => { setActive(activeYear, m); setView('month') },
      })
    })
    return (
      <table className={styles.table}>
        <thead><tr><th className={styles.divider} colSpan={MONTHS_PER_ROW} aria-hidden="true" /></tr></thead>
        <tbody>
          <tr><td className={styles.bodyLabel} colSpan={MONTHS_PER_ROW}>{activeYear}</td></tr>
          {chunk(cells, MONTHS_PER_ROW).map((r, i) => <tr key={i}>{r}</tr>)}
        </tbody>
      </table>
    )
  }

  function renderMultiYearView() {
    const cells = Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
      const y = pageStart + i
      const disabled = (minYear != null && y < minYear) || (maxYear != null && y > maxYear)
      return cell(y, String(y), String(y), {
        disabled, wide: true, selected: sel?.y === y,
        onClick: () => { setActive(y, activeMonth); setView('year') },
      })
    })
    return (
      <table className={styles.table}>
        <thead><tr><th className={styles.divider} colSpan={YEARS_PER_ROW} aria-hidden="true" /></tr></thead>
        <tbody>{chunk(cells, YEARS_PER_ROW).map((r, i) => <tr key={i}>{r}</tr>)}</tbody>
      </table>
    )
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Choose date" style={style}>
      {showPeriodToggle && (
        <div className={styles.periodToggle}>
          <button
            type="button"
            className={`${styles.periodBtn} ${period !== 'YDAY' ? styles.periodBtnActive : ''}`}
            onClick={() => onPeriodChange!('WTD')}
          >
            Week to Date
          </button>
          <button
            type="button"
            className={`${styles.periodBtn} ${period === 'YDAY' ? styles.periodBtnActive : ''}`}
            onClick={() => onPeriodChange!('YDAY')}
          >
            Day
          </button>
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.periodButton}
            aria-label={view === 'month' ? 'Choose month and year' : 'Choose date'}
            onClick={() => setView(v => (v === 'month' ? 'multi-year' : 'month'))}
          >
            {periodLabel}
            <svg className={`${styles.arrow} ${view !== 'month' ? styles.arrowInverted : ''}`} viewBox="0 0 10 5" focusable="false" aria-hidden="true">
              <polygon points="0,0 5,5 10,0" />
            </svg>
          </button>
          <div className={styles.spacer} />
          <button type="button" className={styles.navBtn} onClick={() => step(-1)} disabled={!prevEnabled} aria-label={`Previous ${unit}`}>
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
          </button>
          <button type="button" className={styles.navBtn} onClick={() => step(1)} disabled={!nextEnabled} aria-label={`Next ${unit}`}>
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" /></svg>
          </button>
        </div>
      </div>
      <div className={styles.content}>
        {view === 'month' ? renderMonthView() : view === 'year' ? renderYearView() : renderMultiYearView()}
      </div>
    </div>
  )
}
