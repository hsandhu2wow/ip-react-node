import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCardStatus } from '../../../hooks/useCardStatus'
import { useCFCChildCodes } from '../../../hooks/useCFCChildCodes'
import { useFilter } from '../../../context/FilterContext'
import { getOrderedCardDropDown, isCFCNode } from '../../../utils/cardDropdown'
import styles from './FilterSelect.module.css'
import { useEscapeToClose } from './useEscapeToClose'

interface Props {
  selectedType: string
  apiDepth: number
  className?: string
}

/** Details-page card switcher — mirrors Angular's `qf-filter__details` menu. */
export function CardTypeDropdown({ selectedType, apiDepth, className }: Props) {
  const { data: cardStatus } = useCardStatus()
  const { selectedNode } = useFilter()
  const cfcQuery = useCFCChildCodes(!!(cardStatus?.seasonal?.hide_cfc || cardStatus?.seasonal?.show_only_cfc))
  const { search } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEscapeToClose(open, () => setOpen(false))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cards = getOrderedCardDropDown(cardStatus, apiDepth, isCFCNode(selectedNode, cfcQuery.data))
  const label = cardStatus?.[selectedType]?.titleText || selectedType

  return (
    <div className={className ? `${styles.wrapper} ${className}` : styles.wrapper} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${styles.detailsTrigger}`}
        aria-label="Card type"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(o => !o)}
      >
        <span className={styles.capitalize}>{label}</span>
        <span className={`material-icons ${styles.caret}`}>keyboard_arrow_down</span>
      </button>
      {open && (
        <div className={`${styles.menu} ${styles.cardMenu}`} role="menu">
          {cards.map(card => (
            <Link
              key={card.name}
              role="menuitem"
              to={{ pathname: `/quick-facts/details/${card.name}`, search }}
              className={`${styles.item} ${styles.capitalize} ${styles.linkItem} ${card.name === selectedType ? styles.cardItemActive : ''}`}
              aria-current={card.name === selectedType ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {card.displayName}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
