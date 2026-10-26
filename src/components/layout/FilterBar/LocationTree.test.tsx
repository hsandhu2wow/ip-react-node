import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useFilter } from '../../../context/FilterContext'
import type { IQFTree } from '../../../types/sqf.types'
import { LocationTree } from './LocationTree'
import { processFilterResponse, addParents, flattenTree } from '../../../utils/tree'

vi.mock('../../../context/FilterContext', () => ({ useFilter: vi.fn() }))

function node(name: string, depth: number, extra: Partial<IQFTree> = {}): IQFTree {
  return { name, code: name, depth, apiDepth: depth, level: String(depth), level_desc: name, expandable: false, ...extra }
}

describe('LocationTree', () => {
  let root: IQFTree
  let north: IQFTree
  let south: IQFTree
  let store: IQFTree

  beforeEach(() => {
    root = node('National', 0)
    north = node('North', 1, { parent: root })
    south = node('South', 1, { parent: root })
    store = node('Sydney', 2, { parent: north })
    north.children = [store]
    south.children = [node('Melbourne', 2, { parent: south })]
    root.children = [north, south, node('Hidden', 1, { hidden: true }), node('Always hidden', 1, { alwaysHidden: true }), node('Heading', 1, { nonClickable: true })]
    vi.mocked(useFilter).mockReturnValue({
      treeNodes: [root, north, store, south, ...south.children, ...root.children.slice(2)], selectedNode: store,
      selectedDate: '2026-10-19', selectedPeriod: 'WTD', selectedBreakdownAxis: 'childLevel',
      isLoaded: true, breakdownAxisChangeCount: 0, initTree: vi.fn(), setSelectedNode: vi.fn(), setSelectedDate: vi.fn(),
      setSelectedPeriod: vi.fn(), setSelectedBreakdownAxis: vi.fn(),
    })
  })

  it('expands the selected path and selects nodes without selecting on toggle', () => {
    const onSelect = vi.fn()
    render(<LocationTree onSelect={onSelect} />)
    expect(screen.getByRole('treeitem', { name: 'Sydney' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
    expect(screen.queryByText('Always hidden')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Heading'))
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse North' }))
    expect(screen.queryByText('Sydney')).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('South'))
    expect(onSelect).toHaveBeenCalledWith(south)
  })

  it('collapses sibling branches when another is expanded', () => {
    render(<LocationTree onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Expand South' }))
    expect(screen.getByText('Melbourne')).toBeInTheDocument()
    expect(screen.queryByText('Sydney')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand North' })).toBeInTheDocument()
  })

  it('searches case-insensitively with ancestors and restores expansion on clear', () => {
    render(<LocationTree onSelect={vi.fn()} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' MELB ' } })
    expect(screen.getByText('National')).toBeInTheDocument()
    expect(screen.getByText('South')).toBeInTheDocument()
    expect(screen.getByText('Melbourne')).toBeInTheDocument()
    expect(screen.queryByText('North')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByText('Sydney')).toBeInTheDocument()
    expect(screen.queryByText('Melbourne')).not.toBeInTheDocument()
  })

  it('shows a no-results message', () => {
    render(<LocationTree onSelect={vi.fn()} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unknown' } })
    expect(screen.getByText('No matching locations')).toBeInTheDocument()
    expect(screen.queryByRole('treeitem')).not.toBeInTheDocument()
  })

  it('handles a hierarchy that has not loaded', () => {
    vi.mocked(useFilter).mockReturnValue({ ...useFilter(), treeNodes: [], selectedNode: null })
    render(<LocationTree onSelect={vi.fn()} />)
    expect(screen.queryByRole('treeitem')).not.toBeInTheDocument()
  })
})

const getNearbyStores = vi.fn()
const showSnack = vi.fn()
vi.mock('../../../api/sqf', () => ({ getNearbyStores: (...a: unknown[]) => getNearbyStores(...a) }))
vi.mock('../../shared/Snackbar/Snackbar', () => ({ useSnackbar: () => showSnack }))

const root = processFilterResponse([
  { name: 'NSW', code: 'NSW', level: 1, level_desc: 'State', children: [
    { name: 'Town Hall', code: '1248', level: 4, level_desc: 'Store' },
    { name: 'Bondi', code: '1001', level: 4, level_desc: 'Store' },
  ] },
] as never)!
addParents(root)
const filterState = { treeNodes: flattenTree(root), selectedNode: null }

let geoOk = true
afterEach(() => vi.unstubAllGlobals())
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
  beforeEach(() => {
    vi.mocked(useFilter).mockReturnValue({ ...useFilter(), ...filterState })
  })
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
    vi.mocked(useFilter).mockReturnValue({ ...useFilter(), ...filterState })
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
