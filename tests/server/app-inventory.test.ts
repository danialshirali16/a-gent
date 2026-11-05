import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CodexBridge } from '../../server/codex.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fake-codex.mjs');
const pause = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

test('Codex inventory keeps partial results when a later page fails', async () => {
  const bridge = new CodexBridge({ command: process.execPath, args: [fixture, '--mcp-paginate'] });
  try {
    const inventory = await bridge.apps();
    assert.equal(inventory.partial, true);
    assert.equal(inventory.apps.length, 1);
    assert.equal(inventory.apps[0].name, 'Calendar');
    assert.match(inventory.error || '', /Inventory page failed/);
    assert.ok(inventory.checkedAt);
  } finally { await bridge.close(); }
});

test('Codex inventory cancellation rejects and leaves no pending request', async () => {
  const bridge = new CodexBridge({ command: process.execPath, args: [fixture, '--mcp-slow'] });
  try {
    const controller = new AbortController();
    const pending = bridge.apps(undefined, controller.signal);
    await pause(150);
    controller.abort();
    await assert.rejects(pending, /cancelled/);
  } finally { await bridge.close(); }
});

test('Codex inventory scopes discovery to the supplied thread', async () => {
  const bridge = new CodexBridge({ command: process.execPath, args: [fixture] });
  try {
    const scoped = await bridge.apps('thread-1');
    assert.ok(scoped.apps.some(app => app.name === 'ThreadOnly'));
    const global = await bridge.apps();
    assert.ok(!global.apps.some(app => app.name === 'ThreadOnly'));
    assert.equal(global.partial, false);
  } finally { await bridge.close(); }
});
