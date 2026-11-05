import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isProviderReady, MODEL_ID_LIMIT, MODEL_LIMIT, normalizeModels, providerCapabilities, providerReadiness, readinessLabel } from '../../shared/providers.js';
import { validateProviderUrl } from '../../server/providers.js';
import type { ProviderInfo } from '../../shared/types.js';

function provider(overrides: Partial<ProviderInfo> = {}): ProviderInfo {
  return { id: 'codex', name: 'Codex', kind: 'codex', status: 'available', detail: '', models: [], ...overrides };
}

test('provider readiness distinguishes legacy status from explicit lifecycle state', () => {
  assert.equal(providerReadiness(provider({ status: 'connected' })), 'ready');
  assert.equal(providerReadiness(provider({ status: 'available' })), 'configured');
  assert.equal(providerReadiness(provider({ status: 'unavailable' })), 'disabled');
  assert.equal(providerReadiness(provider({ status: 'error' })), 'error');
  assert.equal(providerReadiness(provider({ status: 'available', readiness: 'ready' })), 'ready');
  assert.equal(isProviderReady(provider({ status: 'connected' })), true);
  assert.equal(isProviderReady(provider({ status: 'available', readiness: 'needs-auth' })), false);
  assert.equal(readinessLabel(provider({ readiness: 'needs-auth' })), 'Sign-in needed');
});

test('provider capabilities distinguish agent runtimes from text-only endpoints', () => {
  const codex = providerCapabilities('codex');
  const opencode = providerCapabilities('opencode');
  const ollama = providerCapabilities('ollama');
  const http = providerCapabilities('openai-compatible');
  assert.equal(codex.tools, true);
  assert.equal(codex.approvals, true);
  assert.equal(codex.auth, 'external');
  assert.equal(codex.cancellation, 'turn');
  assert.equal(opencode.tools, true);
  assert.equal(opencode.approvals, false);
  assert.equal(opencode.auth, 'external');
  assert.equal(opencode.cancellation, 'process');
  assert.equal(ollama.tools, false);
  assert.equal(ollama.auth, 'none');
  assert.equal(ollama.cancellation, 'stream');
  assert.equal(http.reasoning, false);
  assert.equal(http.auth, 'api-key');
  assert.equal(http.cancellation, 'stream');
  assert.equal('stt' in codex, false, 'speech-to-text remains a separate connection');
});

test('model normalization rejects empty IDs, deduplicates, falls back names, and bounds size', () => {
  const models = normalizeModels([
    { id: '', name: 'Empty' },
    { id: '  ', name: 'Whitespace' },
    { id: 'model-a', name: '  ' },
    { id: 'model-a', name: 'Duplicate' },
    { id: 'model-b', name: 'Model B', description: 'Description' },
    { id: 'x'.repeat(MODEL_ID_LIMIT + 1), name: 'Too long' },
  ]);
  assert.deepEqual(models, [
    { id: 'model-a', name: 'model-a' },
    { id: 'model-b', name: 'Model B', description: 'Description' },
  ]);
  const many = normalizeModels(Array.from({ length: MODEL_LIMIT + 10 }, (_, index) => ({ id: `m-${index}`, name: `Model ${index}` })));
  assert.equal(many.length, MODEL_LIMIT);
  assert.equal(many[0].id, 'm-0');
  assert.equal(many.at(-1)?.id, `m-${MODEL_LIMIT - 1}`);
});

test('provider URLs block local, metadata, insecure-remote, and credential-bearing endpoints', () => {
  assert.equal(validateProviderUrl('http://127.0.0.1:11434', { allowLocal: true }), 'http://127.0.0.1:11434');
  assert.throws(() => validateProviderUrl('http://127.0.0.1:11434'), /Local endpoints/);
  assert.throws(() => validateProviderUrl('http://169.254.169.254/latest/meta-data'), /Local endpoints|not allowed/);
  assert.throws(() => validateProviderUrl('http://api.example.test/v1'), /HTTPS/);
  assert.equal(validateProviderUrl('https://api.example.test/v1'), 'https://api.example.test/v1');
  assert.throws(() => validateProviderUrl('https://user:pass@api.example.test/v1'), /embedded credentials/);
});

test('model reasoning metadata is preserved only when it is verified and bounded', () => {
  const [model] = normalizeModels([{ id: 'm', name: 'Model', reasoning: { kind: 'enum', options: [{ value: 'low', description: 'Fast' }, { value: 'high' }], default: 'high', source: 'codex' } }]);
  assert.deepEqual(model.reasoning, { kind: 'enum', options: [{ value: 'low', description: 'Fast' }, { value: 'high' }], default: 'high', source: 'codex' });
  const [invalidDefault] = normalizeModels([{ id: 'm', reasoning: { kind: 'enum', options: [{ value: 'low' }], default: 'high' } }]);
  assert.equal(invalidDefault.reasoning?.kind, 'enum');
  assert.equal(invalidDefault.reasoning?.kind === 'enum' ? invalidDefault.reasoning.default : undefined, undefined);
  const [unknown] = normalizeModels([{ id: 'm', reasoning: { kind: 'unsupported' } }]);
  assert.deepEqual(unknown.reasoning, { kind: 'unsupported' });
  const [budget] = normalizeModels([{ id: 'budget', reasoning: { kind: 'budget', min: 128, max: 4096, default: 1024 } }]);
  assert.deepEqual(budget.reasoning, { kind: 'budget', min: 128, max: 4096, default: 1024 });
  const [one] = normalizeModels([{ id: 'one', reasoning: { kind: 'enum', options: [{ value: 'only', label: 'A very long but valid reasoning label' }], default: 'only' } }]);
  assert.equal(one.reasoning?.kind === 'enum' ? one.reasoning.options.length : 0, 1);
  assert.equal(one.reasoning?.kind === 'enum' ? one.reasoning.default : undefined, 'only');
});
