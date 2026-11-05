import type { ElementType, MouseEventHandler, ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  as?: ElementType;
  variant?: 'plain' | 'flat' | 'raised' | 'interactive';
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
}

export function Card({ children, as: Tag = 'div', variant = 'plain', className = '', onClick }: CardProps) {
  return <Tag className={`ui-card is-${variant} ${className}`.trim()} onClick={onClick}>{children}</Tag>;
}

export interface ListRowProps {
  leading?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
}

export function ListRow({ leading, primary, secondary, trailing, onClick, selected = false, className = '', ...aria }: ListRowProps) {
  const content = <>
    {leading && <span className="ui-list-row-leading">{leading}</span>}
    <span className="ui-list-row-copy"><strong>{primary}</strong>{secondary && <small>{secondary}</small>}</span>
    {trailing && <span className="ui-list-row-trailing">{trailing}</span>}
  </>;
  const classes = `ui-list-row ${selected ? 'is-selected' : ''} ${className}`.trim();
  if (onClick) return <button type="button" className={classes} onClick={onClick} aria-current={selected ? 'page' : undefined} {...aria}>{content}</button>;
  return <div className={classes} {...aria}>{content}</div>;
}
