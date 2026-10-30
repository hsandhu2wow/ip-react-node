// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { TrendActionsProvider } from '../../context/TrendActionsContext'
import { FilterBar } from '../../components/layout/FilterBar/FilterBar'
import { Footer } from '../../components/layout/Footer/Footer'
import { CardsPreviewProvider } from '../../components/shared/PreviewDialog/CardsPreviewProvider'
import { TrendBanner } from '../../components/trend/TrendBanner'
import styles from './QuickFactsLayout.module.css'

export function QuickFactsLayout() {
  return (
    <FilterProvider>
      <TrendActionsProvider>
      <CardsPreviewProvider>
      {/* Top "Quick Facts" tab bar (PageBar) removed per request — FilterBar sticks to the top instead */}
      <div style={{ '--page-bar-height': '0px' } as React.CSSProperties}>
        <FilterBar />
        <TrendBanner />
        <div className={styles.content}>
          <Outlet />
        </div>
        <Footer />
      </div>
      </CardsPreviewProvider>
      </TrendActionsProvider>
    </FilterProvider>
  )
}
