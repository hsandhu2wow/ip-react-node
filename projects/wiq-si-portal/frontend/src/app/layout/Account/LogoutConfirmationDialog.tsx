import { useEffect, useRef } from 'react'
import styles from './LogoutConfirmationDialog.module.scss'

interface Props {
  logoutUrl: string
  onClose: () => void
}

export function LogoutConfirmationDialog({ logoutUrl, onClose }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  function signOut() {
    window.open(logoutUrl, '_self')
    onClose()
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <h2 className={styles.title} id="logout-dialog-title">
          <span className={`material-icons-outlined ${styles.warningIcon}`} aria-hidden="true">logout</span>
          Sign out of Insights Portal
        </h2>
        <p className={styles.description} id="logout-dialog-description">
          You&apos;ll be signed out of Insights Portal and all your Woolworths accounts.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
          <button ref={confirmRef} type="button" className={styles.confirm} onClick={signOut}>Sign out</button>
        </div>
      </section>
    </div>
  )
}
