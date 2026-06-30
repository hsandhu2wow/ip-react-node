// src/components/layout/FilterBar/FilterBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useFilter } from '../../../context/FilterContext'
import { useFilterTree } from '../../../hooks/useFilterTree'
import { formatDate, getYesterdayDate } from '../../../utils/formatters'
import type { IQFTree } from '../../../types/sqf.types'
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

  const { treeNodes, selectedNode, selectedDate, isLoaded, setSelectedNode, setSelectedDate } =
    useFilter()

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
              {treeNodes.map(node => {
                const isSelected = node.code === selectedNode?.code
                const isNonClickable = node.nonClickable
                return (
                  <button
                    key={`${node.code}-${node.depth}`}
                    className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ''} ${isNonClickable ? styles.dropdownItemDisabled : ''}`}
                    style={{ paddingLeft: `${node.depth * 8}px` }}
                    role="option"
                    aria-selected={isSelected}
                    disabled={isNonClickable}
                    onClick={() => !isNonClickable && handleNodeSelect(node)}
                  >
                    {node.name}
                  </button>
                )
              })}
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
    </div>
  )
}
