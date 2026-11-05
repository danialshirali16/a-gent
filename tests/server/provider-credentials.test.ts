import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ProviderManager } from '../../server/providers.js';
import { MemorySecretStore, createSecretStore } from '../../server/secrets.js';

process.env.AGENT_ALLOW_LOCAL_PROVIDER_ENDPOINTS = '1';
const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

test('provider keys use the secret store, restore with it, and clear on disconnect', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-provider-credentials-'));
  const server = createServer((request, response) => {
    if (request.url === '/models') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ data: [{ id: 'model-a' }, { id: 'model-b' }] }));
      return;
    }
    response.statusCode = 404;
    response.end('{}');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server did not bind');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const secrets = new MemorySecretStore();
  try {
    const manager = new ProviderManager(directory, () => {}, undefined, undefined, secrets);
    await manager.load();
    const connected = await manager.connect('openai-compatible', { baseUrl, apiKey: 'sk-test-key' });
    assert.equal(connected.readiness, 'ready');
    assert.equal(connected.hasStoredKey, true);
    assert.equal(connected.credentialMode, 'session');
    assert.equal(await secrets.get('api-key', { kind: 'provider', id: 'openai-compatible' }), 'sk-test-key');

    const restored = new ProviderManager(directory, () => {}, undefined, undefined, secrets);
    await restored.load();
    assert.equal(restored.get('openai-compatible').hasStoredKey, true);

    const disconnected = await manager.disconnect('openai-compatible');
    assert.equal(disconnected.hasStoredKey, false);
    assert.equal(disconnected.readiness, 'configured');
    assert.equal(await secrets.get('api-key', { kind: 'provider', id: 'openai-compatible' }), undefined);
    await manager.close(); await restored.close();
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});

test('secret storage policy defaults to session outside macOS and accepts an explicit mode', () => {
  assert.equal(createSecretStore(scratch, 'session').kind, 'memory');
  const keychain = createSecretStore(scratch, 'keychain');
  assert.equal(keychain.kind, process.platform === 'darwin' ? 'keychain' : 'memory');
});
