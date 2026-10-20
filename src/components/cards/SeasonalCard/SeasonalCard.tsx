import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { ISeasonalCard, IQFTree } from '../../../types/sqf.types'
import { useAuth } from '../../../context/AuthContext'
import { useOptionalFilter } from '../../../context/FilterContext'
import { sendQFDataToAnalytics } from '../../../utils/analytics'
import { formatUpdatedTime } from '../../../utils/formatters'
import { SeasonalBarChart } from './SeasonalBarChart'
import { SeasonalTable } from './SeasonalTable'
import sharedStyles from '../SummaryCard/SummaryCard.module.css'
import styles from './SeasonalCard.module.css'

interface Props {
  card: ISeasonalCard | null
  expandTable?: boolean
  last?: boolean
  mini?: boolean
  selectedNode?: IQFTree | null
  detailsLastLevel?: number
  onDrillDown?: (code?: string) => void
  supportEmail?: string
}
const icon = (name: string, className = '') => <span aria-hidden="true" className={`material-icons ${className}`}>{name}</span>

function SeasonalShell({ card, expandTable, selectedNode, detailsLastLevel, onDrillDown, supportEmail, details = false, chartDetails = details, hideExpandCollapseLinks = false }: Props & { details?: boolean; chartDetails?: boolean; hideExpandCollapseLinks?: boolean }) {
  const { user } = useAuth()
  const filter = useOptionalFilter()
  const { search } = useLocation()
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { if (!card) setExpanded(false) }, [card])
  if (card?.hidden) return null
  const prefix = details ? 'qf-details-card' : 'qf-summary-card'
  const cls = (name: string) => `${prefix}__${name}`
  const c = card
  const currency = (value: number | null | undefined) => value == null ? undefined : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  const table = c?.tableData?.length ? <SeasonalTable tableData={c.tableData} cardLevel={c.cardLevel} childCode={c.cardCode} zeroSalesSohArticles={c.zero_sales_soh_articles} /> : null
  const chart = c?.chartData && <SeasonalBarChart chartData={c.chartData} details={chartDetails} />
  const updatedAt = c?.updatedAt ? formatUpdatedTime(c.updatedAt) : ''
  const location = user.portal === 'METRO'
    ? `${c?.cardLevel === 'Store' && (c.level?.length ?? 0) > 16 ? '' : c?.level || ''}${c?.cardLevel === 'Store' ? `${(c.level?.length ?? 0) < 16 ? ' - ' : ''}${c.cardCode || c.parentCode || ''}` : ''}`
    : `${c?.level || c?.location || ''}${c?.cardLevel === 'Store' ? ` - ${c.cardCode || c.parentCode || ''}` : ''}`
  const node = selectedNode || filter?.selectedNode
  const child = node?.children?.[0]
  const nextLevel = c?.canDrillDown && child && child.apiDepth <= (detailsLastLevel ?? -1)
    ? `${child.children?.[0]?.level_desc || child.leafChildren?.[0]?.level_desc || 'Category'} details` : ''
  const numbers = c && (details ? <div className={cls('numbers')}>
    {[
      [c.infoMainNumber, c.infoMainNumberText], [c.infoSubNumber, c.infoSubDetails],
      [c.infoAdditional1, c.infoAdditional1Text], [c.infoAdditional2, c.infoAdditional2Text],
    ].filter(([, label], i) => i === 0 || label).map(([value, label], i) => <div className={cls('numbers-block')} key={i}>
      <span className={cls('number')} title={i === 0 ? currency(c.infoMainNumberFull) : undefined}>{value}</span>
      <span className={`${cls('number-label')} ${i === 0 ? cls('main-kpi') : ''}`}>{label}</span>
    </div>)}
  </div> : <div className={cls('numbers')}>
    <p className={`${cls('number')} ${cls('number--large')} ${cls('number--bold')}`}>
      {c.infoMainNumber}<span className={`${cls('number-suffix')} ${cls('main-kpi')}`}><span>{c.infoMainNumberText}</span></span>
    </p>
    <span className={`${cls('number')} ${cls('number--bold')}`}>{c.infoSubNumber}<span className={cls('number-suffix')}>{c.infoSubDetails}</span></span>
    <span className={cls('number')}>{c.infoAdditional1}<span className={cls('number-suffix')}>{c.infoAdditional1Text}</span></span>
    <span className={cls('number')}>{c.infoAdditional2}<span className={cls('number-suffix')}>{c.infoAdditional2Text}</span></span>
  </div>)
  const error = c?.error
  const email = error?.supportEmail || supportEmail
  const concerns = <p className={cls('error-sub-text')}>For any concerns please contact: <a className={cls('error-link')} href={`mailto:${email || ''}`} target="_top">{email}</a></p>
  const bigw = <>This metric card is currently unavailable. <br /><br /></>
  const wmd = <>WMD Metric card is currently unavailable due to source data changes. Please click <a href="https://storeinsights.woolworths.com.au/dashboards/tableau/1573" target="_blank" rel="noreferrer"><u>here</u></a> to access the WMD dashboard for more information. Apologies for inconvenience.</>
  return <article id={c?.jsId} className={`${details ? styles.details : styles.summary} ${prefix}${!c ? ` ${cls('centered')}` : ''}`}>
    {c && <div className={`${cls('header')} ${cls(`header--${error ? 'error' : c.status?.toLowerCase() || 'white'}`)}`} style={!error && !details ? { borderTopColor: c.cardHeader } : undefined}>
      <div className={`${cls('header-left')}${!c.canDrillDown ? ` ${cls('header-left--non-click')}` : ''}${error && !details ? ` ${cls('title')}` : ''}`}>
        <div className={cls('title')}><span title={!c.canDrillDown ? 'No further drill down available' : undefined}>
          {error ? details ? (c.title || c.type).toUpperCase() : c.title || c.type : details ? `${c.level?.toUpperCase() || ''}${c.cardLevel === 'Store' ? ` - ${c.cardCode || c.parentCode || ''}` : ''}` : c.title?.toUpperCase()}
        </span></div>
        {!error && <div className={cls('sub-title')}>
          <div className={cls('sub-title-div')}>
            {!details && icon('room', cls('sub-title-icon'))}
            <span className={`${cls('sub-title-text')} ${!details ? cls('location') : ''}`} title={!details ? c.fullLocationName || 'Add your TS getter here' : undefined}>{details ? `Updated at ${updatedAt}` : location}</span>
          </div>
          {(details || c.reportingPeriod) && <div className={`${cls('sub-title-div')} ${cls('reportingPeriod')}`}>
            {icon('calendar_today', cls('sub-title-icon'))}<span className={cls('sub-title-text')}>{c.reportingPeriod}</span>
          </div>}
        </div>}
      </div>
    </div>}
    {c && !error && <div className={cls('content')}>
      {details ? <>
        {!c.tableOnly && <div className={cls('left-section')}><div className={cls('graph')}>{chart}</div>{numbers}</div>}
        <div className={`${cls('table-content')} ${c.tableOnly ? cls('table-content--full-width') : ''}`}>
          <div className={`${cls('table')} qf-scroll-container ${c.tableOnly ? cls('table--full-width') : ''}`}>{table}</div>
          {!!nextLevel && <button className={cls('link')} onClick={() => onDrillDown?.(c.cardCode)}>View {nextLevel}</button>}
        </div>
      </> : <>
        {!c.tableOnly && <div className={cls('content-top')}>{numbers}<div className={cls('graph')}>{chart}</div></div>}
        <div hidden={!(expanded || c.tableOnly)} className={`${cls('table')} qf-scroll-container ${expandTable ? cls('table--unscrolled') : ''} ${expanded || c.tableOnly ? cls('table--expanded') : ''}`}>{table}</div>
        <div className={cls('footer')}>
          <div className={cls('footer-links')}>
            {c.isDetailsPageAvailable && <Link className={cls('footer-details')} to={{ pathname: '/quick-facts/details/seasonal', search }}>Go to details</Link>}
            {!c.tableOnly && !hideExpandCollapseLinks && !expandTable && <button className={cls('slider')} aria-expanded={expanded} onClick={() => {
              setExpanded(!expanded)
              if (!expanded) sendQFDataToAnalytics('expandSummaryTable', 'seasonal', filter?.selectedNode?.code)
            }}><span className={cls('slider-text')}>{expanded ? 'Collapse' : 'Expand '}</span>{icon('keyboard_arrow_down', `${cls('slider-arrow')} ${expanded ? cls('slider-arrow--up') : ''}`)}</button>}
          </div>
          <div className={cls('time-nav')}><div className={cls('update-date')}><span className={cls('sub-title-text')}>Updated at {updatedAt}</span></div><div className={cls('nav-bar')} /></div>
        </div>
      </>}
    </div>}
    {!c && <span className={`${sharedStyles.spinner} ${styles.loadingSpinner}`} role="progressbar" aria-label="Loading Seasonal card" />}
    {error && <>
      {(error.generic || error.cutOffTime) && <div className={cls('error')}>
        <img className="qf-error-img" src={`/assets/images/${error.cutOffTime ? 'Data_refresh_empty_state.svg' : 'Data_refresh_failed_empty_state.svg'}`} alt={details && error.generic ? 'Error' : 'No data'} width={84} />
        <h6 className={cls('error-heading')}>{user.portal === 'BIGW' && (error.generic === true || error.cutOffTime)
          ? bigw : error.cutOffTime ? `Data refresh is expected to complete by ${error.cutOffTime}` : error.generic === true ? 'Data refresh failed, we are currently investigating' : error.generic}</h6>
        {user.portal === 'BIGW' && (error.generic === true || error.cutOffTime) && <>Please see the information banner above for latest updates.<br /></>}
        {concerns}
      </div>}
      {error.level && <div className={cls('error')}>
        {!details && <img className="qf-error-img" src="/assets/images/Data_refresh_failed_empty_state.svg" alt="No data" width={84} />}
        <h6 className={cls('error-heading')}>Quick Facts does not display information at this level</h6>{!details && concerns}
      </div>}
      {error.wmd && <div className={cls('error')}>
        {!details && <img className="qf-error-img" src="/assets/images/Data_refresh_failed_empty_state.svg" alt="No data" width={84} />}
        {details ? <h6 className={cls('error-link')}>{wmd}</h6> : <small className={cls('error-heading')}>{wmd}</small>}
      </div>}
      {!details && <div className={cls('nav-bar-err')} />}
    </>}
  </article>
}
export function SeasonalSummaryCard(props: Props) { return <SeasonalShell {...props} hideExpandCollapseLinks={props.card?.tableData?.length === 0} /> }
export function SeasonalDetailsCard({ last, mini, ...props }: Props) {
  return <><SeasonalShell {...props} details={!mini} chartDetails />{!last && !mini && <hr className={styles.divider} />}</>
}
