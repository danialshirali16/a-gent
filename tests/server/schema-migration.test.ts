import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CURRENT_WORKSPACE_VERSION, initialState, now, StateStore, validateImport } from '../../server/store.js';
import type { WorkspaceState } from '../../shared/types.js';

const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

function legacyWorkspace(): Record<string, unknown> {
  const state = initialState();
  const legacy = JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
  legacy.version = 1;
  delete legacy.apps;
  delete legacy.skills;
  const agent = (legacy.agents as Array<Record<string, unknown>>)[0];
  agent.reasoningEffort = 'high';
  agent.providerProfileId = 'codex-local';
  const createdAt = now();
  legacy.conversations = [{
    id: 'chat-1', agentId: 'primary', title: 'Legacy chat', createdAt, updatedAt: createdAt,
    messages: [{ id: 'm1', role: 'assistant', content: 'Saved answer', createdAt, status: 'completed' }],
    providerThreadId: 'thread-1',
  }];
  (legacy.settings as Record<string, unknown>).speech = { provider: 'elevenlabs', modelId: 'scribe_v2', language: 'en', credentialMode: 'session' };
  return legacy;
}

function app(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const createdAt = now();
  return {
    id: 'app-1', name: 'GitHub', scope: 'agent', scopeId: 'primary', ownership: 'managed', enabled: true, createdAt, updatedAt: createdAt,
    providerId: 'codex', transport: 'http', source: 'https://example.test/mcp', toolsCount: 4,
    hostId: 'host-1', workspacePath: '/work/project', credentialRef: 'provider:codex:app-1', lastCheckedAt: createdAt,
    capabilitySnapshot: { tools: ['issues', 'pull_requests'], resources: 2, prompts: 0, serverVersion: '1.0.0', authStatus: 'oAuth' },
    ...overrides,
  };
}

function skill(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const createdAt = now();
  return { id: 'skill-1', name: 'Review', scope: 'global', ownership: 'external', enabled: false, createdAt, updatedAt: createdAt, format: 'agent-skills', sourcePath: '/tmp/review', ...overrides };
}

test('workspace v1 migrates to v2 and survives backup recovery', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-schema-migration-'));
  try {
    const legacy = legacyWorkspace();
    await writeFile(join(directory, 'state.json'), JSON.stringify(legacy));

    const store = new StateStore(directory);
    await store.load();
    assert.equal(store.state.version, CURRENT_WORKSPACE_VERSION);
    assert.deepEqual(store.state.apps, []);
    assert.deepEqual(store.state.skills, []);
    assert.equal(store.state.agents[0].reasoningEffort, 'high');
    assert.equal(store.state.agents[0].providerProfileId, 'codex-local');
    assert.equal(store.state.conversations[0].messages[0].content, 'Saved answer');
    assert.equal(store.state.conversations[0].providerThreadId, 'thread-1');
    assert.equal(store.state.conversations[0].providerBinding?.providerId, 'codex');
    assert.equal(store.state.conversations[0].providerBinding?.providerThreadId, 'thread-1');
    assert.equal(store.state.settings.speech?.credentialMode, 'session');
    await store.save();

    const primary = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')) as WorkspaceState;
    const backup = JSON.parse(await readFile(join(directory, 'state.json.bak'), 'utf8')) as Record<string, unknown>;
    assert.equal(primary.version, 2);
    assert.equal(backup.version, 1);

    await writeFile(join(directory, 'state.json'), '{broken');
    const recovered = new StateStore(directory);
    await recovered.load();
    assert.equal(recovered.state.version, 2);
    assert.equal(recovered.state.conversations[0].messages[0].content, 'Saved answer');
    assert.equal(recovered.state.conversations[0].providerBinding?.providerThreadId, 'thread-1');
    await recovered.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('workspace v2 preserves bindings, scoped apps/skills, effort, and non-secret speech settings', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-schema-v2-'));
  try {
    const store = new StateStore(directory);
    await store.load();
    const conversation = store.createConversation('primary');
    conversation.reasoningEffort = 'high';
    conversation.providerThreadId = 'thread-2';
    conversation.providerBinding = { providerId: 'codex', providerKind: 'codex', accountId: 'account-1', workspaceId: 'workspace-1', modelId: 'gpt-5.2', providerThreadId: 'thread-2', updatedAt: now() };
    store.state.apps.push(app() as never);
    store.state.skills.push(skill() as never);
    store.state.settings.speech = { provider: 'elevenlabs', modelId: 'scribe_v2', language: 'en', credentialMode: 'session' };
    await store.save();

    const reloaded = new StateStore(directory);
    await reloaded.load();
    assert.equal(reloaded.state.version, 2);
    assert.equal(reloaded.state.conversations[0].reasoningEffort, 'high');
    assert.equal(reloaded.state.conversations[0].providerBinding?.accountId, 'account-1');
    assert.equal(reloaded.state.apps[0].scopeId, 'primary');
    assert.equal(reloaded.state.apps[0].toolsCount, 4);
    assert.equal(reloaded.state.apps[0].hostId, 'host-1');
    assert.equal(reloaded.state.apps[0].workspacePath, '/work/project');
    assert.equal(reloaded.state.apps[0].credentialRef, 'provider:codex:app-1');
    assert.deepEqual(reloaded.state.apps[0].capabilitySnapshot?.tools, ['issues', 'pull_requests']);
    assert.equal(reloaded.state.apps[0].capabilitySnapshot?.serverVersion, '1.0.0');
    assert.equal(reloaded.state.skills[0].scope, 'global');
    assert.equal(reloaded.state.skills[0].enabled, false);
    assert.equal(reloaded.state.settings.speech?.modelId, 'scribe_v2');

    const exported = validateImport(reloaded.state);
    assert.equal(exported.version, 2);
    assert.equal(exported.conversations[0].providerBinding, undefined);
    assert.equal(exported.conversations[0].providerThreadId, undefined);
    assert.equal(exported.conversations[0].reasoningEffort, 'high');
    assert.equal(exported.apps.length, 1);
    assert.equal(exported.skills.length, 1);
    assert.equal(exported.settings.speech?.credentialMode, 'session');
    await reloaded.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('workspace validation rejects unsupported versions, scopes, ownership, speech, and duplicate resources', () => {
  const base = initialState();
  assert.throws(() => validateImport({ ...base, version: 99 }), /version is not supported/);
  assert.throws(() => validateImport({ ...base, apps: [app({ scope: 'agent', scopeId: 'missing' })] }), /unknown agent/);
  assert.throws(() => validateImport({ ...base, skills: [skill({ ownership: 'remote' })] }), /managed or external/);
  assert.throws(() => validateImport({ ...base, settings: { ...base.settings, speech: { provider: 'other', credentialMode: 'keychain' } } }), /ElevenLabs/);
  assert.throws(() => validateImport({ ...base, settings: { ...base.settings, speech: { provider: 'elevenlabs', credentialMode: 'plain' } } }), /keychain or session/);
  assert.throws(() => validateImport({ ...base, apps: [app(), app()] }), /Duplicate IDs in imported apps/);
  assert.throws(() => validateImport({ ...base, skills: [skill(), skill()] }), /Duplicate IDs in imported skills/);
});

test('merge adds scoped resources without replacing existing records', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-schema-merge-'));
  try {
    const target = new StateStore(directory);
    await target.load();
    const source = initialState();
    source.apps.push(app() as never);
    source.skills.push(skill() as never);
    await target.merge(source);
    assert.equal(target.state.apps.length, 1);
    assert.equal(target.state.skills.length, 1);
    const again = initialState();
    again.apps.push(app({ id: 'app-2', name: 'Slack' }) as never);
    await target.merge(again);
    assert.equal(target.state.apps.length, 2);
    assert.equal(target.state.apps.find(item => item.id === 'app-1')?.name, 'GitHub');
    await target.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});
