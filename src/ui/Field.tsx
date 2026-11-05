import { cloneElement, useId, type ReactElement, type ReactNode } from 'react';

type FieldControlProps = {
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-required'?: boolean | 'true' | 'false';
};

export interface FieldProps {
  /** Visible field label. */
  label: ReactNode;
  /** A single form control. Field supplies its id and description/error wiring. */
  children: ReactElement<FieldControlProps>;
  /** Persistent guidance shown below the control. */
  description?: ReactNode;
  /** Validation message. Presence marks the control invalid and announces the message. */
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  /** Override the generated control id. */
  id?: string;
  className?: string;
  /** Keep the label available to assistive technology without showing it. */
  labelHidden?: boolean;
}

function generatedId(prefix: string, raw: string) {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/**
 * Shared label, requirement, description, and validation composition for a
 * single native-like control. The child receives id/aria wiring without
 * changing its own value or event handling.
 */
export function Field({ label, children, description, error, required = false, optional = false, id, className = '', labelHidden = false }: FieldProps) {
  const rawId = useId();
  const controlId = id || children.props.id || generatedId('field', rawId);
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null, children.props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  const control = cloneElement(children, {
    id: controlId,
    ...(required ? { required: true } : {}),
    ...(required ? { 'aria-required': true } : {}),
    ...(error ? { 'aria-invalid': true } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  });

  return <div className={`ui-field ${error ? 'is-invalid' : ''} ${className}`.trim()}>
    <label className={`ui-field-label ${labelHidden ? 'sr-only' : ''}`.trim()} htmlFor={controlId}>
      <span>{label}</span>
      {required && <span className="ui-field-required"><span aria-hidden="true">*</span><span className="sr-only"> required</span></span>}
      {optional && !required && <span className="ui-field-optional">Optional</span>}
    </label>
    {control}
    {description && <p className="ui-field-description" id={descriptionId}>{description}</p>}
    {error && <p className="ui-field-error" id={errorId} role="alert">{error}</p>}
  </div>;
}

export interface FieldGroupProps {
  label: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
}

/** Label and description composition for a group of controls such as swatches. */
export function FieldGroup({ label, children, description, error, required = false, className = '' }: FieldGroupProps) {
  const rawId = useId();
  const labelId = generatedId('field-group', rawId);
  const descriptionId = `${labelId}-description`;
  const errorId = `${labelId}-error`;
  return <div className={`ui-field ui-field-group ${error ? 'is-invalid' : ''} ${className}`.trim()} role="group" aria-labelledby={labelId} aria-describedby={[description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}>
    <span className="ui-field-label" id={labelId}>
      <span>{label}</span>
      {required && <span className="ui-field-required"><span aria-hidden="true">*</span><span className="sr-only"> required</span></span>}
    </span>
    {children}
    {description && <p className="ui-field-description" id={descriptionId}>{description}</p>}
    {error && <p className="ui-field-error" id={errorId} role="alert">{error}</p>}
  </div>;
}
