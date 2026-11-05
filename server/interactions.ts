import { mkdir, open, readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { InteractionKind, InteractionStatus, PendingInteraction } from '../shared/types.js';
import { BUDGETS } from './budgets.js';
import { id, now } from './store.js';

const KINDS: InteractionKind[] = ['approval', 'question', 'form', 'url'];
const STATUSES: InteractionStatus[] = ['pending', 'accepted', 'declined', 'cancelled', 'expired'];

function validString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function validInteraction(value: unknown): value is PendingInteraction {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return validString(item.id, 100)
    && validString(item.hostId, 100)
    && validString(item.runId, 100)
    && validString(item.conversationId, 100)
    && validString(item.providerId, 200)
    && KINDS.includes(item.kind as InteractionKind)
    && STATUSES.includes(item.status as InteractionStatus)
    && validString(item.title, 2000)
    && validString(item.createdAt, 100)
    && validString(item.updatedAt, 100)
    && (item.threadId === undefined || validString(item.threadId, 4000))
    && (item.description === undefined || typeof item.description === 'string')
    && (item.command === undefined || typeof item.command === 'string')
    && (item.url === undefined || typeof item.url === 'string')
    && (item.payload === undefined || (typeof item.payload === 'object' && item.payload !== null && !Array.isArray(item.payload)))
    && (item.expiresAt === undefined || validString(item.expiresAt, 100));
}

export class InteractionStore {
  private records: PendingInteraction[] = [];
  private writes: Promise<void> = Promise.resolve();

  constructor(public readonly directory: string, public readonly hostId: string) {}

  get filename(): string { return join(this.directory, 'interactions.json'); }

  async load(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      const raw = JSON.parse(await readFile(this.filename, 'utf8')) as { version?: unknown; interactions?: unknown };
      if (raw.version !== 1 || !Array.isArray(raw.interactions)) throw new Error('unsupported interactions format');
      this.records = raw.interactions.filter(validInteraction).map(record => ({ ...record, hostId: this.hostId }));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        // Keep the damaged evidence instead of silently overwriting it.
        await rename(this.filename, `${this.filename}.corrupt-${Date.now()}`).catch(() => {});
        this.records = [];
      } else {
        this.records = [];
      }
    }
    let changed = false;
    for (const record of this.records) {
      if (record.status !== 'pending') continue;
      record.status = 'expired';
      record.updatedAt = now();
      changed = true;
    }
    if (changed || !(await this.exists())) await this.save();
  }

  private async exists(): Promise<boolean> {
    try { await readFile(this.filename, 'utf8'); return true; } catch { return false; }
  }

  list(): PendingInteraction[] {
    return this.records.map(record => ({ ...record }));
  }

  async upsert(record: PendingInteraction): Promise<void> {
    const next = { ...record };
    if (next.status === 'pending' && !next.expiresAt) next.expiresAt = new Date(Date.now() + BUDGETS.interaction).toISOString();
    const index = this.records.findIndex(item => item.id === next.id);
    if (index >= 0) this.records[index] = next;
    else this.records.push(next);
    this.prune();
    await this.save();
  }

  async respond(interactionId: string, status: InteractionStatus, response?: unknown): Promise<PendingInteraction | undefined> {
    const record = this.records.find(item => item.id === interactionId);
    if (!record || record.status !== 'pending') return undefined;
    record.status = status;
    record.response = response;
    record.updatedAt = now();
    await this.save();
    return { ...record };
  }

  async resolve(interactionId: string, status: InteractionStatus): Promise<void> {
    const record = this.records.find(item => item.id === interactionId);
    if (!record || record.status !== 'pending') return;
    record.status = status;
    record.updatedAt = now();
    await this.save();
  }

  async cancelRun(runId: string, status: InteractionStatus = 'cancelled'): Promise<void> {
    let changed = false;
    for (const record of this.records) {
      if (record.runId !== runId || record.status !== 'pending') continue;
      record.status = status;
      record.updatedAt = now();
      changed = true;
    }
    if (changed) await this.save();
  }

  private prune(): void {
    const pending = this.records.filter(record => record.status === 'pending');
    const resolved = this.records.filter(record => record.status !== 'pending')
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 200);
    this.records = [...pending, ...resolved];
  }

  private save(): Promise<void> {
    const bytes = JSON.stringify({ version: 1, interactions: this.records });
    this.writes = this.writes.catch(() => {}).then(async () => {
      const temporary = join(this.directory, `.interactions-${id()}.tmp`);
      const handle = await open(temporary, 'w', 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      await rename(temporary, this.filename);
    });
    return this.writes;
  }

  async close(): Promise<void> {
    await this.writes.catch(() => {});
  }
}
