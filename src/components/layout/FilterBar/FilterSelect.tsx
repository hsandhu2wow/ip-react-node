import { useState, useRef, useEffect } from 'react'
import styles from './FilterSelect.module.css'

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

/** Compact dropdown used by the FilterBar for Period and Breakdown selection. */
export function FilterSelect<T extends string>({ label, options, value, onChange, ariaLabel, className }: Props<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={className ? `${styles.wrapper} ${className}` : styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(o => !o)}
      >
        <span>{label}</span>
        <span className={`material-icons ${styles.caret}`}>keyboard_arrow_down</span>
      </button>
      {open && (
        <div className={styles.menu} role="listbox">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={`${styles.item} ${opt.value === value ? styles.itemActive : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
