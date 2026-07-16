// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet, useLocation } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { PageBar } from '../../components/layout/PageBar/PageBar'
import { FilterBar } from '../../components/layout/FilterBar/FilterBar'
import styles from './QuickFactsLayout.module.css'

export function QuickFactsLayout() {
  const location = useLocation()
  const isDetails = location.pathname.includes('/details/')

  return (
    <FilterProvider>
      {/* When on details page, PageBar is hidden — zero out its height so FilterBar sticks correctly */}
      <div style={isDetails ? { '--page-bar-height': '0px' } as React.CSSProperties : undefined}>
        <PageBar />
        <FilterBar />
        <div className={styles.content}>
          <Outlet />
        </div>
        <footer className={styles.footer}>
          <span>Store Insights · Powered by Quick Facts</span>
        </footer>
      </div>
    </FilterProvider>
  )
}
