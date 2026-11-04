import { ChevronDown, MoreHorizontal, PanelLeftOpen, PanelRightClose, PanelRightOpen, WifiOff, X } from 'lucide-react';
import type { Agent, Conversation } from '../../shared/types';
import { AgentGlyph, IconButton, Mark } from '../components';

export interface TopBarProps {
  label: string;
  agent?: Agent;
  conversation?: Conversation;
  isChat: boolean;
  online: boolean;
  hasData: boolean;
  sidebarOpen: boolean;
  sidePanelOpen: boolean;
  onOpenSidebar: () => void;
  onToggleSidePanel: () => void;
  onOpenConversationDetails: () => void;
  onBackToChat: () => void;
}

export function TopBar(props: TopBarProps) {
  return <header className="reason-topbar">
    <div className="reason-topbar-left">
      {!props.sidebarOpen && <IconButton label="Open sidebar" onClick={props.onOpenSidebar}><PanelLeftOpen size={19} /></IconButton>}
    </div>
    <button className="reason-top-pill" onClick={props.isChat ? props.onToggleSidePanel : props.onBackToChat} aria-label={props.isChat ? `Open ${props.label} details` : 'Back to conversation'}>
      {props.isChat && props.agent ? <AgentGlyph agent={props.agent} size={24} /> : <Mark size={24} />}
      <span>{props.label}</span>
      {props.isChat && <ChevronDown size={13} />}
    </button>
    <div className="reason-topbar-right">
      {!props.online && props.hasData && <span className="offline-indicator" title="Reconnecting to your host"><WifiOff size={14} /><span>Reconnecting</span></span>}
      {props.isChat ? <>
        {props.conversation && <IconButton label="Conversation details" onClick={props.onOpenConversationDetails}><MoreHorizontal size={19} /></IconButton>}
        <IconButton label={props.sidePanelOpen ? 'Close side panel' : 'Open side panel'} onClick={props.onToggleSidePanel}>{props.sidePanelOpen ? <PanelRightClose size={19} /> : <PanelRightOpen size={19} />}</IconButton>
      </> : <IconButton label="Close" onClick={props.onBackToChat}><X size={18} /></IconButton>}
    </div>
  </header>;
}
