import { AlertCircle, Check, ChevronDown, LoaderCircle, Terminal, Wrench } from 'lucide-react';
import type { Activity } from '../../shared/types';

export function ToolStream({ activities, forceOpen = false }: { activities: Activity[]; forceOpen?: boolean }) {
  if (!activities.length) return null;
  const last = activities.at(-1)!;
  const failed = last.status === 'failed' || activities.some(activity => activity.status === 'failed');
  return <details className="reason-tool-stream" open={failed || forceOpen}>
    <summary>
      {last.status === 'running' ? <LoaderCircle size={13} className="spin" /> : failed ? <AlertCircle size={13} /> : <Check size={13} />}
      <span>{last.status === 'running' ? last.title : `${activities.length} ${activities.length === 1 ? 'step' : 'steps'}`}</span>
      <ChevronDown size={12} />
    </summary>
    <div className="reason-tool-stream-list">
      {activities.map(activity => {
        const Icon = activity.kind === 'command' ? Terminal : Wrench;
        const StatusIcon = activity.status === 'running' ? LoaderCircle : activity.status === 'failed' ? AlertCircle : Check;
        return <div className="reason-tool-row" key={activity.id}>
          <StatusIcon size={13} className={activity.status === 'running' ? 'spin' : undefined} />
          <div>
            <p><Icon size={11} /> {activity.title}</p>
            {activity.detail && <pre>{activity.detail}</pre>}
          </div>
        </div>;
      })}
    </div>
  </details>;
}
