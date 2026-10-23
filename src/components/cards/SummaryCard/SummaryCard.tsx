import { useState, useEffect, Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { ISQFMetricCard, ISQFInfoNumber, IExpandableListItem, BreakdownAxis } from '../../../types/sqf.types'
import { useAxisCard } from '../../../hooks/useAxisCard'
import { useOptionalFilter } from '../../../context/FilterContext'
import { useAuth } from '../../../context/AuthContext'
import { childLevelLabel } from '../../../utils/levelLabels'
import { isLegacyBreakdownCard } from '../../../utils/breakdown'
import { MetricCardSkeleton } from '../MetricCard/MetricCardSkeleton'
import { MetricCardChart } from '../MetricCard/MetricCardChart'
import { MetricCardTable } from '../MetricCard/MetricCardTable'
import { MetricCardTabs } from '../MetricCard/MetricCardTabs'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import { useCardsPreview } from '../../shared/PreviewDialog/cardsPreviewContext'
import { sendQFDataToAnalytics } from '../../../utils/analytics'
import { REPORTING_PERIODS, isCutOffTimePast, formatUpdatedTime } from '../../../utils/formatters'
import styles from './SummaryCard.module.css'

const RED = '#eb5757'
const NEUTRAL = '#ebecec'

function shouldShowRecognize(cardHeader?: string): boolean {
  const h = cardHeader?.toLowerCase()
  return h !== RED && h !== NEUTRAL
}

function buildInitialFilters(card: ISQFMetricCard): Record<string, string> {
  const filters: Record<string, string> = {}
  if (!card.filterKeys || !card.dropdowns) return filters
  for (const dropdownKey of Object.values(card.filterKeys)) {
    const dd = card.dropdowns.find(d => d.key === dropdownKey)
    if (dd?.data.length) filters[dropdownKey] = dd.data[0].key
  }
  return filters
}

function getFilteredSubCard(
  card: ISQFMetricCard,
  selectedFilters: Record<string, string>
): ISQFMetricCard | null {
  if (!card.cards || !card.filterKeys) return null
  const filters = Object.entries(card.filterKeys).map(([colKey, dropdownKey]) => ({
    colKey,
    value: selectedFilters[dropdownKey],
  }))
  return (
    card.cards.find(c =>
      filters.every(
        ({ colKey, value }) => (c.keys as Record<string, string>)?.[colKey] === value
      )
    ) ?? null
  )
}

function ExpandableItem({ item, isLast }: { item: IExpandableListItem; isLast: boolean }) {
  const [open, setOpen] = useState(item.isExpanded ?? false)
  return (
    <div className={`${styles.expandableItem} ${isLast ? styles.expandableItemLast : ''}`}>
      <div
        className={styles.expandableHeader}
        onClick={() => setOpen(o => !o)}
        dangerouslySetInnerHTML={{ __html: item.header }}
      />
      {item.content && open && (
        <div
          className={styles.expandableContent}
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      )}
    </div>
  )
}

function KpiNumber({ kpi }: { kpi: ISQFInfoNumber }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className={styles.kpiCol}>
      <span className={styles.kpiValue} style={{ color: kpi.color || 'inherit' }}>
        {kpi.displayValue}
      </span>
      <span className={styles.kpiLabel}>
        <span>{kpi.text}</span>
        {kpi.infoMessage && (
          <div className={styles.tooltipWrapper}>
            <span
              className={`material-icons ${styles.infoIcon}`}
              onClick={() => setShowTooltip(v => !v)}
              aria-label="More info"
            >
              info_outline
            </span>
            {showTooltip && (
              <div className={styles.tooltip}>{kpi.infoMessage}</div>
            )}
          </div>
        )}
      </span>
    </div>
  )
}

interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
  expandTable?: boolean
  /** Global breakdown axis; when set, axis-driven cards ignore their own dropdowns */
  axis?: BreakdownAxis
  /** SQF support email shown in the filter-error state */
  supportEmail?: string
}

export function SummaryCard({ card, isLoading, expandTable, axis, supportEmail }: Props) {
  const { axisDriven, axisCard } = useAxisCard(card, axis)
  const filter = useOptionalFilter()
  const { user } = useAuth()
  const locationSearch = useLocation().search
  const [expanded, setExpanded] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [recognizeLoading, setRecognizeLoading] = useState(false)
  const { preview } = useCardsPreview()

  const filterConfigKey = card?.filterKeys ? Object.keys(card.filterKeys).join(',') : ''
  const dropdownKeys = card?.dropdowns?.map(d => d.key).join(',') ?? ''

  useEffect(() => {
    if (!card) return
    if (card.cards) setSelectedFilters(buildInitialFilters(card))
    // Angular: UTIL.browser.mobile() && card.autoExpandForMobile
    setExpanded(/Mobi/i.test(window.navigator.userAgent) && Boolean(card.autoExpandForMobile))
  }, [card?.cardName, filterConfigKey, dropdownKeys])

  // Angular onBreakdownAxisChanged: every header breakdown selection expands the table
  const breakdownAxisChangeCount = filter?.breakdownAxisChangeCount ?? 0
  const locationCode = filter?.selectedNode?.code
  const axisResolved = !!card?.cards && !isLegacyBreakdownCard(card) && !!axisCard
  useEffect(() => {
    if (breakdownAxisChangeCount === 0) return
    setExpanded(true)
    if (axisResolved) sendQFDataToAnalytics('breakdownAxisChangeSummaryCard', card?.cardName, locationCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdownAxisChangeCount])

  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null

  let contentCard: ISQFMetricCard | null = card
  if (card.cards && card.filterKeys) {
    contentCard = axisDriven ? axisCard : getFilteredSubCard(card, selectedFilters)
  }
  const hasFilterError = card.cards != null && contentCard == null

  // Angular setComponentValues: header colour comes from the resolved (child) card
  const cardHeader = contentCard?.cardHeader
  const borderColor = cardHeader || 'var(--color-neutral)'
  const location = card.location?.split('-')[0].trim()
  const reportingPeriodKey = contentCard?.reportingPeriod ?? card.reportingPeriod
  const reportingPeriod = reportingPeriodKey
    ? REPORTING_PERIODS[reportingPeriodKey] ?? reportingPeriodKey
    : undefined
  const showRecognize = shouldShowRecognize(cardHeader)
  const cutOffPast = isCutOffTimePast(card.error)
  const isLegacy = !!card.cards && isLegacyBreakdownCard(card)
  // Mirrors Angular SqfSummaryCardComponent.breakdownLabel
  const breakdownLabel =
    (axis ?? filter?.selectedBreakdownAxis) === 'childLevel'
      ? childLevelLabel(filter?.selectedNode, user.portal)
      : card.breakdownLabelOverride || 'Departments'

  const { infoNumbers, customInfoNumbers, chartData, tabs, tableData, richText, subHeading } =
    contentCard ?? ({} as ISQFMetricCard)
  const hasTopContent = !!(infoNumbers || customInfoNumbers || chartData || subHeading)
  const hasCollapsible = !!(tableData || tabs)
  const showFooter = !!(
    card.isDetailsPageAvailable ||
    card.customDrillDownText ||
    card.updatedTime ||
    tableData
  )

  function handleFilterChange(dropdownKey: string, value: string) {
    setSelectedFilters(prev => ({ ...prev, [dropdownKey]: value }))
    setExpanded(true)
    sendQFDataToAnalytics('dropdownChangeSummaryCard', card?.cardName, locationCode)
  }

  function toggleExpandTable() {
    const next = !expanded
    setExpanded(next)
    if (next) sendQFDataToAnalytics('expandSummaryTable', card?.cardName, locationCode)
  }

  function handleRecognize() {
    setRecognizeLoading(true)
    sendQFDataToAnalytics('recognizeQFSummaryCard', card?.cardName, locationCode)
    // Angular onRecognizePreview: spinner until the preview dialog has opened
    preview('recognize', [card as ISQFMetricCard]).finally(() => setRecognizeLoading(false))
  }

  if (card.error) {
    const isPending = card.error.cutOffTime && !cutOffPast
    return (
      <div className={styles.card} id={card.jsId} data-testid="summary-card-error">
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={`${styles.headerLeft} ${styles.errorHeaderLeft}`}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
          </div>
        </div>
        <div className={styles.errorContent}>
          <img
            className={styles.errorImg}
            src={
              isPending
                ? '/assets/images/Data_refresh_empty_state.svg'
                : '/assets/images/Data_refresh_failed_empty_state.svg'
            }
            alt="No data"
          />
          {isPending ? (
            <p className={styles.errorHeading}>
              Data refresh is expected to complete by {card.error.cutOffTime}
            </p>
          ) : (
            <p className={styles.errorHeading}>
              {card.error.message || 'Data currently unavailable'}
            </p>
          )}
          <p className={styles.errorSubtext}>
            For any concerns please contact:{' '}
            {card.error.supportEmail && (
              <a className={styles.errorLink} href={`mailto:${card.error.supportEmail}`}>
                {card.error.supportEmail}
              </a>
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.card} id={card.jsId} data-expanded={expanded || expandTable}>
        <div
          className={`${styles.header} ${subHeading ? styles.headerWithSubHeading : ''}`}
          style={{ borderTopColor: borderColor }}
        >
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
            <div className={styles.subTitle}>
              {location && (
                <span className={styles.subTitleItem}>
                  <span className={`material-icons ${styles.subTitleIcon}`}>room</span>
                  <span className={`${styles.subTitleText} ${styles.location}`} title={location}>
                    {location}
                  </span>
                </span>
              )}
              {reportingPeriod && (
                <span className={styles.subTitleItem}>
                  <span className={`material-icons ${styles.subTitleIcon}`}>calendar_today</span>
                  <span className={styles.subTitleText}>{reportingPeriod}</span>
                </span>
              )}
              {isLegacy && card.dropdowns?.map(dd => (
                <div key={dd.key} className={styles.seg} role="group" aria-label={dd.key}>
                  {dd.data.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`${styles.segBtn} ${selectedFilters[dd.key] === opt.key ? styles.segBtnActive : ''}`}
                      aria-pressed={selectedFilters[dd.key] === opt.key}
                      onClick={() => handleFilterChange(dd.key, opt.key)}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              ))}
              {!axisDriven && !isLegacy && card.dropdowns?.map(dd => (
                <span key={dd.key} className={styles.subTitleItem}>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedFilters[dd.key] ?? ''}
                    onChange={e => handleFilterChange(dd.key, e.target.value)}
                    aria-label={dd.key}
                  >
                    {dd.data.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.text}
                      </option>
                    ))}
                  </select>
                </span>
              ))}
            </div>
          </div>
          {showRecognize && (
            <div className={styles.headerRight}>
              <button
                className={styles.recognizeBtn}
                onClick={handleRecognize}
                disabled={recognizeLoading}
                data-testid="recognize-btn"
                aria-label="Recognize team"
              >
                {recognizeLoading ? <span className={styles.spinner} /> : <span className="material-icons-outlined">celebration</span>}
              </button>
            </div>
          )}
        </div>

        {hasFilterError && (
          <div className={styles.errorContent}>
            <p className={styles.errorHeading}>Data temporarily unavailable</p>
            <p className={styles.errorSubtext}>
              Our team is investigating. <br />For update or assistance, contact:{' '}
              {supportEmail && (
                <a className={styles.errorLink} href={`mailto:${supportEmail}`} target="_top">
                  {supportEmail}
                </a>
              )}
            </p>
          </div>
        )}

        {!hasFilterError && (
          <div className={styles.content}>
            {hasTopContent && (
              <div className={styles.contentTop}>
                {(subHeading || (infoNumbers && !customInfoNumbers)) && (
                  <div>
                    {subHeading && <div className={styles.subHeading}>{subHeading}</div>}
                    {infoNumbers && !customInfoNumbers && (
                      <div className={styles.kpiRow}>
                        {infoNumbers.map((kpi, i) => (
                          <Fragment key={i}>
                            {i > 0 && <div className={styles.kpiDivider} />}
                            <KpiNumber kpi={kpi} />
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {customInfoNumbers && (
                  <div className={styles.kpiRow}>
                    <div
                      className={styles.customInfoNumbers}
                      dangerouslySetInnerHTML={{ __html: customInfoNumbers }}
                    />
                  </div>
                )}
                {chartData && (
                  <div
                    className={[
                      styles.chartArea,
                      customInfoNumbers ? styles.chartAreaHasCustomInfo : '',
                      chartData.chartType === 'bar' || chartData.chartType === 'horizontalBar'
                        ? ''
                        : styles.chartAreaPie,
                    ].join(' ')}
                  >
                    <MetricCardChart chartData={chartData} />
                  </div>
                )}
                {richText && (
                  <div
                    className={styles.richText}
                    dangerouslySetInnerHTML={{ __html: richText }}
                  />
                )}
              </div>
            )}

            {tabs && (
              <div className={`${styles.collapsible} ${expanded || expandTable ? styles.collapsibleExpanded : ''}`}>
                <MetricCardTabs tabs={tabs} isSummary expanded={expanded || expandTable} cardName={card.cardName} />
              </div>
            )}

            {hasCollapsible && (
              <div className={styles.breakdownRow}>
                {!isLegacy && (
                  <span className={styles.breakdownLabel}>
                    <span className={`material-icons ${styles.subTitleIcon}`}>category</span>
                    {breakdownLabel}
                  </span>
                )}
                {!expandTable && (
                  <button
                    type="button"
                    className={styles.expandToggle}
                    onClick={toggleExpandTable}
                    data-testid="expand-toggle"
                    aria-expanded={expanded}
                  >
                    <span>{expanded ? 'Collapse' : 'Expand'}</span>
                    <span
                      className={`material-icons ${styles.expandArrow} ${expanded ? styles.expandArrowUp : ''}`}
                      aria-hidden="true"
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                )}
              </div>
            )}

            {tableData && (
              <div className={`${styles.collapsible} ${expanded || expandTable ? styles.collapsibleExpanded : ''}`}>
                <MetricCardTable tableData={tableData} isSummary expanded={expanded || expandTable} />
              </div>
            )}

            {card.expandable_list && (
              <div className={styles.expandableList}>
                {card.expandable_list.map((item, i) => (
                  <ExpandableItem
                    key={i}
                    item={item}
                    isLast={i === (card.expandable_list?.length ?? 0) - 1}
                  />
                ))}
              </div>
            )}

            {showFooter && (
              <div className={styles.footer}>
                <div className={styles.footerLinks}>
                  <div className={styles.footerLinksLeft}>
                    {(card.isDetailsPageAvailable || card.customDrillDownText) && (
                      <Link
                        to={{ pathname: `/quick-facts/details/${card.cardName}`, search: locationSearch }}
                        className={styles.detailsLink}
                      >
                        Go to {card.customDrillDownText || 'details'}
                      </Link>
                    )}
                  </div>
                </div>
                {card.updatedTime && (
                  <div className={styles.footerMeta}>
                    <span className={styles.updateDate}>
                      Updated at {formatUpdatedTime(card.updatedTime)}
                    </span>
                    {card.dataInfo && (
                      <button
                        className={styles.metricsInfoBtn}
                        onClick={() => setInfoModalOpen(true)}
                        data-testid="metrics-info-btn"
                      >
                        <span>Metrics Info</span>
                        <span className={`material-icons ${styles.dataInfoIcon}`}>info_outlined</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {infoModalOpen && card.dataInfo && (
        <InfoModal
          title={card.dataInfo.title}
          body={card.dataInfo.body}
          onClose={() => setInfoModalOpen(false)}
        />
      )}
    </>
  )
}
