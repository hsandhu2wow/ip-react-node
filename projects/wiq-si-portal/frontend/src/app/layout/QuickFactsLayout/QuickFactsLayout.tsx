// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUserDetails } from '../../../shared/api/users'
import { StellaProvider } from '../../../shared/context/StellaContext'
import { PageLoadedProvider } from '../../../shared/context/PageLoadedContext'
import { FilterProvider } from '../../../shared/context/FilterContext'
import { TrendActionsProvider } from '../../../features/trend/context/TrendActionsContext'
import { FilterBar } from '../FilterBar/FilterBar'
import { Footer } from '../Footer/Footer'
import { CardsPreviewProvider } from '../../../shared/components/PreviewDialog/CardsPreviewProvider'
import { AlertList } from '../AlertList/AlertList'
import { QuickFactsPageBar } from '../QuickFactsPageBar/QuickFactsPageBar'
import { QuickFactsAnalytics } from '../../RouteLifecycle/QuickFactsAnalytics'
import styles from './QuickFactsLayout.module.scss'

export function QuickFactsLayout() {
  const { data: user } = useQuery({ queryKey: ['user-details'], queryFn: getUserDetails, staleTime: Infinity })
  return (
    <FilterProvider>
      <QuickFactsAnalytics />
      <StellaProvider enabled={!!user?.is_stella_enabled}>
      <PageLoadedProvider>
      <TrendActionsProvider>
      <CardsPreviewProvider>
      <div className={styles.layout}>
        <QuickFactsPageBar />
        <FilterBar />
        {/* Angular #header-nav: filter, then app-alert-list */}
        <AlertList />
        <div className={styles.content}>
          <Outlet />
        </div>
        <Footer />
      </div>
      </CardsPreviewProvider>
      </TrendActionsProvider>
      </PageLoadedProvider>
      </StellaProvider>
    </FilterProvider>
  )
}
