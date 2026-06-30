import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ComingSoon } from './ComingSoon'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<ComingSoon />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ComingSoon', () => {
  it('renders heading', () => {
    renderAt('/weekly')
    expect(screen.getByText('Coming Soon')).toBeDefined()
  })

  it('renders subtext', () => {
    renderAt('/weekly')
    expect(screen.getByText(/currently in development/i)).toBeDefined()
  })

  it('renders route name badge for /weekly', () => {
    renderAt('/weekly')
    expect(screen.getByTestId('coming-soon-badge').textContent).toBe('weekly')
  })

  it('renders route name badge for /dashboards', () => {
    renderAt('/dashboards')
    expect(screen.getByTestId('coming-soon-badge').textContent).toBe('dashboards')
  })
})
