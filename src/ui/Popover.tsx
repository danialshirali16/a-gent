import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { overlayRoot } from './portal';

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  label: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  width?: number | string;
  className?: string;
  role?: 'dialog' | 'menu' | 'listbox';
  /** Focus the first match inside the popover when it opens. */
  initialFocusSelector?: string;
}

export function Popover({ open, onClose, anchorRef, label, children, align = 'start', side = 'bottom', width = 320, className = '', role = 'dialog', initialFocusSelector }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, availableHeight: 0, side, ready: false });
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const element = ref.current;
      const widthValue = element?.offsetWidth || (typeof width === 'number' ? width : 320);
      const rtl = getComputedStyle(anchor).direction === 'rtl';
      const start = rtl ? rect.right - widthValue : rect.left;
      const end = rtl ? rect.left : rect.right - widthValue;
      let left = align === 'end' ? end : align === 'center' ? rect.left + rect.width / 2 - widthValue / 2 : start;
      left = Math.max(8, Math.min(left, window.innerWidth - widthValue - 8));
      const viewportTop = window.visualViewport?.offsetTop || 0;
      const viewportBottom = viewportTop + (window.visualViewport?.height || window.innerHeight);
      const above = Math.max(0, rect.top - viewportTop - 16);
      const below = Math.max(0, viewportBottom - rect.bottom - 16);
      const preferred = side === 'top' ? above : below;
      const opposite = side === 'top' ? below : above;
      const actualSide = preferred < (element?.offsetHeight || 0) && opposite > preferred ? (side === 'top' ? 'bottom' : 'top') : side;
      const availableHeight = Math.floor(actualSide === 'top' ? above : below);
      const top = actualSide === 'top' ? rect.top - 8 : rect.bottom + 8;
      setPosition(previous => previous.left === left && previous.top === top && previous.availableHeight === availableHeight && previous.side === actualSide && previous.ready ? previous : { left, top, availableHeight, side: actualSide, ready: true });
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); window.visualViewport?.removeEventListener('resize', update); };
  }, [open, anchorRef, align, side, width]);

  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (ref.current?.contains(event.target as Node) || anchorRef.current?.contains(event.target as Node)) return;
      closeRef.current();
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeRef.current();
      anchorRef.current?.querySelector<HTMLElement>('button, [role="button"]')?.focus();
    };
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && ref.current?.contains(event.target)) return;
      closeRef.current();
    };
    window.addEventListener('pointerdown', pointer);
    window.addEventListener('keydown', key);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('pointerdown', pointer);
      window.removeEventListener('keydown', key);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [open, anchorRef]);

  useLayoutEffect(() => {
    if (!open || !position.ready) return;
    const element = ref.current;
    const target = initialFocusSelector ? element?.querySelector<HTMLElement>(initialFocusSelector) : element?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex="0"]');
    target?.focus({ preventScroll: true });
  }, [open, initialFocusSelector, position.ready]);

  if (!open) return null;
  return createPortal(<div
    ref={ref}
    className={`ui-popover ${className}`.trim()}
    role={role}
    aria-label={label}
    data-side={position.side}
    data-align={align}
    data-constrained={position.ready && position.availableHeight < 360 ? 'true' : undefined}
    style={{ left: position.left, top: position.top, width, '--popover-available-height': position.ready ? `${position.availableHeight}px` : undefined, opacity: position.ready ? 1 : 0, pointerEvents: position.ready ? undefined : 'none', ...(position.side === 'top' ? { transform: 'translateY(-100%)' } : {}) } as CSSProperties}
  >
    {children}
  </div>, overlayRoot());
}
