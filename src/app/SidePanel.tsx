import { AlertCircle, Check, FolderPlus, LoaderCircle, MessageSquare, Plus, PanelRightClose, Settings2 } from 'lucide-react';
import type { Activity as ActivityItem, Agent, Conversation, Group, Run } from '../../shared/types';
import { AgentGlyph, IconButton, formatDate } from '../components';

export type SidePanelTab = 'session' | 'sessions' | 'activity' | 'approvals';

export interface SidePanelProps {
  tab: SidePanelTab;
  onTab: (tab: SidePanelTab) => void;
  onClose: () => void;
  agent?: Agent;
  conversation?: Conversation;
  conversations: Conversation[];
  groups: Group[];
  currentRun?: Run;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  onCreateGroup: () => void;
  onOpenConversationDetails: (conversation: Conversation) => void;
  onOpenAgent: () => void;
  onApproval: (id: string, accept: boolean) => void;
}

const effortLabel: Record<string, string> = { low: 'Light', medium: 'Balanced', high: 'Deep' };

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.status === 'running' ? LoaderCircle : item.status === 'failed' ? AlertCircle : Check;
  return <div className="reason-activity-row">
    <Icon size={14} className={item.status === 'running' ? 'spin' : undefined} />
    <div>
      <p>{item.title}</p>
      {item.detail && <pre>{item.detail}</pre>}
    </div>
  </div>;
}

export function SidePanel(props: SidePanelProps) {
  const activities = props.currentRun?.activities
    || [...(props.conversation?.messages || [])].reverse().find(message => message.role === 'assistant')?.activities
    || [];
  const workspace = props.conversation?.workspacePath || props.agent?.workspacePath || '';
  const status = props.currentRun ? (props.currentRun.status === 'waiting' ? 'Waiting for approval' : 'Working') : 'Ready';
  const pendingApprovals = props.currentRun?.approvals.filter(approval => approval.status === 'pending') || [];

  return <aside className="reason-sidepanel" aria-label="Session details">
    <div className="reason-sidepanel-header">
      <div className="reason-sidepanel-tabs" role="tablist" aria-label="Session panel">
        <button role="tab" aria-selected={props.tab === 'session'} className={props.tab === 'session' ? 'is-active' : ''} onClick={() => props.onTab('session')}>Session</button>
        <button role="tab" aria-selected={props.tab === 'sessions'} className={props.tab === 'sessions' ? 'is-active' : ''} onClick={() => props.onTab('sessions')}>Sessions</button>
        <button role="tab" aria-selected={props.tab === 'activity'} className={props.tab === 'activity' ? 'is-active' : ''} onClick={() => props.onTab('activity')}>Activity</button>
        <button role="tab" aria-selected={props.tab === 'approvals'} className={props.tab === 'approvals' ? 'is-active' : ''} onClick={() => props.onTab('approvals')}>Approvals{pendingApprovals.length > 0 && <span className="reason-tab-count">{pendingApprovals.length}</span>}</button>
      </div>
      <IconButton label="Close side panel" onClick={props.onClose}><PanelRightClose size={18} /></IconButton>
    </div>
    <div className="reason-sidepanel-body">
      {props.tab === 'session' && <>
        {props.agent ? <>
          <div className="reason-session-card">
            <AgentGlyph agent={props.agent} size={40} />
            <div>
              <h3>{props.agent.name}</h3>
              <p>{props.agent.description || 'Your agent.'}</p>
              <button onClick={props.onOpenAgent}><Settings2 size={12} /> Customize</button>
            </div>
          </div>
          <div className="reason-session-rows">
            <div className="reason-session-row"><span>Model</span><span>{props.agent.modelId || 'Provider default'}</span></div>
            <div className="reason-session-row"><span>Effort</span><span>{effortLabel[props.agent.reasoningEffort] || props.agent.reasoningEffort || 'Balanced'}</span></div>
            <div className="reason-session-row"><span>Workspace</span><span title={workspace}>{workspace || 'Host default'}</span></div>
            <div className="reason-session-row"><span>Conversation</span><span title={props.conversation?.title}>{props.conversation?.title || 'New conversation'}</span></div>
            <div className="reason-session-row"><span>Status</span><span>{status}</span></div>
          </div>
          {props.conversation && <button className="reason-session-item" onClick={() => props.onOpenConversationDetails(props.conversation!)}>
            <MessageSquare size={15} />
            <span><strong>Conversation details</strong><small>Rename, group, or archive</small></span>
          </button>}
        </> : <div className="reason-sidepanel-empty">Choose an agent to see its session details.</div>}
      </>}

      {props.tab === 'sessions' && <>
        <div className="reason-session-list">
          <button className="reason-session-item" onClick={props.onNewChat}>
            <Plus size={15} />
            <span><strong>New conversation</strong><small>Start with {props.agent?.name || 'your agent'}</small></span>
          </button>
          <button className="reason-session-item" onClick={props.onCreateGroup}>
            <FolderPlus size={15} />
            <span><strong>New group</strong><small>Organize related conversations</small></span>
          </button>
          {props.conversations.map(conversation => {
            const owner = props.agent?.id === conversation.agentId ? props.agent : undefined;
            const group = props.groups.find(item => item.id === conversation.groupId);
            return <button key={conversation.id} className={`reason-session-item ${props.conversation?.id === conversation.id ? 'is-active' : ''}`} aria-current={props.conversation?.id === conversation.id ? 'page' : undefined} onClick={() => props.onSelectConversation(conversation)}>
              {owner ? <AgentGlyph agent={owner} size={18} /> : <MessageSquare size={15} />}
              <span><strong>{conversation.title || 'New conversation'}</strong><small>{group ? `${group.name} · ` : ''}{formatDate(conversation.updatedAt)}</small></span>
            </button>;
          })}
          {!props.conversations.length && <div className="reason-sidepanel-empty">No conversations yet.</div>}
        </div>
      </>}

      {props.tab === 'activity' && <>
        {activities.length ? <div className="reason-activity-list">{activities.map(item => <ActivityRow key={item.id} item={item} />)}</div> : <div className="reason-sidepanel-empty">No activity in this session yet.</div>}
      </>}

      {props.tab === 'approvals' && <>
        {pendingApprovals.length ? <div className="reason-sidepanel-approvals">{pendingApprovals.map(approval => <div className="reason-approval" key={approval.id}>
          <div className="reason-approval-head"><AlertCircle size={15} /><h3>{approval.title}</h3></div>
          <p>{approval.description}</p>
          {approval.command && <pre>{approval.command}</pre>}
          <div className="reason-approval-actions">
            <button className="button quiet small" onClick={() => props.onApproval(approval.id, false)}>Decline</button>
            <button className="button primary small" onClick={() => props.onApproval(approval.id, true)}>Allow this action</button>
          </div>
        </div>)}</div> : <div className="reason-sidepanel-empty">No approvals are waiting.</div>}
      </>}
    </div>
  </aside>;
}
