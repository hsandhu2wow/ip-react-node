import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useFilter } from '../../../context/FilterContext'
import type { IQFTree } from '../../../types/sqf.types'
import { LocationTree } from './LocationTree'

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
      isLoaded: true, initTree: vi.fn(), setSelectedNode: vi.fn(), setSelectedDate: vi.fn(),
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
