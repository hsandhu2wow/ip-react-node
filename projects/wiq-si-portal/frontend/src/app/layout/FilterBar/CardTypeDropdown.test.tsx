import { expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CardTypeDropdown } from './CardTypeDropdown'
let code = '1234-10'
vi.mock('../../../shared/context/FilterContext', () => ({ useFilter: () => ({ selectedNode: { code, level_desc: 'category' } }) }))
vi.mock('../../../features/quick-facts/hooks/useCFCChildCodes', () => ({ useCFCChildCodes: () => ({ data: ['1234'] }) }))
vi.mock('../../../features/quick-facts/hooks/useCardStatus', () => ({ useCardStatus: () => ({ data: {
  seasonal: { titleText: 'Summer Event', sequence: 1, details: 1, summary: 1, show_only_cfc: true },
} }) }))
it('lists CFC-only Seasonal details for a CFC department, but not a different store', () => {
  const { rerender } = render(<MemoryRouter><CardTypeDropdown selectedType="seasonal" apiDepth={5} /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Card type' }))
  expect(screen.getByRole('menuitem', { name: 'Summer Event' })).toHaveAttribute('href', '/quick-facts/details/seasonal')
  code = '9999-10'
  rerender(<MemoryRouter><CardTypeDropdown selectedType="seasonal" apiDepth={5} /></MemoryRouter>)
  expect(screen.queryByRole('menuitem', { name: 'Summer Event' })).toBeNull()
})
