// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { FilterProvider } from '../../../shared/context/FilterContext'
import { TrendActionsProvider } from '../../../features/trend/context/TrendActionsContext'
import { FilterBar } from '../FilterBar/FilterBar'
import { Footer } from '../Footer/Footer'
import { CardsPreviewProvider } from '../../../shared/components/PreviewDialog/CardsPreviewProvider'
import { TrendBanner } from '../../../features/trend/components/TrendBanner'
import styles from './QuickFactsLayout.module.scss'

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
