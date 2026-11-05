import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, type ButtonVariant } from '../ui/Button';
import { PreviewLayout } from './PreviewLayout';
import './button-preview.css';

const variants: Array<{ variant: ButtonVariant; title: string; description: string; label: string }> = [
  { variant: 'primary', title: 'Primary', description: 'The main action', label: 'Continue' },
  { variant: 'secondary', title: 'Secondary', description: 'An alternative action', label: 'Add agent' },
  { variant: 'quiet', title: 'Quiet', description: 'A low-emphasis action', label: 'Cancel' },
  { variant: 'danger', title: 'Destructive', description: 'An action that removes data', label: 'Delete agent' },
  { variant: 'text', title: 'Text', description: 'An action within content', label: 'View details' },
];

export function ButtonPreview() {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('Try a button to inspect its feedback.');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function save() {
    setSaving(true); setNotice('Saving changes…');
    timer.current = setTimeout(() => { setSaving(false); setNotice('Changes saved.'); }, 1100);
  }

  return <PreviewLayout title="Button" description="Shared actions for dialogs, settings, and the workspace." component="button">
      <section className="button-preview-section" aria-labelledby="button-variants">
        <div className="button-preview-section-title"><h2 id="button-variants">Variants</h2><p>Default, disabled, and loading</p></div>
        <div className="button-preview-variants">
          <div className="button-preview-columns" aria-hidden="true"><span /><span>Default</span><span>Disabled</span><span>Loading</span></div>
          {variants.map(({ variant, title, description, label }) => <article className="button-preview-row" data-variant={variant} key={variant}>
            <div className="button-preview-description"><h3>{title}</h3><p>{description}</p></div>
            <div><Button variant={variant} onClick={() => setNotice(`${title} button pressed.`)}>{label}</Button></div>
            <div><Button variant={variant} disabled>{label}</Button></div>
            <div><Button variant={variant} loading loadingLabel={`${label}, loading`}>{label}</Button></div>
          </article>)}
        </div>
      </section>
      <div className="button-preview-details">
        <section className="button-preview-section" aria-labelledby="button-sizes">
          <div className="button-preview-section-title"><h2 id="button-sizes">Sizes</h2><p>28, 32, and 36 pixels</p></div>
          <div className="button-preview-samples">
            <Button size="sm" onClick={() => setNotice('Small button pressed.')}>Continue</Button>
            <Button onClick={() => setNotice('Default-size button pressed.')}>Continue</Button>
            <Button size="lg" onClick={() => setNotice('Large button pressed.')}>Continue</Button>
          </div>
        </section>
        <section className="button-preview-section" aria-labelledby="button-icons">
          <div className="button-preview-section-title"><h2 id="button-icons">With icons</h2><p>Leading, trailing, and icon-only</p></div>
          <div className="button-preview-samples">
            <Button leadingIcon={<Plus />} onClick={() => setNotice('Add agent pressed.')}>Add agent</Button>
            <Button variant="quiet" trailingIcon={<ArrowRight />} onClick={() => setNotice('Continue pressed.')}>Continue</Button>
            <IconButton label="Copy link" onClick={() => setNotice('Copy button pressed.')}><Copy size={16} /></IconButton>
            <IconButton label="More options" disabled><MoreHorizontal size={18} /></IconButton>
          </div>
        </section>
      </div>
      <section className="button-preview-section" aria-labelledby="button-live">
        <div className="button-preview-section-title"><h2 id="button-live">Try it</h2><p>Use Tab to check keyboard focus.</p></div>
        <div className="button-preview-live">
          <p role="status" aria-live="polite">{notice}</p>
          <div className="button-preview-samples">
            <Button variant="quiet" onClick={() => setNotice('Changes cancelled.')}>Cancel</Button>
            <Button variant="primary" loading={saving} loadingLabel="Saving changes" leadingIcon={<Check />} onClick={save}>Save changes</Button>
            <IconButton label="Delete preview" variant="danger" onClick={() => setNotice('Destructive button pressed. No data is removed in this preview.')}><Trash2 size={15} /></IconButton>
          </div>
        </div>
      </section>
  </PreviewLayout>;
}
