import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { IQFTree } from '../../../shared/types/sqf.types'
import { SubscriptionLocationTree } from './SubscriptionLocationTree'

function hierarchy() {
  const root: IQFTree = { name: 'National', code: 'N', level: 'National', level_desc: 'National', depth: 0, apiDepth: 0, expandable: true }
  const branch = (name: string): IQFTree => ({
    ...root, name, code: name, depth: 1, apiDepth: 1, parent: root,
  })
  const a = branch('Region A')
  const b = branch('Region B')
  const aStore: IQFTree = { ...a, code: 'A1', name: 'Store A', depth: 2, apiDepth: 2, parent: a }
  const bStore: IQFTree = { ...b, code: 'B1', name: 'Store B', depth: 2, apiDepth: 2, parent: b }
  a.children = [aStore]
  b.children = [bStore]
  root.children = [a, b]
  return { root, a, b, aStore, bStore, flat: [root, a, aStore, b, bStore] }
}

describe('SubscriptionLocationTree', () => {
  it('expands saved ancestors, uses sibling accordions and reports controlled checkbox changes', () => {
    const h = hierarchy()
    const onToggle = vi.fn()
    const props = { treeNodes: h.flat, checkedCodes: new Set(['A1']), expandCodes: ['A1'], addAdditionalHierarchyNode: true, onToggle }
    const { rerender } = render(<SubscriptionLocationTree {...props} />)
    expect(screen.getByRole('checkbox', { name: 'Store A' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Metro' })).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Expand Region B' }))
    expect(screen.queryByRole('checkbox', { name: 'Store A' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Store B' }))
    expect(onToggle).toHaveBeenCalledWith(h.bStore, true)
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Region B' }))
    expect(screen.queryByRole('checkbox', { name: 'Store B' })).not.toBeInTheDocument()
    rerender(<SubscriptionLocationTree {...props} checkedCodes={new Set(['B1'])} expandCodes={['B1']} />)
    expect(screen.getByRole('checkbox', { name: 'Store B' })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Store B' }))
    expect(onToggle).toHaveBeenLastCalledWith(h.bStore, false)
  })

  it('unwraps hidden roots, starts from a descendant and omits nonclickable checkboxes', () => {
    const h = hierarchy()
    h.root.alwaysHidden = true
    h.b.hidden = true
    h.aStore.nonClickable = true
    render(<SubscriptionLocationTree
      treeNodes={[h.a, h.aStore, h.b, h.bStore]} checkedCodes={new Set()} expandCodes={null}
      addAdditionalHierarchyNode={false} onToggle={vi.fn()}
    />)
    expect(screen.queryByRole('checkbox', { name: 'National' })).not.toBeInTheDocument()
    expect(screen.getByText('Store A')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Store A' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Store B' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Region B' })).not.toBeInTheDocument()
  })

  it('renders an empty tree while no hierarchy is available', () => {
    render(<SubscriptionLocationTree treeNodes={[]} checkedCodes={new Set()} expandCodes={[]}
      addAdditionalHierarchyNode={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('tree')).toBeEmptyDOMElement()
  })
})
