import { useEffect, useRef, useState } from 'react';
import { CalendarClock, ChevronDown, FolderPlus, MoreHorizontal, PanelLeftClose, Pencil, Plug, Plus, Search, Settings2, Trash2, UsersRound } from 'lucide-react';
import type { Agent, Group, ProviderInfo, Run } from '../../shared/types';
import { AgentGlyph, IconButton, Mark } from '../components';
import { moveFocus } from '../keyboard';

export interface SidebarProps {
  agents: Agent[];
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [groupMenu, setGroupMenu] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const moreRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const primary = props.agents.find(agent => agent.id === 'primary') || props.agents[0];
  const connected = props.providers.some(provider => provider.status === 'connected');
  const groupedAgents = props.agentGroups.map(group => ({ group, agents: props.agents.filter(agent => agent.agentGroupId === group.id) }));
  const unassigned = props.agents.filter(agent => !agent.agentGroupId || !props.agentGroups.some(group => group.id === agent.agentGroupId));

  useEffect(() => {
    if (!moreOpen) return;
    moreRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = (event: PointerEvent) => { if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [moreOpen]);
  useEffect(() => {
    if (!groupMenu) return;
    groupMenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = (event: PointerEvent) => { if (!groupMenuRef.current?.contains(event.target as Node)) setGroupMenu(null); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [groupMenu]);

  const action = (run: () => void) => { setMoreOpen(false); run(); };
  const renderAgent = (agent: Agent) => {
    const running = props.runs.some(run => run.agentId === agent.id && (run.status === 'running' || run.status === 'waiting'));
    return <button key={agent.id} className={`reason-agent-row ${props.activeAgentId === agent.id ? 'is-active' : ''}`} aria-current={props.activeAgentId === agent.id ? 'page' : undefined} onClick={() => props.onSelectAgent(agent)}>
      <AgentGlyph agent={agent} size={24} />
      <span>{agent.name}</span>
      {running && <span className="reason-running-dot" aria-label="Working" />}
    </button>;
  };

  return <aside className="reason-sidebar" aria-label="Workspace navigation" aria-hidden={!props.open} inert={!props.open}>
    <div className="reason-sidebar-top">
      <IconButton label="Collapse sidebar" onClick={props.onClose}><PanelLeftClose size={18} /></IconButton>
      <IconButton label="Search conversations (⌘K)" onClick={props.onSearch}><Search size={18} /></IconButton>
      <IconButton label="New conversation (⌘N)" onClick={() => props.onNewChat()}><Plus size={18} /></IconButton>
    </div>

    <button className="reason-home" onClick={() => props.onNewChat(primary)}>
      <Mark size={24} />
      <span>A Gent</span>
    </button>

    <div className="reason-section-label">
      <span>Agents</span>
      <div className="reason-section-label-actions">
        <IconButton label="Create an agent group" onClick={props.onCreateAgentGroup}><FolderPlus size={14} /></IconButton>
        <IconButton label="Create an agent" onClick={props.onCreateAgent}><Plus size={14} /></IconButton>
      </div>
    </div>
    <nav className="reason-agent-list" aria-label="Agents">
      {props.agentGroups.length ? <>
        {groupedAgents.map(({ group, agents }) => <div className="reason-agent-group" key={group.id}>
          <div className="reason-agent-group-head">
            <button className="reason-agent-group-toggle" aria-expanded={!collapsedGroups[group.id]} onClick={() => setCollapsedGroups(previous => ({ ...previous, [group.id]: !previous[group.id] }))}>
              <ChevronDown size={12} className={collapsedGroups[group.id] ? 'is-collapsed' : undefined} />
              <span>{group.name}</span>
            </button>
            <div className="reason-group-menu-anchor" ref={groupMenu === group.id ? groupMenuRef : undefined}>
              <IconButton label={`Options for ${group.name}`} onClick={() => setGroupMenu(groupMenu === group.id ? null : group.id)}><MoreHorizontal size={14} /></IconButton>
              {groupMenu === group.id && <div className="reason-group-menu" role="menu" aria-label={`${group.name} options`} onKeyDown={event => {
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setGroupMenu(null); groupMenuRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
                else moveFocus(event, '[role="menuitem"]:not([disabled])');
              }}>
                <button role="menuitem" onClick={() => { setGroupMenu(null); props.onEditAgentGroup(group); }}><Pencil size={13} />Rename group</button>
                <button role="menuitem" onClick={() => { setGroupMenu(null); props.onEditAgentGroup(group); }}><Trash2 size={13} />Delete group</button>
              </div>}
            </div>
          </div>
          {!collapsedGroups[group.id] && <div className="reason-agent-list is-nested">{agents.map(renderAgent)}</div>}
        </div>)}
        {unassigned.length > 0 && <div className="reason-agent-group">
          <div className="reason-agent-group-head"><span className="reason-agent-group-label">Unassigned</span></div>
          <div className="reason-agent-list is-nested">{unassigned.map(renderAgent)}</div>
        </div>}
      </> : props.agents.map(renderAgent)}
    </nav>

    <div className="reason-sidebar-bottom">
      <div className="reason-account-row">
        <button className="reason-account" onClick={props.onOpenSettings}>
          <span className="reason-account-avatar">A</span>
          <span><strong>Personal workspace</strong><small>A Gent</small></span>
          <Settings2 size={15} />
        </button>
        <div className="reason-more-anchor" ref={moreRef}>
          <IconButton label="More workspace options" onClick={() => setMoreOpen(value => !value)}><MoreHorizontal size={18} /></IconButton>
          {moreOpen && <div className="reason-more-menu" role="menu" aria-label="Workspace options" onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setMoreOpen(false); moreRef.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
            else moveFocus(event, '[role="menuitem"]:not([disabled])');
          }}>
            <button role="menuitem" onClick={() => action(props.onOpenAgents)}><UsersRound size={15} />All agents</button>
            <button role="menuitem" onClick={() => action(props.onOpenScheduled)}><CalendarClock size={15} />Scheduled</button>
            <button role="menuitem" onClick={() => action(props.onOpenConnections)}><Plug size={15} />Connections</button>
            <button role="menuitem" onClick={() => action(props.onOpenSettings)}><Settings2 size={15} />Settings</button>
          </div>}
        </div>
      </div>
      <button className="reason-connect-apps" onClick={props.onOpenConnections}>
        <Plug size={15} />
        <span>Connect apps</span>
        <i className={connected ? 'is-connected' : ''} aria-hidden="true" />
      </button>
    </div>
  </aside>;
}
