// src/components/layout/PageBar/PageBar.tsx
import { NavLink, useLocation } from 'react-router-dom'
import styles from './PageBar.module.css'

export function PageBar() {
  const location = useLocation()
  const isDetails = location.pathname.includes('/details/')

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <NavLink
          to="/quick-facts/summary"
          className={`${styles.item} ${!isDetails ? styles.itemActive : ''}`}
        >
          Quick Facts
        </NavLink>
        {isDetails && (
          <span className={`${styles.item} ${styles.itemActive}`}>
            Details
          </span>
        )}
      </div>
    </div>
  )
}
