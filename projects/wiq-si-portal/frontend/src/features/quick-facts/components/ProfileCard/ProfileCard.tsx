import { useEffect, useRef, useState } from 'react'
import { getStoreProfileRoleNames, type IQFProfileRole, type IQFStoreProfile } from '../../api/storeProfile'
import { useCardsPreview, type DocExportType } from '../../../../shared/components/PreviewDialog/cardsPreviewContext'
import type { PreviewCard } from '../../../../shared/components/RecognizeDialog/recognize'
import { useAuth } from '../../../../shared/context/AuthContext'
import { formatUpdatedTime } from '../../../../shared/utils/formatters'
import styles from './ProfileCard.module.scss'

interface Props {
  card: IQFStoreProfile | null
  storeCode: string
  supportEmail?: string
}

const NON_BIGW_FIELDS: Array<[string, string, string?]> = [
  ['storeCluster', 'Store Cluster'],
  ['centerType', 'Centre Type'],
  ['renewalAge', 'Last Renewal', ' years ago'],
  ['colesProximity', 'Proximity to Coles'],
  ['aldiProximity', 'Proximity to Aldi'],
  ['nwProximity', 'Proximity to NW'],
  ['pnsProximity', 'Proximity to PnS'],
]
const BIGW_FIELDS: Array<[string, string, string?]> = [
  ['onlineHub', 'Online Hub'],
  ['centerType', 'Centre Type'],
  ['storeSizeFleet', 'Store Size Fleet'],
  ['targetProximity', 'Proximity to Target'],
  ['kmartProximity', 'Proximity to KMart'],
]

/** Port of Angular sqf-profile-card (METRO/PEL store-level summary card). */
export function ProfileCard({ card, storeCode, supportEmail }: Props) {
  const { user } = useAuth()
  const { preview } = useCardsPreview()
  const [expanded, setExpanded] = useState(false)
  const [roles, setRoles] = useState<IQFProfileRole[]>(card?.roles ?? [])
  const [roleNamesFetched, setRoleNamesFetched] = useState(false)
  const [menu, setMenu] = useState<'closed' | 'main' | 'download'>('closed')
  const menuRef = useRef<HTMLDivElement>(null)

  // Angular @Input() set card: reset expansion/roles whenever the card changes
  useEffect(() => {
    setExpanded(false)
    setRoleNamesFetched(false)
    setRoles(card?.roles ?? [])
  }, [card])

  useEffect(() => {
    if (menu === 'closed') return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu('closed')
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menu])

  function doPreview(type: DocExportType) {
    setMenu('closed')
    void preview(type, [card as unknown as PreviewCard])
  }

  function toggleExpanded() {
    setExpanded(e => !e)
    if (!roleNamesFetched) {
      getStoreProfileRoleNames(storeCode).then(list => {
        setRoles(list)
        setRoleNamesFetched(true)
      }).catch(() => {})
    }
  }

  if (!card) {
    return (
      <div className={`${styles.card} ${styles.centered}`}>
        <span className={styles.loadingSpinner} role="progressbar" aria-label="Loading store profile" />
      </div>
    )
  }

  const updatedAt = card.profile?.updatedTime ? formatUpdatedTime(card.profile.updatedTime) : ''

  if (card.error) {
    return (
      <div className={styles.card}>
        <div className={`${styles.header} ${styles.headerError}`}>
          <div className={`${styles.headerLeft} ${styles.nonClick}`}>
            <div className={styles.title}><span>STORE PROFILE</span></div>
          </div>
          <div className={styles.updateDate}>
            <span className={styles.subTitleText}>Updated at {updatedAt}</span>
          </div>
        </div>
        <div className={styles.error}>
          <h6 className={styles.errorHeading}>Error occurred while fetching store data</h6>
          <p className={styles.errorSubText}>
            For any concerns please contact:{' '}
            <a className={styles.errorLink} href={`mailto:${supportEmail ?? ''}`} target="_top">{supportEmail}</a>
          </p>
        </div>
      </div>
    )
  }

  const fields = user.portal === 'BIGW' ? BIGW_FIELDS : NON_BIGW_FIELDS
  const address = card.storeAddress ?? {}

  return (
    <div id={card.jsId} className={styles.card} data-expanded={expanded}>
      <div className={`${styles.header} ${styles.headerGreen}`}>
        <div className={`${styles.headerLeft} ${styles.nonClick}`}>
          <div className={styles.title}><span>STORE PROFILE</span></div>
          <div className={styles.subTitle}>
            <span className={`material-icons ${styles.subTitleIcon}`} aria-hidden="true">room</span>
            <span className={styles.subTitleText}>{card.title}</span>
          </div>
        </div>
        <div className={styles.headerRight} ref={menuRef}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Card options"
            aria-haspopup="menu"
            aria-expanded={menu !== 'closed'}
            onClick={() => setMenu(m => (m === 'closed' ? 'main' : 'closed'))}
          >
            <span className="material-icons">more_vert</span>
          </button>
          {menu !== 'closed' && (
            <div className={styles.menu} role="menu">
              <button type="button" role="menuitem" className={styles.menuItem} onClick={() => setMenu('download')}>
                <span className="material-icons">play_for_work</span> Download
                <span className={`material-icons ${styles.subMenuArrow}`} aria-hidden="true">arrow_right</span>
              </button>
              {menu === 'download' && (
                <div className={`${styles.menu} ${styles.subMenu}`} role="menu">
                  <button type="button" role="menuitem" className={styles.menuItem} onClick={() => doPreview('pdf')}>
                    <span className="material-icons">picture_as_pdf</span> PDF
                  </button>
                  <button type="button" role="menuitem" className={styles.menuItem} onClick={() => doPreview('slide')}>
                    <span className="material-icons">file_copy</span> Google Slide
                  </button>
                </div>
              )}
              <button type="button" role="menuitem" className={styles.menuItem} onClick={() => doPreview('print')}>
                <span className="material-icons">print</span> Print
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.contentTop}>
          <div className={styles.topDetails}>
            <div className={styles.picWrapper}>
              <img className={styles.pic} src={card.storeManagerDetails?.profilePhoto} alt="" />
            </div>
            <div className={styles.detailWrapper}>
              <label className={styles.detailLabel}>
                Store Manager: <span className={styles.detailSpan}>{card.storeManagerDetails?.name}</span>
              </label>
              <label className={styles.detailLabel}>
                Phone: <span className={styles.detailSpan}>{address.SitePhoneNumber}</span>
              </label>
              <label className={styles.detailLabel}>
                Address: <span className={styles.detailSpan}>{address.fullAddress}</span>
              </label>
              <a
                className={styles.direction}
                href={`https://maps.google.com/?q=${address.Latitude},${address.Longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Get Directions
              </a>
            </div>
          </div>
          <div className={styles.bottomDetails}>
            {fields.map(([key, label, suffix]) =>
              card.profile?.[key] ? (
                <label key={key} className={styles.detailLabel}>
                  {label}: <span className={styles.detailSpan}>{card.profile[key]}{suffix}</span>
                </label>
              ) : null,
            )}
          </div>
        </div>
        <div className={`${styles.table} ${expanded ? styles.tableExpanded : ''}`}>
          <table className={styles.qfTable}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => (
                <tr key={`${r.role}-${i}`}>
                  <td>{r.role}</td>
                  <td>{r.name ? <span>{r.name}</span> : <span className={styles.nameSpinner} role="progressbar" aria-label="Loading name" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerLinks}>
            <button
              type="button"
              className={styles.slider}
              onClick={toggleExpanded}
              aria-label={expanded ? 'Collapse roles' : 'Expand roles'}
            >
              <span className={`material-icons ${styles.sliderArrow} ${expanded ? styles.sliderArrowUp : ''}`}>keyboard_arrow_down</span>
            </button>
          </div>
          <div className={styles.updateDate}>
            <span className={styles.subTitleText}>Updated at {updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
