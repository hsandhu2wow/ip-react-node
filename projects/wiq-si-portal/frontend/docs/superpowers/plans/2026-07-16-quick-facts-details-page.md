# Quick Facts Details Page & "Go to Details" Link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the missing "Go to Details" link on the Quick Facts summary page and add an Angular-style left sidebar to the details page.

**Architecture:** A new `useEnrichedSummaryCards` hook combines `useSummaryCards` + `useCardStatus` + `useFilter` to compute `isDetailsPageAvailable` on each card (matching Angular's `SqfCardsService.setupCommonProps` logic). `SummaryPage` uses this hook so the link appears. `DetailsPage` also uses it to populate a new `CardSidebar` component that renders all card types as clickable mini-cards in a left panel.

**Tech Stack:** React 18, TypeScript, React Router v6, TanStack Query v5, Vitest + Testing Library, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-07-16-quick-facts-details-page-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/hooks/useEnrichedSummaryCards.ts` | **Create** | Fetch + enrich cards with `isDetailsPageAvailable` |
| `src/hooks/useEnrichedSummaryCards.test.ts` | **Create** | Unit tests for the hook |
| `src/components/cards/CardSidebar/CardSidebar.tsx` | **Create** | Left sidebar — list of card type mini-links |
| `src/components/cards/CardSidebar/CardSidebar.module.css` | **Create** | Sidebar styles, hidden < 960px |
| `src/components/cards/CardSidebar/CardSidebar.test.tsx` | **Create** | Render + navigation tests |
| `src/pages/quick-facts/SummaryPage.tsx` | **Modify** | Swap to `useEnrichedSummaryCards` |
| `src/pages/quick-facts/DetailsPage.tsx` | **Modify** | Two-column layout + CardSidebar + Back link |
| `src/pages/quick-facts/DetailsPage.module.css` | **Modify** | Flex layout rules |

---

## Task 1: `useEnrichedSummaryCards` hook

**Files:**
- Create: `src/hooks/useEnrichedSummaryCards.ts`
- Create: `src/hooks/useEnrichedSummaryCards.test.ts`

- [ ] **Step 1.1 — Write the failing test**

Create `src/hooks/useEnrichedSummaryCards.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('./useSummaryCards', () => ({
  useSummaryCards: vi.fn(),
}))
vi.mock('./useCardStatus', () => ({
  useCardStatus: vi.fn(),
}))
vi.mock('../context/FilterContext', () => ({
  useFilter: vi.fn(),
}))

import { useEnrichedSummaryCards } from './useEnrichedSummaryCards'
import { useSummaryCards } from './useSummaryCards'
import { useCardStatus } from './useCardStatus'
import { useFilter } from '../context/FilterContext'

const mockUseSummaryCards = useSummaryCards as ReturnType<typeof vi.fn>
const mockUseCardStatus = useCardStatus as ReturnType<typeof vi.fn>
const mockUseFilter = useFilter as ReturnType<typeof vi.fn>

function setup({
  cards = [],
  cardStatus = {},
  apiDepth = 2,
  isCardsLoading = false,
  isStatusLoading = false,
}: {
  cards?: any[]
  cardStatus?: Record<string, any>
  apiDepth?: number
  isCardsLoading?: boolean
  isStatusLoading?: boolean
} = {}) {
  mockUseSummaryCards.mockReturnValue({ data: cards, isLoading: isCardsLoading, isError: false })
  mockUseCardStatus.mockReturnValue({ data: cardStatus, isLoading: isStatusLoading, isError: false })
  mockUseFilter.mockReturnValue({ selectedNode: { apiDepth }, isLoaded: true })
  return useEnrichedSummaryCards()
}

describe('useEnrichedSummaryCards', () => {
  it('sets isDetailsPageAvailable=true when details=true and apiDepth within limit', () => {
    const result = setup({
      cards: [{ cardName: 'sales', cardType: 'summary' }],
      cardStatus: { sales: { details: true, details_last_level: 3, sequence: 1 } },
      apiDepth: 2,
    })
    expect(result.data?.[0].isDetailsPageAvailable).toBe(true)
  })

  it('sets isDetailsPageAvailable=false when details=false', () => {
    const result = setup({
      cards: [{ cardName: 'sales', cardType: 'summary' }],
      cardStatus: { sales: { details: false, details_last_level: 3, sequence: 1 } },
      apiDepth: 2,
    })
    expect(result.data?.[0].isDetailsPageAvailable).toBe(false)
  })

  it('sets isDetailsPageAvailable=false when apiDepth exceeds details_last_level', () => {
    const result = setup({
      cards: [{ cardName: 'sales', cardType: 'summary' }],
      cardStatus: { sales: { details: true, details_last_level: 1, sequence: 1 } },
      apiDepth: 2,
    })
    expect(result.data?.[0].isDetailsPageAvailable).toBe(false)
  })

  it('returns empty array when cards are undefined', () => {
    const result = setup({ cards: undefined as any })
    expect(result.data).toEqual([])
  })

  it('isLoading=true while either query is pending', () => {
    const result = setup({ isCardsLoading: true })
    expect(result.isLoading).toBe(true)
  })

  it('isLoading=true when cardStatus query is pending', () => {
    const result = setup({ isStatusLoading: true })
    expect(result.isLoading).toBe(true)
  })

  it('isLoading=false when both queries resolve', () => {
    const result = setup({ isCardsLoading: false, isStatusLoading: false })
    expect(result.isLoading).toBe(false)
  })

  it('returns cardStatus for consumers to use', () => {
    const cardStatus = { sales: { details: true, details_last_level: 3, sequence: 1 } }
    const result = setup({ cardStatus })
    expect(result.cardStatus).toEqual(cardStatus)
  })
})
```

- [ ] **Step 1.2 — Run test to confirm it fails**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx vitest run src/hooks/useEnrichedSummaryCards.test.ts
```

Expected: `Cannot find module './useEnrichedSummaryCards'`

- [ ] **Step 1.3 — Implement the hook**

Create `src/hooks/useEnrichedSummaryCards.ts`:

```typescript
// src/hooks/useEnrichedSummaryCards.ts
import { useMemo } from 'react'
import { useSummaryCards } from './useSummaryCards'
import { useCardStatus } from './useCardStatus'
import { useFilter } from '../context/FilterContext'
import type { ISQFMetricCard, IAvailableMetricCards } from '../types/sqf.types'

export interface EnrichedSummaryResult {
  data: ISQFMetricCard[]
  isLoading: boolean
  isError: boolean
  cardStatus: IAvailableMetricCards
}

/**
 * Fetches summary cards and enriches each card with `isDetailsPageAvailable`,
 * matching the logic in Angular's SqfCardsService.setupCommonProps().
 *
 * isDetailsPageAvailable = true when:
 *   - cardStatus[cardName].details is true, AND
 *   - selectedNode.apiDepth <= cardStatus[cardName].details_last_level
 */
export function useEnrichedSummaryCards(): EnrichedSummaryResult {
  const { selectedNode } = useFilter()
  const summaryQuery = useSummaryCards()
  const statusQuery = useCardStatus()

  const cardStatus = statusQuery.data ?? {}
  const apiDepth = selectedNode?.apiDepth ?? 0

  const data = useMemo<ISQFMetricCard[]>(() => {
    const raw = summaryQuery.data ?? []
    return raw.map(card => ({
      ...card,
      isDetailsPageAvailable:
        cardStatus[card.cardName]?.details === true &&
        apiDepth <= (cardStatus[card.cardName]?.details_last_level ?? 99),
    }))
  }, [summaryQuery.data, cardStatus, apiDepth])

  return {
    data,
    isLoading: summaryQuery.isLoading || statusQuery.isLoading,
    isError: summaryQuery.isError || statusQuery.isError,
    cardStatus,
  }
}
```

- [ ] **Step 1.4 — Run tests to confirm they pass**

```bash
npx vitest run src/hooks/useEnrichedSummaryCards.test.ts
```

Expected: all 8 tests PASS

- [ ] **Step 1.5 — Commit**

```bash
git add src/hooks/useEnrichedSummaryCards.ts src/hooks/useEnrichedSummaryCards.test.ts
git commit -m "feat(sqf): add useEnrichedSummaryCards hook to compute isDetailsPageAvailable

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Update `SummaryPage` to use the new hook

**Files:**
- Modify: `src/pages/quick-facts/SummaryPage.tsx`

- [ ] **Step 2.1 — Update SummaryPage**

Replace the two hook imports and calls. Open `src/pages/quick-facts/SummaryPage.tsx` and apply these changes:

Remove:
```typescript
import { useSummaryCards } from '../../hooks/useSummaryCards'
import { useCardStatus } from '../../hooks/useCardStatus'
```

Add:
```typescript
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
```

Replace the hook calls block:
```typescript
// Before
const cardStatusQuery = useCardStatus()
const summaryQuery = useSummaryCards()

const isLoading = !isLoaded || summaryQuery.isLoading || cardStatusQuery.isLoading
const cardStatus = cardStatusQuery.data || {}
const cards: ISQFMetricCard[] = summaryQuery.data || []
```

With:
```typescript
// After
const enrichedQuery = useEnrichedSummaryCards()

const isLoading = !isLoaded || enrichedQuery.isLoading
const cardStatus = enrichedQuery.cardStatus
const cards: ISQFMetricCard[] = enrichedQuery.data
```

- [ ] **Step 2.2 — Verify the app still compiles**

```bash
cd /Users/lakhwinderkaur/Documents/work-wow/ip-react-node/ip-react-node
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 2.3 — Run existing SummaryCard tests to ensure nothing broke**

```bash
npx vitest run src/components/cards/SummaryCard/SummaryCard.test.tsx
```

Expected: all tests PASS

- [ ] **Step 2.4 — Commit**

```bash
git add src/pages/quick-facts/SummaryPage.tsx
git commit -m "feat(sqf): wire SummaryPage to useEnrichedSummaryCards for Go to Details link

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: `CardSidebar` component

**Files:**
- Create: `src/components/cards/CardSidebar/CardSidebar.tsx`
- Create: `src/components/cards/CardSidebar/CardSidebar.module.css`
- Create: `src/components/cards/CardSidebar/CardSidebar.test.tsx`

- [ ] **Step 3.1 — Write the failing tests**

Create `src/components/cards/CardSidebar/CardSidebar.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CardSidebar } from './CardSidebar'
import type { ISQFMetricCard } from '../../../types/sqf.types'

const cards: ISQFMetricCard[] = [
  {
    cardName: 'sales',
    cardType: 'summary',
    cardTitle: 'Sales',
    cardHeader: '#219653',
    isDetailsPageAvailable: true,
    infoNumbers: [{ displayValue: '$1.2M', text: 'WTD', color: '#219653' }],
  },
  {
    cardName: 'stockloss',
    cardType: 'summary',
    cardTitle: 'Stock Loss',
    cardHeader: '#eb5757',
    isDetailsPageAvailable: true,
    infoNumbers: [{ displayValue: '1.2%', text: 'WTD', color: '#eb5757' }],
  },
  {
    cardName: 'nolinkcard',
    cardType: 'summary',
    cardTitle: 'No Link',
    cardHeader: '#219653',
    isDetailsPageAvailable: false,
  },
]

function render$(selectedType: string) {
  return render(
    <MemoryRouter>
      <CardSidebar cards={cards} selectedType={selectedType} />
    </MemoryRouter>
  )
}

describe('CardSidebar', () => {
  it('renders only cards where isDetailsPageAvailable=true', () => {
    render$('sales')
    expect(screen.getByText('Sales')).toBeDefined()
    expect(screen.getByText('Stock Loss')).toBeDefined()
    expect(screen.queryByText('No Link')).toBeNull()
  })

  it('renders the first KPI displayValue for each card', () => {
    render$('sales')
    expect(screen.getByText('$1.2M')).toBeDefined()
    expect(screen.getByText('1.2%')).toBeDefined()
  })

  it('marks the selected card with data-selected attribute', () => {
    render$('sales')
    const selected = document.querySelector('[data-selected="true"]')
    expect(selected).not.toBeNull()
    expect(selected?.textContent).toContain('Sales')
  })

  it('links each card to /quick-facts/details/:cardName', () => {
    render$('sales')
    const salesLink = screen.getByRole('link', { name: /Sales/ })
    expect(salesLink.getAttribute('href')).toBe('/quick-facts/details/sales')
    const stockLink = screen.getByRole('link', { name: /Stock Loss/ })
    expect(stockLink.getAttribute('href')).toBe('/quick-facts/details/stockloss')
  })

  it('renders nothing when cards array is empty', () => {
    const { container } = render(
      <MemoryRouter>
        <CardSidebar cards={[]} selectedType="sales" />
      </MemoryRouter>
    )
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 3.2 — Run tests to confirm they fail**

```bash
npx vitest run src/components/cards/CardSidebar/CardSidebar.test.tsx
```

Expected: `Cannot find module './CardSidebar'`

- [ ] **Step 3.3 — Create the CSS module**

Create `src/components/cards/CardSidebar/CardSidebar.module.css`:

```css
/* src/components/cards/CardSidebar/CardSidebar.module.css */
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.item {
  display: block;
  text-decoration: none;
  border: 1px solid var(--color-border);
  border-left: 3px solid transparent;
  border-radius: 6px;
  padding: 10px 12px;
  background: var(--color-surface);
  transition: background 0.1s;
  cursor: pointer;
}

.item:hover {
  background: rgba(0, 0, 0, 0.03);
}

.itemSelected {
  border-left-width: 3px;
  border-color: var(--color-primary);
  background: var(--color-primary-bg, #e8f0fe);
}

.itemTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.itemKpi {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* Hide sidebar below 960px to match Angular's hide-md breakpoint */
@media (max-width: 959px) {
  .sidebar {
    display: none;
  }
}
```

- [ ] **Step 3.4 — Implement `CardSidebar`**

Create `src/components/cards/CardSidebar/CardSidebar.tsx`:

```typescript
// src/components/cards/CardSidebar/CardSidebar.tsx
import { Link } from 'react-router-dom'
import type { ISQFMetricCard } from '../../../types/sqf.types'
import styles from './CardSidebar.module.css'

interface Props {
  /** Enriched summary cards — only those with isDetailsPageAvailable=true are shown */
  cards: ISQFMetricCard[]
  /** The cardName from the current URL :type param */
  selectedType: string
}

export function CardSidebar({ cards, selectedType }: Props) {
  const available = cards.filter(c => c.isDetailsPageAvailable && !c.hidden)
  if (available.length === 0) return null

  return (
    <nav className={styles.sidebar} aria-label="Card types">
      {available.map(card => {
        const isSelected = card.cardName === selectedType
        const kpi = card.infoNumbers?.[0]
        return (
          <Link
            key={card.cardName}
            to={`/quick-facts/details/${card.cardName}`}
            className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
            data-selected={isSelected}
            aria-current={isSelected ? 'page' : undefined}
            style={{ borderLeftColor: card.cardHeader || undefined }}
          >
            <div className={styles.itemTitle}>{card.cardTitle || card.cardName}</div>
            {kpi && (
              <div className={styles.itemKpi}>
                {kpi.displayValue} {kpi.text}
              </div>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3.5 — Run tests to confirm they pass**

```bash
npx vitest run src/components/cards/CardSidebar/CardSidebar.test.tsx
```

Expected: all 5 tests PASS

- [ ] **Step 3.6 — Commit**

```bash
git add src/components/cards/CardSidebar/
git commit -m "feat(sqf): add CardSidebar component for details page navigation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Update `DetailsPage` — two-column layout + sidebar + back link

**Files:**
- Modify: `src/pages/quick-facts/DetailsPage.tsx`
- Modify: `src/pages/quick-facts/DetailsPage.module.css`

- [ ] **Step 4.1 — Add layout CSS**

Open `src/pages/quick-facts/DetailsPage.module.css` and append to the end of the file:

```css
/* Two-column layout */
.layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 0 24px;
}

.detailColumn {
  flex: 1;
  min-width: 0;
}

.backLink {
  display: inline-block;
  font-size: 13px;
  color: var(--color-primary);
  text-decoration: none;
  margin-bottom: 8px;
}

.backLink:hover {
  text-decoration: underline;
}
```

- [ ] **Step 4.2 — Update `DetailsPage.tsx`**

Open `src/pages/quick-facts/DetailsPage.tsx`. Apply these changes:

**Add imports** at the top (after existing imports):
```typescript
import { Link } from 'react-router-dom'
import { useEnrichedSummaryCards } from '../../hooks/useEnrichedSummaryCards'
import { CardSidebar } from '../../components/cards/CardSidebar/CardSidebar'
```

**Add the hook call** inside the `DetailsPage` function body, immediately after the existing `useFilter` call:
```typescript
const enrichedSummary = useEnrichedSummaryCards()
```

**Replace the `return` statement** with the two-column layout. Find the existing `return (` and replace the whole return block:

```typescript
  return (
    <main className={styles.page}>
      {/* Breadcrumbs */}
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

      <div className={styles.layout}>
        {/* Left sidebar — card type navigation */}
        <CardSidebar
          cards={enrichedSummary.data}
          selectedType={type || ''}
        />

        {/* Right column — detail cards */}
        <div className={styles.detailColumn}>
          <Link to="/quick-facts/summary" className={styles.backLink}>
            ← Back to all cards
          </Link>

          <div className={styles.pageHeader}>
            <div className={styles.pageTitle}>{pageTitle}</div>

            {/* Sort controls */}
            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>Sort:</span>
              {([
                ['az', 'A → Z'],
                ['za', 'Z → A'],
                ['lowhigh', 'Low → High'],
                ['highlow', 'High → Low'],
              ] as [SortType, string][]).map(([type, label]) => (
                <button
                  key={type}
                  className={`${styles.sortBtn} ${sortType === type ? styles.sortBtnActive : ''}`}
                  onClick={() => setSortType(type)}
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

          <div>
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
                    selectedNode={selectedNode}
                    detailsLastLevel={detailsLastLevel}
                  />
                ))}
          </div>
        </div>
      </div>
    </main>
  )
```

- [ ] **Step 4.3 — Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4.4 — Run all existing tests**

```bash
npx vitest run
```

Expected: all tests PASS (no regressions)

- [ ] **Step 4.5 — Commit**

```bash
git add src/pages/quick-facts/DetailsPage.tsx src/pages/quick-facts/DetailsPage.module.css
git commit -m "feat(sqf): add two-column layout and CardSidebar to DetailsPage

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Final verification

- [ ] **Step 5.1 — Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS. Note the exact count — should be at minimum 8 (hook) + 5 (sidebar) new tests added.

- [ ] **Step 5.2 — TypeScript clean check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5.3 — Final commit (if any cleanup needed)**

```bash
git add -A
git status  # verify only expected files changed
git commit -m "chore(sqf): final cleanup for details page feature

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Self-Review Checklist

- ✅ `isDetailsPageAvailable` logic matches Angular spec exactly (Task 1)
- ✅ `SummaryPage` uses enriched hook — "Go to Details" link will now appear (Task 2)
- ✅ `CardSidebar` hides at < 960px, matches Angular `hide-md` behaviour (Task 3 CSS)
- ✅ `DetailsPage` left sidebar + back link implemented (Task 4)
- ✅ No TBDs or placeholders — all code shown in full
- ✅ Type names consistent: `ISQFMetricCard`, `IAvailableMetricCards`, `EnrichedSummaryResult`
- ✅ TDD followed: tests written before implementation in Tasks 1 and 3
