// src/components/layout/FilterBar/FilterBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useFilter } from '../../../context/FilterContext'
import { useFilterTree } from '../../../hooks/useFilterTree'
import { formatDate, getYesterdayDate } from '../../../utils/formatters'
import type { IQFTree } from '../../../types/sqf.types'
import styles from './FilterBar.module.css'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function FilterBar() {
  useFilterTree() // loads tree and calls initTree on FilterContext

  const { treeNodes, selectedNode, selectedDate, isLoaded, setSelectedNode, setSelectedDate } =
    useFilter()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
            <span className={styles.locationIcon}>📍</span>
            <span className={styles.locationText}>
              {selectedNode ? selectedNode.name : 'Loading...'}
            </span>
            <span className={styles.caret}>{dropdownOpen ? '▴' : '▾'}</span>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu} role="listbox">
              {treeNodes.map(node => (
                <button
                  key={`${node.code}-${node.depth}`}
                  className={`${styles.dropdownItem} ${
                    node.code === selectedNode?.code ? styles.dropdownItemSelected : ''
                  }`}
                  style={{ paddingLeft: `${8 + node.depth * 12}px` }}
                  role="option"
                  aria-selected={node.code === selectedNode?.code}
                  onClick={() => handleNodeSelect(node)}
                >
                  {node.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date picker */}
        <div className={styles.datePicker}>
          <span className={styles.dateIcon}>📅</span>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={e => {
              if (e.target.value) setSelectedDate(e.target.value)
            }}
            disabled={!isLoaded}
          />
        </div>
      </div>
    </div>
  )
}
