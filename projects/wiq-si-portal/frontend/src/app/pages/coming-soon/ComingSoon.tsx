// src/pages/coming-soon/ComingSoon.tsx
import { useLocation } from 'react-router-dom'
import { useNotifyPageLoaded } from '../../../shared/context/PageLoadedContext'
import styles from './ComingSoon.module.scss'

export function ComingSoon() {
  const { pathname } = useLocation()
  useNotifyPageLoaded(true)
  const routeName = (pathname.replace(/^\//, '').split('/')[0] || 'home').replace(/-/g, ' ')

  return (
    <div className={styles.page}>
      <span className={`material-icons-outlined ${styles.icon}`}>rocket_launch</span>
      <h1 className={styles.heading}>Coming Soon</h1>
      <p className={styles.subtext}>This feature is currently in development.</p>
      <span className={styles.badge} data-testid="coming-soon-badge">{routeName}</span>
    </div>
  )
}
