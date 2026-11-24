import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { IntroVideoDialog } from './IntroVideoDialog'

const videoUrl = 'https://drive.google.com/file/d/example-id/view'

describe('IntroVideoDialog', () => {
  it('embeds a Google Drive preview and exposes the original fallback link', () => {
    render(
      <IntroVideoDialog
        open
        title="Welcome to Insights Portal"
        videoUrl={videoUrl}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Welcome to Insights Portal' })).toBeInTheDocument()
    expect(screen.getByTitle('Introduction video')).toHaveAttribute(
      'src',
      'https://drive.google.com/file/d/example-id/preview',
    )
    expect(screen.getByTitle('Introduction video')).toHaveAttribute('allow', 'autoplay')
    expect(screen.getByRole('link', { name: 'Click here' })).toHaveAttribute('href', videoUrl)
  })

  it('does not close on backdrop or Escape, but calls the explicit close action', async () => {
    const onClose = vi.fn()
    render(
      <IntroVideoDialog open title="Welcome" videoUrl={videoUrl} onClose={onClose} />,
    )

    fireEvent.click(screen.getByTestId('dialog-backdrop'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close video' }))
    expect(onClose).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close video' })).not.toBeDisabled())
  })

  it('keeps the dialog open and reports a flag-update failure', async () => {
    const onClose = vi.fn().mockRejectedValue(new Error('Update failed'))
    render(
      <IntroVideoDialog open title="Welcome" videoUrl={videoUrl} onClose={onClose} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close video' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save your video preference. Please try again.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
