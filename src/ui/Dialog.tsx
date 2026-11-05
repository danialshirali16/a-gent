import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, X } from 'lucide-react';
import { Button, IconButton } from './Button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DialogProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: DialogSize;
  className?: string;
  backLabel?: string;
  description?: ReactNode;
  footer?: ReactNode;
  initialFocusSelector?: string;
  closeLabel?: string;
}

export function Dialog({ title, children, onClose, size = 'md', className = '', backLabel, description, footer, initialFocusSelector, closeLabel = 'Close dialog' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const generated = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const titleId = `dialog-title-${generated}`;
  const descriptionId = description ? `dialog-description-${generated}` : undefined;

  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    const selector = initialFocusSelector || 'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])';
    (dialog?.querySelector<HTMLElement>(selector) || dialog?.querySelector<HTMLElement>('button:not([disabled])'))?.focus();
    return () => { if (returnFocus.current?.isConnected) returnFocus.current.focus(); };
  }, [initialFocusSelector]);

  return <dialog
    className={`modal ui-dialog ui-dialog-${size} ${className}`.trim()}
    ref={ref}
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
    aria-modal="true"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
  >
    <div className="modal-content ui-dialog-content">
      <div className="modal-heading ui-dialog-heading">
        <h2 id={titleId} className={backLabel ? 'sr-only' : undefined}>{title}</h2>
        {backLabel && <button className="modal-back" onClick={onClose}><ArrowLeft size={16} /><span>{backLabel}</span></button>}
        <IconButton label={closeLabel} onClick={onClose}><X size={19} /></IconButton>
      </div>
      {description && <p className="ui-dialog-description" id={descriptionId}>{description}</p>}
      {children}
      {footer && <div className="ui-dialog-footer">{footer}</div>}
    </div>
  </dialog>;
}

export interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  error?: ReactNode;
  cancelLabel?: string;
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onClose, tone = 'danger', busy = false, error, cancelLabel = 'Cancel' }: ConfirmDialogProps) {
  return <Dialog title={title} onClose={onClose} size="sm" className="ui-confirm" initialFocusSelector=".ui-confirm-cancel" closeLabel="Close confirmation">
    <div className="ui-confirm-body">
      <span className={`ui-confirm-icon is-${tone}`} aria-hidden="true">{tone === 'danger' ? <AlertTriangle size={19} /> : <AlertTriangle size={19} />}</span>
      <p>{description}</p>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-footer">
      <Button type="button" variant="quiet" className="ui-confirm-cancel" onClick={onClose} disabled={busy}>{cancelLabel}</Button>
      <Button type="button" variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Dialog>;
}
