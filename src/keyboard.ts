import type { KeyboardEvent } from 'react';

/** Move focus within a popup or menu using arrow, Home, and End keys. */
export function moveFocus(event: KeyboardEvent<HTMLElement>, selector = 'button:not([disabled])'): boolean {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return false;
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(selector));
  if (!items.length) return false;
  const current = items.indexOf(document.activeElement as HTMLElement);
  let next = current;
  if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length;
  else if (event.key === 'ArrowUp') next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = items.length - 1;
  event.preventDefault();
  items[next].focus();
  return true;
}
