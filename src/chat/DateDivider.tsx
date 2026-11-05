import type { ReactNode } from 'react';

export function DateDivider({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const label = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  return <div className="reason-date-divider">{label}</div>;
}

export function SystemEvent({ children }: { children: ReactNode }) {
  return <div className="reason-system-event">{children}</div>;
}
