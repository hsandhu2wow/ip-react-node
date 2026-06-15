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
}

// Phase 1 stub: hardcoded authenticated user.
// Replace with real OAuth/Firebase auth in Phase 2.
const STUB_USER: AuthUser = {
  name: 'Demo User',
  portal: 'WW', // Woolworths
}

const AuthContext = createContext<AuthContextType>({
  user: STUB_USER,
  isAuthenticated: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: STUB_USER, isAuthenticated: true }}>
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
    // Phase 2: replace with <Navigate to="/login" />
    return <div>Please log in.</div>
  }
  return <>{children}</>
}
