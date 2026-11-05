import { PanelLeftOpen, Plug, Plus, Search, Settings2 } from 'lucide-react';
import type { Agent } from '../../shared/types';
import { AgentGlyph, IconButton } from '../components';
import { Tooltip } from '../ui/Tooltip';

export function SidebarRail({ agents, activeAgentId, onSelectAgent, onNewChat, onOpenSidebar, onSearch, onOpenSettings, onOpenConnections }: {
  agents: Agent[];
  activeAgentId?: string;
  onSelectAgent: (agent: Agent) => void;
  onNewChat: () => void;
  onOpenSidebar: () => void;
  onSearch: () => void;
  onOpenSettings: () => void;
  onOpenConnections: () => void;
}) {
  return <aside className="reason-rail" aria-label="Workspace navigation">
    <IconButton label="Expand sidebar" onClick={onOpenSidebar}><PanelLeftOpen size={18} /></IconButton>
    <IconButton label="Search conversations (⌘K)" onClick={onSearch}><Search size={18} /></IconButton>
    <IconButton label="New conversation (⌘N)" onClick={onNewChat}><Plus size={18} /></IconButton>
    <div className="reason-rail-agents">
      {agents.map(agent => <Tooltip key={agent.id} label={agent.name} side="bottom"><button className={`reason-rail-agent ${activeAgentId === agent.id ? 'is-active' : ''}`} aria-label={agent.name} aria-current={activeAgentId === agent.id ? 'page' : undefined} onClick={() => onSelectAgent(agent)}>
        <AgentGlyph agent={agent} size={24} />
      </button></Tooltip>)}
    </div>
    <div className="reason-rail-bottom">
      <IconButton label="Connections" onClick={onOpenConnections}><Plug size={17} /></IconButton>
      <IconButton label="Settings" onClick={onOpenSettings}><Settings2 size={17} /></IconButton>
    </div>
  </aside>;
}
