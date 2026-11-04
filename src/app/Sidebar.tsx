import { useEffect, useRef, useState } from 'react';
import { CalendarClock, MoreHorizontal, PanelLeftClose, Plug, Plus, Search, Settings2, UsersRound } from 'lucide-react';
import type { Agent, ProviderInfo, Run } from '../../shared/types';
import { AgentGlyph, IconButton, Mark } from '../components';

export interface SidebarProps {
  agents: Agent[];
  activeAgentId?: string;
  runs: Run[];
  providers: ProviderInfo[];
  open: boolean;
  onClose: () => void;
  onNewChat: (agent?: Agent) => void;
  onSelectAgent: (agent: Agent) => void;
  onSearch: () => void;
  onCreateAgent: () => void;
  onOpenAgents: () => void;
  onOpenScheduled: () => void;
  onOpenConnections: () => void;
  onOpenSettings: () => void;
}

export function Sidebar(props: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const primary = props.agents.find(agent => agent.id === 'primary') || props.agents[0];
  const connected = props.providers.some(provider => provider.status === 'connected');

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: PointerEvent) => { if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [moreOpen]);

  const action = (run: () => void) => { setMoreOpen(false); run(); };

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
      <IconButton label="Create an agent" onClick={props.onCreateAgent}><Plus size={14} /></IconButton>
    </div>
    <nav className="reason-agent-list" aria-label="Agents">
      {props.agents.map(agent => {
        const running = props.runs.some(run => run.agentId === agent.id && (run.status === 'running' || run.status === 'waiting'));
        return <button key={agent.id} className={`reason-agent-row ${props.activeAgentId === agent.id ? 'is-active' : ''}`} aria-current={props.activeAgentId === agent.id ? 'page' : undefined} onClick={() => props.onSelectAgent(agent)}>
          <AgentGlyph agent={agent} size={24} />
          <span>{agent.name}</span>
          {running && <span className="reason-running-dot" aria-label="Working" />}
        </button>;
      })}
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
          {moreOpen && <div className="reason-more-menu" role="menu" aria-label="Workspace options">
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
