import type { Activity } from '../../shared/types';
import { formatDate } from '../components';

export function TerminalPanel({ activities, workspace }: { activities: Activity[]; workspace?: string }) {
  return <div className="reason-terminal-panel" aria-label="Terminal activity">
    <div className="reason-terminal-head"><span className="reason-terminal-dot" aria-hidden="true" /><span>{workspace || 'Host workspace'}</span><small>read-only</small></div>
    <div className="reason-terminal-body">
      {activities.length ? activities.map(item => <div className={`reason-terminal-entry is-${item.status}`} key={item.id}>
        <div className="reason-terminal-line"><span className="reason-terminal-prompt">$</span><span>{item.title}</span><small>{item.status}</small></div>
        {item.detail && <pre>{item.detail}</pre>}
        <span className="reason-terminal-time">{formatDate(item.createdAt, true)}</span>
      </div>) : <div className="reason-sidepanel-empty">No terminal activity in this session yet.</div>}
    </div>
    <p className="reason-terminal-note">Read-only activity from this session. Commands and tools run through Codex approvals.</p>
  </div>;
}
