// src/pages/quick-facts/DetailsPage.tsx
import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useDetailsCard } from '../../hooks/useDetailsCard'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useFilter } from '../../context/FilterContext'
import { DetailsCard } from '../../components/cards/DetailsCard/DetailsCard'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { CardSidebar } from '../../components/cards/CardSidebar/CardSidebar'
import type { ISQFMetricCard } from '../../types/sqf.types'
import styles from './DetailsPage.module.css'

type SortType = 'az' | 'za' | 'lowhigh' | 'highlow'

function sortCards(cards: ISQFMetricCard[], sortType: SortType): ISQFMetricCard[] {
  const sorted = [...cards]
  const SKIP = ['UNK', 'REGIONEX', 'CLOSED']
  const shouldSkip = (card: ISQFMetricCard) =>
    SKIP.some(k => (card.cardTitle || '').toUpperCase().includes(k))

  switch (sortType) {
    case 'az':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return (a.cardTitle || '').localeCompare(b.cardTitle || '', undefined, { numeric: true })
      })
    case 'za':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return (b.cardTitle || '').localeCompare(a.cardTitle || '', undefined, { numeric: true })
      })
    case 'lowhigh':
      return sorted.sort((a, b) => {
        const aVal = a.sortByVal ?? parseFloat(String(a.infoNumbers?.[0]?.val ?? 0))
        const bVal = b.sortByVal ?? parseFloat(String(b.infoNumbers?.[0]?.val ?? 0))
        return aVal - bVal
      })
    case 'highlow':
      return sorted.sort((a, b) => {
        const aVal = a.sortByVal ?? parseFloat(String(a.infoNumbers?.[0]?.val ?? 0))
        const bVal = b.sortByVal ?? parseFloat(String(b.infoNumbers?.[0]?.val ?? 0))
        return bVal - aVal
      })
  }
}

const SKELETON_COUNT = 9

export function DetailsPage() {
  const { type } = useParams<{ type: string }>()
  const { isLoaded, selectedNode } = useFilter()
  const enrichedSummary = useEnrichedSummaryCards()
  const cardStatusQuery = useCardStatus()
  const detailsQuery = useDetailsCard(type)
  const [sortType, setSortType] = useState<SortType>('az')

  // If card type doesn't exist in available cards, redirect to summary
  const cardStatus = cardStatusQuery.data
  if (cardStatus && type && !cardStatus[type]) {
    return <Navigate to="/quick-facts/summary" replace />
  }

  const isLoading = !isLoaded || detailsQuery.isLoading
  const raw: ISQFMetricCard[] = detailsQuery.data || []
  const cards = sortCards(raw.filter(c => !c.hidden), sortType)

  const cardConfig = cardStatus?.[type || '']
  const pageTitle = cardConfig?.titleText || type || ''
  const detailsLastLevel = cardConfig?.details_last_level ?? 99

  // Build breadcrumb path from selected node
  const breadcrumbs: string[] = []
  let node = selectedNode
  while (node) {
    if (!node.hidden && !node.alwaysHidden) breadcrumbs.unshift(node.name)
    node = node.parent || null
  }

  return (
    <main className={styles.page}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className={styles.breadcrumb}>
              {i > 0 && <span className={styles.breadcrumbSep}> › </span>}
              {crumb}
            </span>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        {/* Left sidebar — card type navigation */}
        <CardSidebar
          cards={enrichedSummary.data}
          selectedType={type || ''}
        />

        {/* Right column — detail cards */}
        <div className={styles.detailColumn}>
          <Link to="/quick-facts/summary" className={styles.backLink}>
            ← Back to all cards
          </Link>

          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>{pageTitle}</div>

            {/* Sort controls */}
            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>Sort:</span>
              {([
                ['az', 'A → Z'],
                ['za', 'Z → A'],
                ['lowhigh', 'Low → High'],
                ['highlow', 'High → Low'],
              ] as [SortType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  className={`${styles.sortBtn} ${sortType === type ? styles.sortBtnActive : ''}`}
                  onClick={() => setSortType(type)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {detailsQuery.isError && (
            <div className={styles.errorBanner}>
              Failed to load details. Please try again.
            </div>
          )}

          <div>
            {isLoading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div key={i} style={{ marginBottom: 24 }}>
                    <DetailsCard isLoading />
                  </div>
                ))
              : cards.map((card, i) => (
                  <DetailsCard
                    key={card.cardName + i}
                    card={card}
                    selectedNode={selectedNode}
                    detailsLastLevel={detailsLastLevel}
                  />
                ))}
          </div>
        </div>
      </div>
    </main>
  )
}
