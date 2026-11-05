import type { ComponentPropsWithRef } from 'react';

export type ControlSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url' | 'date' | 'datetime-local' | 'month' | 'time' | 'week';

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'type'> & {
  type?: InputType;
  controlSize?: ControlSize;
};

/** A native text field. Labels and descriptions remain explicit at the call site. */
export function Input({ type = 'text', controlSize = 'md', className = '', ...props }: InputProps) {
  return <input {...props} type={type} className={`text-control text-input ${className}`.trim()} data-control-size={controlSize} />;
}

export type TextareaProps = ComponentPropsWithRef<'textarea'> & {
  controlSize?: ControlSize;
};

export function Textarea({ controlSize = 'md', rows = 4, className = '', ...props }: TextareaProps) {
  return <textarea {...props} rows={rows} className={`text-control text-area ${className}`.trim()} data-control-size={controlSize} />;
}
