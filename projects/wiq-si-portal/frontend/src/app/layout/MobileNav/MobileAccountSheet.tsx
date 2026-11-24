import { useEffect, useRef, useState } from 'react'
import type { IUserDetails } from '../../../shared/api/users'
import styles from './MobileAccountSheet.module.scss'

interface Props {
  user: IUserDetails
  onClose: () => void
}

export function MobileAccountSheet({ user, onClose }: Props) {
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const onCloseRef = useRef(onClose)
  const firstActionRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const ownsHistoryEntryRef = useRef(false)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const currentState = window.history.state
    const previousState =
      typeof currentState === 'object' && currentState !== null ? currentState : {}
    window.history.pushState({ ...previousState, __siMobileAccountSheet: true }, '')
    ownsHistoryEntryRef.current = true

    function handlePopState() {
      ownsHistoryEntryRef.current = false
      onCloseRef.current()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('popstate', handlePopState)
      if (ownsHistoryEntryRef.current && window.history.state?.__siMobileAccountSheet) {
        window.history.back()
      }
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (confirmationOpen) {
      confirmRef.current?.focus()
    } else if (firstActionRef.current && !firstActionRef.current.disabled) {
      firstActionRef.current.focus()
    } else {
      closeRef.current?.focus()
    }
  }, [confirmationOpen])

  function closeFlow() {
    onCloseRef.current()
  }

  function switchAccount() {
    if (!user.switch_account_url) return
    localStorage.setItem('switchedAccount', 'yes')
    window.open(user.switch_account_url, '_self')
    closeFlow()
  }

  function signOut() {
    if (!user.logoutUrl) return
    window.open(user.logoutUrl, '_self')
    closeFlow()
  }

  const showPhoto = user.profile_photo && !user.profile_photo.includes('silhouette200.png') && !photoFailed

  return (
    <>
      <button
        type="button"
        className={styles.scrim}
        aria-label={confirmationOpen ? 'Dismiss sign-out confirmation backdrop' : 'Dismiss account menu backdrop'}
        onClick={closeFlow}
      />
      <section
        id="mobile-account-sheet"
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={confirmationOpen ? 'Sign out?' : 'User menu'}
      >
        <div className={styles.sheetTop}>
          <div className={styles.handle} aria-hidden="true" />
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label={confirmationOpen ? 'Close sign-out confirmation' : 'Close account menu'}
            onClick={closeFlow}
          >
            <span className="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        {confirmationOpen ? (
          <div className={styles.confirmation}>
            <h2 className={styles.confirmationTitle}>Sign out?</h2>
            <p className={styles.confirmationDescription}>
              You&apos;ll be signed out of Insights Portal and all your Woolworths accounts.
            </p>
            <div className={styles.confirmationActions}>
              <button type="button" className={styles.cancel} onClick={closeFlow}>Cancel</button>
              <button ref={confirmRef} type="button" className={styles.confirm} onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.profile}>
              <div className={styles.avatar}>
                {showPhoto ? (
                  <img src={user.profile_photo} alt="" onError={() => setPhotoFailed(true)} />
                ) : (
                  <span className="material-icons" aria-hidden="true">account_circle</span>
                )}
              </div>
              <div className={styles.profileInfo}>
                {user.name && <div className={styles.name}>{user.name}</div>}
                {user.success_factors_role && <div className={styles.sub}>{user.success_factors_role}</div>}
                {user.email && <div className={styles.sub}>{user.email}</div>}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                ref={user.switch_account_url ? firstActionRef : undefined}
                type="button"
                className={styles.action}
                disabled={!user.switch_account_url}
                onClick={switchAccount}
              >
                <span className={`material-icons-outlined ${styles.actionIcon}`} aria-hidden="true">
                  supervised_user_circle
                </span>
                Switch Account
              </button>
              <button
                ref={!user.switch_account_url ? firstActionRef : undefined}
                type="button"
                className={styles.action}
                disabled={!user.logoutUrl}
                onClick={() => setConfirmationOpen(true)}
              >
                <span className={`material-icons-outlined ${styles.actionIcon}`} aria-hidden="true">logout</span>
                Sign Out
              </button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
