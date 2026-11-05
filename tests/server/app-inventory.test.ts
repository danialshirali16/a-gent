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

test('Codex capability detail exposes tools, resources, and server info', async () => {
  const bridge = new CodexBridge({ command: process.execPath, args: [fixture] });
  try {
    const calendar = await bridge.capabilities('Calendar');
    assert.equal(calendar.supported, true);
    assert.equal(calendar.partial, false);
    assert.equal(calendar.tools?.length, 1);
    assert.equal(calendar.tools?.[0].name, 'calendar');
    assert.equal(calendar.tools?.[0].title, 'Calendar');
    assert.deepEqual((calendar.tools?.[0].inputSchema as any).properties.date, { type: 'string' });
    assert.equal(calendar.resources?.[0].uri, 'calendar://primary');
    assert.equal(calendar.resourceTemplates?.length, 1);
    assert.equal(calendar.serverInfo?.version, '1.2.3');
    assert.deepEqual(calendar.serverCapabilities, { resources: {} });

    const files = await bridge.capabilities('Files');
    assert.deepEqual(files.tools, []);
    assert.deepEqual(files.resources, []);
    await assert.rejects(bridge.capabilities('Missing'), /not configured/);
  } finally { await bridge.close(); }
});
