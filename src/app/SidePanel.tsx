import { Tabs } from '../ui/Tabs';
import { AlertCircle, Check, FolderPlus, LoaderCircle, MessageSquare, Plus, PanelRightClose, Settings2 } from 'lucide-react';
import type { Activity as ActivityItem, Agent, Conversation, Group, Run } from '../../shared/types';
import { AgentGlyph, IconButton, formatDate } from '../components';
import { StatusIndicator } from '../ui/Badge';
import { ListRow } from '../ui/Card';
import type { Api } from '../dialogs';
import { ApprovalCard } from '../chat/ApprovalCard';
import { FilesPanel } from './FilesPanel';
import { TerminalPanel } from './TerminalPanel';

export type SidePanelTab = 'session' | 'sessions' | 'files' | 'terminal' | 'activity' | 'approvals';
const sidePanelTabs: Array<{ id: SidePanelTab; label: string }> = [
  { id: 'session', label: 'Session' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'files', label: 'Files' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'activity', label: 'Activity' },
  { id: 'approvals', label: 'Approvals' },
];

export interface SidePanelProps {
  tab: SidePanelTab;
  api: Api;
  onTab: (tab: SidePanelTab) => void;
  onClose: () => void;
  agent?: Agent;
  conversation?: Conversation;
  conversations: Conversation[];
  groups: Group[];
  currentRun?: Run;
  effectiveProviderName: string;
  effectiveModelId: string;
  mode: 'chat' | 'work';
  stopping?: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  onCreateGroup: () => void;
  onOpenConversationDetails: (conversation: Conversation) => void;
  onOpenAgent: () => void;
  onApproval: (id: string, accept: boolean) => void;
}



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
  const status = props.stopping || props.currentRun?.status === 'stopping' ? 'Stopping' : props.currentRun ? (props.currentRun.status === 'waiting' ? 'Waiting for approval' : 'Working') : 'Ready';
  const statusTone = props.stopping || props.currentRun?.status === 'stopping' ? 'warning' : props.currentRun ? (props.currentRun.status === 'waiting' ? 'warning' : 'info') : 'success';
  const pendingApprovals = props.currentRun?.approvals.filter(approval => approval.status === 'pending') || [];

  return <aside className="reason-sidepanel" aria-label="Session details">
    <div className="reason-sidepanel-header">
      <Tabs
        className="reason-sidepanel-tabs"
        items={sidePanelTabs.map(tab => ({ ...tab, count: tab.id === 'approvals' ? pendingApprovals.length : undefined }))}
        value={props.tab}
        onChange={id => props.onTab(id as SidePanelTab)}
        ariaLabel="Session panel"
        idPrefix="side"
        panelId={`side-panel-${props.tab}`}
        variant="pill"
      />
      <IconButton label="Close side panel" onClick={props.onClose}><PanelRightClose size={18} /></IconButton>
    </div>
    <div className="reason-sidepanel-body" id={`side-panel-${props.tab}`} role="tabpanel" aria-labelledby={`side-tab-${props.tab}`} tabIndex={0}>
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
            <div className="reason-session-row"><span>Connection</span><span>{props.effectiveProviderName}</span></div>
            <div className="reason-session-row"><span>Model</span><span>{props.effectiveModelId || 'Provider default'}</span></div>
            <div className="reason-session-row"><span>Reasoning</span><span>Provider default</span></div>
            <div className="reason-session-row"><span>Mode</span><span>{props.mode === 'work' ? 'Work · sandboxed' : 'Chat · read-only'}</span></div>
            <div className="reason-session-row"><span>Workspace</span><span title={workspace}>{workspace || 'Host default'}</span></div>
            <div className="reason-session-row"><span>Conversation</span><span title={props.conversation?.title}>{props.conversation?.title || 'New conversation'}</span></div>
            <div className="reason-session-row"><span>Status</span><StatusIndicator label={status} tone={statusTone} pulse={!!props.currentRun} /></div>
          </div>
          {props.conversation && <button className="reason-session-item" onClick={() => props.onOpenConversationDetails(props.conversation!)}>
            <MessageSquare size={15} />
            <span><strong>Conversation details</strong><small>Rename, group, or archive</small></span>
          </button>}
        </> : <div className="reason-sidepanel-empty">Choose an agent to see its session details.</div>}
      </>}

      {props.tab === 'sessions' && <>
        <div className="reason-session-list">
          <ListRow className="reason-session-item" leading={<Plus size={15} />} primary="New conversation" secondary={`Start with ${props.agent?.name || 'your agent'}`} onClick={props.onNewChat} />
          <ListRow className="reason-session-item" leading={<FolderPlus size={15} />} primary="New group" secondary="Organize related conversations" onClick={props.onCreateGroup} />
          {props.conversations.map(conversation => {
            const owner = props.agent?.id === conversation.agentId ? props.agent : undefined;
            const group = props.groups.find(item => item.id === conversation.groupId);
            return <ListRow key={conversation.id} className="reason-session-item" selected={props.conversation?.id === conversation.id} leading={owner ? <AgentGlyph agent={owner} size={18} /> : <MessageSquare size={15} />} primary={conversation.title || 'New conversation'} secondary={`${group ? `${group.name} · ` : ''}${formatDate(conversation.updatedAt)}`} onClick={() => props.onSelectConversation(conversation)} />;
          })}
          {!props.conversations.length && <div className="reason-sidepanel-empty">No conversations yet.</div>}
        </div>
      </>}

      {props.tab === 'files' && <FilesPanel api={props.api} conversationId={props.conversation?.id} agentId={props.agent?.id} />}

      {props.tab === 'terminal' && <TerminalPanel activities={activities} workspace={workspace} />}

      {props.tab === 'activity' && <>
        {activities.length ? <div className="reason-activity-list">{activities.map(item => <ActivityRow key={item.id} item={item} />)}</div> : <div className="reason-sidepanel-empty">No activity in this session yet.</div>}
      </>}

      {props.tab === 'approvals' && <>
        {pendingApprovals.length ? <div className="reason-sidepanel-approvals">{pendingApprovals.map(approval => <ApprovalCard key={approval.id} approval={approval} onApproval={props.onApproval} />)}</div> : <div className="reason-sidepanel-empty">No approvals are waiting.</div>}
      </>}
    </div>
  </aside>;
}
