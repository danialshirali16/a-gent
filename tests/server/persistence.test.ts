import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { initialState, StateStore } from '../../server/store.js';

const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });

test('concurrent saves keep a valid primary, the previous backup, and no temporary files', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-persistence-concurrent-'));
  try {
    const store = new StateStore(directory);
    await store.load();
    store.state.settings.theme = 'light';
    const first = store.save();
    store.state.settings.theme = 'dark';
    const second = store.save();
    await Promise.all([first, second]);

    const primary = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')) as any;
    const backup = JSON.parse(await readFile(join(directory, 'state.json.bak'), 'utf8')) as any;
    assert.equal(primary.settings.theme, 'dark');
    assert.ok(['light', 'dark'].includes(backup.settings.theme));
    assert.ok(!(await readdir(directory)).some(name => name.endsWith('.tmp')), 'no temporary file is left behind');

    const reloaded = new StateStore(directory);
    await reloaded.load();
    assert.equal(reloaded.state.settings.theme, 'dark');
    await reloaded.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('a failed write preserves the primary and the next save recovers', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-persistence-failure-'));
  const moved = `${directory}-moved`;
  try {
    const store = new StateStore(directory);
    await store.load();
    store.state.settings.theme = 'light';
    await store.save();
    const before = await readFile(join(directory, 'state.json'), 'utf8');

    await rename(directory, moved);
    await assert.rejects(store.save());
    await rename(moved, directory);
    assert.equal(await readFile(join(directory, 'state.json'), 'utf8'), before, 'failed write leaves the primary intact');

    await store.save();
    const reloaded = new StateStore(directory);
    await reloaded.load();
    assert.equal(reloaded.state.settings.theme, 'light');
    await reloaded.close();
  } finally {
    await rename(moved, directory).catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});

test('a failed import leaves the in-memory workspace unchanged', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-persistence-import-'));
  const moved = `${directory}-moved`;
  try {
    const store = new StateStore(directory);
    await store.load();
    await store.save();
    const before = JSON.stringify(store.state);
    const imported = initialState();
    imported.agents.push({ ...imported.agents[0], id: 'imported-agent', name: 'Imported Agent' });

    await rename(directory, moved);
    await assert.rejects(store.merge(imported));
    assert.equal(JSON.stringify(store.state), before, 'failed import rolls back the candidate workspace');
    await rename(moved, directory);

    await store.save();
    const reloaded = new StateStore(directory);
    await reloaded.load();
    assert.ok(!reloaded.state.agents.some(agent => agent.id === 'imported-agent'));
    await reloaded.close();
  } finally {
    await rename(moved, directory).catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});
