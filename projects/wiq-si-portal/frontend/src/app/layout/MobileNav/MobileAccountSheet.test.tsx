import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { fullAccessUser } from '../navTestFixture'
import { MobileAccountSheet } from './MobileAccountSheet'

describe('MobileAccountSheet', () => {
  let originalOverflow: string

  beforeEach(() => {
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = ''
    localStorage.clear()
  })

  afterEach(() => {
    document.body.style.overflow = originalOverflow
    vi.restoreAllMocks()
  })

  it('replaces the profile sheet with a mobile sign-out confirmation', () => {
    render(<MobileAccountSheet user={fullAccessUser} onClose={vi.fn()} />)

    expect(screen.getByText('Alex Example')).toBeInTheDocument()
    expect(screen.getByText('Store Manager')).toBeInTheDocument()
    expect(screen.getByText('alex@example.invalid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(screen.getByRole('dialog', { name: 'Sign out?' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'User menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('switches accounts and sets the switchedAccount marker', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch Account' }))

    expect(localStorage.getItem('switchedAccount')).toBe('yes')
    expect(open).toHaveBeenCalledWith(fullAccessUser.switch_account_url, '_self')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Switch Account and Sign Out disabled when their URLs are missing', () => {
    render(<MobileAccountSheet user={{ ...fullAccessUser, switch_account_url: undefined, logoutUrl: undefined }} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Switch Account' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeDisabled()
  })

  it('closes on Escape and restores the previous body overflow', () => {
    document.body.style.overflow = 'scroll'
    const onClose = vi.fn()
    const { unmount } = render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('closes the account flow when Cancel dismisses the confirmation', () => {
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it.each(['account', 'confirmation'])('closes the active %s sheet on browser Back without signing out', activeSheet => {
    const onClose = vi.fn()
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    if (activeSheet === 'confirmation') {
      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    }
    fireEvent.popState(window)

    expect(onClose).toHaveBeenCalledOnce()
    expect(open).not.toHaveBeenCalled()
  })

  it('closes the confirmation on Escape', () => {
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes the confirmation from its backdrop', () => {
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss sign-out confirmation backdrop' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes the confirmation from its explicit close button', () => {
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close sign-out confirmation' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('navigates to the logout URL only after confirming', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(open).toHaveBeenCalledWith(fullAccessUser.logoutUrl, '_self')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
