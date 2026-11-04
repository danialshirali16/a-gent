export type ProviderKind = 'codex' | 'ollama' | 'openai-compatible';
export type RunStatus = 'running' | 'waiting' | 'completed' | 'failed' | 'interrupted';
export type IconName = 'spark' | 'code' | 'design' | 'search' | 'custom';

export interface Agent {
  id: string;
  name: string;
  description: string;
  instructions: string;
  color: string;
  icon: IconName;
  providerId: string;
  modelId: string;
  reasoningEffort: string;
  workspacePath?: string;
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
  providerThreadId?: string;
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
export interface Settings {
  theme: 'dark' | 'light' | 'system';
  defaultProviderId: string;
  defaultModelId: string;
  showActivity: boolean;
  toolStreamView?: 'verbose' | 'compact' | 'hidden';
}
export interface WorkspaceState {
  version: 1;
  agents: Agent[];
  conversations: Conversation[];
  groups: Group[];
  schedules: Schedule[];
  settings: Settings;
}
export interface ModelOption { id: string; name: string; description?: string; }
export interface ProviderInfo {
  id: string;
  name: string;
  kind: ProviderKind;
  status: 'connected' | 'available' | 'unavailable' | 'error';
  detail: string;
  models: ModelOption[];
  baseUrl?: string;
}
export interface AppConnection {
  name: string;
  status: 'connected' | 'starting' | 'needs-auth' | 'configured' | 'unavailable' | 'disabled';
  toolsCount: number;
}
export interface Approval {
  id: string;
  runId: string;
  conversationId: string;
  title: string;
  description: string;
  command?: string;
  status: 'pending' | 'accepted' | 'declined';
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
export interface Bootstrap { state: WorkspaceState; providers: ProviderInfo[]; runs: Run[]; }
export type ServerEvent =
  | { type: 'state'; state: WorkspaceState }
  | { type: 'providers'; providers: ProviderInfo[] }
  | { type: 'run'; run: Run }
  | { type: 'delta'; conversationId: string; messageId: string; delta: string }
  | { type: 'error'; message: string };
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
