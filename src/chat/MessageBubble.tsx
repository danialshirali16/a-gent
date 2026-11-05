import { useState, type ReactNode } from 'react';
import { Check, Copy, MessageSquare, MoreHorizontal, Paperclip } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Activity, Message } from '../../shared/types';
import { IconButton } from '../ui/Button';
import { ContextMenu, Menu, type MenuItem } from '../ui/Menu';
import { useToast } from '../ui/Alert';
import { ToolStream } from './ToolStream';

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (node && typeof node === 'object' && 'props' in node) return nodeText((node as { props?: { children?: ReactNode } }).props?.children);
  return '';
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const text = nodeText(children);
  return <div className="reason-code-block">
    <button title="Copy code" aria-label="Copy code" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); toast({ title: 'Code copied', tone: 'success' }); } catch { toast({ title: 'Clipboard unavailable', tone: 'danger' }); } }}>{copied ? <Check size={13} /> : <Copy size={13} />}</button>
    <pre>{children}</pre>
  </div>;
}

function Attachments({ message }: { message: Message }) {
  if (!message.attachments?.length) return null;
  return <>{message.attachments.map(file => <div className="reason-message-attachment" key={file.id}><Paperclip size={12} /><span>{file.name}</span></div>)}</>;
}

function MessageBody({ message }: { message: Message }) {
  if (message.content) return <div className="markdown">
    <Markdown remarkPlugins={[remarkGfm]} components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>, pre: ({ children }) => <CodeBlock>{children}</CodeBlock> }}>{message.content}</Markdown>
  </div>;
  if (message.status === 'streaming') return <div className="thinking"><span /><span /><span /><span className="sr-only">Agent is working</span></div>;
  return null;
}

export interface MessageBubbleProps {
  message: Message;
  activities?: Activity[];
  toolStreamView: 'verbose' | 'compact' | 'hidden';
  copied?: boolean;
  onCopy: (content: string, id: string) => void;
  onOpenDetails?: () => void;
}

export function MessageBubble({ message, activities = [], toolStreamView, copied = false, onCopy, onOpenDetails }: MessageBubbleProps) {
  const actions: MenuItem[] = [
    { id: 'copy', label: 'Copy message', icon: <Copy size={13} />, shortcut: '⌘C', disabled: !message.content, onSelect: () => onCopy(message.content, message.id) },
    ...(onOpenDetails ? [{ id: 'details', label: 'Conversation details', icon: <MessageSquare size={13} />, separatorBefore: true, onSelect: onOpenDetails }] : []),
  ];

  return <ContextMenu label="Message actions" items={actions}>
    <article className={`reason-message reason-message-${message.role}`}>
      {message.role === 'assistant' && toolStreamView !== 'hidden' && <ToolStream activities={activities} forceOpen={toolStreamView === 'verbose'} />}
      <div className="reason-bubble" aria-live={message.status === 'streaming' ? 'polite' : undefined} aria-busy={message.status === 'streaming' || undefined}>
        <MessageBody message={message} />
        <Attachments message={message} />
        {message.status === 'failed' && <p className="reason-message-status is-error">This reply could not be completed. Check the activity log or your connection.</p>}
        {message.status === 'interrupted' && <p className="reason-message-status">Stopped by you</p>}
      </div>
      {message.content && <div className="reason-message-actions">
        <IconButton label="Copy message" tooltip="Copy message" onClick={() => onCopy(message.content, message.id)}>{copied ? <Check size={13} /> : <Copy size={13} />}</IconButton>
        <Menu trigger={<IconButton label="More message actions"><MoreHorizontal size={14} /></IconButton>} label="Message actions" align={message.role === 'user' ? 'end' : 'start'} items={actions} />
      </div>}
    </article>
  </ContextMenu>;
}
