// src/components/layout/FilterBar/FilterBar.tsx
import { useState, useRef, useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'
import { CardTypeDropdown } from './CardTypeDropdown'
import { useFilter } from '../../../context/FilterContext'
import { useAuth } from '../../../context/AuthContext'
import { useFilterTree } from '../../../hooks/useFilterTree'
import { useSummaryCards } from '../../../hooks/useSummaryCards'
import { useDetailsCard } from '../../../hooks/useDetailsCard'
import { usePeriodCards } from '../../../hooks/usePeriodCards'
import { childLevelLabel, hidesBreakdownAxis } from '../../../utils/levelLabels'
import { FilterSelect } from './FilterSelect'
import type { BreakdownAxis, Period } from '../../../types/sqf.types'
import { formatDate, getYesterdayDate } from '../../../utils/formatters'
import type { IQFTree } from '../../../types/sqf.types'
import { LocationTree } from './LocationTree'
import { DatePicker, DATE_PANEL_WIDTH } from './DatePicker'
import { useEscapeToClose } from './useEscapeToClose'
import { useCardsPreview } from '../../shared/PreviewDialog/cardsPreviewContext'
import { FeedbackDialog } from '../../shared/FeedbackDialog/FeedbackDialog'
import { useTrendActions } from '../../../context/TrendActionsContext'
import { useCardStatus } from '../../../hooks/useCardStatus'
import styles from './FilterBar.module.css'
import { sendQFDataToAnalytics } from '../../../utils/analytics'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/** Format ISO date "yyyy-MM-dd" → "dd MMM" e.g. "30 Jun" */
function formatDisplayDate(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

export function FilterBar() {
  useFilterTree() // loads tree and calls initTree on FilterContext

  const {
    selectedNode, selectedDate, isLoaded, setSelectedNode, setSelectedDate,
    setSelectedPeriod, selectedBreakdownAxis, setSelectedBreakdownAxis,
  } = useFilter()
  const { user } = useAuth()

  const { pathname } = useLocation()
  const { preview } = useCardsPreview()
  const isQuickAssistPage = pathname.includes('quick-assist')
  const detailsType = matchPath('/quick-facts/details/:type', pathname)?.params.type
  const isSummaryPage = pathname.startsWith('/quick-facts/summary')
  const summaryQuery = useSummaryCards(isSummaryPage || !!detailsType)
  const detailsQuery = useDetailsCard(detailsType)
  const { hasMultiplePeriods, activePeriod } = usePeriodCards(
    detailsType ? detailsQuery.data : summaryQuery.data
  )
  const showFilters = isSummaryPage || !!detailsType
  // Angular sqf-filter hideDateFilter
  const hideDateFilter = isQuickAssistPage || pathname.includes('weekly') || pathname.includes('myplan')
  const showPeriod = showFilters && hasMultiplePeriods
  const showAxis = showFilters && !hidesBreakdownAxis(selectedNode)
  const axisLabel =
    selectedBreakdownAxis === 'childLevel' ? childLevelLabel(selectedNode, user.portal) : 'Departments'

  // Angular sqf-filter setPeriod / setBreakdownAxis (with GA analytics)
  function handlePeriodChange(period: Period) {
    setSelectedPeriod(period)
    sendQFDataToAnalytics(`periodChange${period}`, detailsType ?? '', selectedNode?.code)
  }
  function handleBreakdownAxisChange(axis: BreakdownAxis) {
    setSelectedBreakdownAxis(axis)
    sendQFDataToAnalytics(
      `breakdownAxisChange${axis === 'childLevel' ? 'ChildLevel' : 'Department'}`,
      detailsType ?? '',
      selectedNode?.code,
    )
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const dateLabelRef = useRef<HTMLSpanElement>(null)
  const [datePanelLeft, setDatePanelLeft] = useState(0)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const trendActions = useTrendActions()
  const { data: cardStatus } = useCardStatus()
  // Angular sqf-filter selectedCardType — passed to the feedback popup as `header`
  const selectedCardType = detailsType ? cardStatus?.[detailsType]?.titleText || detailsType : undefined

  useEscapeToClose(dropdownOpen, () => setDropdownOpen(false))
  useEscapeToClose(datePickerOpen, () => setDatePickerOpen(false))
  useEscapeToClose(mobileMenuOpen, () => setMobileMenuOpen(false))

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Angular SqfLayoutComponent.onScroll → SqfCardsService.makeFilterSticky: while scrolling
  // down the sticky bar drops behind the content; scrolling up brings it back. DOM is
  // mutated directly so scrolling never re-renders. Also mirrors SqfFilterComponent.onScroll
  // closing the kebab menu.
  const filterBarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let prevScrollPos = window.pageYOffset
    const onScroll = () => {
      setMobileMenuOpen(false)
      const currentScrollPos = window.pageYOffset
      const bar = filterBarRef.current
      const minimalScroll = currentScrollPos > prevScrollPos && document.body.scrollHeight - window.innerHeight < 50
      if (bar && !minimalScroll) {
        const isMobile = window.innerWidth <= 768
        const canScroll = document.documentElement.scrollHeight > document.documentElement.clientHeight
        const step = isMobile ? 0 : bar.getBoundingClientRect().height
        if (canScroll && currentScrollPos > step && prevScrollPos <= currentScrollPos) {
          bar.style.zIndex = '-1'
        } else {
          bar.style.removeProperty('z-index')
        }
      }
      prevScrollPos = currentScrollPos
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const yesterday = getYesterdayDate()
  const minDate = formatDate(new Date(Date.now() - THIRTY_DAYS_MS))
  const maxDate = formatDate(yesterday)

  function handleNodeSelect(node: IQFTree) {
    setSelectedNode(node)
    setDropdownOpen(false)
  }

  return (
    <div ref={filterBarRef} className={styles.filterBar} data-testid="filter-bar">
      {/* Location selector */}
      <div className={styles.left}>
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={styles.dropdownTrigger}
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span className={`material-icons ${styles.locationIcon}`}>location_on</span>
            <span className={styles.locationText}>
              {selectedNode ? selectedNode.name : 'Loading...'}
            </span>
            <span className={`material-icons ${styles.caret}`}>keyboard_arrow_down</span>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu} role="listbox">
              <LocationTree onSelect={handleNodeSelect} />
            </div>
          )}
        </div>

        {/* Angular .qf-filter__date-group: period menu followed by the date picker */}
        {!hideDateFilter && (
          <div className={styles.dateGroup}>
            {showPeriod && (
              <FilterSelect<Period>
                ariaLabel="Reporting period"
                className={styles.hideXsm}
                label={activePeriod === 'YDAY' ? 'Day' : 'Week to Date'}
                value={activePeriod}
                options={[
                  { value: 'WTD', label: 'Week to Date' },
                  { value: 'YDAY', label: 'Day' },
                ]}
                onChange={handlePeriodChange}
              />
            )}

            {/* Date picker — custom month-grid dropdown matching Store Insights */}
            <div className={styles.dropdown} ref={datePickerRef}>
              <button
                type="button"
                className={`${styles.datePicker} ${!isLoaded ? styles.datePickerDisabled : ''}`}
                onClick={() => {
                  if (!isLoaded) return
                  // mat-datepicker anchors to the hidden input right after the date text,
                  // falling back to end-alignment when the panel would overflow the viewport
                  const wrap = datePickerRef.current?.getBoundingClientRect()
                  const label = dateLabelRef.current?.getBoundingClientRect()
                  if (wrap && label) {
                    const anchor = label.right - wrap.left
                    const preferred = wrap.left + anchor + DATE_PANEL_WIDTH > window.innerWidth ? anchor - DATE_PANEL_WIDTH : anchor
                    // CDK pushes the overlay back inside an 8px viewport margin
                    const min = 8 - wrap.left
                    const max = window.innerWidth - 8 - DATE_PANEL_WIDTH - wrap.left
                    setDatePanelLeft(Math.max(min, Math.min(preferred, max)))
                  }
                  setDatePickerOpen(o => !o)
                }}
                aria-expanded={datePickerOpen}
                aria-haspopup="dialog"
                disabled={!isLoaded}
              >
                <span className={`material-icons ${styles.dateIcon}`}>today</span>
                <span className={styles.dateLabel} ref={dateLabelRef}>
                  {selectedDate ? formatDisplayDate(selectedDate) : '—'}
                </span>
                <span className={`material-icons ${styles.caret} ${styles.dateCaret}`}>keyboard_arrow_down</span>
              </button>

              {datePickerOpen && (
                <DatePicker
                  selectedDate={selectedDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  style={{ left: datePanelLeft }}
                  period={activePeriod}
                  onPeriodChange={showPeriod ? handlePeriodChange : undefined}
                  onSelect={iso => {
                    setSelectedDate(iso)
                    setDatePickerOpen(false)
                  }}
                />
              )}
            </div>
          </div>
        )}

        {showAxis && (
          <FilterSelect<BreakdownAxis>
            ariaLabel="Breakdown"
            label={axisLabel}
            value={selectedBreakdownAxis}
            options={[
              { value: 'childLevel', label: childLevelLabel(selectedNode, user.portal) },
              { value: 'department', label: 'Departments' },
            ]}
            onChange={handleBreakdownAxisChange}
          />
        )}

        {detailsType && (
          <CardTypeDropdown
            selectedType={detailsType}
            apiDepth={selectedNode?.apiDepth ?? 0}
            className={styles.hideXsm}
          />
        )}
      </div>

      {/* Angular .qf-filter__right-section (hide-xsm): AI insights, subscription, feedback, download, print */}
      <div className={`${styles.right} ${styles.hideXsm}`}>
        {trendActions.aiInsightsEnabled && (
          <>
            <button
              type="button"
              className={`${styles.aiInsightsBtn} ${trendActions.aiInsightsOpen ? styles.aiInsightsBtnSelected : ''}`}
              onClick={trendActions.toggleAiInsights}
              aria-pressed={trendActions.aiInsightsOpen}
            >
              <span className={`material-icons ${styles.aiInsightsIcon}`}>auto_awesome</span>
              {trendActions.aiButtonText || 'AI Insights'}
            </button>
            <span className={styles.aiInsightsDivider} />
          </>
        )}
        {trendActions.subscriptionEnabled && (
          <button
            type="button"
            className={styles.iconBtn}
            title="Subscription preferences"
            aria-label="Subscription preferences"
            onClick={trendActions.openSubscription}
          >
            <span className="material-icons">mail_outline</span>
          </button>
        )}
        <button
          type="button"
          className={styles.iconBtn}
          title="Send feedback"
          aria-label="Send feedback"
          onClick={() => setFeedbackOpen(true)}
        >
          <span className="material-icons">forum</span>
        </button>
        {!isQuickAssistPage && (
          <button
            type="button"
            className={styles.iconBtn}
            title="Download"
            aria-label="Download"
            onClick={() => void preview('pdf')}
          >
            <span className="material-icons">play_for_work</span>
          </button>
        )}
        {!isQuickAssistPage && (
          <button
            type="button"
            className={styles.iconBtn}
            title="Print"
            aria-label="Print"
            onClick={() => void preview('print')}
          >
            <span className="material-icons">print</span>
          </button>
        )}
      </div>

      {/* Angular .qf-filter__option-menu (hide-sm): mobile more_vert menu */}
      <div className={`${styles.right} ${styles.hideSm}`} ref={mobileMenuRef}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(o => !o)}
        >
          <span className="material-icons">more_vert</span>
        </button>
        {mobileMenuOpen && (
          <div className={styles.mobileMenu} role="menu">
            {trendActions.subscriptionEnabled && (
              <button
                type="button"
                role="menuitem"
                className={styles.mobileMenuItem}
                onClick={() => { setMobileMenuOpen(false); trendActions.openSubscription() }}
              >
                <span className="material-icons">mail_outline</span>
                Subscription preferences
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={styles.mobileMenuItem}
              onClick={() => { setMobileMenuOpen(false); setFeedbackOpen(true) }}
            >
              <span className="material-icons">forum</span>
              Give Feedback
            </button>
          </div>
        )}
      </div>

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} header={selectedCardType} />
    </div>
  )
}
