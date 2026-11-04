import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline';
import type { Activity, Agent, AppConnection, Approval, Conversation, ModelOption } from '../shared/types.js';
import { id, now } from './store.js';
import { locateCodex, type CodexLaunch } from './codex-discovery.js';
export { locateCodex } from './codex-discovery.js';

interface RpcMessage { id?: number | string; method?: string; params?: any; result?: any; error?: { message: string; code?: number }; }
export interface ProviderCallbacks {
  delta(text: string): void;
  activity(activity: Activity): void;
  approval(approval: Omit<Approval, 'id' | 'runId' | 'conversationId' | 'status'>, respond: (accept: boolean) => void): void;
  thread(threadId: string): void;
}
export interface ProviderRequest {
  agent: Agent;
  conversation: Conversation;
  modelId: string;
  mode: 'chat' | 'work';
  workspace: string;
  signal: AbortSignal;
  callbacks: ProviderCallbacks;
}
export class CodexBridge {
  private process?: ChildProcessWithoutNullStreams;
  private connecting?: Promise<void>;
  private closing?: Promise<void>;
  private shutdownError?: Error;
  private lastThreadId?: string;
  private appInventoryPromise?: Promise<AppConnection[]>;
  private requests = new Map<string | number, { resolve(value: any): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  private events = new EventEmitter();
  private nextId = 0;
  private stderr = '';
  constructor(private launch?: CodexLaunch) { this.events.setMaxListeners(100); }
  private send(message: RpcMessage) {
    if (!this.process || this.process.stdin.destroyed) throw new Error('Codex connection closed. Reconnect and try again.');
    this.process.stdin.write(JSON.stringify(message) + '\n');
  }
  private request(method: string, params: unknown, timeout = 90000): Promise<any> {
    const requestId = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.requests.delete(requestId); reject(new Error(`Codex ${method} did not respond within ${Math.round(timeout / 1000)} seconds.`)); }, timeout);
      this.requests.set(requestId, { resolve, reject, timer });
      try { this.send({ id: requestId, method, params }); }
      catch (error) { clearTimeout(timer); this.requests.delete(requestId); reject(error); }
    });
  }
  async connect(): Promise<void> {
    if (this.closing) await this.closing;
    if (this.shutdownError) throw this.shutdownError;
    if (this.connecting) return this.connecting;
    let attempt: Promise<void>;
    attempt = this.open().catch(error => { if (this.connecting === attempt) this.connecting = undefined; throw error; });
    this.connecting = attempt;
    return attempt;
  }
  private async open(): Promise<void> {
    const launch = this.launch ?? await locateCodex();
    const args = [...(launch.args ?? []), 'app-server', '--listen', 'stdio://'];
    const child = spawn(launch.command, args, { stdio: 'pipe', windowsHide: true, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' } });
    this.process = child;
    this.lastThreadId = undefined;
    this.stderr = '';
    const lines = createInterface({ input: child.stdout });
    lines.on('line', line => {
      if (line.length > 8 * 1024 * 1024) return;
      let message: RpcMessage;
      try { message = JSON.parse(line); } catch { return; }
      if (!message || typeof message !== 'object') return;
      if (message.id !== undefined && !message.method) {
        const pending = this.requests.get(message.id);
        if (!pending) return;
        this.requests.delete(message.id); clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
      } else this.events.emit('message', message);
    });
    child.stderr.on('data', chunk => { this.stderr = (this.stderr + String(chunk)).slice(-12000); });
    const stop = (message: string) => {
      lines.close();
      // A late exit from an older child must never reject a newer child's requests.
      if (this.process !== child) return;
      this.process = undefined; this.connecting = undefined; this.shutdownError = undefined;
      for (const [requestId, pending] of this.requests) { clearTimeout(pending.timer); pending.reject(new Error(message)); this.requests.delete(requestId); }
      this.events.emit('closed', new Error(message));
    };
    child.once('error', error => stop(`Could not launch Codex: ${error.message}`));
    child.once('exit', (code, signal) => stop(`Codex stopped${signal ? ` (${signal})` : ` (exit ${code ?? 'unknown'})`}. ${this.stderr.trim().slice(-1000)}`));
    try {
      await this.request('initialize', { clientInfo: { name: 'a_gent', title: 'A Gent', version: '0.1.0' }, capabilities: { experimentalApi: true } }, 30000);
      this.send({ method: 'initialized', params: {} });
    } catch (error) { if (this.process === child) await this.close(); throw error; }
  }
  async info(): Promise<{ authenticated: boolean; models: ModelOption[] }> {
    await this.connect();
    const account = await this.request('account/read', { refreshToken: false }, 20000);
    const models: ModelOption[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 10; page++) {
      const result = await this.request('model/list', { limit: 100, cursor, includeHidden: false }, 30000);
      for (const model of result.data ?? []) if (!model.hidden) models.push({ id: model.model ?? model.id, name: model.displayName ?? model.model ?? model.id, description: model.description });
      cursor = result.nextCursor;
      if (!cursor) break;
    }
    return { authenticated: Boolean(account.account) || account.requiresOpenaiAuth === false, models };
  }
  async apps(): Promise<AppConnection[]> {
    if (this.appInventoryPromise) return this.appInventoryPromise;
    const operation = this.readApps(); this.appInventoryPromise = operation;
    try { return await operation; } finally { if (this.appInventoryPromise === operation) this.appInventoryPromise = undefined; }
  }
  private async readApps(): Promise<AppConnection[]> {
    await this.connect();
    const apps: AppConnection[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 40; page++) {
      const result = await this.request('mcpServerStatus/list', { cursor, limit: 5, detail: 'toolsAndAuthOnly', ...(this.lastThreadId ? { threadId: this.lastThreadId } : {}) }, 60000);
      for (const server of result.data ?? []) {
        const runtime = server.runtimeStatus;
        const status: AppConnection['status'] = runtime === 'authenticationRequired' || server.authStatus === 'notLoggedIn' ? 'needs-auth' : runtime === 'connected' ? 'connected' : runtime === 'starting' ? 'starting' : runtime === 'disabled' ? 'disabled' : runtime === 'failed' || runtime === 'cancelled' || server.toolsError ? 'unavailable' : 'configured';
        apps.push({ name: String(server.name ?? 'Unnamed app').slice(0, 200), status, toolsCount: Object.keys(server.tools ?? {}).length });
      }
      cursor = result.nextCursor;
      if (!cursor) return apps.sort((a, b) => a.name.localeCompare(b.name));
    }
    throw new Error('The configured app inventory exceeded its 200-server limit.');
  }
  async run(request: ProviderRequest): Promise<void> {
    await this.connect();
    const { agent, conversation, callbacks, signal, mode, workspace } = request;
    if (signal.aborted) throw new Error('Run interrupted.');
    const params: Record<string, unknown> = {
      cwd: workspace,
      approvalPolicy: 'on-request',
      approvalsReviewer: 'user',
      sandbox: mode === 'work' ? 'workspace-write' : 'read-only',
      developerInstructions: `${agent.instructions}\n\nYou are running inside A Gent. ${mode === 'work' ? 'The user selected Work mode. Make requested changes inside the selected workspace and use the approval flow when additional access is needed.' : 'The user selected Chat mode. Answer questions and inspect relevant context. Do not modify files or perform external side effects in this mode.'}`,
    };
    if (request.modelId) params.model = request.modelId;
    let threadId: string;
    let fresh = !conversation.providerThreadId;
    if (conversation.providerThreadId) {
      try { threadId = (await this.request('thread/resume', { ...params, threadId: conversation.providerThreadId, excludeTurns: true }, 120000)).thread.id; }
      catch (error) {
        if (!/not found|does not exist|unknown thread|no rollout/i.test((error as Error).message)) throw error;
        fresh = true;
        threadId = (await this.request('thread/start', { ...params, serviceName: 'a_gent' }, 120000)).thread.id;
      }
    } else threadId = (await this.request('thread/start', { ...params, serviceName: 'a_gent' }, 120000)).thread.id;
    callbacks.thread(threadId);
    this.lastThreadId = threadId;
    if (signal.aborted) throw new Error('Run interrupted.');
    const userMessage = [...conversation.messages].reverse().find(m => m.role === 'user');
    let text = userMessage?.content ?? '';
    if (userMessage?.attachments?.length) text += '\n\n' + userMessage.attachments.map(a => `<attached-file name=${JSON.stringify(a.name)}>\n${a.content}\n</attached-file>`).join('\n\n');
    if (fresh && conversation.messages.length > 2) {
      const history = conversation.messages.slice(0, -2).filter(m => m.content).map(m => `${m.role}: ${m.content}`).join('\n\n').slice(-80000);
      if (history) text = `<previous-conversation>\n${history}\n</previous-conversation>\n\n${text}`;
    }
    let turnId = '';
    let streamed = '';
    let currentItemId = '';
    let settled = false;
    const pendingApprovalIds = new Set<string | number>();
    await new Promise<void>((resolve, reject) => {
      let interruptionRequested = false;
      let interruptionDeadline: ReturnType<typeof setTimeout> | undefined;
      const earlyEvents: RpcMessage[] = [];
      const cleanup = () => { this.events.off('message', onMessage); this.events.off('closed', onClose); signal.removeEventListener('abort', onAbort); if (interruptionDeadline) clearTimeout(interruptionDeadline); };
      const finish = (error?: Error) => { if (settled) return; settled = true; cleanup(); if (error) reject(error); else resolve(); };
      const onClose = (error: Error) => finish(error);
      const interruptKnownTurn = () => {
        if (!turnId || settled || interruptionRequested) return;
        interruptionRequested = true;
        // An RPC acknowledgement only means the request was received. Keep the chat
        // reserved until the matching turn/completed notification or child exit.
        void this.request('turn/interrupt', { threadId, turnId }, 10000).catch(() => {});
      };
      const onAbort = () => {
        if (settled) return;
        if (!interruptionDeadline) interruptionDeadline = setTimeout(() => {
          // If Codex cannot confirm interruption, terminate this owned connection;
          // no later turn can inherit events from an unconfirmed running child.
          void this.close().catch(error => finish(error));
        }, 10000);
        interruptKnownTurn();
      };
      const onMessage = (message: RpcMessage) => {
        const p = message.params ?? {};
        if (p.threadId !== threadId) return;
        const eventTurnId = typeof p.turnId === 'string' ? p.turnId : typeof p.turn?.id === 'string' ? p.turn.id : undefined;
        if (!eventTurnId && message.id !== undefined && message.method === 'mcpServer/elicitation/request') {
          this.send({ id: message.id, result: { action: 'decline', content: null, _meta: null } });
          return;
        }
        if (!turnId) {
          if (eventTurnId) {
            if (earlyEvents.length >= 1024) { void this.close().catch(error => finish(error)); return; }
            earlyEvents.push(message);
          }
          return;
        }
        if (eventTurnId !== turnId) return;
        if (message.id !== undefined && message.method) {
          const requestId = message.id;
          pendingApprovalIds.add(requestId);
          const method = message.method;
          if (method === 'item/commandExecution/requestApproval' || method === 'item/fileChange/requestApproval' || method === 'item/permissions/requestApproval') {
            const command = typeof p.command === 'string' ? p.command : undefined;
            const fileDiff = method.includes('fileChange')
              ? (typeof p.patch === 'string' ? p.patch : Array.isArray(p.changes) ? p.changes.map((change: any) => `${change.path ?? change.file ?? 'file'}\n${change.diff ?? ''}`).join('\n') : undefined)
              : undefined;
            const permissions = method === 'item/permissions/requestApproval' ? JSON.stringify(p.permissions, null, 2) : undefined;
            const respond = (accept: boolean) => {
              pendingApprovalIds.delete(requestId);
              if (settled) return;
              const result = method.includes('permissions') ? { permissions: accept ? p.permissions : {}, scope: 'turn' } : { decision: accept ? 'accept' : 'decline' };
              this.send({ id: requestId, result });
            };
            if (signal.aborted) respond(false);
            else callbacks.approval({ title: method.includes('fileChange') ? 'Approve file changes' : method.includes('permissions') ? 'Approve requested access' : 'Approve command', description: [p.reason, p.cwd ? `Folder: ${p.cwd}` : '', permissions].filter(Boolean).join('\n') || 'Codex is asking for your approval before continuing.', command: command || fileDiff }, respond);
          } else if (method === 'mcpServer/elicitation/request') {
            // This release supports decline without collecting secrets or accepting an unseen form.
            callbacks.activity({ id: id(), kind: 'status', title: 'An app connection needs additional input', detail: p.message ?? 'Complete this app connection in Codex, then retry the task.', status: 'failed', createdAt: now() });
            pendingApprovalIds.delete(requestId);
            this.send({ id: requestId, result: { action: 'decline', content: null, _meta: null } });
          } else if (method === 'item/tool/requestUserInput') {
            callbacks.activity({ id: id(), kind: 'status', title: 'Your agent has a question', detail: (p.questions ?? []).map((q: any) => q.question).join('\n'), status: 'completed', createdAt: now() });
            pendingApprovalIds.delete(requestId);
            this.send({ id: requestId, result: { answers: {} } });
          } else {
            pendingApprovalIds.delete(requestId);
            this.send({ id: requestId, error: { code: -32601, message: 'This A Gent release does not support this interactive request.' } });
          }
          return;
        }
        if (message.method === 'item/agentMessage/delta') {
          if (signal.aborted) return;
          if (p.itemId && currentItemId && currentItemId !== p.itemId && streamed && !streamed.endsWith('\n\n')) { streamed += '\n\n'; callbacks.delta('\n\n'); }
          if (p.itemId) currentItemId = p.itemId;
          const delta = String(p.delta ?? ''); streamed += delta; callbacks.delta(delta);
        } else if (message.method === 'item/completed' || message.method === 'item/started') {
          if (signal.aborted) return;
          const item = p.item ?? {}, completed = message.method === 'item/completed';
          if (item.type === 'agentMessage' && completed) {
            const finalText = String(item.text ?? '');
            if (finalText && !streamed.endsWith(finalText)) {
              if (streamed && !streamed.endsWith('\n\n')) { streamed += '\n\n'; callbacks.delta('\n\n'); }
              streamed += finalText; callbacks.delta(finalText);
            }
            return;
          }
          const activity = activityFromItem(item, completed);
          if (activity) callbacks.activity(activity);
        } else if (message.method === 'turn/completed') {
          const turn = p.turn ?? {};
          if (signal.aborted) finish(new Error('Run interrupted.'));
          else if (turn.status === 'completed') finish();
          else finish(new Error(turn.error?.message ?? (turn.status === 'interrupted' ? 'Run interrupted.' : 'Codex could not complete this task.')));
        } else if (message.method === 'error' && p.willRetry !== true) finish(new Error(p.error?.message ?? p.message ?? 'Codex reported an error.'));
      };
      this.events.on('message', onMessage); this.events.on('closed', onClose); signal.addEventListener('abort', onAbort, { once: true });
      const turnParams: Record<string, unknown> = { threadId, input: [{ type: 'text', text, text_elements: [] }], approvalPolicy: 'on-request', approvalsReviewer: 'user', cwd: workspace, sandboxPolicy: mode === 'work' ? { type: 'workspaceWrite', writableRoots: [workspace], networkAccess: false, excludeTmpdirEnvVar: false, excludeSlashTmp: false } : { type: 'readOnly', networkAccess: false } };
      if (request.modelId) turnParams.model = request.modelId;
      if (['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'].includes(agent.reasoningEffort)) turnParams.effort = agent.reasoningEffort;
      void this.request('turn/start', turnParams, 120000).then(result => {
        turnId = result.turn?.id ?? '';
        if (!turnId) { finish(new Error('Codex did not return a turn ID.')); return; }
        for (const message of earlyEvents.splice(0)) { if (settled) break; onMessage(message); }
        if (signal.aborted && !settled) onAbort();
      }).catch(error => finish(error));
    });
  }
  async close(): Promise<void> {
    if (this.closing) return this.closing;
    const child = this.process;
    if (!child) return;
    const operation = new Promise<void>((resolve, reject) => {
      if (child.exitCode !== null || child.signalCode !== null) { resolve(); return; }
      let terminated = false;
      const cleanup = () => { clearTimeout(term); clearTimeout(kill); clearTimeout(deadline); child.off('exit', onExit); };
      const onExit = () => { terminated = true; cleanup(); resolve(); };
      const term = setTimeout(() => { if (!terminated) child.kill('SIGTERM'); }, 2000);
      const kill = setTimeout(() => { if (!terminated) child.kill('SIGKILL'); }, 3500);
      const deadline = setTimeout(() => {
        cleanup();
        this.shutdownError = new Error('Codex did not confirm shutdown. Restart A Gent before reconnecting.');
        reject(this.shutdownError);
      }, 6000);
      child.once('exit', onExit);
      child.stdin.end();
    });
    this.closing = operation;
    try { await operation; } finally { if (this.closing === operation) this.closing = undefined; }
  }
}

function activityFromItem(item: any, completed: boolean): Activity | null {
  const status = ['failed', 'declined'].includes(item.status) ? 'failed' : completed ? 'completed' : 'running';
  const base = { id: String(item.id ?? id()), status, createdAt: new Date(item.startedAtMs ?? Date.now()).toISOString() } as const;
  switch (item.type) {
    case 'commandExecution': return { ...base, kind: 'command', title: item.command ?? 'Run command', detail: typeof item.aggregatedOutput === 'string' ? item.aggregatedOutput.slice(-30000) : item.cwd };
    case 'fileChange': return { ...base, kind: 'file', title: 'Update files', detail: (item.changes ?? []).map((c: any) => `${c.kind?.type ?? 'update'} ${c.path}\n${c.diff ?? ''}`).join('\n').slice(0, 30000) };
    case 'mcpToolCall': return { ...base, kind: 'tool', title: `${item.server}: ${item.tool}`, detail: item.error?.message };
    case 'dynamicToolCall': return { ...base, kind: 'tool', title: item.tool ?? 'Use tool' };
    case 'collabAgentToolCall': return { ...base, kind: 'tool', title: `Agent team: ${item.tool}`, detail: item.prompt?.slice(0, 3000) };
    case 'reasoning': return { ...base, kind: 'thinking', title: 'Thinking', detail: (item.summary ?? []).join('\n') };
    case 'plan': return { ...base, kind: 'thinking', title: 'Plan', detail: item.text };
    case 'webSearch': return { ...base, kind: 'tool', title: 'Search the web' };
    default: return null;
  }
}
