import { Button } from '../ui/Button';
import { Menu } from '../ui/Menu';
import { ArrowUpRight, MoreHorizontal, Pencil, Plus } from 'lucide-react';
import type { Agent } from '../../shared/types';
import { AgentGlyph, IconButton, Modal } from '../components';
import { Card } from '../ui/Card';

export function AgentsDialog({ agents, onCreate, onEdit, onChat, onClose }: {
  agents: Agent[];
  onCreate: () => void;
  onEdit: (agent: Agent) => void;
  onChat: (agent: Agent) => void;
  onClose: () => void;
}) {
  return <Modal title="Agents" onClose={onClose} className="modal-agents">
    <div className="agents-modal-header"><p>Each agent keeps its own instructions, model, and way of working.</p><Button variant="primary" size="sm" onClick={onCreate}><Plus size={15} />New agent</Button></div>
    <div className="agents-modal-grid">
      {agents.map(agent => <Card as="article" variant="raised" className="agents-modal-card" key={agent.id}>
        <div className="agents-modal-card-top"><AgentGlyph agent={agent} size={38} /><Menu
          trigger={<IconButton label={`Actions for ${agent.name}`}><MoreHorizontal size={17} /></IconButton>}
          label={`${agent.name} actions`}
          align="end"
          items={[
            { id: 'customize', label: 'Customize agent', icon: <Pencil size={13} />, onSelect: () => onEdit(agent) },
            { id: 'chat', label: 'Start a chat', icon: <ArrowUpRight size={13} />, onSelect: () => onChat(agent) },
          ]}
        /></div>
        <h3>{agent.name}</h3>
        <p>{agent.description || 'Your custom assistant.'}</p>
        <div className="agents-modal-card-bottom"><span>{agent.providerId === 'codex' ? 'Codex' : agent.providerId === 'ollama' ? 'Ollama' : 'Custom model'}</span><Button variant="text" size="sm" onClick={() => onChat(agent)}>Start a chat<ArrowUpRight size={14} /></Button></div>
      </Card>)}
    </div>
  </Modal>;
}
