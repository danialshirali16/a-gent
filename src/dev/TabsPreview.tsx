import { useState } from 'react';
import { LayoutDashboard, ListChecks, Settings2, SlidersHorizontal } from 'lucide-react';
import { SegmentedControl, Tabs } from '../ui/Tabs';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './tabs-preview.css';

const panels = {
  session: { title: 'Session', body: 'The active conversation, model, workspace, and run status.' },
  files: { title: 'Files', body: 'A read-only tree of the project folder connected to this conversation.' },
  activity: { title: 'Activity', body: 'Commands, file changes, and tool calls from the current run.' },
};

export function TabsPreview() {
  const [tab, setTab] = useState('session');
  const [pill, setPill] = useState('session');
  const [theme, setTheme] = useState('dark');
  const [filter, setFilter] = useState('all');

  return <PreviewLayout title="Tabs & Segmented control" description="Underline tabs for sections, pill tabs for dense panels, and segmented controls for immediate choices." component="tabs">
    <section className="input-preview-section" aria-labelledby="tabs-underline">
      <div className="input-preview-heading"><h2 id="tabs-underline">Underline tabs</h2><p>Arrow keys move focus and activate the next section</p></div>
      <div className="input-preview-surface tabs-preview-surface">
        <Tabs items={[{ id: 'session', label: 'Session' }, { id: 'files', label: 'Files', count: 3 }, { id: 'activity', label: 'Activity' }]} value={tab} onChange={setTab} ariaLabel="Session sections" idPrefix="preview" panelId={`preview-panel-${tab}`} />
        <div className="tabs-preview-panel" id={`preview-panel-${tab}`} role="tabpanel" aria-labelledby={`preview-tab-${tab}`} tabIndex={0}>
          <h3>{panels[tab as keyof typeof panels].title}</h3>
          <p>{panels[tab as keyof typeof panels].body}</p>
        </div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="tabs-pill">
      <div className="input-preview-heading"><h2 id="tabs-pill">Pill tabs</h2><p>Dense sections in a side panel header</p></div>
      <div className="input-preview-surface tabs-preview-pillbar">
        <Tabs items={[{ id: 'session', label: 'Session' }, { id: 'sessions', label: 'Sessions' }, { id: 'files', label: 'Files' }, { id: 'terminal', label: 'Terminal' }, { id: 'activity', label: 'Activity' }, { id: 'approvals', label: 'Approvals', count: 2 }]} value={pill} onChange={setPill} ariaLabel="Panel sections" variant="pill" idPrefix="pill" />
      </div>
      <p className="tabs-preview-note">Active section: <strong>{pill}</strong></p>
    </section>

    <section className="input-preview-section" aria-labelledby="tabs-segmented">
      <div className="input-preview-heading"><h2 id="tabs-segmented">Segmented control</h2><p>Immediate single-choice settings</p></div>
      <div className="tabs-preview-segmented-grid">
        <div className="input-preview-surface tabs-preview-card">
          <span className="tabs-preview-label">Theme</span>
          <SegmentedControl options={[{ id: 'dark', label: 'Dark', icon: <SlidersHorizontal size={14} /> }, { id: 'light', label: 'Light', icon: <LayoutDashboard size={14} /> }, { id: 'system', label: 'System', icon: <Settings2 size={14} /> }]} value={theme} onChange={setTheme} ariaLabel="Theme" />
          <p>Selected: <strong>{theme}</strong></p>
        </div>
        <div className="input-preview-surface tabs-preview-card">
          <span className="tabs-preview-label">Connections</span>
          <Tabs variant="segmented" size="sm" items={[{ id: 'all', label: 'All' }, { id: 'models', label: 'Models' }, { id: 'apps', label: 'Apps' }, { id: 'host', label: 'Host' }]} value={filter} onChange={setFilter} ariaLabel="Connection categories" />
          <p>Filtering: <strong>{filter}</strong></p>
        </div>
        <div className="input-preview-surface tabs-preview-card">
          <span className="tabs-preview-label">Disabled</span>
          <SegmentedControl options={[{ id: 'compact', label: 'Compact' }, { id: 'verbose', label: 'Verbose' }]} value="" onChange={() => {}} ariaLabel="Tool stream detail" disabled />
          <p>Activity is hidden.</p>
        </div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="tabs-icons">
      <div className="input-preview-heading"><h2 id="tabs-icons">With icons</h2><p>Icons remain decorative; labels carry the meaning</p></div>
      <div className="input-preview-surface tabs-preview-icons">
        <Tabs items={[{ id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> }, { id: 'checks', label: 'Checks', icon: <ListChecks size={14} /> }, { id: 'settings', label: 'Settings', icon: <Settings2 size={14} /> }]} value={tab === 'files' ? 'checks' : 'overview'} onChange={() => {}} ariaLabel="Workspace sections" idPrefix="icons" />
      </div>
    </section>
  </PreviewLayout>;
}
