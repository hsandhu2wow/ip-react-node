// src/components/trend/SubscriptionDialog.tsx
//
// Port of Angular EmailSubscriptionPopupComponent (store-insights
// app/sqf/components/shared/email-subscription-popup), opened from the Weekly Facts /
// My Plan header "Subscription preferences" (mail_outline) button.
import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '../../../shared/components/Dialog/Dialog'
import { useSnackbar } from '../../../shared/components/Snackbar/Snackbar'
import { useOptionalFilter } from '../../../shared/context/FilterContext'
import { getUserSubscriptions, updateUserSubscriptions } from '../api/trend'
import type { IQFTree } from '../../../shared/types/sqf.types'
import type { WfSubscriptionKey } from '../types/wf.types'
import {
  buildPsNote,
  isLocationSelectionInvalid,
  isViewSelectionInvalid,
  type SubscriptionView,
} from './subscription'
import { SubscriptionLocationTree, ADDITIONAL_HIERARCHY_NODES } from './SubscriptionLocationTree'
import styles from './SubscriptionDialog.module.scss'

export interface SubscriptionDialogProps {
  open: boolean
  onClose: () => void
  subscriptionKey: WfSubscriptionKey
  displayName: string
  availableViews: SubscriptionView[]
  /** Store users subscribe to their own store only — no location tree is shown */
  isStoreUser?: boolean
  /** Store user's area of responsibility (Angular userDetails.sqf_area_of_responsibility) */
  areaOfResponsibility?: string
  /** Adds the W-Retail / Metro pseudo-nodes above the tree (SI national users, Weekly Facts) */
  addAdditionalHierarchyNode?: boolean
}

/** Angular creates a fresh popup component per open — mount the body only while open. */
export function SubscriptionDialog({ open, onClose, ...rest }: SubscriptionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} disableClose ariaLabel={`${rest.displayName} subscription preferences`} className={styles.panel}>
      {open && <SubscriptionDialogBody onClose={onClose} {...rest} />}
    </Dialog>
  )
}

function SubscriptionDialogBody({
  onClose,
  subscriptionKey,
  displayName,
  availableViews,
  isStoreUser = false,
  areaOfResponsibility,
  addAdditionalHierarchyNode = false,
}: Omit<SubscriptionDialogProps, 'open'>) {
  const showSnack = useSnackbar()
  const filter = useOptionalFilter()
  const treeNodes = useMemo(() => filter?.treeNodes ?? [], [filter?.treeNodes])

  // Only one view offered → it is pre-checked and can't be unticked.
  const disableCheckbox = availableViews.length === 1
  const [views, setViews] = useState<SubscriptionView[]>(() =>
    availableViews.map(view => ({ ...view, checked: disableCheckbox ? true : view.checked }))
  )
  const [selectedNodes, setSelectedNodes] = useState<IQFTree[]>([])
  const [initialNodes, setInitialNodes] = useState('')
  const [subscribedCodes, setSubscribedCodes] = useState<string[] | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    getUserSubscriptions(subscriptionKey)
      .then(data => {
        if (cancelled) return
        const allNodes = addAdditionalHierarchyNode ? [...ADDITIONAL_HIERARCHY_NODES, ...treeNodes] : treeNodes
        const locations = data.subscribed_locations ?? []
        const subscribedViews = data.subscribed_views ?? []
        if (locations.length === 0 && isStoreUser) {
          setSelectedNodes(allNodes.filter(node => node.code === areaOfResponsibility))
        } else {
          setSelectedNodes(allNodes.filter(node => locations.includes(node.code)))
        }
        const initial = isStoreUser ? '' : JSON.stringify(locations)
        if (!isStoreUser) {
          setInitialNodes(initial)
          setSubscribedCodes(locations)
        }
        if (initial !== '[]' || isStoreUser) {
          setViews(prev => prev.map(view => ({ ...view, checked: subscribedViews.includes(view.name) })))
        }
        setLoadState('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
    // Fetched once per popup open, like the Angular constructor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const viewInvalid = isViewSelectionInvalid(views)
  const locationInvalid = isLocationSelectionInvalid(isStoreUser, selectedNodes.length, initialNodes)
  const psNote = buildPsNote(subscriptionKey, views)
  const checkedCodes = useMemo(() => new Set(selectedNodes.map(node => node.code)), [selectedNodes])

  function nodeToggled(node: IQFTree, isChecked: boolean) {
    setSelectedNodes(prev =>
      isChecked ? [...prev.filter(item => item.code !== node.code), node] : prev.filter(item => item.code !== node.code)
    )
  }

  function viewToggled(name: string, isChecked: boolean) {
    setViews(prev => prev.map(view => (view.name === name ? { ...view, checked: isChecked } : view)))
  }

  function submitForm() {
    if (loadState !== 'ready') return
    if (viewInvalid) {
      showSnack('Please select at least one view to subscribe to', 'error')
      return
    }
    if (locationInvalid) {
      showSnack('Please select at least one location to subscribe to', 'error')
      return
    }
    const selectNodeCodes = selectedNodes.map(node => node.code)
    const selectedViews = views.filter(view => view.checked).map(view => view.name)
    // Angular only saves when the location list differs from what was loaded.
    if (initialNodes !== JSON.stringify(selectNodeCodes)) {
      updateUserSubscriptions(subscriptionKey, selectNodeCodes, selectedViews).then(
        () => {
          onClose()
          showSnack('Subscription preferences are saved successfully')
        },
        () => {
          showSnack('Error occurred while saving Subscription preferences', 'error')
        }
      )
    }
  }

  return (
    <div className={styles.emailSub}>
      <div className={styles.title}>
        <div className={styles.titleHeader}>
          <span>{displayName} subscription preferences</span>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className={styles.subheader}>
          Subscribe to receive {displayName} email updates{!isStoreUser && ' for your preferred locations'} when new
          results becomes available.
        </div>
      </div>
      <div className={styles.body}>
        {loadState === 'loading' && <div role="status">Loading subscription preferences…</div>}
        {loadState === 'error' && <div role="alert" className={styles.error}>
          Unable to load subscription preferences. Close and reopen to try again.
        </div>}
        {views.length > 0 && (
          <div>
            <div className={styles.bodyHeader}>Select views to subscribe to *</div>
            <div className={styles.checkboxes}>
              {views.map(view => (
                <label key={view.name} className={`${styles.checkboxLabel} ${disableCheckbox ? styles.checkboxDisabled : ''}`}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={view.checked}
                    disabled={disableCheckbox || loadState !== 'ready'}
                    onChange={e => viewToggled(view.name, e.target.checked)}
                  />
                  {view.displayName}
                </label>
              ))}
            </div>
            {viewInvalid && <div className={styles.error}>Please select at least one view</div>}
          </div>
        )}
        {!isStoreUser && (
          <div>
            <div className={styles.bodyHeader}>Select locations to subscribe to *</div>
            <SubscriptionLocationTree
              treeNodes={treeNodes}
              checkedCodes={checkedCodes}
              expandCodes={subscribedCodes}
              addAdditionalHierarchyNode={addAdditionalHierarchyNode}
              disabled={loadState !== 'ready'}
              onToggle={nodeToggled}
            />
            {locationInvalid && <div className={styles.error}>Please select at least one location</div>}
          </div>
        )}
        {selectedNodes.length > 0 && !isStoreUser && (
          <div className={styles.location}>
            <span className={styles.locationHeader}>
              Selected locations <span className={styles.locationCount}>{selectedNodes.length}</span>
            </span>
            <div className={styles.locationList}>
              <ul>
                {selectedNodes.map(location => (
                  <li key={location.code}>
                    <span>{location.name} </span>
                  </li>
                ))}
              </ul>
            </div>
            {psNote.length > 0 && (
              <div className={styles.ps}>
                <div className={styles.psNoteDiv}>
                  <strong>Please note you will be receiving emails on</strong>
                </div>
                <div className={styles.psNoteDiv}>
                  {psNote.map((note, index) => (
                    <span key={index}>
                      <strong>{note.label}</strong> {note.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className={styles.buttons}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={loadState !== 'ready' || viewInvalid || locationInvalid}
            onClick={submitForm}
          >
            Save preferences
          </button>
          <button type="button" className={styles.button} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
