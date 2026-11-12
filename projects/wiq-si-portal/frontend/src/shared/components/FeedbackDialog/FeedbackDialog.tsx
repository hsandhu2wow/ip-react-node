import { useEffect, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Dialog } from '../Dialog/Dialog'
import { useSnackbar } from '../Snackbar/Snackbar'
import { getFeedbackIssueTypes, submitFeedback } from '../../api/feedback'
import styles from './FeedbackDialog.module.scss'

export interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
  /** MatDialog data.header — SqfFilterComponent passes the selected card type title. */
  header?: string
  dashboardId?: string
  applicationNames?: string
}

/**
 * Port of Angular HelpFeedbackComponent.pageNameMapping: derives the page label shown in
 * the form and the `pageSection` used for GET /feedbackIssuesType/{pageSection}.
 */
export function getFeedbackPage(pathname: string, header?: string): { currentPage: string; pageSection: string } {
  const currentRoute = pathname.split('?')[0]
  const route = currentRoute.includes('/') ? currentRoute.split('/')[1] : currentRoute
  switch (route) {
    case 'quick-facts':
    case 'my-metrics': {
      const pageSection = route === 'my-metrics' ? 'mymetrics' : 'quickfacts'
      if (currentRoute.includes('quick-assist')) return { currentPage: 'Quick Assist', pageSection: 'quickassist' }
      if (currentRoute.includes('details')) return { currentPage: `Quick Facts - ${header ?? ''}`, pageSection }
      if (currentRoute.includes('weekly')) {
        if (header === 'WFAIPanel') return { currentPage: 'Weekly Facts AI Insights', pageSection: 'weeklyfacts' }
        // Angular's `wfService.selectedMetric === 'myPlan'` → 'My Plan' branch is unreachable on
        // /weekly (the metric is derived from the URL), and /myplan doesn't contain 'weekly',
        // so My Plan falls through to 'Quick Facts Summary' exactly like Angular.
        return { currentPage: 'Weekly Facts', pageSection: 'weeklyfacts' }
      }
      return { currentPage: 'Quick Facts Summary', pageSection }
    }
    case 'dashboards':
      return {
        currentPage: header?.includes('Dashboard') ? header : `${header ?? ''} Dashboard`,
        pageSection: 'dashboards',
      }
    case 'bqf':
      return { currentPage: 'Buying Quick Facts', pageSection: 'bqf' }
    case 'price-simulator':
      return { currentPage: 'Pricing Simulator', pageSection: 'psim' }
    default:
      return { currentPage: route, pageSection: 'quickfacts' }
  }
}

/** Angular HelpFeedbackComponent (isPopup: true) opened via MatDialog, panelClass help-feedback-popup. */
export function FeedbackDialog({ open, onClose, header, dashboardId, applicationNames }: FeedbackDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} size="help-feedback" ariaLabel="Help us improve!">
      <FeedbackForm onClose={onClose} header={header} dashboardId={dashboardId} applicationNames={applicationNames} />
    </Dialog>
  )
}

/** Mounted only while the dialog is open, so every open starts with a fresh form (like MatDialog). */
function FeedbackForm({ onClose, header, dashboardId, applicationNames }: Omit<FeedbackDialogProps, 'open'>) {
  const location = useLocation()
  const showSnack = useSnackbar()
  const { currentPage, pageSection } = getFeedbackPage(location.pathname, header)

  const issuesQuery = useQuery({
    queryKey: ['feedbackIssuesType', pageSection],
    queryFn: () => getFeedbackIssueTypes(pageSection),
  })
  const issueOptions = issuesQuery.data ?? []

  const [issueType, setIssueType] = useState<string | undefined>(undefined)
  const [reason, setReason] = useState('')
  const [contactMe, setContactMe] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Angular preselects the first option once the issue types arrive.
  const selectedIssue = issueType ?? issueOptions[0]
  const isLoading = issuesQuery.isLoading || submitting

  const resetForm = () => {
    setReason('')
    setContactMe(false)
  }

  const addImages = (files: FileList | File[] | null) => {
    if (!files) return
    const list = Array.from(files)
    if (list.length) setImages(prev => [...prev, ...list])
  }

  const onDragOver = (e: DragEvent<HTMLSpanElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDrop = (e: DragEvent<HTMLSpanElement>) => {
    e.preventDefault()
    setDragOver(false)
    addImages(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')))
  }

  const onNoClick = () => {
    resetForm()
    onClose()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitFeedback({
        images,
        reason,
        contactMe,
        requestOrigin: 'Support ' + currentPage,
        issueTypeSelected: selectedIssue as string,
        dashboardId,
        application_names: applicationNames,
        url: location.pathname + location.search,
      })
      setSubmitting(false)
      resetForm()
      setImages([])
      onClose()
      showSnack('Thank you for the feedback!', 'info', 'center', 'top')
    } catch {
      setSubmitting(false)
      onClose()
      showSnack('Unable to submit feedback, Please try again or Contact Support', 'error')
    }
  }

  return (
    <div className={styles.popup}>
      <div className={styles.closeButton}>
        <p className={styles.header}><b>Help us improve!</b></p>
        <button type="button" className={styles.closeIconBtn} aria-label="Close" onClick={onNoClick}>
          <span className="material-icons">close</span>
        </button>
      </div>
      <div>
        <div className={styles.divider} role="separator" />
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.embed}>
            <label className={styles.label} id="feedback-issue-type-label">
              I am sending a feedback for {currentPage}
            </label>
            <div className={styles.formField}>
              {issueOptions.length === 0 && <span className={styles.spinner} data-testid="issue-types-spinner" />}
              <IssueSelect
                options={issueOptions}
                value={selectedIssue}
                onChange={setIssueType}
                labelledBy="feedback-issue-type-label"
              />
            </div>
          </div>
          <div className={styles.embed}>
            <p className={styles.reasonText}>Tell us more about your experience</p>
            <textarea
              className={styles.textArea}
              placeholder="Let us know your feedback"
              aria-label="Tell us more about your experience"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className={styles.embed}>
            <input
              ref={fileInput}
              hidden
              type="file"
              accept="image/*"
              data-testid="feedback-file-input"
              onClick={e => { e.currentTarget.value = '' }}
              onChange={e => addImages(e.target.files)}
            />
          </div>
          <div className={styles.chipList} role="list" aria-label="Attachments">
            {images.map((image, i) => (
              <span key={`${image.name}-${i}`} className={styles.chip} role="listitem">
                <span className={styles.chipLabel}>{image.name}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remove ${image.name}`}
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <span className="material-icons">cancel</span>
                </button>
              </span>
            ))}
          </div>
          <div className={styles.bottom}>
            <span
              className={`${styles.attachments} ${dragOver ? styles.attachmentsDragOver : ''}`}
              data-testid="feedback-dropzone"
              onDragOver={onDragOver}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <span className={styles.attachmentsLinkWrapper}>
                <span className={`material-icons ${styles.attachIcon}`}>attach_file</span>
                <span>
                  <a className={styles.link} onClick={() => fileInput.current?.click()}>Click to upload</a> or drag and
                  drop a screenshot
                </span>
              </span>
            </span>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={contactMe}
                onChange={e => setContactMe(e.target.checked)}
              />
              <span className={styles.checkboxBox} aria-hidden="true">
                <svg viewBox="0 0 24 24" className={styles.checkmark}>
                  <path fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" />
                </svg>
              </span>
              <span className={styles.checkboxLabel}>Would you like us to contact you about your feedback?</span>
            </label>
            <button type="submit" className={styles.submit} disabled={isLoading}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface IssueSelectProps {
  options: string[]
  value: string | undefined
  onChange: (value: string) => void
  labelledBy: string
}

/** mat-select (outline appearance) equivalent. */
function IssueSelect({ options, value, onChange, labelledBy }: IssueSelectProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  const openPanel = () => {
    if (!options.length) return
    setActive(Math.max(0, options.indexOf(value ?? '')))
    setOpen(true)
  }

  const select = (option: string) => {
    onChange(option)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!options.length) return
    const current = open ? active : Math.max(0, options.indexOf(value ?? ''))
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(options.length - 1, Math.max(0, current + (e.key === 'ArrowDown' ? 1 : -1)))
      if (open) setActive(next)
      else onChange(options[next])
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open) select(options[active])
      else openPanel()
    } else if (e.key === 'Escape' && open) {
      // Close only the panel, not the dialog (Dialog listens for Escape on window).
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'Tab' && open) {
      setOpen(false)
    }
  }

  return (
    <div className={styles.select} ref={rootRef}>
      <div
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelledBy}
        aria-controls="feedback-issue-type-panel"
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerOpen : ''}`}
        onClick={() => (open ? setOpen(false) : openPanel())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.selectValue}>{value}</span>
        <span className={styles.selectArrowWrapper}>
          <span className={styles.selectArrow} />
        </span>
      </div>
      {open && (
        <div id="feedback-issue-type-panel" role="listbox" className={styles.selectPanel}>
          {options.map((option, i) => (
            <div
              key={option}
              role="option"
              aria-selected={option === value}
              className={[
                styles.option,
                option === value ? styles.optionSelected : '',
                i === active ? styles.optionActive : '',
              ].join(' ')}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
