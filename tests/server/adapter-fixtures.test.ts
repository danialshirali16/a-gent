import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ProviderManager } from '../../server/providers.js';
import { MemorySecretStore } from '../../server/secrets.js';
import type { ProviderRequest } from '../../server/codex.js';

process.env.AGENT_ALLOW_LOCAL_PROVIDER_ENDPOINTS = '1';
const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

test('HTTP provider fixtures distinguish auth, malformed catalog, empty completion, and model removal', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-adapter-fixtures-'));
  let mode: 'auth' | 'malformed' | 'valid' | 'removed' | 'empty' = 'auth';
  const server = createServer((request, response) => {
    if (request.url === '/models') {
      if (mode === 'auth') { response.statusCode = 401; response.end('unauthorized'); return; }
      if (mode === 'malformed') { response.setHeader('Content-Type', 'application/json'); response.end('{not json'); return; }
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ data: mode === 'valid' ? [{ id: 'model-a' }, { id: 'model-b' }] : [{ id: 'model-b' }] }));
      return;
    }
    if (request.url === '/chat/completions') {
      response.setHeader('Content-Type', 'text/event-stream');
      response.end('data: {"choices":[{"delta":{}}]}\n\ndata: [DONE]\n\n');
      return;
    }
    response.statusCode = 404; response.end('{}');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server did not bind');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const manager = new ProviderManager(directory, () => {}, undefined, undefined, new MemorySecretStore());
    await manager.load();
    const auth = await manager.connect('openai-compatible', { baseUrl, apiKey: 'bad' });
    assert.equal(auth.readiness, 'error');
    assert.equal(auth.errorKind, 'auth');

    mode = 'malformed';
    const malformed = await manager.connect('openai-compatible', { baseUrl, apiKey: 'bad' });
    assert.equal(malformed.readiness, 'error');

    mode = 'valid';
    const ready = await manager.connect('openai-compatible', { baseUrl, apiKey: 'good' });
    assert.equal(ready.readiness, 'ready');
    assert.deepEqual(ready.models.map(model => model.id), ['model-a', 'model-b']);

    mode = 'empty';
    const timestamp = new Date().toISOString();
    const request: ProviderRequest = {
      agent: { id: 'a', name: 'A', description: '', instructions: '', color: '#112233', icon: 'spark', providerId: 'openai-compatible', modelId: 'model-a', reasoningEffort: '', createdAt: timestamp },
      conversation: { id: 'c', agentId: 'a', title: 'Test', createdAt: timestamp, updatedAt: timestamp, messages: [{ id: 'm', role: 'user', content: 'hi', createdAt: timestamp }] },
      modelId: 'model-a', mode: 'chat', workspace: directory, signal: AbortSignal.timeout(5000),
      callbacks: { delta: () => {}, activity: () => {}, approval: () => {}, thread: () => {} },
    };
    await assert.rejects(manager.run('openai-compatible', request), /no text/);

    mode = 'removed';
    const removed = await manager.connect('openai-compatible', { baseUrl, apiKey: 'good', modelId: 'model-b' });
    assert.ok(!removed.models.some(model => model.id === 'model-a'), 'removed catalog entries disappear');
    await manager.close();
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
