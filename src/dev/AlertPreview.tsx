import { Alert, useToast } from '../ui/Alert';
import { Button } from '../ui/Button';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './alert-preview.css';

export function AlertPreview() {
  const toast = useToast();
  return <PreviewLayout title="Alert & Toast" description="Inline notices for persistent context and transient toasts for action feedback." component="alert">
    <section className="input-preview-section" aria-labelledby="alert-inline">
      <div className="input-preview-heading"><h2 id="alert-inline">Inline alerts</h2><p>Danger and warning announce immediately</p></div>
      <div className="alert-preview-stack">
        <Alert tone="info" title="Local workspace">Your agents and conversations stay on this host.</Alert>
        <Alert tone="success" title="Connection restored">A Gent is receiving live updates again.</Alert>
        <Alert tone="warning" title="Reconnecting">The host is unreachable. Retrying in a few seconds.</Alert>
        <Alert tone="danger" title="Run failed">The model returned an error before finishing this reply.</Alert>
        <Alert tone="neutral" title="Preview" onDismiss={() => {}}>This notice can be dismissed without changing the workspace.</Alert>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="alert-actions">
      <div className="input-preview-heading"><h2 id="alert-actions">With an action</h2><p>One clear next step, never a dead end</p></div>
      <div className="alert-preview-stack">
        <Alert tone="warning" title="No model connected" action={<Button variant="secondary" size="sm">Open connections</Button>}>Connect a provider before starting a conversation.</Alert>
        <Alert tone="danger" title="Import failed" action={<Button variant="quiet" size="sm">Choose another file</Button>}>The selected file is not a valid A Gent export.</Alert>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="alert-toasts">
      <div className="input-preview-heading"><h2 id="alert-toasts">Toasts</h2><p>Bottom-right, auto-dismiss, pause on hover or focus</p></div>
      <div className="input-preview-surface alert-preview-toasts">
        <Button variant="secondary" onClick={() => toast({ title: 'Message copied', tone: 'success' })}>Copy success</Button>
        <Button variant="secondary" onClick={() => toast({ title: 'Code copied', description: 'Ready to paste into your editor.', tone: 'success' })}>Copy with description</Button>
        <Button variant="secondary" onClick={() => toast({ title: 'Pairing token created', description: 'Copy it now. It will not be shown again.', tone: 'info' })}>Token created</Button>
        <Button variant="danger" onClick={() => toast({ title: 'Clipboard unavailable', description: 'Copying is blocked in this environment.', tone: 'danger' })}>Show failure</Button>
        <Button variant="quiet" onClick={() => { toast({ title: 'First notice', tone: 'neutral' }); toast({ title: 'Second notice', tone: 'info' }); toast({ title: 'Third notice', tone: 'success' }); }}>Show three</Button>
      </div>
      <p className="alert-preview-note">Only the three most recent toasts remain. Each pauses its timer while hovered or focused.</p>
    </section>
  </PreviewLayout>;
}
