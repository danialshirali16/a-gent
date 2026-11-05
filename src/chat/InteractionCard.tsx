import { useMemo, useState } from 'react';
import { ClipboardList, Link2, MessageSquare } from 'lucide-react';
import type { InteractionField, PendingInteraction } from '../../shared/types';
import { Button } from '../ui/Button';

export type InteractionDecision = (id: string, action: 'accept' | 'decline' | 'cancel', response?: unknown) => Promise<void> | void;

function fieldId(interactionId: string, name: string) { return `${interactionId}-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`; }

function QuestionBody({ interaction, answers, setAnswers, other, setOther }: {
  interaction: PendingInteraction;
  answers: Record<string, string>;
  setAnswers: (next: Record<string, string>) => void;
  other: Record<string, string>;
  setOther: (next: Record<string, string>) => void;
}) {
  const questions = interaction.payload?.questions || [];
  return <>
    {questions.map(question => {
      const name = fieldId(interaction.id, question.id);
      const value = answers[question.id] || '';
      const isOther = value === '__other__';
      return <fieldset className="reason-interaction-question" key={question.id}>
        <legend>{question.question}</legend>
        {question.options?.length
          ? <div className="reason-interaction-options">
            {question.options.map(option => <label key={option.value} className="reason-interaction-option">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => setAnswers({ ...answers, [question.id]: option.value })}
              />
              <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
            </label>)}
            {question.isOther && <label className="reason-interaction-option">
              <input type="radio" name={name} value="__other__" checked={isOther} onChange={() => setAnswers({ ...answers, [question.id]: '__other__' })} />
              <span><strong>Other</strong></span>
            </label>}
            {isOther && <input
              className="reason-interaction-text"
              aria-label={`Other answer for ${question.question}`}
              value={other[question.id] || ''}
              maxLength={4000}
              autoFocus
              onChange={event => setOther({ ...other, [question.id]: event.target.value })}
            />}
          </div>
          : <input
            className="reason-interaction-text"
            aria-label={question.question}
            type={question.isSecret ? 'password' : 'text'}
            autoComplete={question.isSecret ? 'off' : undefined}
            value={value}
            maxLength={4000}
            onChange={event => setAnswers({ ...answers, [question.id]: event.target.value })}
          />}
      </fieldset>;
    })}
  </>;
}

function FormBody({ interaction, values, setValues }: {
  interaction: PendingInteraction;
  values: Record<string, unknown>;
  setValues: (next: Record<string, unknown>) => void;
}) {
  const fields = interaction.payload?.fields || [];
  return <>
    {fields.map(field => {
      const id = fieldId(interaction.id, field.name);
      const value = values[field.name];
      const update = (next: unknown) => setValues({ ...values, [field.name]: next });
      if (field.type === 'boolean') return <label className="reason-interaction-check" key={field.name} htmlFor={id}>
        <input id={id} type="checkbox" checked={value === true} onChange={event => update(event.target.checked)} />
        <span><strong>{field.label}{field.required ? ' *' : ''}</strong>{field.description && <small>{field.description}</small>}</span>
      </label>;
      if (field.type === 'enum') return <div className="reason-interaction-field" key={field.name}>
        <label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
        <select id={id} value={typeof value === 'string' ? value : ''} onChange={event => update(event.target.value)}>
          <option value="">Choose…</option>
          {(field.options || []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {field.description && <small>{field.description}</small>}
      </div>;
      if (field.type === 'multi-enum') {
        const selected = Array.isArray(value) ? value as string[] : [];
        return <fieldset className="reason-interaction-question" key={field.name}>
          <legend>{field.label}{field.required ? ' *' : ''}</legend>
          {field.description && <small>{field.description}</small>}
          <div className="reason-interaction-options">{(field.options || []).map(option => <label className="reason-interaction-check" key={option.value}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={event => update(event.target.checked ? [...selected, option.value] : selected.filter(item => item !== option.value))}
            />
            <span>{option.label}</span>
          </label>)}</div>
        </fieldset>;
      }
      if (field.type === 'number' || field.type === 'integer') return <div className="reason-interaction-field" key={field.name}>
        <label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
        <input
          id={id}
          type="number"
          step={field.type === 'integer' ? 1 : 'any'}
          min={field.minimum}
          max={field.maximum}
          value={typeof value === 'number' ? value : ''}
          onChange={event => update(event.target.value === '' ? undefined : Number(event.target.value))}
        />
        {field.description && <small>{field.description}</small>}
      </div>;
      return <div className="reason-interaction-field" key={field.name}>
        <label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>
        <input
          id={id}
          type={field.format === 'email' ? 'email' : field.format === 'uri' ? 'url' : field.format === 'date' ? 'date' : field.format === 'date-time' ? 'datetime-local' : 'text'}
          autoComplete="off"
          minLength={field.minLength}
          maxLength={field.maxLength ?? 4000}
          value={typeof value === 'string' ? value : ''}
          onChange={event => update(event.target.value)}
        />
        {field.description && <small>{field.description}</small>}
      </div>;
    })}
  </>;
}

export function InteractionCard({ interaction, onRespond, className = '' }: {
  interaction: PendingInteraction;
  onRespond: InteractionDecision;
  className?: string;
}) {
  const questions = interaction.payload?.questions || [];
  const fields = interaction.payload?.fields || [];
  const defaults = useMemo(() => Object.fromEntries(fields.flatMap(field => field.default === undefined ? [] : [[field.name, field.default]])), [interaction.id]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, unknown>>(defaults);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'accept' | 'decline' | 'cancel' | null>(null);
  const questionsComplete = questions.length > 0 && questions.every(question => {
    const value = answers[question.id];
    return value === '__other__' ? !!(other[question.id] || '').trim() : !!value?.trim();
  });
  const Icon = interaction.kind === 'question' ? MessageSquare : interaction.kind === 'url' ? Link2 : ClipboardList;
  let urlHost = interaction.url || '';
  try { if (interaction.url) urlHost = new URL(interaction.url).host; } catch { /* show the raw destination */ }

  const decide = async (action: 'accept' | 'decline' | 'cancel') => {
    setError('');
    if (action === 'accept' && interaction.kind === 'question' && !questionsComplete) { setError('Answer every question before continuing.'); return; }
    setBusy(action);
    try {
      let response: unknown;
      if (action === 'accept' && interaction.kind === 'question') {
        response = { answers: Object.fromEntries(questions.map(question => {
          const value = answers[question.id];
          return [question.id, { answers: [(value === '__other__' ? other[question.id] : value) || ''].filter(Boolean) }];
        })) };
      } else if (action === 'accept' && interaction.kind === 'form') {
        response = values;
      }
      await onRespond(interaction.id, action, response);
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(null); }
  };

  if (interaction.kind === 'url') return <div className={`reason-approval reason-interaction ${className}`.trim()} role="group" aria-label={interaction.title}>
    <div className="reason-approval-head"><Icon size={16} /><h3>{interaction.title}</h3></div>
    <p>{interaction.description || 'This app needs you to finish signing in through its own page.'}</p>
    {interaction.url && <p className="reason-interaction-url"><a href={interaction.url} target="_blank" rel="noreferrer noopener">{urlHost}</a></p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="reason-approval-actions">
      <Button variant="quiet" size="sm" onClick={() => void decide('cancel')} loading={busy === 'cancel'}>Cancel</Button>
      <Button variant="primary" size="sm" onClick={() => { if (interaction.url) window.open(interaction.url, '_blank', 'noopener,noreferrer'); void decide('accept'); }} loading={busy === 'accept'}>Open and continue</Button>
    </div>
  </div>;

  if (interaction.kind !== 'question' && interaction.kind !== 'form') return null;
  return <div className={`reason-approval reason-interaction ${className}`.trim()} role="group" aria-label={interaction.title}>
    <div className="reason-approval-head"><Icon size={16} /><h3>{interaction.title}</h3></div>
    {interaction.description && <p>{interaction.description}</p>}
    {interaction.kind === 'question'
      ? <QuestionBody interaction={interaction} answers={answers} setAnswers={setAnswers} other={other} setOther={setOther} />
      : <FormBody interaction={interaction} values={values} setValues={setValues} />}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="reason-approval-actions">
      <Button variant="quiet" size="sm" onClick={() => void decide('decline')} loading={busy === 'decline'} disabled={!!busy}>Decline</Button>
      <Button variant="primary" size="sm" onClick={() => void decide('accept')} loading={busy === 'accept'} disabled={!!busy || (interaction.kind === 'question' && !questionsComplete)}>Send answer</Button>
    </div>
  </div>;
}
