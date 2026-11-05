import { ArrowUpRight, CalendarClock, ChevronRight, Folder, MessageSquare, Plus, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, ListRow } from '../ui/Card';
import { AgentGlyph } from '../ui/Avatar';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './card-preview.css';

export function CardPreview() {
  return <PreviewLayout title="Card & List row" description="Raised surfaces for agents and schedules, and compact rows for navigation, settings, and pickers." component="card">
    <section className="input-preview-section" aria-labelledby="card-variants">
      <div className="input-preview-heading"><h2 id="card-variants">Cards</h2><p>Raised, flat, and interactive surfaces</p></div>
      <div className="card-preview-grid">
        <Card variant="raised" className="card-preview-card"><span className="card-preview-eyebrow">Raised</span><h3>Agent workspace</h3><p>Use a raised card when the content needs to sit above the page surface.</p><Button variant="secondary" size="sm">Open</Button></Card>
        <Card variant="flat" className="card-preview-card"><span className="card-preview-eyebrow">Flat</span><h3>Activity summary</h3><p>Use a flat card inside an existing raised surface to avoid stacking shadows.</p><Badge tone="success" dot>Ready</Badge></Card>
        <Card variant="interactive" className="card-preview-card" onClick={() => {}}><span className="card-preview-eyebrow">Interactive</span><h3>Design Partner</h3><p>Interactive cards respond on hover and focus, but keep the whole surface as one action.</p><span className="card-preview-link">Start a chat<ArrowUpRight size={13} /></span></Card>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="card-agent">
      <div className="input-preview-heading"><h2 id="card-agent">Agent card</h2><p>Identity, purpose, provider, and one primary action</p></div>
      <div className="card-preview-agents">
        {[{ name: 'A Gent', detail: 'Your general-purpose thinking and doing partner.', color: '#ed956c', icon: 'custom' as const, provider: 'Codex' }, { name: 'Design Partner', detail: 'Flows, interfaces, and the details that make them work.', color: '#9393ed', icon: 'design' as const, provider: 'Codex' }].map(agent => <Card as="article" variant="raised" className="card-preview-agent" key={agent.name}><div className="card-preview-agent-top"><AgentGlyph agent={agent} size={38} /><Badge tone="neutral">Codex</Badge></div><h3>{agent.name}</h3><p>{agent.detail}</p><div className="card-preview-agent-bottom"><span>{agent.provider}</span><Button variant="text" size="sm">Start a chat<ArrowUpRight size={14} /></Button></div></Card>)}
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="list-rows">
      <div className="input-preview-heading"><h2 id="list-rows">List rows</h2><p>Leading identity, two lines of copy, and a trailing action</p></div>
      <div className="input-preview-surface card-preview-list">
        <ListRow leading={<Sparkles size={16} />} primary="New conversation" secondary="Start with A Gent" trailing={<Plus size={14} />} onClick={() => {}} />
        <ListRow leading={<Folder size={16} />} primary="Product" secondary="4 conversations · Updated today" trailing={<ChevronRight size={14} />} onClick={() => {}} />
        <ListRow selected leading={<AgentGlyph agent={{ color: '#9393ed', icon: 'design' }} size={22} />} primary="Onboarding flow" secondary="Design Partner · 2 minutes ago" trailing={<Badge tone="info" dot>Active</Badge>} onClick={() => {}} />
        <ListRow leading={<MessageSquare size={16} />} primary="Weekly review" secondary="Scheduled · Tomorrow at 9:00" trailing={<Badge tone="neutral">Paused</Badge>} />
        <ListRow leading={<CalendarClock size={16} />} primary="No action row" secondary="Static rows use the same geometry without a button." />
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="list-settings">
      <div className="input-preview-heading"><h2 id="list-settings">Settings rows</h2><p>Copy on the left, control on the right</p></div>
      <div className="input-preview-surface card-preview-settings">
        <ListRow primary="Appearance" secondary="Theme and activity preferences" trailing={<Button variant="quiet" size="sm">Manage</Button>} />
        <ListRow primary="Models" secondary="Codex, OpenCode, Ollama, and compatible endpoints" trailing={<Badge tone="success" dot>2 connected</Badge>} />
        <ListRow primary="Devices" secondary="Pairing tokens for this host" trailing={<Button variant="secondary" size="sm">Review</Button>} />
      </div>
    </section>
  </PreviewLayout>;
}
