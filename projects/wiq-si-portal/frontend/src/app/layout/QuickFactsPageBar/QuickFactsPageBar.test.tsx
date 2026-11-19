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
    expect(linkFor('/quick-facts').textContent).toBe('Daily')
    expect(linkFor('/quick-facts/quick-assist').textContent).toBe('Weekly')
    expect(linkFor('/quick-facts/weekly').textContent).toBe('Trend')
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

  it('shows Quick Facts, Quick Assist and Weekly Facts wording outside SI and METRO', () => {
    const user = { ...fullAccessUser, portal: '360FM' }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, false, '360FM', false))
    renderPageBar('/quick-facts/summary')

    expect(screen.getByRole('link', { name: 'Quick Facts' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quick Assist' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Weekly Facts' })).toBeInTheDocument()
  })

  it('keeps Quick Assist for CFC SI accounts but hides Trend', () => {
    vi.mocked(useNavGroups).mockReturnValue(resultFor(fullAccessUser, true, 'SI', true))
    renderPageBar('/quick-facts')

    expect(screen.getByRole('link', { name: 'Weekly' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Trend' })).not.toBeInTheDocument()
  })

  it('hides Quick Assist and Trend for CFC accounts outside SI and METRO', () => {
    const user = { ...fullAccessUser, portal: 'BIG W' }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, true, 'BIG W', false))
    renderPageBar('/quick-facts')

    expect(screen.getByRole('link', { name: 'Quick Facts' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Quick Assist/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Weekly Facts' })).not.toBeInTheDocument()
  })

  it('labels the only enabled trend route as My Plan', () => {
    const user: IUserDetails = {
      portal: 'SI',
      wf: 1,
      weekly_facts_enabled: false,
      my_plan_enabled: true,
    }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, false, 'SI', true))
    renderPageBar('/quick-facts/myplan?code=fixture-state')

    expect(screen.getByRole('link', { name: 'My Plan' })).toHaveAttribute(
      'href',
      '/quick-facts/myplan?code=fixture-state',
    )
  })

  it('renders nothing when no Quick Facts sections are available', () => {
    vi.mocked(useNavGroups).mockReturnValue({
      groups: [],
      user: undefined,
      dashboardSettingsError: false,
    })
    const { container } = renderPageBar('/quick-facts/summary')

    expect(container.firstChild).toBeNull()
  })
})
