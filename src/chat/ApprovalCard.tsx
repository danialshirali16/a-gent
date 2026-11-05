import type { Approval } from '../../shared/types';
import { Button } from '../ui/Button';
import { Terminal } from 'lucide-react';

export function ApprovalCard({ approval, onApproval, className = '' }: { approval: Approval; onApproval: (id: string, accept: boolean) => void; className?: string }) {
  return <div className={`reason-approval ${className}`.trim()}>
    <div className="reason-approval-head"><Terminal size={16} /><h3>{approval.title}</h3></div>
    <p>{approval.description}</p>
    {approval.command && <pre>{approval.command}</pre>}
    <div className="reason-approval-actions">
      <Button variant="quiet" size="sm" onClick={() => onApproval(approval.id, false)}>Decline</Button>
      <Button variant="primary" size="sm" onClick={() => onApproval(approval.id, true)}>Allow this action</Button>
    </div>
  </div>;
}
