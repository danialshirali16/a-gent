import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../dist-server/index.mjs';

const fixture = fileURLToPath(new URL('../tests/server/fake-codex.mjs', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'a-gent-ui-'));
const port = Number(process.argv[2] ?? process.env.AGENT_UI_PORT ?? 4410);
process.env.AGENT_SKIP_PROVIDER_PROBE = '1';
process.env.AGENT_CODEX_COMMAND = process.execPath;
process.env.AGENT_CODEX_ARGS = JSON.stringify([fixture]);
const handle = await startServer({ port, host: '127.0.0.1', dataDir: directory, staticDir: join(process.cwd(), 'dist'), dev: false, allowLocalTokenInjection: true });
console.log(`A Gent UI test host at ${handle.url}`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  try { await handle.close(); } catch { /* best effort */ }
  try { await rm(directory, { recursive: true, force: true }); } catch { /* best effort */ }
  process.exit(0);
}
process.on('SIGTERM', () => { void stop(); });
process.on('SIGINT', () => { void stop(); });
