import type { ReactNode } from 'react';
import { Paperclip, X } from 'lucide-react';

export interface AttachmentChipProps {
  name: string;
  onRemove?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function AttachmentChip({ name, onRemove, icon, className = '' }: AttachmentChipProps) {
  return <span className={`ui-attachment ${className}`.trim()}>
    <span className="ui-attachment-icon" aria-hidden="true">{icon || <Paperclip size={12} />}</span>
    <span className="ui-attachment-name" title={name}>{name}</span>
    {onRemove && <button type="button" className="ui-attachment-remove" aria-label={`Remove ${name}`} onClick={onRemove}><X size={12} /></button>}
  </span>;
}
