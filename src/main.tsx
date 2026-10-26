// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'
import App from './App.tsx'
import { SnackbarProvider } from './components/shared/Snackbar/Snackbar'
import { applyThemeAssets } from './config/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
})

applyThemeAssets()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <App />
        </SnackbarProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
