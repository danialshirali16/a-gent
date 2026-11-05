import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline';
import type { Activity, Agent, AppCapabilities, AppConnection, AppInventory, AppLoginStart, AppLoginState, AppResourceCapability, AppToolCapability, Approval, Conversation, InteractionField, InteractionQuestion, ModelOption } from '../shared/types.js';
import { BUDGETS } from './budgets.js';
import { redact } from './diagnostics.js';
import { parseElicitation, parseQuestions, validateElicitationValues, validateQuestionAnswers } from './hil.js';
import { id, now } from './store.js';
import { locateCodex, type CodexLaunch } from './codex-discovery.js';
export { locateCodex } from './codex-discovery.js';

interface RpcMessage { id?: number | string; method?: string; params?: any; result?: any; error?: { message: string; code?: number }; }
export interface ProviderInteractionRequest {
  kind: 'question' | 'form' | 'url';
  title: string;
  description?: string;
  command?: string;
  url?: string;
  questions?: InteractionQuestion[];
  fields?: InteractionField[];
}
export type ProviderInteractionRespond = (action: 'accept' | 'decline' | 'cancel', response?: unknown) => void;
export interface ProviderCallbacks {
  delta(text: string): void;
  activity(activity: Activity): void;
  approval(approval: Omit<Approval, 'id' | 'runId' | 'conversationId' | 'status'>, respond: (accept: boolean) => void): void;
  interaction?(request: ProviderInteractionRequest, respond?: ProviderInteractionRespond): void;
  thread(threadId: string): void;
}
export interface ProviderRequest {
  agent: Agent;
  conversation: Conversation;
  modelId: string;
  reasoning?: import('../shared/types.js').ReasoningCapability;
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
  private appInventories = new Map<string, Promise<AppInventory>>();
  private oauthLogins = new Map<string, AppLoginState>();
  private requests = new Map<string | number, { resolve(value: any): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  private events = new EventEmitter();
  private nextId = 0;
  private stderr = '';
  constructor(private launch?: CodexLaunch) { this.events.setMaxListeners(100); }
  private send(message: RpcMessage) {
    if (!this.process || this.process.stdin.destroyed) throw new Error('Codex connection closed. Reconnect and try again.');
    this.process.stdin.write(JSON.stringify(message) + '\n');
  }
  private request(method: string, params: unknown, timeout: number = BUDGETS.tool, signal?: AbortSignal): Promise<any> {
    const requestId = ++this.nextId;
    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => { if (signal) signal.removeEventListener('abort', onAbort); };
      const finish = (settle: (value?: any) => void, value?: any) => {
        if (settled) return;
        settled = true; this.requests.delete(requestId); clearTimeout(timer); cleanup(); settle(value);
      };
      const onAbort = () => {
        try { this.send({ method: '$/cancelRequest', params: { id: requestId } }); } catch { /* connection closed */ }
        finish(reject, new Error(`Codex ${method} was cancelled.`));
      };
      const timer = setTimeout(() => finish(reject, new Error(`Codex ${method} did not respond within ${Math.round(timeout / 1000)} seconds.`)), timeout);
      this.requests.set(requestId, { resolve: value => finish(resolve, value), reject: error => finish(reject, error), timer });
      if (signal) {
        if (signal.aborted) { onAbort(); return; }
        signal.addEventListener('abort', onAbort, { once: true });
      }
      try { this.send({ id: requestId, method, params }); }
      catch (error) { finish(reject, error); }
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
    this.oauthLogins.clear();
    this.stderr = '';
    const lines = createInterface({ input: child.stdout });
    lines.on('line', line => {
      if (line.length > 8 * 1024 * 1024) return;
      let message: RpcMessage;
      try { message = JSON.parse(line); } catch { return; }
      if (!message || typeof message !== 'object') return;
      if (message.method === 'mcpServer/oauthLogin/completed') {
        const params = message.params ?? {};
        if (typeof params.loginId === 'string') {
          this.oauthLogins.set(params.loginId, {
            loginId: params.loginId,
            status: params.success === true ? 'success' : 'failed',
            ...(typeof params.error === 'string' && params.error ? { error: redact(params.error).slice(0, 2000) } : {}),
            updatedAt: now(),
          });
          if (this.oauthLogins.size > 50) {
            const oldest = this.oauthLogins.keys().next().value;
            if (oldest) this.oauthLogins.delete(oldest);
          }
        }
      }
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
    child.once('exit', (code, signal) => stop(redact(`Codex stopped${signal ? ` (${signal})` : ` (exit ${code ?? 'unknown'})`}. ${this.stderr.trim().slice(-1000)}`)));
    try {
      await this.request('initialize', { clientInfo: { name: 'a_gent', title: 'A Gent', version: '0.1.0' }, capabilities: { experimentalApi: true } }, BUDGETS.startup);
      this.send({ method: 'initialized', params: {} });
    } catch (error) { if (this.process === child) await this.close(); throw error; }
  }
  async info(): Promise<{ authenticated: boolean; models: ModelOption[] }> {
    await this.connect();
    const account = await this.request('account/read', { refreshToken: false }, BUDGETS.auth);
    const models: ModelOption[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 10; page++) {
      const result = await this.request('model/list', { limit: 100, cursor, includeHidden: false }, BUDGETS.catalog);
      for (const model of result.data ?? []) if (!model.hidden) {
        const efforts = Array.isArray(model.supportedReasoningEfforts)
          ? model.supportedReasoningEfforts.filter((effort: any) => typeof effort?.reasoningEffort === 'string' && effort.reasoningEffort.trim()).map((effort: any) => ({ value: String(effort.reasoningEffort), ...(typeof effort.description === 'string' ? { description: effort.description } : {}) }))
          : [];
        models.push({
          id: model.model ?? model.id,
          name: model.displayName ?? model.model ?? model.id,
          description: model.description,
          reasoning: efforts.length
            ? { kind: 'enum', options: efforts, ...(typeof model.defaultReasoningEffort === 'string' && efforts.some((effort: any) => effort.value === model.defaultReasoningEffort) ? { default: model.defaultReasoningEffort } : {}), source: 'codex' }
            : { kind: 'unknown', source: 'codex' },
        });
      }
      cursor = result.nextCursor;
      if (!cursor) break;
    }
    return { authenticated: Boolean(account.account) || account.requiresOpenaiAuth === false, models };
  }
  async apps(threadId?: string, signal?: AbortSignal): Promise<AppInventory> {
    const key = threadId ?? '';
    if (!signal) {
      const existing = this.appInventories.get(key);
      if (existing) return existing;
    }
    const operation = this.readApps(threadId, signal);
    if (!signal) this.appInventories.set(key, operation);
    try { return await operation; }
    finally { if (this.appInventories.get(key) === operation) this.appInventories.delete(key); }
  }
  private async readApps(threadId?: string, signal?: AbortSignal): Promise<AppInventory> {
    await this.connect();
    const apps: AppConnection[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 40; page++) {
      if (signal?.aborted) throw new Error('App inventory was cancelled.');
      let result: any;
      try {
        result = await this.request('mcpServerStatus/list', { cursor, limit: 5, detail: 'toolsAndAuthOnly', ...(threadId ? { threadId } : {}) }, BUDGETS.tool, signal);
      } catch (error) {
        if (signal?.aborted) throw error;
        // Keep what the runtime already returned; the UI can offer a retry.
        if (apps.length) return { apps: apps.sort((a, b) => a.name.localeCompare(b.name)), partial: true, error: redact((error as Error).message), checkedAt: now() };
        throw error;
      }
      for (const server of result.data ?? []) {
        const runtime = server.runtimeStatus;
        const status: AppConnection['status'] = runtime === 'authenticationRequired' || server.authStatus === 'notLoggedIn' ? 'needs-auth' : runtime === 'connected' ? 'connected' : runtime === 'starting' ? 'starting' : runtime === 'disabled' ? 'disabled' : runtime === 'failed' || runtime === 'cancelled' || server.toolsError ? 'unavailable' : 'configured';
        const name = String(server.name ?? 'Unnamed app').slice(0, 200);
        const tools = Object.keys(server.tools ?? {}).slice(0, 1000);
        const resources = Array.isArray(server.resources) ? server.resources.length : undefined;
        const authStatus = typeof server.authStatus === 'string' ? server.authStatus : undefined;
        const serverVersion = typeof server.serverInfo?.version === 'string' ? server.serverInfo.version : undefined;
        apps.push({
          id: `codex:${name}`, providerId: 'codex', source: 'runtime',
          transport: typeof server.httpOrigin === 'string' ? 'http' : 'unknown',
          name, status, toolsCount: tools.length, tools,
          ...(resources === undefined ? {} : { resourcesCount: resources }),
          ...(authStatus ? { authStatus } : {}),
          ...(serverVersion ? { serverVersion } : {}),
          ...(typeof server.toolsError === 'string' && server.toolsError ? { error: server.toolsError.slice(0, 2000) } : {}),
          lastCheckedAt: new Date().toISOString(),
        });
      }
      cursor = result.nextCursor;
      if (!cursor) return { apps: apps.sort((a, b) => a.name.localeCompare(b.name)), partial: false, checkedAt: now() };
    }
    return { apps: apps.sort((a, b) => a.name.localeCompare(b.name)), partial: true, error: 'The configured app inventory exceeded its 200-server limit.', checkedAt: now() };
  }
  async capabilities(serverName: string, threadId?: string, signal?: AbortSignal): Promise<AppCapabilities> {
    await this.connect();
    const result = await this.request('mcpServerStatus/list', { cursor: null, limit: 5, detail: 'full', serverName, ...(threadId ? { threadId } : {}) }, BUDGETS.tool, signal);
    const server = (result.data ?? []).find((item: any) => item.name === serverName);
    if (!server) throw new Error(`The app “${serverName}” is not configured in the Codex runtime.`);
    const toolEntries = Object.entries(server.tools ?? {});
    const tools: AppToolCapability[] | undefined = server.toolsError ? undefined : toolEntries.slice(0, 500).map(([name, raw]) => {
      const tool = (raw ?? {}) as Record<string, any>;
      const capability: AppToolCapability = {
        name,
        ...(typeof tool.title === 'string' ? { title: tool.title.slice(0, 500) } : {}),
        ...(typeof tool.description === 'string' ? { description: tool.description.slice(0, 4000) } : {}),
      };
      if (tool.inputSchema !== undefined) {
        try {
          const serialized = JSON.stringify(tool.inputSchema);
          if (serialized.length <= 50000) capability.inputSchema = tool.inputSchema;
          else capability.inputSchemaTruncated = true;
        } catch { capability.inputSchemaTruncated = true; }
      }
      return capability;
    });
    const resources: AppResourceCapability[] | undefined = server.toolsError ? undefined : (Array.isArray(server.resources) ? server.resources : []).slice(0, 500).map((resource: any) => ({
      uri: String(resource.uri ?? '').slice(0, 4000),
      ...(typeof resource.name === 'string' ? { name: resource.name.slice(0, 500) } : {}),
      ...(typeof resource.title === 'string' ? { title: resource.title.slice(0, 500) } : {}),
      ...(typeof resource.description === 'string' ? { description: resource.description.slice(0, 4000) } : {}),
      ...(typeof resource.mimeType === 'string' ? { mimeType: resource.mimeType.slice(0, 200) } : {}),
    })).filter((resource: AppResourceCapability) => resource.uri);
    return {
      appId: `codex:${serverName}`, supported: true,
      ...(tools ? { tools, ...(toolEntries.length > 500 ? { toolsTruncated: true } : {}) } : {}), ...(resources ? { resources } : {}),
      ...(Array.isArray(server.resourceTemplates) ? { resourceTemplates: server.resourceTemplates.slice(0, 100) } : {}),
      ...(server.serverCapabilities && typeof server.serverCapabilities === 'object' && 'prompts' in server.serverCapabilities ? { promptsSupported: true } : {}),
      ...(server.serverCapabilities !== undefined && server.serverCapabilities !== null ? { serverCapabilities: server.serverCapabilities } : {}),
      ...(server.serverInfo ? { serverInfo: { ...(typeof server.serverInfo.name === 'string' ? { name: server.serverInfo.name } : {}), ...(typeof server.serverInfo.version === 'string' ? { version: server.serverInfo.version } : {}) } } : {}),
      ...(server.toolListMeta !== undefined && server.toolListMeta !== null ? { toolListMeta: server.toolListMeta } : {}),
      partial: Boolean(server.toolsError),
      ...(typeof server.toolsError === 'string' && server.toolsError ? { error: server.toolsError.slice(0, 2000) } : {}),
      checkedAt: now(),
    };
  }

  async login(serverName: string, scopes?: string[], threadId?: string): Promise<AppLoginStart> {
    await this.connect();
    const result = await this.request('mcpServer/oauth/login', {
      name: serverName,
      ...(scopes?.length ? { scopes } : {}),
      ...(threadId ? { threadId } : {}),
    }, BUDGETS.auth);
    const url = typeof result?.authorizationUrl === 'string' ? result.authorizationUrl : typeof result?.authUrl === 'string' ? result.authUrl : undefined;
    if (!url) throw new Error('Codex did not return a sign-in URL.');
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error('Codex returned an invalid sign-in URL.'); }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Codex returned a non-HTTP sign-in URL.');
    const loginId = typeof result.loginId === 'string' ? result.loginId : undefined;
    if (loginId && !this.oauthLogins.has(loginId)) this.oauthLogins.set(loginId, { loginId, status: 'pending', updatedAt: now() });
    return { appId: `codex:${serverName}`, authorizationUrl: url, ...(loginId ? { loginId } : {}), status: 'pending' };
  }

  loginState(loginId: string): AppLoginState | undefined {
    const state = this.oauthLogins.get(loginId);
    return state ? { ...state } : undefined;
  }

  async reload(): Promise<void> {
    await this.connect();
    await this.request('config/mcpServer/reload', null, BUDGETS.tool);
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
      try { threadId = (await this.request('thread/resume', { ...params, threadId: conversation.providerThreadId, excludeTurns: true }, BUDGETS.session)).thread.id; }
      catch (error) {
        if (!/not found|does not exist|unknown thread|no rollout/i.test((error as Error).message)) throw error;
        fresh = true;
        threadId = (await this.request('thread/start', { ...params, serviceName: 'a_gent' }, BUDGETS.session)).thread.id;
      }
    } else threadId = (await this.request('thread/start', { ...params, serviceName: 'a_gent' }, BUDGETS.session)).thread.id;
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
      const cleanup = () => {
        this.events.off('message', onMessage); this.events.off('closed', onClose); signal.removeEventListener('abort', onAbort); if (interruptionDeadline) clearTimeout(interruptionDeadline);
        // A settled interaction must never leave the runtime waiting on a request.
        for (const requestId of pendingInteractionIds) { try { this.send({ id: requestId, error: { code: -32800, message: 'The run ended before the request was answered.' } }); } catch { /* the connection may already be closed */ } }
        pendingInteractionIds.clear();
      };
      const finish = (error?: Error) => { if (settled) return; settled = true; cleanup(); if (error) reject(error); else resolve(); };
      const onClose = (error: Error) => finish(error);
      const interruptKnownTurn = () => {
        if (!turnId || settled || interruptionRequested) return;
        interruptionRequested = true;
        // An RPC acknowledgement only means the request was received. Keep the chat
        // reserved until the matching turn/completed notification or child exit.
        void this.request('turn/interrupt', { threadId, turnId }, BUDGETS.interrupt).catch(() => {});
      };
      const onAbort = () => {
        if (settled) return;
        if (!interruptionDeadline) interruptionDeadline = setTimeout(() => {
          // If Codex cannot confirm interruption, terminate this owned connection;
          // no later turn can inherit events from an unconfirmed running child.
          void this.close().catch(error => finish(error));
        }, BUDGETS.interrupt);
        interruptKnownTurn();
      };
      const pendingInteractionIds = new Set<string | number>();
      const declineRequest = (requestId: string | number, message: string) => {
        pendingInteractionIds.delete(requestId);
        if (settled) return;
        try { this.send({ id: requestId, error: { code: -32800, message } }); } catch { /* the run is already closing */ }
      };
      const handleQuestion = (requestId: string | number, p: any) => {
        const parsed = parseQuestions(p);
        if (!parsed) { declineRequest(requestId, 'The question request was malformed.'); return; }
        pendingApprovalIds.add(requestId);
        pendingInteractionIds.add(requestId);
        callbacks.activity({ id: id(), kind: 'status', title: 'Your agent is asking a question', detail: parsed.questions.map(question => question.question).join('\n'), status: 'running', createdAt: now() });
        const respond: ProviderInteractionRespond = (action, response) => {
          if (!pendingInteractionIds.has(requestId)) return;
          if (action !== 'accept') {
            declineRequest(requestId, action === 'decline' ? 'The user declined to answer.' : 'The question was cancelled.');
            callbacks.activity({ id: id(), kind: 'status', title: action === 'decline' ? 'Question declined' : 'Question cancelled', status: 'failed', createdAt: now() });
            return;
          }
          const result = validateQuestionAnswers(parsed.questions, response);
          pendingInteractionIds.delete(requestId);
          pendingApprovalIds.delete(requestId);
          if (!settled) this.send({ id: requestId, result });
          callbacks.activity({ id: id(), kind: 'status', title: 'Question answered', status: 'completed', createdAt: now() });
        };
        if (signal.aborted) { respond('cancel'); return; }
        callbacks.interaction?.({
          kind: 'question',
          title: parsed.questions.length === 1 ? parsed.questions[0].header : 'Your agent has questions',
          description: parsed.questions.map(question => question.question).join('\n'),
          questions: parsed.questions,
        }, respond);
      };
      const handleElicitation = (requestId: string | number, p: any) => {
        const parsed = parseElicitation(p);
        if (parsed.mode === 'unsupported') {
          callbacks.interaction?.({ kind: 'form', title: 'Unsupported app form', description: parsed.reason });
          callbacks.activity({ id: id(), kind: 'status', title: 'Unsupported app form', detail: parsed.reason, status: 'failed', createdAt: now() });
          if (!settled) this.send({ id: requestId, result: { action: 'decline', content: null, _meta: null } });
          return;
        }
        pendingApprovalIds.add(requestId);
        pendingInteractionIds.add(requestId);
        const serverName = typeof p.serverName === 'string' ? p.serverName : 'an app';
        const message = typeof p.message === 'string' ? p.message : 'An app connection needs additional input.';
        const respond: ProviderInteractionRespond = (action, response) => {
          if (!pendingInteractionIds.has(requestId)) return;
          if (action !== 'accept') {
            pendingInteractionIds.delete(requestId);
            pendingApprovalIds.delete(requestId);
            if (!settled) this.send({ id: requestId, result: { action, content: null, _meta: null } });
            callbacks.activity({ id: id(), kind: 'status', title: action === 'decline' ? 'App request declined' : 'App request cancelled', status: 'failed', createdAt: now() });
            return;
          }
          if (parsed.mode === 'url') {
            pendingInteractionIds.delete(requestId);
            pendingApprovalIds.delete(requestId);
            if (!settled) this.send({ id: requestId, result: { action: 'accept', content: null, _meta: null } });
            callbacks.activity({ id: id(), kind: 'status', title: `Opened ${serverName} sign-in`, status: 'completed', createdAt: now() });
            return;
          }
          const values = validateElicitationValues(parsed.fields, response);
          pendingInteractionIds.delete(requestId);
          pendingApprovalIds.delete(requestId);
          if (!settled) this.send({ id: requestId, result: { action: 'accept', content: values, _meta: null } });
          callbacks.activity({ id: id(), kind: 'status', title: `Submitted input for ${serverName}`, status: 'completed', createdAt: now() });
        };
        if (signal.aborted) { respond('cancel'); return; }
        callbacks.interaction?.(parsed.mode === 'url'
          ? { kind: 'url', title: `Sign in to ${serverName}`, description: message, url: parsed.url }
          : { kind: 'form', title: `Input needed for ${serverName}`, description: message, fields: parsed.fields }, respond);
        callbacks.activity({ id: id(), kind: 'status', title: `Waiting for input for ${serverName}`, status: 'running', createdAt: now() });
      };
      const onMessage = (message: RpcMessage) => {
        const p = message.params ?? {};
        if (p.threadId !== threadId) return;
        const eventTurnId = typeof p.turnId === 'string' ? p.turnId : typeof p.turn?.id === 'string' ? p.turn.id : undefined;
        if (!eventTurnId && message.id !== undefined && message.method === 'mcpServer/elicitation/request') {
          handleElicitation(message.id, p);
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
            handleElicitation(requestId, p);
          } else if (method === 'item/tool/requestUserInput') {
            handleQuestion(requestId, p);
          } else {
            callbacks.interaction?.({ kind: 'form', title: 'Unsupported interactive request', description: method });
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
      if (request.reasoning?.kind === 'enum' && request.reasoning.options.some(option => option.value === agent.reasoningEffort)) turnParams.effort = agent.reasoningEffort;
      void this.request('turn/start', turnParams, BUDGETS.session).then(result => {
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
      const term = setTimeout(() => { if (!terminated) child.kill('SIGTERM'); }, BUDGETS.terminationGrace);
      const kill = setTimeout(() => { if (!terminated) child.kill('SIGKILL'); }, BUDGETS.terminationKill);
      const deadline = setTimeout(() => {
        cleanup();
        this.shutdownError = new Error('Codex did not confirm shutdown. Restart A Gent before reconnecting.');
        reject(this.shutdownError);
      }, BUDGETS.shutdown);
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
