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
  })

  it('shows profile details and asks for confirmation before signing out', () => {
    render(<MobileAccountSheet user={fullAccessUser} onClose={vi.fn()} />)

    expect(screen.getByText('Alex Example')).toBeInTheDocument()
    expect(screen.getByText('Store Manager')).toBeInTheDocument()
    expect(screen.getByText('alex@example.invalid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(screen.getByRole('dialog', { name: 'Sign out of Insights Portal' })).toBeInTheDocument()
  })

  it('switches accounts and sets the switchedAccount marker', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch Account' }))

    expect(localStorage.getItem('switchedAccount')).toBe('yes')
    expect(open).toHaveBeenCalledWith(fullAccessUser.switch_account_url, '_self')
    expect(onClose).toHaveBeenCalledOnce()
    open.mockRestore()
  })

  it('omits switch-account action when no URL is available', () => {
    render(<MobileAccountSheet user={{ ...fullAccessUser, switch_account_url: undefined }} onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Switch Account' })).not.toBeInTheDocument()
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

  it('keeps the account sheet open when Escape dismisses the sign-out confirmation', () => {
    const onClose = vi.fn()
    render(<MobileAccountSheet user={fullAccessUser} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: 'Sign out of Insights Portal' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'User menu' })).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})
