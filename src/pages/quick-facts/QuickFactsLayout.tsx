// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { FilterBar } from '../../components/layout/FilterBar/FilterBar'
import styles from './QuickFactsLayout.module.css'

export function QuickFactsLayout() {
  return (
    <FilterProvider>
      {/* Top "Quick Facts" tab bar (PageBar) removed per request — FilterBar sticks to the top instead */}
      <div style={{ '--page-bar-height': '0px' } as React.CSSProperties}>
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
