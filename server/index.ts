import express, { type ErrorRequestHandler, type Response } from 'express';
import { createServer } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { hostname, networkInterfaces } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Agent, Attachment, DeviceInfo, Schedule, SendMessageInput, ServerEvent, ServerHandle, ServerOptions, WorkspaceFileEntry } from '../shared/types.js';
import { MODEL_ID_LIMIT } from '../shared/providers.js';
import { BUDGETS } from './budgets.js';
import { redact, requestIdFrom } from './diagnostics.js';
import { DeviceStore } from './devices.js';
import { InteractionStore } from './interactions.js';
import { agentPatch, conversationPatch, id, InputError, now, object, schedulePatch, settingsPatch, StateStore, string } from './store.js';
import { ProviderManager } from './providers.js';
import { RunManager } from './runs.js';

const DEVICE_COOKIE = 'agent_desktop_token';
type RequestAuth = { admin: boolean; device?: DeviceInfo };

function textTokenMatches(received: string, expected: string): boolean {
  const left = Buffer.from(received), right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
function readCookie(request: express.Request, name: string): string {
  const header = request.headers.cookie;
  if (!header) return '';
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0 || part.slice(0, index).trim() !== name) continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return ''; }
  }
  return '';
}
function deviceCookie(request: express.Request, token: string): string {
  const secure = request.secure || request.headers['x-forwarded-proto'] === 'https';
  return `${DEVICE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${secure ? '; Secure' : ''}`;
}
function clearDeviceCookie(request: express.Request): string {
  const secure = request.secure || request.headers['x-forwarded-proto'] === 'https';
  return `${DEVICE_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
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
  return { content, attachments, mode: data.mode as 'chat' | 'work' | undefined, providerId: data.providerId === undefined ? undefined : string(data.providerId, 'Provider ID', 200), modelId: data.modelId === undefined ? undefined : string(data.modelId, 'Model ID', MODEL_ID_LIMIT, true) };
}

export async function startServer(options: ServerOptions = {}): Promise<ServerHandle> {
  const app = express();
  app.disable('x-powered-by');
  const host = options.host ?? process.env.AGENT_HOST ?? '127.0.0.1';
  const port = options.port ?? Number(process.env.PORT ?? process.env.AGENT_PORT ?? 4317);
  const dataDir = resolve(options.dataDir ?? process.env.AGENT_DATA_DIR ?? join(process.cwd(), '.data'));
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const token = await loadToken(dataDir, options.token ?? process.env.AGENT_TOKEN);
  const store = new StateStore(dataDir, { lock: true }); await store.load();
  const devices = new DeviceStore(dataDir);
  try { await devices.load(); }
  catch (error) { await store.close(); throw error; }
  const hostId = createHash('sha256').update(dataDir).digest('hex').slice(0, 16);
  const interactions = new InteractionStore(dataDir, hostId);
  try { await interactions.load(); }
  catch (error) { await store.close(); throw error; }
  const clients = new Map<Response, string | undefined>();
  const closeDeviceStreams = (deviceId: string) => {
    for (const [client, clientDeviceId] of clients) {
      if (clientDeviceId !== deviceId) continue;
      clients.delete(client);
      client.end();
    }
  };
  const emit = (event: ServerEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const [client] of clients) {
      if (client.destroyed || client.writableEnded) { clients.delete(client); continue; }
      if (client.writableLength > BUDGETS.sseBufferBytes) { client.end(); clients.delete(client); continue; }
      client.write(data);
    }
  };
  const providers = new ProviderManager(dataDir, providers => emit({ type: 'providers', providers })); await providers.load();
  const runs = new RunManager(store, providers, emit, interactions);
  const server = createServer(app);
  let closed = false;
  const allowLocalTokenInjection = options.allowLocalTokenInjection ?? process.env.AGENT_ALLOW_LOCAL_TOKEN_INJECTION === '1';
  const isLocalHostRequest = (request: express.Request): boolean => {
    const address = request.socket.remoteAddress;
    if (!address || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return false;
    if (request.headers.forwarded || request.headers['x-forwarded-for'] || request.headers['x-forwarded-host'] || request.headers['x-real-ip']) return false;
    let requestHost = '';
    try { requestHost = new URL(`http://${request.headers.host}`).hostname; } catch { return false; }
    return ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(requestHost);
  };
  const browserSession = async (request: express.Request): Promise<{ token: string; cookie?: string }> => {
    const cookie = readCookie(request, DEVICE_COOKIE);
    if (cookie) {
      if (textTokenMatches(cookie, token)) {
        // Upgrade the legacy root-token cookie to a revocable per-device token.
        const created = await devices.create('Desktop app');
        return { token: created.token, cookie: deviceCookie(request, created.token) };
      }
      // A present but invalid cookie must not fall back to the root token.
      return devices.authenticate(cookie) ? { token: cookie } : { token: '' };
    }
    if (!allowLocalTokenInjection) return { token: '' };
    const address = request.socket.remoteAddress;
    let requestHost = '';
    try { requestHost = new URL(`http://${request.headers.host}`).hostname; } catch {}
    const forwarded = request.headers.forwarded || request.headers['x-forwarded-for'] || request.headers['x-forwarded-host'] || request.headers['x-real-ip'];
    return address && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) && ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(requestHost) && !forwarded ? { token } : { token: '' };
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
    const requestId = requestIdFrom(req.headers['x-request-id']) ?? id();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    if (closed) { res.status(503).json({ error: 'A Gent is shutting down. Reconnect before starting more work.', requestId }); return; }
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
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*; frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    next();
  });
  app.use('/api', (req, res, next) => {
    const authorization = req.headers.authorization;
    const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const admin = Boolean(bearer) && textTokenMatches(bearer, token);
    const device = !admin && bearer ? devices.authenticate(bearer) : undefined;
    if (!admin && !device) { res.status(401).json({ error: 'Connect with this A Gent server’s pairing token.', requestId: res.locals.requestId }); return; }
    res.locals.auth = { admin, device };
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '32mb' }));
  const publish = async () => { await runs.publishState(); };
  const requireAdmin = (res: Response) => {
    const auth = res.locals.auth as RequestAuth;
    if (!auth.admin) throw new InputError('Only the host administrator token can manage devices.', 403);
  };
  const requireHostAuthority = (req: express.Request, res: Response) => {
    const auth = res.locals.auth as RequestAuth;
    if (!auth.admin && !isLocalHostRequest(req)) {
      throw new InputError('Only the host administrator or the desktop app on this computer can change host credentials or workspace configuration.', 403);
    }
  };
  const hostOnlySettings = new Set(['defaultProviderId', 'defaultModelId', 'speech']);
  const checkGroup = (groupId?: string | null) => { if (groupId && !store.state.groups.some(group => group.id === groupId)) throw new InputError('Group not found.', 404); };
  const checkAgentGroup = (groupId?: string | null) => { if (groupId && !store.state.agentGroups.some(group => group.id === groupId)) throw new InputError('Agent group not found.', 404); };
  const workspaceFor = (conversationId?: string, agentId?: string): string => {
    if (conversationId) {
      const conversation = store.getConversation(conversationId);
      const agent = store.getAgent(conversation.agentId);
      return conversation.workspacePath || agent.workspacePath || join(store.directory, 'workspace');
    }
    if (agentId) return store.getAgent(agentId).workspacePath || join(store.directory, 'workspace');
    throw new InputError('Choose an agent or conversation before browsing files.');
  };

  app.get('/api/health', (_req, res) => { res.json({ ok: true, name: 'A Gent', version: '0.1.0' }); });
  app.get('/api/bootstrap', (_req, res) => { res.json({ state: store.state, providers: providers.providers, runs: [...runs.runs.values()], interactions: runs.getInteractions() }); });
  app.get('/api/events', (_req, res) => {
    const auth = res.locals.auth as RequestAuth;
    res.status(200).set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders(); res.write(': connected\n\n');
    clients.set(res, auth.device?.id);
    res.write(`data: ${JSON.stringify({ type: 'state', state: store.state })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'providers', providers: providers.providers })}\n\n`);
    for (const run of runs.runs.values()) res.write(`data: ${JSON.stringify({ type: 'run', run })}\n\n`);
    const heartbeat = setInterval(() => { if (!res.destroyed) res.write(': heartbeat\n\n'); }, BUDGETS.heartbeat);
    res.on('close', () => { clearInterval(heartbeat); clients.delete(res); });
  });
  app.post('/api/agents', async (req, res) => {
    if (store.state.agents.length >= 500) throw new InputError('This workspace has reached its 500 agent limit.');
    const patch = agentPatch(req.body);
    if (!patch.name) throw new InputError('Give your agent a name.');
    if (patch.providerId) providers.get(patch.providerId);
    checkAgentGroup(patch.agentGroupId);
    const agent: Agent = { id: id(), name: patch.name, description: '', instructions: 'You are a helpful assistant.', color: '#f39161', icon: 'custom', providerId: store.state.settings.defaultProviderId, modelId: store.state.settings.defaultModelId, reasoningEffort: '', createdAt: now(), ...patch };
    store.state.agents.push(agent); await publish(); res.status(201).json(agent);
  });
  app.patch('/api/agents/:id', async (req, res) => {
    const agent = store.state.agents.find(agent => agent.id === req.params.id);
    if (!agent) throw new InputError('Agent not found.', 404);
    const patch = agentPatch(req.body);
    if (patch.providerId) providers.get(patch.providerId);
    checkAgentGroup(patch.agentGroupId);
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
    const effectiveProviderId = patch.providerId || conversation.providerId || store.getAgent(conversation.agentId).providerId;
    const provider = providers.get(effectiveProviderId);
    const effectiveModelId = patch.modelId !== undefined ? patch.modelId : conversation.modelId;
    if (effectiveModelId && provider.models.length && !provider.models.some(model => model.id === effectiveModelId)) throw new InputError('Choose a model available from this provider.', 409);
    const model = effectiveModelId ? provider.models.find(item => item.id === effectiveModelId) : undefined;
    const effectiveEffort = patch.reasoningEffort !== undefined ? patch.reasoningEffort : conversation.reasoningEffort;
    if (effectiveEffort && model?.reasoning?.kind === 'enum' && !model.reasoning.options.some(option => option.value === effectiveEffort)) throw new InputError('The selected reasoning option is not supported by this model.', 409);
    if (effectiveEffort && model?.reasoning?.kind === 'unsupported') throw new InputError('This model does not support a reasoning setting.', 409);
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
  app.post('/api/interactions/:id', async (req, res) => {
    const data = object(req.body), action = String(data.action);
    if (!['accept', 'decline', 'cancel'].includes(action)) throw new InputError('Choose accept, decline, or cancel.');
    res.json(await runs.respondInteraction(String(req.params.id), action as 'accept' | 'decline' | 'cancel', data.response));
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
  app.post('/api/agent-groups', async (req, res) => {
    const data = object(req.body), group = { id: id(), name: string(data.name, 'Agent group name', 100), createdAt: now() };
    if (store.state.agentGroups.length >= 1000) throw new InputError('This workspace has reached its 1,000 agent group limit.');
    store.state.agentGroups.push(group); await publish(); res.status(201).json(group);
  });
  app.patch('/api/agent-groups/:id', async (req, res) => {
    const group = store.state.agentGroups.find(group => group.id === req.params.id); if (!group) throw new InputError('Agent group not found.', 404);
    group.name = string(object(req.body).name, 'Agent group name', 100); await publish(); res.json(group);
  });
  app.delete('/api/agent-groups/:id', async (req, res) => {
    const index = store.state.agentGroups.findIndex(group => group.id === req.params.id); if (index < 0) throw new InputError('Agent group not found.', 404);
    store.state.agentGroups.splice(index, 1);
    for (const agent of store.state.agents) if (agent.agentGroupId === req.params.id) agent.agentGroupId = null;
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
  app.patch('/api/settings', async (req, res) => {
    const patch = settingsPatch(req.body);
    if (Object.keys(patch).some(key => hostOnlySettings.has(key))) requireHostAuthority(req, res);
    if (patch.defaultProviderId) providers.get(patch.defaultProviderId);
    Object.assign(store.state.settings, patch); await publish(); res.json(store.state.settings);
  });
  app.get('/api/auth', (_req, res) => {
    const auth = res.locals.auth as RequestAuth;
    res.json({ admin: auth.admin, device: auth.device ?? null });
  });
  app.get('/api/devices', (_req, res) => {
    const auth = res.locals.auth as RequestAuth;
    const list = auth.admin ? devices.list() : auth.device ? [auth.device] : [];
    res.json(list.map(device => ({ ...device, current: auth.device?.id === device.id })));
  });
  app.post('/api/devices', async (req, res) => {
    requireAdmin(res);
    const data = object(req.body ?? {});
    const created = await devices.create(data.name === undefined ? 'Desktop app' : string(data.name, 'Device name', 100));
    res.status(201).json(created);
  });
  app.post('/api/devices/:id/rotate', async (req, res) => {
    const auth = res.locals.auth as RequestAuth;
    const id = String(req.params.id);
    if (!auth.admin && auth.device?.id !== id) throw new InputError('Only the host administrator can rotate another device.', 403);
    const rotated = await devices.rotate(id);
    closeDeviceStreams(id);
    if (!auth.admin) res.setHeader('Set-Cookie', deviceCookie(req, rotated.token));
    res.json(rotated);
  });
  app.delete('/api/devices/:id', async (req, res) => {
    const auth = res.locals.auth as RequestAuth;
    const id = String(req.params.id);
    if (!auth.admin && auth.device?.id !== id) throw new InputError('Only the host administrator can revoke another device.', 403);
    const revoked = await devices.revoke(id);
    closeDeviceStreams(id);
    if (!auth.admin) res.setHeader('Set-Cookie', clearDeviceCookie(req));
    res.json(revoked);
  });
  app.get('/api/workspace/files', async (req, res) => {
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const agentId = typeof req.query.agentId === 'string' ? req.query.agentId : undefined;
    const workspace = workspaceFor(conversationId, agentId);
    let root: string;
    try { root = await realpath(workspace); }
    catch { throw new InputError('The workspace folder does not exist or cannot be opened.', 404); }
    const requested = typeof req.query.path === 'string' ? req.query.path : '';
    if (requested.includes('\0') || requested.startsWith('/') || requested.split(/[\\/]/).some(part => part === '..')) throw new InputError('Choose a folder inside the workspace.');
    const candidate = resolve(root, requested);
    if (candidate !== root && !candidate.startsWith(root + sep)) throw new InputError('Choose a folder inside the workspace.', 403);
    let folder: string;
    try { folder = await realpath(candidate); }
    catch { throw new InputError('Folder not found.', 404); }
    if (folder !== root && !folder.startsWith(root + sep)) throw new InputError('Choose a folder inside the workspace.', 403);
    if (!(await stat(folder)).isDirectory()) throw new InputError('This path is not a folder.');
    const ignored = new Set(['.git', 'node_modules', '.DS_Store']);
    const all = (await readdir(folder, { withFileTypes: true })).filter(entry => !ignored.has(entry.name));
    all.sort((left, right) => Number(right.isDirectory()) - Number(left.isDirectory()) || left.name.localeCompare(right.name));
    const entries: WorkspaceFileEntry[] = [];
    for (const entry of all.slice(0, 500)) {
      const type = entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file';
      let size: number | undefined;
      if (type === 'file') { try { size = (await stat(join(folder, entry.name))).size; } catch { /* raced with a file change */ } }
      entries.push({ name: entry.name, type, ...(size === undefined ? {} : { size }) });
    }
    res.json({ root, path: requested.split(/[\\/]/).filter(Boolean).join('/'), entries, truncated: all.length > 500 });
  });
  app.get('/api/providers', (_req, res) => { res.json(providers.providers); });
  app.get('/api/apps', async (req, res) => {
    const conversationId = typeof req.query.conversationId === 'string' ? req.query.conversationId : undefined;
    const threadId = conversationId ? store.getConversation(conversationId).providerThreadId : undefined;
    res.json(await providers.apps(threadId));
  });
  app.get('/api/app-records', (_req, res) => { res.json(store.state.apps); });
  app.post('/api/app-records', async (req, res) => {
    requireHostAuthority(req, res);
    const data = object(req.body), timestamp = now();
    const record = await store.saveApp({ ...data, id: data.id === undefined ? id() : string(data.id, 'App ID', 100), createdAt: timestamp, updatedAt: timestamp });
    await publish(); res.status(201).json(record);
  });
  app.patch('/api/app-records/:id', async (req, res) => {
    requireHostAuthority(req, res);
    const appId = String(req.params.id), existing = store.state.apps.find(item => item.id === appId);
    if (!existing) throw new InputError('App record not found.', 404);
    const record = await store.saveApp({ ...existing, ...object(req.body), id: appId, updatedAt: now() }, appId);
    await publish(); res.json(record);
  });
  app.delete('/api/app-records/:id', async (req, res) => {
    requireHostAuthority(req, res);
    if (!(await store.removeApp(String(req.params.id)))) throw new InputError('App record not found.', 404);
    await publish(); res.json({ ok: true });
  });
  app.post('/api/providers/:id/connect', async (req, res) => { requireHostAuthority(req, res); res.json(await providers.connect(String(req.params.id), req.body ?? {})); });
  app.post('/api/providers/:id/disconnect', async (req, res) => {
    requireHostAuthority(req, res);
    const providerId = String(req.params.id);
    if ([...runs.runs.values()].some(run => run.providerId === providerId && ['running', 'waiting'].includes(run.status))) throw new InputError('Stop active runs for this provider before disconnecting.', 409);
    res.json(await providers.disconnect(providerId));
  });
  app.post('/api/providers/:id/test', async (req, res) => { requireHostAuthority(req, res); res.json(await providers.test(String(req.params.id), req.body ?? {})); });
  app.get('/api/export', (req, res) => { requireHostAuthority(req, res); res.setHeader('Content-Disposition', 'attachment; filename="a-gent-workspace.json"'); res.json(store.state); });
  app.post('/api/import', async (req, res) => { requireHostAuthority(req, res); await store.merge(req.body); await publish(); res.json(store.state); });
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
        const session = await browserSession(req);
        if (session.cookie) res.setHeader('Set-Cookie', session.cookie);
        const html = await vite.transformIndexHtml(req.originalUrl, injectConfig(source, session.token));
        res.type('html').send(html);
      } catch (error) { vite.ssrFixStacktrace(error as Error); next(error); }
    });
  } else {
    app.use(express.static(staticDir, { index: false, dotfiles: 'deny' }));
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || !req.accepts('html')) { next(); return; }
      try {
        const source = await readFile(join(staticDir, 'index.html'), 'utf8');
        const session = await browserSession(req);
        if (session.cookie) res.setHeader('Set-Cookie', session.cookie);
        res.type('html').send(injectConfig(source, session.token));
      } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') res.status(503).json({ error: 'Build A Gent with npm run build before starting this server.' }); else next(error); }
    });
  }
  const errorHandler: ErrorRequestHandler = (error: Error & { status?: number; type?: string }, _req, res, _next) => {
    if (res.headersSent) { res.end(); return; }
    const status = error instanceof InputError ? error.status : error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    const requestId = (res.locals.requestId as string | undefined) ?? id();
    const detail = redact(error.message);
    if (status === 500) console.error(`[${requestId}] A Gent request failed: ${detail}`);
    const message = status === 413 ? 'This request exceeds the 32 MB limit.' : status === 500 ? 'A Gent could not complete this request. Check the server log.' : detail;
    res.status(status).json({ error: message, requestId });
  };
  app.use(errorHandler);
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { server.off('error', reject); resolve(); }); });
  } catch (error) {
    await runs.close(); await devices.close(); await store.close(); if (closeVite) await closeVite();
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
    server.closeIdleConnections();
    server.closeAllConnections();
    for (const client of clients.keys()) client.end(); clients.clear();
    await runs.close(); await devices.close(); await store.close(); if (closeVite) await closeVite();
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
  startServer({ dev: process.argv.includes('--dev'), host, allowLocalTokenInjection: process.argv.includes('--dev'), ...(portValue ? { port: Number(portValue) } : {}), ...(arg('--data-dir') ? { dataDir: arg('--data-dir') } : {}) }).then(handle => {
    console.log(`A Gent is ready at ${handle.url}`);
    if (!['127.0.0.1', 'localhost', '::1'].includes(host)) console.log(`Pairing token: ${handle.token}\nUse this computer’s private network address from your other device.`);
    const shutdown = () => { void handle.close().then(() => process.exit(0), error => { console.error((error as Error).message); process.exit(1); }); };
    process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
  }).catch(error => { console.error((error as Error).message); process.exitCode = 1; });
}
