import { useEffect, useId, useRef, type ComponentPropsWithRef, type ReactNode, type Ref } from 'react';
import { Check, Minus } from 'lucide-react';

type ChoiceBaseProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> & {
  label: ReactNode;
  description?: ReactNode;
};

export type CheckboxProps = ChoiceBaseProps & {
  indeterminate?: boolean;
};

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

export function Checkbox({ label, description, indeterminate = false, id, className = '', disabled, ref, ...props }: CheckboxProps) {
  const generated = useId();
  const controlId = id || `checkbox-${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (input.current) input.current.indeterminate = indeterminate; }, [indeterminate]);
  return <label className={`ui-choice ui-checkbox ${disabled ? 'is-disabled' : ''} ${className}`.trim()} htmlFor={controlId}>
    <input
      {...props}
      ref={node => { input.current = node; setRef(ref, node); }}
      id={controlId}
      className="ui-choice-input"
      type="checkbox"
      disabled={disabled}
      aria-checked={indeterminate ? 'mixed' : props['aria-checked']}
    />
    <span className="ui-choice-indicator" aria-hidden="true">{indeterminate ? <Minus size={11} strokeWidth={2.6} /> : <Check size={11} strokeWidth={2.8} />}</span>
    <span className="ui-choice-copy"><span className="ui-choice-label">{label}</span>{description && <small>{description}</small>}</span>
  </label>;
}

export type SwitchProps = ChoiceBaseProps & {
  controlSize?: 'sm' | 'md';
};

export function Switch({ label, description, controlSize = 'md', id, className = '', disabled, ref, ...props }: SwitchProps) {
  const generated = useId();
  const controlId = id || `switch-${generated.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <label className={`ui-choice ui-switch ${disabled ? 'is-disabled' : ''} ${className}`.trim()} data-control-size={controlSize} htmlFor={controlId}>
    <input {...props} ref={ref} id={controlId} className="ui-choice-input" type="checkbox" role="switch" disabled={disabled} />
    <span className="ui-choice-copy"><span className="ui-choice-label">{label}</span>{description && <small>{description}</small>}</span>
    <span className="ui-switch-track" aria-hidden="true"><span className="ui-switch-thumb" /></span>
  </label>;
}
