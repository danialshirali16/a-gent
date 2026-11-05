import { type ReactNode } from 'react';
import { LoaderCircle, Check, Terminal, FileCode2, Wrench, ChevronDown } from 'lucide-react';
import type { Activity } from '../shared/types';
import { AgentMark } from './ui/Avatar';
import { Dialog } from './ui/Dialog';
export { Avatar, AgentGlyph, AgentMark, AvatarRuntimeProvider } from './ui/Avatar';
export { Button, IconButton } from './ui/Button';

export function Mark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return <AgentMark size={size} className={className} />;
}
export function Spinner({ size = 16 }: { size?: number }) { return <LoaderCircle size={size} className="spin" aria-hidden="true" />; }
export function Modal({ title, children, onClose, wide = false, className = '', backLabel }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string; backLabel?: string }) {
  return <Dialog title={title} onClose={onClose} size="md" className={`${wide ? 'modal-wide' : ''} ${className}`.trim()} backLabel={backLabel}>{children}</Dialog>;
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
