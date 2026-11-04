import { mkdir, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import type { Activity, Approval, Message, Run, SendMessageInput, ServerEvent } from '../shared/types.js';
import { ProviderManager } from './providers.js';
import { id, InputError, now, StateStore } from './store.js';

export class RunManager {
  runs = new Map<string, Run>();
  private controllers = new Map<string, AbortController>();
  private approvals = new Map<string, (accept: boolean) => void>();
  private scheduler?: ReturnType<typeof setInterval>;
  private ticking = false;
  private closing = false;
  constructor(private store: StateStore, private providers: ProviderManager, private emit: (event: ServerEvent) => void) {}
  async publishState(): Promise<void> { await this.store.save(); this.emit({ type: 'state', state: this.store.state }); }
  async send(conversationId: string, input: SendMessageInput): Promise<Run> {
    if (this.closing) throw new InputError('A Gent is shutting down. Try again after reconnecting.', 503);
    const conversation = this.store.getConversation(conversationId), agent = this.store.getAgent(conversation.agentId);
    if (conversation.archived) throw new InputError('Restore this chat before sending a message.', 409);
    if ([...this.runs.values()].some(run => run.conversationId === conversationId && this.controllers.has(run.id))) throw new InputError('This chat is already working. Stop it before sending another message.', 409);
    const providerId = input.providerId || agent.providerId || this.store.state.settings.defaultProviderId;
    const provider = this.providers.get(providerId);
    if (provider.status === 'unavailable') throw new InputError(provider.detail, 503);
    let workspace = conversation.workspacePath || agent.workspacePath || join(this.store.directory, 'workspace');
    if (!isAbsolute(workspace)) throw new InputError('Select an absolute workspace folder path.');
    if (workspace === join(this.store.directory, 'workspace')) await mkdir(workspace, { recursive: true, mode: 0o700 });
    try { workspace = await realpath(workspace); if (!(await stat(workspace)).isDirectory()) throw new Error('not a directory'); }
    catch { throw new InputError('The workspace folder does not exist or cannot be opened.'); }
    // Filesystem validation yields control. Recheck immediately before synchronously reserving
    // this chat so simultaneous POSTs cannot append two prompts to the same provider turn.
    if (this.closing) throw new InputError('A Gent is shutting down. Try again after reconnecting.', 503);
    if ([...this.runs.values()].some(run => run.conversationId === conversationId && this.controllers.has(run.id))) throw new InputError('This chat is already working. Stop it before sending another message.', 409);
    const user: Message = { id: id(), role: 'user', content: input.content, createdAt: now(), ...(input.attachments?.length ? { attachments: input.attachments } : {}) };
    const message: Message = { id: id(), role: 'assistant', content: '', createdAt: now(), status: 'streaming', activities: [] };
    conversation.messages.push(user, message);
    conversation.updatedAt = now();
    if (conversation.title === 'New chat') conversation.title = input.content.trim().replace(/\s+/g, ' ').slice(0, 70) || input.attachments?.[0]?.name || 'New chat';
    const run: Run = { id: id(), conversationId, agentId: agent.id, messageId: message.id, status: 'running', providerId, modelId: input.modelId || agent.modelId || '', startedAt: now(), activities: [], approvals: [] };
    const controller = new AbortController(); this.controllers.set(run.id, controller); this.runs.set(run.id, run);
    // Publish the persisted empty assistant message before any text deltas.
    await this.publishState(); this.emit({ type: 'run', run });
    const activity: Activity = { id: id(), kind: 'status', title: 'Connecting to your model', status: 'running', createdAt: now() };
    run.activities.push(activity); message.activities = run.activities; this.emit({ type: 'run', run });
    void this.providers.run(providerId, { agent, conversation, modelId: run.modelId, mode: input.mode ?? 'chat', workspace, signal: controller.signal, callbacks: {
      delta: delta => { if (controller.signal.aborted) return; if (message.content.length + delta.length > 1000000) { controller.abort(); return; } message.content += delta; activity.status = 'completed'; this.emit({ type: 'delta', conversationId, messageId: message.id, delta }); },
      thread: threadId => { conversation.providerThreadId = threadId; void this.store.save().catch(error => this.emit({ type: 'error', message: `Could not save conversation: ${(error as Error).message}` })); },
      activity: item => { const existing = run.activities.findIndex(activity => activity.id === item.id); if (existing >= 0) run.activities[existing] = item; else if (run.activities.length < 1000) run.activities.push(item); message.activities = run.activities; this.emit({ type: 'run', run }); },
      approval: (details, respond) => {
        if (controller.signal.aborted) { respond(false); return; }
        const approval: Approval = { ...details, id: id(), runId: run.id, conversationId, status: 'pending' };
        run.approvals.push(approval); run.status = 'waiting'; this.approvals.set(approval.id, respond); this.emit({ type: 'run', run });
      },
    } }).then(async () => {
      run.status = controller.signal.aborted ? 'interrupted' : 'completed'; message.status = controller.signal.aborted ? 'interrupted' : 'completed';
      if (!message.content && !controller.signal.aborted) { run.status = 'failed'; message.status = 'failed'; run.error = 'The provider completed without a text response. Check the activity log.'; }
    }).catch(error => {
      run.status = controller.signal.aborted ? 'interrupted' : 'failed'; message.status = controller.signal.aborted ? 'interrupted' : 'failed';
      if (!controller.signal.aborted) {
        run.error = (error as Error).message;
        run.activities.push({ id: id(), kind: 'status', title: 'Model request failed', detail: run.error, status: 'failed', createdAt: now() });
        message.activities = run.activities;
      }
    }).finally(async () => {
      for (const approval of run.approvals) if (approval.status === 'pending') { approval.status = 'declined'; this.approvals.delete(approval.id); }
      for (const item of run.activities) if (item.status === 'running') item.status = run.status === 'failed' ? 'failed' : 'completed';
      conversation.updatedAt = now(); this.controllers.delete(run.id); this.emit({ type: 'run', run });
      await this.publishState().catch(error => this.emit({ type: 'error', message: `Could not save conversation: ${(error as Error).message}` }));
      // Keep a bounded recent run ledger in memory; messages and activities remain durable.
      for (const [runId, old] of this.runs) if (this.runs.size > 100 && !['running', 'waiting'].includes(old.status)) this.runs.delete(runId);
    });
    return run;
  }
  interrupt(runId: string): Run {
    const run = this.runs.get(runId);
    if (!run) throw new InputError('Run not found.', 404);
    const controller = this.controllers.get(runId);
    if (!controller) return run;
    controller.abort();
    run.status = 'interrupted'; this.emit({ type: 'run', run });
    return run;
  }
  approve(approvalId: string, accept: boolean): void {
    const respond = this.approvals.get(approvalId);
    const run = [...this.runs.values()].find(run => run.approvals.some(approval => approval.id === approvalId));
    const approval = run?.approvals.find(approval => approval.id === approvalId);
    if (!respond || !run || !approval || approval.status !== 'pending') throw new InputError('This approval is no longer pending.', 409);
    approval.status = accept ? 'accepted' : 'declined'; this.approvals.delete(approvalId); respond(accept);
    run.status = run.approvals.some(approval => approval.status === 'pending') ? 'waiting' : 'running'; this.emit({ type: 'run', run });
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
        if (schedule.conversationId && [...this.runs.values()].some(run => run.conversationId === schedule.conversationId && ['running', 'waiting'].includes(run.status))) continue;
        schedule.enabled = false; schedule.lastRunAt = now(); delete schedule.error;
        try {
          const conversation = schedule.conversationId ? this.store.getConversation(schedule.conversationId) : this.store.createConversation(schedule.agentId, { title: schedule.title });
          if (conversation.agentId !== schedule.agentId) throw new Error('Scheduled chat belongs to another agent.');
          schedule.conversationId = conversation.id;
          await this.publishState();
          await this.send(conversation.id, { content: schedule.prompt, mode: 'chat' });
        } catch (error) { schedule.error = (error as Error).message; await this.publishState(); }
      }
    } catch (error) { this.emit({ type: 'error', message: `Scheduled task could not start: ${(error as Error).message}` }); }
    finally { this.ticking = false; }
  }
  async close(): Promise<void> {
    this.closing = true;
    if (this.scheduler) clearInterval(this.scheduler);
    for (const controller of this.controllers.values()) controller.abort();
    await this.providers.close();
    await this.store.save();
  }
}
