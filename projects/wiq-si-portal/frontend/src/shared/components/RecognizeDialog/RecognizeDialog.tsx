import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ConfirmDialog } from '../Dialog/Dialog'
import { useSnackbar } from '../Snackbar/Snackbar'
import { useAuth } from '../../context/AuthContext'
import { searchUsers, type IUserSearchResult } from '../../api/users'
import { submitRecognize } from '../../api/recognition'
import { buildRecognizePayload, parseEmployeeEmail, type IRecognizeFormData } from './recognize'
import styles from './RecognizeDialog.module.scss'

const NO_RESULT = 'We did not find any result, please enter valid Woolworths account'
const SEARCH_DEBOUNCE_MS = 400

interface UserAutocompleteProps {
  value: string
  placeholder: string
  invalid: boolean
  loading: boolean
  options: IUserSearchResult[]
  onInput: (value: string) => void
  onSelect: (user: IUserSearchResult) => void
  onBlur: () => void
  testId: string
}

/** mat-form-field (outline) + matInput + mat-autocomplete (autoActiveFirstOption). */
function UserAutocomplete({
  value, placeholder, invalid, loading, options, onInput, onSelect, onBlur, testId,
}: UserAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    setActive(0)
    setOpen(focused && options.length > 0)
    // Opens when a new result set arrives while focused
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options])

  const select = (user: IUserSearchResult) => {
    setOpen(false)
    onSelect(user)
  }

  return (
    <div className={`${styles.field} ${invalid ? styles.fieldInvalid : ''}`}>
      <div className={styles.fieldFlex}>
        <input
          className={styles.input}
          placeholder={placeholder}
          value={value}
          data-testid={testId}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={e => onInput(e.target.value)}
          onFocus={() => {
            setFocused(true)
            if (options.length) setOpen(true)
          }}
          onBlur={() => {
            setFocused(false)
            setOpen(false)
            onBlur()
          }}
          onKeyDown={e => {
            if (!open || !options.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive(i => (i + 1) % options.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive(i => (i - 1 + options.length) % options.length)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              select(options[active])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        {loading && <span className={styles.spinnerGreen} role="progressbar" aria-label="Searching" />}
      </div>
      {open && (
        <ul className={styles.panel} role="listbox">
          {options.map((user, i) => (
            <li
              key={`${user.employee_number}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`${styles.option} ${i === active ? styles.optionActive : ''}`}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => select(user)}
            >
              {user.employee_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface Props {
  recognizeFormData: IRecognizeFormData
  onClose: () => void
}

/** Port of QfRecognizeInlineComponent, rendered inside the preview dialog. */
export function RecognizeDialog({ recognizeFormData, onClose }: Props) {
  const showSnack = useSnackbar()
  const portal = useAuth().user?.portal ?? 'SI'
  const headerText = recognizeFormData.headerText || 'QUICK FACTS THANK YOU CARD'
  const attachmentName = recognizeFormData.attachmentName

  const [receipientText, setReceipientText] = useState('')
  const [lineManagerText, setLineManagerText] = useState('')
  const [message, setMessage] = useState('')
  const [receipientOptions, setReceipientOptions] = useState<IUserSearchResult[]>([])
  const [lineManagerOptions, setLineManagerOptions] = useState<IUserSearchResult[]>([])
  const [loadingReceipients, setLoadingReceipients] = useState(false)
  const [loadingLineManagers, setLoadingLineManagers] = useState(false)
  const [noResultFound, setNoResultFound] = useState('')
  const [invalidEmailAddress, setInvalidEmailAddress] = useState<'Y' | 'N'>('N')
  const [recognitionSubmission, setRecognitionSubmission] = useState(false)
  const [showNoAccessConfirm, setShowNoAccessConfirm] = useState(false)
  // Control-level errors set imperatively (Angular setErrors({ incorrect: true }))
  const [receipientIncorrect, setReceipientIncorrect] = useState(false)
  const [lineManagerIncorrect, setLineManagerIncorrect] = useState(false)
  const [touched, setTouched] = useState({ receipient: false, lineManager: false, message: false })
  const [submitted, setSubmitted] = useState(false)

  // Non-rendered component fields
  const receipientEmail = useRef<string | null>(null)
  const lineManagerEmail = useRef<string | null>(null)
  const receipientEmployeeNumber = useRef('')
  const lineManagerEmployeeNumber = useRef('')
  const qfAccessValidation = useRef<'Y' | 'N'>('Y')

  const receipientTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lineManagerTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const receipientSeq = useRef(0)
  const lineManagerSeq = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(receipientTimer.current)
      clearTimeout(lineManagerTimer.current)
    }
  }, [])

  const receipientSearchFilter = (value: string) => {
    const seq = ++receipientSeq.current
    setNoResultFound('')
    if (value.length > 1) {
      setLoadingReceipients(true)
      setInvalidEmailAddress('N')
      searchUsers(value).then(response => {
        if (!mounted.current || seq !== receipientSeq.current) return
        if (response.length === 0) setNoResultFound(NO_RESULT)
        setLoadingReceipients(false)
        receipientEmail.current = null
        setReceipientOptions(response)
      }, () => {
        if (!mounted.current || seq !== receipientSeq.current) return
        setLoadingReceipients(false)
        setReceipientOptions([])
        setNoResultFound('Unable to search team members, Please try again or Contact Support')
      })
    } else {
      setLoadingReceipients(false)
      setReceipientOptions([])
    }
  }

  const lineManagerFilter = (value: string) => {
    const seq = ++lineManagerSeq.current
    setNoResultFound('')
    if (value === '') lineManagerEmail.current = null
    if (value.length > 1) {
      setLoadingLineManagers(true)
      searchUsers(value).then(response => {
        if (!mounted.current || seq !== lineManagerSeq.current) return
        if (response.length === 0) setNoResultFound(NO_RESULT)
        setLoadingLineManagers(false)
        lineManagerEmail.current = null
        setLineManagerOptions(response)
      }, () => {
        if (!mounted.current || seq !== lineManagerSeq.current) return
        setLoadingLineManagers(false)
        setLineManagerOptions([])
        setNoResultFound('Unable to search team members, Please try again or Contact Support')
      })
    } else {
      setLoadingLineManagers(false)
      setLineManagerOptions([])
    }
  }

  const onReceipientInput = (value: string) => {
    receipientEmail.current = null
    receipientEmployeeNumber.current = ''
    qfAccessValidation.current = 'Y'
    setReceipientText(value)
    setReceipientOptions([])
    setLoadingReceipients(false)
    setInvalidEmailAddress('N')
    setNoResultFound('')
    setReceipientIncorrect(false)
    receipientSeq.current++
    clearTimeout(receipientTimer.current)
    receipientTimer.current = setTimeout(() => receipientSearchFilter(value), SEARCH_DEBOUNCE_MS)
  }

  const onLineManagerInput = (value: string) => {
    lineManagerEmail.current = null
    lineManagerEmployeeNumber.current = ''
    setLineManagerText(value)
    setLineManagerOptions([])
    setLoadingLineManagers(false)
    setNoResultFound('')
    setLineManagerIncorrect(false)
    lineManagerSeq.current++
    clearTimeout(lineManagerTimer.current)
    lineManagerTimer.current = setTimeout(() => lineManagerFilter(value), SEARCH_DEBOUNCE_MS)
  }

  const selectedReceipient = (user: IUserSearchResult) => {
    // Selecting writes the object to the control; Angular's filter then yields no options
    clearTimeout(receipientTimer.current)
    receipientSeq.current++
    setReceipientText(user.employee_name)
    setReceipientOptions([])
    setReceipientIncorrect(false)
    const email = parseEmployeeEmail(user.employee_name)
    receipientEmail.current = email
    receipientEmployeeNumber.current = user.employee_number
    setLoadingReceipients(false)
    if (email.search('stores.woolworths.com') > 0) {
      setInvalidEmailAddress('Y')
      setReceipientIncorrect(true)
    }
  }

  const selectedLineManager = (user: IUserSearchResult) => {
    clearTimeout(lineManagerTimer.current)
    lineManagerSeq.current++
    setLineManagerText(user.employee_name)
    setLineManagerOptions([])
    setLineManagerIncorrect(false)
    lineManagerEmail.current = parseEmployeeEmail(user.employee_name)
    lineManagerEmployeeNumber.current = user.employee_number
    setLoadingLineManagers(false)
  }

  const submitRecognition = (e?: FormEvent) => {
    e?.preventDefault()
    setSubmitted(true)
    let receipientInvalid = receipientIncorrect || !receipientText
    let lineManagerInvalid = lineManagerIncorrect
    let error = noResultFound
    if (!receipientEmail.current) {
      receipientInvalid = true
      setReceipientIncorrect(true)
    }
    if (!lineManagerEmail.current && lineManagerText) {
      lineManagerInvalid = true
      setLineManagerIncorrect(true)
      error = 'Please ensure valid email address is selected from the search results'
      setNoResultFound(error)
    }
    const valid = !receipientInvalid && !lineManagerInvalid && !!message
    if (valid) {
      setRecognitionSubmission(true)
      const requestData = buildRecognizePayload(recognizeFormData, {
        receipientEmail: receipientEmail.current as string,
        lineManagerEmail: lineManagerEmail.current,
        receipientEmployeeNumber: receipientEmployeeNumber.current,
        lineManagerEmployeeNumber: lineManagerEmployeeNumber.current,
        qfAccessValidation: qfAccessValidation.current,
        body: message,
      })
      submitRecognize(requestData).then(
        () => {
          setRecognitionSubmission(false)
          showSnack('The Recognition has been sent successfully')
          onClose()
        },
        (response: { response?: { data?: { status?: string } } }) => {
          if (!mounted.current) return
          setRecognitionSubmission(false)
          if (response?.response?.data?.status === 'NoQfAccess') {
            setShowNoAccessConfirm(true)
          } else {
            showSnack('Unable to submit recognition now, Please Contact Support', 'error')
          }
        },
      )
    } else if (!error) {
      setNoResultFound('Please ensure all required fields *  are filled in with valid values.')
    }
  }

  const showErrors = (touchedField: boolean) => touchedField || submitted
  const receipientInvalidNow = receipientIncorrect || !receipientText
  const messageInvalidNow = !message

  return (
    <div className={`${styles.qfRecognize} ${portal === 'BIGW' ? styles.portalBIGW : ''}`} data-testid="recognize-form">
      <div className={styles.close}>
        <span
          className={`material-icons ${styles.closeIcon}`}
          role="button"
          aria-label="Close"
          tabIndex={0}
          onClick={onClose}
          onKeyDown={e => e.key === 'Enter' && onClose()}
        >
          close
        </span>
      </div>
      <div>
        <h2 className={styles.formTitle}>{headerText}</h2>
      </div>
      <div>
        <img className={styles.imgResize} src="/assets/images/thank_you_image.jpg" title="Logo" alt="Thank you" />
      </div>
      <form onSubmit={submitRecognition} noValidate>
        <div className={styles.text}>
          <label className={styles.label}>Send recognition to</label>
          <UserAutocomplete
            testId="recognize-recipient"
            value={receipientText}
            placeholder="Enter team member's email address"
            invalid={receipientInvalidNow && showErrors(touched.receipient)}
            loading={loadingReceipients}
            options={receipientOptions}
            onInput={onReceipientInput}
            onSelect={selectedReceipient}
            onBlur={() => setTouched(t => ({ ...t, receipient: true }))}
          />
        </div>
        <div
          className={invalidEmailAddress === 'Y' ? styles.invalidEmail : styles.validEmail}
          data-testid="recognize-store-warning"
        >
          {portal === 'BIGW'
            ? '* You can also recognise store teams by sending to the store account'
            : `* Please do not send to ${portal === 'PEL' ? '@stores.woolworths.co.nz' : '@stores.woolworths.com.au'} accounts as there is no inbox to send to. Alternatively recognise stores teams by sending to the store account.`}
        </div>
        <div className={styles.text}>
          <label className={styles.label}>Notify their line manager (optional)</label>
          <UserAutocomplete
            testId="recognize-line-manager"
            value={lineManagerText}
            placeholder="Enter manager's email to share recognition"
            invalid={lineManagerIncorrect && showErrors(touched.lineManager)}
            loading={loadingLineManagers}
            options={lineManagerOptions}
            onInput={onLineManagerInput}
            onSelect={selectedLineManager}
            onBlur={() => setTouched(t => ({ ...t, lineManager: true }))}
          />
        </div>
        <div className={styles.text}>
          <label className={styles.label}>Recognition message</label>
          <div className={`${styles.field} ${messageInvalidNow && showErrors(touched.message) ? styles.fieldInvalid : ''}`}>
            <textarea
              className={styles.textarea}
              placeholder="Share their contribution and impact..."
              rows={7}
              maxLength={4000}
              value={message}
              data-testid="recognize-message"
              onChange={e => setMessage(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, message: true }))}
            />
          </div>
        </div>
        {portal === 'BIGW' && (
          <div className={styles.bigwNominationText}>
            Want to nominate the store team for the monthly True Blue Legends award for their great results?{' '}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc2Lenv8gJhMwPfF0eG9P-2v5Xv2FmxXN5t6H4wAnT9oMOiug/viewform"
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here!
            </a>
          </div>
        )}
        <div className={styles.attachment}>
          <span className={`material-icons ${styles.iconEffect}`}>attachment</span>
          <span className={styles.attachmentLabel} data-testid="recognize-attachment"> {attachmentName} </span>
        </div>
        {noResultFound && <div className={styles.error} role="alert">{noResultFound}</div>}
        <div className={styles.submitRow}>
          <button className={styles.greenBtn} type="submit" data-testid="recognize-submit">
            Submit
            {recognitionSubmission && <span className={styles.spinnerStyle} role="progressbar" aria-label="Submitting" />}
          </button>
        </div>
      </form>
      <ConfirmDialog
        open={showNoAccessConfirm}
        message="This User does not have access to Quick Facts,"
        subMessage="Do you still want to proceed?"
        confirmText="Yes"
        cancelText="No"
        onCancel={() => setShowNoAccessConfirm(false)}
        onConfirm={() => {
          setShowNoAccessConfirm(false)
          qfAccessValidation.current = 'N'
          submitRecognition()
        }}
      />
    </div>
  )
}
