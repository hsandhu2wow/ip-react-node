import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { disposeMaterialTooltip, hideMaterialTooltip, showMaterialTooltip } from './materialTooltip';

describe('Material-style tooltips', () => {
  let host: HTMLDivElement;
  let size: DOMRect;
  const panel = () => document.querySelector<HTMLElement>('.mat-mdc-tooltip-panel')!;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(500);
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(300);
    size = new DOMRect(0, 0, 120, 40);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => size);
    host = document.createElement('div');
    document.body.appendChild(host);
    host.getBoundingClientRect = vi.fn(() => new DOMRect(100, 90, 100, 20));
  });

  afterEach(() => {
    disposeMaterialTooltip(host);
    for (const child of host.children) disposeMaterialTooltip(child);
    host.remove();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ['after', new DOMRect(100, 90, 100, 20), '208px', '80px', 'right'],
    ['below', new DOMRect(100, 90, 100, 20), '90px', '118px', 'below'],
    ['after', new DOMRect(400, 90, 80, 20), '272px', '80px', 'left'],
    ['below', new DOMRect(100, 260, 100, 20), '90px', '212px', 'above'],
    ['after', new DOMRect(200, 0, 100, 20), '308px', '8px', 'right'],
    ['below', new DOMRect(0, 90, 20, 20), '8px', '118px', 'below'],
  ] as const)('places %s tooltips and flips/pushes at viewport edges (case %#)', (position, rect, left, top, side) => {
    vi.mocked(host.getBoundingClientRect).mockReturnValue(rect);
    showMaterialTooltip(host, 'Metric detail', position);
    expect(panel()).toHaveStyle({ left, top });
    expect(panel()).toHaveClass(`mat-mdc-tooltip-panel-${side}`);
  });

  it('uses the more visible fallback when neither side fully fits', () => {
    vi.mocked(host.getBoundingClientRect).mockReturnValue(new DOMRect(400, 0, 80, 20));
    showMaterialTooltip(host, 'Metric detail', 'after');
    expect(panel()).toHaveClass('mat-mdc-tooltip-panel-left');
    expect(panel()).toHaveStyle({ left: '272px', top: '8px' });
  });

  it('trims plain text without interpreting markup and ignores empty messages', () => {
    showMaterialTooltip(host, ' \n ', 'after');
    expect(panel()).toBeNull();
    showMaterialTooltip(host, '  <b>Plain text</b>  ', 'after');
    expect(panel()).toHaveTextContent('<b>Plain text</b>');
    expect(panel().querySelector('b')).toBeNull();
    showMaterialTooltip(host, '', 'after');
    expect(panel()).toBeNull();
  });

  it('cancels a pending hide when the same host is re-entered', () => {
    showMaterialTooltip(host, 'Metric detail', 'after');
    const original = panel();
    hideMaterialTooltip(host);
    expect(original.querySelector('.mat-mdc-tooltip')).toHaveClass('mat-mdc-tooltip-hide');
    vi.advanceTimersByTime(50);
    showMaterialTooltip(host, 'Updated detail', 'after');
    vi.advanceTimersByTime(75);
    expect(panel()).toBe(original);
    expect(panel()).toHaveTextContent('Updated detail');
    expect(panel().querySelector('.mat-mdc-tooltip')).toHaveClass('mat-mdc-tooltip-show');
    hideMaterialTooltip(host);
    vi.advanceTimersByTime(75);
    expect(panel()).toBeNull();
  });

  it('keeps the tooltip open while the pointer moves between host and overlay', () => {
    showMaterialTooltip(host, 'Metric detail', 'after');
    const overlay = panel();
    hideMaterialTooltip(host, overlay.firstElementChild);
    vi.advanceTimersByTime(75);
    expect(panel()).toBe(overlay);
    overlay.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: host }));
    vi.advanceTimersByTime(75);
    expect(panel()).toBe(overlay);
    overlay.dispatchEvent(new MouseEvent('mouseleave', { relatedTarget: document.body }));
    vi.advanceTimersByTime(75);
    expect(panel()).toBeNull();
  });

  it('dismisses on unmodified Escape without swallowing other keys', () => {
    showMaterialTooltip(host, 'Metric detail', 'after');
    for (const options of [{ key: 'Enter' }, { key: 'Escape', shiftKey: true }]) {
      const event = new KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true });
      host.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    host.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    const nextEscape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    host.dispatchEvent(nextEscape);
    expect(nextEscape.defaultPrevented).toBe(false);
    vi.advanceTimersByTime(75);
    expect(panel()).toBeNull();
  });

  it('dismisses on outside clicks but not clicks inside its own overlay', () => {
    showMaterialTooltip(host, 'Metric detail', 'after');
    vi.advanceTimersByTime(150);
    panel().click();
    vi.advanceTimersByTime(75);
    expect(panel()).not.toBeNull();
    document.body.click();
    vi.advanceTimersByTime(75);
    expect(panel()).toBeNull();
  });

  it('keeps independent overlays for nested hosts', () => {
    const child = document.createElement('span');
    host.appendChild(child);
    showMaterialTooltip(host, 'Header detail', 'after');
    showMaterialTooltip(child, 'Expand detail', 'below');
    expect(document.querySelectorAll('.mat-mdc-tooltip-panel')).toHaveLength(2);
    hideMaterialTooltip(child);
    vi.advanceTimersByTime(75);
    expect(document.querySelectorAll('.mat-mdc-tooltip-panel')).toHaveLength(1);
    expect(panel()).toHaveTextContent('Header detail');
  });

  it('repositions on resize and scrolling and stops observing after disposal', () => {
    showMaterialTooltip(host, 'Metric detail', 'after');
    const bounds = vi.mocked(host.getBoundingClientRect);
    bounds.mockReturnValue(new DOMRect(300, 90, 100, 20));
    window.dispatchEvent(new Event('resize'));
    expect(panel()).toHaveStyle({ left: '172px', top: '80px' });
    bounds.mockReturnValue(new DOMRect(100, 190, 100, 20));
    document.dispatchEvent(new Event('scroll'));
    expect(panel()).toHaveStyle({ left: '208px', top: '180px' });
    hideMaterialTooltip(host);
    disposeMaterialTooltip(host);
    expect(panel()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
    bounds.mockClear();
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('scroll'));
    expect(bounds).not.toHaveBeenCalled();
  });

  it('left-aligns wrapped text without changing short tooltip alignment', () => {
    size = new DOMRect(0, 0, 200, 56);
    showMaterialTooltip(host, 'A longer explanation that wraps over several lines.', 'after');
    expect(panel().querySelector('.mat-mdc-tooltip')).toHaveClass('mdc-tooltip--multiline');
    size = new DOMRect(0, 0, 120, 40);
    showMaterialTooltip(host, 'Short detail', 'after');
    expect(panel().querySelector('.mat-mdc-tooltip')).not.toHaveClass('mdc-tooltip--multiline');
  });
});
