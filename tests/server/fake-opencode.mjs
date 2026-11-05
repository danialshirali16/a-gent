import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const ignoreShutdown = args.includes('--ignore-shutdown');
const pidIndex = args.indexOf('--pid-file');
if (pidIndex >= 0) writeFileSync(args[pidIndex + 1], String(process.pid));
if (ignoreShutdown) process.on('SIGTERM', () => {});

const commandIndex = args.findIndex(arg => arg === 'models' || arg === 'run' || arg === 'mcp');
const command = commandIndex >= 0 ? args[commandIndex] : '';

if (command === 'mcp' && args[commandIndex + 1] === 'list') {
  process.stdout.write('✓ computer-use  connected\n');
  process.exit(0);
}

if (command === 'models') {
  process.stdout.write('opencode/test-model\nopencode/second-model\n');
  process.exit(0);
}

if (command === 'run') {
  const sessionIndex = args.indexOf('--session');
  const sessionID = sessionIndex >= 0 ? args[sessionIndex + 1] : 'opencode-session-1';
  const prompt = args.at(-1) ?? '';
  const event = value => process.stdout.write(`${JSON.stringify(value)}\n`);
  event({ type: 'step_start', timestamp: Date.now(), sessionID, part: { id: 'step-1', type: 'step-start' } });
  if (prompt.includes('[hold]')) {
    // Stay alive until the host confirms termination; an ignored SIGTERM exercises escalation.
    setInterval(() => {}, 1000);
  } else {
    const text = sessionIndex >= 0 ? 'OpenCode continued response.' : 'OpenCode test response.';
    event({ type: 'text', timestamp: Date.now(), sessionID, part: { id: 'text-1', type: 'text', text } });
    event({ type: 'step_finish', timestamp: Date.now(), sessionID, part: { id: 'step-2', type: 'step-finish', reason: 'stop' } });
    process.exit(0);
  }
} else {
  process.stderr.write(`Unsupported fake OpenCode command: ${JSON.stringify(args)}\n`);
  process.exit(1);
}
