import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'brand';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, tone = 'neutral', size = 'sm', dot = false, icon, className = '' }: BadgeProps) {
  return <span className={`ui-badge is-${tone} is-${size} ${className}`.trim()}>
    {dot && <span className="ui-badge-dot" aria-hidden="true" />}
    {icon && <span className="ui-badge-icon" aria-hidden="true">{icon}</span>}
    {children}
  </span>;
}

export interface StatusIndicatorProps {
  label: ReactNode;
  tone?: BadgeTone;
  pulse?: boolean;
  size?: BadgeSize;
  className?: string;
}

export function StatusIndicator({ label, tone = 'neutral', pulse = false, size = 'sm', className = '' }: StatusIndicatorProps) {
  return <span className={`ui-status is-${tone} is-${size} ${pulse ? 'is-pulse' : ''} ${className}`.trim()}>
    <span className="ui-status-dot" aria-hidden="true" />
    <span>{label}</span>
  </span>;
}

export function StatusDot({ label, tone = 'neutral', pulse = false, className = '' }: { label: string; tone?: BadgeTone; pulse?: boolean; className?: string }) {
  return <span className={`ui-status-dot is-${tone} ${pulse ? 'is-pulse' : ''} ${className}`.trim()} role="img" aria-label={label} />;
}
