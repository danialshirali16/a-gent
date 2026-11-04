import { spawn, type ChildProcess } from 'node:child_process';
import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ModelOption } from '../shared/types.js';
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

  private async capture(launch: OpenCodeLaunch, args: string[], timeout = 30000): Promise<string> {
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
        else reject(new Error(`OpenCode stopped (exit ${code ?? 'unknown'}). ${stderr.trim().slice(-1000)}`));
      });
    });
  }

  async models(): Promise<ModelOption[]> {
    const output = await this.capture(await this.command(), ['models']);
    return output.split(/\r?\n/).map(line => line.trim()).filter(line => /^[^/\s]+\/\S+$/.test(line)).map(id => ({ id, name: id })).slice(0, 1000);
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
      let stderr = '', buffer = '', bytes = 0, received = false, settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        request.signal.removeEventListener('abort', abort);
        this.children.delete(child);
        if (error) reject(error); else resolve();
      };
      const abort = () => { child.kill('SIGTERM'); setTimeout(() => { if (!settled) child.kill('SIGKILL'); }, 2000).unref(); finish(new Error('Run interrupted.')); };
      const timer = setTimeout(() => { child.kill('SIGKILL'); finish(new Error('OpenCode did not finish within 15 minutes.')); }, 15 * 60 * 1000);
      if (request.signal.aborted) { abort(); return; }
      request.signal.addEventListener('abort', abort, { once: true });
      child.stdout.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 8 * 1024 * 1024) { child.kill('SIGKILL'); finish(new Error('The response exceeded the 8 MB conversation limit.')); return; }
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
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            if (event.type === 'text' && typeof event.part?.text === 'string' && event.part.text) { received = true; request.callbacks.delta(event.part.text); }
          } catch { /* ignore partial line */ }
        }
        if (code === 0 && received) finish();
        else finish(new Error(`OpenCode stopped (exit ${code ?? 'unknown'}). ${stderr.trim().slice(-1000)}`));
      });
    });
  }

  async close(): Promise<void> {
    for (const child of this.children) child.kill('SIGKILL');
    this.children.clear();
  }
}
