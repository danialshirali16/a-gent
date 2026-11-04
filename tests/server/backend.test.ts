import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, request as httpRequest } from 'node:http';
import { startServer } from '../../server/index.js';
import { StateStore, validateImport } from '../../server/store.js';
import { ProviderManager } from '../../server/providers.js';
import { RunManager } from '../../server/runs.js';
import { CodexBridge, type ProviderRequest } from '../../server/codex.js';
import { locateCodex } from '../../server/codex-discovery.js';
import type { ServerEvent } from '../../shared/types.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), 'fake-codex.mjs');
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

test('desktop pairing cookie gates token injection', async () => {
  const directory = await mkdtemp(join(scratch, 'agent-cookie-test-'));
  const staticDir = join(directory, 'static'); await mkdir(staticDir); await writeFile(join(staticDir, 'index.html'), '<!doctype html><html><head></head><body>A Gent</body></html>');
  const previousProbe = process.env.AGENT_SKIP_PROVIDER_PROBE;
  process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
  const handle = await startServer({ port: 0, dataDir: directory, staticDir, dev: false });
  const readPage = (headers: Record<string, string>) => new Promise<string>((resolve, reject) => {
    const request = httpRequest(handle.url, { headers, agent: false }, response => {
      let body = ''; response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve(body));
    });
    request.on('error', reject); request.end();
  });
  try {
    assert.ok(!(await readPage({})).includes(handle.token));
    assert.ok((await readPage({ Cookie: `agent_desktop_token=${handle.token}` })).includes(handle.token));
  } finally {
    await handle.close(); await rm(directory, { recursive: true, force: true });
    if (previousProbe === undefined) delete process.env.AGENT_SKIP_PROVIDER_PROBE; else process.env.AGENT_SKIP_PROVIDER_PROBE = previousProbe;
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
    const apps = await api('/apps');
    assert.deepEqual(apps.body, [{ name: 'Calendar', status: 'connected', toolsCount: 1 }, { name: 'Files', status: 'needs-auth', toolsCount: 0 }]);
    assert.ok(!JSON.stringify(apps.body).includes('must-not-leak'));
    assert.equal((await api('/agents', { name: 'Bad', color: 'red' })).status, 400);
    const agent = (await api('/agents', { name: 'Test Agent', instructions: 'Test instructions', color: '#112233', providerId: 'codex' })).body;
    assert.equal(agent.name, 'Test Agent');
    const group = (await api('/groups', { name: 'Product' })).body;
    const conversation = (await api('/conversations', { agentId: agent.id, groupId: group.id })).body;
    assert.equal(conversation.groupId, group.id);
    assert.equal((await api(`/conversations/${conversation.id}`, { groupId: 'missing' }, 'PATCH')).status, 404);

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
    assert.equal(approval.command, 'echo A Gent test');
    assert.equal((await api(`/approvals/${approval.id}`, { decision: 'accept' })).status, 200);
    await waitFor(async () => (await api('/bootstrap')).body, data => data.runs.some((run: any) => run.id === approvalRun.id && run.status === 'completed'));
    assert.equal((await api(`/approvals/${approval.id}`, { decision: 'accept' })).status, 409);

    const slowRun = (await api(`/conversations/${conversation.id}/messages`, { content: '[slow]', mode: 'chat' })).body;
    assert.equal((await api(`/conversations/${conversation.id}/messages`, { content: 'Duplicate' })).status, 409);
    assert.equal((await api(`/runs/${slowRun.id}/interrupt`, {})).body.status, 'interrupted');
    await waitFor(async () => (await api('/bootstrap')).body, data => data.state.conversations.find((c: any) => c.id === conversation.id).messages.at(-1).status === 'interrupted');

    const schedule = (await api('/schedules', { agentId: agent.id, title: 'Once', prompt: 'Scheduled hello', runAt: new Date(Date.now() - 1000).toISOString() })).body;
    const scheduled = await waitFor(async () => (await api('/bootstrap')).body, data => data.state.schedules.find((s: any) => s.id === schedule.id)?.lastRunAt);
    assert.equal(scheduled.state.schedules.find((s: any) => s.id === schedule.id).enabled, false);
    const exportResponse = await api('/export'); assert.equal(exportResponse.status, 200);
    const exportedText = JSON.stringify(exportResponse.body); assert.ok(!exportedText.includes(handle.token)); assert.ok(!exportedText.includes('apiKey'));
    assert.equal((await api('/import', { ...exportResponse.body, version: 2 })).status, 400);
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
  const manager = new RunManager(store, provider, () => {});
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
    await manager.run('openai-compatible', { agent: store.state.agents[0], conversation, modelId: 'local-model', mode: 'chat', workspace: directory, signal: new AbortController().signal, callbacks: { delta: delta => { text += delta; }, activity() {}, approval() {}, thread() {} } });
    assert.equal(text, 'Streamed response.');
    await assert.rejects(() => manager.connect('ollama', { baseUrl: 'file:///etc/passwd' }), /http or https/);
  } finally { await manager.close(); await new Promise<void>(resolve => fake.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
});
