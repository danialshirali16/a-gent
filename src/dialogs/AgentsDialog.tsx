import { ArrowUpRight, MoreHorizontal, Plus } from 'lucide-react';
import type { Agent } from '../../shared/types';
import { AgentGlyph, IconButton, Modal } from '../components';

export function AgentsDialog({ agents, onCreate, onEdit, onChat, onClose }: {
  agents: Agent[];
  onCreate: () => void;
  onEdit: (agent: Agent) => void;
  onChat: (agent: Agent) => void;
  onClose: () => void;
}) {
  return <Modal title="Agents" onClose={onClose} className="modal-agents">
    <div className="agents-modal-header"><p>Each agent keeps its own instructions, model, and way of working.</p><button className="button primary small" onClick={onCreate}><Plus size={15} />New agent</button></div>
    <div className="agents-modal-grid">
      {agents.map(agent => <article className="agents-modal-card" key={agent.id}>
        <div className="agents-modal-card-top"><AgentGlyph agent={agent} size={38} /><IconButton label={`Customize ${agent.name}`} onClick={() => onEdit(agent)}><MoreHorizontal size={17} /></IconButton></div>
        <h3>{agent.name}</h3>
        <p>{agent.description || 'Your custom assistant.'}</p>
        <div className="agents-modal-card-bottom"><span>{agent.providerId === 'codex' ? 'Codex' : agent.providerId === 'ollama' ? 'Ollama' : 'Custom model'}</span><button className="text-button" onClick={() => onChat(agent)}>Start a chat<ArrowUpRight size={14} /></button></div>
      </article>)}
    </div>
  </Modal>;
}
