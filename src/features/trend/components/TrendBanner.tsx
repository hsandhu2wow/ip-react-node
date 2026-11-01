import DOMPurify from 'dompurify'
import { useTrendActions } from '../context/TrendActionsContext'
import styles from './TrendBanner.module.scss'

export function TrendBanner() {
  const { banner, dismissBanner } = useTrendActions()
  if (!banner?.text) return null

  return (
    <div role="alert" className={`${styles.banner} ${styles[banner.type] ?? ''}`}>
      <span className={`material-icons ${styles.icon}`} aria-hidden="true">error</span>
      <span className={styles.text} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(banner.text) }} />
      <button type="button" className={styles.close} onClick={dismissBanner} aria-label="Dismiss notification">
        <span className="material-icons" aria-hidden="true">close</span>
      </button>
    </div>
  )
}
