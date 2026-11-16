// Port of Angular app-alert-list (components/alert-list) as used by the Quick Facts layout:
// admin alerts for the current page, the Weekly Facts/My Plan response banner and pop-up alerts.
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { getAlerts, getPopUpAlerts, markPopUpAlertsRead, type IAlert } from '../../../shared/api/alerts'
import { usePageLoaded } from '../../../shared/context/PageLoadedContext'
import { useAuth } from '../../../shared/context/AuthContext'
import { HEADER_NAV_ATTR } from '../../../shared/components/StellaPanel/StellaPanel'
import { useTrendActions } from '../../../features/trend/context/TrendActionsContext'
import { AlertDialog } from './AlertDialog'
import styles from './AlertList.module.scss'

type AlertPage = 'sqf' | 'wf' | 'myplan'

const PAGES: Record<string, AlertPage> = { weekly: 'wf', myplan: 'myplan' }

// Fetched once per layout lifetime (Angular AlertListComponent subscribes with take(1))
const ONCE_PER_LAYOUT = { staleTime: Infinity, gcTime: 0, retry: false } as const

interface AlertItem {
  key: string | number
  type: string
  icon?: string
  hyperText?: string
  text?: string
  onClose?: () => void
}

export function AlertList() {
  const { pathname, key: locationKey } = useLocation()
  const page = PAGES[/^\/quick-facts\/(weekly|myplan)\/?$/.exec(pathname)?.[1] ?? ''] ?? 'sqf'
  const pageLoaded = usePageLoaded()
  const { user } = useAuth()
  const { banner, bannerDismissed, dismissBanner } = useTrendActions()
  const alertsQuery = useQuery({ queryKey: ['alerts'], queryFn: getAlerts, enabled: pageLoaded, ...ONCE_PER_LAYOUT })
  const popUpQuery = useQuery({ queryKey: ['alerts', 'pop-up'], queryFn: getPopUpAlerts, enabled: pageLoaded, ...ONCE_PER_LAYOUT })
  const [hidden, setHidden] = useState<ReadonlySet<number>>(() => new Set())
  const [acknowledged, setAcknowledged] = useState<ReadonlySet<number>>(() => new Set())
  // Angular reopens the pop-up on every NavigationEnd (including metric switches) until it is acknowledged
  const [popUpClosedAt, setPopUpClosedAt] = useState<string | null>(null)
  const markRead = useMutation({
    mutationFn: markPopUpAlertsRead,
    onSuccess: (_data, read: IAlert[]) => setAcknowledged(ids => new Set([...ids, ...read.map(alert => alert.id)])),
    onError: error => console.error('Unable to mark pop-up alerts as read', error),
  })

  // broadCastWeeklyFactsBanner replaces the page's admin alerts with the response banner
  const items: AlertItem[] = banner?.text
    ? bannerDismissed ? [] : [{ key: 'wf-banner', type: banner.type, icon: 'error', hyperText: banner.text, onClose: dismissBanner }]
    : (alertsQuery.data ?? [])
      .filter(alert => alert[page] && !hidden.has(alert.id))
      .map(alert => ({
        key: alert.id, type: alert.type, icon: alert.icon, hyperText: alert.hyperText, text: alert.text,
        onClose: alert.removable ? () => setHidden(ids => new Set(ids).add(alert.id)) : undefined,
      }))
  const popUps = (popUpQuery.data ?? []).filter(alert => alert[page] && !acknowledged.has(alert.id))
  const closePopUp = () => setPopUpClosedAt(locationKey)

  return (
    <div {...{ [HEADER_NAV_ATTR]: '' }}>
      {items.map(item => (
        <div key={item.key} role="alert" className={`${styles.alert} ${styles[`alert-${item.type}`] ?? ''}`}>
          {item.icon && <span className={`material-icons ${styles.icon}`} aria-hidden="true">{item.icon}</span>}
          {item.hyperText && (
            <span className={`${styles.text} ${styles.link}`} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.hyperText) }} />
          )}
          {item.text && <span className={styles.text}>{item.text}</span>}
          {item.onClose && (
            <button type="button" className={styles.close} onClick={item.onClose} aria-label="Dismiss notification">
              <span className="material-icons" aria-hidden="true">close</span>
            </button>
          )}
        </div>
      ))}
      {popUps.length > 0 && popUpClosedAt !== locationKey && (
        <AlertDialog
          alerts={popUps}
          bigW={user.portal === 'BIGW'}
          onClose={closePopUp}
          onConfirm={() => {
            closePopUp()
            markRead.mutate(popUps)
          }}
        />
      )}
    </div>
  )
}
