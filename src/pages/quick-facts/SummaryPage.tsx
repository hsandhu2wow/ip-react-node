// src/pages/quick-facts/SummaryPage.tsx
import { useRef } from 'react'
import { useEqualCardHeights } from '../../hooks/useEqualCardHeights'
import { useSeasonalCard } from '../../hooks/useSeasonalCard'
import { SeasonalSummaryCard } from '../../components/cards/SeasonalCard/SeasonalCard'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { useFilter } from '../../context/FilterContext'
import { useAuth } from '../../context/AuthContext'
import { useSupportEmail } from '../../hooks/useSupportEmail'
import { SummaryCard } from '../../components/cards/SummaryCard/SummaryCard'
import type { ISQFMetricCard } from '../../types/sqf.types'
import { PreviewPageCards } from '../../components/shared/PreviewDialog/cardsPreviewContext'
import styles from './SummaryPage.module.css'
import { NpsSurvey } from '../../components/shared/NpsSurvey/NpsSurvey'
import { useQuery } from '@tanstack/react-query'
import { getStoreProfileCard } from '../../api/storeProfile'
import { ProfileCard } from '../../components/cards/ProfileCard/ProfileCard'

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
  const seasonalCard = useSeasonalCard(cardStatus.seasonal).data?.[0]
  const showSeasonalCard = !!cardStatus.seasonal?.summary && !!seasonalCard && !seasonalCard.hidden
  const seasonalSeq = cardStatus.seasonal?.sequence || 100

  // Sort by sequence number from card status config, then by card.seq
  const sortedCards = [...cards]
    .filter(c => !c.hidden)
    .sort((a, b) => {
      const seqA = a.seq ?? (cardStatus[a.cardName]?.sequence ?? 999)
      const seqB = b.seq ?? (cardStatus[b.cardName]?.sequence ?? 999)
      return seqA - seqB
    })

  // Angular sqf-summary-home: store profile card for METRO/PEL at Store level
  const showProfileCard = ['METRO', 'PEL'].includes(user.portal) && selectedNode?.level_desc === 'Store'
  const profileQuery = useQuery({
    queryKey: ['sqf', 'storeProfile', selectedNode?.code],
    queryFn: () => getStoreProfileCard({ code: selectedNode!.code, name: selectedNode!.name }),
    enabled: isLoaded && showProfileCard,
    staleTime: 0,
  })
  // [style.order]="getCardSequence('profileCard')" — ties keep DOM order (after generic cards)
  const profileSeq = cardStatus.profileCard?.sequence || 100
  const cardSeq = (c: ISQFMetricCard) => c.seq ?? (cardStatus[c.cardName]?.sequence ?? 999)
  const seasonalIndex = sortedCards.filter(c => cardSeq(c) <= seasonalSeq).length
  const profileIndex = sortedCards.filter(c => cardSeq(c) <= profileSeq).length + (showSeasonalCard && seasonalSeq <= profileSeq ? 1 : 0)
  const profileSlot = showProfileCard && (
    <div key="profileCard" className="metric-card-slot">
      <ProfileCard card={profileQuery.data ?? null} storeCode={selectedNode!.code} supportEmail={supportEmail} />
    </div>
  )

  const renderCard = (card: ISQFMetricCard) => (
    <div key={card.cardName} className="metric-card-slot">
      <SummaryCard card={card} axis={selectedBreakdownAxis} supportEmail={supportEmail} />
    </div>
  )

  const summarySlots = sortedCards.map(renderCard)
  const previewCards = [...sortedCards] as Array<ISQFMetricCard | NonNullable<typeof seasonalCard>>
  if (showSeasonalCard) {
    summarySlots.splice(seasonalIndex, 0, <div key="seasonal" className="metric-card-slot"><SeasonalSummaryCard card={seasonalCard} supportEmail={supportEmail} /></div>)
    previewCards.splice(seasonalIndex, 0, seasonalCard)
  }

  // Show skeleton cards while loading (show 6 placeholders)
  const SKELETON_COUNT = 6

  return (
    <main className={styles.page}>
      {/* sqf-summary-home previewTriggered$: the rendered cards, in rendered order */}
      {/* Angular sqf-summary/details-home ngOnInit: qfCardsService.showNPSSurvey() */}
      <NpsSurvey />
      <PreviewPageCards getCards={() => previewCards.filter(card => card.jsId && document.getElementById(card.jsId))} />
      <h1 className={styles.pageTitle}>
        <span className={styles.pageTitleLabel}>{isSI ? 'Daily' : 'Quick Facts'}</span>
        {isSI && (
          <>
            <span className={styles.pageTitleDot}>·</span>
            <span className={styles.pageTitleSub}>powered by Quick Facts</span>
          </>
        )}
      </h1>

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
            : [
                ...summarySlots.slice(0, profileIndex),
                profileSlot,
                ...summarySlots.slice(profileIndex),
              ]}
        </div>
      </div>
    </main>
  )
}
