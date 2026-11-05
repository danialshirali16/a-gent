import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ConfigStore } from '../../server/config-store.js';
import { FileSecretStore, KeychainSecretStore, MemorySecretStore, type SecretOwner } from '../../server/secrets.js';
import { StateStore } from '../../server/store.js';

const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

type ProviderConfig = { baseUrl: string; model?: string };

function validateConfig(value: unknown): ProviderConfig {
  const data = value as Record<string, unknown>;
  if (!data || typeof data.baseUrl !== 'string' || !data.baseUrl) throw new Error('baseUrl is required');
  if (data.model !== undefined && typeof data.model !== 'string') throw new Error('model must be a string');
  return { baseUrl: data.baseUrl, ...(data.model === undefined ? {} : { model: data.model }) };
}

test('typed config is owner-scoped, migrates a legacy shape, and recovers its backup', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-config-store-'));
  try {
    const store = new ConfigStore(directory, { kind: 'provider', id: 'openai' }, 1, validateConfig, { baseUrl: 'http://default' });
    await store.load();
    await store.set({ baseUrl: 'http://one', model: 'one' });
    assert.deepEqual(store.get(), { baseUrl: 'http://one', model: 'one' });
    await assert.rejects(store.set({ baseUrl: '' }), /baseUrl/);

    const reloaded = new ConfigStore(directory, { kind: 'provider', id: 'openai' }, 1, validateConfig, { baseUrl: 'http://default' });
    await reloaded.load();
    assert.deepEqual(reloaded.get(), { baseUrl: 'http://one', model: 'one' });

    await writeFile(join(directory, 'config.json'), '{broken');
    const recovered = new ConfigStore(directory, { kind: 'provider', id: 'openai' }, 1, validateConfig, { baseUrl: 'http://default' });
    await recovered.load();
    assert.deepEqual(recovered.get(), { baseUrl: 'http://default' }, 'backup is the previous generation');

    const wrongOwner = new ConfigStore(directory, { kind: 'provider', id: 'other' }, 1, validateConfig, { baseUrl: 'http://default' });
    await assert.rejects(wrongOwner.load(), /another owner/);
    await store.close(); await reloaded.close(); await recovered.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('config migration accepts a legacy raw file and a failed set leaves the old value intact', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-config-legacy-'));
  const moved = `${directory}-moved`;
  try {
    await writeFile(join(directory, 'config.json'), JSON.stringify({ baseUrl: 'http://legacy' }));
    const store = new ConfigStore(directory, { kind: 'provider', id: 'legacy' }, 1, validateConfig, { baseUrl: 'http://default' }, { migrateLegacy: raw => raw });
    await store.load();
    assert.deepEqual(store.get(), { baseUrl: 'http://legacy' });
    await rename(directory, moved);
    await assert.rejects(store.set({ baseUrl: 'http://next' }));
    assert.deepEqual(store.get(), { baseUrl: 'http://legacy' });
    await rename(moved, directory);
    await store.close();
  } finally {
    await rename(moved, directory).catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});

test('memory secret store separates references by owner', async () => {
  const store = new MemorySecretStore();
  const owner: SecretOwner = { kind: 'provider', id: 'openai' };
  const other: SecretOwner = { kind: 'provider', id: 'cloud' };
  await store.set({ id: 'api-key', owner, secret: 'one' });
  await store.set({ id: 'api-key', owner: other, secret: 'two' });
  assert.equal(await store.get('api-key', owner), 'one');
  assert.equal(await store.get('api-key', other), 'two');
  assert.equal(store.list(owner).length, 1);
  assert.equal(store.list().length, 2);
  assert.equal(await store.delete('api-key', owner), true);
  assert.equal(await store.get('api-key', owner), undefined);
});

test('file secret store encrypts values, reloads them, and tracks owner references', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-secrets-file-'));
  try {
    const store = new FileSecretStore(directory);
    await store.load();
    const owner: SecretOwner = { kind: 'provider', id: 'openai' };
    const other: SecretOwner = { kind: 'speech', id: 'elevenlabs' };
    await store.set({ id: 'api-key', owner, secret: 'sk-super-secret-value' });
    await store.set({ id: 'speech-key', owner: other, secret: 'eleven-secret-value' });
    const raw = await readFile(join(directory, 'secrets.json'), 'utf8');
    assert.ok(!raw.includes('sk-super-secret-value'));
    assert.ok(!raw.includes('eleven-secret-value'));
    assert.equal(await store.get('api-key', owner), 'sk-super-secret-value');
    assert.equal(await store.get('api-key', other), undefined);
    assert.equal(store.list(owner).length, 1);
    assert.equal(store.list(other)[0].owner.kind, 'speech');
    const state = new StateStore(directory); await state.load();
    assert.ok(!JSON.stringify(state.state).includes('sk-super-secret-value'), 'workspace exports do not contain credential values');
    await state.close();

    const reloaded = new FileSecretStore(directory);
    await reloaded.load();
    assert.equal(await reloaded.get('api-key', owner), 'sk-super-secret-value');
    assert.equal(await reloaded.delete('api-key', owner), true);
    assert.equal(await reloaded.get('api-key', owner), undefined);
    await store.close(); await reloaded.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('keychain adapter maps missing items and locked/unavailable errors', async () => {
  const calls: string[][] = [];
  const store = new KeychainSecretStore(async args => {
    calls.push(args);
    if (args[0] === 'find-generic-password') return { stdout: 'keychain-secret\n' };
    return { stdout: '' };
  });
  const owner: SecretOwner = { kind: 'provider', id: 'openai' };
  await store.set({ id: 'api-key', owner, secret: 'keychain-secret' });
  assert.equal(await store.get('api-key', owner), 'keychain-secret');
  assert.equal(await store.delete('api-key', owner), true);
  assert.equal(calls.length, 3);

  const missing = new KeychainSecretStore(async () => { throw Object.assign(new Error('missing'), { code: 44 }); });
  assert.equal(await missing.get('api-key', owner), undefined);
  assert.equal(await missing.delete('api-key', owner), false);

  const locked = new KeychainSecretStore(async () => { throw Object.assign(new Error('locked'), { code: 1 }); });
  await assert.rejects(locked.get('api-key', owner), /Keychain is unavailable or locked/);
  await assert.rejects(locked.set({ id: 'api-key', owner, secret: 'x' }), /Keychain|locked|add-generic/);
});

test('file secret store recovers its backup and rolls back a failed write', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-secrets-recovery-'));
  const moved = `${directory}-moved`;
  try {
    const store = new FileSecretStore(directory);
    await store.load();
    const owner: SecretOwner = { kind: 'provider', id: 'openai' };
    await store.set({ id: 'first', owner, secret: 'first-secret' });
    await store.set({ id: 'second', owner, secret: 'second-secret' });

    await rename(directory, moved);
    await assert.rejects(store.set({ id: 'third', owner, secret: 'third-secret' }));
    assert.deepEqual(store.list(owner).map(item => item.id), ['first', 'second']);
    await rename(moved, directory);

    await writeFile(join(directory, 'secrets.json'), '{broken');
    const recovered = new FileSecretStore(directory);
    await recovered.load();
    assert.equal(await recovered.get('first', owner), 'first-secret');
    await store.close(); await recovered.close();
  } finally {
    await rename(moved, directory).catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});
