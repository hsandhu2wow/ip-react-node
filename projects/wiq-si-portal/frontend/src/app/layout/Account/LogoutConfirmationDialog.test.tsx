import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LogoutConfirmationDialog } from './LogoutConfirmationDialog'

describe('LogoutConfirmationDialog', () => {
  it('shows a confirmation message and closes without signing out when cancelled', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<LogoutConfirmationDialog logoutUrl="https://accounts.example.invalid/logout" onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Sign out of Insights Portal' })).toBeInTheDocument()
    expect(screen.getByText(/all your Woolworths accounts/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })

  it('navigates to the provided logout URL only after confirmation', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<LogoutConfirmationDialog logoutUrl="https://accounts.example.invalid/logout" onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(open).toHaveBeenCalledWith('https://accounts.example.invalid/logout', '_self')
    expect(onClose).toHaveBeenCalledOnce()
    open.mockRestore()
  })

  it('closes on Escape without navigating', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const onClose = vi.fn()
    render(<LogoutConfirmationDialog logoutUrl="https://accounts.example.invalid/logout" onClose={onClose} />)

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledOnce()
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })
})
