import { useEffect, useState } from 'react'
import { getStoreProfileRoleNames, type IQFProfileRole, type IQFStoreProfile } from '../../../api/storeProfile'
import { useAuth } from '../../../context/AuthContext'
import { formatUpdatedTime } from '../../../utils/formatters'
import styles from './ProfileCard.module.css'

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
  const [expanded, setExpanded] = useState(false)
  const [roles, setRoles] = useState<IQFProfileRole[]>(card?.roles ?? [])
  const [roleNamesFetched, setRoleNamesFetched] = useState(false)

  // Angular @Input() set card: reset expansion/roles whenever the card changes
  useEffect(() => {
    setExpanded(false)
    setRoleNamesFetched(false)
    setRoles(card?.roles ?? [])
  }, [card])

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
    <div id={card.jsId} className={styles.card}>
      <div className={`${styles.header} ${styles.headerGreen}`}>
        <div className={`${styles.headerLeft} ${styles.nonClick}`}>
          <div className={styles.title}><span>STORE PROFILE</span></div>
          <div className={styles.subTitle}>
            <span className={`material-icons ${styles.subTitleIcon}`} aria-hidden="true">room</span>
            <span className={styles.subTitleText}>{card.title}</span>
          </div>
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
