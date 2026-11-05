import { copyFile, mkdir, open, readFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { MODEL_ID_LIMIT } from '../shared/providers.js';
import type { Activity, Agent, AppRecord, Conversation, Group, ProviderBinding, Schedule, ScopedResource, Settings, SkillRecord, SpeechSettings, WorkspaceState } from '../shared/types.js';
import { isAgentAvatarType } from '../shared/agentAvatars.js';
import { acquireDataLock, type DataLock } from './lock.js';

export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export const CURRENT_WORKSPACE_VERSION = 2;

export function migrateWorkspace(value: unknown): Record<string, unknown> {
  const data = object(value);
  if (data.version === CURRENT_WORKSPACE_VERSION) return data;
  if (data.version === 1) return { ...data, version: CURRENT_WORKSPACE_VERSION, apps: [], skills: [] };
  throw new InputError('This workspace export version is not supported.');
}

function timestampOrNow(value: unknown): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return now();
}

function providerKindFor(providerId: string): ProviderBinding['providerKind'] {
  if (providerId === 'codex' || providerId === 'opencode' || providerId === 'ollama' || providerId === 'openai-compatible') return providerId;
  return 'openai-compatible';
}

export function providerBinding(value: unknown, fallbackProviderId = 'codex'): ProviderBinding {
  const data = object(value);
  const providerId = string(data.providerId ?? fallbackProviderId, 'Provider ID', 200);
  const kind = data.providerKind === undefined ? providerKindFor(providerId) : string(data.providerKind, 'Provider kind', 40);
  if (!['codex', 'opencode', 'ollama', 'openai-compatible'].includes(kind)) throw new InputError('Choose a supported provider kind.');
  const binding: ProviderBinding & Record<string, unknown> = { providerId, providerKind: kind as ProviderBinding['providerKind'], updatedAt: timestampOrNow(data.updatedAt) };
  for (const [key, max] of [['accountId', 200], ['workspaceId', 4000], ['modelId', MODEL_ID_LIMIT], ['providerThreadId', 4000]] as const) {
    if (data[key] !== undefined && data[key] !== null) binding[key] = string(data[key], key, max, true);
  }
  return binding;
}

function speechSettings(value: unknown): SpeechSettings {
  const data = object(value);
  const provider = string(data.provider ?? 'elevenlabs', 'Speech provider', 50);
  if (provider !== 'elevenlabs') throw new InputError('ElevenLabs is the supported speech provider.');
  const credentialMode = string(data.credentialMode ?? 'keychain', 'Speech credential mode', 20);
  if (!['keychain', 'session'].includes(credentialMode)) throw new InputError('Choose keychain or session speech credentials.');
  return {
    provider: 'elevenlabs',
    credentialMode: credentialMode as SpeechSettings['credentialMode'],
    ...(data.modelId === undefined ? {} : { modelId: string(data.modelId, 'Speech model ID', MODEL_ID_LIMIT, true) }),
    ...(data.language === undefined ? {} : { language: string(data.language, 'Speech language', 50, true) }),
  };
}

function scopedResource(value: unknown, label: string, ids: { agent: Set<string>; group: Set<string>; chat: Set<string> }): ScopedResource {
  const data = object(value);
  const scope = string(data.scope, `${label} scope`, 20);
  if (!['global', 'agent', 'group', 'chat'].includes(scope)) throw new InputError(`Choose a supported ${label.toLowerCase()} scope.`);
  const scopeId = data.scopeId === undefined || data.scopeId === null ? undefined : string(data.scopeId, `${label} scope ID`, 100);
  if (scope === 'global' && scopeId) throw new InputError(`A global ${label.toLowerCase()} cannot have a scope ID.`);
  if (scope !== 'global' && !scopeId) throw new InputError(`${label} requires a scope ID.`);
  if (scopeId && !ids[scope as 'agent' | 'group' | 'chat'].has(scopeId)) throw new InputError(`${label} references an unknown ${scope}.`);
  const ownership = string(data.ownership, `${label} ownership`, 20);
  if (!['managed', 'external'].includes(ownership)) throw new InputError(`Choose managed or external ${label.toLowerCase()} ownership.`);
  return {
    id: string(data.id, `${label} ID`, 100),
    name: string(data.name, `${label} name`, 200).trim(),
    scope: scope as ScopedResource['scope'],
    ...(scopeId ? { scopeId } : {}),
    ownership: ownership as ScopedResource['ownership'],
    enabled: data.enabled === undefined ? true : bool(data.enabled, `${label} enabled`),
    createdAt: timestampOrNow(data.createdAt),
    updatedAt: timestampOrNow(data.updatedAt),
  };
}

function appRecord(value: unknown, ids: { agent: Set<string>; group: Set<string>; chat: Set<string> }): AppRecord {
  const data = object(value), base = scopedResource(data, 'App', ids);
  const transport = string(data.transport ?? 'stdio', 'App transport', 10);
  if (!['stdio', 'http'].includes(transport)) throw new InputError('Choose stdio or http app transport.');
  const toolsCount = data.toolsCount === undefined ? undefined : Number(data.toolsCount);
  if (toolsCount !== undefined && (!Number.isInteger(toolsCount) || toolsCount < 0 || toolsCount > 100000)) throw new InputError('App tool count must be a non-negative integer.');
  let capabilitySnapshot: AppRecord['capabilitySnapshot'];
  if (data.capabilitySnapshot !== undefined) {
    const snapshot = object(data.capabilitySnapshot);
    capabilitySnapshot = {
      ...(snapshot.tools === undefined ? {} : { tools: list(snapshot.tools, 'App capability tools', 1000).map(tool => string(tool, 'App capability tool', 200)) }),
      ...(snapshot.resources === undefined ? {} : { resources: Number(snapshot.resources) as number }),
      ...(snapshot.prompts === undefined ? {} : { prompts: Number(snapshot.prompts) as number }),
      ...(snapshot.serverVersion === undefined ? {} : { serverVersion: string(snapshot.serverVersion, 'App server version', 200, true) }),
      ...(snapshot.authStatus === undefined ? {} : { authStatus: string(snapshot.authStatus, 'App auth status', 100, true) }),
    };
    for (const key of ['resources', 'prompts'] as const) if (capabilitySnapshot[key] !== undefined && (!Number.isInteger(capabilitySnapshot[key]) || capabilitySnapshot[key]! < 0)) throw new InputError('App capability counts must be non-negative integers.');
  }
  return {
    ...base,
    providerId: string(data.providerId ?? 'codex', 'App provider ID', 200),
    transport: transport as AppRecord['transport'],
    ...(data.source === undefined ? {} : { source: string(data.source, 'App source', 4000, true) }),
    ...(toolsCount === undefined ? {} : { toolsCount }),
    ...(data.hostId === undefined ? {} : { hostId: string(data.hostId, 'App host ID', 100) }),
    ...(data.workspacePath === undefined ? {} : { workspacePath: string(data.workspacePath, 'App workspace', 4000, true) }),
    ...(capabilitySnapshot ? { capabilitySnapshot } : {}),
    ...(data.credentialRef === undefined ? {} : { credentialRef: string(data.credentialRef, 'App credential reference', 200) }),
    ...(data.lastCheckedAt === undefined ? {} : { lastCheckedAt: timestampOrNow(data.lastCheckedAt) }),
    ...(data.error === undefined ? {} : { error: string(data.error, 'App error', 2000, true) }),
  };
}

export function validateAppRecord(value: unknown, state: WorkspaceState): AppRecord {
  return appRecord(value, {
    agent: new Set(state.agents.map(agent => agent.id)),
    group: new Set(state.groups.map(group => group.id)),
    chat: new Set(state.conversations.map(conversation => conversation.id)),
  });
}

function skillRecord(value: unknown, ids: { agent: Set<string>; group: Set<string>; chat: Set<string> }): SkillRecord {
  const data = object(value), base = scopedResource(data, 'Skill', ids);
  if (string(data.format ?? 'agent-skills', 'Skill format', 40) !== 'agent-skills') throw new InputError('Only the Agent Skills format is supported.');
  return {
    ...base,
    format: 'agent-skills',
    ...(data.version === undefined ? {} : { version: string(data.version, 'Skill version', 100, true) }),
    ...(data.sourcePath === undefined ? {} : { sourcePath: string(data.sourcePath, 'Skill source path', 4000, true) }),
  };
}
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
  for (const key of ['providerId', 'providerProfileId', 'modelId', 'reasoningEffort']) optionalString(data, key, key === 'providerProfileId' ? 100 : key === 'modelId' ? MODEL_ID_LIMIT : 200, out);
  optionalString(data, 'workspacePath', 4000, out);
  if ('color' in data) {
    if (typeof data.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(data.color)) throw new InputError('Choose a six-digit hex agent color.');
    out.color = data.color;
  }
  if ('icon' in data) {
    if (!['spark', 'code', 'design', 'search', 'custom'].includes(String(data.icon))) throw new InputError('Choose a supported agent icon.');
    out.icon = data.icon;
  }
  if ('avatarType' in data) {
    if (!isAgentAvatarType(data.avatarType)) throw new InputError('Choose a supported agent avatar shape.');
    out.avatarType = data.avatarType;
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
  optionalString(data, 'providerId', 200, out);
  optionalString(data, 'modelId', MODEL_ID_LIMIT, out);
  optionalString(data, 'reasoningEffort', 200, out);
  if ('archived' in data) out.archived = bool(data.archived, 'archived');
  return out as Partial<Conversation>;
}
export function settingsPatch(value: unknown): Partial<Settings> {
  const data = object(value), out: Record<string, unknown> = {};
  if ('theme' in data) {
    if (!['dark', 'light', 'system'].includes(String(data.theme))) throw new InputError('Choose dark, light, or system theme.');
    out.theme = data.theme;
  }
  optionalString(data, 'defaultProviderId', 200, out);
  optionalString(data, 'defaultModelId', MODEL_ID_LIMIT, out);
  if ('showActivity' in data) out.showActivity = bool(data.showActivity, 'showActivity');
  if ('toolStreamView' in data) {
    if (!['verbose', 'compact', 'hidden'].includes(String(data.toolStreamView))) throw new InputError('Choose a tool stream view.');
    out.toolStreamView = data.toolStreamView;
  }
  if ('speech' in data) out.speech = speechSettings(data.speech);
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
    version: CURRENT_WORKSPACE_VERSION,
    agents: [
      { ...shared, id: 'primary', name: 'A Gent', description: 'Your general-purpose thinking and doing partner.', instructions: 'You are A Gent, a thoughtful, practical assistant. Help the user get work done. Explain uncertainty clearly. Ask before consequential actions outside the requested scope.', icon: 'spark', avatarType: 'star', color: '#f39161' },
      { ...shared, id: 'designer', name: 'Product Designer', description: 'Flows, interfaces, and the details that make them work.', instructions: 'You are an experienced product designer. Help with research, user flows, interface design, accessibility, and practical prototypes. Explain the choices that affect usability.', icon: 'design', avatarType: 'flower', color: '#9393ed' },
      { ...shared, id: 'engineer', name: 'Software Engineer', description: 'Build, debug, and understand your code.', instructions: 'You are a careful software engineer. Inspect relevant code, implement complete changes, and verify important behavior. Respect the selected workspace and user approvals.', icon: 'code', avatarType: 'mech', color: '#5ab9a0' },
      { ...shared, id: 'researcher', name: 'Research Partner', description: 'Turn questions into supported answers.', instructions: 'You are a research partner. Separate observations, inferences, and uncertainty. Cite sources when available. Never invent a source or pretend an unperformed action succeeded.', icon: 'search', avatarType: 'clover', color: '#d5a35f' },
    ],
    conversations: [], groups: [], agentGroups: [], schedules: [], apps: [], skills: [],
    settings: { theme: 'dark', defaultProviderId: 'codex', defaultModelId: '', showActivity: true, toolStreamView: 'compact' },
  };
}

function list(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new InputError(`${label} must be an array of at most ${max} entries.`);
  return value;
}
export function validateImport(value: unknown): WorkspaceState {
  const data = migrateWorkspace(value);
  const agentGroups = data.agentGroups === undefined ? [] : list(data.agentGroups, 'Agent groups', 1000).map((value) => {
    const g = object(value);
    return { id: string(g.id, 'Agent group ID', 100), name: string(g.name, 'Agent group name', 100), createdAt: typeof g.createdAt === 'string' ? g.createdAt : now() } as Group;
  });
  const agentGroupIds = new Set(agentGroups.map(g => g.id));
  const template = { ...initialState().agents[0] } as Record<string, unknown>;
  // Never inherit the primary agent's shape into every imported agent.
  delete template.avatarType;
  const agents = list(data.agents, 'Agents', 500).map((value) => {
    const a = object(value);
    const sanitized = { ...a };
    if ('avatarType' in sanitized && !isAgentAvatarType(sanitized.avatarType)) delete sanitized.avatarType;
    const patch = agentPatch(sanitized);
    return { ...template, ...patch, id: string(a.id, 'Agent ID', 100), createdAt: typeof a.createdAt === 'string' ? a.createdAt : now() } as Agent;
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
  const scopeIds = { agent: agentIds, group: groupIds, chat: new Set(conversations.map(conversation => conversation.id)) };
  const apps = data.apps === undefined ? [] : list(data.apps, 'Apps', 1000).map(value => appRecord(value, scopeIds));
  const skills = data.skills === undefined ? [] : list(data.skills, 'Skills', 1000).map(value => skillRecord(value, scopeIds));
  for (const [name, values] of [['agents', agents], ['groups', groups], ['agentGroups', agentGroups], ['chats', conversations], ['tasks', schedules], ['apps', apps], ['skills', skills]] as const) {
    if (new Set(values.map(v => v.id)).size !== values.length) throw new InputError(`Duplicate IDs in imported ${name}.`);
  }
  return {
    version: CURRENT_WORKSPACE_VERSION,
    agents, conversations, groups, agentGroups, schedules, apps, skills,
    settings: { ...initialState().settings, ...settingsPatch(data.settings) },
  };
}

export class StateStore {
  state: WorkspaceState = initialState();
  private writes: Promise<void> = Promise.resolve();
  private lock?: DataLock;
  constructor(public readonly directory: string, private options: { lock?: boolean } = {}) {}
  private async readState(filename: string): Promise<void> {
    const raw = JSON.parse(await readFile(filename, 'utf8')) as Record<string, unknown>;
    const migrated = migrateWorkspace(raw);
    // Validate durable state, then restore same-machine provider bindings and task enablement.
    this.state = validateImport(migrated);
    const savedConversations = Array.isArray(migrated.conversations) ? migrated.conversations as Array<Record<string, unknown>> : [];
    for (const conversation of this.state.conversations) {
      const saved = savedConversations.find(item => item.id === conversation.id);
      conversation.providerThreadId = typeof saved?.providerThreadId === 'string' ? saved.providerThreadId : undefined;
      const agent = this.state.agents.find(item => item.id === conversation.agentId);
      const fallbackProviderId = agent?.providerId ?? 'codex';
      if (saved?.providerBinding && typeof saved.providerBinding === 'object') {
        conversation.providerBinding = providerBinding(saved.providerBinding, fallbackProviderId);
      } else if (conversation.providerThreadId) {
        conversation.providerBinding = {
          providerId: fallbackProviderId,
          providerKind: providerKindFor(fallbackProviderId),
          providerThreadId: conversation.providerThreadId,
          updatedAt: timestampOrNow(saved?.updatedAt),
        };
      }
    }
    const savedSchedules = Array.isArray(migrated.schedules) ? migrated.schedules as Array<Record<string, unknown>> : [];
    for (const schedule of this.state.schedules) {
      const saved = savedSchedules.find(item => item.id === schedule.id);
      schedule.enabled = saved?.enabled === true;
      schedule.lastRunAt = typeof saved?.lastRunAt === 'string' ? saved.lastRunAt : undefined;
      schedule.error = typeof saved?.error === 'string' ? saved.error : undefined;
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
  private enqueueWrite(bytes: string, skipBackup = false): Promise<void> {
    this.writes = this.writes.catch(() => {}).then(async () => {
      const primary = join(this.directory, 'state.json');
      const temporary = join(this.directory, `.state-${id()}.tmp`);
      const handle = await open(temporary, 'w', 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      if (!skipBackup) {
        try { await copyFile(primary, join(this.directory, 'state.json.bak')); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
      await rename(temporary, primary);
    });
    return this.writes;
  }
  save(skipBackup = false): Promise<void> {
    // Snapshot before queueing so concurrent saves cannot write a later state twice.
    return this.enqueueWrite(JSON.stringify(this.state), skipBackup);
  }
  async close(): Promise<void> {
    const lock = this.lock;
    if (!lock) return;
    this.lock = undefined;
    await lock.release();
  }
  async merge(value: unknown): Promise<WorkspaceState> {
    const imported = validateImport(value);
    const previous = this.state;
    const candidate = structuredClone(this.state);
    for (const key of ['agents', 'groups', 'agentGroups', 'conversations', 'schedules', 'apps', 'skills'] as const) {
      const existing = new Set(candidate[key].map(item => item.id));
      (candidate[key] as Array<Agent | Group | Conversation | Schedule | AppRecord | SkillRecord>).push(...imported[key].filter(item => !existing.has(item.id)));
    }
    this.state = candidate;
    try {
      await this.enqueueWrite(JSON.stringify(candidate));
    } catch (error) {
      // A failed import must not leave a partially merged in-memory workspace.
      this.state = previous;
      throw error;
    }
    return this.state;
  }
  async saveApp(value: unknown, existingId?: string): Promise<AppRecord> {
    const record = validateAppRecord(value, this.state);
    const previous = this.state.apps;
    const next = new Map(previous.map(item => [item.id, item]));
    if (existingId && existingId !== record.id) next.delete(existingId);
    if (existingId) record.id = existingId;
    next.set(record.id, record);
    this.state.apps = [...next.values()];
    try {
      await this.save();
    } catch (error) {
      this.state.apps = previous;
      throw error;
    }
    return record;
  }

  async removeApp(appId: string): Promise<boolean> {
    const previous = this.state.apps, index = previous.findIndex(item => item.id === appId);
    if (index < 0) return false;
    this.state.apps = previous.filter(item => item.id !== appId);
    try { await this.save(); }
    catch (error) { this.state.apps = previous; throw error; }
    return true;
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
