import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { Activity, Agent, Conversation, Group, Schedule, Settings, WorkspaceState } from '../shared/types.js';
import { acquireDataLock, type DataLock } from './lock.js';

export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Expected a JSON object.');
  return value as Record<string, unknown>;
}
export function string(value: unknown, label: string, max = 200, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim())) {
    throw new InputError(`${label} must be ${allowEmpty ? 'a string' : 'a nonempty string'} of at most ${max} characters.`);
  }
  return value;
}
export function bool(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new InputError(`${label} must be true or false.`);
  return value;
}
function optionalString(data: Record<string, unknown>, key: string, max: number, output: Record<string, unknown>) {
  if (key in data) output[key] = string(data[key], key, max, true);
}
export function agentPatch(value: unknown): Partial<Agent> {
  const data = object(value), out: Record<string, unknown> = {};
  if ('name' in data) out.name = string(data.name, 'Agent name', 100).trim();
  for (const key of ['description', 'instructions']) optionalString(data, key, key === 'instructions' ? 30000 : 1000, out);
  for (const key of ['providerId', 'modelId', 'reasoningEffort']) optionalString(data, key, 200, out);
  optionalString(data, 'workspacePath', 4000, out);
  if ('color' in data) {
    if (typeof data.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(data.color)) throw new InputError('Choose a six-digit hex agent color.');
    out.color = data.color;
  }
  if ('icon' in data) {
    if (!['spark', 'code', 'design', 'search', 'custom'].includes(String(data.icon))) throw new InputError('Choose a supported agent icon.');
    out.icon = data.icon;
  }
  if ('agentGroupId' in data) out.agentGroupId = data.agentGroupId === null ? null : string(data.agentGroupId, 'Agent group ID', 100);
  if ('archived' in data) out.archived = bool(data.archived, 'archived');
  return out as Partial<Agent>;
}
export function conversationPatch(value: unknown): Partial<Conversation> {
  const data = object(value), out: Record<string, unknown> = {};
  if ('title' in data) out.title = string(data.title, 'Chat title', 200).trim();
  if ('groupId' in data) out.groupId = data.groupId === null ? null : string(data.groupId, 'groupId', 100);
  optionalString(data, 'workspacePath', 4000, out);
  if ('archived' in data) out.archived = bool(data.archived, 'archived');
  return out as Partial<Conversation>;
}
export function settingsPatch(value: unknown): Partial<Settings> {
  const data = object(value), out: Record<string, unknown> = {};
  if ('theme' in data) {
    if (!['dark', 'light', 'system'].includes(String(data.theme))) throw new InputError('Choose dark, light, or system theme.');
    out.theme = data.theme;
  }
  for (const key of ['defaultProviderId', 'defaultModelId']) optionalString(data, key, 200, out);
  if ('showActivity' in data) out.showActivity = bool(data.showActivity, 'showActivity');
  if ('toolStreamView' in data) {
    if (!['verbose', 'compact', 'hidden'].includes(String(data.toolStreamView))) throw new InputError('Choose a tool stream view.');
    out.toolStreamView = data.toolStreamView;
  }
  return out as Partial<Settings>;
}
export function schedulePatch(value: unknown): Partial<Schedule> {
  const data = object(value), out: Record<string, unknown> = {};
  if ('title' in data) out.title = string(data.title, 'Task title', 200);
  if ('prompt' in data) out.prompt = string(data.prompt, 'Task prompt', 100000);
  for (const key of ['agentId', 'conversationId']) optionalString(data, key, 100, out);
  if ('runAt' in data) {
    const date = new Date(string(data.runAt, 'Run time', 100));
    if (Number.isNaN(date.getTime())) throw new InputError('Choose a valid date and time.');
    out.runAt = date.toISOString();
  }
  if ('enabled' in data) out.enabled = bool(data.enabled, 'enabled');
  return out as Partial<Schedule>;
}
export function initialState(): WorkspaceState {
  const createdAt = now();
  const shared = { providerId: 'codex', modelId: '', reasoningEffort: '', createdAt };
  return {
    version: 1,
    agents: [
      { ...shared, id: 'primary', name: 'A Gent', description: 'Your general-purpose thinking and doing partner.', instructions: 'You are A Gent, a thoughtful, practical assistant. Help the user get work done. Explain uncertainty clearly. Ask before consequential actions outside the requested scope.', icon: 'spark', color: '#f39161' },
      { ...shared, id: 'designer', name: 'Product Designer', description: 'Flows, interfaces, and the details that make them work.', instructions: 'You are an experienced product designer. Help with research, user flows, interface design, accessibility, and practical prototypes. Explain the choices that affect usability.', icon: 'design', color: '#9393ed' },
      { ...shared, id: 'engineer', name: 'Software Engineer', description: 'Build, debug, and understand your code.', instructions: 'You are a careful software engineer. Inspect relevant code, implement complete changes, and verify important behavior. Respect the selected workspace and user approvals.', icon: 'code', color: '#5ab9a0' },
      { ...shared, id: 'researcher', name: 'Research Partner', description: 'Turn questions into supported answers.', instructions: 'You are a research partner. Separate observations, inferences, and uncertainty. Cite sources when available. Never invent a source or pretend an unperformed action succeeded.', icon: 'search', color: '#d5a35f' },
    ],
    conversations: [], groups: [], agentGroups: [], schedules: [],
    settings: { theme: 'dark', defaultProviderId: 'codex', defaultModelId: '', showActivity: true, toolStreamView: 'compact' },
  };
}

function list(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new InputError(`${label} must be an array of at most ${max} entries.`);
  return value;
}
export function validateImport(value: unknown): WorkspaceState {
  const data = object(value);
  if (data.version !== 1) throw new InputError('This workspace export version is not supported.');
  const agentGroups = data.agentGroups === undefined ? [] : list(data.agentGroups, 'Agent groups', 1000).map((value) => {
    const g = object(value);
    return { id: string(g.id, 'Agent group ID', 100), name: string(g.name, 'Agent group name', 100), createdAt: typeof g.createdAt === 'string' ? g.createdAt : now() } as Group;
  });
  const agentGroupIds = new Set(agentGroups.map(g => g.id));
  const agents = list(data.agents, 'Agents', 500).map((value) => {
    const a = object(value), patch = agentPatch(a);
    return { ...initialState().agents[0], ...patch, id: string(a.id, 'Agent ID', 100), createdAt: typeof a.createdAt === 'string' ? a.createdAt : now() } as Agent;
  });
  for (const agent of agents) if (agent.agentGroupId && !agentGroupIds.has(agent.agentGroupId)) agent.agentGroupId = null;
  const agentIds = new Set(agents.map(a => a.id));
  const groups = list(data.groups, 'Groups', 1000).map((value) => {
    const g = object(value);
    return { id: string(g.id, 'Group ID', 100), name: string(g.name, 'Group name', 100), createdAt: typeof g.createdAt === 'string' ? g.createdAt : now() } as Group;
  });
  const groupIds = new Set(groups.map(g => g.id));
  const conversations = list(data.conversations, 'Chats', 5000).map((value) => {
    const c = object(value), agentId = string(c.agentId, 'Agent ID', 100);
    if (!agentIds.has(agentId)) throw new InputError('An imported chat references an unknown agent.');
    const messages = list(c.messages, 'Messages', 10000).map((value) => {
      const m = object(value);
      if (!['user', 'assistant', 'system'].includes(String(m.role))) throw new InputError('An imported message has an invalid role.');
      const attachments = m.attachments === undefined ? undefined : list(m.attachments, 'Attachments', 10).map(value => {
        const a = object(value);
        return { id: string(a.id, 'Attachment ID', 100), name: string(a.name, 'Attachment name', 500), type: string(a.type, 'Attachment type', 200), content: string(a.content, 'Attachment content', 1000000, true) };
      });
      const activities = m.activities === undefined ? undefined : list(m.activities, 'Activity entries', 1000).map(value => {
        const a = object(value);
        if (!['thinking', 'command', 'file', 'tool', 'status', 'approval'].includes(String(a.kind))) throw new InputError('An activity has an invalid kind.');
        return { id: string(a.id, 'Activity ID', 100), kind: a.kind, title: string(a.title, 'Activity title', 2000, true), ...(typeof a.detail === 'string' ? { detail: string(a.detail, 'Activity detail', 50000, true) } : {}), status: a.status === 'failed' || a.status === 'running' ? 'failed' : 'completed', createdAt: typeof a.createdAt === 'string' ? a.createdAt : now() } as Activity;
      });
      const status = m.status === 'streaming' ? 'interrupted' : ['failed', 'interrupted'].includes(String(m.status)) ? m.status as 'failed' | 'interrupted' : 'completed';
      return { id: string(m.id, 'Message ID', 100), role: m.role as 'user' | 'assistant' | 'system', content: string(m.content, 'Message content', 1000000, true), createdAt: typeof m.createdAt === 'string' ? m.createdAt : now(), status: status as 'completed' | 'failed' | 'interrupted', ...(attachments ? { attachments } : {}), ...(activities ? { activities } : {}) };
    });
    const patch = conversationPatch(c);
    if (patch.groupId && !groupIds.has(patch.groupId)) patch.groupId = null;
    // Imported provider thread IDs are intentionally discarded: an export cannot bind another user's local Codex thread.
    return { id: string(c.id, 'Chat ID', 100), agentId, title: 'New chat', ...patch, messages, createdAt: typeof c.createdAt === 'string' ? c.createdAt : now(), updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : now() } as Conversation;
  });
  const schedules = list(data.schedules, 'Scheduled tasks', 1000).map(value => {
    const s = object(value), patch = schedulePatch(s);
    if (!patch.agentId || !agentIds.has(patch.agentId) || !patch.title || !patch.prompt || !patch.runAt) throw new InputError('An imported task is incomplete or references an unknown agent.');
    return { ...patch, id: string(s.id, 'Task ID', 100), enabled: false } as Schedule;
  });
  for (const [name, values] of [['agents', agents], ['groups', groups], ['agentGroups', agentGroups], ['chats', conversations], ['tasks', schedules]] as const) {
    if (new Set(values.map(v => v.id)).size !== values.length) throw new InputError(`Duplicate IDs in imported ${name}.`);
  }
  return { version: 1, agents, conversations, groups, agentGroups, schedules, settings: { ...initialState().settings, ...settingsPatch(data.settings) } };
}

export class StateStore {
  state: WorkspaceState = initialState();
  private writes: Promise<void> = Promise.resolve();
  private lock?: DataLock;
  constructor(public readonly directory: string, private options: { lock?: boolean } = {}) {}
  private async readState(filename: string): Promise<void> {
    const raw = JSON.parse(await readFile(filename, 'utf8')) as WorkspaceState;
    // Validate durable state, then restore same-machine provider binding and task enablement.
    this.state = validateImport(raw);
    for (const c of this.state.conversations) c.providerThreadId = raw.conversations.find(r => r.id === c.id)?.providerThreadId;
    for (const s of this.state.schedules) {
      const saved = raw.schedules.find(r => r.id === s.id);
      s.enabled = saved?.enabled ?? false;
      s.lastRunAt = saved?.lastRunAt;
      s.error = saved?.error;
    }
  }
  async load(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    if (this.options.lock && !this.lock) this.lock = await acquireDataLock(this.directory);
    try {
      const primary = join(this.directory, 'state.json');
      try {
        await this.readState(primary);
        return;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          await this.save();
          return;
        }
      }
      const backup = join(this.directory, 'state.json.bak');
      try {
        await this.readState(backup);
        console.warn(`A Gent recovered the workspace from ${backup}.`);
        // Do not copy the corrupt primary over the valid backup during recovery.
        await this.save(true);
      } catch {
        throw new Error(`Could not read A Gent workspace at ${this.directory}. The primary state and backup are unreadable.`);
      }
    } catch (error) {
      await this.close();
      throw error;
    }
  }
  save(skipBackup = false): Promise<void> {
    const bytes = JSON.stringify(this.state);
    this.writes = this.writes.catch(() => {}).then(async () => {
      const primary = join(this.directory, 'state.json');
      const temporary = join(this.directory, `.state-${id()}.tmp`);
      await writeFile(temporary, bytes, { mode: 0o600 });
      if (!skipBackup) {
        try { await copyFile(primary, join(this.directory, 'state.json.bak')); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
      await rename(temporary, primary);
    });
    return this.writes;
  }
  async close(): Promise<void> {
    const lock = this.lock;
    if (!lock) return;
    this.lock = undefined;
    await lock.release();
  }
  async merge(value: unknown): Promise<WorkspaceState> {
    const imported = validateImport(value);
    for (const key of ['agents', 'groups', 'agentGroups', 'conversations', 'schedules'] as const) {
      const existing = new Set(this.state[key].map(item => item.id));
      (this.state[key] as Array<Agent | Group | Conversation | Schedule>).push(...imported[key].filter(item => !existing.has(item.id)));
    }
    await this.save();
    return this.state;
  }
  getAgent(agentId: string): Agent {
    const agent = this.state.agents.find(a => a.id === agentId && !a.archived);
    if (!agent) throw new InputError('Agent not found.', 404);
    return agent;
  }
  getConversation(conversationId: string): Conversation {
    const conversation = this.state.conversations.find(c => c.id === conversationId);
    if (!conversation) throw new InputError('Chat not found.', 404);
    return conversation;
  }
  createConversation(agentId: string, patch: Partial<Conversation> = {}): Conversation {
    this.getAgent(agentId);
    const conversation: Conversation = { id: id(), agentId, title: 'New chat', createdAt: now(), updatedAt: now(), messages: [], ...patch };
    this.state.conversations.push(conversation);
    return conversation;
  }
}
