// src/pages/quick-facts/DetailsPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useParams, Navigate, Link, useLocation } from 'react-router-dom'
import { useSeasonalCard } from '../../hooks/useSeasonalCard'
import { SeasonalDetailsCard } from '../../components/cards/SeasonalCard/SeasonalCard'
import { useDetailsCard } from '../../hooks/useDetailsCard'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useFilter } from '../../context/FilterContext'
import { DetailsCard } from '../../components/cards/DetailsCard/DetailsCard'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { usePeriodCards } from '../../hooks/usePeriodCards'
import { CardSidebar } from '../../components/cards/CardSidebar/CardSidebar'
import { useDataLoadETA } from '../../hooks/useDataLoadETA'
import { useSupportEmail } from '../../hooks/useSupportEmail'
import { stampCutOffTimes } from '../../utils/eta'
import { useCFCChildCodes } from '../../hooks/useCFCChildCodes'
import { getOrderedCardDropDown, isCFCNode } from '../../utils/cardDropdown'
import type { IQFTree, ISQFMetricCard, ISeasonalCard } from '../../types/sqf.types'
import { PreviewPageCards } from '../../components/shared/PreviewDialog/cardsPreviewContext'
import styles from './DetailsPage.module.css'
import { sendQFDataToAnalytics } from '../../utils/analytics'
import { NpsSurvey } from '../../components/shared/NpsSurvey/NpsSurvey'

type SortType = 'az' | 'za' | 'lowhigh' | 'highlow'

function sortCards<T extends ISQFMetricCard | ISeasonalCard>(cards: T[], sortType: SortType): T[] {
  const sorted = [...cards]
  const SKIP = ['UNK', 'REGIONEX', 'CLOSED']
  const title = (card: T) => 'type' in card ? card.level || '' : card.cardTitle || ''
  const value = (card: T) => 'type' in card ? parseFloat(String(card.infoMainNumberFull)) : card.sortByVal ?? parseFloat(String(card.infoNumbers?.[0]?.val ?? 0))
  const shouldSkip = (card: T) => SKIP.some(k => title(card).toUpperCase().includes(k))

  switch (sortType) {
    case 'az':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return title(a).localeCompare(title(b), undefined, { numeric: true, sensitivity: 'base' })
      })
    case 'za':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return title(b).localeCompare(title(a), undefined, { numeric: true, sensitivity: 'base' })
      })
    case 'lowhigh':
      return sorted.sort((a, b) => {
        const aVal = value(a)
        const bVal = value(b)
        return aVal - bVal
      })
    case 'highlow':
      return sorted.sort((a, b) => {
        const aVal = value(a)
        const bVal = value(b)
        return bVal - aVal
      })
  }
}

const SKELETON_COUNT = 9

// [type, menu label, button label once active] — mirrors Angular's menu items and SortTypes enum
const SORT_OPTIONS: [SortType, string, string][] = [
  ['az', 'A - Z', 'A - Z'],
  ['za', 'Z - A', 'Z - A'],
  ['highlow', 'High-Low', 'High - Low'],
  ['lowhigh', 'Low-High', 'Low - High'],
]

const API_SORT_TYPES: Record<string, SortType> = {
  AZ: 'az', ZA: 'za', LowHigh: 'lowhigh', HighLow: 'highlow',
  'A - Z': 'az', 'Z - A': 'za', 'Low - High': 'lowhigh', 'High - Low': 'highlow',
  az: 'az', za: 'za', lowhigh: 'lowhigh', highlow: 'highlow',
}

export function DetailsPage() {
  const { type } = useParams<{ type: string }>()
  const { isLoaded, selectedNode, treeNodes, setSelectedNode, selectedBreakdownAxis, selectedDate } = useFilter()
  const { search } = useLocation()
  const enrichedSummary = useEnrichedSummaryCards()
  const cardStatusQuery = useCardStatus()
  const seasonal = type === 'seasonal'
  const needsSeasonalCFC = !!(cardStatusQuery.data?.seasonal?.hide_cfc || cardStatusQuery.data?.seasonal?.show_only_cfc)
  const cfcQuery = useCFCChildCodes(needsSeasonalCFC)
  const seasonalSummaryQuery = useSeasonalCard(cardStatusQuery.data?.seasonal)
  const seasonalDetailsQuery = useSeasonalCard(cardStatusQuery.data?.seasonal, true, seasonal)
  const detailsQuery = useDetailsCard(seasonal ? undefined : type)
  const periodCards = usePeriodCards(detailsQuery.data)
  const etaQuery = useDataLoadETA()
  const supportEmail = useSupportEmail().data
  // Angular shows cards in API order with a "Sort Cards" label until the user picks a sort
  const [sortType, setSortType] = useState<SortType | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const activeCardsData = seasonal ? seasonalDetailsQuery.data : periodCards.cards
  // Angular reloads cards on every route/filter update, with Seasonal's level-specific default sort.
  useEffect(() => setSortType(null), [type, selectedNode?.code, selectedDate, activeCardsData])

  useEffect(() => {
    const first = seasonalDetailsQuery.data?.[0]
    if (seasonal && first && (first.error || first.cardLevel !== 'Department')) {
      sendQFDataToAnalytics('sortCardsQFDetailsCard', type, selectedNode?.code)
    }
  }, [seasonal, type, selectedNode?.code, seasonalDetailsQuery.data])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mirrors Angular sqf-details-home: redirect to summary when the card isn't in the ordered
  // details dropdown (unknown card, details disabled, or depth beyond details_last_level)
  const cardStatus = cardStatusQuery.data
  if (
    cardStatus &&
    type &&
    !(seasonal && needsSeasonalCFC && cfcQuery.isPending) &&
    (!cardStatus[type] ||
      (isLoaded && !getOrderedCardDropDown(cardStatus, selectedNode?.apiDepth ?? 0, isCFCNode(selectedNode, cfcQuery.data)).some(c => c.name === type)))
  ) {
    return <Navigate to={{ pathname: '/quick-facts/summary', search }} replace />
  }

  const cardConfig = cardStatus?.[type || '']
  const pageTitle = cardConfig?.titleText || type || ''
  const detailsStartLevel = cardConfig?.details_start_level ?? 0
  const detailsLastLevel = cardConfig?.details_last_level ?? 99
  const apiDepth = selectedNode?.apiDepth ?? 0

  const isLoading = !isLoaded || (seasonal ? seasonalDetailsQuery.isLoading : detailsQuery.isLoading)
  const raw: ISQFMetricCard[] = stampCutOffTimes(periodCards.cards, etaQuery.data, selectedDate)
  // Matches Angular's SqfCardsService.setupCommonProps(): only compute canDrillDown
  // when the API hasn't already supplied an explicit value.
  const enrichedRaw = raw.map(c => ({
    ...c,
    canDrillDown:
      c.canDrillDown !== undefined
        ? String(c.canDrillDown) === 'true'
        : detailsStartLevel <= apiDepth && apiDepth <= detailsLastLevel,
  }))
  const visibleCards = enrichedRaw.filter(c => !c.hidden)
  const seasonalVisible = (seasonalDetailsQuery.data || []).filter(c => !c.hidden)
  const firstSeasonal = seasonalDetailsQuery.data?.[0]
  const seasonalInitialSort = firstSeasonal && !firstSeasonal.error && firstSeasonal.cardLevel === 'Department' ? null
    : firstSeasonal && !firstSeasonal.error && firstSeasonal.cardLevel === 'State' ? 'za' : 'az'
  const activeSeasonalSort = sortType ?? seasonalInitialSort
  const cards = seasonal ? (activeSeasonalSort ? sortCards(seasonalVisible, activeSeasonalSort) : seasonalVisible)
    : sortType ? sortCards(visibleCards, sortType) : visibleCards
  const activatedSortType = seasonal ? activeSeasonalSort : sortType ?? API_SORT_TYPES[periodCards.sortBy ?? '']

  // Navigate to the child location matching the clicked card's drill-down code
  function handleDrillDown(code?: string) {
    if (!code) return
    const target = treeNodes.find(c => c.code === code)
    if (target) setSelectedNode(target)
  }

  // Breadcrumbs mirror Angular updateBreadcrumbs: selected node + non-hidden ancestors
  const breadcrumbs: IQFTree[] = []
  if (selectedNode) {
    breadcrumbs.push(selectedNode)
    let node = selectedNode.parent
    while (node) {
      if (!node.hidden) breadcrumbs.unshift(node)
      node = node.parent
    }
  }

  return (
    <main className={styles.page}>
      {/* sqf-details-home previewTriggered$: the displayed details cards */}
      {/* Angular sqf-summary/details-home ngOnInit: qfCardsService.showNPSSurvey() */}
      <NpsSurvey />
      <PreviewPageCards getCards={() => cards} />
      <div className={styles.layout}>
        {/* Left sidebar — card type navigation */}
        <CardSidebar
          cards={enrichedSummary.data}
          seasonalCard={seasonalSummaryQuery.data?.[0]}
          selectedType={type || ''}
          cardStatus={cardStatus}
          axis={selectedBreakdownAxis}
          supportEmail={supportEmail}
        />

        {/* Right column — detail cards */}
        <div className={styles.detailColumn}>
          <Link to={{ pathname: '/quick-facts/summary', search }} className={styles.backLink}>
            <span className={`material-icons ${styles.backIcon}`}>chevron_left</span>
            <span>Back to all cards</span>
          </Link>

          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>{pageTitle}</div>

            {/* Sort dropdown — matches Angular's "Sort Cards ≡" button */}
            <div className={styles.sortDropdownWrapper} ref={sortRef}>
              <button
                className={styles.sortDropdownBtn}
                onClick={() => setSortOpen(o => !o)}
                aria-expanded={sortOpen}
                aria-haspopup="listbox"
              >
                {/* mat-button projects mat-icon before the label */}
                <span className={`material-icons ${styles.sortIcon}`}>sort</span>
                {SORT_OPTIONS.find(([t]) => t === activatedSortType)?.[2] ?? 'Sort Cards'}
              </button>
              {sortOpen && (
                <div className={styles.sortDropdownMenu} role="listbox">
                  {SORT_OPTIONS.map(([t, label]) => (
                    <button
                      key={t}
                      className={`${styles.sortDropdownItem} ${t === activatedSortType ? styles.sortDropdownItemActive : ''}`}
                      disabled={t === activatedSortType}
                      role="option"
                      aria-selected={t === activatedSortType}
                      onClick={() => {
                        setSortType(t)
                        setSortOpen(false)
                        sendQFDataToAnalytics('sortCardsQFDetailsCard', type, selectedNode?.code)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {breadcrumbs.length > 1 && (
            <ul className={styles.breadcrumbs} aria-label="Breadcrumbs">
              {breadcrumbs.map((crumb, i) => {
                const active = i === breadcrumbs.length - 1
                return (
                  <li key={crumb.code ?? i} className={styles.breadcrumb}>
                    {active ? (
                      <span className={styles.breadcrumbActive}>{crumb.name}</span>
                    ) : (
                      <span
                        role="button"
                        tabIndex={0}
                        className={styles.breadcrumbLink}
                        onClick={() => setSelectedNode(crumb)}
                        onKeyDown={e => e.key === 'Enter' && setSelectedNode(crumb)}
                      >
                        {crumb.name}
                      </span>
                    )}
                    {!active && <span className={`material-icons ${styles.breadcrumbSep}`}>chevron_right</span>}
                  </li>
                )
              })}
            </ul>
          )}

          {(seasonal ? seasonalDetailsQuery.isError : detailsQuery.isError) && (
            <div className={styles.errorBanner}>
              Failed to load details. Please try again.
            </div>
          )}

          <div className={styles.cardList}>
            {isLoading
              ? Array.from({ length: seasonal ? 1 : SKELETON_COUNT }).map((_, i) => (
                  <div key={i} className={styles.cardSlot}>
                    {seasonal ? <SeasonalDetailsCard card={null} last /> : <DetailsCard isLoading />}
                  </div>
                ))
              : cards.map((card, i) => (
                  <div key={card.jsId ?? `${card.cardName}-${card.childCode ?? card.cardCode ?? card.cardTitle ?? i}`} className={styles.cardSlot}>
                    {'type' in card ? <SeasonalDetailsCard card={card} selectedNode={selectedNode} detailsLastLevel={detailsLastLevel} onDrillDown={handleDrillDown} supportEmail={supportEmail} last={i === cards.length - 1} /> : <DetailsCard
                      card={card}
                      selectedNode={selectedNode}
                      detailsLastLevel={detailsLastLevel}
                      onDrillDown={handleDrillDown}
                      axis={selectedBreakdownAxis}
                      supportEmail={supportEmail}
                    />}
                  </div>
                ))}
            {/* Angular sqf-details-card renders an (invisible) mat-divider.qf-card-divider after the last card;
                Seasonal cards render their own */}
            {!isLoading && cards.length > 0 && !('type' in cards[cards.length - 1]) && (
              <div className={`qf-card-divider ${styles.cardDivider}`} aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
