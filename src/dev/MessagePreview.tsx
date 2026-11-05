import { useState } from 'react';
import type { Activity, Approval, Message } from '../../shared/types';
import { ApprovalCard } from '../chat/ApprovalCard';
import { DateDivider, SystemEvent } from '../chat/DateDivider';
import { MessageBubble } from '../chat/MessageBubble';
import { ToolStream } from '../chat/ToolStream';
import { useToast } from '../ui/Alert';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './message-preview.css';

const now = new Date();
const messages: Message[] = [
  { id: 'user-1', role: 'user', content: 'Can you review the onboarding flow and suggest a quieter empty state?', createdAt: new Date(now.getTime() - 1000 * 60 * 8).toISOString(), status: 'completed' },
  { id: 'assistant-1', role: 'assistant', content: 'I’d keep the empty state to one sentence and one action.\n\n- Lead with what the workspace is for.\n- Put the primary action in the composer.\n- Use the starters only when there is no history.\n\n```tsx\n<EmptyState title="A place to think clearly" />\n```', createdAt: new Date(now.getTime() - 1000 * 60 * 7).toISOString(), status: 'completed', activities: [{ id: 'a1', kind: 'file', title: 'Read onboarding-flow.tsx', status: 'completed', createdAt: now.toISOString() }, { id: 'a2', kind: 'thinking', title: 'Compared empty-state patterns', status: 'completed', createdAt: now.toISOString() }] },
  { id: 'system-1', role: 'system', content: 'Model changed to Codex · GPT-5.2 Codex', createdAt: new Date(now.getTime() - 1000 * 60 * 6).toISOString() },
  { id: 'user-2', role: 'user', content: 'Make the first pass in the project.', createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(), status: 'completed', attachments: [{ id: 'f1', name: 'onboarding-brief.md', type: 'text/markdown', content: '# Brief' }] },
  { id: 'assistant-2', role: 'assistant', content: '', createdAt: new Date(now.getTime() - 1000 * 60 * 4).toISOString(), status: 'streaming' },
  { id: 'assistant-3', role: 'assistant', content: 'The previous reply could not be completed.', createdAt: new Date(now.getTime() - 1000 * 60 * 3).toISOString(), status: 'failed' },
];

const activities: Activity[] = [
  { id: 'a1', kind: 'thinking', title: 'Reading the onboarding brief', status: 'completed', createdAt: now.toISOString() },
  { id: 'a2', kind: 'command', title: 'npm run typecheck', detail: 'tsc --noEmit', status: 'completed', createdAt: now.toISOString() },
  { id: 'a3', kind: 'file', title: 'Updated src/onboarding/EmptyState.tsx', status: 'running', createdAt: now.toISOString() },
];

const approval: Approval = { id: 'approval-1', runId: 'run-1', conversationId: 'conversation-1', title: 'Allow a file change?', description: 'Design Partner wants to update the onboarding empty state.', command: 'src/onboarding/EmptyState.tsx', status: 'pending' };

export function MessagePreview() {
  const toast = useToast();
  const [notice, setNotice] = useState('');

  return <PreviewLayout title="Message & Tool activity" description="Bubbles, date separators, system events, streamed tool activity, approvals, and message actions." component="message">
    <section className="input-preview-section" aria-labelledby="message-thread">
      <div className="input-preview-heading"><h2 id="message-thread">Conversation</h2><p>Bubbles cap at 760px; actions appear on hover or focus</p></div>
      <div className="message-preview-stage">
        <DateDivider value={messages[0].createdAt} />
        {messages.map(message => message.role === 'system'
          ? <SystemEvent key={message.id}>{message.content}</SystemEvent>
          : <MessageBubble key={message.id} message={message} activities={message.id === 'assistant-1' ? activities.slice(0, 2) : []} toolStreamView="compact" onCopy={(content, id) => { toast({ title: 'Message copied', tone: 'success' }); setNotice(`Copied ${id}.`); }} onOpenDetails={() => setNotice('Conversation details would open here.')} />)}
      </div>
      <p className="message-preview-note" role="status">{notice || 'Right-click a message for the context menu.'}</p>
    </section>

    <section className="input-preview-section" aria-labelledby="message-tools">
      <div className="input-preview-heading"><h2 id="message-tools">Tool activity</h2><p>Compact summary, verbose detail, and a failed step</p></div>
      <div className="message-preview-stage message-preview-tools">
        <div><span className="message-preview-label">Compact</span><ToolStream activities={activities} /></div>
        <div><span className="message-preview-label">Verbose</span><ToolStream activities={activities} forceOpen /></div>
        <div><span className="message-preview-label">Failed</span><ToolStream activities={[{ id: 'failed', kind: 'command', title: 'npm run build', detail: 'Command failed with exit code 1', status: 'failed', createdAt: now.toISOString() }]} /></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="message-approval">
      <div className="input-preview-heading"><h2 id="message-approval">Approval</h2><p>Inline decision for a waiting run</p></div>
      <div className="message-preview-stage">
        <ApprovalCard approval={approval} onApproval={(id, accept) => setNotice(`${accept ? 'Allowed' : 'Declined'} ${id} in this preview.`)} />
      </div>
    </section>
  </PreviewLayout>;
}
