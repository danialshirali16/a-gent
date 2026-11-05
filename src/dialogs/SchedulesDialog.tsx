import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import { ArrowUpRight, CalendarClock, Pause, Play, Plus } from 'lucide-react';
import type { Schedule, WorkspaceState } from '../../shared/types';
import type { Api } from '../dialogs';
import { AgentGlyph, Modal, formatDate } from '../components';
import { Card } from '../ui/Card';

export function SchedulesDialog({ state, api, onCreate, onOpen, onError, onClose }: {
  state: WorkspaceState;
  api: Api;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}) {
  const schedules = [...state.schedules].sort((a, b) => a.runAt.localeCompare(b.runAt));
  async function toggle(schedule: Schedule) {
    try { await api(`/api/schedules/${schedule.id}`, 'PATCH', { enabled: !schedule.enabled }); }
    catch (reason) { onError((reason as Error).message); }
  }
  return <Modal title="Scheduled" onClose={onClose} className="modal-schedules">
    <div className="agents-modal-header"><p>One-time tasks that run while the A Gent host is open.</p><Button variant="primary" size="sm" onClick={onCreate}><Plus size={15} />Schedule task</Button></div>
    {schedules.length ? <div className="schedules-modal-list">{schedules.map(schedule => {
      const agent = state.agents.find(item => item.id === schedule.agentId);
      return <Card as="article" variant="raised" className="schedules-modal-card" key={schedule.id}>
        <div className="schedules-modal-head"><AgentGlyph agent={agent || { color: '#9393ed', icon: 'custom' }} size={30} /><div><h3>{schedule.title}</h3><span>{agent?.name} · {formatDate(schedule.runAt, true)}</span></div><Badge tone={schedule.error ? 'danger' : schedule.lastRunAt ? 'success' : schedule.enabled ? 'info' : 'neutral'} dot>{schedule.error ? 'Failed' : schedule.lastRunAt ? 'Completed' : schedule.enabled ? 'Scheduled' : 'Paused'}</Badge></div>
        <p>{schedule.prompt}</p>
        {schedule.error && <Alert tone="danger">{schedule.error}</Alert>}
        <div className="schedules-modal-actions">{schedule.conversationId && <Button variant="text" size="sm" onClick={() => onOpen(schedule.conversationId!)}>Open conversation<ArrowUpRight size={14} /></Button>}{!schedule.lastRunAt && <Button variant="quiet" size="sm" onClick={() => void toggle(schedule)}>{schedule.enabled ? <Pause size={14} /> : <Play size={14} />}{schedule.enabled ? 'Pause' : 'Resume'}</Button>}</div>
      </Card>;
    })}</div> : <div className="schedules-modal-empty"><CalendarClock size={30} /><h3>A head start on what’s next.</h3><p>Schedule a one-time task. Your agent will start it while the host is running.</p><Button variant="secondary" size="sm" onClick={onCreate}><Plus size={14} />Schedule your first task</Button></div>}
    <p className="connections-note">Times use your device’s timezone. Tasks run once and require a connected model.</p>
  </Modal>;
}
