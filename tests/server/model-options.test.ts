import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectedModelGroups } from '../../src/composer/modelOptions.js';
import type { ProviderInfo } from '../../shared/types.js';

function provider(id: string, status: ProviderInfo['status']): ProviderInfo {
  return { id, name: id, kind: 'openai-compatible', status, detail: '', models: [{ id: `${id}-model`, name: 'Research model', description: 'Long-form reasoning' }] };
}

test('model choices exclude every disconnected provider even when it has cached models', () => {
  const catalog = [provider('online', 'connected'), provider('available', 'available'), provider('offline', 'unavailable'), provider('broken', 'error')];
  assert.deepEqual(connectedModelGroups(catalog).map(group => group.provider.id), ['online']);
  assert.deepEqual(connectedModelGroups(catalog, 'broken'), []);
  assert.deepEqual(connectedModelGroups(catalog.map(item => ({ ...item, status: 'error' }))), []);
});

test('search matches model name, ID, and provider without exposing descriptions or mutating catalogs', () => {
  const catalog = [provider('Alpha', 'connected'), provider('Beta', 'connected')];
  const before = structuredClone(catalog);
  assert.deepEqual(connectedModelGroups(catalog, '  ALPHA-model ').flatMap(group => group.choices.map(choice => choice.id)), ['Alpha-model']);
  assert.equal(connectedModelGroups(catalog, 'reasoning').length, 0);
  assert.equal('description' in connectedModelGroups(catalog)[0].choices[1], false);
  assert.equal(connectedModelGroups(catalog, 'Research model').length, 2);
  assert.equal(connectedModelGroups(catalog, 'Beta')[0].choices.length, 2);
  assert.deepEqual(connectedModelGroups(catalog, 'nothing matches'), []);
  const accented = [{ ...provider('Accent', 'connected'), models: [{ id: 'cafe', name: 'Café' }] }];
  assert.equal(connectedModelGroups(accented, 'Cafe\u0301').length, 1, 'canonically equivalent Unicode matches');
  assert.deepEqual(catalog, before);
});

test('connected providers retain their default mode when no catalog is enumerated', () => {
  const catalog = [{ ...provider('CLI', 'connected'), models: [] }];
  assert.deepEqual(connectedModelGroups(catalog)[0].choices.map(choice => choice.id), ['']);
  assert.deepEqual(connectedModelGroups([]), []);
});
