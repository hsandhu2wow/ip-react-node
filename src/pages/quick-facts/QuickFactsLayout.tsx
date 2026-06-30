// src/pages/quick-facts/QuickFactsLayout.tsx
import { Outlet } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { PageBar } from '../../components/layout/PageBar/PageBar'
import { FilterBar } from '../../components/layout/FilterBar/FilterBar'
import styles from './QuickFactsLayout.module.css'

export function QuickFactsLayout() {
  return (
    <FilterProvider>
      <PageBar />
      <FilterBar />
      <div className={styles.content}>
        <Outlet />
      </div>
      <footer className={styles.footer}>
        <span>Store Insights · Powered by Quick Facts</span>
      </footer>
    </FilterProvider>
  )
}
