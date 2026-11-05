import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindingFor, bindingMatches, prepareConversationBinding, type SessionBindingExpectation } from '../../server/session-binding.js';
import type { Conversation } from '../../shared/types.js';

const expected: SessionBindingExpectation = {
  providerId: 'codex',
  providerKind: 'codex',
  accountId: 'profile-1',
  workspaceId: '/work/project',
  modelId: 'test-model',
};

function conversation(): Conversation {
  return {
    id: 'chat-1', agentId: 'primary', title: 'Test', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', messages: [],
    providerThreadId: 'thread-1',
    providerBinding: bindingFor(expected, 'thread-1', '2026-01-01T00:00:00.000Z'),
  };
}

test('session binding matches only the same provider, profile, workspace, and model', () => {
  const binding = bindingFor(expected, 'thread-1', '2026-01-01T00:00:00.000Z');
  assert.equal(bindingMatches(binding, expected), true);
  assert.equal(bindingMatches(binding, { ...expected, providerId: 'opencode' }), false);
  assert.equal(bindingMatches(binding, { ...expected, providerKind: 'opencode' }), false);
  assert.equal(bindingMatches(binding, { ...expected, accountId: 'profile-2' }), false);
  assert.equal(bindingMatches(binding, { ...expected, workspaceId: '/work/other' }), false);
  assert.equal(bindingMatches(binding, { ...expected, modelId: 'other-model' }), false);
  assert.equal(bindingMatches({ ...binding, providerThreadId: '' }, expected), false);
});

test('matching bindings keep the provider session; mismatches and legacy ids rebuild deliberately', () => {
  const matching = conversation();
  assert.equal(prepareConversationBinding(matching, expected), true);
  assert.equal(matching.providerThreadId, 'thread-1');
  assert.equal(matching.providerBinding?.providerThreadId, 'thread-1');

  const changedModel = conversation();
  assert.equal(prepareConversationBinding(changedModel, { ...expected, modelId: 'other-model' }), false);
  assert.equal(changedModel.providerThreadId, undefined);
  assert.equal(changedModel.providerBinding, undefined);

  const legacy = conversation();
  delete legacy.providerBinding;
  assert.equal(prepareConversationBinding(legacy, expected), false);
  assert.equal(legacy.providerThreadId, undefined);
  assert.equal(legacy.providerBinding, undefined);

  const fresh: Conversation = { id: 'chat-2', agentId: 'primary', title: 'Fresh', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', messages: [] };
  assert.equal(prepareConversationBinding(fresh, expected), false);
  assert.equal(fresh.providerThreadId, undefined);
});
