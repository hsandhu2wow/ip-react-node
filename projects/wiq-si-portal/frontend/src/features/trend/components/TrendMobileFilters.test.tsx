import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrendMobileFilters } from './TrendMobileFilters';

const tabs = [
  { key: 'week', name: 'Week', dates: ['W3', 'W2', 'W1'] },
  { key: 'month', name: 'Month', dates: ['M2', 'M1'] },
];

describe('Weekly mobile date menu', () => {
  it('previews another tab without committing and cancels on Escape with focus restored', () => {
    const onChange = vi.fn();
    render(<TrendMobileFilters tabs={tabs} tab="Week" date="W3" onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: 'Select mobile date' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    expect(screen.getByRole('option', { name: 'M1' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'W3' })).toHaveAttribute('aria-selected', 'true');
  });

  it('commits the chosen tab/date and closes the menu; outside click cancels preview', () => {
    const onChange = vi.fn();
    render(<TrendMobileFilters tabs={tabs} tab="Week" date="W3" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    fireEvent.click(screen.getByRole('option', { name: 'M1' }));
    expect(onChange).toHaveBeenCalledWith('Month', 'M1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps date arrows within history bounds and hides them when hierarchy is shown', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TrendMobileFilters tabs={tabs} tab="Week" date="W3" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Newer period' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Older period' }));
    expect(onChange).toHaveBeenCalledWith('Week', 'W2');
    rerender(<TrendMobileFilters tabs={tabs} tab="Week" date="W1" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Older period' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Newer period' }));
    expect(onChange).toHaveBeenLastCalledWith('Week', 'W2');
    rerender(<TrendMobileFilters tabs={tabs} tab="Week" date="W1" onChange={onChange} hierarchy={<select aria-label="Hierarchy" />} />);
    expect(screen.queryByRole('button', { name: 'Older period' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Hierarchy' })).toBeInTheDocument();
  });

  it('handles one empty tab and does not commit an unchanged date, matching Angular', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TrendMobileFilters tabs={[{ key: 'empty', name: '', dates: [] }]} tab="" date="" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Older period' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(within(screen.getByRole('listbox')).queryAllByRole('option')).toHaveLength(0);
    fireEvent.keyDown(document, { key: 'Escape' });
    rerender(<TrendMobileFilters tabs={tabs} tab="Week" date="W3" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getByRole('option', { name: 'W3' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not commit an equal date label after previewing a different tab', () => {
    const onChange = vi.fn();
    render(<TrendMobileFilters tabs={[
      { key: 'first', name: 'First', dates: ['Latest'] },
      { key: 'second', name: 'Second', dates: ['Latest'] },
    ]} tab="First" date="Latest" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Older period' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Newer period' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Select mobile date' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
    fireEvent.click(screen.getByRole('option', { name: 'Latest' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
