import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoModal } from './InfoModal'

describe('InfoModal', () => {
  it('renders title and body', () => {
    render(<InfoModal title="My Title" body="<p>My body</p>" onClose={() => {}} />)
    expect(screen.getByText('My Title')).toBeDefined()
    expect(document.querySelector('[data-testid="info-modal-body"]')).not.toBeNull()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal title="T" body="B" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('info-modal-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal title="T" body="B" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('info-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when dialog content is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal title="T" body="B" onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
