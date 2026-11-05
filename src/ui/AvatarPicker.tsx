import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { agentAvatarLabels, agentAvatarTypes, type AgentAvatarType } from '../../shared/agentAvatars';
import type { IconName } from '../../shared/types';
import { Avatar } from './Avatar';
import { Button } from './Button';

export interface AvatarPickerProps {
  value: AgentAvatarType;
  onChange: (value: AgentAvatarType) => void;
  color: string;
  icon: IconName;
  name?: string;
  label?: string;
}

/** Inline, keyboard-operable shape picker. It stays inside the agent dialog. */
export function AvatarPicker({ value, onChange, color, icon, name = 'Your new agent', label = 'Avatar' }: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const generated = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const labelId = `avatar-label-${generated}`;
  const panelId = `avatar-panel-${generated}`;
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const selected = panel.current?.querySelector<HTMLInputElement>('input[type="radio"]:checked') || panel.current?.querySelector<HTMLInputElement>('input[type="radio"]');
    selected?.focus();
    panel.current?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  return <div className="ui-field avatar-field">
    <span className="ui-field-label" id={labelId}>{label}</span>
    <button
      ref={trigger}
      type="button"
      className={`avatar-picker-trigger ${open ? 'is-open' : ''}`.trim()}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => setOpen(current => !current)}
      onKeyDown={onTriggerKeyDown}
    >
      <span className="avatar-picker-preview"><Avatar agent={{ color, icon, avatarType: value, name }} size={40} motion="full" /></span>
      <span className="avatar-picker-trigger-copy"><strong>{agentAvatarLabels[value]}</strong><small>Bot avatar</small></span>
      <ChevronDown size={15} className="avatar-picker-chevron" aria-hidden="true" />
    </button>
    {open && <div ref={panel} id={panelId} className="avatar-picker-panel" role="group" aria-labelledby={labelId} onKeyDown={onPanelKeyDown}>
      <div className="avatar-picker-grid" role="radiogroup" aria-labelledby={labelId}>
        {agentAvatarTypes.map(shape => <label key={shape} className={`avatar-picker-option ${shape === value ? 'is-selected' : ''}`.trim()}>
          <input
            type="radio"
            name={`avatar-${generated}`}
            value={shape}
            checked={shape === value}
            onChange={() => onChange(shape)}
          />
          <Avatar agent={{ color, icon, avatarType: shape, name }} size={36} motion="static" />
          <span>{agentAvatarLabels[shape]}</span>
          {shape === value && <Check size={12} className="avatar-picker-check" aria-hidden="true" />}
        </label>)}
      </div>
      <div className="avatar-picker-footer">
        <span>Choose a body, then Done.</span>
        <Button type="button" variant="secondary" size="sm" onClick={close}>Done</Button>
      </div>
    </div>}
  </div>;
}
