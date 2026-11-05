import { Button } from './ui/Button';
import { Alert, useToast } from './ui/Alert';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Code2, Palette, Search, Sparkles, Telescope, Terminal, UsersRound } from 'lucide-react';
import type { Agent, Attachment, Conversation, Run } from '../shared/types';
import { initialConnection, request, type Connection } from './api';
import { AgentGlyph, AvatarRuntimeProvider, Mark, Spinner } from './components';
import { AgentDialog, AgentGroupDialog, GroupDialog, ConversationDialog, SearchDialog, ScheduleDialog, ConnectionDialog, type DialogKind } from './dialogs';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { ConnectionsDialog } from './dialogs/ConnectionsDialog';
import { AgentsDialog } from './dialogs/AgentsDialog';
import { SchedulesDialog } from './dialogs/SchedulesDialog';
import { useWorkspace } from './useWorkspace';
import { Sidebar } from './app/Sidebar';
import { SidebarRail } from './app/SidebarRail';
import { TopBar } from './app/TopBar';
import { SidePanel, type SidePanelTab } from './app/SidePanel';
import { MessageList } from './chat/MessageList';
import { Composer } from './composer/Composer';

function saved(key: string, fallback = '') { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function remember(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage is optional */ } }

export default function App() {
  const [connection, setConnection] = useState<Connection>(initialConnection);
  const { data, api, refresh, loading, error, setError, online, updateRun } = useWorkspace(connection);
  const toast = useToast();
  const [activeAgentId, setActiveAgentId] = useState(saved('aGent.agent', 'primary'));
  const [activeConversationId, setActiveConversationId] = useState<string | null>(saved('aGent.conversation') || null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 860);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('session');
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [text, setText] = useState(''); const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [providerId, setProviderId] = useState('codex'); const [modelId, setModelId] = useState('');
  const [effort, setEffort] = useState(''); const [mode, setMode] = useState<'chat' | 'work'>('chat');
  const [workspacePath, setWorkspacePath] = useState(''); const [sending, setSending] = useState(false);
  const [modelPicker, setModelPicker] = useState(false); const [copied, setCopied] = useState('');
  const composer = useRef<HTMLTextAreaElement>(null); const attachInput = useRef<HTMLInputElement>(null); const scroll = useRef<HTMLDivElement>(null); const pickerRef = useRef<HTMLDivElement>(null);
  const state = data?.state;
  const agents = state?.agents.filter(agent => !agent.archived) || [];
  const conversations = useMemo(() => [...(state?.conversations || [])].filter(chat => !chat.archived).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state?.conversations]);
  const conversation = state?.conversations.find(chat => chat.id === activeConversationId && !chat.archived);
  const agent = agents.find(item => item.id === (conversation?.agentId || activeAgentId)) || agents[0];
  const currentProvider = data?.providers.find(provider => provider.id === providerId);
  const currentModel = currentProvider?.models.find(model => model.id === modelId);
  const currentRun = [...(data?.runs || [])].reverse().find(run => run.conversationId === conversation?.id && ['running', 'waiting'].includes(run.status));
  const lastRun = [...(data?.runs || [])].reverse().find(run => run.conversationId === conversation?.id);
  const runError = lastRun?.status === 'failed' ? lastRun.error : undefined;
  const toolStreamView = state?.settings.toolStreamView ?? (state?.settings.showActivity === false ? 'hidden' : 'compact');
  const busy = !!currentRun || sending;

  useEffect(() => {
    if (!agent) return; const selectedProvider = conversation?.providerId || agent.providerId || 'codex'; if (selectedProvider !== 'codex') setMode('chat'); setProviderId(selectedProvider); setModelId(conversation?.modelId !== undefined ? conversation.modelId : agent.modelId || ''); setEffort(conversation?.reasoningEffort ?? agent.reasoningEffort ?? ''); setWorkspacePath(conversation?.workspacePath || agent.workspacePath || '');
  }, [agent?.id, agent?.providerId, agent?.modelId, agent?.reasoningEffort, agent?.workspacePath, conversation?.id, conversation?.providerId, conversation?.modelId, conversation?.reasoningEffort, conversation?.workspacePath]);
  useEffect(() => {
    if (!currentModel) return;
    const reasoning = currentModel.reasoning;
    if (reasoning?.kind === 'enum') {
      if (reasoning.options.some(option => option.value === effort)) return;
      const next = reasoning.default || '';
      setEffort(next);
      if (conversation) void api(`/api/conversations/${conversation.id}`, 'PATCH', { reasoningEffort: next }).catch(() => {});
      else if (agent) void api(`/api/agents/${agent.id}`, 'PATCH', { reasoningEffort: next }).catch(() => {});
    } else if (effort) {
      setEffort('');
      if (conversation) void api(`/api/conversations/${conversation.id}`, 'PATCH', { reasoningEffort: '' }).catch(() => {});
      else if (agent) void api(`/api/agents/${agent.id}`, 'PATCH', { reasoningEffort: '' }).catch(() => {});
    }
  }, [currentModel?.id, currentModel?.reasoning, effort, conversation?.id, agent?.id]);
  useEffect(() => {
    const theme = state?.settings.theme || 'dark';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    apply(); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply);
  }, [state?.settings.theme]);
  useEffect(() => { const element = composer.current; if (element) { element.style.height = 'auto'; element.style.height = `${Math.min(element.scrollHeight, 180)}px`; } }, [text]);
  useEffect(() => {
    const element = scroll.current;
    if (element && element.scrollHeight - element.scrollTop - element.clientHeight < 420) element.scrollTo({ top: element.scrollHeight, behavior: 'instant' });
  }, [conversation?.messages, currentRun?.activities.length]);
  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight }); }, [activeConversationId]);
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setDialog({ kind: 'search' }); }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); newChat(); }
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') { event.preventDefault(); setSidePanelOpen(value => !value); }
      if (event.key === 'Escape') { setModelPicker(false); if (!dialog) setSidePanelOpen(false); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  });
  useEffect(() => {
    const handler = (event: Event) => {
      if (modelPicker) { event.preventDefault(); setModelPicker(false); return; }
      if (dialog) { event.preventDefault(); setDialog(null); return; }
      if (sidePanelOpen) { event.preventDefault(); setSidePanelOpen(false); return; }
      if (sidebarOpen && window.innerWidth < 860) { event.preventDefault(); setSidebarOpen(false); }
    };
    window.addEventListener('agent:back', handler);
    return () => window.removeEventListener('agent:back', handler);
  }, [modelPicker, dialog, sidePanelOpen, sidebarOpen]);

  function closeMobileSidebar() { if (window.innerWidth < 860) setSidebarOpen(false); }
  function closeMobilePanel() { if (window.innerWidth < 1180) setSidePanelOpen(false); }
  function selectChat(chat: Conversation) { setActiveConversationId(chat.id); setActiveAgentId(chat.agentId); remember('aGent.conversation', chat.id); remember('aGent.agent', chat.agentId); setText(''); setAttachments([]); closeMobileSidebar(); closeMobilePanel(); }
  function selectAgent(next: Agent) { const last = conversations.find(chat => chat.agentId === next.id); setActiveAgentId(next.id); setActiveConversationId(last?.id || null); remember('aGent.agent', next.id); remember('aGent.conversation', last?.id || ''); setText(''); setAttachments([]); closeMobileSidebar(); closeMobilePanel(); }
  function newChat(selectedAgent?: Agent) { if (selectedAgent) { setActiveAgentId(selectedAgent.id); remember('aGent.agent', selectedAgent.id); } setActiveConversationId(null); remember('aGent.conversation', ''); setText(''); setAttachments([]); closeMobileSidebar(); closeMobilePanel(); setTimeout(() => composer.current?.focus(), 30); }
  function openSidePanel(tab: SidePanelTab = 'session') { if (window.innerWidth < 860) setSidebarOpen(false); setSidePanelTab(tab); setSidePanelOpen(true); }
  async function chooseFolder() {
    if (window.aGentDesktop) { const chosen = await window.aGentDesktop.selectDirectory(); if (chosen) setWorkspacePath(chosen); }
    else { const chosen = window.prompt('Project folder on the A Gent host', workspacePath); if (chosen !== null) setWorkspacePath(chosen.trim()); }
  }
  async function send() {
    if (!agent || (!text.trim() && !attachments.length) || busy) return;
    setSending(true); setError('');
    try {
      let selected = conversation;
      if (!selected) { selected = await api<Conversation>('/api/conversations', 'POST', { agentId: agent.id, workspacePath: workspacePath || undefined, providerId, modelId, reasoningEffort: effort }); setActiveConversationId(selected.id); remember('aGent.conversation', selected.id); }
      else if ((selected.workspacePath || '') !== workspacePath) await api(`/api/conversations/${selected.id}`, 'PATCH', { workspacePath: workspacePath || undefined });
      const run = await api<Run>(`/api/conversations/${selected.id}/messages`, 'POST', { content: text.trim() || 'Please read the attached files.', attachments, providerId, modelId, mode });
      updateRun(run); setText(''); setAttachments([]); setTimeout(() => scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch (reason) { setError((reason as Error).message); } finally { setSending(false); }
  }
  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }
  async function addFiles(files: FileList | File[]) {
    try {
      const values: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 1024 * 1024) throw new Error(`${file.name} is larger than 1 MB. Attach a smaller text file.`);
        if (/\.(png|jpe?g|gif|webp|pdf|zip|exe|dmg|mp[34]|mov|woff2?|ttf)$/i.test(file.name)) throw new Error('Attach text, code, or Markdown files. Image and binary attachments are not supported yet.');
        values.push({ id: crypto.randomUUID(), name: file.name, type: file.type || 'text/plain', content: await file.text() });
      }
      if (values.length + attachments.length > 8) throw new Error('Attach up to 8 files per message.');
      setAttachments(previous => [...previous, ...values]); composer.current?.focus();
    } catch (reason) { setError((reason as Error).message); }
  }
  async function appendSystemEvent(content: string) {
    if (!conversation) return;
    try { await api(`/api/conversations/${conversation.id}/system`, 'POST', { content }); }
    catch (reason) { setError((reason as Error).message); }
  }
  async function chooseModel(nextProvider: string, nextModel: string) {
    const changed = nextProvider !== providerId || nextModel !== modelId;
    const provider = data?.providers.find(item => item.id === nextProvider);
    const model = provider?.models.find(item => item.id === nextModel);
    const reasoning = model?.reasoning;
    const nextEffort = reasoning?.kind === 'enum'
      ? (reasoning.options.some(option => option.value === effort) ? effort : reasoning.default || '')
      : '';
    const previous = { providerId, modelId, effort };
    setProviderId(nextProvider); setModelId(nextModel); setEffort(nextEffort); if (nextProvider !== 'codex') setMode('chat');
    try {
      if (conversation) await api(`/api/conversations/${conversation.id}`, 'PATCH', { providerId: nextProvider, modelId: nextModel, reasoningEffort: nextEffort });
      else if (agent) await api(`/api/agents/${agent.id}`, 'PATCH', { providerId: nextProvider, modelId: nextModel, reasoningEffort: nextEffort });
      if (changed) await appendSystemEvent(`Model changed to ${provider?.name || nextProvider}${model?.name ? ` · ${model.name}` : ' · Provider default'}`);
    } catch (reason) {
      setProviderId(previous.providerId); setModelId(previous.modelId); setEffort(previous.effort);
      setError((reason as Error).message);
    }
  }
  async function chooseEffort(next: string) {
    const changed = next !== effort;
    const model = currentProvider?.models.find(item => item.id === modelId);
    const label = model?.reasoning?.kind === 'enum' ? model.reasoning.options.find(option => option.value === next)?.label || next : next;
    const previous = effort;
    setEffort(next);
    try {
      if (conversation) await api(`/api/conversations/${conversation.id}`, 'PATCH', { reasoningEffort: next });
      else if (agent) await api(`/api/agents/${agent.id}`, 'PATCH', { reasoningEffort: next });
      if (changed) await appendSystemEvent(`Reasoning effort set to ${label || 'Provider default'}`);
    } catch (reason) { setEffort(previous); setError((reason as Error).message); }
  }
  async function connect(next: Connection) { await request(next, '/api/bootstrap'); remember('aGent.host', next.url); try { sessionStorage.setItem('aGent.token', next.token); } catch { /* session-only fallback */ } setConnection(next); setActiveConversationId(null); setActiveAgentId('primary'); }
  function updateDeviceToken(token: string) { setConnection(previous => ({ ...previous, token })); try { sessionStorage.setItem('aGent.token', token); } catch { /* session-only fallback */ } }
  function handleDeviceRevoked() { try { sessionStorage.removeItem('aGent.token'); } catch { /* session-only fallback */ } window.location.reload(); }
  async function copyMessage(content: string, id: string) { try { await navigator.clipboard.writeText(content); setCopied(id); setTimeout(() => setCopied(''), 1500); toast({ title: 'Message copied', tone: 'success' }); } catch { toast({ title: 'Clipboard unavailable', description: 'Copying is blocked in this environment.', tone: 'danger' }); } }
  async function handleApproval(id: string, accept: boolean) { try { await api(`/api/approvals/${id}`, 'POST', { decision: accept ? 'accept' : 'decline' }); } catch (reason) { setError((reason as Error).message); } }
  async function handleInteraction(id: string, action: 'accept' | 'decline' | 'cancel', response?: unknown) {
    try { await api(`/api/interactions/${id}`, 'POST', { action, response }); }
    catch (reason) { setError((reason as Error).message); throw reason; }
  }
  const pendingInteractions = (data?.interactions || []).filter(item => item.status === 'pending' && item.conversationId === conversation?.id);
  async function stopRun() { if (!currentRun) return; try { updateRun(await api<Run>(`/api/runs/${currentRun.id}/interrupt`, 'POST')); } catch (reason) { setError((reason as Error).message); } }
  function openConversationDetails(chat: Conversation) { setDialog({ kind: 'conversation', conversation: chat }); }

  const label = agent?.name || 'A Gent';
  const starterPrompts = agent?.icon === 'code'
    ? [{ Icon: Code2, title: 'Build something', prompt: 'Help me plan and build a new feature. Start by asking what I want to create.' }, { Icon: Search, title: 'Find the problem', prompt: 'Help me investigate a bug. Ask me for the symptoms and the relevant project.' }, { Icon: Terminal, title: 'Review my project', prompt: 'Review my project and identify the most useful next improvement.' }]
    : agent?.icon === 'design'
      ? [{ Icon: Palette, title: 'Explore a direction', prompt: 'Help me explore a visual direction for a product. Ask about the product and its audience.' }, { Icon: UsersRound, title: 'Improve a flow', prompt: 'Help me improve a user flow. Ask me which flow and what is not working.' }, { Icon: Sparkles, title: 'Shape an idea', prompt: 'Help me turn a product idea into a clear, testable concept.' }]
      : [{ Icon: Sparkles, title: 'Think it through', prompt: 'Help me think through an idea. Ask me what I have in mind.' }, { Icon: Code2, title: 'Build something', prompt: 'Help me plan something I want to build. Ask what I would like to create.' }, { Icon: Telescope, title: 'Look into it', prompt: 'Help me research a topic. Ask what I want to understand and why.' }];

  return <AvatarRuntimeProvider runs={data?.runs || []}><div className={`reason-app ${sidebarOpen ? 'is-sidebar-open' : ''} ${sidePanelOpen ? 'is-panel-open' : ''}`} data-desktop={window.aGentDesktop ? 'true' : undefined} data-platform={window.aGentDesktop?.platform}>
    {sidebarOpen && <button className="reason-scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
    {sidebarOpen ? <Sidebar
      agents={agents}
      conversations={conversations}
      agentGroups={state?.agentGroups || []}
      activeAgentId={agent?.id}
      runs={data?.runs || []}
      providers={data?.providers || []}
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      onNewChat={newChat}
      onSelectAgent={selectAgent}
      onSearch={() => setDialog({ kind: 'search' })}
      onCreateAgent={() => setDialog({ kind: 'agent' })}
      onCreateAgentGroup={() => setDialog({ kind: 'agent-group' })}
      onEditAgentGroup={group => setDialog({ kind: 'agent-group', group })}
      onOpenAgents={() => setDialog({ kind: 'agents' })}
      onOpenScheduled={() => setDialog({ kind: 'schedules' })}
      onOpenConnections={() => setDialog({ kind: 'connections' })}
      onOpenSettings={() => setDialog({ kind: 'settings' })}
    /> : <SidebarRail
      agents={agents}
      activeAgentId={agent?.id}
      onSelectAgent={selectAgent}
      onNewChat={() => newChat()}
      onOpenSidebar={() => { setSidePanelOpen(false); setSidebarOpen(true); }}
      onSearch={() => setDialog({ kind: 'search' })}
      onOpenSettings={() => setDialog({ kind: 'settings' })}
      onOpenConnections={() => setDialog({ kind: 'connections' })}
    />}
    <main className="reason-main">
      <div className="reason-surface">
        <TopBar
          label={label}
          agent={agent}
          conversation={conversation}
          online={online}
          hasData={!!data}
          sidebarOpen={sidebarOpen}
          sidePanelOpen={sidePanelOpen}
          onOpenSidebar={() => { setSidePanelOpen(false); setSidebarOpen(true); }}
          onToggleSidePanel={() => sidePanelOpen ? setSidePanelOpen(false) : openSidePanel('session')}
          onOpenConversationDetails={() => conversation && openConversationDetails(conversation)}
        />
        {error && <Alert tone="danger" title="Something went wrong" className="error-banner" onDismiss={() => setError('')}>{error}</Alert>}
        {!data ? <div className="reason-initial">
          <Mark size={54} />
          {loading ? <><Spinner size={22} /><h1>Opening your workspace…</h1></> : <><h1>Your agents. Wherever you are.</h1><p>Connect to your A Gent host to get started.</p><Button variant="primary" onClick={() => setDialog({ kind: 'connection' })}>Connect workspace<ArrowUpRight size={16} /></Button></>}
        </div> : <div className="reason-chat" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files); }}>
          <div className={`reason-chat-scroll ${!conversation?.messages.length ? 'is-empty' : ''}`} ref={scroll}>
            {!conversation?.messages.length ? <div className="reason-welcome">
              <div className="reason-welcome-mark">{agent ? <AgentGlyph agent={agent} size={48} /> : <Mark size={48} />}</div>
              <h1>{agent?.name || 'A Gent'}</h1>
              <p>{agent?.description || 'A place to think clearly and move things forward.'}</p>
              <div className="reason-starters">{starterPrompts.map(({ Icon, title, prompt }) => <button key={title} onClick={() => { setText(prompt); composer.current?.focus(); }}><Icon size={15} /><span>{title}</span><ArrowUpRight size={13} /></button>)}</div>
            </div> : <MessageList
              messages={conversation.messages}
              currentRun={currentRun}
              toolStreamView={toolStreamView}
              copied={copied}
              runError={runError}
              onCopy={copyMessage}
              onApproval={handleApproval}
              interactions={pendingInteractions}
              onInteraction={handleInteraction}
              onOpenDetails={() => conversation && openConversationDetails(conversation)}
            />}
          </div>
          <Composer
            agent={agent}
            text={text}
            setText={setText}
            attachments={attachments}
            onAddFiles={addFiles}
            onRemoveAttachment={id => setAttachments(previous => previous.filter(item => item.id !== id))}
            onSend={() => void send()}
            onStop={() => void stopRun()}
            busy={busy}
            canStop={!!currentRun}
            sending={sending}
            providerId={providerId}
            modelId={modelId}
            effort={effort}
            mode={mode}
            workspacePath={workspacePath}
            providers={data.providers}
            currentProvider={currentProvider}
            currentModel={currentModel}
            modelPicker={modelPicker}
            setModelPicker={setModelPicker}
            pickerRef={pickerRef}
            textareaRef={composer}
            attachInputRef={attachInput}
            onChooseModel={chooseModel}
            onChooseFolder={() => void chooseFolder()}
            onOpenConnections={() => setDialog({ kind: 'connections' })}
            onSetMode={setMode}
            onSetEffort={value => void chooseEffort(value)}
            onComposerKey={onComposerKey}
          />
        </div>}
      </div>
    </main>
    {sidePanelOpen && <SidePanel
      tab={sidePanelTab}
      api={api}
      onTab={setSidePanelTab}
      onClose={() => setSidePanelOpen(false)}
      agent={agent}
      conversation={conversation}
      conversations={conversations}
      groups={state?.groups || []}
      currentRun={currentRun}
      onSelectConversation={selectChat}
      onNewChat={() => newChat()}
      onCreateGroup={() => setDialog({ kind: 'group' })}
      onOpenConversationDetails={openConversationDetails}
      onOpenAgent={() => agent && setDialog({ kind: 'agent', agent })}
      onApproval={handleApproval}
    />}
    {dialog?.kind === 'connection' && <ConnectionDialog connection={connection} onConnect={connect} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'settings' && <SettingsDialog state={data.state} providers={data.providers} api={api} connection={connection} onError={setError} onRefresh={refresh} onClose={() => setDialog(null)} onOpenConnections={() => setDialog({ kind: 'connections' })} onDeviceToken={updateDeviceToken} onDeviceRevoked={handleDeviceRevoked} />}
    {data && dialog?.kind === 'connections' && <ConnectionsDialog providers={data.providers} api={api} onRefresh={refresh} connection={connection} onHost={() => setDialog({ kind: 'connection' })} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'agents' && <AgentsDialog agents={agents} onCreate={() => setDialog({ kind: 'agent' })} onEdit={value => setDialog({ kind: 'agent', agent: value })} onChat={value => { newChat(value); setDialog(null); }} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'schedules' && <SchedulesDialog state={data.state} api={api} onCreate={() => setDialog({ kind: 'schedule' })} onOpen={id => { const chat = state?.conversations.find(item => item.id === id); if (chat) selectChat(chat); setDialog(null); }} onError={setError} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'agent' && <AgentDialog agent={dialog.agent} agentGroups={data.state.agentGroups} providers={data.providers} api={api} onClose={() => setDialog(null)} onSaved={value => { setActiveAgentId(value.archived ? 'primary' : value.id); setActiveConversationId(null); }} />}
    {data && dialog?.kind === 'group' && <GroupDialog api={api} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'agent-group' && <AgentGroupDialog group={dialog.group} api={api} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'conversation' && <ConversationDialog conversation={dialog.conversation} state={data.state} api={api} onClose={() => setDialog(null)} onArchived={() => { if (activeConversationId === dialog.conversation.id) newChat(); }} />}
    {data && dialog?.kind === 'search' && <SearchDialog state={data.state} onSelect={selectChat} onClose={() => setDialog(null)} />}
    {data && dialog?.kind === 'schedule' && <ScheduleDialog state={data.state} activeAgentId={agent?.id || 'primary'} api={api} onClose={() => setDialog(null)} />}
  </div></AvatarRuntimeProvider>;
}
