import { useState } from 'react';
import { CalendarClock, ChevronDown, FolderPlus, MoreHorizontal, PanelLeftClose, Pencil, Plug, Plus, Search, Settings2, Trash2, UsersRound } from 'lucide-react';
import { isProviderReady } from '../../shared/providers';
import type { Agent, Conversation, Group, ProviderInfo, Run } from '../../shared/types';
import { AgentGlyph, IconButton } from '../components';
import { Menu } from '../ui/Menu';
import { StatusDot } from '../ui/Badge';
export interface SidebarProps {
  agents: Agent[];
  conversations: Conversation[];
  agentGroups: Group[];
  activeAgentId?: string;
  runs: Run[];
  providers: ProviderInfo[];
  open: boolean;
  onClose: () => void;
  onNewChat: (agent?: Agent) => void;
  onSelectAgent: (agent: Agent) => void;
  onSearch: () => void;
  onCreateAgent: () => void;
  onCreateAgentGroup: () => void;
  onEditAgentGroup: (group: Group) => void;
  onOpenAgents: () => void;
  onOpenScheduled: () => void;
  onOpenConnections: () => void;
  onOpenSettings: () => void;
}

export function Sidebar(props: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const primary = props.agents.find(agent => agent.id === 'primary') || props.agents[0];
  const connected = props.providers.some(isProviderReady);
  const primaryIsGrouped = primary && props.agentGroups.some(group => group.id === primary.agentGroupId);
  const groupedAgents = props.agentGroups.map(group => ({ group, agents: props.agents.filter(agent => agent.agentGroupId === group.id) }));
  const unassigned = props.agents.filter(agent => agent.id !== primary?.id && (!agent.agentGroupId || !props.agentGroups.some(group => group.id === agent.agentGroupId)));

  const renderAgent = (agent: Agent) => {
    const active = props.runs.find(run => run.agentId === agent.id && ['running', 'waiting', 'stopping'].includes(run.status));
    const running = Boolean(active);
    const latest = props.conversations.find(chat => chat.agentId === agent.id && !chat.archived);
    const message = latest?.messages.slice().reverse().find(item => item.role !== 'system' && item.content.trim());
    const preview = active?.status === 'stopping' ? 'Stopping…' : running ? 'Working…' : (message?.content || agent.description).replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
    return <button key={agent.id} className={`reason-agent-row ${props.activeAgentId === agent.id ? 'is-active' : ''}`} aria-current={props.activeAgentId === agent.id ? 'page' : undefined} onClick={() => props.onSelectAgent(agent)}>
      <AgentGlyph agent={agent} size={28} />
      <span className="reason-agent-copy"><strong>{agent.name}</strong><small id={`agent-preview-${agent.id}`} aria-hidden="true">{preview ? `${preview.slice(0, 160)}${preview.length > 160 ? '…' : ''}` : 'Start a conversation'}</small></span>
      {running && <StatusDot label="Working" tone="info" pulse className="reason-running-dot" />}
    </button>;
  };

  return <aside className="reason-sidebar" aria-label="Workspace navigation" aria-hidden={!props.open} inert={!props.open}>
    <div className="reason-sidebar-top">
      <IconButton label="Collapse sidebar" className="reason-sidebar-collapse" onClick={props.onClose}><PanelLeftClose size={18} /></IconButton>
      <button className="reason-teammates" onClick={props.onOpenAgents} title="Manage agents"><span>Teammates</span><ChevronDown size={12} /></button>
      <IconButton label="Search conversations (⌘K)" onClick={props.onSearch}><Search size={18} /></IconButton>
      <IconButton label="New conversation (⌘N)" onClick={() => props.onNewChat()}><Plus size={18} /></IconButton>
    </div>

    <nav className="reason-agent-navigation" aria-label="Agents">
    {primary && !primaryIsGrouped && <div className="reason-primary-agent">{renderAgent(primary)}</div>}
    <div className="reason-section-label">
      <button className="reason-new-group" onClick={props.onCreateAgentGroup}><FolderPlus size={14} /><span>New group</span></button>
      <div className="reason-section-label-actions">
        <IconButton label="Create an agent" onClick={props.onCreateAgent}><Plus size={14} /></IconButton>
      </div>
    </div>
    <div className="reason-agent-list">
      {props.agentGroups.length ? <>
        {groupedAgents.map(({ group, agents }) => <div className="reason-agent-group" key={group.id}>
          <div className="reason-agent-group-head">
            <button className="reason-agent-group-toggle" aria-expanded={!collapsedGroups[group.id]} onClick={() => setCollapsedGroups(previous => ({ ...previous, [group.id]: !previous[group.id] }))}>
              <ChevronDown size={12} className={collapsedGroups[group.id] ? 'is-collapsed' : undefined} />
              <span>{group.name}</span>
            </button>
            <div className="reason-group-menu-anchor">
              <Menu
                trigger={<IconButton label={`Options for ${group.name}`}><MoreHorizontal size={14} /></IconButton>}
                label={`${group.name} options`}
                align="end"
                items={[
                  { id: 'rename', label: 'Rename group', icon: <Pencil size={13} />, onSelect: () => props.onEditAgentGroup(group) },
                  { id: 'delete', label: 'Delete group', icon: <Trash2 size={13} />, danger: true, onSelect: () => props.onEditAgentGroup(group) },
                ]}
              />
            </div>
          </div>
          {!collapsedGroups[group.id] && <div className="reason-agent-list is-nested">{agents.map(renderAgent)}</div>}
        </div>)}
        {unassigned.length > 0 && <div className="reason-agent-group">
          <div className="reason-agent-group-head"><span className="reason-agent-group-label">Unassigned</span></div>
          <div className="reason-agent-list is-nested">{unassigned.map(renderAgent)}</div>
        </div>}
      </> : unassigned.map(renderAgent)}
    </div>
    </nav>

    <div className="reason-sidebar-bottom">
      <div className="reason-account-row">
        <button className="reason-account" aria-label="Personal workspace settings" title="Personal workspace settings" onClick={props.onOpenSettings}>
          <span className="reason-account-avatar">A</span>
        </button>
        <button className="reason-connect-apps" onClick={props.onOpenConnections}>
          <span className="reason-connection-icons" aria-hidden="true"><Plug size={14} /><UsersRound size={13} /></span>
          <span>Connections</span>
          <StatusDot label={connected ? 'A model is connected' : 'No model is connected'} tone={connected ? 'success' : 'neutral'} className="reason-connect-status" />
        </button>
        <div className="reason-more-anchor">
          <Menu
            trigger={<IconButton label="More workspace options"><Settings2 size={17} /></IconButton>}
            label="Workspace options"
            align="end"
            side="top"
            items={[
              { id: 'agents', label: 'All agents', icon: <UsersRound size={15} />, onSelect: props.onOpenAgents },
              { id: 'scheduled', label: 'Scheduled', icon: <CalendarClock size={15} />, onSelect: props.onOpenScheduled },
              { id: 'connections', label: 'Connections', icon: <Plug size={15} />, onSelect: props.onOpenConnections },
              { id: 'settings', label: 'Settings', icon: <Settings2 size={15} />, onSelect: props.onOpenSettings },
              { id: 'collapse', label: 'Collapse sidebar', icon: <PanelLeftClose size={15} />, separatorBefore: true, onSelect: props.onClose },
            ]}
          />
        </div>
      </div>
    </div>
  </aside>;
}
