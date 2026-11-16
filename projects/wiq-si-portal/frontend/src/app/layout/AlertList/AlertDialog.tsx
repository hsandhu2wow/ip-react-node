// Port of Angular AlertDialogComponent ("Important Update" pop-up alerts).
import { useEffect } from 'react'
import DOMPurify from 'dompurify'
import type { IAlert } from '../../../shared/api/alerts'
import { Dialog } from '../../../shared/components/Dialog/Dialog'
import styles from './AlertDialog.module.scss'

interface AlertDialogProps {
  alerts: IAlert[]
  /** BIG W theming (icon and primary button use the BU colour) */
  bigW: boolean
  /** Remind me later, close button or Escape */
  onClose: () => void
  /** I understand */
  onConfirm: () => void
}

export function AlertDialog({ alerts, bigW, onClose, onConfirm }: AlertDialogProps) {
  // Opened with disableClose (backdrop clicks ignored) but Escape still closes
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Angular binds this through bypassSecurityTrustHtml; sanitised here like every other admin HTML
  const message = DOMPurify.sanitize(alerts.map(alert => `<div>${alert.text ?? ''}</div>`).join(''))

  return (
    <Dialog
      open
      onClose={onClose}
      disableClose
      ariaLabel="Important Update"
      className={styles.panel}
      backdropClassName={styles.alertBackdrop}
    >
      <div className={`${styles.dialog} ${bigW ? styles.bigw : ''}`}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.icon}>
              <span className="material-icons" aria-hidden="true">campaign</span>
            </div>
            <h2 className={styles.title}>Important Update</h2>
          </div>
          <button type="button" className={styles.close} aria-label="Close dialog" onClick={onClose}>
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        <div className={styles.body}>
          <div dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <div className={styles.divider} />
        <div className={styles.footer}>
          <button type="button" className={`${styles.btn} ${styles.outlined}`} onClick={onClose}>Remind me later</button>
          <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={onConfirm}>I understand</button>
        </div>
      </div>
    </Dialog>
  )
}
