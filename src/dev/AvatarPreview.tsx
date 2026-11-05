import { useMemo, useState } from 'react';
import type { BotAvatarState } from 'bot-avatars';
import type { Agent, IconName } from '../../shared/types';
import { agentAvatarLabels, agentAvatarTypes, legacyAvatarTypeByIcon, type AgentAvatarType } from '../../shared/agentAvatars';
import { AgentGlyph, AgentMark, Avatar } from '../ui/Avatar';
import { AvatarPicker } from '../ui/AvatarPicker';
import { Badge } from '../ui/Badge';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './avatar-preview.css';

const primary: Agent = { id: 'preview-primary', name: 'A Gent', description: 'Your general-purpose partner.', instructions: '', color: '#f39161', icon: 'spark', avatarType: 'star', providerId: 'codex', modelId: '', reasoningEffort: 'medium', createdAt: new Date().toISOString() };
const design: Agent = { ...primary, id: 'preview-design', name: 'Design Partner', color: '#9393ed', icon: 'design', avatarType: 'flower' };
const states: Array<{ id: BotAvatarState; label: string }> = [{ id: 'default', label: 'Idle' }, { id: 'working', label: 'Working' }, { id: 'sleeping', label: 'Sleeping' }];
const colors = ['#f39161', '#9393ed', '#5ab9a0', '#70aee0', '#d980a8'];

function StressRoster() {
  const agents = useMemo(() => Array.from({ length: 500 }, (_, index) => ({ ...primary, id: `stress-${index}`, name: `Agent ${String(index + 1).padStart(3, '0')}`, color: colors[index % colors.length], avatarType: agentAvatarTypes[index % agentAvatarTypes.length] })), []);
  return <PreviewLayout title="Avatar roster stress test" description="Five hundred full-motion agents in a scrolling roster; offscreen avatars defer canvas mounting and animation." component="avatar">
    <section className="input-preview-section" aria-labelledby="avatar-stress">
      <div className="input-preview-heading"><h2 id="avatar-stress">500-agent roster</h2><p>Scroll the roster; only near-viewport avatars mount canvases</p></div>
      <div className="input-preview-surface avatar-stress-shell">
        <div className="avatar-stress-scroll" id="avatar-stress-scroll">
          {agents.map(agent => <div className="avatar-stress-row" key={agent.id}><AgentGlyph agent={agent} size={28} /><span><strong>{agent.name}</strong><small>{agentAvatarLabels[agent.avatarType!]} · plastic · full motion</small></span></div>)}
        </div>
      </div>
    </section>
  </PreviewLayout>;
}

export function AvatarPreview() {
  const [shape, setShape] = useState<AgentAvatarType>('star');
  const [color, setColor] = useState('#f39161');
  if (new URLSearchParams(location.search).get('stress') === '1') return <StressRoster />;

  return <PreviewLayout title="Avatar & Agent mark" description="Glossy plastic bots with living faces, eighteen shapes, agent colors, activity states, and the A Gent brand mark." component="avatar">
    <section className="input-preview-section" aria-labelledby="avatar-hero">
      <div className="input-preview-heading"><h2 id="avatar-hero">Agent avatar</h2><p>Full motion: idle glances, hops, pointer-following, and click reactions</p></div>
      <div className="input-preview-surface avatar-preview-hero">
        <Avatar agent={primary} size={96} />
        <div className="avatar-preview-hero-copy"><strong>{primary.name}</strong><span>Star body · Star is the deterministic fallback for the legacy spark icon.</span><Badge tone="brand">A Gent</Badge></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-sizes">
      <div className="input-preview-heading"><h2 id="avatar-sizes">Sizes</h2><p>18, 24, 28, 40, and 52 pixels</p></div>
      <div className="input-preview-surface avatar-preview-row">
        <Avatar agent={design} size="xs" />
        <Avatar agent={design} size="sm" />
        <Avatar agent={design} size="md" />
        <Avatar agent={design} size="lg" />
        <Avatar agent={design} size="xl" />
        <span className="avatar-preview-caption">xs · sm · md · lg · xl</span>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-shapes">
      <div className="input-preview-heading"><h2 id="avatar-shapes">Eighteen shapes</h2><p>Static poses for the shape catalog; the selected preview moves</p></div>
      <div className="input-preview-surface avatar-preview-shapes">
        {agentAvatarTypes.map(type => <div className="avatar-preview-shape" key={type}><Avatar agent={{ ...design, avatarType: type }} size={48} motion="static" /><span>{agentAvatarLabels[type]}</span><small>{type}</small></div>)}
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-colors">
      <div className="input-preview-heading"><h2 id="avatar-colors">Agent colors</h2><p>Plastic shading at brightness 1 and saturation 1</p></div>
      <div className="input-preview-surface avatar-preview-row">
        {colors.map((value, index) => <Avatar key={value} agent={{ ...design, color: value, avatarType: agentAvatarTypes[index + 3] }} size={52} motion="static" label={`${agentAvatarLabels[agentAvatarTypes[index + 3]]} in ${value}`} />)}
        <span className="avatar-preview-caption">The selected color belongs to the agent, not the shape.</span>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-states">
      <div className="input-preview-heading"><h2 id="avatar-states">Activity</h2><p>Running works; approval waits in the default pose; archived agents sleep</p></div>
      <div className="input-preview-surface avatar-preview-states">
        {states.map(item => <div key={item.id}><Avatar agent={design} size={60} state={item.id} /><strong>{item.label}</strong><small>{item.id}</small></div>)}
        <div><Avatar agent={design} size={60} status="working" /><strong>Working signal</strong><small>status dot + working pose</small></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-picker-live">
      <div className="input-preview-heading"><h2 id="avatar-picker-live">Shape picker</h2><p>Three columns on narrow screens; Done, Enter, or Escape closes</p></div>
      <div className="input-preview-surface avatar-preview-picker">
        <AvatarPicker value={shape} onChange={setShape} color={color} icon="custom" name="Preview agent" />
        <div className="avatar-picker-colors" role="group" aria-label="Preview color">{colors.map(value => <button key={value} type="button" style={{ background: value }} className={color === value ? 'is-selected' : ''} aria-label={`Use ${value}`} aria-pressed={color === value} onClick={() => setColor(value)} />)}</div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-legacy">
      <div className="input-preview-heading"><h2 id="avatar-legacy">Legacy icon mapping</h2><p>Missing shapes resolve independently from the saved icon</p></div>
      <div className="input-preview-surface avatar-preview-legacy">
        {(Object.keys(legacyAvatarTypeByIcon) as IconName[]).map(icon => <div key={icon}><Avatar agent={{ ...design, icon, avatarType: undefined }} size={40} motion="static" /><strong>{icon}</strong><small>→ {legacyAvatarTypeByIcon[icon]}</small></div>)}
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-brand">
      <div className="input-preview-heading"><h2 id="avatar-brand">A Gent brand mark</h2><p>Reserved for product branding, not the primary agent avatar</p></div>
      <div className="input-preview-surface avatar-preview-row">
        <AgentMark size={18} className="agent-mark" />
        <AgentMark size={24} className="agent-mark" />
        <AgentMark size={28} className="agent-mark" />
        <AgentMark size={40} className="agent-mark" />
        <AgentMark size={52} className="agent-mark" />
        <span className="avatar-preview-caption">Primary agents now use their bot body, like every other agent.</span>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="avatar-context">
      <div className="input-preview-heading"><h2 id="avatar-context">In context</h2><p>Sidebar rows, the header pill, search results, and sessions</p></div>
      <div className="input-preview-surface avatar-preview-context">
        <div className="avatar-preview-row-item"><AgentGlyph agent={primary} size={28} /><span><strong>A Gent</strong><small>A Gent is ready.</small></span></div>
        <div className="avatar-preview-row-item"><AgentGlyph agent={design} size={28} /><span><strong>Design Partner</strong><small>Working on the onboarding flow…</small></span><Badge tone="info" dot>Working</Badge></div>
        <div className="avatar-preview-row-item"><Avatar agent={design} size="sm" /><span><strong>Design Partner</strong><small>Search result leading avatar</small></span></div>
      </div>
    </section>
  </PreviewLayout>;
}
