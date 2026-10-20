// src/context/AuthContext.tsx
import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface AuthUser {
  name: string
  portal: string
}

interface AuthContextType {
  user: AuthUser
  isAuthenticated: boolean
  logout: () => void
}

const STUB_USER: AuthUser = {
  name: 'Demo User',
  // Mirrors Angular environment.portal ('SI' in store-insights prod)
  portal: import.meta.env.VITE_PORTAL || 'SI',
}

const AuthContext = createContext<AuthContextType>({
  user: STUB_USER,
  isAuthenticated: true,
  logout: () => window.location.reload(),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  function logout() {
    // Phase 2: replace with real sign-out
    window.location.reload()
  }
  return (
    <AuthContext.Provider value={{ user: STUB_USER, isAuthenticated: true, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

/** Route guard — in Phase 1 always renders children */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <div>Please log in.</div>
  }
  return <>{children}</>
}
