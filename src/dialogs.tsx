import { Input, Textarea } from './ui/Input';
import { Field, FieldGroup } from './ui/Field';
import { Select } from './ui/Select';
import { Combobox } from './ui/Combobox';
import { Checkbox, Switch } from './ui/Checkbox';
import { ConfirmDialog } from './ui/Dialog';
import { Alert } from './ui/Alert';
import { SearchField, SearchResults } from './ui/Search';
import { AvatarPicker } from './ui/AvatarPicker';
import { Button } from './ui/Button';
import { resolveAgentAvatarType, type AgentAvatarType } from '../shared/agentAvatars';
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Plus, Search, Archive, Folder, Check, Monitor, ArrowUpRight, Trash2 } from 'lucide-react';
import type { Agent, Conversation, Group, ProviderInfo, WorkspaceState } from '../shared/types';
import type { Connection } from './api';
import { Avatar, Modal, formatDate } from './components';

export type Api = <T>(path: string, method?: string, body?: unknown) => Promise<T>;
export type DialogKind = { kind: 'agent'; agent?: Agent } | { kind: 'agent-group'; group?: Group } | { kind: 'group' } | { kind: 'schedule' } | { kind: 'search' } | { kind: 'connection' } | { kind: 'conversation'; conversation: Conversation } | { kind: 'settings' } | { kind: 'connections' } | { kind: 'agents' } | { kind: 'schedules' };

export function AgentDialog({ agent, agentGroups, providers, api, onClose, onSaved }: { agent?: Agent; agentGroups: Group[]; providers: ProviderInfo[]; api: Api; onClose: () => void; onSaved: (agent: Agent) => void }) {
  const [name, setName] = useState(agent?.name || '');
  const [description, setDescription] = useState(agent?.description || '');
  const [instructions, setInstructions] = useState(agent?.instructions || '');
  const [color, setColor] = useState(agent?.color || '#9393ed');
  const [avatarType, setAvatarType] = useState<AgentAvatarType>(() => resolveAgentAvatarType(agent?.icon, agent?.avatarType));
  const [providerId, setProviderId] = useState(agent?.providerId || 'codex');
  const [modelId, setModelId] = useState(agent?.modelId || '');
  const [effort, setEffort] = useState(agent?.reasoningEffort || '');
  const [agentGroupId, setAgentGroupId] = useState(agent?.agentGroupId || '');
  const [archived, setArchived] = useState(agent?.archived || false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const colors = ['#f39161', '#9393ed', '#5ab9a0', '#d5a35f', '#d980a8', '#70aee0'];
  const selectedModel = providers.find(provider => provider.id === providerId)?.models.find(model => model.id === modelId);
  const reasoningOptions = selectedModel?.reasoning?.kind === 'enum' ? selectedModel.reasoning.options : [];
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const value = await api<Agent>(agent ? `/api/agents/${agent.id}` : '/api/agents', agent ? 'PATCH' : 'POST', { name: name.trim(), description: description.trim(), instructions, color, avatarType, providerId, modelId, agentGroupId: agentGroupId || null, archived, reasoningEffort: effort });
      onSaved(value); onClose();
    } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); }
  }
  return <Modal title={agent ? 'Customize agent' : 'Create an agent'} onClose={onClose}><form onSubmit={save} className="form-stack">
    <div className="agent-preview"><Avatar agent={{ color, icon: agent?.icon || 'custom', avatarType }} size={52} /><div><strong>{name || 'Your new agent'}</strong><span>{description || 'Give it a purpose of its own.'}</span></div></div>
    <Field label="Name" required><Input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Design Partner" maxLength={80} autoFocus /></Field>
    <Field label="What does it help with?" optional><Input value={description} onChange={event => setDescription(event.target.value)} placeholder="A short description" maxLength={240} /></Field>
    <Field label="Instructions" description="How this agent should work, what it knows, and what a good result looks like."><Textarea value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="Describe how this agent should work, what it knows, and what a good result looks like." rows={5} maxLength={16000} /></Field>
    <AvatarPicker value={avatarType} onChange={setAvatarType} color={color} icon={agent?.icon || 'custom'} name={name || 'Your new agent'} />
    <div className="form-columns"><FieldGroup label="Color"><div className="color-options">{colors.map(value => <button type="button" className={color === value ? 'selected' : ''} style={{ background: value }} key={value} aria-label={`Use ${value}`} aria-pressed={color === value} onClick={() => setColor(value)}>{color === value && <Check size={13} />}</button>)}</div></FieldGroup><Field label="Agent group" description="Organize related agents in the sidebar."><Select value={agentGroupId} onChange={event => setAgentGroupId(event.target.value)}><option value="">Unassigned</option>{agentGroups.map(group => <option value={group.id} key={group.id}>{group.name}</option>)}</Select></Field></div>
    <div className="form-columns"><Field label="Connection"><Select value={providerId} onChange={event => { setProviderId(event.target.value); setModelId(''); setEffort(''); }}>{providers.map(provider => <option value={provider.id} key={provider.id}>{provider.name}</option>)}</Select></Field><Field label="Model"><Combobox value={modelId} onChange={value => { setModelId(value); const reasoning = providers.find(provider => provider.id === providerId)?.models.find(model => model.id === value)?.reasoning; setEffort(reasoning?.kind === 'enum' ? reasoning.options.some(option => option.value === effort) ? effort : reasoning.default || '' : ''); }} placeholder="Provider default" searchPlaceholder="Search models…" emptyMessage="No models match." options={[{ value: '', label: 'Provider default', description: 'Use the provider’s default model', group: providers.find(provider => provider.id === providerId)?.name || 'Models' }, ...(providers.find(provider => provider.id === providerId)?.models || []).map(model => ({ value: model.id, label: model.name, description: model.description, group: providers.find(provider => provider.id === providerId)?.name || 'Models' }))]} /></Field></div>
    <Field label="Thinking" description={reasoningOptions.length ? 'Verified options for the selected model.' : 'This model has no verified reasoning options; the provider default is used.'}><Select value={effort} disabled={!reasoningOptions.length} onChange={event => setEffort(event.target.value)}><option value="">Provider default</option>{reasoningOptions.map(option => <option value={option.value} key={option.value}>{option.label || option.value}</option>)}</Select></Field>
    {agent && agent.id !== 'primary' && <Checkbox label="Archive this agent" description="Hidden from the sidebar. Existing conversations stay in your workspace." checked={archived} onChange={event => setArchived(event.target.checked)} />}
    {error && <Alert tone="danger">{error}</Alert>}<div className="modal-footer"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" loading={busy} disabled={!name.trim()}><Plus size={16} />{agent ? 'Save agent' : 'Create agent'}</Button></div>
  </form></Modal>;
}

export function GroupDialog({ api, onClose }: { api: Api; onClose: () => void }) {
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <Modal title="New group" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); setBusy(true); try { await api('/api/groups', 'POST', { name: name.trim() }); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }}><Field label="Group name" required description="Keep related conversations together."><Input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. A Gent launch" maxLength={80} /></Field>{error && <Alert tone="danger">{error}</Alert>}<div className="modal-footer"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" loading={busy} disabled={!name.trim()}><Folder size={16} />Create group</Button></div></form></Modal>;
}

export function AgentGroupDialog({ group, api, onClose }: { group?: Group; api: Api; onClose: () => void }) {
  const [name, setName] = useState(group?.name || '');
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);
  const busy = pendingAction !== null;
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setPendingAction('save'); setError('');
    try {
      await api(group ? `/api/agent-groups/${group.id}` : '/api/agent-groups', group ? 'PATCH' : 'POST', { name: name.trim() });
      onClose();
    } catch (reason) { setError((reason as Error).message); } finally { setPendingAction(null); }
  }
  async function remove() {
    if (!group) return;
    setPendingAction('delete'); setError('');
    try { await api(`/api/agent-groups/${group.id}`, 'DELETE'); onClose(); }
    catch (reason) { setError((reason as Error).message); setConfirmDelete(false); } finally { setPendingAction(null); }
  }
  return <Modal title={group ? 'Agent group' : 'New agent group'} onClose={onClose}><form className="form-stack" onSubmit={save}>
    <Field label="Group name" required description="Keep related agents together in the sidebar."><Input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Product" maxLength={80} /></Field>
    {error && <Alert tone="danger">{error}</Alert>}
    <div className="modal-footer spread">
      {group ? <Button type="button" variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={14} />Delete group</Button> : <span />}
      <div className="modal-footer-actions"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" loading={pendingAction === 'save'} disabled={busy || !name.trim()}>{group ? 'Save group' : 'Create group'}</Button></div>
    </div>
  </form>{confirmDelete && group && <ConfirmDialog title="Delete this group?" description={<>Agents in <strong>{group.name}</strong> move to Unassigned. Their conversations stay in your workspace.</>} confirmLabel="Delete group" busy={pendingAction === 'delete'} onClose={() => setConfirmDelete(false)} onConfirm={() => void remove()} />}</Modal>;
}

export function ConversationDialog({ conversation, state, api, onClose, onArchived }: { conversation: Conversation; state: WorkspaceState; api: Api; onClose: () => void; onArchived: () => void }) {
  const [title, setTitle] = useState(conversation.title); const [groupId, setGroupId] = useState(conversation.groupId || ''); const [pendingAction, setPendingAction] = useState<'save' | 'archive' | null>(null); const busy = pendingAction !== null; const [error, setError] = useState('');
  async function save(archive = false) { setPendingAction(archive ? 'archive' : 'save'); try { await api(`/api/conversations/${conversation.id}`, 'PATCH', archive ? { archived: true } : { title: title.trim(), groupId: groupId || null }); if (archive) onArchived(); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setPendingAction(null); } }
  return <Modal title="Conversation details" onClose={onClose}><form className="form-stack" onSubmit={event => { event.preventDefault(); void save(); }}><Field label="Title" required description="Shown in sessions and search."><Input autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={160} /></Field><Field label="Group"><Select value={groupId} onChange={event => setGroupId(event.target.value)}><option value="">Ungrouped</option>{state.groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}</Select></Field><p className="field-help">Created {formatDate(conversation.createdAt, true)}</p>{error && <Alert tone="danger">{error}</Alert>}<div className="modal-footer spread"><Button type="button" variant="quiet" onClick={() => void save(true)} loading={pendingAction === 'archive'} disabled={busy}><Archive size={15} />Archive</Button><Button variant="primary" type="submit" loading={pendingAction === 'save'} disabled={busy || !title.trim()}>Save changes</Button></div></form></Modal>;
}

export function SearchDialog({ state, onSelect, onClose }: { state: WorkspaceState; onSelect: (conversation: Conversation) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const results = state.conversations.filter(chat => !chat.archived && `${chat.title} ${chat.messages.map(message => message.content).join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 30);
  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      resultsRef.current?.querySelector<HTMLElement>('.ui-search-result')?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const items = resultsRef.current?.querySelectorAll<HTMLElement>('.ui-search-result');
      items?.[items.length - 1]?.focus();
    }
  }
  return <Modal title="Search conversations" onClose={onClose} wide><SearchField autoFocus value={query} onChange={setQuery} onKeyDown={onSearchKey} label="Search conversations" placeholder="Search titles and messages…" /><SearchResults query={query} resultsRef={resultsRef} results={results.map(chat => { const agent = state.agents.find(item => item.id === chat.agentId); return { id: chat.id, title: chat.title, description: `${agent?.name || 'A Gent'} · ${formatDate(chat.updatedAt)}`, leading: <Avatar agent={agent || { color: '#9393ed', icon: 'custom' }} size="sm" />, trailing: <ArrowUpRight size={16} /> }; })} onSelect={id => { const chat = state.conversations.find(item => item.id === id); if (chat) { onSelect(chat); onClose(); } }} emptyIcon={<Search size={24} />} emptyTitle={query ? 'No conversations match your search.' : 'Your conversations will appear here.'} emptyDescription={query ? 'Try a title, an agent name, or a phrase from a message.' : 'Start a conversation and it will be searchable here.'} label="Conversation results" /></Modal>;
}

export function ScheduleDialog({ state, activeAgentId, api, onClose }: { state: WorkspaceState; activeAgentId: string; api: Api; onClose: () => void }) {
  const [title, setTitle] = useState(''); const [prompt, setPrompt] = useState(''); const [agentId, setAgentId] = useState(activeAgentId);
  const [runAt, setRunAt] = useState(() => { const date = new Date(Date.now() + 3600000); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [enabled, setEnabled] = useState(true);
  return <Modal title="Schedule a task" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { const date = new Date(runAt); if (date.getTime() <= Date.now()) throw new Error('Choose a time in the future.'); await api('/api/schedules', 'POST', { title: title.trim(), prompt, agentId, runAt: date.toISOString(), enabled }); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }}><Field label="Task name" required><Input autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Prepare the weekly review" maxLength={160} /></Field><Field label="Instructions" required description="What should the agent do when the task starts?"><Textarea value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="What should your agent do?" rows={4} maxLength={16000} /></Field><div className="form-columns"><Field label="Agent"><Select value={agentId} onChange={event => setAgentId(event.target.value)}>{state.agents.filter(agent => !agent.archived).map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></Field><Field label="Run once at" required description="Uses your local time. The host must be running when the task is due."><Input type="datetime-local" value={runAt} onChange={event => setRunAt(event.target.value)} /></Field></div><Switch label="Enable this task" description="Runs at the scheduled time while the A Gent host is open." checked={enabled} onChange={event => setEnabled(event.target.checked)} />{error && <Alert tone="danger">{error}</Alert>}<div className="modal-footer"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" loading={busy} disabled={!title.trim() || !prompt.trim()}>Schedule task</Button></div></form></Modal>;
}

export function ConnectionDialog({ connection, onConnect, onClose }: { connection: Connection; onConnect: (connection: Connection) => Promise<void>; onClose: () => void }) {
  const [url, setUrl] = useState(connection.url); const [token, setToken] = useState(connection.token); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <Modal title="Connect to your A Gent host" onClose={onClose}><form className="form-stack" onSubmit={async event => { event.preventDefault(); setBusy(true); setError(''); try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Enter an HTTP or HTTPS host address.'); await onConnect({ url: parsed.origin, token: token.trim() }); onClose(); } catch (reason) { setError((reason as Error).message); } finally { setBusy(false); } }}><div className="connection-illustration"><Monitor size={33} /><span className="connection-line" /><span className="mini-brand">A</span></div><p className="muted">Continue on another device using the address and pairing token from your own A Gent host.</p><Field label="Host address" required description="Include http:// or https://."><Input autoFocus type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-agent-host.example" autoComplete="url" /></Field><Field label="Access token" required description="The token stays in this app session."><Input type="password" value={token} onChange={event => setToken(event.target.value)} autoComplete="off" placeholder="Paste your pairing token" /></Field>{error && <Alert tone="danger">{error}</Alert>}<div className="modal-footer"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button variant="primary" type="submit" loading={busy} disabled={!url || !token}>Connect</Button></div></form></Modal>;
}
