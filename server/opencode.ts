import { spawn, type ChildProcess } from 'node:child_process';
import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { normalizeModels } from '../shared/providers.js';
import type { AppConnection, AppInventory, ModelOption } from '../shared/types.js';
import { BUDGETS } from './budgets.js';
import { redact } from './diagnostics.js';
import type { ProviderRequest } from './codex.js';

export interface OpenCodeLaunch { command: string; args?: string[]; }

async function executable(filename: string): Promise<boolean> {
  try { await access(filename, constants.X_OK); return (await stat(filename)).isFile(); } catch { return false; }
}

export async function locateOpenCode(env: NodeJS.ProcessEnv = process.env): Promise<OpenCodeLaunch> {
  let args: string[] = [];
  if (env.AGENT_OPENCODE_ARGS) {
    const parsed: unknown = JSON.parse(env.AGENT_OPENCODE_ARGS);
    if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) throw new Error('AGENT_OPENCODE_ARGS must be a JSON string array.');
    args = parsed;
  }
  if (env.AGENT_OPENCODE_COMMAND) return { command: env.AGENT_OPENCODE_COMMAND, args };
  const directories = [...(env.PATH ?? '').split(':'), join(homedir(), '.opencode', 'bin'), '/opt/homebrew/bin', '/usr/local/bin'].filter(Boolean);
  for (const directory of [...new Set(directories)]) {
    const candidate = join(directory, 'opencode');
    if (await executable(candidate)) return { command: candidate };
  }
  throw new Error('OpenCode CLI was not found. Install OpenCode, sign in there, then reconnect. Set AGENT_OPENCODE_COMMAND to a custom path if needed.');
}

export class OpenCodeBridge {
  private children = new Set<ChildProcess>();
  constructor(private launch?: OpenCodeLaunch) {}

  private async command(): Promise<OpenCodeLaunch> {
    this.launch ??= await locateOpenCode();
    return this.launch;
  }

  private async capture(launch: OpenCodeLaunch, args: string[], timeout = BUDGETS.catalog): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(launch.command, [...(launch.args ?? []), ...args], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, OPENCODE_DISABLE_AUTOUPDATE: '1' } });
      let stdout = '', stderr = '', bytes = 0;
      const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('OpenCode did not respond in time.')); }, timeout);
      child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes <= 4 * 1024 * 1024) stdout += chunk; });
      child.stderr.on('data', chunk => { if (stderr.length < 4000) stderr += chunk; });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('close', code => {
        clearTimeout(timer);
        if (code === 0) resolve(stdout);
        else reject(new Error(redact(`OpenCode stopped (exit ${code ?? 'unknown'}). ${stderr.trim().slice(-1000)}`)));
      });
    });
  }

  async models(): Promise<ModelOption[]> {
    const output = await this.capture(await this.command(), ['models']);
    return normalizeModels(output.split(/\r?\n/).map(line => line.trim()).filter(line => /^[^/\s]+\/\S+$/.test(line)).map(id => ({ id, name: id })), 1000);
  }

  async apps(signal?: AbortSignal): Promise<AppInventory> {
    if (signal?.aborted) throw new Error('App inventory was cancelled.');
    const output = await this.capture(await this.command(), ['mcp', 'list']);
    if (signal?.aborted) throw new Error('App inventory was cancelled.');
    const apps: AppConnection[] = [];
    for (const rawLine of output.split(/\r?\n/)) {
      const line = rawLine.replace(/\x1b\[[0-9;]*m/g, '').trim();
      if (!line || /^(no mcp|mcp servers?)\b/i.test(line)) continue;
      const match = line.match(/^[^\w]*([^\s]+)\s+(.+)$/);
      if (!match) continue;
      const state = match[2].toLowerCase();
      const status: AppConnection['status'] = /connect/.test(state) ? 'connected' : /auth|login|sign.?in/.test(state) ? 'needs-auth' : /disabl/.test(state) ? 'disabled' : /fail|error/.test(state) ? 'unavailable' : 'configured';
      apps.push({ id: `opencode:${match[1]}`, providerId: 'opencode', source: 'runtime', transport: 'unknown', name: match[1], status, lastCheckedAt: new Date().toISOString() });
    }
    return { apps: apps.sort((left, right) => left.name.localeCompare(right.name)), partial: false, checkedAt: new Date().toISOString() };
  }

  async run(request: ProviderRequest): Promise<void> {
    const launch = await this.command();
    const latest = [...request.conversation.messages].reverse().find(message => message.role === 'user');
    const history = request.conversation.messages.filter(message => message.role !== 'system' && message.status !== 'streaming').map(message => `${message.role}: ${message.content}${message.attachments?.length ? `\n${message.attachments.map(file => `Attached file: ${file.name}\n${file.content}`).join('\n\n')}` : ''}`).join('\n\n');
    const prompt = request.conversation.providerThreadId ? latest?.content ?? '' : `${request.agent.instructions}\n\n${history}`;
    if (!prompt.trim()) throw new Error('Write a message before sending it to OpenCode.');
    const args = ['run', '--format', 'json', '--auto'];
    if (request.modelId) args.push('--model', request.modelId);
    if (request.conversation.providerThreadId) args.push('--session', request.conversation.providerThreadId);
    else if (request.conversation.title) args.push('--title', request.conversation.title);
    args.push(prompt);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(launch.command, [...(launch.args ?? []), ...args], { cwd: request.workspace, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, OPENCODE_DISABLE_AUTOUPDATE: '1' } });
      this.children.add(child);
      let stderr = '', buffer = '', bytes = 0, received = false, settled = false, terminating = false;
      const terminationTimers: ReturnType<typeof setTimeout>[] = [];
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        for (const timer of terminationTimers) clearTimeout(timer);
        request.signal.removeEventListener('abort', abort);
        this.children.delete(child);
        if (error) reject(error); else resolve();
      };
      const terminate = () => {
        if (settled || terminating) return;
        terminating = true;
        child.kill('SIGTERM');
        terminationTimers.push(setTimeout(() => { if (!settled) child.kill('SIGKILL'); }, BUDGETS.terminationGrace));
        terminationTimers.push(setTimeout(() => { if (!settled) finish(new Error('OpenCode did not confirm shutdown.')); }, BUDGETS.shutdown));
      };
      const abort = () => { terminate(); };
      const timer = setTimeout(() => { child.kill('SIGKILL'); finish(new Error('OpenCode did not finish within the stream budget.')); }, BUDGETS.stream);
      request.signal.addEventListener('abort', abort, { once: true });
      child.stdout.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > BUDGETS.maxResponseBytes) { child.kill('SIGKILL'); finish(new Error('The response exceeded the 8 MB conversation limit.')); return; }
        buffer += chunk.toString();
        const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: any;
          try { event = JSON.parse(line); } catch { continue; }
          if (event.sessionID) request.callbacks.thread(String(event.sessionID));
          if (event.type === 'text' && typeof event.part?.text === 'string' && event.part.text) { received = true; request.callbacks.delta(event.part.text); }
          if (event.type === 'tool_use') {
            const part = event.part ?? {};
            request.callbacks.activity({ id: String(part.id ?? `opencode-tool-${Date.now()}`), kind: 'tool', title: String(part.tool ?? part.title ?? 'OpenCode tool'), detail: typeof part.input === 'string' ? part.input : undefined, status: part.status === 'error' ? 'failed' : part.status === 'completed' ? 'completed' : 'running', createdAt: new Date().toISOString() });
          }
          if (event.type === 'error') finish(new Error(typeof event.error === 'string' ? event.error : event.error?.message ?? 'OpenCode reported an error.'));
        }
      });
      child.stderr.on('data', chunk => { if (stderr.length < 4000) stderr += chunk; });
      child.once('error', error => finish(error));
      child.once('close', code => {
        if (settled) return;
        if (terminating) { finish(new Error('Run interrupted.')); return; }
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            if (event.type === 'text' && typeof event.part?.text === 'string' && event.part.text) { received = true; request.callbacks.delta(event.part.text); }
          } catch { /* ignore partial line */ }
        }
        if (code === 0 && received) finish();
        else finish(new Error(redact(`OpenCode stopped (exit ${code ?? 'unknown'}). ${stderr.trim().slice(-1000)}`)));
      });
      if (request.signal.aborted) abort();
    });
  }

  async close(): Promise<void> {
    const children = [...this.children];
    const errors: Error[] = [];
    await Promise.all(children.map(child => new Promise<void>(resolve => {
      if (child.exitCode !== null || child.signalCode !== null) { resolve(); return; }
      let settled = false;
      const timers: ReturnType<typeof setTimeout>[] = [];
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        for (const timer of timers) clearTimeout(timer);
        if (error) errors.push(error);
        resolve();
      };
      child.once('close', () => finish());
      child.kill('SIGTERM');
      timers.push(setTimeout(() => { if (!settled) child.kill('SIGKILL'); }, BUDGETS.terminationGrace));
      timers.push(setTimeout(() => { if (!settled) finish(new Error('OpenCode did not confirm shutdown.')); }, BUDGETS.shutdown));
    })));
    this.children.clear();
    if (errors.length) throw errors[0];
  }
}
