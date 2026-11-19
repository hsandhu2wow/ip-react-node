import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useNavGroups } from '../useNavGroups'
import { fullAccessNavResult } from '../navTestFixture'
import { MobileNav } from './MobileNav'

vi.mock('../useNavGroups', () => ({ useNavGroups: vi.fn() }))

function PathProbe() {
  const { pathname } = useLocation()
  return <span data-testid="current-path">{pathname}</span>
}

function renderNav(path = '/quick-facts') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MobileNav />
      <PathProbe />
    </MemoryRouter>,
  )
}

function linkFor(path: string): HTMLAnchorElement {
  const drawer = within(screen.getByTestId('mobile-drawer'))
  const link = drawer.getAllByRole('link').find(item => item.getAttribute('href') === path)
  if (!link) throw new Error(`Missing mobile navigation link for ${path}`)
  return link as HTMLAnchorElement
}

describe('MobileNav', () => {
  let originalOverflow: string

  beforeEach(() => {
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = ''
    localStorage.clear()
    vi.mocked(useNavGroups).mockReturnValue(fullAccessNavResult)
  })

  afterEach(() => {
    document.body.style.overflow = originalOverflow
  })

  it('renders the active top-level title for Quick Facts pages', () => {
    renderNav('/quick-facts/weekly')

    expect(screen.getByTestId('mobile-title')).toHaveTextContent('My Insights')
  })

  it.each([
    ['/dashboards/app/store', 'Dashboards'],
    ['/bqf/summary', 'Buying Quick Facts'],
    ['/price-simulator/simulations', 'Pricing Simulator'],
    ['/act', 'Availability Navigator'],
    ['/admin', 'Admin'],
    ['/help', 'Help'],
  ])('shows the %s top-level title on its route', (path, title) => {
    renderNav(path)

    expect(screen.getByTestId('mobile-title')).toHaveTextContent(title)
  })

  it('uses the fetched profile and opens the account sheet', () => {
    renderNav()

    expect(screen.getByRole('button', { name: 'User menu' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'User menu' }))

    expect(screen.getByRole('dialog', { name: 'User menu' })).toBeInTheDocument()
    expect(screen.getByText('Alex Example')).toBeInTheDocument()
    expect(screen.queryByText('Demo User')).not.toBeInTheDocument()
  })

  it('keeps Dashboard search visual-only', () => {
    renderNav('/dashboards')
    const search = screen.getByRole('searchbox', { name: 'Search Dashboards' })

    fireEvent.change(search, { target: { value: 'weekly sales' } })
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(screen.getByTestId('current-path')).toHaveTextContent('/dashboards')
    expect(search).toHaveValue('weekly sales')
  })

  it('opens a grouped drawer with feature links and independent New and Soon badges', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))

    const drawer = within(screen.getByTestId('mobile-drawer'))
    expect(drawer.getByText('Buying')).toBeInTheDocument()
    expect(drawer.getByText('Store')).toBeInTheDocument()
    expect(linkFor('/quick-facts/quick-assist')).toHaveTextContent('New!')
    expect(linkFor('/quick-facts/quick-assist')).toHaveTextContent('Soon')
    expect(drawer.getAllByText('Dashboards')).toHaveLength(2)
    expect(screen.getByTestId('mobile-menu-btn')).toHaveAttribute('aria-expanded', 'true')
  })

  it('marks only Trend active on its Quick Facts routes', () => {
    renderNav('/quick-facts/weekly')
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))

    expect(linkFor('/quick-facts/weekly').className).toContain('drawerItemActive')
    expect(linkFor('/quick-facts').className).not.toContain('drawerItemActive')
  })

  it('closes the drawer on route selection and restores scroll and focus', () => {
    document.body.style.overflow = 'scroll'
    renderNav()
    const menuButton = screen.getByTestId('mobile-menu-btn')

    fireEvent.click(menuButton)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(linkFor('/quick-facts/weekly'))

    expect(screen.getByTestId('current-path')).toHaveTextContent('/quick-facts/weekly')
    expect(screen.getByTestId('mobile-drawer')).toHaveAttribute('aria-hidden', 'true')
    expect(document.body.style.overflow).toBe('scroll')
    expect(menuButton).toHaveFocus()
  })

  it('restores body scrolling when the drawer unmounts', () => {
    document.body.style.overflow = 'scroll'
    const { unmount } = renderNav()
    fireEvent.click(screen.getByTestId('mobile-menu-btn'))

    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('closes the drawer on Escape, backdrop and close button', () => {
    renderNav()
    const menuButton = screen.getByTestId('mobile-menu-btn')

    fireEvent.click(menuButton)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('mobile-drawer')).toHaveAttribute('aria-hidden', 'true')
    expect(menuButton).toHaveFocus()

    fireEvent.click(menuButton)
    fireEvent.click(screen.getByTestId('mobile-backdrop'))
    expect(screen.getByTestId('mobile-drawer')).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(menuButton)
    fireEvent.click(screen.getByTestId('mobile-drawer-close'))
    expect(screen.getByTestId('mobile-drawer')).toHaveAttribute('aria-hidden', 'true')
  })

  it('restores account focus and body scrolling when the account sheet closes', () => {
    document.body.style.overflow = 'scroll'
    renderNav()
    const accountButton = screen.getByRole('button', { name: 'User menu' })

    fireEvent.click(accountButton)
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'User menu' })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('scroll')
    expect(accountButton).toHaveFocus()
  })
})
