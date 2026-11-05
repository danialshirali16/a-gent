import type { ComponentPropsWithRef, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

/** Native button behavior with A Gent's shared action styles. */
export function Button({
  variant = 'secondary', size = 'md', type = 'button', loading = false,
  loadingLabel, disabled, className = '', children, leadingIcon, trailingIcon,
  'aria-label': ariaLabel, ...props
}: ButtonProps) {
  const classes = ['button', variant, size === 'sm' ? 'small' : size === 'lg' ? 'large' : '', className].filter(Boolean).join(' ');
  return <button {...props} type={type} className={classes} disabled={disabled || loading}
    aria-busy={loading || undefined} aria-label={loading && loadingLabel ? loadingLabel : ariaLabel}
    data-loading={loading || undefined}>
    <span className="button-content">
      {leadingIcon && <span className="button-slot" aria-hidden="true">{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className="button-slot" aria-hidden="true">{trailingIcon}</span>}
    </span>
    {loading && <LoaderCircle className="button-spinner" aria-hidden="true" />}
  </button>;
}

export type IconButtonProps = Omit<ButtonProps, 'children'> & {
  label: string;
  children: ReactNode;
  /** Custom tooltip text. Defaults to the accessible label; false disables the tooltip. */
  tooltip?: string | false;
  shortcut?: string;
};

export function IconButton({ label, children, className = '', variant = 'quiet', title = label, tooltip, shortcut, ...props }: IconButtonProps) {
  const button = <Button {...props} variant={variant} className={`icon-button ${className}`} title={tooltip === false ? title : undefined} aria-label={label}>{children}</Button>;
  if (tooltip === false) return button;
  return <Tooltip label={typeof tooltip === 'string' ? tooltip : label} shortcut={shortcut}>{button}</Tooltip>;
}
