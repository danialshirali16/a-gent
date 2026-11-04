const args = process.argv.slice(2);

if (args[0] === 'models') {
  process.stdout.write('opencode/test-model\nopencode/second-model\n');
  process.exit(0);
}

if (args[0] === 'run') {
  const sessionIndex = args.indexOf('--session');
  const sessionID = sessionIndex >= 0 ? args[sessionIndex + 1] : 'opencode-session-1';
  const text = sessionIndex >= 0 ? 'OpenCode continued response.' : 'OpenCode test response.';
  const event = value => process.stdout.write(`${JSON.stringify(value)}\n`);
  event({ type: 'step_start', timestamp: Date.now(), sessionID, part: { id: 'step-1', type: 'step-start' } });
  event({ type: 'text', timestamp: Date.now(), sessionID, part: { id: 'text-1', type: 'text', text } });
  event({ type: 'step_finish', timestamp: Date.now(), sessionID, part: { id: 'step-2', type: 'step-finish', reason: 'stop' } });
  process.exit(0);
}

process.stderr.write('Unsupported fake OpenCode command.\n');
process.exit(1);
