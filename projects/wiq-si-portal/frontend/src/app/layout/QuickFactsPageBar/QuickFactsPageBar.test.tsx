import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { IUserDetails } from '../../../shared/api/users'
import { buildNavGroups } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import { fullAccessNavResult, fullAccessUser } from '../navTestFixture'
import { QuickFactsPageBar } from './QuickFactsPageBar'

vi.mock('../useNavGroups', () => ({ useNavGroups: vi.fn() }))

function resultFor(user: IUserDetails, isCfc: boolean, portal: string, segregation: boolean) {
  return {
    groups: buildNavGroups(user, isCfc, portal, segregation),
    user,
    isCfc,
    dashboardSettingsError: false,
  }
}

function renderPageBar(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QuickFactsPageBar />
    </MemoryRouter>,
  )
}

function linkFor(path: string): HTMLAnchorElement {
  const link = screen.getAllByRole('link').find(item => item.getAttribute('href') === path)
  if (!link) throw new Error(`Missing page-bar link for ${path}`)
  return link as HTMLAnchorElement
}

describe('QuickFactsPageBar', () => {
  beforeEach(() => {
    vi.mocked(useNavGroups).mockReturnValue(fullAccessNavResult)
  })

  it('renders only the store insight tabs with the SI labels', () => {
    renderPageBar('/quick-facts/summary')

    expect(screen.getByRole('navigation', { name: 'Quick Facts navigation' })).toBeInTheDocument()
    expect(linkFor('/quick-facts')).toHaveAttribute('aria-label', 'Daily New!')
    expect(linkFor('/quick-facts/quick-assist')).toHaveAttribute('aria-label', 'Weekly New!')
    expect(linkFor('/quick-facts/weekly')).toHaveAttribute('aria-label', 'Trend New!')
    expect(screen.getAllByText('New!')).toHaveLength(3)
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it.each([
    ['/quick-facts/summary?code=fixture-state', '/quick-facts', 'true'],
    ['/quick-facts/details/sales?code=fixture-state', '/quick-facts', 'true'],
    ['/quick-facts/quick-assist?code=fixture-state', '/quick-facts/quick-assist', 'true'],
    ['/quick-facts/weekly?code=fixture-state', '/quick-facts/weekly', 'true'],
    ['/quick-facts/myplan?code=fixture-state', '/quick-facts/myplan', 'true'],
  ])('preserves selected code and marks the active tab on %s', (route, activePath) => {
    renderPageBar(route)

    expect(linkFor('/quick-facts?code=fixture-state')).toHaveAttribute('href', '/quick-facts?code=fixture-state')
    expect(linkFor('/quick-facts/weekly?code=fixture-state')).toHaveAttribute('href', '/quick-facts/weekly?code=fixture-state')
    expect(linkFor('/quick-facts/quick-assist?code=fixture-state')).toHaveAttribute('href', '/quick-facts/quick-assist?code=fixture-state')
    const activeTabPath = activePath === '/quick-facts/myplan' ? '/quick-facts/weekly' : activePath
    expect(linkFor(`${activeTabPath}?code=fixture-state`)).toHaveAttribute('aria-current', 'page')
  })

  it('preserves the full query string when switching tabs', () => {
    renderPageBar('/quick-facts/summary?code=fixture-state&date=2026-10-19&axis=department')

    expect(linkFor('/quick-facts/quick-assist?code=fixture-state&date=2026-10-19&axis=department'))
      .toHaveAttribute('href', '/quick-facts/quick-assist?code=fixture-state&date=2026-10-19&axis=department')
  })

  it('shows Quick Facts, Quick Assist and Weekly Facts wording outside SI and METRO', () => {
    const user = { ...fullAccessUser, portal: '360FM' }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, false, '360FM', false))
    renderPageBar('/quick-facts/summary')

    expect(screen.getByRole('link', { name: 'Quick Facts New!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quick Assist New!' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Weekly Facts New!' })).toBeInTheDocument()
  })

  it('excludes Quick Assist and hides the page bar for CFC SI accounts with one eligible tab', () => {
    vi.mocked(useNavGroups).mockReturnValue(resultFor(fullAccessUser, true, 'SI', true))
    const { container } = renderPageBar('/quick-facts')

    expect(container.firstChild).toBeNull()
  })

  it('hides the page-bar when CFC access leaves only one eligible tab', () => {
    const user = { ...fullAccessUser, portal: 'BIG W' }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, true, 'BIG W', false))
    const { container } = renderPageBar('/quick-facts')

    expect(container.firstChild).toBeNull()
  })

  it('hides My Plan from the mobile page bar when Weekly Facts is disabled', () => {
    const user: IUserDetails = {
      portal: 'SI',
      sqf: 1,
      sqf_enabled: true,
      wf: 1,
      weekly_facts_enabled: false,
      my_plan_enabled: true,
    }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, false, 'SI', true))
    renderPageBar('/quick-facts/myplan?code=fixture-state')

    expect(screen.queryByRole('navigation', { name: 'Quick Facts navigation' })).not.toBeInTheDocument()
  })

  it('renders nothing when no Quick Facts sections are available', () => {
    vi.mocked(useNavGroups).mockReturnValue({
      groups: [],
      user: undefined,
      isCfc: undefined,
      dashboardSettingsError: false,
    })
    const { container } = renderPageBar('/quick-facts/summary')

    expect(container.firstChild).toBeNull()
  })
})
