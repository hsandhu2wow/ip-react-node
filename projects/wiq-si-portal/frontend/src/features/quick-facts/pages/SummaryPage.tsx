// src/pages/quick-facts/SummaryPage.tsx
import { useRef, type ReactNode } from 'react'
import { useEqualCardHeights } from '../hooks/useEqualCardHeights'
import { useSeasonalCard } from '../hooks/useSeasonalCard'
import { SeasonalSummaryCard } from '../components/SeasonalCard/SeasonalCard'
import { useEnrichedSummaryCards } from '../hooks/useEnrichedSummaryCards'
import { useFilter } from '../../../shared/context/FilterContext'
import { useAuth } from '../../../shared/context/AuthContext'
import { useSupportEmail } from '../hooks/useSupportEmail'
import { SummaryCard } from '../components/SummaryCard/SummaryCard'
import type { ISeasonalCard, ISQFMetricCard } from '../../../shared/types/sqf.types'
import { orderSummaryCards } from '../utils/cardOrder'
import { PreviewPageCards } from '../../../shared/components/PreviewDialog/cardsPreviewContext'
import styles from './SummaryPage.module.scss'
import { NpsSurvey } from '../../../shared/components/NpsSurvey/NpsSurvey'
import { useQuery } from '@tanstack/react-query'
import { getStoreProfileCard } from '../api/storeProfile'
import { ProfileCard } from '../components/ProfileCard/ProfileCard'
import { StellaPanel } from '../../../shared/components/StellaPanel/StellaPanel'
import { useNotifyPageLoaded } from '../../../shared/context/PageLoadedContext'
import { TitleWidget } from '../components/TitleWidget/TitleWidget'

export function SummaryPage() {
  const { isLoaded, selectedBreakdownAxis, selectedNode } = useFilter()
  const { user } = useAuth()
  // Mirrors Angular SqfLayoutComponent.getPageTitle / getPoweredByText
  const isSI = ['SI', 'METRO'].includes(user.portal)
  const enrichedQuery = useEnrichedSummaryCards()
  const gridRef = useRef<HTMLDivElement>(null)
  useEqualCardHeights(gridRef)
  const supportEmail = useSupportEmail().data

  const isLoading = !isLoaded || enrichedQuery.isLoading
  const cardStatus = enrichedQuery.cardStatus
  const cards: ISQFMetricCard[] = enrichedQuery.data
  const seasonalQuery = useSeasonalCard(cardStatus.seasonal)
  const seasonalCard = seasonalQuery.data?.[0]
  // Angular sqf-summary-home notifies once the summary request settles (success or error)
  // and the seasonal matrix, when configured, has loaded
  useNotifyPageLoaded(!isLoading && !seasonalQuery.isLoading)
  const showSeasonalCard = !!cardStatus.seasonal?.summary && !!seasonalCard && !seasonalCard.hidden

  // Angular sqf-summary-home: store profile card for METRO/PEL at Store level
  const showProfileCard = ['METRO', 'PEL'].includes(user.portal) && selectedNode?.level_desc === 'Store'
  const profileQuery = useQuery({
    queryKey: ['sqf', 'storeProfile', selectedNode?.code],
    queryFn: () => getStoreProfileCard({ code: selectedNode!.code, name: selectedNode!.name }),
    enabled: isLoaded && showProfileCard,
    staleTime: 0,
  })

  const renderCard = (card: ISQFMetricCard) => (
    <div key={card.cardName} className="metric-card-slot">
      <SummaryCard card={card} axis={selectedBreakdownAxis} supportEmail={supportEmail} />
    </div>
  )

  type Slot = { node: ReactNode; card?: ISQFMetricCard | ISeasonalCard }
  const slots = orderSummaryCards<Slot>(
    cardStatus,
    cards.filter(c => !c.hidden).map(card => ({ name: card.cardName, value: { node: renderCard(card), card } })),
    [
      ...(showSeasonalCard
        ? [{ name: 'seasonal', value: { card: seasonalCard, node: <div key="seasonal" className="metric-card-slot"><SeasonalSummaryCard card={seasonalCard} supportEmail={supportEmail} /></div> } }]
        : []),
      ...(showProfileCard
        ? [{ name: 'profileCard', value: { node: (
            <div key="profileCard" className="metric-card-slot">
              <ProfileCard card={profileQuery.data ?? null} storeCode={selectedNode!.code} supportEmail={supportEmail} />
            </div>
          ) } }]
        : []),
    ],
  )
  // The profile card is not part of the page export (Angular previewTriggered$)
  const previewCards = slots.flatMap(slot => (slot.card ? [slot.card] : []))

  // Show skeleton cards while loading (show 6 placeholders)
  const SKELETON_COUNT = 6

  return (
    <main className={styles.page}>
      {/* sqf-summary-home previewTriggered$: the rendered cards, in rendered order */}
      {/* Angular sqf-summary/details-home ngOnInit: qfCardsService.showNPSSurvey() */}
      <NpsSurvey />
      <PreviewPageCards getCards={() => previewCards.filter(card => card.jsId && document.getElementById(card.jsId))} />
      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>
          <span className={styles.pageTitleLabel}>{isSI ? 'Daily' : 'Quick Facts'}</span>
          {isSI && (
            <>
              <span className={styles.pageTitleDot}>·</span>
              <span className={styles.pageTitleSub}>powered by Quick Facts</span>
            </>
          )}
        </h1>
        <TitleWidget card={enrichedQuery.widgetCard} />
      </div>

      {/* Angular sqf-summary-home: app-ai-insights-panel wraps .qf-home */}
      <StellaPanel>
      <div className={styles.content}>
        {enrichedQuery.isError && (
          <div className={styles.errorBanner}>
            Failed to load metrics. Please try again.
          </div>
        )}

        <div className="card-grid" ref={gridRef}>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} className="metric-card-slot">
                  <SummaryCard isLoading />
                </div>
              ))
            : slots.map(slot => slot.node)}
        </div>
      </div>
      </StellaPanel>
    </main>
  )
}
