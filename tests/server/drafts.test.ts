import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearDraft, draftScopeForAgent, draftScopeForConversation, draftStorageKey, loadDraft, saveDraft, type DraftStorage } from '../../src/drafts.js';

function memoryStorage(): DraftStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
  };
}

const attachment = { id: 'file-1', name: 'notes.md', type: 'text/markdown', content: '# Notes\n' };

test('drafts are scoped by host and chat or agent, and survive navigation', () => {
  const storage = memoryStorage();
  const host = 'http://127.0.0.1:4317';
  const chat = draftScopeForConversation('chat-1');
  const agent = draftScopeForAgent('primary');
  saveDraft(storage, host, chat, 'Unsent chat text', [attachment], '2026-11-05T12:00:00.000Z');
  saveDraft(storage, host, agent, 'Unsent new-chat text', []);
  assert.deepEqual(loadDraft(storage, host, chat), { text: 'Unsent chat text', attachments: [attachment], updatedAt: '2026-11-05T12:00:00.000Z' });
  assert.equal(loadDraft(storage, host, agent)?.text, 'Unsent new-chat text');
  assert.equal(loadDraft(storage, 'http://other-host:4317', chat), undefined);
  assert.equal(loadDraft(storage, host, draftScopeForConversation('chat-2')), undefined);
  clearDraft(storage, host, chat);
  assert.equal(loadDraft(storage, host, chat), undefined);
  assert.equal(storage.values.has(draftStorageKey(host, chat)), false);
});

test('invalid or oversized drafts are ignored and empty drafts are removed', () => {
  const storage = memoryStorage();
  const host = 'http://127.0.0.1:4317';
  const scope = draftScopeForConversation('chat-1');
  storage.setItem(draftStorageKey(host, scope), '{not json');
  assert.equal(loadDraft(storage, host, scope), undefined);
  storage.setItem(draftStorageKey(host, scope), JSON.stringify({ text: 'x', attachments: [{ id: '', name: 'x', type: 'text/plain', content: 'x' }], updatedAt: new Date().toISOString() }));
  assert.equal(loadDraft(storage, host, scope), undefined, 'an invalid attachment invalidates the draft instead of loading partial content');
  saveDraft(storage, host, scope, 'text', [], '2026-11-05T12:00:00.000Z');
  assert.ok(loadDraft(storage, host, scope));
  saveDraft(storage, host, scope, '', []);
  assert.equal(loadDraft(storage, host, scope), undefined, 'clearing the composer removes the durable empty draft');
});
