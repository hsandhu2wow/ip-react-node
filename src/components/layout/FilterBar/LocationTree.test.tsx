import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LocationTree } from './LocationTree'
import { processFilterResponse, addParents, flattenTree } from '../../../utils/tree'

const getNearbyStores = vi.fn()
const showSnack = vi.fn()
vi.mock('../../../api/sqf', () => ({ getNearbyStores: (...a: unknown[]) => getNearbyStores(...a) }))
vi.mock('../../shared/Snackbar/Snackbar', () => ({ useSnackbar: () => showSnack }))
vi.mock('../../../context/FilterContext', () => ({ useFilter: () => filterState }))

const root = processFilterResponse([
  { name: 'NSW', code: 'NSW', level: 1, level_desc: 'State', children: [
    { name: 'Town Hall', code: '1248', level: 4, level_desc: 'Store' },
    { name: 'Bondi', code: '1001', level: 4, level_desc: 'Store' },
  ] },
] as never)!
addParents(root)
const filterState = { treeNodes: flattenTree(root), selectedNode: null }

let geoOk = true
beforeEach(() => {
  getNearbyStores.mockReset()
  showSnack.mockReset()
  geoOk = true
  vi.stubGlobal('navigator', {
    geolocation: {
      getCurrentPosition: (ok: PositionCallback, err: PositionErrorCallback) =>
        geoOk ? ok({ coords: { latitude: -33.8, longitude: 151.2 } } as GeolocationPosition)
          : err({ message: 'denied' } as GeolocationPositionError),
    },
  })
})

describe('LocationTree store locator (Angular showNearbyStore)', () => {
  it('replaces the tree with nearby stores, then toggles back', async () => {
    getNearbyStores.mockResolvedValue([{ name: 'Town Hall', code: '1248', level: 4, level_desc: 'Store' }])
    render(<LocationTree onSelect={() => {}} />)
    expect(screen.getByText('NSW')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /YOUR LOCATION/ }))
    await waitFor(() => expect(screen.getByText('Town Hall - 1248')).toBeDefined())
    expect(getNearbyStores).toHaveBeenCalledWith(-33.8, 151.2)
    expect(screen.queryByText('NSW')).toBeNull()
    expect(screen.getByText('location_on')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /YOUR LOCATION/ }))
    await waitFor(() => expect(screen.getByText('NSW')).toBeDefined())
    expect(screen.getByText('location_off')).toBeDefined()
  })

  it('shows the no-access message when there are no nearby stores', async () => {
    getNearbyStores.mockResolvedValue([])
    render(<LocationTree onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /YOUR LOCATION/ }))
    await waitFor(() => expect(screen.getByText('You do not have access to any nearby stores!')).toBeDefined())
  })

  it('snacks an error when location access is blocked', async () => {
    geoOk = false
    render(<LocationTree onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /YOUR LOCATION/ }))
    await waitFor(() =>
      expect(showSnack).toHaveBeenCalledWith("Location access blocked by user, please enable in browser's settings.", 'error'),
    )
    expect(getNearbyStores).not.toHaveBeenCalled()
    expect(screen.getByText('NSW')).toBeDefined()
  })

  it('snacks an error when the nearby lookup fails', async () => {
    getNearbyStores.mockRejectedValue(new Error('500'))
    render(<LocationTree onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /YOUR LOCATION/ }))
    await waitFor(() =>
      expect(showSnack).toHaveBeenCalledWith('Error occurred in locating stores, please try again later.', 'error'),
    )
  })
})

describe('LocationTree indentation (Angular qf-tree__node-depth-N)', () => {
  it('indents each node 8px per depth level', () => {
    render(<LocationTree onSelect={() => {}} />)
    const nsw = screen.getByText('NSW').closest('[role="treeitem"]') as HTMLElement
    const nswNode = filterState.treeNodes.find(n => n.code === 'NSW')!
    expect(nsw.style.paddingLeft).toBe(nswNode.depth ? `${nswNode.depth * 8}px` : '')
    fireEvent.click(screen.getByRole('button', { name: 'Expand NSW' }))
    const store = screen.getByText(/Town Hall/).closest('[role="treeitem"]') as HTMLElement
    const storeNode = filterState.treeNodes.find(n => n.code === '1248')!
    expect(storeNode.depth).toBeGreaterThan(0)
    expect(store.style.paddingLeft).toBe(`${storeNode.depth * 8}px`)
  })
})
