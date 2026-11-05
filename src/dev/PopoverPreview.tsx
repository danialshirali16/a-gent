import { useRef, useState } from 'react';
import { ChevronDown, Filter, Plus, Send, Sparkles } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { Switch } from '../ui/Checkbox';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './popover-preview.css';

export function PopoverPreview() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [activity, setActivity] = useState(true);
  const [archived, setArchived] = useState(false);
  const [note, setNote] = useState('');
  const filtersRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);

  return <PreviewLayout title="Popover" description="Anchored panels for composer actions, filters, and quick choices without leaving the current surface." component="popover">
    <section className="input-preview-section" aria-labelledby="popover-basic">
      <div className="input-preview-heading"><h2 id="popover-basic">Anchored panels</h2><p>Click to open; Escape or outside click closes</p></div>
      <div className="input-preview-surface popover-preview-bar">
        <div className="popover-preview-anchor" ref={filtersRef}>
          <Button variant="secondary" leadingIcon={<Filter size={14} />} trailingIcon={<ChevronDown size={13} />} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}>Filters</Button>
          <Popover open={filtersOpen} onClose={() => setFiltersOpen(false)} anchorRef={filtersRef} label="Conversation filters">
            <div className="popover-preview-panel">
              <div className="popover-preview-head"><strong>Conversation filters</strong><span>Applies to this list</span></div>
              <Switch label="Show activity" description="Include tool and file events." checked={activity} onChange={event => setActivity(event.target.checked)} />
              <Switch label="Include archived" description="Show conversations you archived." checked={archived} onChange={event => setArchived(event.target.checked)} />
              <div className="popover-preview-actions"><Button variant="quiet" size="sm" onClick={() => { setActivity(true); setArchived(false); }}>Reset</Button><Button variant="primary" size="sm" onClick={() => setFiltersOpen(false)}>Apply</Button></div>
            </div>
          </Popover>
        </div>

        <div className="popover-preview-anchor" ref={agentsRef}>
          <Button variant="quiet" leadingIcon={<Sparkles size={14} />} trailingIcon={<ChevronDown size={13} />} aria-expanded={agentsOpen} onClick={() => setAgentsOpen(value => !value)}>Choose an agent</Button>
          <Popover open={agentsOpen} onClose={() => setAgentsOpen(false)} anchorRef={agentsRef} label="Choose an agent" width={280} initialFocusSelector=".popover-preview-agent">
            <div className="popover-preview-panel">
              <div className="popover-preview-head"><strong>Start with</strong><span>3 agents</span></div>
              {[{ name: 'A Gent', detail: 'General thinking and doing', color: '#ed956c' }, { name: 'Design Partner', detail: 'Flows, interfaces, and details', color: '#9393ed' }, { name: 'Software Engineer', detail: 'Build, debug, and understand code', color: '#5ab9a0' }].map(agent => <button key={agent.name} className="popover-preview-agent" onClick={() => setAgentsOpen(false)}><span style={{ background: agent.color }} aria-hidden="true" /><span><strong>{agent.name}</strong><small>{agent.detail}</small></span></button>)}
            </div>
          </Popover>
        </div>

        <div className="popover-preview-anchor" ref={noteRef}>
          <IconButton label="Quick note" onClick={() => setNoteOpen(value => !value)}><Plus size={18} /></IconButton>
          <Popover open={noteOpen} onClose={() => setNoteOpen(false)} anchorRef={noteRef} label="Quick note" side="top" width={320}>
            <div className="popover-preview-panel">
              <div className="popover-preview-head"><strong>Quick note</strong><span>Stays in this preview</span></div>
              <textarea className="text-control text-area" rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Capture a thought before you forget it…" aria-label="Quick note" />
              <div className="popover-preview-actions"><Button variant="quiet" size="sm" onClick={() => setNoteOpen(false)}>Cancel</Button><Button variant="primary" size="sm" disabled={!note.trim()} onClick={() => setNoteOpen(false)}><Send size={13} />Save note</Button></div>
            </div>
          </Popover>
        </div>
      </div>
      <p className="popover-preview-note">The filters and agent pickers open below their trigger; the note opens above. The panel is repositioned to stay inside the viewport.</p>
    </section>

    <section className="input-preview-section" aria-labelledby="popover-anatomy">
      <div className="input-preview-heading"><h2 id="popover-anatomy">Anatomy</h2><p>One surface, a short heading, and a clear exit</p></div>
      <div className="input-preview-surface popover-preview-anatomy">
        <div><strong>Surface</strong><span>14px radius, raised background, menu shadow, 8px padding.</span></div>
        <div><strong>Placement</strong><span>Start, center, or end alignment; top or bottom side.</span></div>
        <div><strong>Focus</strong><span>First useful control receives focus. Escape returns to the trigger.</span></div>
        <div><strong>Dismissal</strong><span>Outside pointer, Escape, resize, or scroll.</span></div>
      </div>
    </section>
  </PreviewLayout>;
}
