import styles from './Spinner.module.scss'

/**
 * Indeterminate mat-spinner in the theme colour (Angular styles/app.scss .spinnerStyle).
 * The stroke is a tenth of the diameter, as mat-spinner's default strokeWidth.
 */
export function Spinner({ diameter, label, className = '' }: { diameter: number; label: string; className?: string }) {
  return (
    <svg
      className={`${styles.spinner} ${className}`}
      style={{ width: diameter, height: diameter }}
      viewBox="0 0 100 100"
      role="progressbar"
      aria-label={label}
    >
      <circle className={styles.circle} cx="50" cy="50" r="45" />
    </svg>
  )
}
