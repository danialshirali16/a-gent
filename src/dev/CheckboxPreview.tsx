import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Checkbox, Switch } from '../ui/Checkbox';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './checkbox-preview.css';

export function CheckboxPreview() {
  const [notify, setNotify] = useState(true);
  const [activity, setActivity] = useState(true);
  const [digest, setDigest] = useState(false);
  const [all, setAll] = useState(true);
  const [notice, setNotice] = useState('');
  const some = notify || activity || digest;
  const indeterminate = some && !all;

  function save(event: FormEvent) {
    event.preventDefault();
    setNotice(`Saved in this preview: ${[notify && 'notifications', activity && 'activity', digest && 'digest'].filter(Boolean).join(', ') || 'nothing selected'}.`);
  }

  return <PreviewLayout title="Checkbox & Switch" description="Native selection controls for preferences, confirmations, and on/off settings." component="checkbox">
    <section className="input-preview-section" aria-labelledby="checkbox-states">
      <div className="input-preview-heading"><h2 id="checkbox-states">Checkbox</h2><p>Selection with optional supporting text</p></div>
      <div className="input-preview-grid input-preview-surface checkbox-preview-grid">
        <Checkbox label="Default" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Indeterminate" indeterminate />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="With description" description="Send a notification when a reply finishes." defaultChecked />
        <Checkbox label="Invalid" aria-invalid="true" description="This choice needs attention." />
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="switch-states">
      <div className="input-preview-heading"><h2 id="switch-states">Switch</h2><p>Immediate settings toggles</p></div>
      <div className="input-preview-grid input-preview-surface checkbox-preview-grid">
        <Switch label="Off" />
        <Switch label="On" defaultChecked />
        <Switch label="Disabled" disabled />
        <Switch label="Small" controlSize="sm" defaultChecked />
        <Switch label="Show agent activity" description="See commands, file changes, and progress in conversations." checked={activity} onChange={event => setActivity(event.target.checked)} />
        <Switch label="Disabled on" description="Unavailable while the workspace is offline." defaultChecked disabled />
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="checkbox-live">
      <div className="input-preview-heading"><h2 id="checkbox-live">Try it</h2><p>Space toggles a focused control; labels are part of the hit area.</p></div>
      <form className="input-preview-surface checkbox-preview-form" onSubmit={save}>
        <div className="checkbox-preview-group">
          <Checkbox label="Select all" checked={all} indeterminate={indeterminate} onChange={event => { setAll(event.target.checked); setNotify(event.target.checked); setActivity(event.target.checked); setDigest(event.target.checked); }} />
          <div className="checkbox-preview-children">
            <Checkbox label="Reply notifications" checked={notify} onChange={event => setNotify(event.target.checked)} />
            <Checkbox label="Activity updates" checked={activity} onChange={event => setActivity(event.target.checked)} />
            <Checkbox label="Weekly digest" checked={digest} onChange={event => setDigest(event.target.checked)} />
          </div>
        </div>
        <div className="checkbox-preview-setting">
          <Switch label="Keep notifications on this device" description="Uses the host’s local notification service." defaultChecked />
        </div>
        <div className="input-preview-actions"><p role="status">{notice || 'Changes stay in this preview.'}</p><Button type="submit" variant="primary">Save preview</Button></div>
      </form>
    </section>
  </PreviewLayout>;
}
