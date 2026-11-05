import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { moveFocus } from '../keyboard';
import { overlayRoot } from './portal';

export interface MenuItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect?: () => void;
}

type MenuTriggerProps = {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  'aria-haspopup'?: 'menu';
  'aria-expanded'?: boolean;
};

interface SurfaceProps {
  items: MenuItem[];
  label: string;
  onClose: () => void;
  position: { left: number; top: number };
  align: 'start' | 'end';
  side: 'bottom' | 'top';
  context?: boolean;
  returnFocus?: HTMLElement | null;
}

function MenuSurface({ items, label, onClose, position, align, side, context = false, returnFocus }: SurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState(position);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    let left = position.left;
    let top = position.top;
    if (context) {
      left = Math.min(left, window.innerWidth - rect.width - 8);
      top = Math.min(top, window.innerHeight - rect.height - 8);
      left = Math.max(8, left);
      top = Math.max(8, top);
    }
    if (left !== resolved.left || top !== resolved.top) setResolved({ left, top });
    element.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    // Only resolve the position once for a given opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) onClose(); };
    const dismiss = () => onClose();
    window.addEventListener('pointerdown', close);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [onClose]);

  function closeAndRestore() {
    onClose();
    returnFocus?.focus();
  }

  return <div
    ref={ref}
    className={`ui-menu ${context ? 'is-context' : ''} ${align === 'end' ? 'is-align-end' : ''} ${side === 'top' ? 'is-side-top' : ''}`.trim()}
    role="menu"
    aria-label={label}
    style={{ left: resolved.left, top: resolved.top }}
    onKeyDown={event => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); closeAndRestore();
      } else if (event.key === 'Tab') {
        onClose();
      } else {
        moveFocus(event, '[role="menuitem"]:not([disabled])');
      }
    }}
  >
    {items.map(item => <div key={item.id} role="presentation">
      {item.separatorBefore && <div className="ui-menu-divider" role="separator" />}
      <button
        type="button"
        role="menuitem"
        className={item.danger ? 'is-danger' : undefined}
        disabled={item.disabled}
        onClick={() => { closeAndRestore(); item.onSelect?.(); }}
      >
        {item.icon && <span className="ui-menu-icon" aria-hidden="true">{item.icon}</span>}
        <span className="ui-menu-label">{item.label}</span>
        {item.shortcut && <kbd>{item.shortcut}</kbd>}
      </button>
    </div>)}
  </div>;
}

export interface MenuProps {
  trigger: ReactElement<MenuTriggerProps>;
  items: MenuItem[];
  label: string;
  align?: 'start' | 'end';
  side?: 'bottom' | 'top';
  className?: string;
}

export function Menu({ trigger, items, label, align = 'start', side = 'bottom', className = '' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const anchor = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  function openMenu() {
    const rect = anchor.current?.getBoundingClientRect();
    if (!rect) return;
    triggerRef.current = anchor.current?.querySelector<HTMLElement>('button, a, [role="button"]') || null;
    setPosition({ left: align === 'end' ? rect.right : rect.left, top: side === 'top' ? rect.top - 6 : rect.bottom + 6 });
    setOpen(true);
  }

  const cloned = cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      trigger.props.onClick?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (open) setOpen(false); else openMenu();
    },
  });

  return <span className={`ui-menu-anchor ${className}`.trim()} ref={anchor}>
    {cloned}
    {open && createPortal(<MenuSurface items={items} label={label} onClose={() => setOpen(false)} position={position} align={align} side={side} returnFocus={triggerRef.current} />, overlayRoot())}
  </span>;
}

export interface ContextMenuProps {
  items: MenuItem[];
  label: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ContextMenu({ items, label, children, disabled = false, className = '' }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const returnFocus = useRef<HTMLElement | null>(null);

  function onContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    returnFocus.current = document.activeElement as HTMLElement | null;
    setPosition({ left: event.clientX, top: event.clientY });
    setOpen(true);
  }

  return <div className={`ui-context-anchor ${className}`.trim()} onContextMenu={onContextMenu}>
    {children}
    {open && createPortal(<MenuSurface items={items} label={label} onClose={() => setOpen(false)} position={position} align="start" side="bottom" context returnFocus={returnFocus.current} />, overlayRoot())}
  </div>;
}
