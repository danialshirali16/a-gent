import { useState, type FormEvent } from 'react';
import { Plus, Search, Archive, Folder, Check, Monitor, ArrowUpRight } from 'lucide-react';
import type { Agent, Conversation, ProviderInfo, WorkspaceState } from '../shared/types';
import type { Connection } from './api';
import { Avatar, Modal, Spinner, formatDate } from './components';

export type Api = <T>(path: string, method?: string, body?: unknown) => Promise<T>;
export type DialogKind = { kind: 'agent'; agent?: Agent } | { kind: 'group' } | { kind: 'schedule' } | { kind: 'search' } | { kind: 'connection' } | { kind: 'conversation'; conversation: Conversation };

export function AgentDialog({ agent, providers, api, onClose, onSaved }: { agent?: Agent; providers: ProviderInfo[]; api: Api; onClose: () => void; onSaved: (agent: Agent) => void }) {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [instructions, setInstructions] = useState(agent?.instructions || '');
  const [color, setColor] = useState(agent?.color || '#9393ed');
  const [icon, setIcon] = useState<Agent['icon']>(agent?.icon || 'custom');
  const [providerId, setProviderId] = useState(agent?.providerId || 'codex');
  const [modelId, setModelId] = useState(agent?.modelId || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const colors = ['#f39161', '#9393ed', '#5ab9a0', '#d5a35f', '#d980a8', '#70aee0'];
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const value = await api<Agent>(agent ? `/api/agents/${agent.id}` : '/api/agents', agent ? 'PATCH' : 'POST', { name: name.trim(), description: description.trim(), instructions, color, icon, providerId, modelId, reasoningEffort: agent?.reasoningEffort || 'medium' });
      onSaved(value); onClose();
    } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); }
  }
  return <Modal title={agent ? 'Customize agent' : 'Create an agent'} onClose={onClose}><form onSubmit={save} className="form-stack">
    <div className="agent-preview"><Avatar agent={{ color, icon }} size={52} /><div><strong>{name || 'Your new agent'}</strong><span>{description || 'Give it a purpose of its own.'}</span></div></div>
    <label>Name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Design Partner" maxLength={80} required autoFocus /></label>
    <label>What does it help with?<input value={description} onChange={event => setDescription(event.target.value)} placeholder="A short description" maxLength={240} /></label>
    <label>Instructions<textarea value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="Describe how this agent should work, what it knows, and what a good result looks like." rows={5} maxLength={16000} /></label>
    <div className="form-columns"><label>Icon<select value={icon} onChange={event => setIcon(event.target.value as Agent['icon'])}><option value="custom">Assistant</option><option value="spark">General</option><option value="code">Engineering</option><option value="design">Design</option><option value="search">Research</option></select></label><div className="field"><span>Color</span><div className="color-options">{colors.map(value => <button type="button" className={color === value ? 'selected' : ''} style={{ background: value }} key={value} aria-label={`Use ${value}`} aria-pressed={color === value} onClick={() => setColor(value)}>{color === value && <Check size={13} />}</button>)}</div></div></div>
    <div className="form-columns"><label>Connection<select value={providerId} onChange={event => { setProviderId(event.target.value); setModelId(''); }}>{providers.map(provider => <option value={provider.id} key={provider.id}>{provider.name}</option>)}</select></label><label>Model<select value={modelId} onChange={event => setModelId(event.target.value)}><option value="">Provider default</option>{providers.find(provider => provider.id === providerId)?.models.map(model => <option value={model.id} key={model.id}>{model.name}</option>)}</select></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !name.trim()}>{busy ? <Spinner /> : <Plus size={16} />}{agent ? 'Save agent' : 'Create agent'}</button></div>
  </form></Modal>;
}

export function GroupDialog({ api, onClose }: { api: Api; onClose: () => void }) {
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <Modal title="New group" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); setBusy(true); try { await api('/api/groups', 'POST', { name: name.trim() }); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }}><p className="muted">Keep related conversations together.</p><label>Group name<input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. A Gent launch" maxLength={80} required /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !name.trim()}>{busy ? <Spinner /> : <Folder size={16} />}Create group</button></div></form></Modal>;
}

export function ConversationDialog({ conversation, state, api, onClose, onArchived }: { conversation: Conversation; state: WorkspaceState; api: Api; onClose: () => void; onArchived: () => void }) {
  const [title, setTitle] = useState(conversation.title); const [groupId, setGroupId] = useState(conversation.groupId || ''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function save(archive = false) { setBusy(true); try { await api(`/api/conversations/${conversation.id}`, 'PATCH', archive ? { archived: true } : { title: title.trim(), groupId: groupId || null }); if (archive) onArchived(); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }
  return <Modal title="Conversation details" onClose={onClose}><form className="form-stack" onSubmit={event => { event.preventDefault(); void save(); }}><label>Title<input autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required /></label><label>Group<select value={groupId} onChange={event => setGroupId(event.target.value)}><option value="">Ungrouped</option>{state.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><p className="field-help">Created {formatDate(conversation.createdAt, true)}</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer spread"><button type="button" className="button quiet" onClick={() => void save(true)} disabled={busy}><Archive size={15} />Archive</button><button className="button primary" disabled={busy || !title.trim()}>{busy && <Spinner />}Save changes</button></div></form></Modal>;
}

export function SearchDialog({ state, onSelect, onClose }: { state: WorkspaceState; onSelect: (conversation: Conversation) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const results = state.conversations.filter(chat => !chat.archived && `${chat.title} ${chat.messages.map(message => message.content).join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 30);
  return <Modal title="Search conversations" onClose={onClose} wide><div className="search-field"><Search size={19} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search titles and messages…" aria-label="Search conversations" /></div><div className="search-results">{results.length ? results.map(chat => { const agent = state.agents.find(item => item.id === chat.agentId); return <button key={chat.id} onClick={() => { onSelect(chat); onClose(); }}><Avatar agent={agent || { color: '#9393ed', icon: 'custom' }} /><span><strong>{chat.title}</strong><small>{agent?.name} · {formatDate(chat.updatedAt)}</small></span><ArrowUpRight size={16} /></button>; }) : <div className="empty-small"><Search size={25} /><p>{query ? 'No conversations match your search.' : 'Your conversations will appear here.'}</p></div>}</div></Modal>;
}

export function ScheduleDialog({ state, activeAgentId, api, onClose }: { state: WorkspaceState; activeAgentId: string; api: Api; onClose: () => void }) {
  const [title, setTitle] = useState(''); const [prompt, setPrompt] = useState(''); const [agentId, setAgentId] = useState(activeAgentId);
  const [runAt, setRunAt] = useState(() => { const date = new Date(Date.now() + 3600000); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <Modal title="Schedule a task" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { const date = new Date(runAt); if (date.getTime() <= Date.now()) throw new Error('Choose a time in the future.'); await api('/api/schedules', 'POST', { title: title.trim(), prompt, agentId, runAt: date.toISOString(), enabled: true }); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }}><label>Task name<input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Prepare the weekly review" required maxLength={160} /></label><label>Instructions<textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="What should your agent do?" rows={4} required maxLength={16000} /></label><div className="form-columns"><label>Agent<select value={agentId} onChange={event => setAgentId(event.target.value)}>{state.agents.filter(agent => !agent.archived).map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label><label>Run once at<input type="datetime-local" value={runAt} onChange={event => setRunAt(event.target.value)} required /></label></div><p className="field-help">Uses your local time. The A Gent host must be running when the task is due.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !title.trim() || !prompt.trim()}>{busy && <Spinner />}Schedule task</button></div></form></Modal>;
}

export function ConnectionDialog({ connection, onConnect, onClose }: { connection: Connection; onConnect: (connection: Connection) => Promise<void>; onClose: () => void }) {
  const [url, setUrl] = useState(connection.url); const [token, setToken] = useState(connection.token); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <Modal title="Connect to your A Gent host" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Enter an HTTP or HTTPS host address.'); await onConnect({ url: parsed.origin, token: token.trim() }); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }}><div className="connection-illustration"><Monitor size={33} /><span className="connection-line" /><span className="mini-brand">A</span></div><p className="muted">Continue on another device using the address and access token from your own A Gent host.</p><label>Host address<input autoFocus type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-agent-host.example" required autoComplete="url" /></label><label>Access token<input type="password" value={token} onChange={event => setToken(event.target.value)} required autoComplete="off" placeholder="Paste your host token" /></label><p className="field-help">The address is remembered. Your access token stays in this app session.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><button type="button" className="button quiet" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy || !url || !token}>{busy && <Spinner />}Connect</button></div></form></Modal>;
}
