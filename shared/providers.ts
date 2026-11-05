import type { ModelOption, ProviderCapabilities, ProviderInfo, ProviderKind, ProviderReadiness, ReasoningCapability } from './types.js';

export const MODEL_ID_LIMIT = 200;
export const MODEL_LIMIT = 200;

const legacyReadiness: Record<ProviderInfo['status'], ProviderReadiness> = {
  connected: 'ready',
  available: 'configured',
  unavailable: 'disabled',
  error: 'error',
};

export function providerReadiness(provider: ProviderInfo): ProviderReadiness {
  return provider.readiness ?? legacyReadiness[provider.status];
}

export function isProviderReady(provider: ProviderInfo): boolean {
  return providerReadiness(provider) === 'ready';
}

export function readinessLabel(provider: ProviderInfo): string {
  const readiness = providerReadiness(provider);
  return {
    unconfigured: 'Set up',
    configured: 'Configured',
    checking: 'Checking',
    'needs-auth': 'Sign-in needed',
    ready: 'Ready',
    degraded: 'Limited',
    error: 'Connection error',
    disabled: 'Unavailable',
  }[readiness];
}

export function providerCapabilities(kind: ProviderKind): ProviderCapabilities {
  if (kind === 'codex' || kind === 'opencode') {
    return {
      chat: true, streaming: true, tools: true, approvals: kind === 'codex', skills: true, attachments: true,
      reasoning: true, mcp: true, discovery: true,
      auth: 'external',
      cancellation: kind === 'codex' ? 'turn' : 'process',
    };
  }
  if (kind === 'ollama') {
    return {
      chat: true, streaming: true, tools: false, approvals: false, skills: false, attachments: false,
      reasoning: true, mcp: false, discovery: true,
      auth: 'none', cancellation: 'stream',
    };
  }
  return {
    chat: true, streaming: true, tools: false, approvals: false, skills: false, attachments: false,
    reasoning: false, mcp: false, discovery: true,
    auth: 'api-key', cancellation: 'stream',
  };
}

function reasoningCapability(value: unknown): ReasoningCapability | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const data = value as Record<string, unknown>;
  if (data.kind === 'enum') {
    if (!Array.isArray(data.options)) return undefined;
    const options = data.options.flatMap(option => {
      if (!option || typeof option !== 'object') return [];
      const item = option as Record<string, unknown>;
      const value = typeof item.value === 'string' ? item.value.trim() : '';
      if (!value || value.length > 100) return [];
      return [{ value, ...(typeof item.label === 'string' ? { label: item.label.slice(0, 100) } : {}), ...(typeof item.description === 'string' ? { description: item.description.slice(0, 500) } : {}) }];
    }).filter((option, index, all) => all.findIndex(item => item.value === option.value) === index);
    if (!options.length) return undefined;
    const fallback = typeof data.default === 'string' && options.some(option => option.value === data.default) ? data.default : undefined;
    return { kind: 'enum', options, ...(fallback ? { default: fallback } : {}), ...(typeof data.source === 'string' ? { source: data.source.slice(0, 50) } : {}) };
  }
  if (data.kind === 'budget') {
    const min = Number(data.min), max = Number(data.max), fallback = Number(data.default);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return undefined;
    return { kind: 'budget', min, max, ...(Number.isFinite(fallback) && fallback >= min && fallback <= max ? { default: fallback } : {}), ...(typeof data.source === 'string' ? { source: data.source.slice(0, 50) } : {}) };
  }
  if (data.kind === 'boolean') return { kind: 'boolean', ...(typeof data.default === 'boolean' ? { default: data.default } : {}), ...(typeof data.source === 'string' ? { source: data.source.slice(0, 50) } : {}) };
  if (data.kind === 'unsupported') return { kind: 'unsupported' };
  if (data.kind === 'unknown') return { kind: 'unknown', ...(typeof data.source === 'string' ? { source: data.source.slice(0, 50) } : {}) };
  return undefined;
}

/**
 * Keep exact, bounded, unique model IDs. Empty IDs are rejected, duplicate IDs
 * are removed, and a missing display name falls back to the ID.
 */
export function normalizeModels(raw: Array<{ id?: unknown; name?: unknown; description?: unknown; reasoning?: unknown }>, limit = MODEL_LIMIT): ModelOption[] {
  const models: ModelOption[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (!value || typeof value !== 'object') continue;
    const id = typeof value.id === 'string' ? value.id.trim() : '';
    if (!id || id.length > MODEL_ID_LIMIT || seen.has(id)) continue;
    seen.add(id);
    const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, MODEL_ID_LIMIT) : id;
    const description = typeof value.description === 'string' && value.description.trim() ? value.description.trim().slice(0, 1000) : undefined;
    const reasoning = reasoningCapability(value.reasoning);
    models.push({ id, name, ...(description ? { description } : {}), ...(reasoning ? { reasoning } : {}) });
    if (models.length >= limit) break;
  }
  return models;
}
