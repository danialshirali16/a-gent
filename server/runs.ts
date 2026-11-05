import { mkdir, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { isProviderReady } from '../shared/providers.js';
import type { Activity, Approval, Message, PendingInteraction, Run, SendMessageInput, ServerEvent } from '../shared/types.js';
import { BUDGETS } from './budgets.js';
import { redact } from './diagnostics.js';
import { InteractionStore } from './interactions.js';
import { ProviderManager } from './providers.js';
import { bindingFor, prepareConversationBinding, type SessionBindingExpectation } from './session-binding.js';
import { id, InputError, now, StateStore } from './store.js';

export class RunManager {
  runs = new Map<string, Run>();
  private controllers = new Map<string, AbortController>();
  private approvals = new Map<string, (accept: boolean) => void>();
  private interactionResolvers = new Map<string, (action: 'accept' | 'decline' | 'cancel', response?: unknown) => void>();
  private scheduler?: ReturnType<typeof setInterval>;
  private ticking = false;
  private closing = false;
  private completions = new Map<string, Promise<void>>();
  constructor(private store: StateStore, private providers: ProviderManager, private emit: (event: ServerEvent) => void, private interactions: InteractionStore) {}
  async publishState(): Promise<void> { await this.store.save(); this.emit({ type: 'state', state: this.store.state }); }
  getInteractions() { return this.interactions.list(); }
  async send(conversationId: string, input: SendMessageInput): Promise<Run> {
    if (this.closing) throw new InputError('A Gent is shutting down. Try again after reconnecting.', 503);
    const conversation = this.store.getConversation(conversationId), agent = this.store.getAgent(conversation.agentId);
    if (conversation.archived) throw new InputError('Restore this chat before sending a message.', 409);
    const activeRun = [...this.runs.values()].find(run => this.controllers.has(run.id));
    if (activeRun) throw new InputError(activeRun.conversationId === conversationId ? 'This chat is already working. Stop it before sending another message.' : 'A Gent can run one task at a time in this release. Stop the active run before starting another.', 409);
    const providerId = input.providerId || conversation.providerId || agent.providerId || this.store.state.settings.defaultProviderId;
    if (providerId !== 'codex') throw new InputError('Codex is the only runtime available in this A Gent release. Existing chats are preserved; choose Codex to continue.', 409);
    const provider = this.providers.get(providerId);
    if (!isProviderReady(provider)) throw new InputError(provider.detail || 'Connect Codex before sending a message.', 409);
    let workspace = conversation.workspacePath || agent.workspacePath || join(this.store.directory, 'workspace');
    if (!isAbsolute(workspace)) throw new InputError('Select an absolute workspace folder path.');
    if (workspace === join(this.store.directory, 'workspace')) await mkdir(workspace, { recursive: true, mode: 0o700 });
    try { workspace = await realpath(workspace); if (!(await stat(workspace)).isDirectory()) throw new Error('not a directory'); }
    catch { throw new InputError('The workspace folder does not exist or cannot be opened.'); }
    // Filesystem validation yields control. Recheck immediately before synchronously reserving
    // this host so simultaneous POSTs cannot append two prompts to the same provider turn.
    if (this.closing) throw new InputError('A Gent is shutting down. Try again after reconnecting.', 503);
    const queued = [...this.runs.values()].find(run => this.controllers.has(run.id));
    if (queued) throw new InputError(queued.conversationId === conversationId ? 'This chat is already working. Stop it before sending another message.' : 'A Gent can run one task at a time in this release. Stop the active run before starting another.', 409);
    const modelId = input.modelId !== undefined ? input.modelId : conversation.modelId !== undefined ? conversation.modelId : agent.modelId || '';
    // v1 always uses the provider default. Saved effort remains metadata for a later release.
    const effectiveAgent = { ...agent, providerId, modelId, reasoningEffort: '' };
    const selectedModel = modelId ? provider.models.find(model => model.id === modelId) : undefined;
    if (modelId && !selectedModel) throw new InputError('Choose a model available from this provider.', 409);
    const bindingExpectation: SessionBindingExpectation = {
      providerId,
      providerKind: provider.kind,
      ...(agent.providerProfileId ? { accountId: agent.providerProfileId } : {}),
      workspaceId: workspace,
      modelId,
    };
    const previousBinding = conversation.providerBinding;
    const previousThreadId = conversation.providerThreadId;
    const previousTitle = conversation.title;
    const previousUpdatedAt = conversation.updatedAt;
    prepareConversationBinding(conversation, bindingExpectation);
    const user: Message = { id: id(), role: 'user', content: input.content, createdAt: now(), ...(input.attachments?.length ? { attachments: input.attachments } : {}) };
    const message: Message = { id: id(), role: 'assistant', content: '', createdAt: now(), status: 'streaming', activities: [] };
    const messageIndex = conversation.messages.length;
    conversation.messages.push(user, message);
    conversation.updatedAt = now();
    if (conversation.title === 'New chat') conversation.title = input.content.trim().replace(/\s+/g, ' ').slice(0, 70) || input.attachments?.[0]?.name || 'New chat';
    const run: Run = { id: id(), conversationId, agentId: agent.id, messageId: message.id, status: 'running', providerId, modelId, startedAt: now(), activities: [], approvals: [] };
    const controller = new AbortController(); this.controllers.set(run.id, controller); this.runs.set(run.id, run);
    let streamTimedOut = false;
    const streamTimer = setTimeout(() => { streamTimedOut = true; controller.abort(); }, BUDGETS.stream);
    streamTimer.unref();
    try {
      // Publish the persisted empty assistant message before any text deltas. If
      // this fails, roll back the reservation and both messages so a retry is
      // not permanently blocked and no phantom chat remains.
      await this.publishState();
    } catch (error) {
      clearTimeout(streamTimer);
      this.controllers.delete(run.id); this.runs.delete(run.id);
      conversation.messages.splice(messageIndex, 2);
      conversation.title = previousTitle;
      conversation.updatedAt = previousUpdatedAt;
      if (previousBinding) conversation.providerBinding = previousBinding; else delete conversation.providerBinding;
      if (previousThreadId) conversation.providerThreadId = previousThreadId; else delete conversation.providerThreadId;
      throw error;
    }
    this.emit({ type: 'run', run });
    const activity: Activity = { id: id(), kind: 'status', title: 'Connecting to your model', status: 'running', createdAt: now() };
    run.activities.push(activity); message.activities = run.activities; this.emit({ type: 'run', run });
    let outcome: 'completed' | 'failed' | 'interrupted' = controller.signal.aborted ? 'interrupted' : 'completed';
    const completion = this.providers.run(providerId, { agent: effectiveAgent, conversation, modelId: run.modelId, mode: input.mode ?? 'chat', workspace, signal: controller.signal, callbacks: {
      delta: delta => { if (controller.signal.aborted) return; if (message.content.length + delta.length > 1000000) { controller.abort(); return; } message.content += delta; activity.status = 'completed'; this.emit({ type: 'delta', conversationId, messageId: message.id, delta }); },
      thread: threadId => {
        conversation.providerThreadId = threadId;
        conversation.providerBinding = bindingFor(bindingExpectation, threadId, now());
        void this.store.save().catch(error => this.emit({ type: 'error', message: redact(`Could not save conversation: ${(error as Error).message}`), runId: run.id, providerId }));
      },
      activity: item => { const existing = run.activities.findIndex(activity => activity.id === item.id); if (existing >= 0) run.activities[existing] = item; else if (run.activities.length < 1000) run.activities.push(item); message.activities = run.activities; this.emit({ type: 'run', run }); },
      approval: (details, respond) => {
        if (controller.signal.aborted) { respond(false); return; }
        const createdAt = now();
        const approval: Approval = {
          ...details,
          id: id(),
          runId: run.id,
          conversationId,
          hostId: this.interactions.hostId,
          providerId,
          threadId: conversation.providerThreadId,
          kind: 'approval',
          status: 'pending',
          createdAt,
          updatedAt: createdAt,
        };
        run.approvals.push(approval); run.status = 'waiting'; this.approvals.set(approval.id, respond); this.emit({ type: 'run', run });
        void this.interactions.upsert({
          id: approval.id, hostId: this.interactions.hostId, runId: run.id, conversationId, providerId,
          ...(approval.threadId ? { threadId: approval.threadId } : {}),
          kind: 'approval', title: approval.title, ...(approval.description ? { description: approval.description } : {}),
          ...(approval.command ? { command: approval.command } : {}), status: 'pending', createdAt, updatedAt: createdAt,
        }).catch(error => this.emit({ type: 'error', message: redact(`Could not save pending interaction: ${(error as Error).message}`), runId: run.id, providerId }));
      },
      interaction: (request, respond) => {
        const createdAt = now(), interactionId = id();
        const payload = request.questions?.length ? { questions: request.questions } : request.fields?.length ? { fields: request.fields } : undefined;
        const interaction: PendingInteraction = {
          id: interactionId, hostId: this.interactions.hostId, runId: run.id, conversationId, providerId,
          ...(conversation.providerThreadId ? { threadId: conversation.providerThreadId } : {}),
          kind: request.kind, title: request.title, ...(request.description ? { description: request.description } : {}),
          ...(request.command ? { command: request.command } : {}), ...(request.url ? { url: request.url } : {}),
          ...(payload ? { payload } : {}),
          status: respond ? 'pending' : 'declined', createdAt, updatedAt: createdAt,
        };
        if (respond) { this.interactionResolvers.set(interactionId, respond); run.status = 'waiting'; this.emit({ type: 'run', run }); }
        this.emit({ type: 'interaction', interaction });
        void this.interactions.upsert(interaction).catch(error => this.emit({ type: 'error', message: redact(`Could not save pending interaction: ${(error as Error).message}`), runId: run.id, providerId }));
      },
    } }).then(() => {
      if (streamTimedOut) { outcome = 'failed'; run.error = 'The run exceeded the stream time budget.'; }
      else if (controller.signal.aborted) { outcome = 'interrupted'; }
      else if (!message.content) { outcome = 'failed'; run.error = 'The provider completed without a text response. Check the activity log.'; }
      else outcome = 'completed';
    }).catch(error => {
      if (streamTimedOut) {
        outcome = 'failed'; run.error = 'The run exceeded the stream time budget.';
        run.activities.push({ id: id(), kind: 'status', title: 'Model request timed out', detail: run.error, status: 'failed', createdAt: now() });
        message.activities = run.activities;
      } else if (controller.signal.aborted) outcome = 'interrupted';
      else {
        outcome = 'failed'; run.error = (error as Error).message;
        run.activities.push({ id: id(), kind: 'status', title: 'Model request failed', detail: run.error, status: 'failed', createdAt: now() });
        message.activities = run.activities;
      }
    }).finally(async () => {
      clearTimeout(streamTimer);
      for (const approval of run.approvals) if (approval.status === 'pending') { approval.status = 'declined'; this.approvals.delete(approval.id); }
      for (const interaction of this.interactions.list()) {
        if (interaction.runId !== run.id || interaction.status !== 'pending') continue;
        const resolver = this.interactionResolvers.get(interaction.id);
        this.interactionResolvers.delete(interaction.id);
        try { resolver?.('cancel'); } catch { /* the provider already settled the request */ }
        this.emit({ type: 'interaction', interaction: { ...interaction, status: 'cancelled', updatedAt: now() } });
      }
      await this.interactions.cancelRun(run.id, 'cancelled').catch(error => this.emit({ type: 'error', message: redact(`Could not cancel pending interactions: ${(error as Error).message}`), runId: run.id, providerId }));
      // Settle only after cleanup: the UI keeps showing "Stopping" until the
      // reservation is actually released.
      run.status = outcome; message.status = outcome;
      for (const item of run.activities) if (item.status === 'running') item.status = run.status === 'failed' ? 'failed' : 'completed';
      conversation.updatedAt = now();
      this.controllers.delete(run.id);
      this.emit({ type: 'run', run });
      await this.publishState().catch(error => this.emit({ type: 'error', message: redact(`Could not save conversation: ${(error as Error).message}`), runId: run.id, providerId }));
      // Keep a bounded recent run ledger in memory; messages and activities remain durable.
      for (const [runId, old] of this.runs) if (this.runs.size > 100 && !['running', 'waiting', 'stopping'].includes(old.status)) this.runs.delete(runId);
    });
    this.completions.set(run.id, completion);
    void completion.finally(() => { if (this.completions.get(run.id) === completion) this.completions.delete(run.id); });
    return run;
  }
  async respondInteraction(interactionId: string, action: 'accept' | 'decline' | 'cancel', response?: unknown): Promise<unknown> {
    const record = this.interactions.list().find(item => item.id === interactionId);
    if (!record || record.status !== 'pending') throw new InputError('This interaction is no longer pending.', 409);
    const resolver = this.interactionResolvers.get(interactionId);
    if (action === 'accept' && !resolver) throw new InputError('This request cannot be answered here. Retry it from the app that started it.', 409);
    const status = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled';
    // Resolve with the provider first: validation failures leave the request pending and actionable.
    try { resolver?.(action, response); }
    catch (error) { throw new InputError((error as Error).message); }
    this.interactionResolvers.delete(interactionId);
    // Form values and secret answers can contain credentials or personal data. The
    // runtime receives them, but the durable interaction ledger keeps only a marker.
    const sensitive = record.kind === 'form' || record.payload?.questions?.some(question => question.isSecret);
    const storedResponse = action === 'accept' ? sensitive ? { redacted: true } : response : undefined;
    const updated = await this.interactions.respond(interactionId, status, storedResponse);
    if (!updated) throw new InputError('This interaction is no longer pending.', 409);
    const run = this.runs.get(record.runId);
    if (run && this.controllers.has(run.id) && run.status !== 'stopping') {
      // The provider can complete the turn before persistence returns; never overwrite a settled run.
      run.status = this.interactions.list().some(item => item.runId === run.id && item.status === 'pending') ? 'waiting' : 'running';
      this.emit({ type: 'run', run });
    }
    this.emit({ type: 'interaction', interaction: updated });
    return updated;
  }

  interrupt(runId: string): Run {
    const run = this.runs.get(runId);
    if (!run) throw new InputError('Run not found.', 404);
    const controller = this.controllers.get(runId);
    if (!controller) return run;
    // The provider must confirm cleanup before this becomes "interrupted".
    if (run.status !== 'stopping') { run.status = 'stopping'; this.emit({ type: 'run', run }); }
    controller.abort();
    return run;
  }
  approve(approvalId: string, accept: boolean): void {
    const respond = this.approvals.get(approvalId);
    const run = [...this.runs.values()].find(run => run.approvals.some(approval => approval.id === approvalId));
    const approval = run?.approvals.find(approval => approval.id === approvalId);
    if (!respond || !run || !approval || approval.status !== 'pending') throw new InputError('This approval is no longer pending.', 409);
    approval.status = accept ? 'accepted' : 'declined'; this.approvals.delete(approvalId); respond(accept);
    void this.interactions.resolve(approvalId, accept ? 'accepted' : 'declined').catch(error => this.emit({ type: 'error', message: redact(`Could not save interaction decision: ${(error as Error).message}`), runId: run.id, providerId: run.providerId }));
    if (run.status !== 'stopping') { run.status = run.approvals.some(approval => approval.status === 'pending') ? 'waiting' : 'running'; this.emit({ type: 'run', run }); }
  }
  startScheduler(): void {
    this.scheduler = setInterval(() => { void this.tick(); }, 5000);
    this.scheduler.unref();
    void this.tick();
  }
  private async tick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try {
      for (const schedule of this.store.state.schedules) {
        if (!schedule.enabled || Date.parse(schedule.runAt) > Date.now()) continue;
        if ([...this.runs.values()].some(run => this.controllers.has(run.id) || ['running', 'waiting', 'stopping'].includes(run.status))) continue;
        schedule.enabled = false; schedule.lastRunAt = now(); delete schedule.error;
        try {
          const conversation = schedule.conversationId ? this.store.getConversation(schedule.conversationId) : this.store.createConversation(schedule.agentId, { title: schedule.title });
          if (conversation.agentId !== schedule.agentId) throw new Error('Scheduled chat belongs to another agent.');
          schedule.conversationId = conversation.id;
          await this.publishState();
          await this.send(conversation.id, { content: schedule.prompt, mode: 'chat' });
        } catch (error) { schedule.error = (error as Error).message; await this.publishState(); }
      }
    } catch (error) { this.emit({ type: 'error', message: redact(`Scheduled task could not start: ${(error as Error).message}`), code: 'scheduler' }); }
    finally { this.ticking = false; }
  }
  async close(): Promise<void> {
    this.closing = true;
    if (this.scheduler) clearInterval(this.scheduler);
    for (const run of this.runs.values()) if (this.controllers.has(run.id) && run.status !== 'stopping') { run.status = 'stopping'; this.emit({ type: 'run', run }); }
    for (const controller of this.controllers.values()) controller.abort();
    let failure: unknown;
    try { await this.providers.close(); } catch (error) { failure = error; }
    // Let each run's finalizer settle after its provider child exits; fixes the
    // previous race where shutdown saved a still-streaming message.
    await Promise.allSettled([...this.completions.values()]);
    for (const [runId, run] of this.runs) {
      if (!this.controllers.has(runId)) continue;
      run.status = 'interrupted';
      const conversation = this.store.state.conversations.find(chat => chat.id === run.conversationId);
      const message = conversation?.messages.find(item => item.id === run.messageId);
      if (message?.status === 'streaming') message.status = 'interrupted';
      this.controllers.delete(runId);
      this.emit({ type: 'run', run });
    }
    try { await this.interactions.close(); } catch (error) { failure ??= error; }
    try { await this.store.save(); } catch (error) { failure ??= error; }
    if (failure) throw failure;
  }
}
