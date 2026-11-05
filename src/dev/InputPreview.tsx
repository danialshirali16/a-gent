import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';

export function InputPreview() {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const invalid = attempted && !name.trim();

  function save(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!name.trim()) { setNotice(''); nameRef.current?.focus(); return; }
    setNotice(`Saved “${name.trim()}” in this preview.`);
  }

  return <PreviewLayout title="Input & Textarea" description="Quiet fields for names, instructions, and connection details." component="input">
    <section className="input-preview-section" aria-labelledby="input-states">
      <div className="input-preview-heading"><h2 id="input-states">Input</h2><p>Native editing, clear states</p></div>
      <div className="input-preview-grid input-preview-surface">
        <div className="input-preview-field"><label htmlFor="input-empty">Default</label><Input id="input-empty" placeholder="Agent name" /></div>
        <div className="input-preview-field"><label htmlFor="input-filled">Filled</label><Input id="input-filled" defaultValue="Design Partner" /></div>
        <div className="input-preview-field"><label htmlFor="input-readonly">Read-only</label><Input id="input-readonly" value="A Gent workspace" readOnly aria-describedby="input-readonly-help" /><p id="input-readonly-help">You can select and copy this value.</p></div>
        <div className="input-preview-field"><label htmlFor="input-disabled">Disabled</label><Input id="input-disabled" value="Unavailable" disabled /></div>
        <div className="input-preview-field"><label htmlFor="input-error">Error</label><Input id="input-error" defaultValue="" placeholder="Agent name" aria-invalid="true" aria-describedby="input-error-help" /><p id="input-error-help" className="input-preview-error">Enter an agent name.</p></div>
        <div className="input-preview-field"><label htmlFor="input-password">Password</label><Input id="input-password" type="password" autoComplete="off" defaultValue="preview-token" aria-describedby="input-password-help" /><p id="input-password-help">Uses the browser’s native password field.</p></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="input-sizes">
      <div className="input-preview-heading"><h2 id="input-sizes">Sizes</h2><p>28, 32, and 36 pixels · larger on touch screens</p></div>
      <div className="input-preview-grid input-preview-surface input-preview-sizes">
        <div className="input-preview-field"><label htmlFor="input-small">Small</label><Input id="input-small" controlSize="sm" placeholder="Small field" /></div>
        <div className="input-preview-field"><label htmlFor="input-medium">Default size</label><Input id="input-medium" placeholder="Default field" /></div>
        <div className="input-preview-field"><label htmlFor="input-large">Large</label><Input id="input-large" controlSize="lg" placeholder="Large field" /></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="textarea-states">
      <div className="input-preview-heading"><h2 id="textarea-states">Textarea</h2><p>Multiline text with vertical resizing</p></div>
      <div className="input-preview-grid input-preview-surface input-preview-textareas">
        <div className="input-preview-field"><label htmlFor="textarea-default">Default</label><Textarea id="textarea-default" placeholder="Describe how this agent should work…" /></div>
        <div className="input-preview-field"><label htmlFor="textarea-error">Error</label><Textarea id="textarea-error" placeholder="Add instructions…" aria-invalid="true" aria-describedby="textarea-error-help" /><p id="textarea-error-help" className="input-preview-error">Add instructions before scheduling this task.</p></div>
        <div className="input-preview-field"><label htmlFor="textarea-readonly">Read-only</label><Textarea id="textarea-readonly" value={'Keep the brief clear.\nMake every interaction feel considered.'} readOnly /></div>
        <div className="input-preview-field"><label htmlFor="textarea-disabled">Disabled</label><Textarea id="textarea-disabled" value="Instructions are unavailable while this agent is archived." disabled /></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="input-live">
      <div className="input-preview-heading"><h2 id="input-live">Try it</h2><p>Tab through fields or save an empty name to see validation.</p></div>
      <form className="input-preview-surface input-preview-form" onSubmit={save} noValidate>
        <div className="input-preview-field"><label htmlFor="preview-agent-name">Agent name <span>(required)</span></label><Input ref={nameRef} id="preview-agent-name" name="name" value={name} onChange={event => { setName(event.target.value); setNotice(''); }} placeholder="e.g. Design Partner" required maxLength={80} aria-invalid={invalid || undefined} aria-describedby={invalid ? 'preview-name-error' : 'preview-name-help'} />{invalid ? <p id="preview-name-error" className="input-preview-error" role="alert">Enter an agent name.</p> : <p id="preview-name-help">Give your agent a name you’ll recognize.</p>}</div>
        <div className="input-preview-field"><label htmlFor="preview-agent-instructions">Instructions <span>(optional)</span></label><Textarea id="preview-agent-instructions" name="instructions" value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="What should this agent help with?" maxLength={16000} /></div>
        <div className="input-preview-actions"><p role="status">{notice || 'Changes stay in this preview.'}</p><Button type="submit" variant="primary">Save preview</Button></div>
      </form>
    </section>
  </PreviewLayout>;
}
