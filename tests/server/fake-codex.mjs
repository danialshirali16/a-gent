// A deterministic protocol fixture. It never calls a model or executes a command.
import { createInterface } from 'node:readline';
import { appendFileSync, writeFileSync } from 'node:fs';
const lines = createInterface({ input: process.stdin });
if (process.argv.includes('--ignore-shutdown')) { process.on('SIGTERM', () => {}); setInterval(() => {}, 1000); }
const pidFileIndex = process.argv.indexOf('--pid-file');
if (pidFileIndex >= 0) writeFileSync(process.argv[pidFileIndex + 1], String(process.pid));
const write = value => process.stdout.write(JSON.stringify(value) + '\n');
const threads = new Map();
const pending = new Map();
let sequence = 0;
function finish(threadId, turnId, text) {
  write({ method: 'item/agentMessage/delta', params: { threadId, turnId, itemId: 'answer', delta: text.slice(0, 8) } });
  write({ method: 'item/agentMessage/delta', params: { threadId, turnId, itemId: 'answer', delta: text.slice(8) } });
  write({ method: 'item/completed', params: { threadId, turnId, item: { type: 'agentMessage', id: 'answer', text } } });
  write({ method: 'turn/completed', params: { threadId, turn: { id: turnId, status: 'completed' } } });
}
lines.on('line', line => {
  const message = JSON.parse(line), p = message.params ?? {};
  if (!message.method) {
    const pendingRequest = pending.get(message.id);
    if (pendingRequest) {
      pending.delete(message.id);
      if (pendingRequest.kind === 'question') {
        const answer = message.result?.answers?.scope?.answers?.join(', ') || message.error?.message || 'No answer';
        finish(pendingRequest.threadId, pendingRequest.turnId, `Question answer: ${answer}`);
      } else if (pendingRequest.kind === 'form') {
        const values = message.result?.content ? JSON.stringify(message.result.content) : message.result?.action || 'declined';
        finish(pendingRequest.threadId, pendingRequest.turnId, `Form result: ${values}`);
      } else {
        finish(pendingRequest.threadId, pendingRequest.turnId, message.result?.decision === 'accept' ? 'Approved task completed.' : 'Approval declined.');
      }
    }
    return;
  }
  const respond = result => write({ id: message.id, result });
  switch (message.method) {
    case 'initialize': respond({ userAgent: 'a-gent-test' }); break;
    case 'initialized': break;
    case 'account/read': respond({ account: { type: 'chatgpt' }, requiresOpenaiAuth: true }); break;
    case 'model/list': respond({ data: [
      { id: 'test-model', model: 'test-model', displayName: 'Test model', hidden: false, defaultReasoningEffort: 'medium', supportedReasoningEfforts: [{ reasoningEffort: 'low', description: 'Fast' }, { reasoningEffort: 'medium', description: 'Balanced' }, { reasoningEffort: 'high', description: 'Deep' }] },
      { id: 'test-model-2', model: 'test-model-2', displayName: 'Test model 2', hidden: false, defaultReasoningEffort: 'low', supportedReasoningEfforts: [{ reasoningEffort: 'low', description: 'Fast' }, { reasoningEffort: 'high', description: 'Deep' }] },
    ], nextCursor: null }); break;
    case 'mcpServerStatus/list': {
      if (process.argv.includes('--mcp-slow')) break;
      if (process.argv.includes('--mcp-paginate')) {
        if (!p.cursor) { respond({ data: [{ name: 'Calendar', runtimeStatus: 'connected', authStatus: 'oAuth', httpOrigin: 'https://private.example', tools: { calendar: { inputSchema: { privateMarker: 'must-not-leak' } } } }], nextCursor: 'page-2' }); break; }
        if (p.cursor === 'page-2') { write({ id: message.id, error: { code: -32000, message: 'Inventory page failed.' } }); break; }
      }
      const data = [
        { name: 'Calendar', runtimeStatus: 'connected', authStatus: 'oAuth', httpOrigin: 'https://private.example', tools: { calendar: { inputSchema: { privateMarker: 'must-not-leak' } } } },
        { name: 'Files', runtimeStatus: 'authenticationRequired', authStatus: 'notLoggedIn', tools: {} },
      ];
      if (p.threadId) data.push({ name: 'ThreadOnly', runtimeStatus: 'connected', authStatus: 'none', tools: { thread_tool: {} } });
      respond({ data, nextCursor: null }); break;
    }
    case 'thread/start': {
      if (p.approvalPolicy !== 'on-request' || p.approvalsReviewer !== 'user' || !['read-only', 'workspace-write'].includes(p.sandbox)) throw new Error('Unsafe or missing thread controls.');
      const threadId = `test-thread-${++sequence}`; threads.set(threadId, { turns: 0 }); respond({ thread: { id: threadId } }); break;
    }
    case 'thread/resume': {
      if (!threads.has(p.threadId)) threads.set(p.threadId, { turns: 1 });
      respond({ thread: { id: p.threadId } }); break;
    }
    case 'turn/start': {
      if (p.approvalPolicy !== 'on-request' || p.sandboxPolicy?.type === 'dangerFullAccess') throw new Error('Unsafe turn controls.');
      const thread = threads.get(p.threadId); thread.turns++;
      const turnId = `turn-${++sequence}`;
      const text = p.input[0].text;
      if (process.env.AGENT_TEST_CODEX_TRACE) appendFileSync(process.env.AGENT_TEST_CODEX_TRACE, JSON.stringify({ method: 'turn/start', text, turnId }) + '\n');
      if (text.includes('[start-pending]')) {
        setTimeout(() => respond({ turn: { id: turnId, status: 'inProgress' } }), 150);
        break;
      }
      if (text.includes('[wait-for-stale]')) {
        // Exercise stale events both before and after the new turn/start response.
        const stale = () => {
          write({ method: 'item/agentMessage/delta', params: { threadId: p.threadId, turnId: thread.previousTurnId, itemId: 'old-answer', delta: 'STALE OLD RESPONSE' } });
          write({ method: 'turn/completed', params: { threadId: p.threadId, turn: { id: thread.previousTurnId, status: 'completed' } } });
        };
        stale(); setTimeout(() => respond({ turn: { id: turnId, status: 'inProgress' } }), 60);
        setTimeout(stale, 120); setTimeout(() => finish(p.threadId, turnId, 'The new turn completed correctly.'), 250);
        break;
      }
      respond({ turn: { id: turnId, status: 'inProgress' } });
      if (text.includes('[approval]')) {
        const requestId = `approval-${sequence}`; pending.set(requestId, { threadId: p.threadId, turnId });
        setTimeout(() => write({ id: requestId, method: 'item/commandExecution/requestApproval', params: { threadId: p.threadId, turnId, itemId: 'command', command: 'echo A Gent test', cwd: p.cwd, reason: 'Protocol fixture approval.' } }), 10);
      } else if (text.includes('[question]')) {
        const requestId = `question-${sequence}`; pending.set(requestId, { threadId: p.threadId, turnId, kind: 'question' });
        setTimeout(() => write({ id: requestId, method: 'item/tool/requestUserInput', params: {
          threadId: p.threadId, turnId, itemId: 'question', isBlocking: true,
          questions: [{ id: 'scope', header: 'Choose a scope', question: 'Where should this run?', options: [{ label: 'Workspace', description: 'Only this folder.' }, { label: 'Account', description: 'Every workspace.' }] }],
        } }), 10);
      } else if (text.includes('[form]')) {
        const requestId = `form-${sequence}`; pending.set(requestId, { threadId: p.threadId, turnId, kind: 'form' });
        setTimeout(() => write({ id: requestId, method: 'mcpServer/elicitation/request', params: {
          threadId: p.threadId, turnId, serverName: 'Calendar', message: 'Choose a calendar for this task.',
          mode: 'form',
          requestedSchema: {
            type: 'object',
            properties: {
              calendar: { type: 'string', title: 'Calendar', enum: ['work', 'personal'] },
              days: { type: 'integer', title: 'Days ahead', minimum: 1, maximum: 30, default: 7 },
            },
            required: ['calendar'],
          },
        } }), 10);
      } else if (text.includes('[slow]')) {
        thread.timer = setTimeout(() => finish(p.threadId, turnId, 'Slow task completed.'), 5000);
      } else setTimeout(() => finish(p.threadId, turnId, `A Gent test response ${thread.turns}.`), 10);
      break;
    }
    case 'turn/interrupt': {
      const thread = threads.get(p.threadId); clearTimeout(thread?.timer); if (thread) thread.previousTurnId = p.turnId;
      respond({});
      setTimeout(() => write({ method: 'turn/completed', params: { threadId: p.threadId, turn: { id: p.turnId, status: 'interrupted' } } }), 100); break;
    }
    default: write({ id: message.id, error: { code: -32601, message: 'Unknown fixture method.' } });
  }
});
