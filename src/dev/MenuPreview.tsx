import { CalendarClock, Check, ChevronDown, Copy, MoreHorizontal, Pencil, Plug, Settings2, Trash2, UsersRound } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { ContextMenu, Menu, type MenuItem } from '../ui/Menu';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './menu-preview.css';

const workspaceItems: MenuItem[] = [
  { id: 'agents', label: 'All agents', icon: <UsersRound size={15} />, onSelect: () => {} },
  { id: 'scheduled', label: 'Scheduled', icon: <CalendarClock size={15} />, onSelect: () => {} },
  { id: 'connections', label: 'Connections', icon: <Plug size={15} />, onSelect: () => {} },
  { id: 'settings', label: 'Settings', icon: <Settings2 size={15} />, shortcut: '⌘,', onSelect: () => {} },
  { id: 'collapse', label: 'Collapse sidebar', separatorBefore: true, onSelect: () => {} },
];

const groupItems: MenuItem[] = [
  { id: 'rename', label: 'Rename group', icon: <Pencil size={13} />, onSelect: () => {} },
  { id: 'archive', label: 'Archive group', icon: <Check size={13} />, disabled: true, onSelect: () => {} },
  { id: 'delete', label: 'Delete group', icon: <Trash2 size={13} />, danger: true, separatorBefore: true, onSelect: () => {} },
];

const messageItems: MenuItem[] = [
  { id: 'copy', label: 'Copy message', icon: <Copy size={13} />, shortcut: '⌘C', onSelect: () => {} },
  { id: 'details', label: 'Conversation details', icon: <MoreHorizontal size={13} />, separatorBefore: true, onSelect: () => {} },
];

export function MenuPreview() {
  return <PreviewLayout title="Dropdown & Context menu" description="Anchored actions for workspaces, agents, groups, and messages with full keyboard navigation." component="menu">
    <section className="input-preview-section" aria-labelledby="menu-dropdown">
      <div className="input-preview-heading"><h2 id="menu-dropdown">Dropdown menus</h2><p>Open from a compact trigger; Escape returns focus</p></div>
      <div className="input-preview-surface menu-preview-bar">
        <Menu trigger={<Button variant="secondary" trailingIcon={<ChevronDown size={13} />}>Workspace</Button>} items={workspaceItems} label="Workspace options" />
        <Menu trigger={<IconButton label="Group options"><MoreHorizontal size={17} /></IconButton>} items={groupItems} label="Group options" align="end" />
        <Menu trigger={<Button variant="quiet">Message actions</Button>} items={messageItems} label="Message actions" side="top" />
        <span className="menu-preview-hint">Try Arrow keys, Home, End, Enter, and Escape.</span>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="menu-context">
      <div className="input-preview-heading"><h2 id="menu-context">Context menu</h2><p>Right-click the card, or use the keyboard menu key</p></div>
      <ContextMenu items={messageItems} label="Message actions">
        <article className="menu-preview-card" tabIndex={0}>
          <div className="menu-preview-card-head"><strong>Design Partner</strong><span>2 minutes ago</span></div>
          <p>Here’s a first pass at the onboarding flow. I kept the empty state quiet and put the primary action in the composer.</p>
          <span className="menu-preview-card-hint">Right-click for actions</span>
        </article>
      </ContextMenu>
    </section>

    <section className="input-preview-section" aria-labelledby="menu-anatomy">
      <div className="input-preview-heading"><h2 id="menu-anatomy">Item anatomy</h2><p>Icon, label, shortcut, destructive tone, and separators</p></div>
      <div className="input-preview-surface menu-preview-anatomy">
        <div className="menu-preview-anatomy-row"><span><Copy size={13} />Copy message</span><kbd>⌘C</kbd></div>
        <div className="menu-preview-anatomy-row"><span><Pencil size={13} />Rename group</span></div>
        <div className="menu-preview-anatomy-row is-disabled"><span><Check size={13} />Archive group</span><small>Disabled</small></div>
        <div className="menu-preview-divider" />
        <div className="menu-preview-anatomy-row is-danger"><span><Trash2 size={13} />Delete group</span></div>
      </div>
    </section>
  </PreviewLayout>;
}
