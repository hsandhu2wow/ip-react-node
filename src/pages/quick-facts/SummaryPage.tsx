// src/pages/quick-facts/SummaryPage.tsx
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { useFilter } from '../../context/FilterContext'
import { SummaryCard } from '../../components/cards/SummaryCard/SummaryCard'
import type { ISQFMetricCard } from '../../types/sqf.types'
import styles from './SummaryPage.module.css'

export function SummaryPage() {
  const { isLoaded, selectedNode } = useFilter()
  const enrichedQuery = useEnrichedSummaryCards()

  const isLoading = !isLoaded || enrichedQuery.isLoading
  const cardStatus = enrichedQuery.cardStatus
  const cards: ISQFMetricCard[] = enrichedQuery.data

  // Sort by sequence number from card status config, then by card.seq
  const sortedCards = [...cards]
    .filter(c => !c.hidden)
    .sort((a, b) => {
      const seqA = a.seq ?? (cardStatus[a.cardName]?.sequence ?? 999)
      const seqB = b.seq ?? (cardStatus[b.cardName]?.sequence ?? 999)
      return seqA - seqB
    })

  // Show skeleton cards while loading (show 6 placeholders)
  const SKELETON_COUNT = 6

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <span className={styles.pageTitleLabel}>Quick Facts</span>
        {selectedNode && (
          <>
            <span className={styles.pageTitleDot}>·</span>
            <span className={styles.pageTitleSub}>{selectedNode.name}</span>
          </>
        )}
      </div>

      {enrichedQuery.isError && (
        <div className={styles.errorBanner}>
          Failed to load metrics. Please try again.
        </div>
      )}

      <div className="card-grid">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="metric-card-slot">
                <SummaryCard isLoading />
              </div>
            ))
          : sortedCards.map(card => (
              <div key={card.cardName} className="metric-card-slot">
                <SummaryCard card={card} />
              </div>
            ))}
      </div>
    </main>
  )
}
