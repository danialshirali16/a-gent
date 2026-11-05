import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import type { ControlSize } from './Input';
import { overlayRoot } from './portal';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  group?: string;
  keywords?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  controlSize?: ControlSize;
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-required'?: boolean | 'true' | 'false';
  'aria-label'?: string;
}

let comboboxCount = 0;

export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Choose an option',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No options match.',
  id,
  name,
  disabled = false,
  required = false,
  controlSize = 'md',
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'aria-required': ariaRequired,
  'aria-label': ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 220, up: false });
  const wrapper = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useRef(`combobox-list-${++comboboxCount}`);
  const selected = options.find(option => option.value === value);
  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => options.filter(option => !needle || `${option.label} ${option.description || ''} ${option.group || ''} ${option.keywords || ''}`.toLowerCase().includes(needle)), [options, needle]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (wrapper.current?.contains(event.target as Node) || popup.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const dismiss = () => setOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    const selectedIndex = filtered.findIndex(option => option.value === value);
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    // The active option resets only when the list opens or the committed value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  function place() {
    const rect = wrapper.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const up = window.innerHeight - rect.bottom < 300 && rect.top > 300;
    setPosition({ left, top: up ? rect.top - 6 : rect.bottom + 6, width, up });
  }

  function openList() {
    if (disabled) return;
    place();
    setOpen(true);
    setQuery('');
  }

  function closeList() {
    setOpen(false);
    setQuery('');
  }

  function choose(option: ComboboxOption) {
    if (option.disabled) return;
    onChange(option.value);
    closeList();
    input.current?.focus();
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setActive(0);
    if (!open) setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) { openList(); return; }
      setActive(index => filtered.length ? (index + 1) % filtered.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { openList(); return; }
      setActive(index => filtered.length ? (index - 1 + filtered.length) % filtered.length : 0);
    } else if (event.key === 'Home' && open) {
      event.preventDefault(); setActive(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault(); setActive(Math.max(0, filtered.length - 1));
    } else if (event.key === 'Enter') {
      if (!open) { event.preventDefault(); openList(); return; }
      event.preventDefault();
      const option = filtered[active] || filtered[0];
      if (option) choose(option);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); closeList();
    } else if (event.key === 'Tab') {
      closeList();
    }
  }

  const displayValue = open ? query : (selected?.label || '');
  const activeOption = open ? filtered[active] : undefined;

  return <div className={`ui-combobox ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`.trim()} ref={wrapper} data-control-size={controlSize}>
    <input
      ref={input}
      id={id}
      name={name}
      className="text-control text-input ui-combobox-input"
      role="combobox"
      aria-expanded={open}
      aria-controls={listId.current}
      aria-autocomplete="list"
      aria-activedescendant={activeOption ? `${listId.current}-${active}` : undefined}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      aria-required={ariaRequired || required || undefined}
      aria-label={ariaLabel}
      autoComplete="off"
      disabled={disabled}
      required={required}
      data-control-size={controlSize}
      placeholder={open ? searchPlaceholder : placeholder}
      value={displayValue}
      onChange={onInputChange}
      onFocus={openList}
      onKeyDown={onKeyDown}
    />
    <ChevronDown className="ui-combobox-chevron" size={14} aria-hidden="true" />
    {open && createPortal(<div ref={popup} className="ui-combobox-popup is-portal" style={{ left: position.left, top: position.top, width: position.width, transform: position.up ? 'translateY(-100%)' : undefined }}>
      <ul id={listId.current} role="listbox" aria-label={ariaLabel || 'Options'}>
        {filtered.map((option, index) => {
          const showGroup = option.group && option.group !== filtered[index - 1]?.group;
          return <li role="presentation" key={option.value} className={showGroup ? 'has-group-label' : undefined}>
            {showGroup && <span className="ui-combobox-group" role="presentation">{option.group}</span>}
            <button
              type="button"
              role="option"
              id={`${listId.current}-${index}`}
              className={`${index === active ? 'is-active' : ''} ${option.value === value ? 'is-selected' : ''}`.trim()}
              aria-selected={option.value === value}
              disabled={option.disabled}
              tabIndex={-1}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(option)}
            >
              <span className="ui-combobox-option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
              {option.value === value && <Check size={14} aria-hidden="true" />}
            </button>
          </li>;
        })}
        {!filtered.length && <li className="ui-combobox-empty" role="presentation">{emptyMessage}</li>}
      </ul>
    </div>, overlayRoot())}
  </div>;
}
