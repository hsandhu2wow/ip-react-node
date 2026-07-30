// src/components/layout/FilterBar/LocationTree.tsx
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useFilter } from '../../../context/FilterContext'
import type { IQFTree } from '../../../types/sqf.types'
import styles from './LocationTree.module.css'

interface Props {
  onSelect: (node: IQFTree) => void
}

/** Returns the set of node codes on the path from the root down to `node` (inclusive). */
function pathToNode(node: IQFTree | null | undefined): Set<string> {
  const codes = new Set<string>()
  let current: IQFTree | null | undefined = node
  while (current) {
    codes.add(current.code)
    current = current.parent
  }
  return codes
}

/**
 * Expandable location tree matching Angular's `app-universal-filter`:
 * a search box, a "YOUR LOCATION" store-locator row, and a collapsible
 * tree (+/- per node, accordion-style — expanding a node collapses its
 * siblings) with search-driven filtering.
 */
export function LocationTree({ onSelect }: Props) {
  const { treeNodes, selectedNode } = useFilter()
  const root = treeNodes[0] ?? null

  const [searchText, setSearchText] = useState('')
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => pathToNode(selectedNode))

  const trimmedSearch = searchText.trim().toLowerCase()
  const searchActive = trimmedSearch.length > 0

  // Nodes matching the search text, plus all of their ancestors — everything
  // else is hidden while a search is active (mirrors Angular's filterChanged).
  const visibleCodes = useMemo(() => {
    if (!searchActive) return null
    const visible = new Set<string>()
    treeNodes
      .filter(n => n.name.toLowerCase().includes(trimmedSearch))
      .forEach(match => pathToNode(match).forEach(code => visible.add(code)))
    return visible
  }, [searchActive, trimmedSearch, treeNodes])

  function toggleNode(node: IQFTree) {
    setExpandedCodes(prev => {
      const next = new Set(prev)
      if (next.has(node.code)) {
        next.delete(node.code)
      } else {
        // Accordion behaviour: collapse sibling branches when opening this one.
        node.parent?.children?.forEach(sibling => {
          if (sibling.code !== node.code) next.delete(sibling.code)
        })
        next.add(node.code)
      }
      return next
    })
  }

  function renderNode(node: IQFTree): ReactNode {
    if (node.hidden || node.alwaysHidden) return null
    if (visibleCodes && !visibleCodes.has(node.code)) return null

    const paddingLeft = node.depth * 8

    if (node.nonClickable) {
      return (
        <div
          key={node.code || node.name}
          className={styles.disabledRow}
          style={{ paddingLeft }}
        >
          <span className={styles.disabledLine} aria-hidden="true" />
          <span>{node.name}</span>
          <span className={styles.disabledLine} aria-hidden="true" />
        </div>
      )
    }

    const hasChildren = !!node.children?.length
    const isExpanded = searchActive ? true : expandedCodes.has(node.code)
    const isSelected = node.code === selectedNode?.code

    return (
      <div key={node.code}>
        <div
          className={`${styles.node} ${isSelected ? styles.nodeSelected : ''}`}
          style={{ paddingLeft }}
          onClick={() => onSelect(node)}
          role="treeitem"
          aria-selected={isSelected}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {hasChildren ? (
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={e => {
                e.stopPropagation()
                toggleNode(node)
              }}
              aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            >
              <span className="material-icons">{isExpanded ? 'remove' : 'add'}</span>
            </button>
          ) : (
            <span className={styles.togglePlaceholder} aria-hidden="true" />
          )}
          <span className={styles.nodeName}>{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children!.map(child => renderNode(child))}</div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.tree} role="tree" aria-label="Location">
      <div className={styles.searchRow}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="SEARCH"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          aria-label="Search locations"
        />
        {searchText ? (
          <button
            type="button"
            className={styles.searchIconBtn}
            onClick={() => setSearchText('')}
            aria-label="Clear search"
          >
            <span className="material-icons">close</span>
          </button>
        ) : (
          <span className={styles.searchIconBtn} aria-hidden="true">
            <span className="material-icons">search</span>
          </span>
        )}
      </div>

      {/* Nearby-store lookup is not yet available in this app — shown as an
          inert row to match the Angular layout. */}
      <div className={styles.locationRow} aria-disabled="true" title="Not available yet">
        <span className={`material-icons ${styles.locationRowIcon}`}>location_off</span>
        <span>YOUR LOCATION</span>
      </div>

      {searchActive && visibleCodes?.size === 0 && (
        <div className={styles.noResults}>No matching locations</div>
      )}

      {root && renderNode(root)}
    </div>
  )
}
