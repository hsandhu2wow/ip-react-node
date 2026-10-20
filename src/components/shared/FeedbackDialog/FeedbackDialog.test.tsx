import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from '../Snackbar/Snackbar'
import { FeedbackDialog, getFeedbackPage } from './FeedbackDialog'
import client from '../../../api/client'

vi.mock('../../../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
const mockClient = client as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

const ISSUES = ['Data issues', 'General feedback', 'Other']

function renderDialog(path = '/quick-facts/summary?code=National', props: { header?: string; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn()
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={qc}>
        <SnackbarProvider>
          <FeedbackDialog open onClose={onClose} header={props.header} />
        </SnackbarProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
  return { onClose }
}

const image = (name: string) => new File(['x'], name, { type: 'image/png' })

describe('getFeedbackPage', () => {
  it.each([
    ['/quick-facts/summary', undefined, 'Quick Facts Summary', 'quickfacts'],
    ['/quick-facts/details/sales', 'Sales', 'Quick Facts - Sales', 'quickfacts'],
    ['/quick-facts/weekly', undefined, 'Weekly Facts', 'weeklyfacts'],
    ['/quick-facts/weekly', 'WFAIPanel', 'Weekly Facts AI Insights', 'weeklyfacts'],
    // Angular parity: /myplan doesn't include 'weekly', so it falls through to the summary label.
    ['/quick-facts/myplan', undefined, 'Quick Facts Summary', 'quickfacts'],
  ])('%s (header %s) → %s / %s', (path, header, currentPage, pageSection) => {
    expect(getFeedbackPage(path, header)).toEqual({ currentPage, pageSection })
  })
})

describe('FeedbackDialog', () => {
  beforeEach(() => {
    mockClient.get.mockReset().mockResolvedValue({ data: ISSUES })
    mockClient.post.mockReset()
  })

  it('loads issue types for the page section and preselects the first option', async () => {
    renderDialog('/quick-facts/weekly?code=National')
    expect(screen.getByText('Help us improve!')).toBeInTheDocument()
    expect(screen.getByText('I am sending a feedback for Weekly Facts')).toBeInTheDocument()
    expect(mockClient.get).toHaveBeenCalledWith('/feedbackIssuesType/weeklyfacts')
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Data issues'))
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()

    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(ISSUES)
    fireEvent.click(screen.getByRole('option', { name: 'Other' }))
    expect(screen.getByRole('combobox')).toHaveTextContent('Other')
  })

  it('adds attachments via upload and drag/drop, and removes them', async () => {
    renderDialog()
    const input = screen.getByTestId('feedback-file-input')
    fireEvent.change(input, { target: { files: [image('one.png')] } })
    fireEvent.drop(screen.getByTestId('feedback-dropzone'), {
      dataTransfer: { files: [image('two.png'), image('three.png'), new File(['t'], 'notes.txt', { type: 'text/plain' })] },
    })
    expect(screen.getAllByRole('listitem').map(c => c.textContent?.replace('cancel', ''))).toEqual([
      'one.png', 'two.png', 'three.png',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Remove two.png' }))
    expect(screen.getAllByRole('listitem').map(c => c.textContent?.replace('cancel', ''))).toEqual(['one.png', 'three.png'])
  })

  it('posts Angular\'s multipart fields, then closes and shows the snackbar', async () => {
    mockClient.post.mockResolvedValue({ data: {} })
    const { onClose } = renderDialog('/quick-facts/details/sales?code=National', { header: 'Sales' })
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('Data issues'))

    fireEvent.change(screen.getByPlaceholderText('Let us know your feedback'), { target: { value: 'Great app' } })
    fireEvent.click(screen.getByLabelText('Would you like us to contact you about your feedback?'))
    fireEvent.change(screen.getByTestId('feedback-file-input'), { target: { files: [image('a.png'), image('b.png')] } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Submit' })) })

    expect(mockClient.post).toHaveBeenCalledTimes(1)
    const [url, body] = mockClient.post.mock.calls[0] as [string, FormData]
    expect(url).toBe('/feedbackPopup')
    expect([...body.keys()]).toEqual([
      'image0', 'image1', 'reason', 'feedback', 'contactMe', 'requestOrigin', 'issueType', 'url',
    ])
    expect((body.get('image0') as File).name).toBe('a.png')
    expect((body.get('image1') as File).name).toBe('b.png')
    expect(body.get('reason')).toBe('Great app')
    expect(body.get('feedback')).toBe('undefined')
    expect(body.get('contactMe')).toBe('true')
    expect(body.get('requestOrigin')).toBe('Support Quick Facts - Sales')
    expect(body.get('issueType')).toBe('Data issues')
    expect(body.get('url')).toBe('/quick-facts/details/sales?code=National')

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Thank you for the feedback!')
  })

  it('reports a submission failure instead of silently closing', async () => {
    mockClient.post.mockRejectedValue(new Error('boom'))
    const { onClose } = renderDialog()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled())
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Submit' })) })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status')).toHaveTextContent('Unable to submit feedback, Please try again or Contact Support')
  })
})
