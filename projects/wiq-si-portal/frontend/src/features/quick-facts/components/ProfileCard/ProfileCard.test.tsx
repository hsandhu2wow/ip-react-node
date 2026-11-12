import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ProfileCard } from './ProfileCard'
import type { IQFStoreProfile } from '../../api/storeProfile'

const getStoreProfileRoleNames = vi.fn()
const preview = vi.fn(() => Promise.resolve())
let portal = 'METRO'
vi.mock('../../api/storeProfile', () => ({ getStoreProfileRoleNames: (...a: unknown[]) => getStoreProfileRoleNames(...a) }))
vi.mock('../../../../shared/components/PreviewDialog/cardsPreviewContext', () => ({ useCardsPreview: () => ({ preview }) }))
vi.mock('../../../../shared/context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'x', portal } }) }))

const card: IQFStoreProfile = {
  title: 'Town Hall - 1248',
  jsId: 'js-profile-card',
  storeManagerDetails: { name: 'Jane Doe', profilePhoto: 'https://x/p.png' },
  roles: [{ role: 'Store Manager' }, { role: 'Bakery Team Manager' }],
  profile: { storeCluster: 'Core', centerType: 'City Centre', renewalAge: '2.7', colesProximity: '<1 KM', updatedTime: '2025-04-22T05:12:10Z', onlineHub: 'Hub A' },
  storeAddress: { SitePhoneNumber: '02 8565 9275', fullAddress: 'Cnr Park St Sydney NSW 2000', Latitude: '-33.87', Longitude: '151.2' },
}

beforeEach(() => {
  portal = 'METRO'
  getStoreProfileRoleNames.mockReset()
  preview.mockClear()
})

describe('ProfileCard (Angular sqf-profile-card)', () => {
  it('renders store manager, address, directions and non-BIGW profile fields', () => {
    render(<ProfileCard card={card} storeCode="1248" />)
    expect(screen.getByText('STORE PROFILE')).toBeDefined()
    expect(screen.getByText('Town Hall - 1248')).toBeDefined()
    expect(screen.getByText('Jane Doe')).toBeDefined()
    expect(screen.getByText('02 8565 9275')).toBeDefined()
    expect(screen.getByText('Cnr Park St Sydney NSW 2000')).toBeDefined()
    expect(screen.getByText('Get Directions').getAttribute('href')).toBe('https://maps.google.com/?q=-33.87,151.2')
    expect(screen.getByText('2.7 years ago')).toBeDefined()
    expect(screen.getByText('<1 KM')).toBeDefined()
    expect(screen.queryByText('Hub A')).toBeNull()
    expect(document.getElementById('js-profile-card')).not.toBeNull()
  })

  it('shows BIGW-specific profile fields for the BIGW portal', () => {
    portal = 'BIGW'
    render(<ProfileCard card={card} storeCode="1248" />)
    expect(screen.getByText('Hub A')).toBeDefined()
    expect(screen.queryByText('Core')).toBeNull()
  })

  it('fetches role names once on first expand', async () => {
    getStoreProfileRoleNames.mockResolvedValue([{ role: 'Store Manager', name: 'Sam' }])
    render(<ProfileCard card={card} storeCode="1248" />)
    const table = screen.getByRole('table')
    expect(within(table).getByText('Bakery Team Manager')).toBeDefined()
    fireEvent.click(screen.getByLabelText('Expand roles'))
    await waitFor(() => expect(within(table).getByText('Sam')).toBeDefined())
    fireEvent.click(screen.getByLabelText('Collapse roles'))
    fireEvent.click(screen.getByLabelText('Expand roles'))
    expect(getStoreProfileRoleNames).toHaveBeenCalledTimes(1)
    expect(getStoreProfileRoleNames).toHaveBeenCalledWith('1248')
  })

  it('previews the card for PDF, Google Slide and print from its menu', () => {
    render(<ProfileCard card={card} storeCode="1248" />)
    fireEvent.click(screen.getByLabelText('Card options'))
    fireEvent.click(screen.getByRole('menuitem', { name: /Print/ }))
    expect(preview).toHaveBeenLastCalledWith('print', [card])
    fireEvent.click(screen.getByLabelText('Card options'))
    fireEvent.click(screen.getByRole('menuitem', { name: /Download/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /PDF/ }))
    expect(preview).toHaveBeenLastCalledWith('pdf', [card])
    fireEvent.click(screen.getByLabelText('Card options'))
    fireEvent.click(screen.getByRole('menuitem', { name: /Download/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Google Slide/ }))
    expect(preview).toHaveBeenLastCalledWith('slide', [card])
  })

  it('shows the error state with support email', () => {
    render(<ProfileCard card={{ error: true }} storeCode="1248" supportEmail="help@x.com" />)
    expect(screen.getByText('Error occurred while fetching store data')).toBeDefined()
    expect(screen.getByText('help@x.com').getAttribute('href')).toBe('mailto:help@x.com')
  })

  it('shows a spinner while loading', () => {
    render(<ProfileCard card={null} storeCode="1248" />)
    expect(screen.getByRole('progressbar')).toBeDefined()
  })
})
