import { readFile, writeFile, rename } from 'node:fs/promises';
import { isIP } from 'node:net';
import { join } from 'node:path';
import type { Agent, AppCapabilities, AppConnection, AppInventory, AppLoginStart, AppLoginState, Conversation, ProviderInfo } from '../shared/types.js';
import { isProviderReady, MODEL_ID_LIMIT, MODEL_LIMIT, normalizeModels, providerCapabilities } from '../shared/providers.js';
import { BUDGETS, budgetSignal, combineBudget } from './budgets.js';
import { redact } from './diagnostics.js';
import { CodexBridge, type ProviderRequest } from './codex.js';
import { OpenCodeBridge } from './opencode.js';
import { createSecretStore, type SecretStore } from './secrets.js';
import { id, InputError, now, object, string } from './store.js';

interface HttpConnection { baseUrl: string; modelId?: string; }

function privateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  if (isIP(host) === 4) {
    const [a, b] = host.split('.').map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (isIP(host) === 6) return host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb');
  return false;
}

export function validateProviderUrl(value: unknown, options: { allowLocal?: boolean; allowInsecure?: boolean } = {}): string {
  const valueString = string(value, 'Provider URL', 2000);
  let parsed: URL;
  try { parsed = new URL(valueString); } catch { throw new InputError('Enter a complete http or https provider URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new InputError('Use an http or https provider URL without embedded credentials, query, or fragment.');
  const hostname = parsed.hostname.toLowerCase();
  if (['metadata.google.internal', 'metadata', 'instance-data'].includes(hostname)) throw new InputError('This provider host is not allowed.');
  const local = privateHost(hostname);
  if (local && !options.allowLocal) throw new InputError('Use a public HTTPS endpoint. Local endpoints are allowed only for local Ollama.');
  if (parsed.protocol === 'http:' && !local && !options.allowInsecure) throw new InputError('Remote model endpoints must use HTTPS.');
  return parsed.toString().replace(/\/$/, '');
}

function errorKind(message: string): ProviderInfo['errorKind'] {
  if (/\b(401|403)\b|unauthor|forbidden|sign.?in|login|auth/i.test(message)) return 'auth';
  if (/network|fetch|econn|timeout|timed out|unreachable|refused/i.test(message)) return 'network';
  if (/catalog|model|404|not found/i.test(message)) return 'model';
  if (/provider returned|http \d|server/i.test(message)) return 'catalog';
  return 'runtime';
}

function baseUrl(value: unknown, providerId: string): string {
  return validateProviderUrl(value, {
    allowLocal: providerId === 'ollama' || process.env.AGENT_ALLOW_LOCAL_PROVIDER_ENDPOINTS === '1',
    allowInsecure: process.env.AGENT_ALLOW_INSECURE_PROVIDER_HTTP === '1',
  });
}
export class ProviderManager {
  readonly codex: CodexBridge;
  readonly opencode: OpenCodeBridge;
  private connections: Record<string, HttpConnection> = {
    ollama: { baseUrl: process.env.AGENT_OLLAMA_URL ?? 'http://127.0.0.1:11434' },
    'openai-compatible': { baseUrl: process.env.AGENT_OPENAI_BASE_URL ?? 'https://api.openai.com/v1' },
    cloud: { baseUrl: process.env.AGENT_CLOUD_BASE_URL ?? '' },
    antigravity: { baseUrl: process.env.AGENT_ANTIGRAVITY_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai' },
  };
  private keys = new Map<string, string>();
  private secrets: SecretStore;
  private probeVersions = new Map<string, number>();
  providers: ProviderInfo[] = ([
    { id: 'codex', kind: 'codex', name: 'Codex', status: 'available', detail: 'Checking the Codex CLI on this computer…', models: [] },
    { id: 'opencode', kind: 'opencode', name: 'OpenCode', status: 'available', detail: 'Use the OpenCode CLI and its local sign-in.', models: [] },
    { id: 'antigravity', kind: 'openai-compatible', name: 'Antigravity', status: 'available', detail: 'Google Gemini / Antigravity endpoint. Add an API key.', models: [], baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
    { id: 'cloud', kind: 'openai-compatible', name: 'Cloud', status: 'available', detail: 'Connect a hosted OpenAI-compatible cloud endpoint.', models: [], baseUrl: '' },
    { id: 'ollama', kind: 'ollama', name: 'Ollama', status: 'available', detail: 'Connect to local models running on your computer.', models: [], baseUrl: 'http://127.0.0.1:11434' },
    { id: 'openai-compatible', kind: 'openai-compatible', name: 'OpenAI compatible', status: 'available', detail: 'Connect your own model endpoint and API key.', models: [], baseUrl: 'https://api.openai.com/v1' },
  ] as ProviderInfo[]).map(provider => ({ ...provider, readiness: provider.id === 'cloud' ? 'unconfigured' : 'configured', capabilities: providerCapabilities(provider.kind) }));
  constructor(private directory: string, private onChange: (providers: ProviderInfo[]) => void, codex?: CodexBridge, opencode?: OpenCodeBridge, secrets?: SecretStore) {
    this.codex = codex ?? new CodexBridge();
    this.opencode = opencode ?? new OpenCodeBridge();
    this.secrets = secrets ?? createSecretStore(directory);
  }
  private startProbe(providerId: string): number {
    const version = (this.probeVersions.get(providerId) ?? 0) + 1;
    this.probeVersions.set(providerId, version);
    return version;
  }

  private currentProbe(providerId: string, version: number): boolean {
    return this.probeVersions.get(providerId) === version;
  }

  async load(): Promise<void> {
    if (process.env.AGENT_OPENAI_API_KEY) this.keys.set('openai-compatible', process.env.AGENT_OPENAI_API_KEY);
    if (process.env.AGENT_CLOUD_API_KEY) this.keys.set('cloud', process.env.AGENT_CLOUD_API_KEY);
    if (process.env.AGENT_ANTIGRAVITY_API_KEY) this.keys.set('antigravity', process.env.AGENT_ANTIGRAVITY_API_KEY);
    try {
      const saved = object(JSON.parse(await readFile(join(this.directory, 'connections.json'), 'utf8')));
      for (const providerId of Object.keys(this.connections)) {
        if (!saved[providerId]) continue;
        const data = object(saved[providerId]);
        const savedBase = typeof data.baseUrl === 'string' ? data.baseUrl : '';
        if (savedBase) this.connections[providerId] = { baseUrl: baseUrl(savedBase, providerId), ...(typeof data.modelId === 'string' ? { modelId: data.modelId.slice(0, MODEL_ID_LIMIT) } : {}) };
        else if (providerId === 'cloud') this.connections[providerId] = { ...this.connections[providerId], ...(typeof data.modelId === 'string' ? { modelId: data.modelId.slice(0, MODEL_ID_LIMIT) } : {}) };
      }
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn('A Gent could not restore provider endpoints:', (error as Error).message); }
    for (const provider of this.providers) {
      if (provider.id === 'codex' || provider.id === 'opencode') continue;
      provider.credentialMode = this.secrets.kind === 'keychain' ? 'keychain' : 'session';
      if (!this.keys.has(provider.id)) {
        try {
          const key = await this.secrets.get('api-key', { kind: 'provider', id: provider.id });
          if (key) this.keys.set(provider.id, key);
        } catch (error) {
          provider.detail = redact((error as Error).message, 1000);
        }
      }
      provider.hasStoredKey = this.keys.has(provider.id);
    }
    for (const provider of this.providers) if (this.connections[provider.id]) {
      provider.baseUrl = this.connections[provider.id].baseUrl;
      provider.modelId = this.connections[provider.id].modelId;
    }
  }
  get(providerId: string): ProviderInfo {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) throw new InputError('Provider not found.', 404);
    return provider;
  }
  async apps(threadId?: string, signal?: AbortSignal): Promise<AppInventory> {
    const apps: AppConnection[] = [], errors: string[] = [];
    let partial = false;
    if (this.get('codex').status !== 'unavailable') {
      try {
        const inventory = await this.codex.apps(threadId, signal);
        apps.push(...inventory.apps); partial ||= inventory.partial; if (inventory.error) errors.push(`Codex: ${inventory.error}`);
      } catch (error) {
        if (signal?.aborted) throw error;
        partial = true; errors.push(`Codex: ${(error as Error).message}`);
      }
    }
    if (isProviderReady(this.get('opencode'))) {
      try {
        const inventory = await this.opencode.apps(signal);
        apps.push(...inventory.apps); partial ||= inventory.partial; if (inventory.error) errors.push(`OpenCode: ${inventory.error}`);
      } catch (error) {
        if (signal?.aborted) throw error;
        partial = true; errors.push(`OpenCode: ${(error as Error).message}`);
      }
    }
    return {
      apps: apps.sort((left, right) => left.name.localeCompare(right.name)),
      partial,
      ...(errors.length ? { error: redact(errors.join(' ')) } : {}),
      checkedAt: now(),
    };
  }
  async probeCodex(): Promise<ProviderInfo> {
    const provider = this.get('codex');
    const version = this.startProbe('codex');
    provider.readiness = 'checking'; provider.status = 'available'; this.onChange(this.providers);
    try {
      const info = await this.codex.info();
      if (!this.currentProbe('codex', version)) return provider;
      provider.models = normalizeModels(info.models, MODEL_LIMIT);
      provider.status = info.authenticated ? 'connected' : 'available';
      provider.readiness = info.authenticated ? 'ready' : 'needs-auth';
      provider.verifiedBy = 'catalog';
      provider.lastCheckedAt = now(); provider.errorKind = undefined;
      provider.detail = info.authenticated ? 'Using the Codex sign-in on this computer.' : 'Codex is installed. Run codex login on this computer, then reconnect.';
    } catch (error) {
      if (!this.currentProbe('codex', version)) return provider;
      provider.status = 'unavailable'; provider.readiness = 'error'; provider.detail = redact((error as Error).message, 1000); provider.models = [];
      provider.lastCheckedAt = now(); provider.errorKind = errorKind(provider.detail);
    }
    this.onChange(this.providers);
    return provider;
  }
  async probeOpenCode(): Promise<ProviderInfo> {
    const provider = this.get('opencode');
    const version = this.startProbe('opencode');
    provider.readiness = 'checking'; provider.status = 'available'; this.onChange(this.providers);
    try {
      const models = normalizeModels(await this.opencode.models(), MODEL_LIMIT);
      if (!this.currentProbe('opencode', version)) return provider;
      provider.models = models;
      provider.status = provider.models.length ? 'connected' : 'available';
      provider.readiness = provider.models.length ? 'ready' : 'needs-auth';
      provider.verifiedBy = 'catalog';
      provider.lastCheckedAt = now(); provider.errorKind = undefined;
      provider.detail = provider.models.length ? 'Models found. Run a test message to verify inference access.' : 'OpenCode is installed. Sign in there, then reconnect.';
    } catch (error) {
      if (!this.currentProbe('opencode', version)) return provider;
      provider.status = 'unavailable'; provider.readiness = 'error'; provider.detail = redact((error as Error).message, 1000); provider.models = [];
      provider.lastCheckedAt = now(); provider.errorKind = errorKind(provider.detail);
    }
    this.onChange(this.providers);
    return provider;
  }
  async connect(providerId: string, input: unknown): Promise<ProviderInfo> {
    if (providerId === 'codex') return this.probeCodex();
    if (providerId === 'opencode') return this.probeOpenCode();
    const provider = this.get(providerId), data = object(input);
    const version = this.startProbe(providerId);
    const connection = this.connections[providerId];
    if ('baseUrl' in data) connection.baseUrl = baseUrl(data.baseUrl, providerId);
    if ('apiKey' in data) {
      const key = string(data.apiKey, 'API key', 10000, true);
      try {
        if (key) await this.secrets.set({ id: 'api-key', owner: { kind: 'provider', id: providerId }, secret: key });
        else await this.secrets.delete('api-key', { kind: 'provider', id: providerId });
      } catch (error) {
        throw new InputError(redact((error as Error).message, 1000), 409);
      }
      if (key) this.keys.set(providerId, key); else this.keys.delete(providerId);
      provider.hasStoredKey = Boolean(key);
      provider.credentialMode = this.secrets.kind === 'keychain' ? 'keychain' : 'session';
    }
    if ('modelId' in data) connection.modelId = string(data.modelId, 'Model ID', MODEL_ID_LIMIT, true);
    provider.baseUrl = connection.baseUrl;
    provider.modelId = connection.modelId;
    provider.readiness = 'checking'; provider.status = 'available'; this.onChange(this.providers);
    try {
      const response = await fetch(`${connection.baseUrl}${providerId === 'ollama' ? '/api/tags' : '/models'}`, { headers: this.headers(providerId), signal: budgetSignal('catalog'), redirect: 'error' });
      if (!response.ok) throw new Error(`The provider returned HTTP ${response.status}. Check its URL and API key.`);
      const body = await response.json() as { data?: Array<{ id?: unknown; name?: unknown }>; models?: Array<{ name?: unknown; model?: unknown }> };
      const raw = providerId === 'ollama'
        ? (body.models ?? []).map(model => ({ id: model.model ?? model.name, name: model.name }))
        : (body.data ?? []).map(model => ({ id: model.id, name: model.id }));
      const models = normalizeModels(raw, MODEL_LIMIT);
      if (!this.currentProbe(providerId, version)) return provider;
      if (connection.modelId && !models.some(model => model.id === connection.modelId)) models.unshift({ id: connection.modelId, name: connection.modelId });
      provider.models = models.slice(0, MODEL_LIMIT);
      provider.status = 'connected';
      provider.readiness = models.length ? 'ready' : 'degraded';
      provider.verifiedBy = 'catalog';
      provider.lastCheckedAt = now(); provider.errorKind = undefined;
      provider.detail = models.length ? `${models.length} model${models.length === 1 ? '' : 's'} available. Run a test message to verify inference access.` : 'Connected, but no model was found. Add a model before sending a message.';
    } catch (error) {
      if (!this.currentProbe(providerId, version)) return provider;
      provider.status = 'error'; provider.readiness = 'error'; provider.detail = redact((error as Error).message, 1000);
      provider.lastCheckedAt = now(); provider.errorKind = errorKind(provider.detail);
      provider.models = connection.modelId ? [{ id: connection.modelId, name: connection.modelId }] : [];
    }
    const temporary = join(this.directory, `.connections-${id()}.tmp`);
    await writeFile(temporary, JSON.stringify(this.connections), { mode: 0o600 });
    await rename(temporary, join(this.directory, 'connections.json'));
    this.onChange(this.providers);
    return provider;
  }
  async test(providerId: string, input: unknown): Promise<{ ok: boolean; provider: ProviderInfo; response?: string; error?: string; latencyMs: number; network: true; mayCost: true }> {
    const provider = this.get(providerId), data = object(input);
    if (data.confirm !== true) throw new InputError('Confirm the live test: it sends a model request and may use account credits.', 400);
    const modelId = string(data.modelId ?? '', 'Model ID', MODEL_ID_LIMIT, true);
    if (provider.status === 'unavailable') throw new InputError(provider.detail, 409);
    const started = Date.now();
    let response = '';
    const timestamp = now();
    const agent: Agent = {
      id: 'provider-test', name: 'Provider test', description: '', instructions: 'Reply with exactly OK. Do not use tools.',
      color: '#f39161', icon: 'spark', providerId, modelId, reasoningEffort: '', createdAt: timestamp,
    };
    const conversation: Conversation = {
      id: 'provider-test', agentId: agent.id, title: 'Provider test', createdAt: timestamp, updatedAt: timestamp,
      messages: [{ id: 'test-message', role: 'user', content: 'Reply with exactly OK. Do not use tools.', createdAt: timestamp }],
    };
    try {
      await this.run(providerId, {
        agent, conversation, modelId,
        reasoning: provider.models.find(model => model.id === modelId)?.reasoning,
        mode: 'chat', workspace: this.directory, signal: AbortSignal.timeout(BUDGETS.tool),
        callbacks: { delta: delta => { response += delta; }, activity: () => {}, approval: (_details, respond) => respond(false), thread: () => {}, interaction: () => {} },
      });
    } catch (error) {
      provider.readiness = 'error'; provider.verifiedBy = undefined; provider.detail = redact((error as Error).message, 1000);
      provider.lastCheckedAt = now(); provider.errorKind = errorKind(provider.detail);
      this.onChange(this.providers);
      return { ok: false, provider, error: provider.detail, latencyMs: Date.now() - started, network: true, mayCost: true };
    }
    if (!response.trim()) {
      provider.readiness = 'error'; provider.verifiedBy = undefined; provider.detail = 'The test completed without a text response.';
      this.onChange(this.providers);
      return { ok: false, provider, error: provider.detail, latencyMs: Date.now() - started, network: true, mayCost: true };
    }
    provider.status = 'connected'; provider.readiness = 'ready'; provider.verifiedBy = 'inference';
    provider.lastCheckedAt = now(); provider.errorKind = undefined;
    provider.detail = `Inference verified for ${modelId || 'the provider default model'}.`;
    this.onChange(this.providers);
    return { ok: true, provider, response: response.slice(0, 500), latencyMs: Date.now() - started, network: true, mayCost: true };
  }

  async disconnect(providerId: string): Promise<ProviderInfo> {
    const provider = this.get(providerId);
    if (providerId === 'codex' || providerId === 'opencode') {
      provider.status = 'available'; provider.readiness = 'configured'; provider.models = [];
      provider.detail = providerId === 'codex' ? 'Codex sign-in is external. Check the connection to reconnect.' : 'OpenCode sign-in is external. Check the connection to reconnect.';
    } else {
      try { await this.secrets.delete('api-key', { kind: 'provider', id: providerId }); }
      catch (error) { throw new InputError(redact((error as Error).message, 1000), 409); }
      this.keys.delete(providerId);
      provider.hasStoredKey = false;
      provider.models = [];
      provider.status = 'available';
      provider.readiness = this.connections[providerId]?.baseUrl ? 'configured' : 'unconfigured';
      provider.detail = 'Disconnected. Add a credential and connect again.';
    }
    provider.lastCheckedAt = now(); provider.errorKind = undefined;
    this.onChange(this.providers);
    return provider;
  }

  private headers(providerId: string): Record<string, string> {
    const key = this.keys.get(providerId);
    return { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) };
  }
  async appCapabilities(appId: string, threadId?: string, signal?: AbortSignal): Promise<AppCapabilities> {
    const separator = appId.indexOf(':');
    if (separator <= 0 || separator === appId.length - 1) throw new InputError('Use a provider-qualified app ID.', 400);
    const providerId = appId.slice(0, separator), name = appId.slice(separator + 1);
    if (providerId === 'codex') {
      if (this.get('codex').status === 'unavailable') throw new InputError('Connect Codex before inspecting this app.', 409);
      try { return await this.codex.capabilities(name, threadId, signal); }
      catch (error) {
        if (signal?.aborted) throw error;
        if (/not configured/.test((error as Error).message)) throw new InputError('App not found.', 404);
        throw error;
      }
    }
    if (providerId === 'opencode') {
      const inventory = await this.opencode.apps(signal);
      if (!inventory.apps.some(app => app.id === appId)) throw new InputError('App not found.', 404);
      return {
        appId, supported: false, partial: false,
        error: 'OpenCode does not expose MCP tool or resource detail through its supported CLI. Use OpenCode to inspect this server.',
        checkedAt: now(),
      };
    }
    throw new InputError('Unknown app provider.', 404);
  }

  async appLogin(appId: string, scopes?: string[], threadId?: string): Promise<AppLoginStart> {
    const separator = appId.indexOf(':');
    if (separator <= 0 || separator === appId.length - 1) throw new InputError('Use a provider-qualified app ID.', 400);
    const providerId = appId.slice(0, separator), name = appId.slice(separator + 1);
    if (providerId === 'codex') {
      if (this.get('codex').status === 'unavailable') throw new InputError('Connect Codex before signing in to this app.', 409);
      return this.codex.login(name, scopes, threadId);
    }
    if (providerId === 'opencode') {
      throw new InputError(`Complete this sign-in with “opencode mcp auth ${name}” on the host. A Gent does not copy OpenCode tokens.`, 409);
    }
    throw new InputError('Unknown app provider.', 404);
  }

  appLoginState(loginId: string): AppLoginState | undefined {
    return this.codex.loginState(loginId);
  }

  async reloadApps(): Promise<void> {
    if (this.get('codex').status === 'unavailable') throw new InputError('Connect Codex before reloading app configuration.', 409);
    await this.codex.reload();
  }

  async run(providerId: string, request: ProviderRequest): Promise<void> {
    if (providerId === 'codex') return this.codex.run(request);
    if (providerId === 'opencode') return this.opencode.run(request);
    this.get(providerId);
    const connection = this.connections[providerId];
    const model = request.modelId || connection.modelId || this.get(providerId).models[0]?.id;
    if (!model) throw new Error('Choose a model in Connections before sending a message.');
    const history = request.conversation.messages.filter(message => message.role !== 'system' && message.status !== 'streaming').map(message => ({ role: message.role, content: message.content + (message.attachments?.length ? '\n\n' + message.attachments.map(a => `Attached file: ${a.name}\n${a.content}`).join('\n\n') : '') }));
    const messages = [{ role: 'system', content: `${request.agent.instructions}\n\nYou are responding inside A Gent. This connection provides conversation only: do not claim to have executed commands, read local files, or used connected apps.` }, ...history];
    const signal = combineBudget('stream', request.signal);
    const response = await fetch(`${connection.baseUrl}${providerId === 'ollama' ? '/api/chat' : '/chat/completions'}`, { method: 'POST', headers: this.headers(providerId), body: JSON.stringify({ model, messages, stream: true }), signal, redirect: 'error' });
    if (!response.ok) {
      const description = redact(await response.text(), 600);
      throw new Error(`Model request failed (HTTP ${response.status}). ${description}`);
    }
    if (!response.body) throw new Error('The model endpoint did not return a response stream.');
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = '', received = false, bytes = 0;
    const consume = (line: string) => {
      const payload = providerId === 'ollama' ? line : line.startsWith('data:') ? line.slice(5).trimStart() : '';
      if (!payload || payload === '[DONE]') return;
      let item: any;
      try { item = JSON.parse(payload); } catch { return; }
      if (item.error) throw new Error(typeof item.error === 'string' ? item.error : item.error.message ?? 'The provider reported an error.');
      const delta = providerId === 'ollama' ? item.message?.content : item.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) { received = true; request.callbacks.delta(delta); }
    };
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > BUDGETS.maxResponseBytes) throw new Error('The response exceeded the 8 MB conversation limit.');
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
        for (const line of lines) consume(line);
      }
      buffer += decoder.decode(); if (buffer.trim()) consume(buffer);
      if (!received) throw new Error('The model endpoint returned no text. Check its model ID and streaming compatibility.');
    } finally { reader.releaseLock(); }
  }
  async close(): Promise<void> { await this.codex.close(); await this.opencode.close(); this.keys.clear(); await this.secrets.close(); }
}
