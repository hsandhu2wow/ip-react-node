// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import { QuickFactsLayout } from './pages/quick-facts/QuickFactsLayout'
import { SummaryPage } from './pages/quick-facts/SummaryPage'
import { DetailsPage } from './pages/quick-facts/DetailsPage'

export default function App() {
  return (
    <AuthProvider>
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
        {/* Catch-all: redirect to quick-facts */}
        <Route path="*" element={<Navigate to="/quick-facts" replace />} />
      </Routes>
    </AuthProvider>
  )
}
