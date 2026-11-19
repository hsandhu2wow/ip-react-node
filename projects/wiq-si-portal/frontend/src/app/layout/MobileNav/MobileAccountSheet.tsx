import { useEffect, useRef, useState } from 'react'
import type { IUserDetails } from '../../../shared/api/users'
import { LogoutConfirmationDialog } from '../Account/LogoutConfirmationDialog'
import styles from './MobileAccountSheet.module.scss'

interface Props {
  user: IUserDetails
  onClose: () => void
}

export function MobileAccountSheet({ user, onClose }: Props) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)
  const onCloseRef = useRef(onClose)
  const firstActionRef = useRef<HTMLButtonElement>(null)
  const signOutRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstActionRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (logoutDialogOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [logoutDialogOpen])

  function switchAccount() {
    if (!user.switch_account_url) return
    localStorage.setItem('switchedAccount', 'yes')
    window.open(user.switch_account_url, '_self')
    onClose()
  }

  const showPhoto = user.profile_photo && !user.profile_photo.includes('silhouette200.png') && !photoFailed

  return (
    <>
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close account menu"
        onClick={onClose}
      />
      <section id="mobile-account-sheet" className={styles.sheet} role="dialog" aria-modal="true" aria-label="User menu">
        <div className={styles.handle} aria-hidden="true" />
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
          {user.switch_account_url && (
            <button ref={firstActionRef} type="button" className={styles.action} onClick={switchAccount}>
              <span className={`material-icons-outlined ${styles.actionIcon}`} aria-hidden="true">
                supervised_user_circle
              </span>
              Switch Account
            </button>
          )}
          {user.logoutUrl && (
            <button
              ref={!user.switch_account_url ? firstActionRef : signOutRef}
              type="button"
              className={styles.action}
              onClick={() => setLogoutDialogOpen(true)}
            >
              <span className={`material-icons-outlined ${styles.actionIcon}`} aria-hidden="true">logout</span>
              Sign out
            </button>
          )}
        </div>
      </section>

      {logoutDialogOpen && user.logoutUrl && (
        <LogoutConfirmationDialog
          logoutUrl={user.logoutUrl}
          onClose={() => {
            setLogoutDialogOpen(false)
            signOutRef.current?.focus()
          }}
        />
      )}
    </>
  )
}
