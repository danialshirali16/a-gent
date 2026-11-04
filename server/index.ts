import express, { type ErrorRequestHandler, type Response } from 'express';
import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { hostname, networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Agent, Attachment, Schedule, SendMessageInput, ServerEvent, ServerHandle, ServerOptions } from '../shared/types.js';
import { agentPatch, conversationPatch, id, InputError, now, object, schedulePatch, settingsPatch, StateStore, string } from './store.js';
import { ProviderManager } from './providers.js';
import { RunManager } from './runs.js';

function textTokenMatches(received: string, expected: string): boolean {
  const left = Buffer.from(received), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
async function loadToken(directory: string, supplied?: string): Promise<string> {
  if (supplied) { if (supplied.length < 24) throw new Error('AGENT_TOKEN must contain at least 24 characters.'); return supplied; }
  const filename = join(directory, '.token');
  try {
    const token = (await readFile(filename, 'utf8')).trim();
    if (token.length < 24) throw new Error('The saved pairing token is invalid.');
    return token;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const token = randomBytes(32).toString('base64url');
    await writeFile(filename, token, { mode: 0o600, flag: 'wx' });
    return token;
  }
}
function messageInput(value: unknown): SendMessageInput {
  const data = object(value);
  const content = string(data.content ?? '', 'Message', 100000, true);
  let attachments: Attachment[] | undefined;
  if (data.attachments !== undefined) {
    if (!Array.isArray(data.attachments) || data.attachments.length > 10) throw new InputError('Attach at most 10 text files.');
    attachments = data.attachments.map(value => {
      const attachment = object(value);
      return { id: typeof attachment.id === 'string' ? string(attachment.id, 'Attachment ID', 100) : id(), name: string(attachment.name, 'File name', 500), type: string(attachment.type ?? 'text/plain', 'File type', 200), content: string(attachment.content, 'File content', 1000000, true) };
    });
  }
  if (!content.trim() && !attachments?.length) throw new InputError('Write a message or attach a text file.');
  if (data.mode !== undefined && !['chat', 'work'].includes(String(data.mode))) throw new InputError('Choose Chat or Work mode.');
  return { content, attachments, mode: data.mode as 'chat' | 'work' | undefined, providerId: data.providerId === undefined ? undefined : string(data.providerId, 'Provider ID', 200), modelId: data.modelId === undefined ? undefined : string(data.modelId, 'Model ID', 200, true) };
}

export async function startServer(options: ServerOptions = {}): Promise<ServerHandle> {
  const app = express();
  app.disable('x-powered-by');
  const host = options.host ?? process.env.AGENT_HOST ?? '127.0.0.1';
  const port = options.port ?? Number(process.env.PORT ?? process.env.AGENT_PORT ?? 4317);
  const dataDir = resolve(options.dataDir ?? process.env.AGENT_DATA_DIR ?? join(process.cwd(), '.data'));
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const token = await loadToken(dataDir, options.token ?? process.env.AGENT_TOKEN);
  const store = new StateStore(dataDir); await store.load();
  const clients = new Set<Response>();
  const emit = (event: ServerEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
      if (client.destroyed || client.writableEnded) { clients.delete(client); continue; }
      if (client.writableLength > 2 * 1024 * 1024) { client.end(); clients.delete(client); continue; }
      client.write(data);
    }
  };
  const providers = new ProviderManager(dataDir, providers => emit({ type: 'providers', providers })); await providers.load();
  const runs = new RunManager(store, providers, emit);
  const server = createServer(app);
  let closed = false;
  const browserToken = (request: express.Request) => {
    const address = request.socket.remoteAddress;
    let requestHost = '';
    try { requestHost = new URL(`http://${request.headers.host}`).hostname; } catch {}
    const forwarded = request.headers.forwarded || request.headers['x-forwarded-for'] || request.headers['x-forwarded-host'] || request.headers['x-real-ip'];
    return address && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) && ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(requestHost) && !forwarded ? token : '';
  };
  let listenPort = port;
  const allowedHosts = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    allowedHosts.add(host); allowedHosts.add(hostname());
    for (const entries of Object.values(networkInterfaces())) for (const entry of entries ?? []) allowedHosts.add(entry.address);
  }
  for (const entry of (process.env.AGENT_ALLOWED_HOSTS ?? '').split(',').map(value => value.trim()).filter(Boolean)) allowedHosts.add(entry);
  const appOrigins = new Set(['capacitor://localhost', 'http://localhost', 'https://localhost', ...(process.env.AGENT_ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean)]);
  app.use((req, res, next) => {
    if (closed) { res.status(503).json({ error: 'A Gent is shutting down. Reconnect before starting more work.' }); return; }
    let requestUrl: URL;
    try { requestUrl = new URL(`http://${req.headers.host ?? ''}`); } catch { res.status(400).json({ error: 'Invalid request host.' }); return; }
    if (!allowedHosts.has(requestUrl.hostname) || (Number(requestUrl.port || 80) !== listenPort)) { res.status(403).json({ error: 'This host is not allowed to access A Gent.' }); return; }
    const origin = req.headers.origin;
    const sameOrigin = origin === `http://${req.headers.host}` || origin === `https://${req.headers.host}`;
    if (origin && !sameOrigin && !appOrigins.has(origin)) { res.status(403).json({ error: 'This origin is not allowed to access A Gent.' }); return; }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    next();
  });
  app.use('/api', (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith('Bearer ') || !textTokenMatches(authorization.slice(7), token)) { res.status(401).json({ error: 'Connect with this A Gent server’s pairing token.' }); return; }
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '8mb' }));
  const publish = async () => { await runs.publishState(); };
  const checkGroup = (groupId?: string | null) => { if (groupId && !store.state.groups.some(group => group.id === groupId)) throw new InputError('Group not found.', 404); };

  app.get('/api/health', (_req, res) => { res.json({ ok: true, name: 'A Gent', version: '0.1.0' }); });
  app.get('/api/bootstrap', (_req, res) => { res.json({ state: store.state, providers: providers.providers, runs: [...runs.runs.values()] }); });
  app.get('/api/events', (req, res) => {
    res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders(); res.write(': connected\n\n');
    clients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'state', state: store.state })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'providers', providers: providers.providers })}\n\n`);
    for (const run of runs.runs.values()) res.write(`data: ${JSON.stringify({ type: 'run', run })}\n\n`);
    const heartbeat = setInterval(() => { if (!res.destroyed) res.write(': heartbeat\n\n'); }, 15000);
    res.on('close', () => { clearInterval(heartbeat); clients.delete(res); });
  });
  app.post('/api/agents', async (req, res) => {
    if (store.state.agents.length >= 500) throw new InputError('This workspace has reached its 500 agent limit.');
    const patch = agentPatch(req.body);
    if (!patch.name) throw new InputError('Give your agent a name.');
    if (patch.providerId) providers.get(patch.providerId);
    const agent: Agent = { id: id(), name: patch.name, description: '', instructions: 'You are a helpful assistant.', color: '#f39161', icon: 'custom', providerId: store.state.settings.defaultProviderId, modelId: store.state.settings.defaultModelId, reasoningEffort: '', createdAt: now(), ...patch };
    store.state.agents.push(agent); await publish(); res.status(201).json(agent);
  });
  app.patch('/api/agents/:id', async (req, res) => {
    const agent = store.state.agents.find(agent => agent.id === req.params.id);
    if (!agent) throw new InputError('Agent not found.', 404);
    const patch = agentPatch(req.body);
    if (patch.providerId) providers.get(patch.providerId);
    if (agent.id === 'primary' && patch.archived) throw new InputError('Your primary A Gent stays in this workspace.');
    Object.assign(agent, patch); await publish(); res.json(agent);
  });
  app.post('/api/conversations', async (req, res) => {
    if (store.state.conversations.length >= 5000) throw new InputError('This workspace has reached its 5,000 chat limit.');
    const data = object(req.body), patch = conversationPatch(data); checkGroup(patch.groupId);
    const conversation = store.createConversation(string(data.agentId, 'Agent ID', 100), patch);
    await publish(); res.status(201).json(conversation);
  });
  app.patch('/api/conversations/:id', async (req, res) => {
    const conversation = store.getConversation(String(req.params.id)), patch = conversationPatch(req.body); checkGroup(patch.groupId);
    Object.assign(conversation, patch, { updatedAt: now() }); await publish(); res.json(conversation);
  });
  app.post('/api/conversations/:id/messages', async (req, res) => { res.status(202).json(await runs.send(String(req.params.id), messageInput(req.body))); });
  app.post('/api/conversations/:id/system', async (req, res) => {
    const conversation = store.getConversation(String(req.params.id));
    const content = string(object(req.body).content, 'Event', 500);
    const message = { id: id(), role: 'system' as const, content, createdAt: now() };
    conversation.messages.push(message);
    conversation.updatedAt = now();
    await publish();
    res.status(201).json(message);
  });
  app.post('/api/runs/:id/interrupt', (req, res) => { res.json(runs.interrupt(String(req.params.id))); });
  app.post('/api/approvals/:id', (req, res) => {
    const data = object(req.body);
    if (!['accept', 'decline'].includes(String(data.decision))) throw new InputError('Choose accept or decline.');
    runs.approve(String(req.params.id), data.decision === 'accept'); res.json({ ok: true });
  });
  app.post('/api/groups', async (req, res) => {
    const data = object(req.body), group = { id: id(), name: string(data.name, 'Group name', 100), createdAt: now() };
    if (store.state.groups.length >= 1000) throw new InputError('This workspace has reached its group limit.');
    store.state.groups.push(group); await publish(); res.status(201).json(group);
  });
  app.patch('/api/groups/:id', async (req, res) => {
    const group = store.state.groups.find(group => group.id === req.params.id); if (!group) throw new InputError('Group not found.', 404);
    group.name = string(object(req.body).name, 'Group name', 100); await publish(); res.json(group);
  });
  app.delete('/api/groups/:id', async (req, res) => {
    const index = store.state.groups.findIndex(group => group.id === req.params.id); if (index < 0) throw new InputError('Group not found.', 404);
    store.state.groups.splice(index, 1); for (const conversation of store.state.conversations) if (conversation.groupId === req.params.id) conversation.groupId = null;
    await publish(); res.json({ ok: true });
  });
  app.post('/api/schedules', async (req, res) => {
    const patch = schedulePatch(req.body);
    if (!patch.agentId || !patch.title || !patch.prompt || !patch.runAt) throw new InputError('Choose an agent, title, prompt, and run time.');
    store.getAgent(patch.agentId);
    if (patch.conversationId && store.getConversation(patch.conversationId).agentId !== patch.agentId) throw new InputError('This task’s chat belongs to another agent.');
    if (store.state.schedules.length >= 1000) throw new InputError('This workspace has reached its scheduled task limit.');
    const schedule = { ...patch, id: id(), enabled: patch.enabled ?? true } as Schedule;
    store.state.schedules.push(schedule); await publish(); res.status(201).json(schedule);
  });
  app.patch('/api/schedules/:id', async (req, res) => {
    const schedule = store.state.schedules.find(schedule => schedule.id === req.params.id); if (!schedule) throw new InputError('Task not found.', 404);
    const patch = schedulePatch(req.body); if (patch.agentId) store.getAgent(patch.agentId);
    const next = { ...schedule, ...patch };
    if (next.conversationId && store.getConversation(next.conversationId).agentId !== next.agentId) throw new InputError('This task’s chat belongs to another agent.');
    Object.assign(schedule, patch); await publish(); res.json(schedule);
  });
  app.delete('/api/schedules/:id', async (req, res) => {
    const index = store.state.schedules.findIndex(schedule => schedule.id === req.params.id); if (index < 0) throw new InputError('Task not found.', 404);
    store.state.schedules.splice(index, 1); await publish(); res.json({ ok: true });
  });
  app.patch('/api/settings', async (req, res) => { const patch = settingsPatch(req.body); if (patch.defaultProviderId) providers.get(patch.defaultProviderId); Object.assign(store.state.settings, patch); await publish(); res.json(store.state.settings); });
  app.get('/api/providers', (_req, res) => { res.json(providers.providers); });
  app.get('/api/apps', async (_req, res) => { res.json(await providers.apps()); });
  app.post('/api/providers/:id/connect', async (req, res) => { res.json(await providers.connect(String(req.params.id), req.body ?? {})); });
  app.get('/api/export', (_req, res) => { res.setHeader('Content-Disposition', 'attachment; filename="a-gent-workspace.json"'); res.json(store.state); });
  app.post('/api/import', async (req, res) => { await store.merge(req.body); await publish(); res.json(store.state); });
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'A Gent API endpoint not found.' }); });

  const staticDir = resolve(options.staticDir ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'dist'));
  let closeVite: (() => Promise<void>) | undefined;
  if (options.dev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares); closeVite = () => vite.close();
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) { next(); return; }
      try {
        const source = await readFile(join(process.cwd(), 'index.html'), 'utf8');
        const html = await vite.transformIndexHtml(req.originalUrl, injectConfig(source, browserToken(req)));
        res.type('html').send(html);
      } catch (error) { vite.ssrFixStacktrace(error as Error); next(error); }
    });
  } else {
    app.use(express.static(staticDir, { index: false, dotfiles: 'deny' }));
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) { next(); return; }
      try { res.type('html').send(injectConfig(await readFile(join(staticDir, 'index.html'), 'utf8'), browserToken(req))); }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') res.status(503).json({ error: 'Build A Gent with npm run build before starting this server.' }); else next(error); }
    });
  }
  const errorHandler: ErrorRequestHandler = (error: Error & { status?: number; type?: string }, _req, res, _next) => {
    if (res.headersSent) { res.end(); return; }
    const status = error instanceof InputError ? error.status : error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error('A Gent request failed:', error.message);
    res.status(status).json({ error: status === 413 ? 'This request exceeds the 8 MB limit.' : status === 500 ? 'A Gent could not complete this request. Check the server log.' : error.message });
  };
  app.use(errorHandler);
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { server.off('error', reject); resolve(); }); });
  } catch (error) {
    await runs.close(); if (closeVite) await closeVite();
    throw error;
  }
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('A Gent server did not obtain a TCP port.');
  listenPort = address.port;
  if (process.env.AGENT_SKIP_PROVIDER_PROBE !== '1') void providers.probeCodex();
  runs.startScheduler();
  const url = `http://${host === '::1' ? '[::1]' : host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host}:${listenPort}`;
  return { url, token, close: async () => {
    if (closed) return; closed = true;
    const listenerClosed = new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    for (const client of clients) client.end(); clients.clear();
    await runs.close(); if (closeVite) await closeVite();
    await listenerClosed;
  } };
}
function injectConfig(html: string, token: string): string {
  const config = JSON.stringify({ url: '', token }).replace(/</g, '\\u003c');
  const script = `<script>window.__AGENT_CONFIG__=${config};</script>`;
  return html.includes('<head>') ? html.replace('<head>', `<head>${script}`) : script + html;
}

const direct = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (direct) {
  const arg = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
  const host = arg('--host') ?? process.env.AGENT_HOST ?? '127.0.0.1';
  const portValue = arg('--port');
  startServer({ dev: process.argv.includes('--dev'), host, ...(portValue ? { port: Number(portValue) } : {}), ...(arg('--data-dir') ? { dataDir: arg('--data-dir') } : {}) }).then(handle => {
    console.log(`A Gent is ready at ${handle.url}`);
    if (!['127.0.0.1', 'localhost', '::1'].includes(host)) console.log(`Pairing token: ${handle.token}\nUse this computer’s private network address from your other device.`);
    const shutdown = () => { void handle.close().then(() => process.exit(0), error => { console.error((error as Error).message); process.exit(1); }); };
    process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
  }).catch(error => { console.error((error as Error).message); process.exitCode = 1; });
}
