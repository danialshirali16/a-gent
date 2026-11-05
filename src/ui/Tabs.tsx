import { useId, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  variant?: 'underline' | 'segmented' | 'pill';
  size?: 'sm' | 'md';
  className?: string;
  idPrefix?: string;
  /** Id of the currently rendered panel, applied only to the active tab. */
  panelId?: string;
}

function nextIndex(event: KeyboardEvent<HTMLDivElement>, current: number, length: number) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') return (current - 1 + length) % length;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') return (current + 1) % length;
  if (event.key === 'Home') return 0;
  if (event.key === 'End') return length - 1;
  return null;
}

export function Tabs({ items, value, onChange, ariaLabel, variant = 'underline', size = 'md', className = '', idPrefix, panelId }: TabsProps) {
  const generated = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const prefix = idPrefix || `tabs-${generated}`;
  const enabled = items.filter(item => !item.disabled);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    const next = nextIndex(event, current, buttons.length);
    if (next === null) return;
    event.preventDefault();
    const target = buttons[next];
    target.focus();
    const id = target.dataset.tabId;
    if (id) onChange(id);
  }

  return <div className={`ui-tabs ui-tabs-${variant} ui-tabs-${size} ${className}`.trim()} role="tablist" aria-label={ariaLabel} aria-orientation="horizontal" onKeyDown={onKeyDown}>
    {items.map(item => <button
      key={item.id}
      type="button"
      role="tab"
      id={`${prefix}-tab-${item.id}`}
      data-tab-id={item.id}
      aria-selected={value === item.id}
      aria-controls={value === item.id ? panelId : undefined}
      tabIndex={value === item.id ? 0 : -1}
      disabled={item.disabled}
      className={value === item.id ? 'is-active' : ''}
      onClick={() => onChange(item.id)}
    >
      {item.icon && <span className="ui-tab-icon" aria-hidden="true">{item.icon}</span>}
      <span>{item.label}</span>
      {item.count !== undefined && item.count > 0 && <span className="ui-tab-count" aria-label={`${item.count} pending`}>{item.count}</span>}
    </button>)}
    {!enabled.length && <span className="sr-only">No tabs available</span>}
  </div>;
}

export interface SegmentedOption {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, ariaLabel, size = 'md', disabled = false, className = '' }: SegmentedControlProps) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    const next = nextIndex(event, current, buttons.length);
    if (next === null) return;
    event.preventDefault();
    buttons[next].focus();
  }

  return <div className={`ui-segmented ui-segmented-${size} ${disabled ? 'is-disabled' : ''} ${className}`.trim()} role="group" aria-label={ariaLabel} onKeyDown={onKeyDown}>
    {options.map(option => <button
      key={option.id}
      type="button"
      aria-pressed={value === option.id}
      className={value === option.id ? 'is-active' : ''}
      disabled={disabled || option.disabled}
      onClick={() => onChange(option.id)}
    >
      {option.icon && <span className="ui-tab-icon" aria-hidden="true">{option.icon}</span>}
      <span>{option.label}</span>
    </button>)}
  </div>;
}
