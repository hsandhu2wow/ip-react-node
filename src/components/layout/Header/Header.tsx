// src/components/layout/Header/Header.tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import styles from './Header.module.css'

export function Header() {
  const { user } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Logo placeholder — replace with actual logo in production */}
        <span className={styles.logo} aria-label="Store Insights">🍀</span>
        <nav className={styles.nav}>
          <NavLink
            to="/quick-facts"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            Quick Facts
          </NavLink>
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.user}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
