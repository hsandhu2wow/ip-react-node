// src/components/trend/SubscriptionLocationTree.tsx
//
// Checkbox variant of the location tree, matching Angular `app-universal-filter` as used
// by the email subscription popup: showDropdown, no search bar, no locator bar,
// hideDepartments, showCheckbox, setSelectedNode=false.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { IQFTree } from '../../types/sqf.types'
import styles from './SubscriptionDialog.module.css'

/** UniversalFilterComponent `addAdditionalHierarchyNode` pseudo-nodes, shown above the tree. */
export const ADDITIONAL_HIERARCHY_NODES: IQFTree[] = [
  { name: 'W-Retail', code: 'w_retail', depth: 0, apiDepth: 0, level: 'National', level_desc: 'National', children: [], expandable: false },
  { name: 'Metro', code: 'metro', depth: 0, apiDepth: 0, level: 'National', level_desc: 'National', children: [], expandable: false },
]

interface Props {
  /** Flat, visible tree nodes from FilterContext (populated by useFilterTree) */
  treeNodes: IQFTree[]
  checkedCodes: Set<string>
  /** Codes whose ancestors get expanded once saved subscriptions load (SqfFilterService.setNodeCheckboxes) */
  expandCodes: string[] | null
  addAdditionalHierarchyNode: boolean
  onToggle: (node: IQFTree, isChecked: boolean) => void
}

function getRoot(treeNodes: IQFTree[]): IQFTree | null {
  let root: IQFTree | undefined = treeNodes[0]
  while (root?.parent) root = root.parent
  return root ?? null
}

/** Angular expands the default node: the root, or its first child when the root is hidden. */
function initialExpanded(root: IQFTree | null): Set<string> {
  if (!root) return new Set()
  const node = root.alwaysHidden ? root.children?.[0] : root
  return new Set(node ? [node.code] : [])
}

export function SubscriptionLocationTree({ treeNodes, checkedCodes, expandCodes, addAdditionalHierarchyNode, onToggle }: Props) {
  const root = getRoot(treeNodes)
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => initialExpanded(root))

  useEffect(() => {
    if (!expandCodes?.length) return
    setExpandedCodes(prev => {
      const next = new Set(prev)
      treeNodes
        .filter(node => expandCodes.includes(node.code))
        .forEach(node => {
          let parent = node.parent
          while (parent) {
            next.add(parent.code)
            parent = parent.parent
          }
        })
      return next
    })
  }, [expandCodes, treeNodes])

  function toggleNode(node: IQFTree) {
    setExpandedCodes(prev => {
      const next = new Set(prev)
      if (next.has(node.code)) {
        next.delete(node.code)
      } else {
        // Accordion: expanding a node collapses its siblings (UniversalFilterComponent.toggleNode).
        node.parent?.children?.forEach(sibling => next.delete(sibling.code))
        next.add(node.code)
      }
      return next
    })
  }

  function renderCheckbox(node: IQFTree) {
    const checked = checkedCodes.has(node.code)
    return (
      <input
        type="checkbox"
        className={`${styles.checkbox} ${styles.treeCheckbox}`}
        checked={checked}
        onChange={e => onToggle(node, e.target.checked)}
        aria-label={node.name}
      />
    )
  }

  function renderNode(node: IQFTree): ReactNode {
    if (node.hidden || node.alwaysHidden) {
      return node.children?.map(child => renderNode(child))
    }
    const paddingLeft = node.depth * 8

    if (node.nonClickable) {
      return (
        <div key={node.code || node.name} className={styles.treeDisabledRow} style={{ paddingLeft }}>
          <span className={styles.treeDisabledLine} aria-hidden="true" />
          <span>{node.name}</span>
          <span className={styles.treeDisabledLine} aria-hidden="true" />
        </div>
      )
    }

    const hasChildren = !!node.children?.length
    const isExpanded = expandedCodes.has(node.code)
    return (
      <div key={node.code}>
        <div
          className={styles.treeNode}
          style={{ paddingLeft }}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={checkedCodes.has(node.code)}
        >
          {hasChildren ? (
            <button
              type="button"
              className={styles.treeToggle}
              onClick={() => toggleNode(node)}
              aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            >
              <span className="material-icons">{isExpanded ? 'remove' : 'add'}</span>
            </button>
          ) : (
            <span className={styles.treeLeafSpacer} aria-hidden="true" />
          )}
          {renderCheckbox(node)}
          <span className={styles.treeName}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && node.children!.map(child => renderNode(child))}
      </div>
    )
  }

  return (
    <div className={styles.tree} role="tree" aria-label="Select locations to subscribe to">
      {addAdditionalHierarchyNode && ADDITIONAL_HIERARCHY_NODES.map(node => renderNode(node))}
      {root && renderNode(root)}
    </div>
  )
}
