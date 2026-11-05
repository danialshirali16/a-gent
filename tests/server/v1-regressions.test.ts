import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ProviderManager } from '../../server/providers.js';
import { RunManager } from '../../server/runs.js';
import { InteractionStore } from '../../server/interactions.js';
import { exportWorkspace, StateStore } from '../../server/store.js';
import { codexCompatibility } from '../../server/codex-discovery.js';
import type { ProviderRequest } from '../../server/codex.js';
import type { ProviderInfo } from '../../shared/types.js';

const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor<T>(get: () => T | Promise<T>, matches: (value: T) => boolean, milliseconds = 5000): Promise<T> {
  const deadline = Date.now() + milliseconds;
  do { const value = await get(); if (matches(value)) return value; await pause(10); } while (Date.now() < deadline);
  throw new Error('Timed out waiting for expected state.');
}

function readyCodex(): ProviderInfo {
  return { id: 'codex', name: 'Codex', kind: 'codex', status: 'connected', readiness: 'ready', detail: 'Ready', models: [] };
}

function fakeProviders(onRun: (request: ProviderRequest) => Promise<void>): ProviderManager {
  return {
    get: () => readyCodex(),
    run: async (_providerId: string, request: ProviderRequest) => onRun(request),
    close: async () => {},
  } as unknown as ProviderManager;
}

async function makeManager(directory: string, providers: ProviderManager) {
  const store = new StateStore(directory); await store.load();
  const interactions = new InteractionStore(directory, 'v1-regression-host'); await interactions.load();
  const manager = new RunManager(store, providers, () => {}, interactions);
  return { store, interactions, manager };
}

test('Codex compatibility accepts the verified 0.166 line and rejects drift actionably', () => {
  assert.equal(codexCompatibility('0.166.0').supported, true);
  assert.equal(codexCompatibility('0.166.9').supported, true);
  assert.equal(codexCompatibility('0.166.0-alpha.1').supported, false);
  assert.match(codexCompatibility('0.166.0-alpha.1').detail, /pre-release|stable/);
  assert.equal(codexCompatibility('0.167.0').supported, false);
  assert.match(codexCompatibility('0.167.0').detail, /not supported/);
  assert.equal(codexCompatibility(undefined).supported, false);
});

test('an initial save failure releases the reservation and keeps one recoverable prompt', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-initial-save-'));
  let prompts = 0;
  const providers = fakeProviders(async request => { prompts++; request.callbacks.delta('Recovered response'); });
  const { store, manager } = await makeManager(directory, providers);
  const conversation = store.createConversation('primary');
  const originalPublish = manager.publishState.bind(manager);
  let fail = true;
  manager.publishState = async () => {
    if (fail) { fail = false; throw new Error('disk full'); }
    await originalPublish();
  };
  try {
    await assert.rejects(() => manager.send(conversation.id, { content: 'Do not lose this' }), /disk full/);
    assert.equal(manager.runs.size, 0, 'no phantom run remains reserved');
    assert.equal(conversation.messages.length, 0, 'the failed attempt is rolled back');
    assert.equal(prompts, 0, 'the provider never starts after the failed save');
    const run = await manager.send(conversation.id, { content: 'Do not lose this' });
    assert.ok(run.id);
    assert.equal(conversation.messages.filter(message => message.role === 'user').length, 1, 'retry does not duplicate the prompt');
    await waitFor(() => conversation.messages.at(-1)?.status, status => status === 'completed');
    assert.equal(prompts, 1);
    assert.equal(conversation.messages.at(-1)?.content, 'Recovered response');
  } finally { await manager.close(); await rm(directory, { recursive: true, force: true }); }
});

test('Codex probe exposes missing installation and signed-out recovery copy', async () => {
  const missingDir = await mkdtemp(join(scratch, 'agent-codex-missing-'));
  const missing = new ProviderManager(missingDir, () => {}, { info: async () => { throw new Error('Codex CLI was not found in the standard installation locations. Install the official Codex CLI, run codex login, then reconnect.'); }, close: async () => {} } as any);
  try {
    const provider = await missing.probeCodex();
    assert.equal(provider.readiness, 'error');
    assert.equal(provider.status, 'unavailable');
    assert.match(provider.detail, /Install the official Codex CLI/);
  } finally { await missing.close(); await rm(missingDir, { recursive: true, force: true }); }

  const signedOutDir = await mkdtemp(join(scratch, 'agent-codex-signedout-'));
  const signedOut = new ProviderManager(signedOutDir, () => {}, { info: async () => ({ authenticated: false, models: [{ id: 'm', name: 'm' }] }), close: async () => {} } as any);
  try {
    const provider = await signedOut.probeCodex();
    assert.equal(provider.readiness, 'needs-auth');
    assert.equal(provider.status, 'available');
    assert.match(provider.detail, /codex login/);
  } finally { await signedOut.close(); await rm(signedOutDir, { recursive: true, force: true }); }
});

test('a stale Codex probe cannot restore readiness after Forget', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-stale-probe-'));
  let release!: (value: { authenticated: boolean; models: Array<{ id: string; name: string }> }) => void;
  const pending = new Promise<{ authenticated: boolean; models: Array<{ id: string; name: string }> }>(resolve => { release = resolve; });
  const codex = { info: () => pending, close: async () => {} } as any;
  const providers = new ProviderManager(directory, () => {}, codex);
  try {
    const probe = providers.probeCodex();
    await pause(10);
    await providers.disconnect('codex');
    release({ authenticated: true, models: [{ id: 'late-model', name: 'Late model' }] });
    const result = await probe;
    assert.equal(result.readiness, 'configured', 'the forgotten provider stays forgotten');
    assert.equal(result.models.length, 0);
    assert.equal(providers.get('codex').readiness, 'configured');
  } finally { await providers.close(); await rm(directory, { recursive: true, force: true }); }
});

test('Stop stays truthful until cleanup and enforces one active run per host', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-stop-cleanup-'));
  let started!: () => void;
  const startedPromise = new Promise<void>(resolve => { started = resolve; });
  let releaseCleanup!: () => void;
  const cleanup = new Promise<void>(resolve => { releaseCleanup = resolve; });
  let calls = 0;
  const providers = fakeProviders(async request => {
    calls++;
    if (calls > 1) { request.callbacks.delta('After cleanup'); return; }
    started();
    await new Promise<void>(resolve => {
      if (request.signal.aborted) resolve();
      else request.signal.addEventListener('abort', () => resolve(), { once: true });
    });
    await cleanup;
  });
  const { store, manager } = await makeManager(directory, providers);
  const first = store.createConversation('primary');
  const second = store.createConversation('primary');
  try {
    const run = await manager.send(first.id, { content: 'Long task' });
    await startedPromise;
    const stopping = manager.interrupt(run.id);
    assert.equal(stopping.status, 'stopping', 'Stop does not claim interruption before cleanup');
    await assert.rejects(() => manager.send(second.id, { content: 'Too early' }), (error: any) => error.status === 409 && /one task at a time/.test(error.message));
    releaseCleanup();
    await waitFor(() => first.messages.at(-1)?.status, status => status === 'interrupted');
    assert.equal(manager.interrupt(run.id).status, 'interrupted');
    const next = await manager.send(second.id, { content: 'After cleanup' });
    assert.ok(next.id, 'the host accepts a new run only after cleanup');
    await waitFor(() => second.messages.at(-1)?.status, status => status === 'completed');
  } finally { releaseCleanup(); await manager.close(); await rm(directory, { recursive: true, force: true }); }
});

test('shutdown waits for cleanup and persists an active run as interrupted', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-shutdown-interrupt-'));
  let started!: () => void;
  const startedPromise = new Promise<void>(resolve => { started = resolve; });
  const providers = fakeProviders(async request => {
    started();
    await new Promise<void>(resolve => {
      if (request.signal.aborted) resolve();
      else request.signal.addEventListener('abort', () => resolve(), { once: true });
    });
  });
  const { store, manager } = await makeManager(directory, providers);
  const conversation = store.createConversation('primary');
  try {
    await manager.send(conversation.id, { content: 'Work during quit' });
    await startedPromise;
    await manager.close();
    const persisted = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')) as any;
    const saved = persisted.conversations.find((item: any) => item.id === conversation.id);
    assert.equal(saved.messages.at(-1).status, 'interrupted');
    assert.equal(saved.messages.at(-1).content, '');
  } finally { await manager.close().catch(() => {}); await rm(directory, { recursive: true, force: true }); }
});

test('v1 dispatch ignores stale saved reasoning and uses the provider default', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-default-reasoning-'));
  let captured: ProviderRequest | undefined;
  const providers = fakeProviders(async request => { captured = request; request.callbacks.delta('Default response'); });
  const { store, manager } = await makeManager(directory, providers);
  store.state.agents[0].reasoningEffort = 'high';
  const conversation = store.createConversation('primary');
  conversation.reasoningEffort = 'max';
  try {
    await manager.send(conversation.id, { content: 'Use default reasoning' });
    await waitFor(() => conversation.messages.at(-1)?.status, status => status === 'completed');
    assert.ok(captured);
    assert.equal(captured.agent.reasoningEffort, '', 'stale effort is not submitted');
    assert.equal(captured.reasoning, undefined, 'the adapter receives no explicit reasoning capability');
    assert.equal(store.state.agents[0].reasoningEffort, 'high', 'saved metadata is preserved');
    assert.equal(conversation.reasoningEffort, 'max', 'saved metadata is preserved');
  } finally { await manager.close(); await rm(directory, { recursive: true, force: true }); }
});

test('portable export omits runtime thread IDs, bindings, and credential references', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-export-sanitize-'));
  const store = new StateStore(directory); await store.load();
  const conversation = store.createConversation('primary');
  conversation.providerThreadId = 'private-thread';
  conversation.providerBinding = { providerId: 'codex', providerKind: 'codex', providerThreadId: 'private-thread', workspaceId: '/tmp/project', modelId: 'm', updatedAt: new Date().toISOString() };
  store.state.apps.push({ id: 'app-1', name: 'Private app', scope: 'global', ownership: 'external', enabled: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), providerId: 'codex', transport: 'stdio', credentialRef: 'provider:codex:secret-ref' });
  const exported = exportWorkspace(store.state);
  const serialized = JSON.stringify(exported);
  assert.ok(!serialized.includes('private-thread'));
  assert.ok(!serialized.includes('providerBinding'));
  assert.ok(!serialized.includes('providerThreadId'));
  assert.ok(!serialized.includes('credentialRef'));
  assert.equal(conversation.providerThreadId, 'private-thread', 'the live workspace retains its binding');
  assert.ok(conversation.providerBinding);
  await rm(directory, { recursive: true, force: true });
});

test('saved connection model IDs are preserved exactly or rejected, never truncated', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-model-id-load-'));
  try {
    const exact = 'm'.repeat(200);
    await writeFile(join(directory, 'connections.json'), JSON.stringify({ ollama: { baseUrl: 'http://127.0.0.1:11434', modelId: `${exact}x` } }));
    const rejected = new ProviderManager(directory, () => {}); await rejected.load();
    assert.equal(rejected.get('ollama').modelId, undefined, 'an over-limit saved ID is rejected instead of silently sliced');
    await rejected.close();
    await writeFile(join(directory, 'connections.json'), JSON.stringify({ ollama: { baseUrl: 'http://127.0.0.1:11434', modelId: exact } }));
    const preserved = new ProviderManager(directory, () => {}); await preserved.load();
    assert.equal(preserved.get('ollama').modelId, exact);
    await preserved.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});
