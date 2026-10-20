import styles from './InfoModal.module.css'

interface Props {
  title: string
  body: string
  onClose: () => void
}

export function InfoModal({ title, body, onClose }: Props) {
  return (
    <div
      className={styles.backdrop}
      data-testid="info-modal-backdrop"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          {title && (
            <div className={styles.titleDiv}>
              <span className={`material-icons ${styles.icon}`} aria-hidden="true">info_outlined</span>
              <span id="info-modal-title">{title}</span>
            </div>
          )}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            data-testid="info-modal-close"
            aria-label="Close"
          >
            <span className={`material-icons ${styles.icon}`}>close</span>
          </button>
        </div>
        <div
          className={styles.body}
          data-testid="info-modal-body"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </div>
  )
}
