import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { Sparkles, Code2, Palette, Telescope, Bot, X, LoaderCircle, Check, Terminal, FileCode2, Wrench, ChevronDown } from 'lucide-react';
import type { Agent, Activity } from '../shared/types';

export function Mark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="11" fill="currentColor"/><path d="m10.5 29 8.2-17.3a1.5 1.5 0 0 1 2.7 0L29.5 29M14 23h12" stroke="var(--logo-ink, #211912)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="30" cy="10" r="2" fill="var(--logo-ink, #211912)"/></svg>;
}
const icons = { spark: Sparkles, code: Code2, design: Palette, search: Telescope, custom: Bot };
export function Avatar({ agent, size = 28 }: { agent: Pick<Agent, 'color' | 'icon'>; size?: number }) {
  const Icon = icons[agent.icon] || Bot;
  return <span className="agent-avatar" style={{ '--agent-color': agent.color, width: size, height: size } as CSSProperties}><Icon size={size * .53} strokeWidth={1.8} /></span>;
}
export function Spinner({ size = 16 }: { size?: number }) { return <LoaderCircle size={size} className="spin" aria-hidden="true" />; }
export function IconButton({ label, children, onClick, className = '', disabled = false }: { label: string; children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button className={`icon-button ${className}`} title={label} aria-label={label} onClick={onClick} disabled={disabled}>{children}</button>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `dialog-${title.replace(/[^a-z0-9]/gi, '-')}`;
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); dialog?.querySelector<HTMLElement>('input, textarea, select')?.focus(); }, []);
  return <dialog className={`modal ${wide ? 'modal-wide' : ''}`} ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-content"><div className="modal-heading"><h2 id={titleId}>{title}</h2><IconButton label="Close dialog" onClick={onClose}><X size={19} /></IconButton></div>{children}</div>
  </dialog>;
}
export function Activities({ activities }: { activities: Activity[] }) {
  if (!activities.length) return null;
  const last = activities.at(-1)!;
  return <details className="activity-block"><summary><span className="activity-symbol">{last.status === 'running' ? <Spinner size={14} /> : <Check size={14} />}</span><span>{last.status === 'running' ? last.title : `${activities.length} ${activities.length === 1 ? 'step' : 'steps'}`}</span><ChevronDown size={13} /></summary><div className="activity-list">{activities.map(activity => {
    const Icon = activity.kind === 'command' ? Terminal : activity.kind === 'file' ? FileCode2 : Wrench;
    return <div className="activity-row" key={activity.id}><span>{activity.status === 'running' ? <Spinner size={14} /> : activity.status === 'completed' ? <Check size={14} /> : <Icon size={14} />}</span><div><p>{activity.title}</p>{activity.detail && <pre>{activity.detail}</pre>}</div></div>;
  })}</div></details>;
}
export function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } as const : {}) }).format(new Date(value));
}
export function downloadJson(value: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
