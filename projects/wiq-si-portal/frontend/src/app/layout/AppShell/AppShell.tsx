import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SideNav } from '../SideNav/SideNav'
import { MobileNav } from '../MobileNav/MobileNav'
import styles from './AppShell.module.scss'

interface Props {
  children: ReactNode
}

export function AppShell({ children }: Props) {
  const { pathname } = useLocation()
  const isTrend = /^\/quick-facts\/(weekly|myplan)\/?$/.test(pathname)
  return (
    <div className={styles.shell}>
      <SideNav />
      <MobileNav />
      <div className={`${styles.main} ${isTrend ? styles.trend : ''}`}>
        {children}
      </div>
    </div>
  )
}
