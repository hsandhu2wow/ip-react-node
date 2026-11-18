import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrendInfoDialog } from './TrendInfoDialog';

describe('TrendInfoDialog', () => {
  it('renders Weekly HTML, icon and optional refresh metadata without stealing focus', () => {
    const onClose = vi.fn();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const { unmount } = render(
      <TrendInfoDialog
        alert={{ type: 'warning', title: 'Fixture warning', text: '<strong>Fixture body</strong>' }}
        refreshTimeLabel="Oct 1, 12:00 PM"
        onClose={onClose}
      />
    );
    const dialog = screen.getByRole('dialog', { name: 'Fixture warning' });
    expect(dialog.querySelector('strong')).toHaveTextContent('Fixture body');
    expect(dialog).toHaveTextContent('error');
    expect(dialog).toHaveTextContent('Oct 1, 12:00 PM');
    expect(opener).toHaveFocus();
    fireEvent.click(screen.getByText('Fixture body'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });

  it('blocks page scroll like Angular MatDialog while keeping the scrollbar so the layout does not widen', () => {
    const root = document.documentElement;
    const scroll = vi.spyOn(window, 'scroll').mockImplementation(() => {});
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: window.innerHeight + 500 });
    window.scrollY = 60;
    const { unmount } = render(<TrendInfoDialog alert={{ type: 'info', text: 'Fixture body' }} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
    expect(root).toHaveClass('global-scrollblock');
    expect(root.style.top).toBe('-60px');
    expect(root.style.left).toBe('0px');
    unmount();
    expect(root).not.toHaveClass('global-scrollblock');
    expect(root.style.top).toBe('');
    expect(root.style.left).toBe('');
    expect(scroll).toHaveBeenCalledWith(0, 60);
    delete (root as { scrollHeight?: number }).scrollHeight;
    window.scrollY = 0;
    scroll.mockRestore();
  });

  it('leaves a non-scrollable page untouched like Angular MatDialog', () => {
    const { unmount } = render(<TrendInfoDialog alert={{ type: 'info', text: 'Fixture body' }} onClose={vi.fn()} />);
    expect(document.documentElement).not.toHaveClass('global-scrollblock');
    expect(document.documentElement.style.top).toBe('');
    expect(document.body.style.overflow).toBe('');
    unmount();
  });

  it('closes on Escape or backdrop and traps Tab inside the modal', () => {
    const onClose = vi.fn();
    render(<TrendInfoDialog alert={{ type: 'info', text: 'Fixture body' }} onClose={onClose} />);
    const close = screen.getByRole('button', { name: 'Close' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByTestId('trend-info-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
