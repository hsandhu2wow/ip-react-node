// src/pages/coming-soon/ComingSoon.tsx
import { useLocation } from 'react-router-dom'
import styles from './ComingSoon.module.css'

export function ComingSoon() {
  const { pathname } = useLocation()
  const routeName = pathname.replace(/^\//, '').split('/')[0] || 'home'

  return (
    <div className={styles.page}>
      <span className={`material-icons-outlined ${styles.icon}`}>rocket_launch</span>
      <h1 className={styles.heading}>Coming Soon</h1>
      <p className={styles.subtext}>This feature is currently in development.</p>
      <span className={styles.badge} data-testid="coming-soon-badge">{routeName}</span>
    </div>
  )
}
