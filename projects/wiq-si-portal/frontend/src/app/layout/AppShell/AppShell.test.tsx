import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../shared/context/AuthContext'
import { AppShell } from './AppShell'

vi.mock('../useNavGroups', async () => {
  const { fullAccessNavGroups } = await import('../navTestFixture')
  return { useNavGroups: () => fullAccessNavGroups }
})

function renderShell(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppShell>
          <div data-testid="content">Hello</div>
        </AppShell>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('AppShell', () => {
  it('renders children', () => {
    renderShell()
    expect(screen.getByTestId('content')).toBeTruthy()
  })

  it('renders SideNav', () => {
    renderShell()
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy()
  })

  it('renders MobileNav app bar', () => {
    renderShell()
    expect(screen.getByTestId('mobile-appbar')).toBeTruthy()
  })
})
