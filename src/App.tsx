// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { AppShell } from './components/layout/AppShell/AppShell'
import { QuickFactsLayout } from './pages/quick-facts/QuickFactsLayout'
import { SummaryPage } from './pages/quick-facts/SummaryPage'
import { DetailsPage } from './pages/quick-facts/DetailsPage'
import { ComingSoon } from './pages/coming-soon/ComingSoon'

export default function App() {
  return (
    <AuthProvider>
      <AppShell>
        <Routes>
          <Route
            path="/quick-facts"
            element={
              <ProtectedRoute>
                <QuickFactsLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="summary" replace />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="details/:type" element={<DetailsPage />} />
          </Route>

          <Route path="/weekly" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/trend" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/dashboards" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/pricing-simulator" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
          <Route path="/availability-navigator" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/quick-facts" replace />} />
        </Routes>
      </AppShell>
    </AuthProvider>
  )
}
