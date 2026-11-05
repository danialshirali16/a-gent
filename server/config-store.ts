import { copyFile, mkdir, open, readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { id, now } from './store.js';

export interface ConfigOwner {
  kind: string;
  id: string;
}

export interface ConfigEnvelope<T> {
  version: number;
  owner: ConfigOwner;
  updatedAt: string;
  value: T;
}

export type ConfigValidator<T> = (value: unknown) => T;

export class ConfigOwnershipError extends Error {}
export class ConfigVersionError extends Error {}

export interface ConfigStoreOptions<T> {
  migrateLegacy?: (raw: unknown) => unknown;
  filename?: string;
}

/**
 * A typed, owner-scoped JSON configuration file with atomic replacement,
 * one-generation backup, and legacy-shape migration.
 */
export class ConfigStore<T> {
  private value: T;
  private writes: Promise<void> = Promise.resolve();
  private readonly filename: string;

  constructor(
    private readonly directory: string,
    private readonly owner: ConfigOwner,
    private readonly version: number,
    private readonly validate: ConfigValidator<T>,
    defaults: T,
    options: ConfigStoreOptions<T> = {},
  ) {
    this.filename = options.filename ?? 'config.json';
    this.migrateLegacy = options.migrateLegacy;
    this.value = structuredClone(defaults);
  }

  private readonly migrateLegacy?: (raw: unknown) => unknown;

  get(): T {
    return structuredClone(this.value);
  }

  async load(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const primary = join(this.directory, this.filename);
    try {
      this.value = await this.read(primary);
      return;
    } catch (error) {
      if (error instanceof ConfigOwnershipError || error instanceof ConfigVersionError) throw error;
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await this.enqueueWrite(this.envelope(this.value));
        return;
      }
    }
    const backup = `${primary}.bak`;
    try {
      this.value = await this.read(backup);
      await this.enqueueWrite(this.envelope(this.value), true);
    } catch {
      throw new Error(`Could not read A Gent configuration at ${primary}. The primary and backup are unreadable.`);
    }
  }

  async set(value: unknown): Promise<T> {
    const next = this.validate(value);
    await this.enqueueWrite(this.envelope(next));
    this.value = next;
    return structuredClone(this.value);
  }

  async close(): Promise<void> {
    await this.writes.catch(() => {});
  }

  private async read(filename: string): Promise<T> {
    const raw = JSON.parse(await readFile(filename, 'utf8')) as unknown;
    const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : undefined;
    if (data?.version !== undefined) {
      if (data.version !== this.version) throw new ConfigVersionError('The saved configuration version is not supported.');
      if (!data.owner || typeof data.owner !== 'object') throw new ConfigOwnershipError('The saved configuration owner is missing.');
      const owner = data.owner as Record<string, unknown>;
      if (owner.kind !== this.owner.kind || owner.id !== this.owner.id) throw new ConfigOwnershipError('The saved configuration belongs to another owner.');
      return this.validate(data.value);
    }
    if (!this.migrateLegacy) throw new Error('The saved configuration has an unsupported legacy shape.');
    return this.validate(this.migrateLegacy(raw));
  }

  private envelope(value: T): string {
    return JSON.stringify({ version: this.version, owner: this.owner, updatedAt: now(), value });
  }

  private enqueueWrite(bytes: string, skipBackup = false): Promise<void> {
    this.writes = this.writes.catch(() => {}).then(async () => {
      const primary = join(this.directory, this.filename);
      const temporary = join(this.directory, `.${this.filename}-${id()}.tmp`);
      const handle = await open(temporary, 'w', 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      if (!skipBackup) {
        try { await copyFile(primary, `${primary}.bak`); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
      await rename(temporary, primary);
    });
    return this.writes;
  }
}
