import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { RecognizeDialog } from './RecognizeDialog'
import type { IRecognizeFormData } from './recognize'

const searchUsers = vi.fn()
const submitRecognize = vi.fn()
const showSnack = vi.fn()
vi.mock('../../api/users', () => ({ searchUsers: (n: string) => searchUsers(n) }))
vi.mock('../../api/recognition', () => ({ submitRecognize: (fd: FormData) => submitRecognize(fd) }))
vi.mock('../Snackbar/Snackbar', () => ({ useSnackbar: () => showSnack }))

const formData: IRecognizeFormData = {
  cardPdf: new Blob(['%PDF']),
  cardLevel: 'National', cardTitle: 'Sales', cardType: 'summary', cardId: '1', cardCode: 'NAT',
  cardDesc: 'National', filterDate: '09-01-2024', attachmentName: 'National - summary - 09-01-2024.pdf',
}

async function pickRecipient(name: string) {
  const input = screen.getByTestId('recognize-recipient')
  fireEvent.focus(input)
  fireEvent.change(input, { target: { value: 'jan' } })
  await act(async () => { vi.advanceTimersByTime(400) })
  expect(searchUsers).toHaveBeenCalledWith('jan')
  fireEvent.click(await screen.findByText(name))
}

describe('RecognizeDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    searchUsers.mockReset().mockResolvedValue([{ employee_name: 'Jane <jane@woolworths.com.au>', employee_number: '111' }])
    submitRecognize.mockReset().mockResolvedValue({})
    showSnack.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('requires a selected recipient and a message', () => {
    render(<RecognizeDialog recognizeFormData={formData} onClose={() => {}} />)
    expect(screen.getByText('QUICK FACTS THANK YOU CARD')).toBeInTheDocument()
    expect(screen.getByTestId('recognize-attachment')).toHaveTextContent('National - summary - 09-01-2024.pdf')
    fireEvent.click(screen.getByTestId('recognize-submit'))
    expect(screen.getByRole('alert')).toHaveTextContent('Please ensure all required fields * are filled in with valid values.')
    expect(submitRecognize).not.toHaveBeenCalled()
  })

  it('flags a store account recipient', async () => {
    searchUsers.mockResolvedValue([{ employee_name: 'Store <1001@stores.woolworths.com.au>', employee_number: '9' }])
    render(<RecognizeDialog recognizeFormData={formData} onClose={() => {}} />)
    await pickRecipient('Store <1001@stores.woolworths.com.au>')
    expect(screen.getByTestId('recognize-store-warning').className).toMatch(/invalidEmail/)
  })

  it('submits, and on NoQfAccess resubmits with qf_access_validation=N after Yes', async () => {
    const onClose = vi.fn()
    submitRecognize
      .mockRejectedValueOnce({ response: { data: { status: 'NoQfAccess' } } })
      .mockResolvedValueOnce({})
    render(<RecognizeDialog recognizeFormData={formData} onClose={onClose} />)
    await pickRecipient('Jane <jane@woolworths.com.au>')
    fireEvent.change(screen.getByTestId('recognize-message'), { target: { value: 'Thanks!' } })
    fireEvent.click(screen.getByTestId('recognize-submit'))
    const first = submitRecognize.mock.calls[0][0] as FormData
    expect(first.get('send_to')).toBe('jane@woolworths.com.au')
    expect(first.get('recipient_emp_number')).toBe('111')
    expect(first.get('qf_access_validation')).toBe('Y')

    expect(await screen.findByText('This User does not have access to Quick Facts,')).toBeInTheDocument()
    expect(screen.getByText('Do you still want to proceed?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await act(async () => {})
    expect((submitRecognize.mock.calls[1][0] as FormData).get('qf_access_validation')).toBe('N')
    expect(showSnack).toHaveBeenCalledWith('The Recognition has been sent successfully')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows the support error for other failures', async () => {
    submitRecognize.mockRejectedValueOnce({ response: { status: 500 } })
    render(<RecognizeDialog recognizeFormData={formData} onClose={() => {}} />)
    await pickRecipient('Jane <jane@woolworths.com.au>')
    fireEvent.change(screen.getByTestId('recognize-message'), { target: { value: 'Thanks!' } })
    fireEvent.click(screen.getByTestId('recognize-submit'))
    await act(async () => {})
    expect(showSnack).toHaveBeenCalledWith('Unable to submit recognition now, Please Contact Support', 'error')
  })

  it.each(['j', 'someone else'])('invalidates the selected recipient immediately after editing to %s', async value => {
    render(<RecognizeDialog recognizeFormData={formData} onClose={() => {}} />)
    await pickRecipient('Jane <jane@woolworths.com.au>')
    fireEvent.change(screen.getByTestId('recognize-message'), { target: { value: 'Thanks!' } })
    fireEvent.change(screen.getByTestId('recognize-recipient'), { target: { value } })
    fireEvent.click(screen.getByTestId('recognize-submit'))
    expect(submitRecognize).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('valid values')
  })

  it('does not send to a previously selected line manager after their input changes', async () => {
    render(<RecognizeDialog recognizeFormData={formData} onClose={() => {}} />)
    await pickRecipient('Jane <jane@woolworths.com.au>')
    const manager = screen.getByTestId('recognize-line-manager')
    fireEvent.focus(manager)
    fireEvent.change(manager, { target: { value: 'jan' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    fireEvent.click(await screen.findByText('Jane <jane@woolworths.com.au>'))
    fireEvent.change(screen.getByTestId('recognize-message'), { target: { value: 'Thanks!' } })
    fireEvent.change(manager, { target: { value: 'x' } })
    fireEvent.click(screen.getByTestId('recognize-submit'))
    expect(submitRecognize).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('valid email address is selected')
    fireEvent.change(manager, { target: { value: '' } })
    await act(async () => { fireEvent.click(screen.getByTestId('recognize-submit')) })
    expect((submitRecognize.mock.calls[0][0] as FormData).get('cc_to')).toBe('null')
    expect((submitRecognize.mock.calls[0][0] as FormData).get('line_manager_emp_number')).toBe('')
  })

  it.each(['recognize-recipient', 'recognize-line-manager'])('reports a failed %s search and stops its spinner', async testId => {
    searchUsers.mockRejectedValueOnce(new Error('Search unavailable'))
    render(<RecognizeDialog recognizeFormData={formData} onClose={() => {}} />)
    fireEvent.change(screen.getByTestId(testId), { target: { value: 'jan' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.queryByRole('progressbar', { name: 'Searching' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to search team members')
  })

  it('supports wrapping keyboard suggestions and submits selected recipient and manager identities', async () => {
    searchUsers.mockResolvedValue([
      { employee_name: 'Jane <jane@example.invalid>', employee_number: '111' },
      { employee_name: 'Manager <manager@example.invalid>', employee_number: '222' },
    ])
    const onClose = vi.fn()
    render(<RecognizeDialog recognizeFormData={formData} onClose={onClose} />)
    const recipient = screen.getByTestId('recognize-recipient')
    fireEvent.focus(recipient)
    fireEvent.change(recipient, { target: { value: 'ja' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    fireEvent.keyDown(recipient, { key: 'ArrowUp' })
    expect(screen.getByRole('option', { name: /Manager/ })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(recipient, { key: 'ArrowDown' })
    fireEvent.mouseDown(screen.getByRole('option', { name: /Jane/ }))
    fireEvent.mouseEnter(screen.getByRole('option', { name: /Jane/ }))
    fireEvent.keyDown(recipient, { key: 'Enter' })
    expect(recipient).toHaveValue('Jane <jane@example.invalid>')
    fireEvent.blur(recipient)
    const manager = screen.getByTestId('recognize-line-manager')
    fireEvent.focus(manager)
    fireEvent.change(manager, { target: { value: 'ma' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    fireEvent.keyDown(manager, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.blur(manager)
    fireEvent.focus(manager)
    fireEvent.keyDown(manager, { key: 'ArrowDown' })
    fireEvent.keyDown(manager, { key: 'Enter' })
    fireEvent.blur(manager)
    fireEvent.change(screen.getByTestId('recognize-message'), { target: { value: 'Thanks for your help' } })
    fireEvent.blur(screen.getByTestId('recognize-message'))
    await act(async () => { fireEvent.click(screen.getByTestId('recognize-submit')) })
    const payload: FormData = submitRecognize.mock.calls[0][0]
    expect(payload.get('send_to')).toBe('jane@example.invalid')
    expect(payload.get('cc_to')).toBe('manager@example.invalid')
    expect(payload.get('line_manager_emp_number')).toBe('222')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it.each(['recognize-recipient', 'recognize-line-manager'])('ignores stale %s results after a newer short input', async testId => {
    let resolveSearch!: (users: { employee_name: string; employee_number: string }[]) => void
    searchUsers.mockReturnValue(new Promise(resolve => { resolveSearch = resolve }))
    const { unmount } = render(<RecognizeDialog recognizeFormData={formData} onClose={vi.fn()} />)
    const input = screen.getByTestId(testId)
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'jane' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByRole('progressbar', { name: 'Searching' })).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    await act(async () => {
      resolveSearch([{ employee_name: 'Stale <stale@example.invalid>', employee_number: '000' }])
      vi.advanceTimersByTime(400)
    })
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'jane' } })
    unmount()
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(searchUsers).toHaveBeenCalledTimes(1)
  })

  it.each(['recognize-recipient', 'recognize-line-manager'])('shows empty %s search results and allows keyboard close', async testId => {
    searchUsers.mockResolvedValue([])
    const onClose = vi.fn()
    render(<RecognizeDialog recognizeFormData={formData} onClose={onClose} />)
    fireEvent.change(screen.getByTestId(testId), { target: { value: 'nobody' } })
    await act(async () => { vi.advanceTimersByTime(400) })
    expect(screen.getByRole('alert')).toHaveTextContent('We did not find any result')
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close' }), { key: 'Enter' })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
