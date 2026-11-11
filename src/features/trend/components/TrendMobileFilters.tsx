import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './TrendMobileFilters.module.scss';

interface MobileTab {
  key: string;
  name: string;
  dates: string[];
}

interface Props {
  tabs: MobileTab[];
  tab: string;
  date: string;
  onChange: (tab: string, date: string) => void;
  hierarchy?: ReactNode;
}

export function TrendMobileFilters({ tabs, tab, date, onChange, hierarchy }: Props) {
  const [open, setOpen] = useState(false);
  const [draftTab, setDraftTab] = useState(tab);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = tabs.find(item => item.name === tab) || tabs[0];
  const preview = tabs.find(item => item.name === draftTab) || tabs[0];
  const dates = active?.dates || [];
  const index = dates.indexOf(date);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      trigger.current?.focus();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const outside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', keydown);
    document.addEventListener('mousedown', outside);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('mousedown', outside);
    };
  }, [open]);

  return (
    <div className={`${styles.row} ${!hierarchy ? styles.withArrows : ''}`}>
      {!hierarchy && (
        <button type="button" className={styles.arrow} aria-label="Older period"
          disabled={index < 0 || index === dates.length - 1} onClick={() => onChange(tab, dates[index + 1])}>
          <span className="material-icons" aria-hidden="true">keyboard_arrow_left</span>
        </button>
      )}
      <div className={styles.dropdown} ref={ref}>
        <button type="button" ref={trigger} className={styles.trigger} aria-label="Select mobile date"
          aria-haspopup="dialog" aria-expanded={open} onClick={() => { setDraftTab(tab); setOpen(value => !value); }}>
          <span>{date}</span><span className="material-icons" aria-hidden="true">arrow_drop_down</span>
        </button>
        {open && (
          <div className={styles.menu} role="dialog" aria-label="Choose period">
            {tabs.length > 1 && (
              <div className={styles.tabs} role="tablist" aria-label="Reporting period">
                {tabs.map(item => (
                  <button key={item.key} type="button" role="tab" aria-selected={item.name === draftTab}
                    onClick={() => setDraftTab(item.name)}>{item.name}</button>
                ))}
              </div>
            )}
            <div className={styles.list} role="listbox" aria-label="Available dates">
              {preview?.dates.map(value => (
                <button key={value} type="button" role="option" aria-selected={value === date} onClick={() => {
                  // Angular commits only when the date changes, even after previewing a different tab.
                  if (value !== date) onChange(preview.name, value);
                  setOpen(false);
                  trigger.current?.focus();
                }}>{value}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      {hierarchy}
      {!hierarchy && (
        <button type="button" className={styles.arrow} aria-label="Newer period"
          disabled={index <= 0} onClick={() => onChange(tab, dates[index - 1])}>
          <span className="material-icons" aria-hidden="true">keyboard_arrow_right</span>
        </button>
      )}
    </div>
  );
}
