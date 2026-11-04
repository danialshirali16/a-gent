import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export interface DataLock {
  path: string;
  release(): Promise<void>;
}

function alive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; }
  catch (error) { return (error as NodeJS.ErrnoException).code === 'EPERM'; }
}

/** Prevent two hosts from writing the same workspace at once. */
export async function acquireDataLock(directory: string): Promise<DataLock> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, '.lock');
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await open(path, 'wx', 0o600);
      await handle.writeFile(String(process.pid));
      await handle.close();
      return {
        path,
        release: async () => {
          try {
            const owner = (await readFile(path, 'utf8')).trim();
            if (owner === String(process.pid)) await unlink(path);
          } catch { /* already removed */ }
        },
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      let owner = 0;
      try { owner = Number((await readFile(path, 'utf8')).trim()); } catch { /* unreadable lock */ }
      if (alive(owner)) throw new Error(`Another A Gent host is already using ${directory}. Stop it before starting another host.`);
      try { await unlink(path); } catch { /* raced with another process */ }
    }
  }
  throw new Error(`Could not lock the A Gent workspace at ${directory}.`);
}
