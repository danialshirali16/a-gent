import { ChevronDown, MoreHorizontal, PanelLeftOpen, PanelRightClose, PanelRightOpen, WifiOff } from 'lucide-react';
import type { Agent, Conversation } from '../../shared/types';
import { AgentGlyph, IconButton } from '../components';
import { Badge } from '../ui/Badge';

export interface TopBarProps {
  label: string;
  agent?: Agent;
  conversation?: Conversation;
  online: boolean;
  hasData: boolean;
  sidebarOpen: boolean;
  sidePanelOpen: boolean;
  onOpenSidebar: () => void;
  onToggleSidePanel: () => void;
  onOpenConversationDetails: () => void;
}

export function TopBar(props: TopBarProps) {
  return <header className="reason-topbar">
    <div className="reason-topbar-left">
      {!props.sidebarOpen && <IconButton label="Open sidebar" className="topbar-sidebar-toggle" onClick={props.onOpenSidebar}><PanelLeftOpen size={19} /></IconButton>}
    </div>
    <button className="reason-top-pill" onClick={props.onToggleSidePanel} aria-label={`Open ${props.label} details`}>
      {props.agent ? <AgentGlyph agent={props.agent} size={24} /> : null}
      <span className="reason-top-pill-label">{props.label}</span>
      <ChevronDown size={13} />
    </button>
    <div className="reason-topbar-right">
      {!props.online && props.hasData && <Badge tone="warning" icon={<WifiOff size={11} />} className="offline-indicator">Reconnecting</Badge>}
      {props.conversation && <IconButton label="Conversation details" onClick={props.onOpenConversationDetails}><MoreHorizontal size={19} /></IconButton>}
      <IconButton label={props.sidePanelOpen ? 'Close side panel' : 'Open side panel'} onClick={props.onToggleSidePanel}>{props.sidePanelOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}</IconButton>
    </div>
  </header>;
}
