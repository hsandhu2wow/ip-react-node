import { useState, useEffect, Fragment } from 'react'
import type { ISQFMetricCard, ISQFInfoNumber, IQFTree } from '../../../types/sqf.types'
import { MetricCardSkeleton } from '../MetricCard/MetricCardSkeleton'
import { MetricCardChart } from '../MetricCard/MetricCardChart'
import { MetricCardTable } from '../MetricCard/MetricCardTable'
import { MetricCardTabs } from '../MetricCard/MetricCardTabs'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import { REPORTING_PERIODS, isCutOffTimePast } from '../../../utils/formatters'
import styles from './DetailsCard.module.css'

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

function computeDrillDown(
  card: ISQFMetricCard,
  selectedNode: IQFTree | null,
  detailsLastLevel: number
): { nextLevel: string | null; isStore: boolean } {
  if (!card.canDrillDown || !selectedNode?.children?.length) {
    return { nextLevel: null, isStore: false }
  }
  const child = selectedNode.children[0]
  const isStore = child.apiDepth === 5
  if (child.apiDepth > detailsLastLevel) return { nextLevel: null, isStore: false }

  if (card.isGenericCardApi && card.customDrillDownText !== undefined) {
    return { nextLevel: card.customDrillDownText || null, isStore }
  }
  if (card.cardName === 'C1Availability' && child.level_desc === 'Store') {
    return { nextLevel: 'Store details', isStore }
  }
  const desc =
    child.children?.length
      ? child.children[0].level_desc
      : child.leafChildren?.length
      ? (child.leafChildren[0] as any).level_desc
      : 'Category'
  return { nextLevel: `${desc} details`, isStore }
}

// ── KPI block (stacked layout for details) ─────────────────────────────────
function KpiBlock({ kpi }: { kpi: ISQFInfoNumber }) {
  return (
    <div className={styles.kpiBlock}>
      <div className={styles.kpiValue} style={{ color: kpi.color || 'inherit' }}>
        {kpi.displayValue}
      </div>
      <div className={styles.kpiLabel}>
        {kpi.text}
        {kpi.infoMessage && (
          <span
            className={styles.infoIcon}
            title={kpi.infoMessage}
            aria-label="More info"
          >
            ℹ
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
  /** Currently selected filter node — used to compute drill-down level label */
  selectedNode?: IQFTree | null
  /** details_last_level from card status config — limits drill-down depth */
  detailsLastLevel?: number
  /** Called when user clicks the drill-down link; passes selected dept for C1Availability */
  onDrillDown?: (dept?: string) => void
}

export function DetailsCard({
  card,
  isLoading,
  selectedNode,
  detailsLastLevel = 99,
  onDrillDown,
}: Props) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [recognizeLoading, setRecognizeLoading] = useState(false)
  const [selectedDept, setSelectedDept] = useState('')

  const filterConfigKey = card?.filterKeys ? Object.keys(card.filterKeys).join(',') : ''
  const dropdownKeys = card?.dropdowns ? card.dropdowns.map(d => d.key).join(',') : ''

  useEffect(() => {
    if (card?.cards) setSelectedFilters(buildInitialFilters(card))
  }, [card?.cardName, filterConfigKey, dropdownKeys])

  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null

  // ── Resolve content card ────────────────────────────────────────────────
  let contentCard: ISQFMetricCard | null = card
  if (card.cards && card.filterKeys) {
    contentCard = getFilteredSubCard(card, selectedFilters)
  }
  const hasFilterError = card.cards != null && contentCard == null

  // ── Derived values ──────────────────────────────────────────────────────
  const borderColor = card.cardHeader || 'var(--color-neutral)'
  const reportingPeriodKey = contentCard?.reportingPeriod ?? card.reportingPeriod
  const reportingPeriod = reportingPeriodKey
    ? REPORTING_PERIODS[reportingPeriodKey] ?? reportingPeriodKey
    : undefined
  const showRecognize = shouldShowRecognize(card.cardHeader)
  const cutOffPast = card.error?.cutOffTime ? isCutOffTimePast(card.error.cutOffTime) : false
  const { nextLevel, isStore } = computeDrillDown(card, selectedNode ?? null, detailsLastLevel)

  const { infoNumbers, chartData, tabs, tableData } = contentCard ?? ({} as ISQFMetricCard)
  const showLeftCol = !card.tableOnly
  const rightColFull = card.tableOnly || !chartData

  function handleFilterChange(dropdownKey: string, value: string) {
    setSelectedFilters(prev => ({ ...prev, [dropdownKey]: value }))
  }

  function handleRecognize() {
    setRecognizeLoading(true)
    setTimeout(() => setRecognizeLoading(false), 1500)
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (card.error) {
    return (
      <div className={styles.card} data-testid="details-card-error">
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
          </div>
        </div>
        <div className={styles.errorContent}>
          {card.error.cutOffTime && !cutOffPast ? (
            <p className={styles.errorHeading}>
              Data refresh is expected to complete by {card.error.cutOffTime}
            </p>
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
      <div className={styles.card}>
        {/* ── Header ── */}
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
            <div className={styles.subTitle}>
              {reportingPeriod && (
                <span className={styles.subTitleItem}>📅 {reportingPeriod}</span>
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
                data-testid="details-recognize-btn"
                aria-label="Recognize team"
              >
                {recognizeLoading ? <span className={styles.spinner} /> : '🎉'}
              </button>
            </div>
          )}
        </div>

        {/* ── Filter error ── */}
        {hasFilterError && (
          <div className={styles.errorContent}>
            <p className={styles.errorHeading}>Data temporarily unavailable</p>
            <p className={styles.errorSubtext}>Our team is investigating.</p>
          </div>
        )}

        {/* ── Two-column content ── */}
        {!hasFilterError && (
          <div className={styles.content}>
            {/* Left: KPIs + chart */}
            {showLeftCol && (
              <div className={styles.leftCol} data-testid="details-left-col">
                {infoNumbers && infoNumbers.length > 0 && (
                  <div className={styles.kpiRow}>
                    {infoNumbers.map((kpi, i) => (
                      <Fragment key={i}>
                        {i > 0 && <div className={styles.kpiDivider} />}
                        <KpiBlock kpi={kpi} />
                      </Fragment>
                    ))}
                  </div>
                )}
                {chartData && <MetricCardChart chartData={chartData} />}
              </div>
            )}

            {/* Right: tabs / table / drill-down */}
            <div className={rightColFull ? styles.rightColFull : styles.rightCol}>
              {tabs && <MetricCardTabs tabs={tabs} />}
              {tableData && <MetricCardTable tableData={tableData} />}

              {/* Drill-down link — standard */}
              {nextLevel && !isStore && (
                <span
                  className={styles.drillDownLink}
                  onClick={() => onDrillDown?.()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onDrillDown?.()}
                >
                  View {nextLevel}
                </span>
              )}

              {/* Drill-down — C1Availability store level: dept select */}
              {card.canDrillDown && card.cardName === 'C1Availability' && isStore && (
                <div className={styles.deptSelect}>
                  <span className={styles.deptSelectLabel}>View Department details</span>
                  <select
                    className={styles.deptSelectInput}
                    value={selectedDept}
                    onChange={e => {
                      setSelectedDept(e.target.value)
                      onDrillDown?.(e.target.value)
                    }}
                  >
                    <option value="" disabled>Select Department</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!hasFilterError && !card.error && (
          <div className={styles.footer}>
            <span data-testid="details-updated-time">
              Updated at{' '}
              {card.updatedTime
                ? new Date(card.updatedTime).toLocaleString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
            {card.dataInfo && (
              <button
                className={styles.metricsInfoBtn}
                onClick={() => setInfoModalOpen(true)}
                data-testid="details-metrics-info-btn"
              >
                Metrics Info ℹ
              </button>
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
