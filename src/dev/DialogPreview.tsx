import { useState, type FormEvent } from 'react';
import { Archive, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog, ConfirmDialog } from '../ui/Dialog';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './dialog-preview.css';

type Demo = 'default' | 'form' | 'delete' | 'archive' | null;

export function DialogPreview() {
  const [demo, setDemo] = useState<Demo>(null);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(`Created “${name.trim()}” in this preview.`);
    setDemo(null);
    setName('');
  }

  return <PreviewLayout title="Dialog & Confirmation" description="Native modal focus handling, short descriptions, and a dedicated confirmation for destructive actions." component="dialog">
    <section className="input-preview-section" aria-labelledby="dialog-live">
      <div className="input-preview-heading"><h2 id="dialog-live">Open a dialog</h2><p>Escape closes and focus returns to the trigger</p></div>
      <div className="input-preview-surface dialog-preview-bar">
        <Button variant="secondary" onClick={() => setDemo('default')}>Default dialog</Button>
        <Button variant="primary" leadingIcon={<Plus size={14} />} onClick={() => setDemo('form')}>Form dialog</Button>
        <Button variant="danger" leadingIcon={<Trash2 size={14} />} onClick={() => setDemo('delete')}>Destructive confirmation</Button>
        <Button variant="quiet" leadingIcon={<Archive size={14} />} onClick={() => setDemo('archive')}>Reversible confirmation</Button>
      </div>
      <p className="dialog-preview-note" role="status">{saved || 'No dialog is open.'}</p>
    </section>

    <section className="input-preview-section" aria-labelledby="dialog-anatomy">
      <div className="input-preview-heading"><h2 id="dialog-anatomy">Anatomy</h2><p>One heading, a short body, and an explicit exit</p></div>
      <div className="input-preview-surface dialog-preview-anatomy">
        <div><strong>Size</strong><span>Small 420px for confirmations; default 548px; large 720px; full-window surfaces use their own layout.</span></div>
        <div><strong>Focus</strong><span>Native showModal traps focus. The first useful control receives it; Escape restores the trigger.</span></div>
        <div><strong>Confirmation</strong><span>Destructive actions name the object, explain the consequence, and focus Cancel by default.</span></div>
        <div><strong>Mobile</strong><span>Dialogs use the full width with a 12px gutter and remain scrollable at 390px.</span></div>
      </div>
    </section>

    {demo === 'default' && <Dialog title="Agent details" onClose={() => setDemo(null)} description="A short dialog for focused information or a single decision." footer={<><Button variant="quiet" onClick={() => setDemo(null)}>Close</Button><Button variant="primary" onClick={() => setDemo(null)}>Continue</Button></>}>
      <div className="dialog-preview-body"><p>Dialogs are reserved for work that needs the full attention of the current surface. Menus and popovers handle smaller, anchored choices.</p></div>
    </Dialog>}

    {demo === 'form' && <Dialog title="Create a group" onClose={() => setDemo(null)} description="Groups keep related agents together in the sidebar.">
      <form className="form-stack dialog-preview-form" onSubmit={submit}>
        <Field label="Group name" required description="You can rename this later."><Input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Product" maxLength={80} /></Field>
        <Field label="Parent"><Select defaultValue=""><option value="">No parent</option><option value="design">Design</option><option value="engineering">Engineering</option></Select></Field>
        <div className="modal-footer"><Button type="button" variant="quiet" onClick={() => setDemo(null)}>Cancel</Button><Button type="submit" variant="primary" disabled={!name.trim()}>Create group</Button></div>
      </form>
    </Dialog>}

    {demo === 'delete' && <ConfirmDialog title="Delete this group?" description={<>Agents in <strong>Product</strong> move to Unassigned. Their conversations stay in your workspace.</>} confirmLabel="Delete group" onClose={() => setDemo(null)} onConfirm={() => { setSaved('Group deleted in this preview.'); setDemo(null); }} />}

    {demo === 'archive' && <ConfirmDialog title="Archive this conversation?" description="You can restore it from Settings → Data at any time." confirmLabel="Archive conversation" tone="primary" onClose={() => setDemo(null)} onConfirm={() => { setSaved('Conversation archived in this preview.'); setDemo(null); }} />}
  </PreviewLayout>;
}
