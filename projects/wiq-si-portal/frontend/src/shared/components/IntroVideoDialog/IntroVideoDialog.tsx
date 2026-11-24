import { useState } from 'react'
import { Dialog } from '../Dialog/Dialog'
import styles from './IntroVideoDialog.module.scss'

interface IntroVideoDialogProps {
  open: boolean
  title: string
  videoUrl: string
  onClose: () => void | Promise<void>
}

function getEmbedUrl(videoUrl: string): string {
  const parsedUrl = new URL(videoUrl)
  if (parsedUrl.hostname === 'drive.google.com' && parsedUrl.pathname.endsWith('/view')) {
    parsedUrl.pathname = `${parsedUrl.pathname.slice(0, -4)}preview`
    return parsedUrl.toString()
  }
  return videoUrl
}

export function IntroVideoDialog({ open, title, videoUrl, onClose }: IntroVideoDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaveError, setHasSaveError] = useState(false)

  const close = async () => {
    setIsSaving(true)
    setHasSaveError(false)
    try {
      await onClose()
    } catch {
      setHasSaveError(true)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      size="modal-size-90"
      ariaLabel={title}
      disableClose
      className={styles.dialog}
      backdropClassName={styles.backdrop}
    >
      <header className={styles.header}>
        <h2>{title}</h2>
        <button type="button" aria-label="Close video" onClick={close} disabled={isSaving}>
          ×
        </button>
      </header>
      <div className={styles.videoFrame}>
        <iframe
          title="Introduction video"
          src={getEmbedUrl(videoUrl)}
          allow="autoplay"
          allowFullScreen
        />
      </div>
      <p className={styles.fallback}>
        <a href={videoUrl} target="_blank" rel="noreferrer">Click here</a> if the video above does not work.
      </p>
      {hasSaveError && (
        <p className={styles.error} role="alert">
          Unable to save your video preference. Please try again.
        </p>
      )}
    </Dialog>
  )
}
