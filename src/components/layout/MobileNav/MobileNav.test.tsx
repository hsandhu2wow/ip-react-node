import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import { MobileNav } from './MobileNav'

function renderNav(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <MobileNav />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('MobileNav', () => {
  it('renders app bar', () => {
    renderNav()
    expect(screen.getByTestId('mobile-appbar')).toBeTruthy()
  })

  it('shows "Quick Facts" title on /quick-facts', () => {
    renderNav('/quick-facts/summary')
    expect(screen.getByTestId('mobile-title').textContent).toBe('Quick Facts')
  })

  it('shows "Weekly" title on /weekly', () => {
    renderNav('/weekly')
    expect(screen.getByTestId('mobile-title').textContent).toBe('Weekly')
  })

  it('shows "Trend" title on /trend', () => {
    renderNav('/trend')
    expect(screen.getByTestId('mobile-title').textContent).toBe('Trend')
  })

  it('drawer is closed by default', () => {
    renderNav()
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('opens drawer when hamburger is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('false')
  })

  it('closes drawer when close button is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    fireEvent.click(screen.getByTestId('mobile-drawer-close'))
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('closes drawer when backdrop is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    fireEvent.click(screen.getByTestId('mobile-backdrop'))
    expect(document.querySelector('[data-testid="mobile-drawer"]')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders all nav groups', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))
    expect(screen.getByText('Buying')).toBeTruthy()
    expect(screen.getByText('Store')).toBeTruthy()
  })
})
