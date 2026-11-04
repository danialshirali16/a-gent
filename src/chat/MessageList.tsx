import { Fragment, useState, type ReactNode } from 'react';
import { AlertCircle, Check, Copy, Paperclip, Terminal } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, Run } from '../../shared/types';
import { ToolStream } from './ToolStream';

export interface MessageListProps {
  messages: Message[];
  currentRun?: Run;
  toolStreamView: 'verbose' | 'compact' | 'hidden';
  copied: string;
  runError?: string;
  onCopy: (content: string, id: string) => void;
  onApproval: (id: string, accept: boolean) => void;
}

function nodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (node && typeof node === 'object' && 'props' in node) return nodeText((node as { props?: { children?: ReactNode } }).props?.children);
  return '';
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = nodeText(children);
  return <div className="reason-code-block">
    <button title="Copy code" aria-label="Copy code" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard optional */ } }}>{copied ? <Check size={13} /> : <Copy size={13} />}</button>
    <pre>{children}</pre>
  </div>;
}

function divider(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
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

export function MessageList(props: MessageListProps) {
  const pending = props.currentRun?.approvals.filter(approval => approval.status === 'pending') || [];
  let previousDay = '';

  return <div className="reason-messages">
    {props.messages.map(message => {
      const day = new Date(message.createdAt).toDateString();
      const showDivider = day !== previousDay;
      previousDay = day;
      const activities = message.role === 'assistant'
        ? (props.currentRun?.messageId === message.id ? props.currentRun.activities : message.activities || [])
        : [];

      return <Fragment key={message.id}>
        {showDivider && <div className="reason-date-divider">{divider(message.createdAt)}</div>}
        {message.role === 'system'
          ? <div className="reason-system-event">{message.content}</div>
          : <article className={`reason-message reason-message-${message.role}`}>
            {message.role === 'assistant' && props.toolStreamView !== 'hidden' && <ToolStream activities={activities} forceOpen={props.toolStreamView === 'verbose'} />}
            <div className="reason-bubble" aria-live={message.status === 'streaming' ? 'polite' : undefined} aria-busy={message.status === 'streaming' || undefined}>
              <MessageBody message={message} />
              <Attachments message={message} />
              {message.status === 'failed' && <p className="reason-message-status is-error">This reply could not be completed. Check the activity log or your connection.</p>}
              {message.status === 'interrupted' && <p className="reason-message-status">Stopped by you</p>}
            </div>
            {message.content && <div className="reason-message-actions">
              <button title="Copy message" aria-label="Copy message" onClick={() => props.onCopy(message.content, message.id)}>{props.copied === message.id ? <Check size={13} /> : <Copy size={13} />}</button>
            </div>}
          </article>}
      </Fragment>;
    })}
    {pending.map(approval => <div className="reason-approval" key={approval.id}>
      <div className="reason-approval-head"><Terminal size={16} /><h3>{approval.title}</h3></div>
      <p>{approval.description}</p>
      {approval.command && <pre>{approval.command}</pre>}
      <div className="reason-approval-actions">
        <button className="button quiet small" onClick={() => props.onApproval(approval.id, false)}>Decline</button>
        <button className="button primary small" onClick={() => props.onApproval(approval.id, true)}>Allow this action</button>
      </div>
    </div>)}
    {props.runError && <div className="reason-run-error" role="alert"><AlertCircle size={15} /><span>{props.runError}</span></div>}
  </div>;
}
