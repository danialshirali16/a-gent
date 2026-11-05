import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { InteractionStore } from '../../server/interactions.js';
import type { PendingInteraction } from '../../shared/types.js';

const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

function interaction(overrides: Partial<PendingInteraction> = {}): PendingInteraction {
  const createdAt = new Date().toISOString();
  return {
    id: 'interaction-1', hostId: 'host-a', runId: 'run-1', conversationId: 'chat-1', providerId: 'codex',
    threadId: 'thread-1', kind: 'approval', title: 'Approve command', description: 'Fixture', command: 'echo test',
    status: 'pending', createdAt, updatedAt: createdAt, ...overrides,
  };
}

test('pending interactions are correlated and expire on the next host load', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-interactions-'));
  try {
    const first = new InteractionStore(directory, 'host-a');
    await first.load();
    await first.upsert(interaction());
    assert.equal(first.list().length, 1);
    assert.equal(first.list()[0].runId, 'run-1');
    assert.equal(first.list()[0].threadId, 'thread-1');
    assert.ok(first.list()[0].expiresAt, 'pending interactions receive the shared expiry budget');
    const answered = await first.respond('interaction-1', 'accepted', { choice: 'yes' });
    assert.equal(answered?.status, 'accepted');
    assert.deepEqual(answered?.response, { choice: 'yes' });
    assert.equal(await first.respond('interaction-1', 'declined'), undefined, 'double responses do not change a settled interaction');
    await first.upsert(interaction({ id: 'interaction-2', title: 'Pending at restart' }));
    await first.close();

    const second = new InteractionStore(directory, 'host-a');
    await second.load();
    assert.equal(second.list().find(item => item.id === 'interaction-1')?.status, 'accepted');
    assert.equal(second.list().find(item => item.id === 'interaction-2')?.status, 'expired', 'a pending interaction cannot remain actionable after a host restart');
    await second.upsert(interaction({ id: 'interaction-3', status: 'accepted', title: 'Resolved' }));
    await second.close();

    const third = new InteractionStore(directory, 'host-a');
    await third.load();
    assert.equal(third.list().find(item => item.id === 'interaction-1')?.status, 'accepted');
    assert.equal(third.list().find(item => item.id === 'interaction-2')?.status, 'expired');
    assert.equal(third.list().find(item => item.id === 'interaction-3')?.status, 'accepted');
    await third.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('interaction stores are isolated by host and host id', async () => {
  const root = await mkdtemp(join(scratch, 'agent-interactions-hosts-'));
  try {
    const a = new InteractionStore(join(root, 'a'), 'host-a'); await a.load();
    const b = new InteractionStore(join(root, 'b'), 'host-b'); await b.load();
    await a.upsert(interaction({ hostId: 'host-a' }));
    await b.upsert(interaction({ id: 'interaction-b', hostId: 'host-b', runId: 'run-b' }));
    assert.deepEqual(a.list().map(item => item.id), ['interaction-1']);
    assert.deepEqual(b.list().map(item => item.id), ['interaction-b']);
    assert.equal(a.list()[0].hostId, 'host-a');
    assert.equal(b.list()[0].hostId, 'host-b');
    await a.close(); await b.close();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a corrupt interaction file is preserved and replaced with a clean store', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-interactions-corrupt-'));
  try {
    await writeFile(join(directory, 'interactions.json'), '{not json');
    const store = new InteractionStore(directory, 'host-a');
    await store.load();
    assert.deepEqual(store.list(), []);
    const files = await readdir(directory);
    assert.ok(files.some(name => name.startsWith('interactions.json.corrupt-')), 'the damaged file is retained for diagnosis');
    const raw = JSON.parse(await readFile(join(directory, 'interactions.json'), 'utf8')) as any;
    assert.equal(raw.version, 1);
    assert.deepEqual(raw.interactions, []);
    await store.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});
