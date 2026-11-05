import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, request as httpRequest } from 'node:http';
import { startServer } from '../../server/index.js';
import { StateStore, validateImport } from '../../server/store.js';
import { InteractionStore } from '../../server/interactions.js';
import { ProviderManager } from '../../server/providers.js';
import { RunManager } from '../../server/runs.js';
import { CodexBridge, type ProviderRequest } from '../../server/codex.js';
import { OpenCodeBridge } from '../../server/opencode.js';
import { locateCodex } from '../../server/codex-discovery.js';
import type { Run, ServerEvent } from '../../shared/types.js';
import { agentAvatarTypes, avatarActivityForRuns, legacyAvatarTypeByIcon, resolveAgentAvatarType } from '../../shared/agentAvatars.js';

process.env.AGENT_ALLOW_LOCAL_PROVIDER_ENDPOINTS = '1';
const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fake-codex.mjs');
const opencodeFixture = join(dirname(fileURLToPath(import.meta.url)), 'fake-opencode.mjs');
const scratch = process.env.AGENT_TEST_TMP_DIR ?? join(process.cwd(), 'work');
await mkdir(scratch, { recursive: true });
const pause = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitFor<T>(get: () => Promise<T>, matches: (value: T) => boolean, milliseconds = 8000): Promise<T> {
  const deadline = Date.now() + milliseconds;
  do { const value = await get(); if (matches(value)) return value; await pause(25); } while (Date.now() < deadline);
  throw new Error('Timed out waiting for expected backend state.');
}

test('workspace validation rejects bad references and imports without credentials or provider thread binding', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-store-test-'));
  try {
    const store = new StateStore(directory); await store.load();
    const conversation = store.createConversation('primary');
    conversation.providerThreadId = 'private-provider-thread';
    conversation.messages.push({ id: 'm', role: 'assistant', content: 'Saved answer', createdAt: new Date().toISOString(), status: 'completed' });
    await store.save();
    const second = new StateStore(directory); await second.load();
    assert.equal(second.state.conversations[0].messages[0].content, 'Saved answer');
    assert.equal(second.state.conversations[0].providerThreadId, 'private-provider-thread');
    await store.save();
    await writeFile(join(directory, 'state.json'), '{not valid json');
    const recovered = new StateStore(directory); await recovered.load();
    assert.equal(recovered.state.conversations[0].messages[0].content, 'Saved answer');
    const imported = validateImport(store.state);
    assert.equal(imported.conversations[0].providerThreadId, undefined);
    assert.throws(() => validateImport({ ...store.state, conversations: [{ ...conversation, agentId: 'missing' }] }), /unknown agent/);
    assert.throws(() => validateImport({ ...store.state, agents: [{ ...store.state.agents[0], color: 'javascript:bad' }] }), /hex/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('avatar shapes migrate, validate, persist, and round-trip', async () => {
  for (const [icon, shape] of Object.entries(legacyAvatarTypeByIcon)) {
    assert.equal(resolveAgentAvatarType(icon, undefined), shape);
  }
  assert.equal(resolveAgentAvatarType('spark', 'cat'), 'cat');
  assert.equal(resolveAgentAvatarType('unknown', 'not-a-shape'), 'droid');
  assert.equal(resolveAgentAvatarType('code', 'not-a-shape'), 'mech');
  assert.equal(agentAvatarTypes.length, 18);

  const run = (agentId: string, status: Run['status'], startedAt: string): Run => ({ id: `${agentId}-${status}-${startedAt}`, conversationId: 'chat', agentId, messageId: 'message', status, providerId: 'codex', modelId: '', startedAt, activities: [], approvals: [] });
  assert.equal(avatarActivityForRuns([run('a', 'running', '2026-01-01T00:00:00.000Z')]).get('a'), 'working');
  assert.equal(avatarActivityForRuns([run('a', 'waiting', '2026-01-01T00:00:00.000Z')]).get('a'), 'default');
  for (const status of ['completed', 'failed', 'interrupted'] as const) assert.equal(avatarActivityForRuns([run('a', status, '2026-01-01T00:00:00.000Z')]).get('a'), undefined);
  assert.equal(avatarActivityForRuns([run('a', 'running', '2026-01-01T00:00:00.000Z'), run('a', 'completed', '2026-01-01T01:00:00.000Z')]).get('a'), undefined);
  assert.equal(avatarActivityForRuns([run('a', 'completed', '2026-01-01T00:00:00.000Z'), run('a', 'running', '2026-01-01T01:00:00.000Z')]).get('a'), 'working');

  const directory = await mkdtemp(join(scratch, 'agent-avatar-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  let handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const call = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  try {
    const created = await call('/agents', { name: 'Shape Agent', avatarType: 'cat' }, 'POST');
    assert.equal(created.status, 201);
    assert.equal(created.body.avatarType, 'cat');
    assert.equal((await call(`/agents/${created.body.id}`, { name: 'Renamed Shape Agent' }, 'PATCH')).body.avatarType, 'cat');
    assert.equal((await call(`/agents/${created.body.id}`, { avatarType: 'hexapod' }, 'PATCH')).status, 400);
    assert.equal((await call(`/agents/${created.body.id}`, { avatarType: 'puddle' }, 'PATCH')).body.avatarType, 'puddle');

    const exported = await call('/export');
    assert.equal(exported.body.agents.find((agent: any) => agent.id === created.body.id).avatarType, 'puddle');
    const imported = validateImport(exported.body);
    assert.equal(imported.agents.find(agent => agent.id === created.body.id)?.avatarType, 'puddle');

    const invalidImport = validateImport({ ...exported.body, agents: exported.body.agents.map((agent: any) => agent.id === created.body.id ? { ...agent, avatarType: 'hexapod' } : agent) });
    assert.equal(invalidImport.agents.find(agent => agent.id === created.body.id)?.avatarType, undefined);

    const legacyAgents = validateImport({ ...exported.body, agents: [
      { ...exported.body.agents.find((agent: any) => agent.id === 'primary'), avatarType: undefined, icon: 'spark' },
      { ...exported.body.agents.find((agent: any) => agent.id === 'engineer'), avatarType: undefined, icon: 'code' },
    ] });
    assert.equal(legacyAgents.agents[0].avatarType, undefined);
    assert.equal(legacyAgents.agents[1].avatarType, undefined);

    await handle.close();
    handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
    const restarted = await call('/bootstrap');
    assert.equal(restarted.body.state.agents.find((agent: any) => agent.id === created.body.id).avatarType, 'puddle');
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('stored unsupported avatar shapes fall back without blocking startup', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-avatar-store-test-'));
  try {
    const store = new StateStore(directory); await store.load();
    store.state.agents[0].avatarType = 'hexapod' as never;
    await store.save();
    const reloaded = new StateStore(directory); await reloaded.load();
    assert.equal(reloaded.state.agents[0].avatarType, undefined);
    await reloaded.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('data lock prevents two hosts from using the same workspace', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-lock-test-'));
  try {
    const first = new StateStore(directory, { lock: true }); await first.load();
    const second = new StateStore(directory, { lock: true });
    await assert.rejects(() => second.load(), /already using/);
    await first.close();
    const third = new StateStore(directory, { lock: true }); await third.load(); await third.close();
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('agent groups support create, assignment, rename, delete, and legacy imports', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-group-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const call = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  try {
    const group = await call('/agent-groups', { name: 'Design' }, 'POST');
    assert.equal(group.status, 201);
    assert.equal(group.body.name, 'Design');
    const agent = await call('/agents', { name: 'Grouped Agent', agentGroupId: group.body.id }, 'POST');
    assert.equal(agent.status, 201);
    assert.equal(agent.body.agentGroupId, group.body.id);
    assert.equal((await call('/agents', { name: 'Bad Group', agentGroupId: 'missing' }, 'POST')).status, 404);

    const exported = await call('/export');
    assert.equal(exported.body.agentGroups.length, 1);
    assert.equal(exported.body.agents.find((item: any) => item.id === agent.body.id).agentGroupId, group.body.id);

    const renamed = await call(`/agent-groups/${group.body.id}`, { name: 'Product' }, 'PATCH');
    assert.equal(renamed.status, 200);
    assert.equal(renamed.body.name, 'Product');
    let state = await call('/bootstrap');
    assert.equal(state.body.state.agentGroups[0].name, 'Product');
    assert.equal(state.body.state.agents.find((item: any) => item.id === agent.body.id).agentGroupId, group.body.id);

    const deleted = await call(`/agent-groups/${group.body.id}`, undefined, 'DELETE');
    assert.equal(deleted.status, 200);
    state = await call('/bootstrap');
    assert.equal(state.body.state.agentGroups.length, 0);
    assert.equal(state.body.state.agents.find((item: any) => item.id === agent.body.id).agentGroupId, null);

    const legacy = validateImport({ ...state.body.state, agentGroups: undefined, agents: state.body.state.agents.map((item: any) => item.id === agent.body.id ? { ...item, agentGroupId: 'missing-group' } : item) });
    assert.deepEqual(legacy.agentGroups, []);
    assert.equal(legacy.agents.find(item => item.id === agent.body.id)?.agentGroupId, null);
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('workspace files are read-only and cannot escape the selected workspace', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-files-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const workspace = join(directory, 'workspace'); await mkdir(join(workspace, 'src'), { recursive: true });
  await writeFile(join(workspace, 'README.md'), '# Fixture\n');
  await writeFile(join(workspace, 'src', 'index.ts'), 'export const answer = 42;\n');
  await mkdir(join(workspace, 'node_modules')); await writeFile(join(workspace, 'node_modules', 'hidden.js'), 'hidden\n');
  const outside = join(directory, 'outside.txt'); await writeFile(outside, 'outside\n');
  await symlink(outside, join(workspace, 'escape.txt'));
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const get = async (path: string) => {
    const response = await fetch(`${handle.url}/api/workspace/files?${path}`, { headers: { Authorization: `Bearer ${handle.token}` } });
    return { status: response.status, body: await response.json() as any };
  };
  try {
    const root = await get('agentId=primary');
    assert.equal(root.status, 200);
    assert.equal(root.body.path, '');
    assert.ok(/[\\/]workspace$/.test(root.body.root));
    assert.deepEqual(root.body.entries.map((entry: any) => entry.name).sort(), ['README.md', 'escape.txt', 'src'].sort());
    assert.equal(root.body.entries.find((entry: any) => entry.name === 'README.md').type, 'file');
    assert.equal(root.body.entries.find((entry: any) => entry.name === 'src').type, 'directory');
    assert.equal(root.body.entries.find((entry: any) => entry.name === 'escape.txt').type, 'symlink');
    assert.ok(!root.body.entries.some((entry: any) => entry.name === 'node_modules'));

    const nested = await get('agentId=primary&path=src');
    assert.equal(nested.status, 200);
    assert.equal(nested.body.path, 'src');
    assert.deepEqual(nested.body.entries.map((entry: any) => entry.name), ['index.ts']);
    assert.equal((await get('agentId=primary&path=..')).status, 400);
    assert.equal((await get('agentId=primary&path=escape.txt')).status, 403);
    assert.equal((await get('agentId=primary&path=missing')).status, 404);
    assert.equal((await get('path=src')).status, 400);
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('desktop pairing cookie migrates to a revocable device token', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-cookie-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const readPage = (headers: Record<string, string>) => new Promise<{ body: string; headers: Record<string, string | string[] | undefined> }>((resolve, reject) => {
    const request = httpRequest(handle.url, { headers, agent: false }, response => {
      let body = ''; response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ body, headers: response.headers }));
    });
    request.on('error', reject); request.end();
  });
  try {
    const anonymous = await readPage({});
    assert.ok(!anonymous.body.includes(handle.token));
    assert.ok(!anonymous.body.includes('agt_'));

    const legacy = await readPage({ Cookie: `agent_desktop_token=${encodeURIComponent(handle.token)}` });
    assert.ok(!legacy.body.includes(handle.token), 'the legacy root token is never injected');
    const setCookie = legacy.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join('\n') : setCookie ?? '';
    assert.match(cookieHeader, /agent_desktop_token=agt_/);
    assert.match(cookieHeader, /HttpOnly/);
    assert.match(cookieHeader, /SameSite=Strict/);
    const config = JSON.parse(/window\.__AGENT_CONFIG__=(\{.*?\});<\/script>/.exec(legacy.body)![1]);
    assert.match(config.token, /^agt_/);
    assert.notEqual(config.token, handle.token);
    assert.equal((await fetch(`${handle.url}/api/bootstrap`, { headers: { Authorization: `Bearer ${config.token}` } })).status, 200);

    const paired = await readPage({ Cookie: `agent_desktop_token=${encodeURIComponent(config.token)}` });
    assert.ok(paired.body.includes(config.token));
    const devicesResponse = await fetch(`${handle.url}/api/devices`, { headers: { Authorization: `Bearer ${handle.token}` } });
    const devices = await devicesResponse.json() as Array<{ id: string; name: string }>;
    assert.equal(devices.length, 1, 'a repeated device-cookie page load does not create another device');
    assert.equal(devices[0].name, 'Desktop app');

    await fetch(`${handle.url}/api/devices/${devices[0].id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${handle.token}` } });
    const revoked = await readPage({ Cookie: `agent_desktop_token=${encodeURIComponent(config.token)}` });
    assert.ok(!revoked.body.includes(handle.token), 'a revoked cookie does not fall back to the root token');
    assert.ok(!revoked.body.includes(config.token));
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('device tokens can be created, self-managed, rotated, revoked, and survive a host restart', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-device-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const start = () => startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  let handle = await start();
  const call = async (token: string, path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any, headers: response.headers };
  };
  try {
    const pixel = await call(handle.token, '/devices', { name: 'Pixel' }, 'POST');
    const tablet = await call(handle.token, '/devices', { name: 'Tablet' }, 'POST');
    assert.equal(pixel.status, 201);
    assert.equal(tablet.status, 201);
    assert.match(pixel.body.token, /^agt_/);
    assert.match(tablet.body.token, /^agt_/);
    assert.equal(pixel.body.device.name, 'Pixel');
    const raw = await readFile(join(directory, 'devices.json'), 'utf8');
    assert.ok(!raw.includes(pixel.body.token), 'only a token hash is stored');
    assert.ok(!raw.includes(tablet.body.token), 'only a token hash is stored');
    assert.equal((await call(pixel.body.token, '/bootstrap')).status, 200);
    const deviceAuth = await call(pixel.body.token, '/auth');
    assert.equal(deviceAuth.body.admin, false);
    assert.equal(deviceAuth.body.device.id, pixel.body.device.id);
    const adminAuth = await call(handle.token, '/auth');
    assert.equal(adminAuth.body.admin, true);
    assert.equal(adminAuth.body.device, null);

    const own = await call(pixel.body.token, '/devices');
    assert.equal(own.status, 200);
    assert.equal(own.body.length, 1);
    assert.equal(own.body[0].id, pixel.body.device.id);
    assert.equal(own.body[0].current, true);
    assert.equal((await call(pixel.body.token, '/devices', { name: 'Other' }, 'POST')).status, 403, 'device tokens cannot create more devices');
    assert.equal((await call(pixel.body.token, `/devices/${tablet.body.device.id}/rotate`, {}, 'POST')).status, 403, 'device tokens cannot rotate another device');
    assert.equal((await call(pixel.body.token, `/devices/${tablet.body.device.id}`, undefined, 'DELETE')).status, 403, 'device tokens cannot revoke another device');

    const selfRotated = await call(pixel.body.token, `/devices/${pixel.body.device.id}/rotate`, {}, 'POST');
    assert.equal(selfRotated.status, 200);
    assert.notEqual(selfRotated.body.token, pixel.body.token);
    assert.match(selfRotated.headers.get('set-cookie') ?? '', /agent_desktop_token=agt_/);
    assert.equal((await call(pixel.body.token, '/bootstrap')).status, 401, 'self-rotation invalidates the old token');
    assert.equal((await call(selfRotated.body.token, '/bootstrap')).status, 200);

    const adminList = await call(handle.token, '/devices');
    assert.equal(adminList.body.length, 2);
    assert.deepEqual(adminList.body.map((device: any) => device.name).sort(), ['Pixel', 'Tablet']);
    const rotated = await call(handle.token, `/devices/${pixel.body.device.id}/rotate`, {}, 'POST');
    assert.equal(rotated.status, 200);
    assert.notEqual(rotated.body.token, selfRotated.body.token);
    assert.equal((await call(selfRotated.body.token, '/bootstrap')).status, 401, 'administrator rotation invalidates the previous token');
    assert.equal((await call(rotated.body.token, '/bootstrap')).status, 200);

    await handle.close();
    handle = await start();
    assert.equal((await call(rotated.body.token, '/bootstrap')).status, 200, 'rotated tokens survive a restart');
    assert.equal((await call(pixel.body.token, '/bootstrap')).status, 401);

    const revoked = await call(handle.token, `/devices/${pixel.body.device.id}`, undefined, 'DELETE');
    assert.equal(revoked.status, 200);
    assert.ok(revoked.body.revokedAt);
    assert.equal((await call(rotated.body.token, '/bootstrap')).status, 401, 'revocation is immediate');
    assert.equal((await call(handle.token, '/bootstrap')).status, 200, 'the root administrator token remains valid');

    const selfRevoked = await call(tablet.body.token, `/devices/${tablet.body.device.id}`, undefined, 'DELETE');
    assert.equal(selfRevoked.status, 200);
    assert.ok(selfRevoked.body.revokedAt);
    assert.match(selfRevoked.headers.get('set-cookie') ?? '', /agent_desktop_token=;/);
    assert.match(selfRevoked.headers.get('set-cookie') ?? '', /Max-Age=0/);
    assert.equal((await call(tablet.body.token, '/bootstrap')).status, 401, 'self-revocation is immediate');

    await handle.close();
    handle = await start();
    assert.equal((await call(rotated.body.token, '/bootstrap')).status, 401, 'revocation survives a restart');
    assert.equal((await call(tablet.body.token, '/bootstrap')).status, 401, 'self-revocation survives a restart');
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('device rotation and revocation close that device event stream', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-sse-device-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const call = async (token: string, path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  const openStream = async (token: string) => {
    const controller = new AbortController();
    const response = await fetch(`${handle.url}/api/events`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
    assert.equal(response.status, 200);
    assert.ok(response.body);
    const reader = response.body.getReader();
    const connected = await reader.read();
    assert.equal(connected.done, false);
    return { controller, reader };
  };
  try {
    const device = await call(handle.token, '/devices', { name: 'Streaming device' }, 'POST');
    const other = await call(handle.token, '/devices', { name: 'Unrelated device' }, 'POST');
    assert.equal(device.status, 201);
    assert.equal(other.status, 201);
    const first = await openStream(device.body.token);
    const unrelated = await openStream(other.body.token);
    const rotated = await call(handle.token, `/devices/${device.body.device.id}/rotate`, {}, 'POST');
    assert.equal(rotated.status, 200);
    const closedAfterRotate = await Promise.race([
      first.reader.read(),
      pause(2000).then(() => { throw new Error('The old device stream stayed open after rotation.'); }),
    ]);
    assert.equal(closedAfterRotate.done, true);
    first.controller.abort();

    await call(handle.token, '/settings', { theme: 'light' }, 'PATCH');
    const unrelatedEvent = await Promise.race([
      unrelated.reader.read(),
      pause(2000).then(() => { throw new Error('An unrelated device stream was closed or stalled.'); }),
    ]);
    assert.equal(unrelatedEvent.done, false);
    assert.match(new TextDecoder().decode(unrelatedEvent.value), /"type":"state"/);

    const second = await openStream(rotated.body.token);
    const revoked = await call(handle.token, `/devices/${other.body.device.id}`, undefined, 'DELETE');
    assert.equal(revoked.status, 200);
    const closedAfterRevoke = await Promise.race([
      unrelated.reader.read(),
      pause(2000).then(() => { throw new Error('The device stream stayed open after revocation.'); }),
    ]);
    assert.equal(closedAfterRevoke.done, true);
    unrelated.controller.abort();
    second.controller.abort();
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('host authority separates desktop devices from remote devices for credentials and workspace data', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-authority-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const call = async (token: string, path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST', headers: Record<string, string> = {}) => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  try {
    const device = await call(handle.token, '/devices', { name: 'Remote Mac' }, 'POST');
    assert.equal(device.status, 201);
    const remote = { 'X-Forwarded-For': '192.168.1.25' };

    assert.equal((await call(device.body.token, '/bootstrap')).status, 200);
    assert.equal((await call(device.body.token, '/export')).status, 200, 'the local desktop device can export');
    assert.equal((await call(device.body.token, '/settings', { defaultProviderId: 'opencode' }, 'PATCH')).status, 200, 'the local desktop device can change host defaults');
    assert.equal((await call(device.body.token, '/settings', { defaultProviderId: 'codex' }, 'PATCH', remote)).status, 403, 'remote devices cannot change host defaults');
    assert.equal((await call(device.body.token, '/settings', { speech: { provider: 'elevenlabs', credentialMode: 'session' } }, 'PATCH', remote)).status, 403, 'remote devices cannot change speech settings');
    assert.equal((await call(device.body.token, '/providers/codex/connect', {}, 'POST', remote)).status, 403, 'remote devices cannot change provider credentials');
    assert.equal((await call(device.body.token, '/export', undefined, 'GET', remote)).status, 403, 'remote devices cannot export the workspace');
    assert.equal((await call(device.body.token, '/import', {}, 'POST', remote)).status, 403, 'remote devices cannot import a workspace');
    assert.equal((await call(device.body.token, '/settings', { theme: 'light' }, 'PATCH', remote)).status, 200, 'remote devices may change their ordinary UI preference');
    assert.equal((await call(handle.token, '/export', undefined, 'GET', remote)).status, 200, 'the administrator token can export remotely');
    assert.equal((await call(handle.token, '/settings', { defaultProviderId: 'codex' }, 'PATCH', remote)).status, 200, 'the administrator token can change defaults remotely');
    assert.equal((await call(device.body.token, '/devices', { name: 'Another' }, 'POST')).status, 403, 'device tokens cannot create devices even on the host');
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
  }
});

test('provider sessions are reused only for a matching binding and rebuilt when the model changes', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-binding-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const saved = { command: process.env.AGENT_CODEX_COMMAND, args: process.env.AGENT_CODEX_ARGS, probe: process.env.AGENT_SKIP_PROVIDER_PROBE };
  process.env.AGENT_CODEX_COMMAND = process.execPath;
  process.env.AGENT_CODEX_ARGS = JSON.stringify([fixture]);
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const call = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  const waitForRun = async (runId: string) => waitFor(async () => (await call('/bootstrap')).body, data => data.runs.find((run: any) => run.id === runId)?.status === 'completed');
  try {
    assert.equal((await call('/providers/codex/connect', {})).body.readiness, 'ready');
    assert.equal((await call('/agents/primary', { modelId: 'test-model' }, 'PATCH')).status, 200);
    const conversation = await call('/conversations', { agentId: 'primary' });
    assert.equal(conversation.status, 201);
    const first = await call(`/conversations/${conversation.body.id}/messages`, { content: 'First turn' });
    assert.equal(first.status, 202);
    await waitForRun(first.body.id);
    let state = (await call('/bootstrap')).body.state;
    let chat = state.conversations.find((item: any) => item.id === conversation.body.id);
    assert.equal(chat.providerThreadId, 'test-thread-1');
    assert.equal(chat.providerBinding.providerId, 'codex');
    assert.equal(chat.providerBinding.providerKind, 'codex');
    assert.equal(chat.providerBinding.modelId, 'test-model');
    assert.match(chat.providerBinding.workspaceId, /[\\/]workspace$/);

    const second = await call(`/conversations/${conversation.body.id}/messages`, { content: 'Second turn' });
    await waitForRun(second.body.id);
    state = (await call('/bootstrap')).body.state;
    chat = state.conversations.find((item: any) => item.id === conversation.body.id);
    assert.equal(chat.providerThreadId, 'test-thread-1', 'same binding reuses the provider session');

    assert.equal((await call('/agents/primary', { modelId: 'test-model-2' }, 'PATCH')).status, 200);
    const third = await call(`/conversations/${conversation.body.id}/messages`, { content: 'Third turn' });
    await waitForRun(third.body.id);
    state = (await call('/bootstrap')).body.state;
    chat = state.conversations.find((item: any) => item.id === conversation.body.id);
    assert.notEqual(chat.providerThreadId, 'test-thread-1', 'a model change rebuilds the provider session');
    assert.equal(chat.providerBinding.modelId, 'test-model-2');
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    for (const [key, value] of [['AGENT_CODEX_COMMAND', saved.command], ['AGENT_CODEX_ARGS', saved.args], ['AGENT_SKIP_PROVIDER_PROBE', saved.probe]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('authenticated API persists CRUD, streams real adapter lifecycle, approves, interrupts, and schedules exactly once', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-api-test-'));
  const saved = { command: process.env.AGENT_CODEX_COMMAND, args: process.env.AGENT_CODEX_ARGS, probe: process.env.AGENT_SKIP_PROVIDER_PROBE, trace: process.env.AGENT_TEST_CODEX_TRACE };
  process.env.AGENT_CODEX_COMMAND = process.execPath;
  process.env.AGENT_CODEX_ARGS = JSON.stringify([fixture]);
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const trace = join(directory, 'codex-trace.jsonl'); process.env.AGENT_TEST_CODEX_TRACE = trace;
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent fixture</body></html>');
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false, allowLocalTokenInjection: true });
  const api = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  const streamAbort = new AbortController();
  const events: ServerEvent[] = [];
  let readEvents: Promise<void> | undefined;
  try {
    assert.equal((await fetch(`${handle.url}/api/bootstrap`)).status, 401);
    assert.ok((await (await fetch(handle.url)).text()).includes(handle.token));
    assert.ok(!(await (await fetch(handle.url, { headers: { Forwarded: 'for=192.0.2.1' } })).text()).includes(handle.token), 'forwarded page requests do not receive the pairing token');
    assert.equal((await fetch(`${handle.url}/api/bootstrap`, { headers: { Authorization: `Bearer ${handle.token}`, Origin: 'https://evil.example' } })).status, 403);
    const hostileHostStatus = await new Promise<number | undefined>((resolve, reject) => {
      const request = httpRequest(`${handle.url}/api/bootstrap`, { headers: { Authorization: `Bearer ${handle.token}`, Host: 'evil.example:4317' } }, response => { response.resume(); resolve(response.statusCode); });
      request.on('error', reject); request.end();
    });
    assert.equal(hostileHostStatus, 403);
    const initial = await api('/bootstrap'); assert.equal(initial.status, 200); assert.equal(initial.body.state.agents.length, 4); assert.equal(initial.body.state.conversations.length, 0);
    const connected = await api('/providers/codex/connect', {}); assert.equal(connected.body.status, 'connected'); assert.equal(connected.body.models[0].id, 'test-model');
    assert.equal((await api('/providers/codex/test', { modelId: 'test-model' })).status, 400, 'live test requires explicit confirmation');
    const liveTest = await api('/providers/codex/test', { modelId: 'test-model', confirm: true });
    assert.equal(liveTest.body.ok, true);
    assert.equal(liveTest.body.provider.verifiedBy, 'inference');
    assert.match(liveTest.body.response, /A Gent test response/);
    const apps = await api('/apps');
    assert.equal(apps.body.length, 2);
    const calendar = apps.body.find((app: any) => app.name === 'Calendar');
    assert.equal(calendar.id, 'codex:Calendar');
    assert.equal(calendar.providerId, 'codex');
    assert.equal(calendar.source, 'runtime');
    assert.equal(calendar.transport, 'http');
    assert.equal(calendar.status, 'connected');
    assert.deepEqual(calendar.tools, ['calendar']);
    assert.equal(calendar.authStatus, 'oAuth');
    assert.equal(calendar.toolsCount, 1);
    const files = apps.body.find((app: any) => app.name === 'Files');
    assert.equal(files.status, 'needs-auth');
    assert.equal(files.authStatus, 'notLoggedIn');
    assert.equal(files.toolsCount, 0);
    assert.ok(!JSON.stringify(apps.body).includes('must-not-leak'));
    assert.equal((await api('/agents', { name: 'Bad', color: 'red' })).status, 400);
    const agent = (await api('/agents', { name: 'Test Agent', instructions: 'Test instructions', color: '#112233', providerId: 'codex' })).body;
    assert.equal(agent.name, 'Test Agent');
    const group = (await api('/groups', { name: 'Product' })).body;
    const appRecordResponse = await api('/app-records', { name: 'Fixture app', scope: 'agent', scopeId: agent.id, ownership: 'external', enabled: true, providerId: 'codex', transport: 'stdio', credentialRef: 'provider:codex:fixture' });
    assert.equal(appRecordResponse.status, 201);
    assert.equal(appRecordResponse.body.scopeId, agent.id);
    assert.equal((await api(`/app-records/${appRecordResponse.body.id}`, { enabled: false }, 'PATCH')).body.enabled, false);
    assert.equal((await api(`/app-records/${appRecordResponse.body.id}`, undefined, 'DELETE')).status, 200);
    const conversation = (await api('/conversations', { agentId: agent.id, groupId: group.id })).body;
    assert.equal(conversation.groupId, group.id);
    assert.equal((await api(`/conversations/${conversation.id}`, { groupId: 'missing' }, 'PATCH')).status, 404);
    const otherConversation = (await api('/conversations', { agentId: agent.id })).body;
    assert.equal((await api(`/conversations/${conversation.id}`, { providerId: 'codex', modelId: 'test-model-2', reasoningEffort: 'low' }, 'PATCH')).status, 200);
    let scopedState = (await api('/bootstrap')).body.state;
    assert.equal(scopedState.conversations.find((item: any) => item.id === conversation.id).modelId, 'test-model-2');
    assert.equal(scopedState.conversations.find((item: any) => item.id === otherConversation.id).modelId, undefined, 'switching one chat does not change another');
    assert.equal(scopedState.agents.find((item: any) => item.id === agent.id).modelId, '', 'chat selection does not mutate the agent default');
    assert.equal((await api(`/conversations/${conversation.id}`, { modelId: 'missing-model' }, 'PATCH')).status, 409);
    scopedState = (await api('/bootstrap')).body.state;
    assert.equal(scopedState.conversations.find((item: any) => item.id === conversation.id).modelId, 'test-model-2', 'failed save keeps the previous chat selection');

    const stream = await fetch(`${handle.url}/api/events`, { headers: { Authorization: `Bearer ${handle.token}` }, signal: streamAbort.signal });
    const reader = stream.body!.getReader();
    readEvents = (async () => {
      const decoder = new TextDecoder(); let buffer = '';
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const blocks = buffer.split('\n\n'); buffer = blocks.pop() ?? '';
        for (const block of blocks) { const line = block.split('\n').find(line => line.startsWith('data: ')); if (line) events.push(JSON.parse(line.slice(6))); }
      }
    })().catch(error => { if (error.name !== 'AbortError') throw error; });
    const sent = await api(`/conversations/${conversation.id}/messages`, { content: 'Hello', mode: 'chat' }); assert.equal(sent.status, 202);
    await waitFor(async () => events, items => items.some(event => event.type === 'run' && event.run.id === sent.body.id && event.run.status === 'completed'));
    const deltaIndex = events.findIndex(event => event.type === 'delta');
    const initialMessageIndex = events.findIndex(event => event.type === 'state' && event.state.conversations.some(c => c.id === conversation.id && c.messages.some(message => message.id === sent.body.messageId)));
    assert.ok(initialMessageIndex >= 0 && initialMessageIndex < deltaIndex, 'initial assistant state precedes deltas');
    let bootstrap = (await api('/bootstrap')).body;
    assert.equal(bootstrap.state.conversations.find((c: any) => c.id === conversation.id).messages.at(-1).content, 'A Gent test response 1.');

    const pendingRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[start-pending]', mode: 'chat' })).body;
    await waitFor(async () => { try { return await readFile(trace, 'utf8'); } catch { return ''; } }, text => text.includes('[start-pending]'));
    assert.equal((await api(`/runs/${pendingRun.id}/interrupt`, {})).body.status, 'interrupted');
    assert.equal((await api(`/conversations/${conversation.id}/messages`, { content: 'Too early' })).status, 409, 'chat stays reserved while turn/start and interruption are unconfirmed');
    await waitFor(async () => (await api('/bootstrap')).body, data => data.state.conversations.find((c: any) => c.id === conversation.id).messages.at(-1).status === 'interrupted');
    const nextRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[wait-for-stale]' })).body;
    await pause(180);
    let nextState = (await api('/bootstrap')).body;
    assert.equal(nextState.runs.find((run: any) => run.id === nextRun.id).status, 'running', 'old turn/completed must not complete the new turn');
    assert.ok(!nextState.state.conversations.find((c: any) => c.id === conversation.id).messages.at(-1).content.includes('STALE'));
    nextState = await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === nextRun.id && run.status === 'completed'));
    assert.equal(nextState.state.conversations.find((c: any) => c.id === conversation.id).messages.at(-1).content, 'The new turn completed correctly.');

    const approvalRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[approval]', mode: 'work' })).body;
    const waiting = await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === approvalRun.id && run.status === 'waiting'));
    const approval = waiting.runs.find((run: any) => run.id === approvalRun.id).approvals[0];
    const pendingInteraction = waiting.interactions.find((item: any) => item.id === approval.id);
    assert.equal(pendingInteraction.runId, approvalRun.id);
    assert.equal(pendingInteraction.conversationId, conversation.id);
    assert.equal(pendingInteraction.providerId, 'codex');
    assert.equal(pendingInteraction.threadId, waiting.state.conversations.find((item: any) => item.id === conversation.id).providerThreadId);
    assert.equal(pendingInteraction.kind, 'approval');
    assert.equal(pendingInteraction.status, 'pending');
    assert.equal(approval.command, 'echo A Gent test');
    assert.equal((await api(`/approvals/${approval.id}`, { decision: 'accept' })).status, 200);
    await waitFor(async () => (await api('/bootstrap')).body, data => data.interactions?.some((item: any) => item.id === approval.id && item.status === 'accepted'));
    await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === approvalRun.id && run.status === 'completed'));
    assert.equal((await api(`/approvals/${approval.id}`, { decision: 'accept' })).status, 409);

    const questionRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[question]', mode: 'chat' })).body;
    const questionState = await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === questionRun.id && run.status === 'waiting'));
    const question = questionState.interactions.find((item: any) => item.runId === questionRun.id && item.kind === 'question');
    assert.ok(question, 'the question is correlated to the run');
    assert.equal(question.status, 'pending');
    assert.equal(question.payload.questions[0].id, 'scope');
    assert.deepEqual(question.payload.questions[0].options.map((option: any) => option.value), ['Workspace', 'Account']);
    const invalidAnswer = await api(`/interactions/${question.id}`, { action: 'accept', response: { answers: { scope: { answers: ['Not an option'] } } } });
    assert.equal(invalidAnswer.status, 400, 'answers must match the runtime options');
    assert.equal((await api(`/interactions/${question.id}`, { action: 'accept', response: { answers: { scope: { answers: ['Workspace'] } } } })).status, 200);
    const answered = await waitFor(async () => (await api('/bootstrap')).body, data => data.interactions?.some((item: any) => item.id === question.id && item.status === 'accepted') && data.runs.some((run: any) => run.id === questionRun.id && run.status === 'completed'));
    assert.match(answered.state.conversations.find((item: any) => item.id === conversation.id).messages.at(-1).content, /Question answer: Workspace/);
    assert.equal((await api(`/interactions/${question.id}`, { action: 'accept', response: { answers: { scope: { answers: ['Workspace'] } } } })).status, 409, 'a settled question cannot be answered twice');

    const formRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[form]', mode: 'chat' })).body;
    const formState = await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === formRun.id && run.status === 'waiting'));
    const form = formState.interactions.find((item: any) => item.runId === formRun.id && item.kind === 'form');
    assert.ok(form, 'the elicitation form is correlated to the run');
    assert.deepEqual(form.payload.fields.map((field: any) => field.name), ['calendar', 'days']);
    assert.equal((await api(`/interactions/${form.id}`, { action: 'accept', response: {} })).status, 400, 'required form fields are enforced');
    assert.equal((await api(`/interactions/${form.id}`, { action: 'accept', response: { calendar: 'work', days: 99 } })).status, 400, 'numeric bounds are enforced');
    assert.equal((await api(`/interactions/${form.id}`, { action: 'accept', response: { calendar: 'work', days: 14 } })).status, 200);
    const formAnswered = await waitFor(async () => (await api('/bootstrap')).body, data => data.interactions?.some((item: any) => item.id === form.id && item.status === 'accepted') && data.runs.some((run: any) => run.id === formRun.id && run.status === 'completed'));
    assert.match(formAnswered.state.conversations.find((item: any) => item.id === conversation.id).messages.at(-1).content, /"calendar":"work"/);

    const slowRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[slow]', mode: 'chat' })).body;
    assert.equal((await api(`/conversations/${conversation.id}/messages`, { content: 'Duplicate' })).status, 409);
    assert.equal((await api(`/runs/${slowRun.id}/interrupt`, {})).body.status, 'interrupted');
    await waitFor(async () => (await api('/bootstrap')).body, data => data.state.conversations.find((c: any) => c.id === conversation.id).messages.at(-1).status === 'interrupted');

    const schedule = (await api('/schedules', { agentId: agent.id, title: 'Once', prompt: 'Scheduled hello', runAt: new Date(Date.now() - 1000).toISOString() })).body;
    const scheduled = await waitFor(async () => (await api('/bootstrap')).body, data => data.state.schedules.find((s: any) => s.id === schedule.id)?.lastRunAt);
    assert.equal(scheduled.state.schedules.find((s: any) => s.id === schedule.id).enabled, false);
    const exportResponse = await api('/export'); assert.equal(exportResponse.status, 200);
    const exportedText = JSON.stringify(exportResponse.body); assert.ok(!exportedText.includes(handle.token)); assert.ok(!exportedText.includes('apiKey'));
    assert.equal((await api('/import', { ...exportResponse.body, version: 99 })).status, 400);
    assert.equal((await api('/import', { ...exportResponse.body, version: 2 })).status, 200);
    assert.equal((await api(`/groups/${group.id}`, undefined, 'DELETE')).status, 200);
    bootstrap = (await api('/bootstrap')).body;
    assert.equal(bootstrap.state.conversations.find((c: any) => c.id === conversation.id).groupId, null);
  } finally {
    streamAbort.abort(); if (readEvents) await readEvents;
    await handle.close();
    for (const [key, value] of [['AGENT_CODEX_COMMAND', saved.command], ['AGENT_CODEX_ARGS', saved.args], ['AGENT_SKIP_PROVIDER_PROBE', saved.probe], ['AGENT_TEST_CODEX_TRACE', saved.trace]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await rm(directory, { recursive: true, force: true });
  }
});

test('simultaneous messages reserve one conversation and preserve the accepted prompt', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-race-test-'));
  const store = new StateStore(directory); await store.load(); const conversation = store.createConversation('primary');
  let release!: () => void;
  const completion = new Promise<void>(resolve => { release = resolve; });
  const prompts: string[] = [];
  const provider = {
    get: () => ({ status: 'connected' }),
    run: async (_providerId: string, request: ProviderRequest) => { const text = [...request.conversation.messages].reverse().find(message => message.role === 'user')!.content; prompts.push(text); await completion; request.callbacks.delta(text); },
    close: async () => { release(); },
  } as unknown as ProviderManager;
  const interactions = new InteractionStore(directory, 'test-host'); await interactions.load();
  const manager = new RunManager(store, provider, () => {}, interactions);
  try {
    const results = await Promise.allSettled([manager.send(conversation.id, { content: 'First prompt' }), manager.send(conversation.id, { content: 'Second prompt' })]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const rejected = results.find(result => result.status === 'rejected'); assert.equal((rejected as PromiseRejectedResult).reason.status, 409);
    assert.equal(conversation.messages.filter(message => message.role === 'user').length, 1);
    assert.equal(prompts.length, 1); assert.equal(prompts[0], conversation.messages[0].content);
    release(); await waitFor(async () => conversation.messages.at(-1)?.status, status => status === 'completed');
  } finally { release(); await manager.close(); await rm(directory, { recursive: true, force: true }); }
});

test('Codex discovery handles minimal macOS PATH and Windows npm installations without a shell', async () => {
  const macNative = '/Users/test/.local/bin/codex';
  const mac = await locateCodex({ platform: 'darwin', arch: 'arm64', home: '/Users/test', env: { PATH: '/usr/bin:/bin' }, exists: async filename => filename === macNative, canonical: async filename => filename });
  assert.equal(mac.command, macNative);
  const home = win32.join('C:/', 'Users', 'Test'), npm = win32.join(home, 'AppData', 'Roaming', 'npm');
  const shim = win32.join(npm, 'codex.cmd');
  const native = win32.join(npm, 'node_modules', '@openai', 'codex-win32-x64', 'vendor', 'x86_64-pc-windows-msvc', 'bin', 'codex.exe');
  const entry = win32.join(npm, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
  const runtime = win32.join('C:/', 'Program Files', 'A Gent', 'A Gent.exe');
  const common = { platform: 'win32' as const, arch: 'x64', home, env: { PATH: npm }, execPath: runtime, canonical: async (filename: string) => filename };
  const withNative = await locateCodex({ ...common, exists: async filename => [shim, native].includes(filename) });
  assert.deepEqual(withNative, { command: native });
  const withEntry = await locateCodex({ ...common, exists: async filename => [shim, entry].includes(filename) });
  assert.deepEqual(withEntry, { command: runtime, args: [entry] });
  await assert.rejects(() => locateCodex({ ...common, exists: async filename => filename === shim }), /not found/);
});

test('Codex shutdown observes child exit after escalating an ignored graceful stop', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-shutdown-test-')), pidFile = join(directory, 'pid');
  const bridge = new CodexBridge({ command: process.execPath, args: [fixture, '--ignore-shutdown', '--pid-file', pidFile] });
  let pid: number | undefined;
  try {
    await bridge.info(); pid = Number(await readFile(pidFile, 'utf8'));
    await bridge.close();
    assert.throws(() => process.kill(pid!, 0), (error: NodeJS.ErrnoException) => error.code === 'ESRCH', 'close resolves only after its child has exited');
  } finally {
    if (pid) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    await bridge.close(); await rm(directory, { recursive: true, force: true });
  }
});

test('OpenCode shutdown waits for child exit after termination escalation', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-opencode-shutdown-')), pidFile = join(directory, 'pid');
  const bridge = new OpenCodeBridge({ command: process.execPath, args: [opencodeFixture, '--ignore-shutdown', '--pid-file', pidFile] });
  const controller = new AbortController();
  const now = new Date().toISOString();
  let pid: number | undefined;
  try {
    const request: ProviderRequest = {
      agent: { id: 'primary', name: 'A Gent', description: '', instructions: '', color: '#f39161', icon: 'spark', providerId: 'opencode', modelId: 'opencode/test-model', reasoningEffort: '', createdAt: now },
      conversation: { id: 'chat', agentId: 'primary', title: 'Test', createdAt: now, updatedAt: now, messages: [{ id: 'm', role: 'user', content: '[hold]', createdAt: now }] },
      modelId: 'opencode/test-model', mode: 'chat', workspace: directory, signal: controller.signal,
      callbacks: { delta: () => {}, activity: () => {}, approval: () => {}, thread: () => {} },
    };
    const run = bridge.run(request).then(() => 'resolved', error => error as Error);
    await waitFor(async () => { try { return await readFile(pidFile, 'utf8'); } catch { return ''; } }, text => text.length > 0);
    pid = Number(await readFile(pidFile, 'utf8'));
    controller.abort();
    const result = await run;
    assert.ok(result instanceof Error);
    assert.match(result.message, /interrupted|shutdown/);
    assert.throws(() => process.kill(pid!, 0), (error: NodeJS.ErrnoException) => error.code === 'ESRCH', 'interrupt resolves only after the child has exited');
  } finally {
    if (pid) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    await bridge.close().catch(() => {});
    await rm(directory, { recursive: true, force: true });
  }
});

test('OpenCode Stop keeps the chat reserved until the child has exited', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-opencode-stop-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const pidFile = join(directory, 'opencode-pid');
  const saved = { command: process.env.AGENT_OPENCODE_COMMAND, args: process.env.AGENT_OPENCODE_ARGS, probe: process.env.AGENT_SKIP_PROVIDER_PROBE };
  process.env.AGENT_OPENCODE_COMMAND = process.execPath;
  process.env.AGENT_OPENCODE_ARGS = JSON.stringify([opencodeFixture, '--ignore-shutdown', '--pid-file', pidFile]);
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const api = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  let pid: number | undefined;
  try {
    assert.equal((await api('/providers/opencode/connect', {})).body.readiness, 'ready');
    const agent = await api('/agents', { name: 'OpenCode Stop', providerId: 'opencode', modelId: 'opencode/test-model' });
    assert.equal(agent.status, 201);
    const conversation = await api('/conversations', { agentId: agent.body.id });
    assert.equal(conversation.status, 201);
    const run = await api(`/conversations/${conversation.body.id}/messages`, { content: '[hold]' });
    assert.equal(run.status, 202);
    await waitFor(async () => { try { return await readFile(pidFile, 'utf8'); } catch { return ''; } }, text => text.length > 0);
    pid = Number(await readFile(pidFile, 'utf8'));
    assert.equal((await api(`/runs/${run.body.id}/interrupt`, {})).body.status, 'interrupted');
    assert.equal((await api(`/conversations/${conversation.body.id}/messages`, { content: 'Too early' })).status, 409, 'chat stays reserved while the child is terminating');
    const status = await waitFor(async () => (await api(`/conversations/${conversation.body.id}/messages`, { content: 'After stop' })).status, value => value !== 409);
    assert.equal(status, 202);
    assert.throws(() => process.kill(pid!, 0), (error: NodeJS.ErrnoException) => error.code === 'ESRCH', 'the chat is released only after the child exits');
  } finally {
    if (pid) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    await handle.close().catch(() => {});
    await rm(directory, { recursive: true, force: true });
    for (const [key, value] of [['AGENT_OPENCODE_COMMAND', saved.command], ['AGENT_OPENCODE_ARGS', saved.args], ['AGENT_SKIP_PROVIDER_PROBE', saved.probe]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('host shutdown terminates an active OpenCode run and persists it as interrupted', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-opencode-shutdown-run-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const pidFile = join(directory, 'opencode-pid');
  const saved = { command: process.env.AGENT_OPENCODE_COMMAND, args: process.env.AGENT_OPENCODE_ARGS, probe: process.env.AGENT_SKIP_PROVIDER_PROBE };
  process.env.AGENT_OPENCODE_COMMAND = process.execPath;
  process.env.AGENT_OPENCODE_ARGS = JSON.stringify([opencodeFixture, '--ignore-shutdown', '--pid-file', pidFile]);
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const api = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  let pid: number | undefined;
  try {
    assert.equal((await api('/providers/opencode/connect', {})).body.readiness, 'ready');
    const agent = await api('/agents', { name: 'OpenCode Shutdown', providerId: 'opencode', modelId: 'opencode/test-model' });
    const conversation = await api('/conversations', { agentId: agent.body.id });
    assert.equal((await api(`/conversations/${conversation.body.id}/messages`, { content: '[hold]' })).status, 202);
    await waitFor(async () => { try { return await readFile(pidFile, 'utf8'); } catch { return ''; } }, text => text.length > 0);
    pid = Number(await readFile(pidFile, 'utf8'));
    await handle.close();
    assert.throws(() => process.kill(pid!, 0), (error: NodeJS.ErrnoException) => error.code === 'ESRCH', 'shutdown waits for the active child to exit');
    const persisted = JSON.parse(await readFile(join(directory, 'state.json'), 'utf8')) as any;
    const savedConversation = persisted.conversations.find((item: any) => item.id === conversation.body.id);
    assert.equal(savedConversation.messages.at(-1).status, 'interrupted');
    assert.equal(savedConversation.messages.at(-1).content, '');
  } finally {
    if (pid) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    await handle.close().catch(() => {});
    await rm(directory, { recursive: true, force: true });
    for (const [key, value] of [['AGENT_OPENCODE_COMMAND', saved.command], ['AGENT_OPENCODE_ARGS', saved.args], ['AGENT_SKIP_PROVIDER_PROBE', saved.probe]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('OpenCode provider discovers models and streams a continued CLI session', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-opencode-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const saved = { command: process.env.AGENT_OPENCODE_COMMAND, args: process.env.AGENT_OPENCODE_ARGS, probe: process.env.AGENT_SKIP_PROVIDER_PROBE };
  process.env.AGENT_OPENCODE_COMMAND = process.execPath;
  process.env.AGENT_OPENCODE_ARGS = JSON.stringify([opencodeFixture]);
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const api = async (path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') => {
    const response = await fetch(`${handle.url}/api${path}`, { method, headers: { Authorization: `Bearer ${handle.token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any };
  };
  try {
    const connected = await api('/providers/opencode/connect', {});
    assert.equal(connected.body.status, 'connected');
    assert.deepEqual(connected.body.models.map((model: any) => model.id), ['opencode/test-model', 'opencode/second-model']);
    const apps = await api('/apps');
    assert.ok(apps.body.some((app: any) => app.name === 'computer-use' && app.providerId === 'opencode' && app.source === 'runtime'));
    const agent = (await api('/agents', { name: 'OpenCode Agent', providerId: 'opencode', modelId: 'opencode/test-model' })).body;
    const conversation = (await api('/conversations', { agentId: agent.id })).body;
    const first = await api(`/conversations/${conversation.id}/messages`, { content: 'Hello OpenCode' });
    assert.equal(first.status, 202);
    const completed = await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === first.body.id && run.status === 'completed'));
    assert.equal(completed.state.conversations.find((chat: any) => chat.id === conversation.id).messages.at(-1).content, 'OpenCode test response.');
    assert.equal(completed.state.conversations.find((chat: any) => chat.id === conversation.id).providerThreadId, 'opencode-session-1');
    const second = await api(`/conversations/${conversation.id}/messages`, { content: 'Continue OpenCode' });
    assert.equal(second.status, 202);
    const finalState = await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === second.body.id && run.status === 'completed'));
    assert.equal(finalState.state.conversations.find((chat: any) => chat.id === conversation.id).messages.at(-1).content, 'OpenCode continued response.');
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    for (const [key, value] of [['AGENT_OPENCODE_COMMAND', saved.command], ['AGENT_OPENCODE_ARGS', saved.args], ['AGENT_SKIP_PROVIDER_PROBE', saved.probe]] as const) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test('HTTP model adapters stream endpoint text and never persist an API key', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-provider-test-'));
  let authorization = '';
  const fake = createServer((request, response) => {
    authorization = request.headers.authorization ?? '';
    if (request.url === '/v1/models') { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ data: [{ id: 'local-model' }] })); }
    else if (request.url === '/v1/chat/completions') { response.setHeader('Content-Type', 'text/event-stream'); response.write('data: {"choices":[{"delta":{"content":"Streamed "}}]}\n\n'); response.end('data: {"choices":[{"delta":{"content":"response."}}]}'); }
    else { response.statusCode = 404; response.end(); }
  });
  await new Promise<void>(resolve => fake.listen(0, '127.0.0.1', resolve));
  const address = fake.address(); assert.ok(address && typeof address !== 'string');
  const manager = new ProviderManager(directory, () => {});
  try {
    await manager.load();
    const provider = await manager.connect('openai-compatible', { baseUrl: `http://127.0.0.1:${address.port}/v1`, apiKey: 'test-private-key' });
    assert.equal(provider.status, 'connected'); assert.equal(authorization, 'Bearer test-private-key');
    assert.ok(!(await readFile(join(directory, 'connections.json'), 'utf8')).includes('test-private-key'));
    const store = new StateStore(directory); await store.load(); const conversation = store.createConversation('primary');
    conversation.messages.push({ id: 'user', role: 'user', content: 'Hello', createdAt: new Date().toISOString() });
    let text = '';
    const request = { agent: store.state.agents[0], conversation, modelId: 'local-model', mode: 'chat' as const, workspace: directory, signal: new AbortController().signal, callbacks: { delta: (delta: string) => { text += delta; }, activity() {}, approval() {}, thread() {} } };
    await manager.run('openai-compatible', request);
    assert.equal(text, 'Streamed response.');
    const cloud = await manager.connect('cloud', { baseUrl: `http://127.0.0.1:${address.port}/v1`, apiKey: 'cloud-key' });
    assert.equal(cloud.status, 'connected');
    const antigravity = await manager.connect('antigravity', { baseUrl: `http://127.0.0.1:${address.port}/v1`, apiKey: 'antigravity-key' });
    assert.equal(antigravity.status, 'connected');
    let cloudText = ''; await manager.run('cloud', { ...request, callbacks: { ...request.callbacks, delta: (delta: string) => { cloudText += delta; } } });
    assert.equal(cloudText, 'Streamed response.');
    let antigravityText = ''; await manager.run('antigravity', { ...request, callbacks: { ...request.callbacks, delta: (delta: string) => { antigravityText += delta; } } });
    assert.equal(antigravityText, 'Streamed response.');
    await assert.rejects(() => manager.connect('ollama', { baseUrl: 'file:///etc/passwd' }), /http or https/);
  } finally { await manager.close(); await new Promise<void>(resolve => fake.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
});
