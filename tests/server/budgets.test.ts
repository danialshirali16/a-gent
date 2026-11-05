import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUDGETS, budgetSignal, combineBudget, withBudget } from '../../server/budgets.js';

test('shared budgets cover startup, catalog, auth, tool, interaction, stream, and shutdown', () => {
  for (const name of ['startup', 'catalog', 'auth', 'tool', 'interaction', 'stream', 'shutdown', 'terminationGrace', 'terminationKill', 'interrupt', 'heartbeat'] as const) {
    assert.equal(typeof BUDGETS[name], 'number');
    assert.ok(BUDGETS[name] > 0, `${name} must be positive`);
  }
  assert.ok(BUDGETS.startup <= BUDGETS.session);
  assert.ok(BUDGETS.terminationGrace < BUDGETS.shutdown);
  assert.ok(BUDGETS.interaction < BUDGETS.stream);
  assert.ok(BUDGETS.maxResponseBytes > 0 && BUDGETS.sseBufferBytes > 0);
});

test('budget signals time out and preserve parent cancellation', async () => {
  const timeout = budgetSignal('catalog', 20);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('budget signal did not abort')), 1000);
    timeout.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
  assert.equal(timeout.aborted, true);

  const parent = new AbortController();
  const combined = combineBudget('catalog', parent.signal, 5000);
  parent.abort();
  assert.equal(combined.aborted, true);
});

test('withBudget cleans up after a bounded operation and rejects on timeout', async () => {
  const value = await withBudget('catalog', async () => 'ok', { timeoutMs: 100 });
  assert.equal(value, 'ok');

  await assert.rejects(withBudget('catalog', async signal => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted by budget')), { once: true });
  }), { timeoutMs: 20 }), /aborted by budget/);
});
