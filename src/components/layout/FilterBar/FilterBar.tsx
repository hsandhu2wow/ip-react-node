// src/components/layout/FilterBar/FilterBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useFilter } from '../../../context/FilterContext'
import { useFilterTree } from '../../../hooks/useFilterTree'
import { formatDate, getYesterdayDate } from '../../../utils/formatters'
import type { IQFTree } from '../../../types/sqf.types'
import { LocationTree } from './LocationTree'
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

  const { selectedNode, selectedDate, isLoaded, setSelectedNode, setSelectedDate } = useFilter()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
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

        {/* Date picker — shows formatted label, hidden native input opens on click */}
        <div
          className={`${styles.datePicker} ${!isLoaded ? styles.datePickerDisabled : ''}`}
          onClick={() => isLoaded && dateInputRef.current?.showPicker?.()}
        >
          <span className={`material-icons ${styles.dateIcon}`}>date_range</span>
          <span className={styles.dateLabel}>
            {selectedDate ? formatDisplayDate(selectedDate) : '—'}
          </span>
          <span className={`material-icons ${styles.caret}`}>keyboard_arrow_down</span>
          <input
            ref={dateInputRef}
            type="date"
            className={styles.dateInputHidden}
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={e => {
              if (e.target.value) setSelectedDate(e.target.value)
            }}
            disabled={!isLoaded}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
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
          <span className="material-icons">play_for_work</span>
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
