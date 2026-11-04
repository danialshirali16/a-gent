import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('..', import.meta.url));
const url = 'http://127.0.0.1:4317';
const server = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server/index.ts', '--dev'], {
  cwd: project,
  stdio: 'inherit',
  env: { ...process.env, AGENT_PORT: '4317' },
});
let desktop;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  desktop?.kill();
  server.kill();
  setTimeout(() => process.exit(code), 250).unref();
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
server.on('error', error => { console.error(error.message); stop(1); });
server.on('exit', code => { if (!stopping) stop(code || 0); });

let ready = false;
for (let attempt = 0; attempt < 120 && !stopping; attempt += 1) {
  try { const response = await fetch(url); if (response.ok) { ready = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 250));
}
if (!ready) {
  console.error('A Gent development server did not become ready at ' + url);
  stop(1);
} else {
  desktop = spawn(process.execPath, ['node_modules/electron/cli.js', '.'], {
    cwd: project,
    stdio: 'inherit',
    env: { ...process.env, AGENT_DEV_URL: url },
  });
  desktop.on('error', error => { console.error(error.message); stop(1); });
  desktop.on('exit', code => stop(code || 0));
}
