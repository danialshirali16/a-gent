import { Copy, MoreHorizontal, PanelLeftClose, Plus, Search, Settings2, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './tooltip-preview.css';

export function TooltipPreview() {
  return <PreviewLayout title="Tooltip" description="Small supplementary labels for compact icon actions and keyboard shortcuts." component="tooltip">
    <section className="input-preview-section" aria-labelledby="tooltip-icons">
      <div className="input-preview-heading"><h2 id="tooltip-icons">Icon actions</h2><p>Hover or focus; Escape dismisses</p></div>
      <div className="input-preview-surface tooltip-preview-bar">
        <IconButton label="Collapse sidebar"><PanelLeftClose size={18} /></IconButton>
        <IconButton label="Search conversations" shortcut="⌘K"><Search size={18} /></IconButton>
        <IconButton label="New conversation" shortcut="⌘N"><Plus size={18} /></IconButton>
        <IconButton label="More workspace options"><Settings2 size={18} /></IconButton>
        <IconButton label="Delete conversation" tooltip="Delete this conversation"><Trash2 size={18} /></IconButton>
        <IconButton label="Copy message" tooltip={false}><Copy size={18} /></IconButton>
      </div>
      <p className="tooltip-preview-note">The last button opts out and keeps a native title. All others use the shared tooltip.</p>
    </section>

    <section className="input-preview-section" aria-labelledby="tooltip-content">
      <div className="input-preview-heading"><h2 id="tooltip-content">Content and placement</h2><p>Labels can be longer; shortcuts use a separate keycap</p></div>
      <div className="tooltip-preview-grid">
        <div className="input-preview-surface tooltip-preview-card">
          <span className="tooltip-preview-label">Top</span>
          <Tooltip label="Open side panel" shortcut="⌘\"><Button variant="secondary"><MoreHorizontal size={15} />Open panel</Button></Tooltip>
        </div>
        <div className="input-preview-surface tooltip-preview-card">
          <span className="tooltip-preview-label">Bottom</span>
          <Tooltip label="Save this agent and return to the conversation" side="bottom"><Button variant="primary">Save agent</Button></Tooltip>
        </div>
        <div className="input-preview-surface tooltip-preview-card">
          <span className="tooltip-preview-label">Text action</span>
          <Tooltip label="Copy the whole message as Markdown" shortcut="⌘C"><Button variant="text">Copy message</Button></Tooltip>
        </div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="tooltip-usage">
      <div className="input-preview-heading"><h2 id="tooltip-usage">Usage</h2><p>Supplementary, never the only label</p></div>
      <div className="input-preview-surface tooltip-preview-usage">
        <p><strong>Do</strong> use a tooltip to clarify a compact icon action or expose a shortcut. The control keeps its own accessible name.</p>
        <p><strong>Don’t</strong> hide required information in a tooltip. Touch users get the same action through the button’s accessible name.</p>
      </div>
    </section>
  </PreviewLayout>;
}
