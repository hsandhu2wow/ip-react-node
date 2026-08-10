// src/components/layout/FilterBar/DatePicker.tsx
import { useState } from 'react'
import styles from './DatePicker.module.css'

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface Props {
  /** Currently selected date, ISO "yyyy-MM-dd" */
  selectedDate: string
  /** Earliest selectable date, ISO "yyyy-MM-dd" */
  minDate: string
  /** Latest selectable date, ISO "yyyy-MM-dd" */
  maxDate: string
  onSelect: (iso: string) => void
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Weekday index with Monday=0..Sunday=6 (JS Date.getDay() is Sunday=0) */
function mondayFirstWeekday(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Custom month-grid date picker matching Store Insights' Angular Material
 * datepicker: month header with prev/next nav, Mon-first weekday row, and a
 * green filled circle for the selected date. Dates outside [minDate, maxDate]
 * are shown greyed-out and are unselectable.
 */
export function DatePicker({ selectedDate, minDate, maxDate, onSelect }: Props) {
  const initial = selectedDate ? new Date(selectedDate) : new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const leading = mondayFirstWeekday(viewYear, viewMonth)
  const totalDays = daysInMonth(viewYear, viewMonth)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  return (
    <div className={styles.panel} role="dialog" aria-label="Choose date">
      <div className={styles.header}>
        <span className={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
          <span className="material-icons" aria-hidden="true">arrow_drop_down</span>
        </span>
        <div className={styles.navBtns}>
          <button type="button" className={styles.navBtn} onClick={goToPrevMonth} aria-label="Previous month">
            <span className="material-icons">chevron_left</span>
          </button>
          <button type="button" className={styles.navBtn} onClick={goToNextMonth} aria-label="Next month">
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      </div>

      <div className={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {leading > 0 && (
          <span className={styles.monthLeadLabel} style={{ gridColumn: `span ${leading}` }}>
            {MONTH_NAMES[viewMonth]}
          </span>
        )}
        {days.map(day => {
          const iso = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`
          const disabled = (!!minDate && iso < minDate) || (!!maxDate && iso > maxDate)
          const selected = iso === selectedDate

          return (
            <button
              key={day}
              type="button"
              className={`${styles.dayCell} ${disabled ? styles.dayCellDisabled : ''} ${selected ? styles.dayCellSelected : ''}`}
              disabled={disabled}
              aria-current={selected ? 'date' : undefined}
              onClick={() => onSelect(iso)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
