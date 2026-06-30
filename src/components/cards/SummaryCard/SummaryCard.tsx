import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { ISQFMetricCard, ISQFInfoNumber, IExpandableListItem } from '../../../types/sqf.types'
import { MetricCardSkeleton } from '../MetricCard/MetricCardSkeleton'
import { MetricCardChart } from '../MetricCard/MetricCardChart'
import { MetricCardTable } from '../MetricCard/MetricCardTable'
import { MetricCardTabs } from '../MetricCard/MetricCardTabs'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import { REPORTING_PERIODS, isCutOffTimePast } from '../../../utils/formatters'
import styles from './SummaryCard.module.css'

const RED = '#eb5757'
const NEUTRAL = '#ebecec'

function shouldShowRecognize(cardHeader?: string): boolean {
  if (!cardHeader) return false
  const h = cardHeader.toLowerCase()
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
      <div className={styles.kpiValue} style={{ color: kpi.color || 'inherit' }}>
        {kpi.displayValue}
      </div>
      <div className={styles.kpiLabel}>
        {kpi.text}
        {kpi.infoMessage && (
          <div className={styles.tooltipWrapper}>
            <span
              className={styles.infoIcon}
              onClick={() => setShowTooltip(v => !v)}
              aria-label="More info"
            >
              ℹ
            </span>
            {showTooltip && (
              <div className={styles.tooltip}>{kpi.infoMessage}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
  expandTable?: boolean
}

export function SummaryCard({ card, isLoading, expandTable }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [recognizeLoading, setRecognizeLoading] = useState(false)

  useEffect(() => {
    if (!card) return
    if (card.cards) setSelectedFilters(buildInitialFilters(card))
    setExpanded(Boolean(card.autoExpandForMobile))
  }, [card?.cardName])

  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null

  let contentCard: ISQFMetricCard | null = card
  if (card.cards && card.filterKeys) {
    contentCard = getFilteredSubCard(card, selectedFilters)
  }
  const hasFilterError = card.cards != null && contentCard == null

  const borderColor = card.cardHeader || 'var(--color-neutral)'
  const location = card.location?.split('-')[0].trim()
  const reportingPeriodKey = contentCard?.reportingPeriod ?? card.reportingPeriod
  const reportingPeriod = reportingPeriodKey
    ? REPORTING_PERIODS[reportingPeriodKey] ?? reportingPeriodKey
    : undefined
  const showRecognize = shouldShowRecognize(card.cardHeader)
  const cutOffPast = card.error?.cutOffTime ? isCutOffTimePast(card.error.cutOffTime) : false

  const { infoNumbers, customInfoNumbers, chartData, tabs, tableData, richText, subHeading } =
    contentCard ?? ({} as ISQFMetricCard)
  const hasTopContent = !!(infoNumbers || customInfoNumbers || chartData || subHeading)
  const hasCollapsible = !!(tableData || tabs)
  const showFooter = !!(
    card.isDetailsPageAvailable ||
    card.customDrillDownText ||
    card.updatedTime ||
    hasCollapsible
  )

  function handleFilterChange(dropdownKey: string, value: string) {
    setSelectedFilters(prev => ({ ...prev, [dropdownKey]: value }))
    setExpanded(true)
  }

  function handleRecognize() {
    setRecognizeLoading(true)
    setTimeout(() => setRecognizeLoading(false), 1500)
  }

  if (card.error) {
    return (
      <div className={styles.card} id={card.jsId} data-testid="summary-card-error">
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
          </div>
        </div>
        <div className={styles.errorContent}>
          {card.error.cutOffTime && !cutOffPast ? (
            <>
              <p className={styles.errorHeading}>
                Data refresh is expected to complete by {card.error.cutOffTime}
              </p>
              <p className={styles.errorSubtext}>Check back soon.</p>
            </>
          ) : (
            <>
              <p className={styles.errorHeading}>Data currently unavailable</p>
              <p className={styles.errorSubtext}>
                For any concerns please contact:{' '}
                {card.error.support_email && (
                  <a className={styles.errorLink} href={`mailto:${card.error.support_email}`}>
                    {card.error.support_email}
                  </a>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.card} id={card.jsId}>
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
            <div className={styles.subTitle}>
              {location && (
                <span className={styles.subTitleItem}>
                  <span className={styles.subTitleIcon}>📍</span>
                  {location}
                </span>
              )}
              {reportingPeriod && (
                <span className={styles.subTitleItem}>
                  <span className={styles.subTitleIcon}>📅</span>
                  {reportingPeriod}
                </span>
              )}
              {card.dropdowns?.map(dd => (
                <span key={dd.key} className={styles.subTitleItem}>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedFilters[dd.key] ?? ''}
                    onChange={e => handleFilterChange(dd.key, e.target.value)}
                    aria-label={dd.key}
                  >
                    {dd.data.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
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
                {recognizeLoading ? <span className={styles.spinner} /> : '🎉'}
              </button>
            </div>
          )}
        </div>

        {hasFilterError && (
          <div className={styles.errorContent}>
            <p className={styles.errorHeading}>Data temporarily unavailable</p>
            <p className={styles.errorSubtext}>Our team is investigating.</p>
          </div>
        )}

        {!hasFilterError && (
          <div className={styles.content}>
            {hasTopContent && (
              <div className={styles.contentTop}>
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
                {customInfoNumbers && (
                  <div
                    className={styles.customInfoNumbers}
                    dangerouslySetInnerHTML={{ __html: customInfoNumbers }}
                  />
                )}
                {chartData && (
                  <div className={styles.chartArea}>
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
                <MetricCardTabs tabs={tabs} />
              </div>
            )}

            {tableData && (
              <div className={`${styles.collapsible} ${expanded || expandTable ? styles.collapsibleExpanded : ''}`}>
                <MetricCardTable tableData={tableData} />
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
                {(card.isDetailsPageAvailable || card.customDrillDownText || hasCollapsible) && (
                  <div className={styles.footerLinks}>
                    <div>
                      {(card.isDetailsPageAvailable || card.customDrillDownText) && (
                        <Link
                          to={`/quick-facts/details/${card.cardName}`}
                          className={styles.detailsLink}
                        >
                          Go to {card.customDrillDownText || 'details'}
                        </Link>
                      )}
                    </div>
                    {hasCollapsible && !expandTable && (
                      <button
                        className={styles.expandToggle}
                        onClick={() => setExpanded(e => !e)}
                        data-testid="expand-toggle"
                      >
                        {expanded ? 'Collapse' : 'Expand'}
                        <span>{expanded ? ' ▲' : ' ▼'}</span>
                      </button>
                    )}
                  </div>
                )}
                {card.updatedTime && (
                  <div className={styles.footerMeta}>
                    <span className={styles.updateDate}>
                      Updated at {new Date(card.updatedTime).toLocaleString('en-AU', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                    {card.dataInfo && (
                      <button
                        className={styles.metricsInfoBtn}
                        onClick={() => setInfoModalOpen(true)}
                        data-testid="metrics-info-btn"
                      >
                        Metrics Info ℹ
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
