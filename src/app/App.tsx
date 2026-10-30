// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from '../shared/context/AuthContext'
import { AppShell } from './layout/AppShell/AppShell'
import { QuickFactsLayout } from './layout/QuickFactsLayout/QuickFactsLayout'
import { SummaryPage } from '../features/quick-facts/pages/SummaryPage'
import { DetailsPage } from '../features/quick-facts/pages/DetailsPage'
import { TrendPage } from '../features/trend/pages/TrendPage'
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
            <Route path="weekly" element={<TrendPage metric="weekly" />} />
            <Route path="myplan" element={<TrendPage metric="myPlan" />} />
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
