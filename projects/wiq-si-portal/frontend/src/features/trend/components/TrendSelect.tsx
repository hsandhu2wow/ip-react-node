import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './TrendSelect.module.scss';

interface Props {
  ariaLabel: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function TrendSelect({ ariaLabel, value, options, onChange }: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const selectedIndex = options.findIndex(option => option.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));
  const [position, setPosition] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const search = useRef({ text: '', time: 0 });
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    setOpen(false);
    setActiveIndex(Math.max(0, selectedIndex));
  }, [optionsKey, value, selectedIndex]);

  useLayoutEffect(() => {
    if (!open) return;
    const reposition = (event?: Event) => {
      if (!trigger.current || !panel.current || (event?.target instanceof Node && panel.current.contains(event.target))) return;
      const anchor = trigger.current.getBoundingClientRect();
      const bounds = panel.current.getBoundingClientRect();
      // Angular's inner mat-select stays 24px tall inside the 32px compact border.
      const bottom = anchor.top + (anchor.height + 24) / 2;
      const below = window.innerHeight - bottom - 8;
      const above = anchor.top - 8;
      const flip = below < bounds.height && above > below;
      const maxHeight = Math.max(0, Math.min(275, flip ? above : below));
      setPosition({
        left: Math.max(8, Math.min(anchor.left + 9, window.innerWidth - bounds.width - 8)),
        top: flip ? anchor.top - Math.min(bounds.height, maxHeight) : bottom,
        maxHeight,
      });
    };
    reposition();
    window.addEventListener('scroll', reposition, true);
    return () => window.removeEventListener('scroll', reposition, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) setOpen(false);
    };
    const resize = () => setOpen(false);
    document.addEventListener('mousedown', outside);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('resize', resize);
    };
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open, activeIndex, id]);

  function show() {
    if (!options.length) return;
    setPosition(null);
    setActiveIndex(Math.max(0, selectedIndex));
    search.current = { text: '', time: 0 };
    setOpen(true);
    trigger.current?.focus();
  }

  function commit(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    setActiveIndex(index);
    setOpen(false);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      // Angular retains the preview index for subsequent closed-arrow navigation.
      setOpen(false);
    } else if (key === 'Tab' && open) {
      commit(activeIndex);
    } else if (key === 'Enter' || key === ' ' || (event.altKey && (key === 'ArrowDown' || key === 'ArrowUp'))) {
      event.preventDefault();
      if (open) commit(activeIndex);
      else show();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault();
      const next = key === 'Home' ? 0 : key === 'End' ? options.length - 1
        : Math.max(0, Math.min(options.length - 1, activeIndex + (key === 'ArrowDown' ? 1 : -1)));
      setActiveIndex(next);
      if (!open) commit(next);
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const text = now - search.current.time < 200 ? search.current.text + key : key;
      search.current = { text: text.toLowerCase(), time: now };
      const query = [...text].every(char => char.toLowerCase() === text[0].toLowerCase()) ? text[0] : text;
      const next = options.findIndex((_, offset) => {
        const index = (activeIndex + offset + 1) % options.length;
        return options[index].label.toLowerCase().startsWith(query.toLowerCase());
      });
      if (next >= 0) {
        const index = (activeIndex + next + 1) % options.length;
        setActiveIndex(index);
        if (!open) commit(index);
      }
    }
  }

  return (
    <>
      <button ref={trigger} type="button" className={styles.trigger} role="combobox"
        aria-label={ariaLabel} aria-expanded={open} aria-haspopup="listbox"
        aria-controls={open ? id : undefined} aria-activedescendant={open ? `${id}-${activeIndex}` : undefined}
        disabled={!options.length} onClick={() => open ? setOpen(false) : show()} onKeyDown={keyDown}
        onBlur={() => setOpen(false)}>
        <span>{options[selectedIndex]?.label || ''}</span>
        <span className="material-icons" aria-hidden="true">arrow_drop_down</span>
      </button>
      {open && createPortal(
        <>
        <div className={styles.backdrop} data-testid="trend-select-backdrop" onMouseDown={event => {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }} />
        <div ref={panel} id={id} role="listbox" aria-label={ariaLabel} className={styles.panel}
          style={{ ...position, visibility: position ? 'visible' : 'hidden' }}
          onMouseDown={event => event.preventDefault()}>
          {options.map((option, index) => (
            <div key={option.value} id={`${id}-${index}`} role="option" aria-selected={option.value === value}
              className={`${styles.option} ${index === activeIndex ? styles.active : ''}`}
              onClick={() => commit(index)}>
              {option.label}
            </div>
          ))}
        </div>
        </>, document.body,
      )}
    </>
  );
}
