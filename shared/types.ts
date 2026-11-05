export type ProviderKind = 'codex' | 'opencode' | 'ollama' | 'openai-compatible';
export type RunStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'interrupted';
export type IconName = 'spark' | 'code' | 'design' | 'search' | 'custom';
import type { AgentAvatarType } from './agentAvatars';

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  color: string;
  icon: IconName;
  /** Bot-avatars shape. Missing means resolve from the legacy icon. */
  avatarType?: AgentAvatarType;
  providerId: string;
  /** Stable connection/profile identifier; providerId remains the compatibility fallback. */
  providerProfileId?: string;
  modelId: string;
  /** Effective effort for this agent. Verified model options are stored with the provider capability snapshot. */
  reasoningEffort: string;
  workspacePath?: string;
  agentGroupId?: string | null;
  archived?: boolean;
  createdAt: string;
}
export interface Attachment { id: string; name: string; type: string; content: string; }
export interface Activity {
  id: string;
  kind: 'thinking' | 'command' | 'file' | 'tool' | 'status' | 'approval';
  title: string;
  detail?: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  createdAt: string;
}
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  attachments?: Attachment[];
  activities?: Activity[];
  status?: 'streaming' | 'completed' | 'failed' | 'interrupted';
}
export interface ProviderBinding {
  providerId: string;
  providerKind: ProviderKind;
  accountId?: string;
  workspaceId?: string;
  modelId?: string;
  providerThreadId?: string;
  updatedAt: string;
}
export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  groupId?: string | null;
  workspacePath?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  /** @deprecated Compatibility field; FND-007 moves session routing to providerBinding. */
  providerThreadId?: string;
  providerBinding?: ProviderBinding;
  /** Optional chat-level model overrides; otherwise the Agent/default settings apply. */
  providerId?: string;
  modelId?: string;
  /** Optional chat-level effort override; otherwise the Agent's effective effort applies. */
  reasoningEffort?: string;
}
export interface Group { id: string; name: string; createdAt: string; }
export interface DeviceInfo {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  rotatedAt?: string;
  revokedAt?: string;
  current?: boolean;
}
export interface WorkspaceFileEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size?: number;
}
export interface WorkspaceFiles {
  root: string;
  path: string;
  entries: WorkspaceFileEntry[];
  truncated: boolean;
}
export interface Schedule {
  id: string;
  agentId: string;
  title: string;
  prompt: string;
  runAt: string;
  enabled: boolean;
  lastRunAt?: string;
  conversationId?: string;
  error?: string;
}
export type ResourceScope = 'global' | 'agent' | 'group' | 'chat';
export type ResourceOwnership = 'managed' | 'external';
export interface ScopedResource {
  id: string;
  name: string;
  scope: ResourceScope;
  /** Required for agent/group/chat scopes; omitted for global. */
  scopeId?: string;
  ownership: ResourceOwnership;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface AppCapabilitySnapshot {
  tools?: string[];
  resources?: number;
  prompts?: number;
  serverVersion?: string;
  authStatus?: string;
}
export interface AppRecord extends ScopedResource {
  providerId: string;
  transport: 'stdio' | 'http';
  source?: string;
  toolsCount?: number;
  hostId?: string;
  workspacePath?: string;
  capabilitySnapshot?: AppCapabilitySnapshot;
  credentialRef?: string;
  lastCheckedAt?: string;
  error?: string;
}
export interface SkillRecord extends ScopedResource {
  format: 'agent-skills';
  version?: string;
  sourcePath?: string;
}
export interface SpeechSettings {
  provider: 'elevenlabs';
  modelId?: string;
  language?: string;
  credentialMode: 'keychain' | 'session';
}
export interface Settings {
  theme: 'dark' | 'light' | 'system';
  defaultProviderId: string;
  defaultModelId: string;
  showActivity: boolean;
  toolStreamView?: 'verbose' | 'compact' | 'hidden';
  /** Non-secret speech preferences; the ElevenLabs key is stored separately. */
  speech?: SpeechSettings;
}
export interface WorkspaceState {
  version: 2;
  agents: Agent[];
  conversations: Conversation[];
  groups: Group[];
  agentGroups: Group[];
  schedules: Schedule[];
  apps: AppRecord[];
  skills: SkillRecord[];
  settings: Settings;
}
export interface ReasoningOption { value: string; label?: string; description?: string; }
export type ReasoningCapability =
  | { kind: 'enum'; options: ReasoningOption[]; default?: string; source?: string }
  | { kind: 'budget'; min: number; max: number; default?: number; source?: string }
  | { kind: 'boolean'; default?: boolean; source?: string }
  | { kind: 'unsupported' }
  | { kind: 'unknown'; source?: string };
export interface ModelOption { id: string; name: string; description?: string; reasoning?: ReasoningCapability; }
export type ProviderReadiness = 'unconfigured' | 'configured' | 'checking' | 'needs-auth' | 'ready' | 'degraded' | 'error' | 'disabled';
export type ProviderAuthMode = 'external' | 'api-key' | 'optional' | 'none';
export type ProviderCancellation = 'turn' | 'process' | 'stream' | 'none';
export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  tools: boolean;
  approvals: boolean;
  skills: boolean;
  attachments: boolean;
  reasoning: boolean;
  mcp: boolean;
  discovery: boolean;
  auth: ProviderAuthMode;
  cancellation: ProviderCancellation;
}
export interface ProviderInfo {
  id: string;
  name: string;
  kind: ProviderKind;
  /** @deprecated Compatibility status; use readiness for lifecycle decisions. */
  status: 'connected' | 'available' | 'unavailable' | 'error';
  readiness?: ProviderReadiness;
  capabilities?: ProviderCapabilities;
  detail: string;
  models: ModelOption[];
  baseUrl?: string;
  modelId?: string;
  credentialMode?: 'session' | 'keychain';
  hasStoredKey?: boolean;
  verifiedBy?: 'catalog' | 'inference';
  lastCheckedAt?: string;
  errorKind?: 'auth' | 'network' | 'catalog' | 'model' | 'runtime' | 'unknown';
}
export interface AppConnection {
  name: string;
  status: 'connected' | 'starting' | 'needs-auth' | 'configured' | 'unavailable' | 'disabled';
  toolsCount: number;
  id?: string;
  providerId?: string;
  source?: 'runtime' | 'managed' | 'external';
  transport?: 'stdio' | 'http' | 'unknown';
  lastCheckedAt?: string;
  tools?: string[];
  resourcesCount?: number;
  authStatus?: string;
  serverVersion?: string;
  error?: string;
}
export type InteractionKind = 'approval' | 'question' | 'form' | 'url';
export type InteractionStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
export interface InteractionOption { value: string; label: string; description?: string; }
export interface InteractionQuestion {
  id: string;
  header: string;
  question: string;
  options?: InteractionOption[];
  isOther?: boolean;
  isSecret?: boolean;
}
export type InteractionFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'enum' | 'multi-enum';
export interface InteractionField {
  name: string;
  label: string;
  description?: string;
  type: InteractionFieldType;
  required?: boolean;
  default?: unknown;
  options?: InteractionOption[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
}
export interface InteractionPayload { questions?: InteractionQuestion[]; fields?: InteractionField[]; }
export interface PendingInteraction {
  id: string;
  hostId: string;
  runId: string;
  conversationId: string;
  providerId: string;
  threadId?: string;
  kind: InteractionKind;
  title: string;
  description?: string;
  command?: string;
  url?: string;
  payload?: InteractionPayload;
  status: InteractionStatus;
  response?: unknown;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}
export interface Approval {
  id: string;
  runId: string;
  conversationId: string;
  hostId?: string;
  providerId?: string;
  threadId?: string;
  kind?: InteractionKind;
  title: string;
  description: string;
  command?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
  updatedAt?: string;
}
export interface Run {
  id: string;
  conversationId: string;
  agentId: string;
  messageId: string;
  status: RunStatus;
  providerId: string;
  modelId: string;
  startedAt: string;
  error?: string;
  activities: Activity[];
  approvals: Approval[];
}
export interface Bootstrap { state: WorkspaceState; providers: ProviderInfo[]; runs: Run[]; interactions?: PendingInteraction[]; }
export type ServerEvent =
  | { type: 'state'; state: WorkspaceState }
  | { type: 'providers'; providers: ProviderInfo[] }
  | { type: 'run'; run: Run }
  | { type: 'interaction'; interaction: PendingInteraction }
  | { type: 'delta'; conversationId: string; messageId: string; delta: string }
  | { type: 'error'; message: string; requestId?: string; runId?: string; providerId?: string; appId?: string; code?: string };
export interface SendMessageInput {
  content: string;
  attachments?: Attachment[];
  providerId?: string;
  modelId?: string;
  mode?: 'chat' | 'work';
}
export interface ServerOptions {
  port?: number;
  host?: string;
  dataDir?: string;
  staticDir?: string;
  dev?: boolean;
  token?: string;
  allowLocalTokenInjection?: boolean;
}
export interface ServerHandle { url: string; token: string; close: () => Promise<void>; }
