import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Dialog } from '../Dialog/Dialog'
import { useSnackbar } from '../Snackbar/Snackbar'
import { useAuth } from '../../context/AuthContext'
import { getNPSSurveyFlag, submitNPSSurvey, type INpsSurveyFlag } from '../../api/nps'
import styles from './NpsSurvey.module.scss'

const DEFAULT_CAMPAIGN_ID = '999'
const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Angular HelpService state: the flag is fetched once per app load and cleared once the survey closes
let flagPromise: Promise<INpsSurveyFlag | null> | null = null
let surveyDone = false

function loadFlag() {
  if (!flagPromise) flagPromise = getNPSSurveyFlag().catch(() => null)
  return flagPromise
}

/** Angular SqfCardsService.showNPSSurvey + QfNPSSurveyComponent (requestOrigin 'sqf'). */
export function NpsSurvey() {
  const { pathname, search } = useLocation()
  const { user } = useAuth()
  const showSnack = useSnackbar()
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [qaFeedback, setQaFeedback] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    let active = true
    loadFlag().then(flag => {
      if (!active || surveyDone || !flag) return
      if (flag.triggerNPSPopup === 'Yes' && flag.sqf === 1) setCampaignId(flag.campaignId ?? DEFAULT_CAMPAIGN_ID)
    })
    return () => { active = false }
  }, [])

  if (campaignId === null) return null

  function close() {
    surveyDone = true
    setCampaignId(null)
  }

  function send(data: { feedback?: string; qaFeedback?: string }, showSnackMessage: boolean) {
    setHasSubmitted(true)
    submitNPSSurvey({ ...data, requestOrigin: 'sqf', campaignId: campaignId!, url: pathname + search })
      .then(() => {
        close()
        if (showSnackMessage) showSnack('Thank you for the feedback!', 'info', 'center', 'top')
      })
      .catch(close)
  }

  // mat-dialog-close closes immediately; the dismissal is still recorded
  function dismiss() {
    send({}, false)
    close()
  }

  const question =
    user.portal === 'BIGW'
      ? 'On a scale of 0 to 10, how likely are you to recommend Quick Assist and Quick Facts to another team member?'
      : 'On a scale of 0 to 10, how likely are you to recommend the new Quick Suite experience (with Hero Metrics and updated UI) to another team member?'

  return (
    <Dialog open onClose={dismiss} disableClose ariaLabel="Feedback survey">
      <div className={styles.survey}>
        <div className={styles.closeRow}>
          <div className={styles.header}>Your feedback shapes our tools</div>
          <button type="button" className={`material-icons ${styles.closeBtn}`} aria-label="Close" onClick={dismiss}>
            close
          </button>
        </div>
        <hr className={styles.divider} />
        <form
          className={styles.form}
          onSubmit={e => {
            e.preventDefault()
            if (feedback && !hasSubmitted) send({ feedback, qaFeedback }, true)
          }}
        >
          <div className={styles.row}>
            <span className={styles.newline}>
              <span><strong>Question 1 </strong>{question}</span>
            </span>
            <div className={styles.icons}>
              <div className={styles.subDiv}>
                <span className={styles.sub}>0 - Not likely at all</span>
                <span className={styles.sub}>10 - Extremely likely</span>
              </div>
              <div className={styles.iconsDiv}>
                {SCORES.map(n => (
                  <div key={n}>
                    <button
                      type="button"
                      className={`${styles.scoreBtn} ${feedback === String(n) ? styles.scoreSelected : ''}`}
                      aria-pressed={feedback === String(n)}
                      onClick={() => setFeedback(String(n))}
                    >
                      {n}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <hr className={`${styles.divider} ${styles.dividerQa}`} />
          {feedback !== '' && (
            <div className={styles.comment}>
              <span className={styles.newline}>
                <span><strong>Question 2 </strong> <span className={styles.sub}>(Optional)</span></span>
                What's the main reason for your score?
              </span>
              <textarea
                placeholder="Share your thoughts here"
                value={qaFeedback}
                onChange={e => setQaFeedback(e.target.value)}
              />
            </div>
          )}
          <div className={`${styles.bottom} ${styles.row}`}>
            <button
              type="submit"
              className={`${styles.submitBtn} ${feedback ? styles.submitSelected : ''}`}
              disabled={!feedback || hasSubmitted}
            >
              Submit
            </button>
            <button type="button" className={styles.exitBtn} onClick={dismiss}>Dismiss</button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
