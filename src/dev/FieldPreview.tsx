import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Field, FieldGroup } from '../ui/Field';
import { Input, Textarea } from '../ui/Input';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './field-preview.css';

const colors = ['#f39161', '#9393ed', '#5ab9a0', '#d5a35f', '#d980a8', '#70aee0'];

export function FieldPreview() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(colors[1]);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const invalid = attempted && !name.trim();
  const emailInvalid = attempted && email.length > 0 && !email.includes('@');

  function save(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setNotice('');
    if (!name.trim()) { nameRef.current?.focus(); return; }
    if (email.length > 0 && !email.includes('@')) return;
    setNotice(`Saved “${name.trim()}” in this preview.`);
  }

  return <PreviewLayout title="Field" description="Labels, descriptions, requirement markers, and validation messages around the shared controls." component="field">
    <section className="input-preview-section" aria-labelledby="field-anatomy">
      <div className="input-preview-heading"><h2 id="field-anatomy">Anatomy</h2><p>Every state is generated from one composition</p></div>
      <div className="input-preview-grid input-preview-surface field-preview-grid">
        <Field label="Default"><Input placeholder="Agent name" /></Field>
        <Field label="With description" description="Shown in the sidebar and conversation header."><Input placeholder="Design Partner" /></Field>
        <Field label="Required" required><Input placeholder="Required field" /></Field>
        <Field label="Notes" optional><Input placeholder="Optional field" /></Field>
        <Field label="Validation" error="Enter an agent name."><Input placeholder="Agent name" /></Field>
        <Field label="Disabled" description="Unavailable while this agent is archived."><Input value="Archived agent" disabled /></Field>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="field-groups">
      <div className="input-preview-heading"><h2 id="field-groups">Grouped controls</h2><p>Labels stay associated with the right element</p></div>
      <div className="input-preview-surface field-preview-groups">
        <FieldGroup label="Color" description="Used for this agent’s mark in the sidebar.">
          <div className="color-options field-preview-colors">{colors.map(value => <button type="button" className={color === value ? 'selected' : ''} style={{ background: value }} key={value} aria-label={`Use ${value}`} aria-pressed={color === value} onClick={() => setColor(value)}>{color === value && <span aria-hidden="true">✓</span>}</button>)}</div>
        </FieldGroup>
        <Field label="Instructions" description="Multiline fields keep the same label and message rhythm."><Textarea placeholder="Describe how this agent should work…" rows={3} /></Field>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="field-live">
      <div className="input-preview-heading"><h2 id="field-live">Try it</h2><p>Save an empty name, or enter an invalid email, to see validation.</p></div>
      <form className="input-preview-surface input-preview-form field-preview-form" onSubmit={save} noValidate>
        <div className="field-preview-form-grid">
          <Field label="Full name" required description="Used on your workspace and invitations." error={invalid ? 'Enter your name.' : undefined}><Input ref={nameRef} name="name" value={name} onChange={event => { setName(event.target.value); setNotice(''); }} placeholder="e.g. Danial" maxLength={80} /></Field>
          <Field label="Work email" optional description="We only use this for local workspace notifications." error={emailInvalid ? 'Enter an email address with an @ sign.' : undefined}><Input name="email" type="email" value={email} onChange={event => { setEmail(event.target.value); setNotice(''); }} placeholder="you@example.com" autoComplete="email" /></Field>
        </div>
        <Field label="Notes" optional description="Anything the agent should know before the first conversation."><Textarea name="notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Context, preferences, or constraints…" rows={3} maxLength={2000} /></Field>
        <div className="input-preview-actions"><p role="status">{notice || 'Changes stay in this preview.'}</p><Button type="submit" variant="primary">Save preview</Button></div>
      </form>
    </section>
  </PreviewLayout>;
}
