import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { overlayRoot } from './portal';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const icons = { neutral: Info, info: Info, success: CheckCircle2, warning: AlertTriangle, danger: AlertCircle };

export interface AlertProps {
  children?: ReactNode;
  title?: ReactNode;
  tone?: AlertTone;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ children, title, tone = 'info', size = 'sm', icon, action, onDismiss, className = '' }: AlertProps) {
  const Icon = icons[tone];
  return <div className={`ui-alert is-${tone} is-${size} ${className}`.trim()} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
    <span className="ui-alert-icon" aria-hidden="true">{icon || <Icon size={size === 'sm' ? 15 : 17} />}</span>
    <div className="ui-alert-copy">
      {title && <strong>{title}</strong>}
      {children && <div>{children}</div>}
    </div>
    {action && <div className="ui-alert-action">{action}</div>}
    {onDismiss && <button type="button" className="ui-alert-dismiss" aria-label="Dismiss" onClick={onDismiss}><X size={14} /></button>}
  </div>;
}

export interface ToastInput {
  title: string;
  description?: string;
  tone?: AlertTone;
  duration?: number;
}

interface ToastItem extends ToastInput { id: number; }

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});
export function useToast() { return useContext(ToastContext); }

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setToasts(previous => previous.filter(toast => toast.id !== id)), []);
  const toast = useCallback((input: ToastInput) => {
    const id = ++toastId;
    setToasts(previous => [...previous.slice(-2), { ...input, id }]);
  }, []);

  return <ToastContext.Provider value={toast}>
    {children}
    {createPortal(<div className="ui-toast-region" role="region" aria-label="Notifications" aria-live="polite">{toasts.map(item => <ToastView key={item.id} item={item} onDismiss={() => dismiss(item.id)} />)}</div>, overlayRoot())}
  </ToastContext.Provider>;
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = item.duration ?? 4200;

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(onDismiss, duration);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [paused, duration, onDismiss]);

  return <div
    className="ui-toast"
    onPointerEnter={() => setPaused(true)}
    onPointerLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
  >
    <Alert tone={item.tone || 'neutral'} size="md" title={item.title} onDismiss={onDismiss}>{item.description}</Alert>
  </div>;
}
