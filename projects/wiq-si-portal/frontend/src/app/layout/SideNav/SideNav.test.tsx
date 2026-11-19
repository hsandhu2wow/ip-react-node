import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { IUserDetails } from '../../../shared/api/users'
import { buildNavGroups } from '../navItems'
import { useNavGroups } from '../useNavGroups'
import { fullAccessNavResult, fullAccessUser } from '../navTestFixture'
import { SideNav } from './SideNav'

vi.mock('../useNavGroups', () => ({ useNavGroups: vi.fn() }))

function resultFor(
  user: IUserDetails,
  dashboardSegregation: boolean,
  dashboardSettingsError = false,
) {
  return {
    groups: buildNavGroups(user, false, user.portal ?? 'SI', dashboardSegregation),
    user,
    dashboardSettingsError,
  }
}

function renderNav(path = '/quick-facts') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SideNav />
    </MemoryRouter>,
  )
}

function linkFor(path: string): HTMLAnchorElement {
  const link = screen.getAllByRole('link').find(item => item.getAttribute('href') === path)
  if (!link) throw new Error(`Missing navigation link for ${path}`)
  return link as HTMLAnchorElement
}

describe('SideNav', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(useNavGroups).mockReturnValue(fullAccessNavResult)
  })

  it('renders Buying and Store groups with separate segregated Dashboard links', () => {
    renderNav()

    expect(screen.getByText('Buying')).toBeInTheDocument()
    expect(screen.getByText('Store')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Dashboards/ })).toHaveLength(2)
    expect(linkFor('/dashboards/app/buying')).toBeInTheDocument()
    expect(linkFor('/dashboards/app/store')).toBeInTheDocument()
  })

  it('does not show group labels when only one access group is available', () => {
    const buyingOnlyUser: IUserDetails = {
      ...fullAccessUser,
      sqf: 0,
      sqa: 0,
      wf: 0,
      sqf_enabled: false,
      quick_assist_enabled: 0,
      weekly_facts_enabled: 0,
      my_plan_enabled: 0,
    }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(buyingOnlyUser, true))
    renderNav()

    expect(screen.queryByText('Buying')).not.toBeInTheDocument()
    expect(screen.queryByText('Store')).not.toBeInTheDocument()
    expect(linkFor('/bqf/summary')).toBeInTheDocument()
  })

  it('renders one standalone Dashboard link when dashboards are not segregated', () => {
    const user = { ...fullAccessUser, portal: 'BIG W' }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(user, false))
    renderNav()

    expect(screen.getAllByRole('link', { name: /Dashboards/ })).toHaveLength(1)
    expect(linkFor('/dashboards/app/all')).toBeInTheDocument()
  })

  it('uses loaded profile details instead of the Demo User stub', () => {
    renderNav()

    expect(screen.getByText('Alex Example')).toBeInTheDocument()
    expect(screen.getByText('Store Manager')).toBeInTheDocument()
    expect(screen.getByText('alex@example.invalid')).toBeInTheDocument()
    expect(screen.queryByText('Demo User')).not.toBeInTheDocument()
  })

  it('renders New! and Soon badges independently', () => {
    renderNav()

    expect(screen.getAllByText('New!')).toHaveLength(3)
    expect(screen.getAllByText('Soon').length).toBeGreaterThan(0)
    expect(linkFor('/quick-facts/quick-assist')).toHaveTextContent('New!')
    expect(linkFor('/quick-facts/quick-assist')).toHaveTextContent('Soon')
  })

  it('marks only the most-specific Quick Facts item active', () => {
    renderNav('/quick-facts/weekly')

    expect(linkFor('/quick-facts/weekly').dataset.active).toBe('true')
    expect(linkFor('/quick-facts').dataset.active).not.toBe('true')
  })

  it('marks only the matching segregated Dashboard active', () => {
    renderNav('/dashboards/app/store')

    expect(linkFor('/dashboards/app/store').dataset.active).toBe('true')
    expect(linkFor('/dashboards/app/buying').dataset.active).not.toBe('true')
  })

  it('switches accounts only when a switch URL exists', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const { unmount } = renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Switch account' }))

    expect(localStorage.getItem('switchedAccount')).toBe('yes')
    expect(open).toHaveBeenCalledWith(fullAccessUser.switch_account_url, '_self')

    unmount()
    const userWithoutSwitchUrl = { ...fullAccessUser, switch_account_url: undefined }
    vi.mocked(useNavGroups).mockReturnValue(resultFor(userWithoutSwitchUrl, true))
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    expect(screen.queryByRole('menuitem', { name: 'Switch account' })).not.toBeInTheDocument()
    open.mockRestore()
  })

  it('requires confirmation before signing out and supports cancel', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    expect(screen.getByRole('dialog', { name: 'Sign out of Insights Portal' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })

  it('does not expose dashboard links when dashboard settings fail', () => {
    vi.mocked(useNavGroups).mockReturnValue({
      ...fullAccessNavResult,
      groups: [],
      dashboardSettingsError: true,
    })
    renderNav()

    expect(screen.getByRole('alert')).toHaveTextContent(/dashboard/i)
    expect(screen.queryByRole('link', { name: /Dashboards/ })).not.toBeInTheDocument()
  })

  it('closes the account menu on outside click and Escape', () => {
    renderNav()
    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument()
  })
})
