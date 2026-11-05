/**
 * Human-in-the-loop request parsing and validation.
 *
 * Codex app-server and MCP use different wire shapes for questions and forms.
 * These helpers keep the wire formats out of the run manager and reject any
 * response that does not match the schema the provider actually sent.
 */
import type { InteractionField, InteractionQuestion } from '../shared/types.js';

const MAX_QUESTIONS = 20;
const MAX_FIELDS = 50;
const MAX_OPTIONS = 100;
const MAX_TEXT = 4000;

export interface ParsedQuestionRequest { questions: InteractionQuestion[]; }
export interface ParsedElicitationForm { mode: 'form'; fields: InteractionField[]; unsupported?: string; }
export interface ParsedElicitationUrl { mode: 'url'; url: string; elicitationId?: string; }
export interface ParsedElicitationUnsupported { mode: 'unsupported'; reason: string; }
export type ParsedElicitation = ParsedElicitationForm | ParsedElicitationUrl | ParsedElicitationUnsupported;

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
function text(value: unknown, max = MAX_TEXT): string | undefined {
  return typeof value === 'string' ? value.slice(0, max) : undefined;
}
function finite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Parse Codex `item/tool/requestUserInput` params into bounded questions. */
export function parseQuestions(params: unknown): ParsedQuestionRequest | undefined {
  const data = record(params);
  if (!data || !Array.isArray(data.questions)) return undefined;
  const questions: InteractionQuestion[] = [];
  for (const raw of data.questions.slice(0, MAX_QUESTIONS)) {
    const item = record(raw);
    const question = text(item?.question);
    const id = text(item?.id, 200);
    if (!item || !question || !id) return undefined;
    const options = Array.isArray(item.options)
      ? item.options.slice(0, MAX_OPTIONS).flatMap(option => {
        const entry = record(option);
        const label = text(entry?.label, 200);
        if (!entry || !label) return [];
        const description = text(entry.description, 500);
        return [{ value: label, label, ...(description ? { description } : {}) }];
      })
      : undefined;
    questions.push({
      id,
      header: text(item.header, 200) || 'Question',
      question,
      ...(options?.length ? { options } : {}),
      ...(item.isOther === true ? { isOther: true } : {}),
      ...(item.isSecret === true ? { isSecret: true } : {}),
    });
  }
  return questions.length ? { questions } : undefined;
}

/** Parse MCP/Cadex elicitation params into a supported form or URL handoff. */
export function parseElicitation(params: unknown): ParsedElicitation {
  const data = record(params);
  if (!data) return { mode: 'unsupported', reason: 'The request did not include an elicitation payload.' };
  const mode = text(data.mode, 50);
  if (mode === 'url') {
    const url = text(data.url, 4000);
    if (!url) return { mode: 'unsupported', reason: 'The URL elicitation did not include a destination.' };
    let parsed: URL;
    try { parsed = new URL(url); } catch { return { mode: 'unsupported', reason: 'The URL elicitation destination is invalid.' }; }
    if (!['https:', 'http:'].includes(parsed.protocol)) return { mode: 'unsupported', reason: 'Only HTTP or HTTPS elicitation URLs are supported.' };
    return { mode: 'url', url, ...(text(data.elicitationId, 200) ? { elicitationId: text(data.elicitationId, 200)! } : {}) };
  }
  if (mode !== 'form' && mode !== 'openai/form' && mode !== 'openaiForm') {
    return { mode: 'unsupported', reason: `The runtime requested an unsupported elicitation mode: ${mode ?? 'none'}.` };
  }
  const schema = record(data.requestedSchema);
  const properties = record(schema?.properties);
  if (!schema || schema.type !== 'object' || !properties) return { mode: 'unsupported', reason: 'The elicitation schema is not an object form.' };
  const required = new Set(Array.isArray(schema.required) ? schema.required.filter((name): name is string => typeof name === 'string') : []);
  const fields: InteractionField[] = [];
  for (const [name, raw] of Object.entries(properties).slice(0, MAX_FIELDS)) {
    const property = record(raw);
    if (!property) return { mode: 'unsupported', reason: `The field “${name}” is not a supported primitive.` };
    const title = text(property.title, 200) || name;
    const description = text(property.description, 1000);
    const base = {
      name: name.slice(0, 200),
      label: title,
      ...(description ? { description } : {}),
      ...(required.has(name) ? { required: true } : {}),
      ...(property.default !== undefined && property.default !== null ? { default: property.default } : {}),
    };
    const type = property.type;
    if (type === 'boolean') { fields.push({ ...base, type: 'boolean' }); continue; }
    if (type === 'number' || type === 'integer') {
      fields.push({
        ...base, type,
        ...(finite(property.minimum) !== undefined ? { minimum: finite(property.minimum) } : {}),
        ...(finite(property.maximum) !== undefined ? { maximum: finite(property.maximum) } : {}),
      });
      continue;
    }
    if (type === 'array') {
      const items = record(property.items);
      if (!Array.isArray(items?.enum)) return { mode: 'unsupported', reason: `The multi-select field “${name}” has no fixed options.` };
      fields.push({ ...base, type: 'multi-enum', options: items.enum.filter((value): value is string => typeof value === 'string').slice(0, MAX_OPTIONS).map(value => ({ value, label: value })) });
      continue;
    }
    if (type !== 'string') return { mode: 'unsupported', reason: `The field “${name}” uses an unsupported type.` };
    const options = Array.isArray(property.enum)
      ? property.enum.filter((value): value is string => typeof value === 'string').slice(0, MAX_OPTIONS)
      : Array.isArray(property.oneOf)
        ? property.oneOf.flatMap(option => {
          const entry = record(option), value = text(entry?.const, 200);
          return value === undefined ? [] : [{ value, label: text(entry?.title, 200) || value }];
        })
        : undefined;
    if (options?.length) {
      fields.push({ ...base, type: 'enum', options: options.map(option => typeof option === 'string' ? { value: option, label: option } : option) });
      continue;
    }
    fields.push({
      ...base, type: 'string',
      ...(text(property.format, 50) ? { format: text(property.format, 50) } : {}),
      ...(finite(property.minLength) !== undefined ? { minLength: finite(property.minLength) } : {}),
      ...(finite(property.maxLength) !== undefined ? { maxLength: finite(property.maxLength) } : {}),
    });
  }
  if (!fields.length) return { mode: 'unsupported', reason: 'The elicitation form has no fields.' };
  return { mode: 'form', fields };
}

/** Validate `{answers: {questionId: string[]}}` against the question schema. */
export function validateQuestionAnswers(questions: InteractionQuestion[], response: unknown): { answers: Record<string, { answers: string[] }> } {
  const data = record(response);
  const answers = record(data?.answers);
  if (!answers) throw new Error('Answer every question before continuing.');
  const result: Record<string, { answers: string[] }> = {};
  for (const question of questions) {
    const value = answers[question.id];
    const wrapped = record(value)?.answers;
    const list = Array.isArray(value) ? value
      : typeof value === 'string' ? [value]
        : Array.isArray(wrapped) ? wrapped
          : typeof wrapped === 'string' ? [wrapped]
            : undefined;
    if (!list?.length) throw new Error(`Answer the question “${question.question}”.`);
    if (list.length > 20) throw new Error(`Too many answers for “${question.question}”.`);
    const normalized: string[] = [];
    for (const item of list) {
      if (typeof item !== 'string' || !item.trim()) throw new Error(`Answer the question “${question.question}”.`);
      const answer = item.slice(0, MAX_TEXT);
      if (question.options?.length && !question.isOther && !question.options.some(option => option.value === answer)) {
        throw new Error(`Choose one of the listed options for “${question.question}”.`);
      }
      normalized.push(answer);
    }
    result[question.id] = { answers: normalized };
  }
  return { answers: result };
}

/** Validate form values against the parsed MCP field schema. */
export function validateElicitationValues(fields: InteractionField[], response: unknown): Record<string, unknown> {
  const values = record(response);
  if (!values) throw new Error('Provide the requested form values.');
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    const missing = value === undefined || value === null || (typeof value === 'string' && !value.trim());
    if (missing) {
      if (field.required) throw new Error(`“${field.label}” is required.`);
      continue;
    }
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`“${field.label}” must be true or false.`);
      result[field.name] = value;
    } else if (field.type === 'number' || field.type === 'integer') {
      if (typeof value !== 'number' || !Number.isFinite(value) || (field.type === 'integer' && !Number.isInteger(value))) throw new Error(`“${field.label}” must be a ${field.type}.`);
      if (field.minimum !== undefined && value < field.minimum) throw new Error(`“${field.label}” must be at least ${field.minimum}.`);
      if (field.maximum !== undefined && value > field.maximum) throw new Error(`“${field.label}” must be at most ${field.maximum}.`);
      result[field.name] = value;
    } else if (field.type === 'enum') {
      if (typeof value !== 'string' || !field.options?.some(option => option.value === value)) throw new Error(`Choose a listed option for “${field.label}”.`);
      result[field.name] = value;
    } else if (field.type === 'multi-enum') {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !field.options?.some(option => option.value === item))) throw new Error(`Choose listed options for “${field.label}”.`);
      result[field.name] = value;
    } else {
      if (typeof value !== 'string') throw new Error(`“${field.label}” must be text.`);
      if (field.minLength !== undefined && value.length < field.minLength) throw new Error(`“${field.label}” must be at least ${field.minLength} characters.`);
      if (field.maxLength !== undefined && value.length > field.maxLength) throw new Error(`“${field.label}” must be at most ${field.maxLength} characters.`);
      if (field.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`“${field.label}” must be an email address.`);
      if (field.format === 'uri') { try { new URL(value); } catch { throw new Error(`“${field.label}” must be a valid URL.`); } }
      if (field.format === 'date' && Number.isNaN(Date.parse(value))) throw new Error(`“${field.label}” must be a date.`);
      if (field.format === 'date-time' && Number.isNaN(Date.parse(value))) throw new Error(`“${field.label}” must be a date and time.`);
      result[field.name] = value.slice(0, MAX_TEXT);
    }
  }
  return result;
}
