import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { AppConnection, ModelOption, ProviderInfo } from '../shared/types.js';
import { CodexBridge, type ProviderRequest } from './codex.js';
import { id, InputError, object, string } from './store.js';

interface HttpConnection { baseUrl: string; modelId?: string; }
function baseUrl(value: unknown): string {
  const valueString = string(value, 'Provider URL', 2000);
  let parsed: URL;
  try { parsed = new URL(valueString); } catch { throw new InputError('Enter a complete http or https provider URL.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) throw new InputError('Use an http or https provider URL without embedded credentials, query, or fragment.');
  return parsed.toString().replace(/\/$/, '');
}
export class ProviderManager {
  readonly codex: CodexBridge;
  private connections: Record<string, HttpConnection> = {
    ollama: { baseUrl: process.env.AGENT_OLLAMA_URL ?? 'http://127.0.0.1:11434' },
    'openai-compatible': { baseUrl: process.env.AGENT_OPENAI_BASE_URL ?? 'https://api.openai.com/v1' },
  };
  private keys = new Map<string, string>();
  providers: ProviderInfo[] = [
    { id: 'codex', kind: 'codex', name: 'Codex', status: 'available', detail: 'Checking the Codex CLI on this computer…', models: [] },
    { id: 'ollama', kind: 'ollama', name: 'Ollama', status: 'available', detail: 'Connect to local models running on your computer.', models: [], baseUrl: 'http://127.0.0.1:11434' },
    { id: 'openai-compatible', kind: 'openai-compatible', name: 'OpenAI compatible', status: 'available', detail: 'Connect your own model endpoint and API key.', models: [], baseUrl: 'https://api.openai.com/v1' },
  ];
  constructor(private directory: string, private onChange: (providers: ProviderInfo[]) => void, codex?: CodexBridge) { this.codex = codex ?? new CodexBridge(); }
  async load(): Promise<void> {
    if (process.env.AGENT_OPENAI_API_KEY) this.keys.set('openai-compatible', process.env.AGENT_OPENAI_API_KEY);
    try {
      const saved = object(JSON.parse(await readFile(join(this.directory, 'connections.json'), 'utf8')));
      for (const providerId of ['ollama', 'openai-compatible']) {
        if (!saved[providerId]) continue;
        const data = object(saved[providerId]);
        this.connections[providerId] = { baseUrl: baseUrl(data.baseUrl), ...(typeof data.modelId === 'string' ? { modelId: data.modelId.slice(0, 200) } : {}) };
      }
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.warn('A Gent could not restore provider endpoints:', (error as Error).message); }
    for (const provider of this.providers) if (this.connections[provider.id]) provider.baseUrl = this.connections[provider.id].baseUrl;
  }
  get(providerId: string): ProviderInfo {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) throw new InputError('Provider not found.', 404);
    return provider;
  }
  async apps(): Promise<AppConnection[]> {
    if (this.get('codex').status === 'unavailable') return [];
    return this.codex.apps();
  }
  async probeCodex(): Promise<ProviderInfo> {
    const provider = this.get('codex');
    try {
      const info = await this.codex.info();
      provider.models = info.models;
      provider.status = info.authenticated ? 'connected' : 'available';
      provider.detail = info.authenticated ? 'Using the Codex sign-in on this computer.' : 'Codex is installed. Run codex login on this computer, then reconnect.';
    } catch (error) { provider.status = 'unavailable'; provider.detail = (error as Error).message; provider.models = []; }
    this.onChange(this.providers);
    return provider;
  }
  async connect(providerId: string, input: unknown): Promise<ProviderInfo> {
    if (providerId === 'codex') return this.probeCodex();
    const provider = this.get(providerId), data = object(input);
    const connection = this.connections[providerId];
    if ('baseUrl' in data) connection.baseUrl = baseUrl(data.baseUrl);
    if ('apiKey' in data) {
      const key = string(data.apiKey, 'API key', 10000, true);
      if (key) this.keys.set(providerId, key); else this.keys.delete(providerId);
    }
    if ('modelId' in data) connection.modelId = string(data.modelId, 'Model ID', 200, true);
    provider.baseUrl = connection.baseUrl;
    try {
      const response = await fetch(`${connection.baseUrl}${providerId === 'ollama' ? '/api/tags' : '/models'}`, { headers: this.headers(providerId), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`The provider returned HTTP ${response.status}. Check its URL and API key.`);
      const body = await response.json() as { data?: Array<{ id: string }>; models?: Array<{ name: string; model?: string }> };
      const models: ModelOption[] = providerId === 'ollama' ? (body.models ?? []).map(model => ({ id: model.model ?? model.name, name: model.name })) : (body.data ?? []).map(model => ({ id: model.id, name: model.id }));
      if (connection.modelId && !models.some(model => model.id === connection.modelId)) models.unshift({ id: connection.modelId, name: connection.modelId });
      provider.models = models.slice(0, 1000);
      provider.status = 'connected';
      provider.detail = models.length ? `${models.length} model${models.length === 1 ? '' : 's'} available.` : 'Connected. Add a model to this provider before sending a message.';
    } catch (error) {
      provider.status = 'error'; provider.detail = (error as Error).message;
      provider.models = connection.modelId ? [{ id: connection.modelId, name: connection.modelId }] : [];
    }
    const temporary = join(this.directory, `.connections-${id()}.tmp`);
    await writeFile(temporary, JSON.stringify(this.connections), { mode: 0o600 });
    await rename(temporary, join(this.directory, 'connections.json'));
    this.onChange(this.providers);
    return provider;
  }
  private headers(providerId: string): Record<string, string> {
    const key = this.keys.get(providerId);
    return { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) };
  }
  async run(providerId: string, request: ProviderRequest): Promise<void> {
    if (providerId === 'codex') return this.codex.run(request);
    this.get(providerId);
    const connection = this.connections[providerId];
    const model = request.modelId || connection.modelId || this.get(providerId).models[0]?.id;
    if (!model) throw new Error('Choose a model in Connections before sending a message.');
    const history = request.conversation.messages.filter(message => message.role !== 'system' && message.status !== 'streaming').map(message => ({ role: message.role, content: message.content + (message.attachments?.length ? '\n\n' + message.attachments.map(a => `Attached file: ${a.name}\n${a.content}`).join('\n\n') : '') }));
    const messages = [{ role: 'system', content: `${request.agent.instructions}\n\nYou are responding inside A Gent. This connection provides conversation only: do not claim to have executed commands, read local files, or used connected apps.` }, ...history];
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(15 * 60 * 1000)]);
    const response = await fetch(`${connection.baseUrl}${providerId === 'ollama' ? '/api/chat' : '/chat/completions'}`, { method: 'POST', headers: this.headers(providerId), body: JSON.stringify({ model, messages, stream: true }), signal });
    if (!response.ok) {
      const description = (await response.text()).slice(0, 600);
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
        if (bytes > 8 * 1024 * 1024) throw new Error('The response exceeded the 8 MB conversation limit.');
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
        for (const line of lines) consume(line);
      }
      buffer += decoder.decode(); if (buffer.trim()) consume(buffer);
      if (!received) throw new Error('The model endpoint returned no text. Check its model ID and streaming compatibility.');
    } finally { reader.releaseLock(); }
  }
  async close(): Promise<void> { await this.codex.close(); this.keys.clear(); }
}
