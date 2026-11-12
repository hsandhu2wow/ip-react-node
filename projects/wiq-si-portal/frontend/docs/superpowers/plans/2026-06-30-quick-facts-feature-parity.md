# Quick Facts Feature Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the React `/quick-facts` routes to full feature parity with the Angular DSA `app-sqf-summary-card` and `app-sqf-details-card` components from the `navigation-and-dashboards-changes` branch.

**Architecture:** Create two purpose-built card components — `SummaryCard` (for `/quick-facts/summary`) and `DetailsCard` (for `/quick-facts/details/:type`) — mirroring the Angular component structure exactly. Add a shared `InfoModal` dialog. Update `SummaryPage` and `DetailsPage` to use the new components.

**Tech Stack:** React 18, TypeScript, React Router v6, CSS Modules, Vitest + React Testing Library, `@tanstack/react-query`

**Reference codebase:** `/Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights/store-insights/src/app/sqf/components/sqf-metric-card/` (branch: `navigation-and-dashboards-changes`)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/types/sqf.types.ts` | Add missing type fields |
| Modify | `src/utils/formatters.ts` | Add `isCutOffTimePast` helper |
| Modify | `src/utils/formatters.test.ts` | Add `isCutOffTimePast` tests |
| Create | `src/components/shared/InfoModal/InfoModal.tsx` | Reusable modal for "Metrics Info" |
| Create | `src/components/shared/InfoModal/InfoModal.module.css` | Modal styles |
| Create | `src/components/shared/InfoModal/InfoModal.test.tsx` | Modal tests |
| Create | `src/components/cards/SummaryCard/SummaryCard.tsx` | Full summary card |
| Create | `src/components/cards/SummaryCard/SummaryCard.module.css` | Summary card styles |
| Create | `src/components/cards/SummaryCard/SummaryCard.test.tsx` | Summary card tests |
| Create | `src/components/cards/DetailsCard/DetailsCard.tsx` | Full details card |
| Create | `src/components/cards/DetailsCard/DetailsCard.module.css` | Details card styles |
| Create | `src/components/cards/DetailsCard/DetailsCard.test.tsx` | Details card tests |
| Modify | `src/pages/quick-facts/SummaryPage.tsx` | Swap `MetricCard` → `SummaryCard` |
| Modify | `src/pages/quick-facts/DetailsPage.tsx` | Swap `MetricCard` → `DetailsCard` |

---

## Task 1: Update ISQFMetricCard types

**Files:**
- Modify: `src/types/sqf.types.ts`

- [ ] **Step 1: Add missing fields to ISQFMetricCard and related interfaces**

Open `src/types/sqf.types.ts`. Make the following targeted additions:

Add to `ISQFInfoNumber` (after `infoMessage?`):
```ts
val?: number          // raw numeric value used for sorting in DetailsPage
```

Add a new interface `IExpandableListItem` after `ISQFTabData`:
```ts
/** One item in an expandable list section of a summary card */
export interface IExpandableListItem {
  header: string        // raw HTML shown as the clickable row header
  content?: string      // raw HTML shown when expanded
  isExpanded?: boolean  // whether item starts expanded
}
```

Add to `ISQFMetricCard` (after `sortByVal?`):
```ts
// Card content extensions
updatedTime?: string                              // ISO date or displayable time string from API
dataInfo?: { title: string; body: string }        // "Metrics Info" popup content
subHeading?: string                               // label above KPI numbers
customInfoNumbers?: string                        // raw HTML replacing infoNumbers display
richText?: string                                 // raw HTML block after chart
expandable_list?: IExpandableListItem[]
customDrillDownText?: string                      // overrides "details" label in footer link
autoExpandForMobile?: boolean                     // auto-expand table on mobile
keys?: Record<string, string>                     // identifies this card within a filtered card.cards[]
```

Change the existing `filterKeys` field from:
```ts
filterKeys?: string[]
```
to:
```ts
filterKeys?: Record<string, string>   // { cardKeysColKey → dropdownKey }
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to `sqf.types.ts`).

- [ ] **Step 3: Commit**

```bash
git add src/types/sqf.types.ts
git commit -m "types: add missing ISQFMetricCard fields for feature parity

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Add isCutOffTimePast to formatters

`REPORTING_PERIODS` already exists in `src/utils/formatters.ts`. We only need to add `isCutOffTimePast`.

**Files:**
- Modify: `src/utils/formatters.ts`
- Modify: `src/utils/formatters.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/utils/formatters.test.ts`:

```ts
import { isCutOffTimePast } from './formatters'

describe('isCutOffTimePast', () => {
  it('returns true when cut-off time is in the past', () => {
    // 00:00:00 UTC is always in the past by the time any test runs
    expect(isCutOffTimePast('00:00:00')).toBe(true)
  })

  it('returns false when cut-off time is far in the future', () => {
    // 23:59:59 UTC will always be in the future during any reasonable test run (before midnight UTC)
    const now = new Date()
    const futureHour = (now.getUTCHours() + 2) % 24
    const futureStr = String(futureHour).padStart(2, '0') + ':59:59'
    expect(isCutOffTimePast(futureStr)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/utils/formatters.test.ts 2>&1 | tail -20
```

Expected: FAIL — `isCutOffTimePast is not a function`.

- [ ] **Step 3: Implement isCutOffTimePast in formatters.ts**

Add to the end of `src/utils/formatters.ts`:

```ts
/**
 * Returns true when the given UTC cut-off time string (HH:MM:SS) is in the past.
 * Used to decide whether to show "data will be ready by X" or a generic error.
 */
export function isCutOffTimePast(cutOffTime: string): boolean {
  const now = new Date()
  const [hh, mm, ss = 0] = cutOffTime.split(':').map(Number)
  const cutOff = new Date()
  cutOff.setUTCHours(hh, mm, ss, 0)
  return now >= cutOff
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/utils/formatters.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/formatters.ts src/utils/formatters.test.ts
git commit -m "feat: add isCutOffTimePast utility to formatters

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Create InfoModal component

**Files:**
- Create: `src/components/shared/InfoModal/InfoModal.tsx`
- Create: `src/components/shared/InfoModal/InfoModal.module.css`
- Create: `src/components/shared/InfoModal/InfoModal.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/shared/InfoModal/InfoModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InfoModal } from './InfoModal'

describe('InfoModal', () => {
  it('renders title and body', () => {
    render(<InfoModal title="My Title" body="<p>My body</p>" onClose={() => {}} />)
    expect(screen.getByText('My Title')).toBeDefined()
    expect(document.querySelector('[data-testid="info-modal-body"]')).not.toBeNull()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal title="T" body="B" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('info-modal-close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal title="T" body="B" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('info-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when dialog content is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal title="T" body="B" onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/components/shared/InfoModal/InfoModal.test.tsx 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create InfoModal.module.css**

Create `src/components/shared/InfoModal/InfoModal.module.css`:

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-surface);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}

.closeBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: var(--color-text-secondary);
  line-height: 1;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.closeBtn:hover { color: var(--color-text); }

.body {
  padding: 16px 20px;
  overflow-y: auto;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.6;
}
```

- [ ] **Step 4: Create InfoModal.tsx**

Create `src/components/shared/InfoModal/InfoModal.tsx`:

```tsx
import styles from './InfoModal.module.css'

interface Props {
  title: string
  body: string
  onClose: () => void
}

export function InfoModal({ title, body, onClose }: Props) {
  return (
    <div
      className={styles.backdrop}
      data-testid="info-modal-backdrop"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span id="info-modal-title" className={styles.title}>{title}</span>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            data-testid="info-modal-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div
          className={styles.body}
          data-testid="info-modal-body"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npx vitest run src/components/shared/InfoModal/InfoModal.test.tsx 2>&1 | tail -10
```

Expected: all 4 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/InfoModal/
git commit -m "feat: add InfoModal shared component

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Create SummaryCard component

Mirrors Angular `app-sqf-summary-card`. Reference: `/Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights/store-insights/src/app/sqf/components/sqf-metric-card/sqf-summary-card/sqf-summary-card.component.html`

**Files:**
- Create: `src/components/cards/SummaryCard/SummaryCard.tsx`
- Create: `src/components/cards/SummaryCard/SummaryCard.module.css`
- Create: `src/components/cards/SummaryCard/SummaryCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/cards/SummaryCard/SummaryCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SummaryCard } from './SummaryCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

function renderCard(props: Parameters<typeof SummaryCard>[0]) {
  return render(
    <MemoryRouter>
      <SummaryCard {...props} />
    </MemoryRouter>
  )
}

const baseCard: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'summary',
  cardTitle: 'Sales',
  cardHeader: '#219653',
  infoNumbers: [{ displayValue: '$1.2M', text: 'WTD', color: '#219653' }],
  updatedTime: '2026-06-29T22:00:00Z',
}

describe('SummaryCard', () => {
  it('renders skeleton when isLoading=true', () => {
    renderCard({ isLoading: true })
    expect(document.querySelector('[data-testid="metric-card-skeleton"]')).not.toBeNull()
  })

  it('renders nothing when card.hidden=true', () => {
    const { container } = renderCard({ card: { ...baseCard, hidden: true } })
    expect(container.firstChild).toBeNull()
  })

  it('renders card title', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('Sales')).toBeDefined()
  })

  it('renders KPI displayValue', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('$1.2M')).toBeDefined()
  })

  it('shows recognize button when cardHeader is green (not red/neutral)', () => {
    renderCard({ card: baseCard })
    expect(document.querySelector('[data-testid="recognize-btn"]')).not.toBeNull()
  })

  it('hides recognize button when cardHeader is red (#eb5757)', () => {
    renderCard({ card: { ...baseCard, cardHeader: '#eb5757' } })
    expect(document.querySelector('[data-testid="recognize-btn"]')).toBeNull()
  })

  it('hides recognize button when cardHeader is neutral (#ebecec)', () => {
    renderCard({ card: { ...baseCard, cardHeader: '#ebecec' } })
    expect(document.querySelector('[data-testid="recognize-btn"]')).toBeNull()
  })

  it('renders "Go to details" link when isDetailsPageAvailable', () => {
    renderCard({ card: { ...baseCard, isDetailsPageAvailable: true } })
    expect(screen.getByText(/Go to details/)).toBeDefined()
  })

  it('renders custom drill-down label when customDrillDownText is set', () => {
    renderCard({ card: { ...baseCard, isDetailsPageAvailable: true, customDrillDownText: 'store view' } })
    expect(screen.getByText(/Go to store view/)).toBeDefined()
  })

  it('shows expand toggle when tableData is present', () => {
    renderCard({
      card: {
        ...baseCard,
        tableData: { type: 'basic', headers: ['Name'], data: [] },
        updatedTime: '2026-06-29T22:00:00Z',
      },
    })
    expect(screen.getByTestId('expand-toggle')).toBeDefined()
  })

  it('shows filter error when dropdown combo has no match', () => {
    const cardWithFilters: ISQFMetricCard = {
      ...baseCard,
      cards: [
        { cardName: 'sales-wtd', cardType: 'summary', keys: { period: 'wtd' }, infoNumbers: [] },
      ],
      filterKeys: { period: 'periodDd' },
      dropdowns: [{ key: 'periodDd', icon: 'calendar_today', data: [{ key: 'mtd', text: 'MTD' }] }],
    }
    renderCard({ card: cardWithFilters })
    expect(screen.getByText(/Data temporarily unavailable/)).toBeDefined()
  })

  it('shows generic error card', () => {
    renderCard({
      card: { ...baseCard, error: { generic: true, support_email: 'help@example.com' } },
    })
    expect(screen.getByText(/unavailable/i)).toBeDefined()
  })

  it('shows Metrics Info button when dataInfo is present', () => {
    renderCard({ card: { ...baseCard, updatedTime: '2026-06-29T22:00:00Z', dataInfo: { title: 'Info', body: '<p>desc</p>' } } })
    expect(screen.getByTestId('metrics-info-btn')).toBeDefined()
  })

  it('opens InfoModal when Metrics Info button is clicked', () => {
    renderCard({ card: { ...baseCard, updatedTime: '2026-06-29T22:00:00Z', dataInfo: { title: 'My Info', body: '<p>desc</p>' } } })
    fireEvent.click(screen.getByTestId('metrics-info-btn'))
    expect(screen.getByText('My Info')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/components/cards/SummaryCard/SummaryCard.test.tsx 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create SummaryCard.module.css**

Create `src/components/cards/SummaryCard/SummaryCard.module.css`:

```css
/* ── Base card ── */
.card {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-top: 4px solid var(--color-neutral);
  padding: 10px 12px 0;
}

.headerLeft { flex: 1; min-width: 0; }

.cardTitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subTitle {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.subTitleItem {
  display: flex;
  align-items: center;
  gap: 3px;
}

.subTitleIcon { font-size: 14px; }

.dropdownSelect {
  font-size: 12px;
  font-family: inherit;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
}

.headerRight { flex-shrink: 0; padding-top: 2px; }

.recognizeBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}
.recognizeBtn:hover { color: var(--color-primary); }
.recognizeBtn:disabled { opacity: 0.5; cursor: default; }

/* ── Content ── */
.content { display: flex; flex-direction: column; flex: 1; }

.contentTop { padding: 4px 12px 0; }

.subHeading {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

/* ── KPI numbers ── */
.kpiRow { display: flex; align-items: stretch; padding: 4px 12px 8px; }
.kpiCol { display: flex; flex-direction: column; padding-right: 14px; }
.kpiCol:not(:first-child) { padding-left: 14px; }
.kpiValue { font-size: 20px; font-weight: 700; line-height: 1.1; color: var(--color-text); }
.kpiLabel {
  font-size: 12px;
  color: var(--color-text);
  margin-top: 3px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}
.kpiDivider { width: 1px; background: #e0e0e0; margin: 2px 0; flex-shrink: 0; }

.infoIcon {
  font-size: 13px;
  cursor: pointer;
  color: var(--color-text-secondary);
  position: relative;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.tooltipWrapper { position: relative; display: inline-flex; }

/* ── Custom info numbers ── */
.customInfoNumbers { padding: 4px 12px 8px; }

/* ── Chart ── */
.chartArea { padding: 0 12px; margin: 8px 0; flex: 1; }

/* ── Rich text ── */
.richText { padding: 0 12px 8px; font-size: 13px; color: var(--color-text); }

/* ── Tabs / Table collapsible wrapper ── */
.collapsible { overflow: hidden; }
.collapsible:not(.collapsibleExpanded) { max-height: 0; }
.collapsibleExpanded { max-height: none; }

.tabsArea { }
.tableArea { }

/* ── Expandable list ── */
.expandableList { border-top: 1px solid var(--color-border); }

.expandableItem {
  border-bottom: 1px solid var(--color-border);
}
.expandableItemLast { border-bottom: none; }

.expandableHeader {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--color-text);
  user-select: none;
}
.expandableHeader:hover { background: rgba(0,0,0,0.02); }

.expandableContent {
  padding: 0 12px 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* ── Footer ── */
.footer { margin-top: auto; }

.footerLinks {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
}

.detailsLink {
  color: var(--color-blue);
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}
.detailsLink:hover { text-decoration: underline; }

.expandToggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font-family);
  padding: 0;
}
.expandToggle:hover { color: var(--color-primary); }

.footerMeta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  min-height: 36px;
}

.updateDate { font-size: 12px; color: var(--color-text-secondary); }

.metricsInfoBtn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  padding: 0;
}
.metricsInfoBtn:hover { color: var(--color-text); }

/* ── Errors ── */
.errorContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}
.errorHeading { font-size: 15px; font-weight: 700; color: var(--color-text); margin-bottom: 8px; }
.errorSubtext { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
.errorLink { color: var(--color-blue); }

/* ── Loading spinner ── */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 4: Create SummaryCard.tsx**

Create `src/components/cards/SummaryCard/SummaryCard.tsx`:

```tsx
import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { ISQFMetricCard, ISQFInfoNumber, IExpandableListItem } from '../../../types/sqf.types'
import { MetricCardSkeleton } from '../MetricCard/MetricCardSkeleton'
import { MetricCardChart } from '../MetricCard/MetricCardChart'
import { MetricCardTable } from '../MetricCard/MetricCardTable'
import { MetricCardTabs } from '../MetricCard/MetricCardTabs'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import { REPORTING_PERIODS, isCutOffTimePast } from '../../../utils/formatters'
import styles from './SummaryCard.module.css'

const RED = '#eb5757'
const NEUTRAL = '#ebecec'

function shouldShowRecognize(cardHeader?: string): boolean {
  if (!cardHeader) return false
  const h = cardHeader.toLowerCase()
  return h !== RED && h !== NEUTRAL
}

/** Initialise selectedFilters from first value of each dropdown */
function buildInitialFilters(card: ISQFMetricCard): Record<string, string> {
  const filters: Record<string, string> = {}
  if (!card.filterKeys || !card.dropdowns) return filters
  for (const dropdownKey of Object.values(card.filterKeys)) {
    const dd = card.dropdowns.find(d => d.key === dropdownKey)
    if (dd?.data.length) filters[dropdownKey] = dd.data[0].key
  }
  return filters
}

/** Find the matching sub-card from card.cards[] for the current filter selection */
function getFilteredSubCard(
  card: ISQFMetricCard,
  selectedFilters: Record<string, string>
): ISQFMetricCard | null {
  if (!card.cards || !card.filterKeys) return null
  const filters = Object.entries(card.filterKeys).map(([colKey, dropdownKey]) => ({
    colKey,
    value: selectedFilters[dropdownKey],
  }))
  return (
    card.cards.find(c =>
      filters.every(
        ({ colKey, value }) => (c.keys as Record<string, string>)?.[colKey] === value
      )
    ) ?? null
  )
}

// ── Expandable list item ────────────────────────────────────────────────────
function ExpandableItem({
  item,
  isLast,
}: {
  item: IExpandableListItem
  isLast: boolean
}) {
  const [open, setOpen] = useState(item.isExpanded ?? false)
  return (
    <div className={`${styles.expandableItem} ${isLast ? styles.expandableItemLast : ''}`}>
      <div
        className={styles.expandableHeader}
        onClick={() => setOpen(o => !o)}
        dangerouslySetInnerHTML={{ __html: item.header }}
      />
      {item.content && open && (
        <div
          className={styles.expandableContent}
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      )}
    </div>
  )
}

// ── KPI info tooltip ────────────────────────────────────────────────────────
function KpiNumber({ kpi }: { kpi: ISQFInfoNumber }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className={styles.kpiCol}>
      <div className={styles.kpiValue} style={{ color: kpi.color || 'inherit' }}>
        {kpi.displayValue}
      </div>
      <div className={styles.kpiLabel}>
        {kpi.text}
        {kpi.infoMessage && (
          <div className={styles.tooltipWrapper}>
            <span
              className={styles.infoIcon}
              onClick={() => setShowTooltip(v => !v)}
              aria-label="More info"
            >
              ℹ
            </span>
            {showTooltip && (
              <div className={styles.tooltip}>{kpi.infoMessage}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
  /** When true the table is always shown expanded and the toggle is hidden */
  expandTable?: boolean
}

export function SummaryCard({ card, isLoading, expandTable }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [recognizeLoading, setRecognizeLoading] = useState(false)

  // Reset filters and expansion state when the card changes
  useEffect(() => {
    if (!card) return
    if (card.cards) setSelectedFilters(buildInitialFilters(card))
    setExpanded(Boolean(card.autoExpandForMobile))
  }, [card?.cardName])

  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null

  // ── Resolve the active content card ────────────────────────────────────
  let contentCard: ISQFMetricCard | null = card
  if (card.cards && card.filterKeys) {
    contentCard = getFilteredSubCard(card, selectedFilters)
  }
  const hasFilterError = card.cards != null && contentCard == null

  // ── Derived display values ──────────────────────────────────────────────
  const borderColor = card.cardHeader || 'var(--color-neutral)'
  const location = card.location?.split('-')[0].trim()
  const reportingPeriodKey = contentCard?.reportingPeriod ?? card.reportingPeriod
  const reportingPeriod = reportingPeriodKey
    ? REPORTING_PERIODS[reportingPeriodKey] ?? reportingPeriodKey
    : undefined
  const showRecognize = shouldShowRecognize(card.cardHeader)
  const cutOffPast = card.error?.cutOffTime ? isCutOffTimePast(card.error.cutOffTime) : false

  const { infoNumbers, customInfoNumbers, chartData, tabs, tableData, richText, subHeading } =
    contentCard ?? ({} as ISQFMetricCard)
  const hasTopContent = !!(infoNumbers || customInfoNumbers || chartData || subHeading)
  const hasCollapsible = !!(tableData || tabs)
  const showFooter = !!(
    card.isDetailsPageAvailable ||
    card.customDrillDownText ||
    card.updatedTime ||
    hasCollapsible
  )

  function handleFilterChange(dropdownKey: string, value: string) {
    setSelectedFilters(prev => ({ ...prev, [dropdownKey]: value }))
    setExpanded(true)
  }

  function handleRecognize() {
    setRecognizeLoading(true)
    // UI-only: simulate async action
    setTimeout(() => setRecognizeLoading(false), 1500)
  }

  // ── Error: card-level ───────────────────────────────────────────────────
  if (card.error) {
    return (
      <div className={styles.card} id={card.jsId} data-testid="summary-card-error">
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
          </div>
        </div>
        <div className={styles.errorContent}>
          {card.error.cutOffTime && !cutOffPast ? (
            <>
              <p className={styles.errorHeading}>
                Data refresh is expected to complete by {card.error.cutOffTime}
              </p>
              <p className={styles.errorSubtext}>Check back soon.</p>
            </>
          ) : (
            <>
              <p className={styles.errorHeading}>Data currently unavailable</p>
              <p className={styles.errorSubtext}>
                For any concerns please contact:{' '}
                {card.error.support_email && (
                  <a className={styles.errorLink} href={`mailto:${card.error.support_email}`}>
                    {card.error.support_email}
                  </a>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.card} id={card.jsId}>
        {/* ── Header ── */}
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
            <div className={styles.subTitle}>
              {location && (
                <span className={styles.subTitleItem}>
                  <span className={styles.subTitleIcon}>📍</span>
                  {location}
                </span>
              )}
              {reportingPeriod && (
                <span className={styles.subTitleItem}>
                  <span className={styles.subTitleIcon}>📅</span>
                  {reportingPeriod}
                </span>
              )}
              {card.dropdowns?.map(dd => (
                <span key={dd.key} className={styles.subTitleItem}>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedFilters[dd.key] ?? ''}
                    onChange={e => handleFilterChange(dd.key, e.target.value)}
                    aria-label={dd.key}
                  >
                    {dd.data.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.text}
                      </option>
                    ))}
                  </select>
                </span>
              ))}
            </div>
          </div>
          {showRecognize && (
            <div className={styles.headerRight}>
              <button
                className={styles.recognizeBtn}
                onClick={handleRecognize}
                disabled={recognizeLoading}
                data-testid="recognize-btn"
                aria-label="Recognize team"
              >
                {recognizeLoading ? <span className={styles.spinner} /> : '🎉'}
              </button>
            </div>
          )}
        </div>

        {/* ── Filter error ── */}
        {hasFilterError && (
          <div className={styles.errorContent}>
            <p className={styles.errorHeading}>Data temporarily unavailable</p>
            <p className={styles.errorSubtext}>Our team is investigating.</p>
          </div>
        )}

        {/* ── Content ── */}
        {!hasFilterError && (
          <div className={styles.content}>
            {hasTopContent && (
              <div className={styles.contentTop}>
                {subHeading && (
                  <div className={styles.subHeading}>{subHeading}</div>
                )}
                {infoNumbers && !customInfoNumbers && (
                  <div className={styles.kpiRow}>
                    {infoNumbers.map((kpi, i) => (
                      <Fragment key={i}>
                        {i > 0 && <div className={styles.kpiDivider} />}
                        <KpiNumber kpi={kpi} />
                      </Fragment>
                    ))}
                  </div>
                )}
                {customInfoNumbers && (
                  <div
                    className={styles.customInfoNumbers}
                    dangerouslySetInnerHTML={{ __html: customInfoNumbers }}
                  />
                )}
                {chartData && (
                  <div className={styles.chartArea}>
                    <MetricCardChart chartData={chartData} />
                  </div>
                )}
                {richText && (
                  <div
                    className={styles.richText}
                    dangerouslySetInnerHTML={{ __html: richText }}
                  />
                )}
              </div>
            )}

            {tabs && (
              <div className={`${styles.collapsible} ${expanded || expandTable ? styles.collapsibleExpanded : ''}`}>
                <div className={styles.tabsArea}>
                  <MetricCardTabs tabs={tabs} />
                </div>
              </div>
            )}

            {tableData && (
              <div className={`${styles.collapsible} ${expanded || expandTable ? styles.collapsibleExpanded : ''}`}>
                <div className={styles.tableArea}>
                  <MetricCardTable tableData={tableData} />
                </div>
              </div>
            )}

            {card.expandable_list && (
              <div className={styles.expandableList}>
                {card.expandable_list.map((item, i) => (
                  <ExpandableItem
                    key={i}
                    item={item}
                    isLast={i === (card.expandable_list?.length ?? 0) - 1}
                  />
                ))}
              </div>
            )}

            {/* ── Footer ── */}
            {showFooter && (
              <div className={styles.footer}>
                {(card.isDetailsPageAvailable || card.customDrillDownText || hasCollapsible) && (
                  <div className={styles.footerLinks}>
                    <div>
                      {(card.isDetailsPageAvailable || card.customDrillDownText) && (
                        <Link
                          to={`/quick-facts/details/${card.cardName}`}
                          className={styles.detailsLink}
                        >
                          Go to {card.customDrillDownText || 'details'}
                        </Link>
                      )}
                    </div>
                    {hasCollapsible && !expandTable && (
                      <button
                        className={styles.expandToggle}
                        onClick={() => setExpanded(e => !e)}
                        data-testid="expand-toggle"
                      >
                        {expanded ? 'Collapse' : 'Expand'}
                        <span>{expanded ? ' ▲' : ' ▼'}</span>
                      </button>
                    )}
                  </div>
                )}
                {card.updatedTime && (
                  <div className={styles.footerMeta}>
                    <span className={styles.updateDate}>
                      Updated at {new Date(card.updatedTime).toLocaleString('en-AU', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                    {card.dataInfo && (
                      <button
                        className={styles.metricsInfoBtn}
                        onClick={() => setInfoModalOpen(true)}
                        data-testid="metrics-info-btn"
                      >
                        Metrics Info ℹ
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── InfoModal (portal-like, rendered after card) ── */}
      {infoModalOpen && card.dataInfo && (
        <InfoModal
          title={card.dataInfo.title}
          body={card.dataInfo.body}
          onClose={() => setInfoModalOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 5: Run SummaryCard tests — expect PASS**

```bash
npx vitest run src/components/cards/SummaryCard/SummaryCard.test.tsx 2>&1 | tail -20
```

Expected: all 14 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/SummaryCard/
git commit -m "feat: add SummaryCard component with full feature parity

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Create DetailsCard component

Mirrors Angular `app-sqf-details-card`. Two-column layout: left (KPIs + chart), right (table/tabs + drill-down link).

**Files:**
- Create: `src/components/cards/DetailsCard/DetailsCard.tsx`
- Create: `src/components/cards/DetailsCard/DetailsCard.module.css`
- Create: `src/components/cards/DetailsCard/DetailsCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/cards/DetailsCard/DetailsCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DetailsCard } from './DetailsCard'
import type { ISQFMetricCard } from '../../../types/sqf.types'

function renderCard(props: Parameters<typeof DetailsCard>[0]) {
  return render(
    <MemoryRouter>
      <DetailsCard {...props} />
    </MemoryRouter>
  )
}

const baseCard: ISQFMetricCard = {
  cardName: 'sales',
  cardType: 'details',
  cardTitle: 'Store 1234',
  cardHeader: '#219653',
  infoNumbers: [{ displayValue: '$1.2M', text: 'WTD', color: '#219653' }],
  updatedTime: '2026-06-29T22:00:00Z',
}

describe('DetailsCard', () => {
  it('renders skeleton when isLoading=true', () => {
    renderCard({ isLoading: true })
    expect(document.querySelector('[data-testid="metric-card-skeleton"]')).not.toBeNull()
  })

  it('renders nothing when card.hidden=true', () => {
    const { container } = renderCard({ card: { ...baseCard, hidden: true } })
    expect(container.firstChild).toBeNull()
  })

  it('renders card title', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('Store 1234')).toBeDefined()
  })

  it('renders KPI value', () => {
    renderCard({ card: baseCard })
    expect(screen.getByText('$1.2M')).toBeDefined()
  })

  it('shows recognize button when cardHeader is not red/neutral', () => {
    renderCard({ card: baseCard })
    expect(document.querySelector('[data-testid="details-recognize-btn"]')).not.toBeNull()
  })

  it('hides recognize button when cardHeader is red', () => {
    renderCard({ card: { ...baseCard, cardHeader: '#eb5757' } })
    expect(document.querySelector('[data-testid="details-recognize-btn"]')).toBeNull()
  })

  it('shows updated time in footer', () => {
    renderCard({ card: baseCard })
    expect(screen.getByTestId('details-updated-time')).toBeDefined()
  })

  it('shows Metrics Info button when dataInfo is present', () => {
    renderCard({ card: { ...baseCard, dataInfo: { title: 'Info', body: '<p>body</p>' } } })
    expect(screen.getByTestId('details-metrics-info-btn')).toBeDefined()
  })

  it('opens InfoModal when Metrics Info is clicked', () => {
    renderCard({ card: { ...baseCard, dataInfo: { title: 'My Info', body: '<p>body</p>' } } })
    fireEvent.click(screen.getByTestId('details-metrics-info-btn'))
    expect(screen.getByText('My Info')).toBeDefined()
  })

  it('hides left column when tableOnly=true', () => {
    renderCard({ card: { ...baseCard, tableOnly: true, tableData: { type: 'basic', headers: [], data: [] } } })
    expect(document.querySelector('[data-testid="details-left-col"]')).toBeNull()
  })

  it('shows filter error when no sub-card matches', () => {
    const card: ISQFMetricCard = {
      ...baseCard,
      cards: [{ cardName: 'sales-wtd', cardType: 'details', keys: { period: 'wtd' }, infoNumbers: [] }],
      filterKeys: { period: 'periodDd' },
      dropdowns: [{ key: 'periodDd', icon: 'calendar_today', data: [{ key: 'mtd', text: 'MTD' }] }],
    }
    renderCard({ card })
    expect(screen.getByText(/Data temporarily unavailable/)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/components/cards/DetailsCard/DetailsCard.test.tsx 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create DetailsCard.module.css**

Create `src/components/cards/DetailsCard/DetailsCard.module.css`:

```css
/* ── Base card ── */
.card {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  min-height: 388px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 0 auto 24px;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-top: 4px solid var(--color-neutral);
  padding: 10px 12px 0;
}

.headerLeft { flex: 1; min-width: 0; }

.cardTitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.subTitle {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 12px;
  margin-bottom: 8px;
}

.subTitleItem { display: flex; align-items: center; gap: 3px; }

.dropdownSelect {
  font-size: 12px;
  font-family: inherit;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
}

.headerRight { flex-shrink: 0; padding-top: 2px; }

.recognizeBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}
.recognizeBtn:hover { color: var(--color-primary); }
.recognizeBtn:disabled { opacity: 0.5; cursor: default; }

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Two-column content ── */
.content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

@media (max-width: 600px) {
  .content { flex-direction: column; }
}

.leftCol {
  display: flex;
  flex-direction: column;
  width: 240px;
  flex-shrink: 0;
  padding: 8px 12px;
  border-right: 1px solid var(--color-border);
}

@media (max-width: 600px) {
  .leftCol { width: 100%; border-right: none; border-bottom: 1px solid var(--color-border); }
}

.rightCol {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  min-width: 0;
  overflow-x: auto;
}

.rightColFull { flex: 1; display: flex; flex-direction: column; padding: 8px 12px; min-width: 0; }

/* ── KPI numbers (details style — stacked) ── */
.kpiRow { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.kpiBlock { display: flex; flex-direction: column; }
.kpiValue { font-size: 22px; font-weight: 700; color: var(--color-text); }
.kpiLabel {
  font-size: 12px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 4px;
}
.kpiDivider { width: 100%; height: 1px; background: #e0e0e0; }

.infoIcon { font-size: 13px; cursor: pointer; color: var(--color-text-secondary); }

/* ── Drill-down link ── */
.drillDownLink {
  margin-top: auto;
  padding-top: 12px;
  color: var(--color-blue);
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
}
.drillDownLink:hover { text-decoration: underline; }

.deptSelect {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  padding-top: 12px;
}
.deptSelectLabel { font-size: 14px; color: var(--color-blue); }
.deptSelectInput {
  font-size: 13px;
  font-family: inherit;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--color-text);
  background: var(--color-surface);
  cursor: pointer;
}

/* ── Footer ── */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.metricsInfoBtn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: var(--font-family);
  padding: 0;
}
.metricsInfoBtn:hover { color: var(--color-text); }

/* ── Errors ── */
.errorContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}
.errorHeading { font-size: 15px; font-weight: 700; color: var(--color-text); margin-bottom: 8px; }
.errorSubtext { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }
.errorLink { color: var(--color-blue); }
```

- [ ] **Step 4: Create DetailsCard.tsx**

Create `src/components/cards/DetailsCard/DetailsCard.tsx`:

```tsx
import { useState, useEffect, Fragment } from 'react'
import type { ISQFMetricCard, ISQFInfoNumber, IQFTree } from '../../../types/sqf.types'
import { MetricCardSkeleton } from '../MetricCard/MetricCardSkeleton'
import { MetricCardChart } from '../MetricCard/MetricCardChart'
import { MetricCardTable } from '../MetricCard/MetricCardTable'
import { MetricCardTabs } from '../MetricCard/MetricCardTabs'
import { InfoModal } from '../../shared/InfoModal/InfoModal'
import { REPORTING_PERIODS, isCutOffTimePast } from '../../../utils/formatters'
import styles from './DetailsCard.module.css'

const RED = '#eb5757'
const NEUTRAL = '#ebecec'

function shouldShowRecognize(cardHeader?: string): boolean {
  if (!cardHeader) return false
  const h = cardHeader.toLowerCase()
  return h !== RED && h !== NEUTRAL
}

function buildInitialFilters(card: ISQFMetricCard): Record<string, string> {
  const filters: Record<string, string> = {}
  if (!card.filterKeys || !card.dropdowns) return filters
  for (const dropdownKey of Object.values(card.filterKeys)) {
    const dd = card.dropdowns.find(d => d.key === dropdownKey)
    if (dd?.data.length) filters[dropdownKey] = dd.data[0].key
  }
  return filters
}

function getFilteredSubCard(
  card: ISQFMetricCard,
  selectedFilters: Record<string, string>
): ISQFMetricCard | null {
  if (!card.cards || !card.filterKeys) return null
  const filters = Object.entries(card.filterKeys).map(([colKey, dropdownKey]) => ({
    colKey,
    value: selectedFilters[dropdownKey],
  }))
  return (
    card.cards.find(c =>
      filters.every(
        ({ colKey, value }) => (c.keys as Record<string, string>)?.[colKey] === value
      )
    ) ?? null
  )
}

/**
 * Compute the "View X details" label and whether we're at store level.
 * Mirrors Angular SqfDetailsCardComponent.ngOnInit logic.
 */
function computeDrillDown(
  card: ISQFMetricCard,
  selectedNode: IQFTree | null,
  detailsLastLevel: number
): { nextLevel: string | null; isStore: boolean } {
  if (!card.canDrillDown || !selectedNode?.children?.length) {
    return { nextLevel: null, isStore: false }
  }
  const child = selectedNode.children[0]
  const isStore = child.apiDepth === 5
  if (child.apiDepth > detailsLastLevel) return { nextLevel: null, isStore }

  if (card.isGenericCardApi && card.customDrillDownText !== undefined) {
    return { nextLevel: card.customDrillDownText || null, isStore }
  }
  if (card.cardName === 'C1Availability' && child.level_desc === 'Store') {
    return { nextLevel: 'Store details', isStore }
  }
  const desc =
    child.children?.length
      ? child.children[0].level_desc
      : child.leafChildren?.length
      ? (child.leafChildren[0] as any).level_desc
      : 'Category'
  return { nextLevel: `${desc} details`, isStore }
}

// ── KPI block (stacked layout for details) ─────────────────────────────────
function KpiBlock({ kpi }: { kpi: ISQFInfoNumber }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className={styles.kpiBlock}>
      <div className={styles.kpiValue} style={{ color: kpi.color || 'inherit' }}>
        {kpi.displayValue}
      </div>
      <div className={styles.kpiLabel}>
        {kpi.text}
        {kpi.infoMessage && (
          <span
            className={styles.infoIcon}
            onClick={() => setShowTooltip(v => !v)}
            title={kpi.infoMessage}
            aria-label="More info"
          >
            ℹ
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
interface Props {
  card?: ISQFMetricCard
  isLoading?: boolean
  last?: boolean
  /** Currently selected filter node — used to compute drill-down level label */
  selectedNode?: IQFTree | null
  /** details_last_level from card status config — limits drill-down depth */
  detailsLastLevel?: number
  /** Called when user clicks the drill-down link */
  onDrillDown?: () => void
}

export function DetailsCard({
  card,
  isLoading,
  selectedNode,
  detailsLastLevel = 99,
  onDrillDown,
}: Props) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({})
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [recognizeLoading, setRecognizeLoading] = useState(false)
  const [selectedDept, setSelectedDept] = useState('')

  useEffect(() => {
    if (card?.cards) setSelectedFilters(buildInitialFilters(card))
  }, [card?.cardName])

  if (isLoading) return <MetricCardSkeleton />
  if (!card || card.hidden) return null

  // ── Resolve content card ────────────────────────────────────────────────
  let contentCard: ISQFMetricCard | null = card
  if (card.cards && card.filterKeys) {
    contentCard = getFilteredSubCard(card, selectedFilters)
  }
  const hasFilterError = card.cards != null && contentCard == null

  // ── Derived values ──────────────────────────────────────────────────────
  const borderColor = card.cardHeader || 'var(--color-neutral)'
  const reportingPeriodKey = contentCard?.reportingPeriod ?? card.reportingPeriod
  const reportingPeriod = reportingPeriodKey
    ? REPORTING_PERIODS[reportingPeriodKey] ?? reportingPeriodKey
    : undefined
  const showRecognize = shouldShowRecognize(card.cardHeader)
  const cutOffPast = card.error?.cutOffTime ? isCutOffTimePast(card.error.cutOffTime) : false
  const { nextLevel, isStore } = computeDrillDown(card, selectedNode ?? null, detailsLastLevel)

  const { infoNumbers, chartData, tabs, tableData } = contentCard ?? ({} as ISQFMetricCard)
  const showLeftCol = !card.tableOnly
  const rightColFull = card.tableOnly || !chartData

  function handleFilterChange(dropdownKey: string, value: string) {
    setSelectedFilters(prev => ({ ...prev, [dropdownKey]: value }))
  }

  function handleRecognize() {
    setRecognizeLoading(true)
    setTimeout(() => setRecognizeLoading(false), 1500)
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (card.error) {
    return (
      <div className={styles.card} data-testid="details-card-error">
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
          </div>
        </div>
        <div className={styles.errorContent}>
          {card.error.cutOffTime && !cutOffPast ? (
            <p className={styles.errorHeading}>
              Data refresh is expected to complete by {card.error.cutOffTime}
            </p>
          ) : (
            <>
              <p className={styles.errorHeading}>Data currently unavailable</p>
              <p className={styles.errorSubtext}>
                For any concerns please contact:{' '}
                {card.error.support_email && (
                  <a className={styles.errorLink} href={`mailto:${card.error.support_email}`}>
                    {card.error.support_email}
                  </a>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.card}>
        {/* ── Header ── */}
        <div className={styles.header} style={{ borderTopColor: borderColor }}>
          <div className={styles.headerLeft}>
            <div className={styles.cardTitle}>{card.cardTitle}</div>
            <div className={styles.subTitle}>
              {reportingPeriod && (
                <span className={styles.subTitleItem}>📅 {reportingPeriod}</span>
              )}
              {card.dropdowns?.map(dd => (
                <span key={dd.key} className={styles.subTitleItem}>
                  <select
                    className={styles.dropdownSelect}
                    value={selectedFilters[dd.key] ?? ''}
                    onChange={e => handleFilterChange(dd.key, e.target.value)}
                    aria-label={dd.key}
                  >
                    {dd.data.map(opt => (
                      <option key={opt.key} value={opt.key}>
                        {opt.text}
                      </option>
                    ))}
                  </select>
                </span>
              ))}
            </div>
          </div>
          {showRecognize && (
            <div className={styles.headerRight}>
              <button
                className={styles.recognizeBtn}
                onClick={handleRecognize}
                disabled={recognizeLoading}
                data-testid="details-recognize-btn"
                aria-label="Recognize team"
              >
                {recognizeLoading ? <span className={styles.spinner} /> : '🎉'}
              </button>
            </div>
          )}
        </div>

        {/* ── Filter error ── */}
        {hasFilterError && (
          <div className={styles.errorContent}>
            <p className={styles.errorHeading}>Data temporarily unavailable</p>
            <p className={styles.errorSubtext}>Our team is investigating.</p>
          </div>
        )}

        {/* ── Two-column content ── */}
        {!hasFilterError && (
          <div className={styles.content}>
            {/* Left: KPIs + chart */}
            {showLeftCol && (
              <div className={styles.leftCol} data-testid="details-left-col">
                {infoNumbers && infoNumbers.length > 0 && (
                  <div className={styles.kpiRow}>
                    {infoNumbers.map((kpi, i) => (
                      <Fragment key={i}>
                        {i > 0 && <div className={styles.kpiDivider} />}
                        <KpiBlock kpi={kpi} />
                      </Fragment>
                    ))}
                  </div>
                )}
                {chartData && <MetricCardChart chartData={chartData} />}
              </div>
            )}

            {/* Right: tabs / table / drill-down */}
            <div className={rightColFull ? styles.rightColFull : styles.rightCol}>
              {tabs && <MetricCardTabs tabs={tabs} />}
              {tableData && <MetricCardTable tableData={tableData} />}

              {/* Drill-down link — standard */}
              {nextLevel && !isStore && (
                <span
                  className={styles.drillDownLink}
                  onClick={onDrillDown}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && onDrillDown?.()}
                >
                  View {nextLevel}
                </span>
              )}

              {/* Drill-down — C1Availability store level: dept select */}
              {card.canDrillDown && card.cardName === 'C1Availability' && isStore && (
                <div className={styles.deptSelect}>
                  <span className={styles.deptSelectLabel}>View Department details</span>
                  <select
                    className={styles.deptSelectInput}
                    value={selectedDept}
                    onChange={e => {
                      setSelectedDept(e.target.value)
                      onDrillDown?.()
                    }}
                  >
                    <option value="" disabled>Select Department</option>
                    {card.children?.map(child => (
                      <option key={child.code} value={child.code}>
                        {child.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!hasFilterError && !card.error && (
          <div className={styles.footer}>
            <span data-testid="details-updated-time">
              Updated at{' '}
              {card.updatedTime
                ? new Date(card.updatedTime).toLocaleString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
            {card.dataInfo && (
              <button
                className={styles.metricsInfoBtn}
                onClick={() => setInfoModalOpen(true)}
                data-testid="details-metrics-info-btn"
              >
                Metrics Info ℹ
              </button>
            )}
          </div>
        )}
      </div>

      {infoModalOpen && card.dataInfo && (
        <InfoModal
          title={card.dataInfo.title}
          body={card.dataInfo.body}
          onClose={() => setInfoModalOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 5: Run DetailsCard tests — expect PASS**

```bash
npx vitest run src/components/cards/DetailsCard/DetailsCard.test.tsx 2>&1 | tail -20
```

Expected: all 11 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/DetailsCard/
git commit -m "feat: add DetailsCard component with two-column layout and feature parity

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Wire SummaryPage to use SummaryCard

**Files:**
- Modify: `src/pages/quick-facts/SummaryPage.tsx`

- [ ] **Step 1: Update SummaryPage.tsx**

Replace the entire file content:

```tsx
// src/pages/quick-facts/SummaryPage.tsx
import { useSummaryCards } from '../../hooks/useSummaryCards'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useFilter } from '../../context/FilterContext'
import { SummaryCard } from '../../components/cards/SummaryCard/SummaryCard'
import type { ISQFMetricCard } from '../../types/sqf.types'
import styles from './SummaryPage.module.css'

export function SummaryPage() {
  const { isLoaded, selectedNode } = useFilter()
  const cardStatusQuery = useCardStatus()
  const summaryQuery = useSummaryCards()

  const isLoading = !isLoaded || summaryQuery.isLoading || cardStatusQuery.isLoading
  const cardStatus = cardStatusQuery.data || {}
  const cards: ISQFMetricCard[] = summaryQuery.data || []

  const sortedCards = [...cards]
    .filter(c => !c.hidden)
    .sort((a, b) => {
      const seqA = a.seq ?? (cardStatus[a.cardName]?.sequence ?? 999)
      const seqB = b.seq ?? (cardStatus[b.cardName]?.sequence ?? 999)
      return seqA - seqB
    })

  const SKELETON_COUNT = 6

  return (
    <main className={styles.page}>
      <div className={styles.pageTitle}>
        <span className={styles.pageTitleLabel}>Quick Facts</span>
        {selectedNode && (
          <>
            <span className={styles.pageTitleDot}>·</span>
            <span className={styles.pageTitleSub}>{selectedNode.name}</span>
          </>
        )}
      </div>

      {summaryQuery.isError && (
        <div className={styles.errorBanner}>
          Failed to load metrics. Please try again.
        </div>
      )}

      <div className="card-grid">
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="metric-card-slot">
                <SummaryCard isLoading />
              </div>
            ))
          : sortedCards.map(card => (
              <div key={card.cardName} className="metric-card-slot">
                <SummaryCard card={card} />
              </div>
            ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/quick-facts/SummaryPage.tsx
git commit -m "feat: wire SummaryPage to use SummaryCard

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Wire DetailsPage to use DetailsCard

**Files:**
- Modify: `src/pages/quick-facts/DetailsPage.tsx`

- [ ] **Step 1: Update DetailsPage.tsx**

Replace the entire file content:

```tsx
// src/pages/quick-facts/DetailsPage.tsx
import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useDetailsCard } from '../../hooks/useDetailsCard'
import { useCardStatus } from '../../hooks/useCardStatus'
import { useFilter } from '../../context/FilterContext'
import { DetailsCard } from '../../components/cards/DetailsCard/DetailsCard'
import type { ISQFMetricCard } from '../../types/sqf.types'
import styles from './DetailsPage.module.css'

type SortType = 'az' | 'za' | 'lowhigh' | 'highlow'

function sortCards(cards: ISQFMetricCard[], sortType: SortType): ISQFMetricCard[] {
  const sorted = [...cards]
  const SKIP = ['UNK', 'REGIONEX', 'CLOSED']
  const shouldSkip = (card: ISQFMetricCard) =>
    SKIP.some(k => (card.cardTitle || '').toUpperCase().includes(k))

  switch (sortType) {
    case 'az':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return (a.cardTitle || '').localeCompare(b.cardTitle || '', undefined, { numeric: true })
      })
    case 'za':
      return sorted.sort((a, b) => {
        if (shouldSkip(a)) return 1
        if (shouldSkip(b)) return -1
        return (b.cardTitle || '').localeCompare(a.cardTitle || '', undefined, { numeric: true })
      })
    case 'lowhigh':
      return sorted.sort((a, b) => {
        const aVal = a.sortByVal ?? parseFloat(String(a.infoNumbers?.[0]?.val ?? 0))
        const bVal = b.sortByVal ?? parseFloat(String(b.infoNumbers?.[0]?.val ?? 0))
        return aVal - bVal
      })
    case 'highlow':
      return sorted.sort((a, b) => {
        const aVal = a.sortByVal ?? parseFloat(String(a.infoNumbers?.[0]?.val ?? 0))
        const bVal = b.sortByVal ?? parseFloat(String(b.infoNumbers?.[0]?.val ?? 0))
        return bVal - aVal
      })
  }
}

const SKELETON_COUNT = 9

export function DetailsPage() {
  const { type } = useParams<{ type: string }>()
  const { isLoaded, selectedNode } = useFilter()
  const cardStatusQuery = useCardStatus()
  const detailsQuery = useDetailsCard(type)
  const [sortType, setSortType] = useState<SortType>('az')

  const cardStatus = cardStatusQuery.data
  if (cardStatus && type && !cardStatus[type]) {
    return <Navigate to="/quick-facts/summary" replace />
  }

  const isLoading = !isLoaded || detailsQuery.isLoading
  const raw: ISQFMetricCard[] = detailsQuery.data || []
  const cards = sortCards(raw.filter(c => !c.hidden), sortType)

  const cardConfig = cardStatus?.[type || '']
  const pageTitle = cardConfig?.titleText || type || ''
  const detailsLastLevel = cardConfig?.details_last_level ?? 99

  const breadcrumbs: string[] = []
  let node = selectedNode
  while (node) {
    if (!node.hidden && !node.alwaysHidden) breadcrumbs.unshift(node.name)
    node = node.parent || null
  }

  return (
    <main className={styles.page}>
      {breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className={styles.breadcrumb}>
              {i > 0 && <span className={styles.breadcrumbSep}> › </span>}
              {crumb}
            </span>
          ))}
        </div>
      )}

      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>{pageTitle}</div>
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Sort:</span>
          {([
            ['az', 'A → Z'],
            ['za', 'Z → A'],
            ['lowhigh', 'Low → High'],
            ['highlow', 'High → Low'],
          ] as [SortType, string][]).map(([st, label]) => (
            <button
              key={st}
              className={`${styles.sortBtn} ${sortType === st ? styles.sortBtnActive : ''}`}
              onClick={() => setSortType(st)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {detailsQuery.isError && (
        <div className={styles.errorBanner}>
          Failed to load details. Please try again.
        </div>
      )}

      <div style={{ padding: '0 24px' }}>
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <DetailsCard isLoading />
              </div>
            ))
          : cards.map((card, i) => (
              <DetailsCard
                key={card.cardName + i}
                card={card}
                last={i === cards.length - 1}
                selectedNode={selectedNode}
                detailsLastLevel={detailsLastLevel}
              />
            ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/quick-facts/DetailsPage.tsx
git commit -m "feat: wire DetailsPage to use DetailsCard

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Full test suite verification

**Files:** none (verification only)

- [ ] **Step 1: Run all tests**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run 2>&1 | tail -30
```

Expected: All test suites pass. Pay attention to any failures in:
- `src/utils/formatters.test.ts`
- `src/components/shared/InfoModal/InfoModal.test.tsx`
- `src/components/cards/SummaryCard/SummaryCard.test.tsx`
- `src/components/cards/DetailsCard/DetailsCard.test.tsx`
- `src/components/cards/MetricCard/MetricCard.test.tsx` (existing — must still pass)

If `MetricCard.test.tsx` fails due to type errors after the `ISQFMetricCard.filterKeys` type change (`string[]` → `Record<string, string>`), the fix is to update that test to use `filterKeys: {}` instead of `filterKeys: []`. Do not change any other logic in that test.

- [ ] **Step 2: Build check**

```bash
npx vite build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Quick Facts feature parity with Angular SQF components

- SummaryCard: dropdown filters, recognize button, expand/collapse,
  KPI tooltips, subHeading, customInfoNumbers, richText, expandable list,
  footer with updatedTime and Metrics Info modal, all error states
- DetailsCard: two-column layout, drill-down link, dept select (C1A),
  dropdown filters, recognize button, footer, all error states  
- InfoModal: shared dialog for Metrics Info popup
- isCutOffTimePast: utility for error state display logic
- SummaryPage and DetailsPage updated to use new card components

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
