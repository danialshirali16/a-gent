import { cloneElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { overlayRoot } from './portal';

type TooltipChildProps = { 'aria-describedby'?: string };

export interface TooltipProps {
  label: ReactNode;
  children: ReactElement<TooltipChildProps>;
  shortcut?: string;
  side?: 'top' | 'bottom';
  delay?: number;
  className?: string;
}

export function Tooltip({ label, children, shortcut, side = 'top', delay = 450, className = '' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = `tooltip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  function clearTimer() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }
  function show(wait = delay) {
    clearTimer();
    timer.current = setTimeout(() => {
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ left: rect.left + rect.width / 2, top: side === 'top' ? rect.top - 8 : rect.bottom + 8 });
      setOpen(true);
    }, wait);
  }
  function hide() { clearTimer(); setOpen(false); }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); };
  }, [open]);
  useEffect(() => () => clearTimer(), []);

  const describedBy = [children.props['aria-describedby'], open ? id : null].filter(Boolean).join(' ') || undefined;
  const trigger = cloneElement(children, { 'aria-describedby': describedBy });

  return <span
    ref={anchor}
    className={`ui-tooltip-anchor ${className}`.trim()}
    onPointerEnter={event => { if (event.pointerType === 'mouse') show(); }}
    onPointerLeave={hide}
    onPointerDown={hide}
    onFocus={() => show(120)}
    onBlur={hide}
    onKeyDown={event => { if (event.key === 'Escape') hide(); }}
  >
    {trigger}
    {open && createPortal(<span role="tooltip" id={id} className="ui-tooltip" data-side={side} style={{ left: position.left, top: position.top }}>
      <span>{label}</span>
      {shortcut && <kbd>{shortcut}</kbd>}
    </span>, overlayRoot())}
  </span>;
}
