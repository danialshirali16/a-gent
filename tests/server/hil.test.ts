import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseElicitation, parseQuestions, validateElicitationValues, validateQuestionAnswers } from '../../server/hil.js';

test('Codex questions preserve ids, options, and free-text handling', () => {
  const parsed = parseQuestions({ questions: [
    { id: 'scope', header: 'Scope', question: 'Where should this run?', options: [{ label: 'Workspace', description: 'Only this folder.' }, { label: 'Account', description: 'Every workspace.' }] },
    { id: 'note', header: 'Note', question: 'Anything else?', isOther: true, options: [] },
  ] });
  assert.ok(parsed);
  assert.equal(parsed.questions.length, 2);
  assert.deepEqual(parsed.questions[0].options?.map(option => option.value), ['Workspace', 'Account']);
  assert.equal(parsed.questions[1].isOther, true);
  assert.equal(validateQuestionAnswers(parsed.questions, { answers: { scope: { answers: ['Workspace'] }, note: { answers: ['Keep it small'] } } }).answers.scope.answers[0], 'Workspace');
  assert.throws(() => validateQuestionAnswers(parsed.questions, { answers: { scope: { answers: ['Server'] }, note: { answers: ['x'] } } }), /listed options/);
  assert.throws(() => validateQuestionAnswers(parsed.questions, { answers: { scope: { answers: ['Workspace'] } } }), /Anything else/);
  assert.equal(parseQuestions({ questions: [{ header: 'Missing id', question: 'No id' }] }), undefined);
});

test('question parsing rejects an empty or malformed request', () => {
  assert.equal(parseQuestions({ questions: [] }), undefined);
  assert.equal(parseQuestions({ questions: [{ id: '', question: '' }] }), undefined);
  assert.equal(parseQuestions({}), undefined);
});

test('elicitation forms parse supported primitives and reject nested objects', () => {
  const parsed = parseElicitation({
    mode: 'form', serverName: 'Calendar', message: 'Choose',
    requestedSchema: {
      type: 'object',
      properties: {
        calendar: { type: 'string', title: 'Calendar', enum: ['work', 'personal'] },
        days: { type: 'integer', title: 'Days ahead', minimum: 1, maximum: 30, default: 7 },
        allDay: { type: 'boolean', title: 'All day' },
        labels: { type: 'array', title: 'Labels', items: { type: 'string', enum: ['a', 'b'] } },
      },
      required: ['calendar'],
    },
  });
  assert.equal(parsed.mode, 'form');
  if (parsed.mode !== 'form') return;
  assert.deepEqual(parsed.fields.map(field => field.type), ['enum', 'integer', 'boolean', 'multi-enum']);
  assert.equal(parsed.fields[1].default, 7);
  assert.deepEqual(validateElicitationValues(parsed.fields, { calendar: 'work', allDay: true, labels: ['a'] }), { calendar: 'work', allDay: true, labels: ['a'] });
  assert.throws(() => validateElicitationValues(parsed.fields, {}), /required/);
  assert.throws(() => validateElicitationValues(parsed.fields, { calendar: 'work', days: 0 }), /at least 1/);
  assert.throws(() => validateElicitationValues(parsed.fields, { calendar: 'work', days: 31 }), /at most 30/);
  assert.throws(() => validateElicitationValues(parsed.fields, { calendar: 'other' }), /listed option/);
  assert.throws(() => validateElicitationValues(parsed.fields, { calendar: 'work', allDay: 'yes' }), /true or false/);

  const nested = parseElicitation({ mode: 'form', requestedSchema: { type: 'object', properties: { address: { type: 'object', properties: {} } } } });
  assert.equal(nested.mode, 'unsupported');
});

test('URL elicitation only accepts HTTP(S) destinations', () => {
  const parsed = parseElicitation({ mode: 'url', url: 'https://example.test/connect', elicitationId: 'e-1', message: 'Sign in' });
  assert.deepEqual(parsed, { mode: 'url', url: 'https://example.test/connect', elicitationId: 'e-1' });
  assert.equal(parseElicitation({ mode: 'url', url: 'file:///etc/passwd' }).mode, 'unsupported');
  assert.equal(parseElicitation({ mode: 'url', url: 'not a url' }).mode, 'unsupported');
  assert.equal(parseElicitation({ mode: 'weird' }).mode, 'unsupported');
});
