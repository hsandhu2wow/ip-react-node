import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../shared/context/AuthContext'
import { SideNav } from './SideNav'

function renderNav(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <SideNav />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('SideNav', () => {
  it('renders all four nav items', () => {
    renderNav()
    expect(screen.getByText('Daily')).toBeTruthy()
    expect(screen.getByText('Weekly')).toBeTruthy()
    expect(screen.getByText('Trend')).toBeTruthy()
    expect(screen.getByText('Dashboards')).toBeTruthy()
  })

  it('marks Daily as active on /quick-facts', () => {
    renderNav('/quick-facts/summary')
    const daily = screen.getByText('Daily').closest('a')
    expect(daily?.dataset.active).toBe('true')
  })

  it('does not mark Weekly as active on /quick-facts', () => {
    renderNav('/quick-facts/summary')
    const weekly = screen.getByText('Weekly').closest('a')
    expect(weekly?.dataset.active).not.toBe('true')
  })

  it('marks Weekly as active on /weekly', () => {
    renderNav('/weekly')
    const weekly = screen.getByText('Weekly').closest('a')
    expect(weekly?.dataset.active).toBe('true')
  })

  it('marks Trend as active on /quick-facts/weekly and not Daily', () => {
    renderNav('/quick-facts/weekly')
    const trend = screen.getByText('Trend').closest('a')
    const daily = screen.getByText('Daily').closest('a')
    expect(trend?.dataset.active).toBe('true')
    expect(daily?.dataset.active).not.toBe('true')
  })

  it('marks Trend as active on /quick-facts/myplan and not Daily', () => {
    renderNav('/quick-facts/myplan')
    const trend = screen.getByText('Trend').closest('a')
    const daily = screen.getByText('Daily').closest('a')
    expect(trend?.dataset.active).toBe('true')
    expect(daily?.dataset.active).not.toBe('true')
  })

  it('renders user name from AuthContext', () => {
    renderNav()
    expect(screen.getByText('Demo User')).toBeTruthy()
  })

  it('shows user menu when user row is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    expect(screen.getByText('Log out')).toBeTruthy()
  })

  it('closes user menu when clicking outside', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    expect(screen.getByText('Log out')).toBeTruthy()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Log out')).toBeNull()
  })
})
