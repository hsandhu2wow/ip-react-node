// src/components/layout/PageBar/PageBar.tsx
import { NavLink, useLocation } from 'react-router-dom'
import styles from './PageBar.module.css'

export function PageBar() {
  const location = useLocation()
  const isDetails = location.pathname.includes('/details/')

  // Details page matches Angular — no tab bar; back link on the page itself handles navigation
  if (isDetails) return null

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <NavLink
          to="/quick-facts/summary"
          className={`${styles.item} ${styles.itemActive}`}
        >
          Quick Facts
        </NavLink>
      </div>
    </div>
  )
}
