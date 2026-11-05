import { execFile } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { copyFile, mkdir, open, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { now } from './store.js';

const run = promisify(execFile);
const KEYCHAIN_SERVICE = 'a-gent';

export interface SecretOwner {
  kind: string;
  id: string;
}

export interface SecretRef {
  id: string;
  owner: SecretOwner;
  createdAt: string;
  updatedAt: string;
}

export interface SecretInput {
  id: string;
  owner: SecretOwner;
  secret: string;
}

export interface SecretStore {
  readonly kind: string;
  set(input: SecretInput): Promise<SecretRef>;
  get(id: string, owner: SecretOwner): Promise<string | undefined>;
  delete(id: string, owner: SecretOwner): Promise<boolean>;
  list(owner?: SecretOwner): SecretRef[];
  close(): Promise<void>;
}

interface SecretRecord extends SecretRef {
  nonce: string;
  tag: string;
  ciphertext: string;
}

function keyFor(id: string, owner: SecretOwner): string {
  return `${owner.kind}\u0000${owner.id}\u0000${id}`;
}

function publicRef(record: SecretRecord): SecretRef {
  return { id: record.id, owner: { ...record.owner }, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

function validText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function validOwner(value: unknown): value is SecretOwner {
  if (!value || typeof value !== 'object') return false;
  const owner = value as Record<string, unknown>;
  return validText(owner.kind, 40) && validText(owner.id, 200);
}

export class MemorySecretStore implements SecretStore {
  readonly kind = 'memory';
  private records = new Map<string, { ref: SecretRef; secret: string }>();

  async set(input: SecretInput): Promise<SecretRef> {
    if (!validText(input.id, 100) || !validOwner(input.owner) || typeof input.secret !== 'string' || !input.secret) throw new Error('A credential reference and secret are required.');
    const key = keyFor(input.id, input.owner), existing = this.records.get(key), timestamp = now();
    const ref: SecretRef = { id: input.id, owner: { ...input.owner }, createdAt: existing?.ref.createdAt ?? timestamp, updatedAt: timestamp };
    this.records.set(key, { ref, secret: input.secret });
    return { ...ref, owner: { ...ref.owner } };
  }

  async get(id: string, owner: SecretOwner): Promise<string | undefined> {
    return this.records.get(keyFor(id, owner))?.secret;
  }

  async delete(id: string, owner: SecretOwner): Promise<boolean> {
    return this.records.delete(keyFor(id, owner));
  }

  list(owner?: SecretOwner): SecretRef[] {
    return [...this.records.values()].filter(item => !owner || (item.ref.owner.kind === owner.kind && item.ref.owner.id === owner.id)).map(item => ({ ...item.ref, owner: { ...item.ref.owner } }));
  }

  async close(): Promise<void> {}
}

export class FileSecretStore implements SecretStore {
  readonly kind = 'file';
  private records = new Map<string, SecretRecord>();
  private writes: Promise<void> = Promise.resolve();
  private key?: Buffer;
  private readonly filename: string;
  private readonly keyFile: string;

  constructor(private readonly directory: string, options: { filename?: string; keyFile?: string } = {}) {
    this.filename = options.filename ?? 'secrets.json';
    this.keyFile = options.keyFile ?? '.secret-key';
  }

  private get path(): string { return join(this.directory, this.filename); }
  private get keyPath(): string { return join(this.directory, this.keyFile); }

  async load(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    this.key = await this.loadKey();
    try {
      this.records = await this.read(this.path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        try { this.records = await this.read(`${this.path}.bak`); await this.save(this.records, true); }
        catch { throw new Error(`Could not read A Gent credentials at ${this.path}. The primary and backup are unreadable.`); }
      } else {
        this.records = new Map();
        await this.save(this.records);
      }
    }
  }

  async set(input: SecretInput): Promise<SecretRef> {
    if (!validText(input.id, 100) || !validOwner(input.owner) || typeof input.secret !== 'string' || !input.secret) throw new Error('A credential reference and secret are required.');
    const key = keyFor(input.id, input.owner), existing = this.records.get(key), timestamp = now();
    const encrypted = this.encrypt(input.secret);
    const record: SecretRecord = {
      id: input.id, owner: { ...input.owner }, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
      ...encrypted,
    };
    const next = new Map(this.records); next.set(key, record);
    await this.save(next);
    this.records = next;
    return publicRef(record);
  }

  async get(id: string, owner: SecretOwner): Promise<string | undefined> {
    const record = this.records.get(keyFor(id, owner));
    return record ? this.decrypt(record) : undefined;
  }

  async delete(id: string, owner: SecretOwner): Promise<boolean> {
    const key = keyFor(id, owner);
    if (!this.records.has(key)) return false;
    const next = new Map(this.records); next.delete(key);
    await this.save(next);
    this.records = next;
    return true;
  }

  list(owner?: SecretOwner): SecretRef[] {
    return [...this.records.values()].filter(item => !owner || (item.owner.kind === owner.kind && item.owner.id === owner.id)).map(publicRef);
  }

  async close(): Promise<void> {
    await this.writes.catch(() => {});
  }

  private async loadKey(): Promise<Buffer> {
    try {
      const key = await readFile(this.keyPath);
      if (key.length !== 32) throw new Error('The saved credential key is invalid.');
      return key;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const key = randomBytes(32);
      try { await writeFile(this.keyPath, key, { mode: 0o600, flag: 'wx' }); return key; }
      catch (writeError) {
        if ((writeError as NodeJS.ErrnoException).code !== 'EEXIST') throw writeError;
        const existing = await readFile(this.keyPath);
        if (existing.length !== 32) throw new Error('The saved credential key is invalid.');
        return existing;
      }
    }
  }

  private async read(filename: string): Promise<Map<string, SecretRecord>> {
    const raw = JSON.parse(await readFile(filename, 'utf8')) as { version?: unknown; secrets?: unknown };
    if (raw.version !== 1 || !Array.isArray(raw.secrets)) throw new Error('The saved credentials have an unsupported format.');
    const records = new Map<string, SecretRecord>();
    for (const value of raw.secrets) {
      if (!value || typeof value !== 'object') continue;
      const record = value as Record<string, unknown>;
      if (!validText(record.id, 100) || !validOwner(record.owner) || !validText(record.nonce, 100) || !validText(record.tag, 100) || !validText(record.ciphertext, 100000) || !validText(record.createdAt, 100) || !validText(record.updatedAt, 100)) continue;
      const item = record as unknown as SecretRecord;
      records.set(keyFor(item.id, item.owner), item);
    }
    return records;
  }

  private encrypt(secret: string): { nonce: string; tag: string; ciphertext: string } {
    if (!this.key) throw new Error('The credential store is not loaded.');
    const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return { nonce: nonce.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') };
  }

  private decrypt(record: SecretRecord): string {
    if (!this.key) throw new Error('The credential store is not loaded.');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(record.nonce, 'base64'));
    decipher.setAuthTag(Buffer.from(record.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(record.ciphertext, 'base64')), decipher.final()]).toString('utf8');
  }

  private save(records: Map<string, SecretRecord>, skipBackup = false): Promise<void> {
    const bytes = JSON.stringify({ version: 1, secrets: [...records.values()] });
    this.writes = this.writes.catch(() => {}).then(async () => {
      const temporary = join(this.directory, `.${this.filename}-${randomBytes(8).toString('hex')}.tmp`);
      const handle = await open(temporary, 'w', 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      if (!skipBackup) {
        try { await copyFile(this.path, `${this.path}.bak`); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      }
      await rename(temporary, this.path);
    });
    return this.writes;
  }
}

function accountFor(id: string, owner: SecretOwner): string {
  return `${owner.kind}:${owner.id}:${id}`;
}

/**
 * macOS Keychain-backed secret store. Uses the built-in `security` tool; the
 * service name is fixed so refs remain stable across restarts. Non-macOS hosts
 * fall back to session storage through createSecretStore().
 */
type KeychainRunner = (args: string[]) => Promise<{ stdout: string }>;

export class KeychainSecretStore implements SecretStore {
  readonly kind = 'keychain';
  private readonly service = KEYCHAIN_SERVICE;

  constructor(private readonly runner: KeychainRunner = args => run('security', args)) {}

  async set(input: SecretInput): Promise<SecretRef> {
    if (!validText(input.id, 100) || !validOwner(input.owner) || typeof input.secret !== 'string' || !input.secret) throw new Error('A credential reference and secret are required.');
    const timestamp = now();
    await this.runner(['add-generic-password', '-U', '-s', this.service, '-a', accountFor(input.id, input.owner), '-w', input.secret]);
    return { id: input.id, owner: { ...input.owner }, createdAt: timestamp, updatedAt: timestamp };
  }

  async get(id: string, owner: SecretOwner): Promise<string | undefined> {
    try {
      const { stdout } = await this.runner(['find-generic-password', '-s', this.service, '-a', accountFor(id, owner), '-w']);
      return stdout.replace(/\r?\n$/, '');
    } catch (error) {
      const code = Number((error as { code?: number | string }).code);
      if (code === 44) return undefined;
      throw new Error('macOS Keychain is unavailable or locked. Unlock it or choose session-only credentials.');
    }
  }

  async delete(id: string, owner: SecretOwner): Promise<boolean> {
    try {
      await this.runner(['delete-generic-password', '-s', this.service, '-a', accountFor(id, owner)]);
      return true;
    } catch (error) {
      if (Number((error as { code?: number | string }).code) === 44) return false;
      throw new Error('macOS Keychain is unavailable or locked. Unlock it or choose session-only credentials.');
    }
  }

  list(): SecretRef[] { return []; }
  async close(): Promise<void> {}
}

export function createSecretStore(_directory: string, mode = process.env.AGENT_SECRET_STORAGE): SecretStore {
  const requested = mode === 'keychain' || mode === 'session' ? mode : process.platform === 'darwin' ? 'keychain' : 'session';
  if (requested === 'keychain' && process.platform === 'darwin') return new KeychainSecretStore();
  return new MemorySecretStore();
}
