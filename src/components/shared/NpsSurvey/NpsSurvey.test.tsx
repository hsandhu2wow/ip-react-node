import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import client from '../../../api/client'

vi.mock('../../../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
const mockClient = client as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

let NpsSurvey: typeof import('./NpsSurvey').NpsSurvey

async function renderSurvey(flag: Record<string, unknown>) {
  vi.resetModules()
  ;({ NpsSurvey } = await import('./NpsSurvey'))
  const { SnackbarProvider } = await import('../Snackbar/Snackbar')
  mockClient.get.mockResolvedValue({ data: flag })
  return render(
    <MemoryRouter initialEntries={['/quick-facts/summary?code=National']}>
      <SnackbarProvider>
        <NpsSurvey />
      </SnackbarProvider>
    </MemoryRouter>,
  )
}

const formOf = () => (mockClient.post.mock.calls[0][1] as FormData)

describe('NpsSurvey (Angular showNPSSurvey + qf-nps-survey)', () => {
  beforeEach(() => {
    mockClient.get.mockReset()
    mockClient.post.mockReset()
  })

  it('stays closed when the trigger flag is No', async () => {
    await renderSurvey({ triggerNPSPopup: 'No', sqf: 1 })
    await waitFor(() => expect(mockClient.get).toHaveBeenCalledWith('/triggerNPSSurvey/'))
    expect(screen.queryByText('Your feedback shapes our tools')).toBeNull()
  })

  it('stays closed when the user is not targeted for Quick Facts', async () => {
    await renderSurvey({ triggerNPSPopup: 'Yes', sqf: 0 })
    await waitFor(() => expect(mockClient.get).toHaveBeenCalled())
    expect(screen.queryByText('Your feedback shapes our tools')).toBeNull()
  })

  it('submits the selected score and optional reason, then thanks the user', async () => {
    mockClient.post.mockResolvedValue({ data: {} })
    await renderSurvey({ triggerNPSPopup: 'Yes', sqf: 1, campaignId: '42' })
    expect(await screen.findByText('Your feedback shapes our tools')).toBeDefined()
    const submit = screen.getByRole('button', { name: 'Submit' })
    expect(submit).toBeDisabled()
    expect(screen.queryByPlaceholderText('Share your thoughts here')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '9' }))
    fireEvent.change(screen.getByPlaceholderText('Share your thoughts here'), { target: { value: 'Great' } })
    fireEvent.click(submit)
    await waitFor(() => expect(mockClient.post).toHaveBeenCalled())
    expect(mockClient.post.mock.calls[0][0]).toBe('/npsSurvey')
    expect(Object.fromEntries(formOf().entries())).toEqual({
      feedback: '9', qaFeedback: 'Great', requestOrigin: 'sqf', campaignId: '42',
      url: '/quick-facts/summary?code=National',
    })
    expect(await screen.findByText('Thank you for the feedback!')).toBeDefined()
    expect(screen.queryByText('Your feedback shapes our tools')).toBeNull()
  })

  it('records a dismissal with the default campaign and closes', async () => {
    mockClient.post.mockResolvedValue({ data: {} })
    await renderSurvey({ triggerNPSPopup: 'Yes', sqf: 1 })
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Your feedback shapes our tools')).toBeNull()
    await waitFor(() => expect(mockClient.post).toHaveBeenCalled())
    expect(Object.fromEntries(formOf().entries())).toEqual({
      requestOrigin: 'sqf', campaignId: '999', url: '/quick-facts/summary?code=National',
    })
    expect(screen.queryByText('Thank you for the feedback!')).toBeNull()
  })

  it('does not reopen on the next page once closed', async () => {
    mockClient.post.mockResolvedValue({ data: {} })
    const { unmount } = await renderSurvey({ triggerNPSPopup: 'Yes', sqf: 1 })
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))
    unmount()
    render(<MemoryRouter><NpsSurvey /></MemoryRouter>)
    await waitFor(() => expect(mockClient.get).toHaveBeenCalledTimes(1))
    await new Promise(r => setTimeout(r, 0))
    expect(screen.queryByText('Your feedback shapes our tools')).toBeNull()
  })
})
