import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { IQFTree } from '../../../shared/types/sqf.types'

const showSnack = vi.fn()
vi.mock('../../../shared/components/Snackbar/Snackbar', () => ({ useSnackbar: () => showSnack }))

vi.mock('../api/trend', () => ({
  getUserSubscriptions: vi.fn(),
  updateUserSubscriptions: vi.fn(),
}))

const national: IQFTree = { name: 'National', code: 'National', level: 'National', level_desc: 'National', depth: 0, apiDepth: 0, expandable: true }
const nsw: IQFTree = { name: 'NSW', code: 'NSW', level: 'State', level_desc: 'State', depth: 1, apiDepth: 1, expandable: false, parent: national }
national.children = [nsw]
vi.mock('../../../shared/context/FilterContext', () => ({ useOptionalFilter: () => ({ treeNodes: [national, nsw] }) }))

import { getUserSubscriptions, updateUserSubscriptions } from '../api/trend'
import { SubscriptionDialog } from './SubscriptionDialog'

const views = [
  { displayName: 'Week Overview', name: 'week_overview', checked: false },
  { displayName: 'Monthly Trend', name: 'monthly_trend', checked: false },
]

function renderDialog(onClose = vi.fn()) {
  render(
    <SubscriptionDialog open onClose={onClose} subscriptionKey="wf" displayName="Weekly Facts" availableViews={views} />
  )
  return onClose
}

describe('SubscriptionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the Angular texts and both validation messages for a first-time subscriber', async () => {
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: [], subscribed_views: [] })
    renderDialog()

    expect(screen.getByText('Weekly Facts subscription preferences')).toBeInTheDocument()
    expect(screen.getByText(/Subscribe to receive Weekly Facts email updates for your preferred locations/)).toBeInTheDocument()
    expect(screen.getByText('Select views to subscribe to *')).toBeInTheDocument()
    expect(screen.getByText('Select locations to subscribe to *')).toBeInTheDocument()
    expect(screen.getByText('Please select at least one view')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Please select at least one location')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(getUserSubscriptions).toHaveBeenCalledWith('wf')
  })

  it('clears the validation messages once a view and a location are selected', async () => {
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: [], subscribed_views: [] })
    renderDialog()
    await screen.findByText('Please select at least one location')

    fireEvent.click(screen.getByLabelText('Week Overview'))
    fireEvent.click(screen.getByLabelText('National'))

    expect(screen.queryByText('Please select at least one view')).not.toBeInTheDocument()
    expect(screen.queryByText('Please select at least one location')).not.toBeInTheDocument()
    expect(screen.getByText('Selected locations')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeEnabled()
  })

  it('pre-checks saved views and POSTs the selected codes and views, then shows the success snack', async () => {
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: ['National'], subscribed_views: ['monthly_trend'] })
    vi.mocked(updateUserSubscriptions).mockResolvedValue(undefined as never)
    const onClose = renderDialog()

    await waitFor(() => expect(screen.getByLabelText('Monthly Trend')).toBeChecked())
    expect(screen.getByLabelText('National')).toBeChecked()
    fireEvent.click(screen.getByLabelText('NSW'))
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(updateUserSubscriptions).toHaveBeenCalledWith('wf', ['National', 'NSW'], ['monthly_trend'])
    expect(showSnack).toHaveBeenCalledWith('Subscription preferences are saved successfully')
  })

  it('shows the error snack when saving fails', async () => {
    vi.mocked(getUserSubscriptions).mockResolvedValue({ subscribed_locations: ['National'], subscribed_views: ['week_overview'] })
    vi.mocked(updateUserSubscriptions).mockRejectedValue(new Error('boom'))
    const onClose = renderDialog()

    await waitFor(() => expect(screen.getByLabelText('National')).toBeChecked())
    fireEvent.click(screen.getByLabelText('National'))
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }))

    await waitFor(() =>
      expect(showSnack).toHaveBeenCalledWith('Error occurred while saving Subscription preferences', 'error')
    )
    expect(updateUserSubscriptions).toHaveBeenCalledWith('wf', [], ['week_overview'])
    expect(onClose).not.toHaveBeenCalled()
  })
})
