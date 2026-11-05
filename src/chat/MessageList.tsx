import { Fragment } from 'react';
import type { Message, Run } from '../../shared/types';
import { Alert } from '../ui/Alert';
import { ApprovalCard } from './ApprovalCard';
import { DateDivider, SystemEvent } from './DateDivider';
import { MessageBubble } from './MessageBubble';

export interface MessageListProps {
  messages: Message[];
  currentRun?: Run;
  toolStreamView: 'verbose' | 'compact' | 'hidden';
  copied: string;
  runError?: string;
  onCopy: (content: string, id: string) => void;
  onApproval: (id: string, accept: boolean) => void;
  onOpenDetails?: () => void;
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
        {showDivider && <DateDivider value={message.createdAt} />}
        {message.role === 'system'
          ? <SystemEvent>{message.content}</SystemEvent>
          : <MessageBubble message={message} activities={activities} toolStreamView={props.toolStreamView} copied={props.copied === message.id} onCopy={props.onCopy} onOpenDetails={props.onOpenDetails} />}
      </Fragment>;
    })}
    {pending.map(approval => <ApprovalCard key={approval.id} approval={approval} onApproval={props.onApproval} />)}
    {props.runError && <Alert tone="danger" title="This run stopped" className="reason-run-error">{props.runError}</Alert>}
  </div>;
}
