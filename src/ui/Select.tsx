import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import type { ControlSize } from './Input';

export type SelectProps = ComponentPropsWithRef<'select'> & {
  controlSize?: ControlSize;
};

/** A native select with a consistent compact surface and chevron. */
export function Select({ controlSize = 'md', className = '', children, ...props }: SelectProps) {
  return <span className={`ui-select ${className}`.trim()} data-control-size={controlSize} data-disabled={props.disabled ? 'true' : undefined}>
    <select {...props} className="ui-select-native">{children}</select>
    <ChevronDown className="ui-select-chevron" size={14} aria-hidden="true" />
  </span>;
}
