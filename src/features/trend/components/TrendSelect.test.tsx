import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { TrendSelect } from './TrendSelect';

const options = [
  { value: 'week', label: 'Week Overview' },
  { value: 'month', label: 'Month Overview' },
  { value: 'half', label: 'Half Overview' },
];
function Select({ onChange = vi.fn() }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('week');
  return <TrendSelect ariaLabel="Select view" value={value} options={options}
    onChange={next => { setValue(next); onChange(next); }} />;
}

describe('Trend source select', () => {
  it('portals the menu outside the page and retains trigger focus with an active descendant', () => {
    const { container } = render(<Select />);
    const trigger = screen.getByRole('combobox', { name: 'Select view' });
    fireEvent.click(trigger);
    const list = screen.getByRole('listbox', { name: 'Select view' });
    expect(container).not.toContainElement(list);
    expect(trigger).toHaveAttribute('aria-controls', list.id);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { selected: true }).id);
    expect(trigger).toHaveFocus();
  });

  it('previews with arrows, cancels with Escape and commits with Enter', () => {
    const onChange = vi.fn();
    render(<Select onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Month Overview' }).id);
    expect(screen.getByRole('option', { name: 'Week Overview' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: ' ' });
    fireEvent.keyDown(trigger, { key: 'End' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledExactlyOnceWith('half');
    expect(trigger).toHaveTextContent('Half Overview');
    expect(trigger).toHaveFocus();
  });

  it('retains the cancelled preview index for closed-arrow navigation like Angular', () => {
    const onChange = vi.fn();
    render(<Select onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger).toHaveTextContent('Week Overview');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveTextContent('Half Overview');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('half');
  });

  it('commits closed arrows and typeahead and does not emit a change for the same option', () => {
    const onChange = vi.fn();
    render(<Select onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveTextContent('Month Overview');
    fireEvent.keyDown(trigger, { key: 'h' });
    expect(trigger).toHaveTextContent('Half Overview');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Half Overview' }));
    expect(onChange.mock.calls).toEqual([['month'], ['half']]);
  });

  it('does not turn a pointer hover into a keyboard selection', () => {
    const onChange = vi.fn();
    render(<Select onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    fireEvent.mouseMove(screen.getByRole('option', { name: 'Half Overview' }));
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent('Week Overview');
  });

  it('closes on an outside press without committing the preview or stealing focus', () => {
    const onChange = vi.fn();
    render(<><Select onChange={onChange} /><button>Other control</button></>);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const other = screen.getByRole('button', { name: 'Other control' });
    other.focus();
    fireEvent.mouseDown(other);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(other).toHaveFocus();
  });

  it('commits the active option on Tab and leaves normal focus traversal intact', () => {
    const onChange = vi.fn();
    render(<Select onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(fireEvent.keyDown(trigger, { key: 'Tab' })).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('month');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('dismisses the transparent overlay backdrop without activating the underlying page', () => {
    const underlyingClick = vi.fn();
    render(<><Select /><button onClick={underlyingClick}>Underlying action</button></>);
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    fireEvent.mouseDown(screen.getByTestId('trend-select-backdrop'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(underlyingClick).not.toHaveBeenCalled();
  });

  it('closes stale overlays on option changes and viewport resize', () => {
    const onChange = vi.fn();
    const { rerender } = render(<TrendSelect ariaLabel="Select view" value="week" options={options} onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    rerender(<TrendSelect ariaLabel="Select view" value="other" options={[{ value: 'other', label: 'Other' }]} onChange={onChange} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent(window, new Event('resize'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
