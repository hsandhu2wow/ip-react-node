// src/components/layout/FilterBar/FilterBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { useFilter } from '../../../context/FilterContext'
import { useAuth } from '../../../context/AuthContext'
import { useFilterTree } from '../../../hooks/useFilterTree'
import { useSummaryCards } from '../../../hooks/useSummaryCards'
import { useDetailsCard } from '../../../hooks/useDetailsCard'
import { usePeriodCards } from '../../../hooks/usePeriodCards'
import { childLevelLabel, hidesBreakdownAxis } from '../../../utils/levelLabels'
import { FilterSelect } from './FilterSelect'
import type { BreakdownAxis, Period } from '../../../types/sqf.types'
import { formatDate, getYesterdayDate } from '../../../utils/formatters'
import type { IQFTree } from '../../../types/sqf.types'
import { LocationTree } from './LocationTree'
import { DatePicker } from './DatePicker'
import styles from './FilterBar.module.css'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** Format ISO date "yyyy-MM-dd" → "dd MMM" e.g. "30 Jun" */
function formatDisplayDate(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

export function FilterBar() {
  useFilterTree() // loads tree and calls initTree on FilterContext

  const {
    selectedNode, selectedDate, isLoaded, setSelectedNode, setSelectedDate,
    setSelectedPeriod, selectedBreakdownAxis, setSelectedBreakdownAxis,
  } = useFilter()
  const { user } = useAuth()

  const { pathname } = useLocation()
  const detailsType = matchPath('/quick-facts/details/:type', pathname)?.params.type
  const isSummaryPage = pathname.startsWith('/quick-facts/summary')
  const summaryQuery = useSummaryCards(isSummaryPage || !!detailsType)
  const detailsQuery = useDetailsCard(detailsType)
  const { hasMultiplePeriods, activePeriod } = usePeriodCards(
    detailsType ? detailsQuery.data : summaryQuery.data
  )
  const showFilters = isSummaryPage || !!detailsType
  const showPeriod = showFilters && hasMultiplePeriods
  const showAxis = showFilters && !hidesBreakdownAxis(selectedNode)
  const axisLabel =
    selectedBreakdownAxis === 'childLevel' ? childLevelLabel(selectedNode, user.portal) : 'Departments'

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const yesterday = getYesterdayDate()
  const minDate = formatDate(new Date(Date.now() - THIRTY_DAYS_MS))
  const maxDate = formatDate(yesterday)

  function handleNodeSelect(node: IQFTree) {
    setSelectedNode(node)
    setDropdownOpen(false)
  }

  return (
    <div className={styles.filterBar}>
      {/* Location selector */}
      <div className={styles.left}>
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={styles.dropdownTrigger}
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span className={`material-icons ${styles.locationIcon}`}>location_on</span>
            <span className={styles.locationText}>
              {selectedNode ? selectedNode.name : 'Loading...'}
            </span>
            <span className={`material-icons ${styles.caret}`}>keyboard_arrow_down</span>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu} role="listbox">
              <LocationTree onSelect={handleNodeSelect} />
            </div>
          )}
        </div>

        {/* Date picker — custom month-grid dropdown matching Store Insights */}
        <div className={styles.dropdown} ref={datePickerRef}>
          <button
            type="button"
            className={`${styles.datePicker} ${!isLoaded ? styles.datePickerDisabled : ''}`}
            onClick={() => isLoaded && setDatePickerOpen(o => !o)}
            aria-expanded={datePickerOpen}
            aria-haspopup="dialog"
            disabled={!isLoaded}
          >
            <span className={`material-icons ${styles.dateIcon}`}>today</span>
            <span className={styles.dateLabel}>
              {selectedDate ? formatDisplayDate(selectedDate) : '—'}
            </span>
            <span className={`material-icons ${styles.caret}`}>keyboard_arrow_down</span>
          </button>

          {datePickerOpen && (
            <DatePicker
              selectedDate={selectedDate}
              minDate={minDate}
              maxDate={maxDate}
              onSelect={iso => {
                setSelectedDate(iso)
                setDatePickerOpen(false)
              }}
            />
          )}
        </div>

        {showPeriod && (
          <FilterSelect<Period>
            ariaLabel="Reporting period"
            label={activePeriod === 'YDAY' ? 'Day' : 'Week to Date'}
            value={activePeriod}
            options={[
              { value: 'WTD', label: 'Week to Date' },
              { value: 'YDAY', label: 'Day' },
            ]}
            onChange={setSelectedPeriod}
          />
        )}

        {showAxis && (
          <FilterSelect<BreakdownAxis>
            ariaLabel="Breakdown"
            label={axisLabel}
            value={selectedBreakdownAxis}
            options={[
              { value: 'childLevel', label: childLevelLabel(selectedNode, user.portal) },
              { value: 'department', label: 'Departments' },
            ]}
            onChange={setSelectedBreakdownAxis}
          />
        )}
      </div>

      {/* Feedback/export actions — feedback & download aren't wired to a backend yet,
          shown as inert affordances matching Store Insights' layout; print is functional. */}
      <div className={styles.right}>
        <button
          type="button"
          className={styles.iconBtn}
          title="Send feedback"
          aria-label="Send feedback"
          disabled
        >
          <span className="material-icons">forum</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          title="Download"
          aria-label="Download"
          disabled
        >
          <span className="material-icons">get_app</span>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          title="Print"
          aria-label="Print"
          onClick={() => window.print()}
        >
          <span className="material-icons">print</span>
        </button>
      </div>
    </div>
  )
}
