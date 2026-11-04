import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DeviceInfo } from '../shared/types.js';
import { InputError, now, object, string } from './store.js';

interface DeviceRecord extends DeviceInfo {
  tokenHash: string;
}

const TOKEN_PREFIX = 'agt_';
const TOKEN_PATTERN = /^agt_([a-f0-9]{16,64})_([A-Za-z0-9_-]{32,})$/;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function tokenDeviceId(token: string): string | undefined {
  return TOKEN_PATTERN.exec(token)?.[1];
}

function publicDevice(record: DeviceRecord): DeviceInfo {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    ...(record.lastUsedAt ? { lastUsedAt: record.lastUsedAt } : {}),
    ...(record.rotatedAt ? { rotatedAt: record.rotatedAt } : {}),
    ...(record.revokedAt ? { revokedAt: record.revokedAt } : {}),
  };
}

function newSecret(): string {
  return randomBytes(32).toString('base64url');
}

function newToken(deviceId: string): string {
  return `${TOKEN_PREFIX}${deviceId}_${newSecret()}`;
}

function validateDevice(value: unknown): DeviceRecord {
  const data = object(value);
  const id = string(data.id, 'Device ID', 100);
  const name = string(data.name, 'Device name', 100);
  const tokenHash = string(data.tokenHash, 'Device token hash', 64);
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw new Error('A saved device token hash is invalid.');
  return {
    id,
    name,
    tokenHash,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : now(),
    ...(typeof data.lastUsedAt === 'string' ? { lastUsedAt: data.lastUsedAt } : {}),
    ...(typeof data.rotatedAt === 'string' ? { rotatedAt: data.rotatedAt } : {}),
    ...(typeof data.revokedAt === 'string' ? { revokedAt: data.revokedAt } : {}),
  };
}

/** Persistent per-device bearer tokens. Only a SHA-256 hash of each token is stored. */
export class DeviceStore {
  private records: DeviceRecord[] = [];
  private writes: Promise<void> = Promise.resolve();

  constructor(public readonly directory: string) {}

  private get filename(): string { return join(this.directory, 'devices.json'); }

  async load(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      const raw = JSON.parse(await readFile(this.filename, 'utf8')) as { version?: unknown; devices?: unknown };
      if (raw.version !== 1 || !Array.isArray(raw.devices)) throw new Error('The saved device list has an unsupported format.');
      this.records = raw.devices.map(validateDevice);
      if (new Set(this.records.map(record => record.id)).size !== this.records.length) throw new Error('The saved device list contains duplicate IDs.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') { await this.save(); return; }
      throw new Error(`Could not read A Gent devices at ${this.directory}: ${(error as Error).message}`);
    }
  }

  save(): Promise<void> {
    const bytes = JSON.stringify({ version: 1, devices: this.records });
    this.writes = this.writes.catch(() => {}).then(async () => {
      const temporary = join(this.directory, `.devices-${randomBytes(8).toString('hex')}.tmp`);
      await writeFile(temporary, bytes, { mode: 0o600 });
      await rename(temporary, this.filename);
    });
    return this.writes;
  }

  list(): DeviceInfo[] {
    return this.records.map(publicDevice);
  }

  get(id: string): DeviceInfo | undefined {
    const record = this.records.find(record => record.id === id);
    return record ? publicDevice(record) : undefined;
  }

  async create(name: string): Promise<{ device: DeviceInfo; token: string }> {
    if (this.records.length >= 100) throw new InputError('This host has reached its 100 device limit.');
    const deviceId = randomBytes(12).toString('hex');
    const token = newToken(deviceId);
    const record: DeviceRecord = { id: deviceId, name: string(name, 'Device name', 100), tokenHash: hashToken(token), createdAt: now() };
    this.records.push(record);
    await this.save();
    return { device: publicDevice(record), token };
  }

  authenticate(token: string): DeviceInfo | undefined {
    const deviceId = tokenDeviceId(token);
    if (!deviceId) return undefined;
    const record = this.records.find(record => record.id === deviceId);
    if (!record || record.revokedAt || !hashesMatch(hashToken(token), record.tokenHash)) return undefined;
    record.lastUsedAt = now();
    return publicDevice(record);
  }

  async rotate(id: string): Promise<{ device: DeviceInfo; token: string }> {
    const record = this.records.find(record => record.id === id);
    if (!record || record.revokedAt) throw new InputError('Device not found or already revoked.', 404);
    const token = newToken(record.id);
    record.tokenHash = hashToken(token);
    record.rotatedAt = now();
    delete record.lastUsedAt;
    await this.save();
    return { device: publicDevice(record), token };
  }

  async revoke(id: string): Promise<DeviceInfo> {
    const record = this.records.find(record => record.id === id);
    if (!record) throw new InputError('Device not found.', 404);
    if (!record.revokedAt) {
      record.revokedAt = now();
      record.tokenHash = hashToken(newSecret());
      await this.save();
    }
    return publicDevice(record);
  }

  async close(): Promise<void> {
    try { await this.save(); } catch { /* the host is already shutting down */ }
    await this.writes.catch(() => {});
  }
}
