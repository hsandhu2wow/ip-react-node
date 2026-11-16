// src/components/layout/FilterBar/LocationTree.tsx
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useFilter } from '../../../shared/context/FilterContext'
import type { IQFTree } from '../../../shared/types/sqf.types'
import { getNearbyStores } from '../../../features/quick-facts/api/sqf'
import { setupNearbyStores, flattenTree } from '../../../shared/utils/tree'
import { useSnackbar } from '../../../shared/components/Snackbar/Snackbar'
import styles from './LocationTree.module.scss'

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
  const { treeNodes: fullTreeNodes, selectedNode } = useFilter()
  const showSnack = useSnackbar()
  const [nearbyRoot, setNearbyRoot] = useState<IQFTree | null>(null)
  const [fetchingNearby, setFetchingNearby] = useState(false)
  const showingNearby = nearbyRoot !== null
  const treeNodes = useMemo(() => (nearbyRoot ? flattenTree(nearbyRoot) : fullTreeNodes), [nearbyRoot, fullTreeNodes])
  const root = nearbyRoot ?? fullTreeNodes[0] ?? null

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

  // Angular SqfStoreLocatorService.getPosition
  function getPosition(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        resp => resolve({ lat: resp.coords.latitude, lng: resp.coords.longitude }),
        () => {
          showSnack("Location access blocked by user, please enable in browser's settings.", 'error')
          resolve(null)
        },
      )
    })
  }

  // Angular universal-filter showNearbyStore: toggles between the nearby-store tree and the full tree
  async function showNearbyStore() {
    if (showingNearby) {
      setNearbyRoot(null)
      return
    }
    setFetchingNearby(true)
    try {
      const location = await getPosition()
      if (!location) return
      let stores
      try {
        stores = await getNearbyStores(location.lat, location.lng)
      } catch {
        showSnack('Error occurred in locating stores, please try again later.', 'error')
        return
      }
      if (stores) setNearbyRoot(setupNearbyStores(stores))
    } finally {
      setFetchingNearby(false)
    }
  }

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
    // Hidden multi-node root: mat-tree expands it, so only its children show
    if (node === root && (node.hidden || node.alwaysHidden)) {
      return <div key="root">{(node.children ?? []).map(child => renderNode(child))}</div>
    }
    if (node.hidden || node.alwaysHidden) return null
    if (visibleCodes && !visibleCodes.has(node.code)) return null

    // Angular .qf-tree__node-depth-N: 8px per level
    const paddingLeft = node.depth ? node.depth * 8 : undefined

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

      <div className={`${styles.locationRow} ${showingNearby ? styles.locationRowSelected : ''}`}>
        <button type="button" className={styles.locationBtn} onClick={showNearbyStore}>
          <span className={`material-icons ${styles.locationRowIcon}`} aria-hidden="true">
            {showingNearby ? 'location_on' : 'location_off'}
          </span>
          YOUR LOCATION
        </button>
        {fetchingNearby && <span className={styles.locationSpinner} role="progressbar" aria-label="Locating stores" />}
      </div>

      {showingNearby && !root?.children?.length && (
        <div className={styles.noStore}>You do not have access to any nearby stores!</div>
      )}

      {searchActive && visibleCodes?.size === 0 && (
        <div className={styles.noResults}>No matching locations</div>
      )}

      {root && renderNode(root)}
    </div>
  )
}
