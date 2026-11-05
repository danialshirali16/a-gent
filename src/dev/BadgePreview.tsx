import { AlertTriangle, Check, Clock, Plug, WifiOff } from 'lucide-react';
import { Badge, StatusDot, StatusIndicator } from '../ui/Badge';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './badge-preview.css';

const tones = ['neutral', 'success', 'warning', 'danger', 'info', 'accent', 'brand'] as const;

export function BadgePreview() {
  return <PreviewLayout title="Badge & Status indicator" description="Compact state labels and live indicators for connections, activity, devices, and runs." component="badge">
    <section className="input-preview-section" aria-labelledby="badge-tones">
      <div className="input-preview-heading"><h2 id="badge-tones">Tones</h2><p>Semantic color with a dot or icon</p></div>
      <div className="input-preview-surface badge-preview-grid">
        {tones.map(tone => <div className="badge-preview-cell" key={tone}><span className="badge-preview-label">{tone}</span><div><Badge tone={tone}>{tone === 'neutral' ? 'Draft' : tone === 'success' ? 'Connected' : tone === 'warning' ? 'Waiting' : tone === 'danger' ? 'Failed' : tone === 'info' ? 'Available' : tone === 'accent' ? 'Working' : 'A Gent'}</Badge><Badge tone={tone} dot>{tone === 'neutral' ? 'Draft' : tone === 'success' ? 'Connected' : tone === 'warning' ? 'Waiting' : tone === 'danger' ? 'Failed' : tone === 'info' ? 'Available' : tone === 'accent' ? 'Working' : 'A Gent'}</Badge></div></div>)}
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="badge-sizes">
      <div className="input-preview-heading"><h2 id="badge-sizes">Sizes and icons</h2><p>Small for dense rows; medium for settings and summaries</p></div>
      <div className="input-preview-surface badge-preview-row">
        <Badge tone="success" dot>Small</Badge>
        <Badge tone="success" dot size="md">Medium</Badge>
        <Badge tone="warning" icon={<Clock size={11} />}>Scheduled</Badge>
        <Badge tone="danger" icon={<AlertTriangle size={11} />}>Connection error</Badge>
        <Badge tone="info" icon={<Plug size={11} />}>OpenAI compatible</Badge>
        <Badge tone="neutral" icon={<WifiOff size={11} />}>Offline</Badge>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="badge-status">
      <div className="input-preview-heading"><h2 id="badge-status">Status indicators</h2><p>Visible label plus a dot; pulse only for live work</p></div>
      <div className="input-preview-surface badge-preview-status">
        <div><StatusIndicator label="Ready" tone="success" /><span>Idle session</span></div>
        <div><StatusIndicator label="Working" tone="info" pulse /><span>Active run</span></div>
        <div><StatusIndicator label="Waiting for approval" tone="warning" pulse /><span>Approval required</span></div>
        <div><StatusIndicator label="Connection lost" tone="danger" /><span>Host unreachable</span></div>
        <div><StatusDot label="Working" tone="info" pulse /><span>Dot only, accessible label</span></div>
        <div><StatusDot label="Ready" tone="success" /><span>Dot only, idle</span></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="badge-context">
      <div className="input-preview-heading"><h2 id="badge-context">In context</h2><p>Provider, schedule, device, and run states</p></div>
      <div className="input-preview-surface badge-preview-context">
        <div className="badge-preview-row"><strong>Codex</strong><Badge tone="success" dot>Connected</Badge></div>
        <div className="badge-preview-row"><strong>OpenCode</strong><Badge tone="info" dot>Available</Badge></div>
        <div className="badge-preview-row"><strong>Weekly review</strong><Badge tone="info" dot>Scheduled</Badge></div>
        <div className="badge-preview-row"><strong>Design Partner run</strong><StatusIndicator label="Working" tone="info" pulse /></div>
        <div className="badge-preview-row"><strong>This Mac</strong><Badge tone="info">Current</Badge></div>
        <div className="badge-preview-row"><strong>Old phone</strong><Badge tone="danger">Revoked</Badge></div>
      </div>
    </section>
  </PreviewLayout>;
}
