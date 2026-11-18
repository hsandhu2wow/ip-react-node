export type MaterialTooltipPosition = 'after' | 'below';

interface Tooltip {
  panel: HTMLDivElement;
  content: HTMLDivElement;
  surface: HTMLDivElement;
  position: MaterialTooltipPosition;
  hideTimer?: number;
}

interface Placement {
  left: number;
  top: number;
  offsetX: number;
  offsetY: number;
  side: 'right' | 'left' | 'below' | 'above';
}

const tooltips = new Map<Element, Tooltip>();
const GAP = 8;

function positionTooltip(host: Element, tooltip: Tooltip): void {
  const origin = host.getBoundingClientRect();
  const rect = tooltip.panel.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);
  const viewportWidth = document.documentElement.clientWidth - GAP * 2;
  const viewportHeight = document.documentElement.clientHeight - GAP * 2;
  const centerX = origin.left + (origin.width - rect.width) / 2;
  const centerY = origin.top + (origin.height - rect.height) / 2;
  const choices: Placement[] = tooltip.position === 'after' ? [
    { left: origin.right, top: centerY, offsetX: GAP, offsetY: 0, side: 'right' },
    { left: origin.left - rect.width, top: centerY, offsetX: -GAP, offsetY: 0, side: 'left' },
  ] : [
    { left: centerX, top: origin.bottom, offsetX: 0, offsetY: GAP, side: 'below' },
    { left: centerX, top: origin.top - rect.height, offsetX: 0, offsetY: -GAP, side: 'above' },
  ];
  const visibleArea = (choice: Placement) => {
    const x = choice.left + choice.offsetX;
    const y = choice.top + choice.offsetY;
    return (width - Math.max(0, -x) - Math.max(0, x + width - viewportWidth))
      * (height - Math.max(0, -y) - Math.max(0, y + height - viewportHeight));
  };
  const best = choices.find(choice => visibleArea(choice) === width * height)
    ?? choices.reduce((a, b) => visibleArea(b) > visibleArea(a) ? b : a);
  let { left, top } = best;

  // CDK pushes the un-offset rectangle into its narrowed viewport, then adds the anchor gap.
  if (visibleArea(best) !== width * height) {
    left = width <= viewportWidth
      ? left + (Math.max(0, GAP - left) || -Math.max(0, left + width - viewportWidth))
      : Math.max(GAP, left);
    top = height <= viewportHeight
      ? top + (Math.max(0, GAP - top) || -Math.max(0, top + height - viewportHeight))
      : Math.max(GAP, top);
  }
  tooltip.panel.style.left = `${left + best.offsetX}px`;
  tooltip.panel.style.top = `${top + best.offsetY}px`;
  tooltip.panel.className = `mat-mdc-tooltip-panel mat-mdc-tooltip-panel-${best.side}`;
  tooltip.content.style.transformOrigin = {
    right: 'left center', left: 'right center', below: 'center top', above: 'center bottom',
  }[best.side];
  tooltip.content.classList.toggle('mdc-tooltip--multiline', rect.height > 24 && rect.width >= 200);
}

function repositionTooltips(): void {
  tooltips.forEach((tooltip, host) => positionTooltip(host, tooltip));
}

function onOutsideClick(event: MouseEvent): void {
  tooltips.forEach((tooltip, host) => {
    if (!(event.target instanceof Node) || !tooltip.panel.contains(event.target)) hideMaterialTooltip(host);
  });
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (![...tooltips.values()].some(tooltip => tooltip.hideTimer === undefined)) return;
  event.preventDefault();
  event.stopPropagation();
  tooltips.forEach((_, host) => hideMaterialTooltip(host));
}

function addListeners(): void {
  document.addEventListener('click', onOutsideClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('scroll', repositionTooltips, true);
  window.addEventListener('resize', repositionTooltips);
}

function removeListeners(): void {
  document.removeEventListener('click', onOutsideClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  document.removeEventListener('scroll', repositionTooltips, true);
  window.removeEventListener('resize', repositionTooltips);
}

export function showMaterialTooltip(host: Element, message: string, position: MaterialTooltipPosition): void {
  const text = message.trim();
  if (!text) {
    disposeMaterialTooltip(host);
    return;
  }
  let tooltip = tooltips.get(host);
  if (!tooltip) {
    const panel = document.createElement('div');
    panel.className = 'mat-mdc-tooltip-panel';
    panel.setAttribute('role', 'tooltip');
    panel.setAttribute('aria-hidden', 'true');
    const content = document.createElement('div');
    content.className = 'mdc-tooltip mat-mdc-tooltip';
    const surface = document.createElement('div');
    surface.className = 'mat-mdc-tooltip-surface mdc-tooltip__surface';
    content.appendChild(surface);
    panel.appendChild(content);
    panel.addEventListener('mouseleave', event => {
      if (!(event.relatedTarget instanceof Node) || !host.contains(event.relatedTarget)) hideMaterialTooltip(host);
    });
    document.body.appendChild(panel);
    tooltip = { panel, content, surface, position };
    tooltips.set(host, tooltip);
    if (tooltips.size === 1) addListeners();
  }
  window.clearTimeout(tooltip.hideTimer);
  tooltip.hideTimer = undefined;
  tooltip.position = position;
  tooltip.surface.textContent = text;
  positionTooltip(host, tooltip);
  tooltip.content.classList.remove('mat-mdc-tooltip-hide');
  tooltip.content.classList.add('mat-mdc-tooltip-show');
}

export function hideMaterialTooltip(host: Element, relatedTarget?: EventTarget | null): void {
  const tooltip = tooltips.get(host);
  if (!tooltip || tooltip.hideTimer !== undefined) return;
  if (relatedTarget instanceof Node && tooltip.panel.contains(relatedTarget)) return;
  tooltip.content.classList.remove('mat-mdc-tooltip-show');
  tooltip.content.classList.add('mat-mdc-tooltip-hide');
  tooltip.hideTimer = window.setTimeout(() => disposeMaterialTooltip(host), 75);
}

export function disposeMaterialTooltip(host: Element): void {
  const tooltip = tooltips.get(host);
  if (!tooltip) return;
  window.clearTimeout(tooltip.hideTimer);
  tooltip.panel.remove();
  tooltips.delete(host);
  if (!tooltips.size) removeListeners();
}
