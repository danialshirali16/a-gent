import { type KeyboardEvent, type RefObject } from 'react';
import { ArrowUp, ChevronDown, FolderOpen, Paperclip, Plug, Plus, Square, Terminal } from 'lucide-react';
import type { Agent, Attachment, ModelOption, ProviderInfo } from '../../shared/types';
import { ModelPicker } from './ModelPicker';
import { ProviderGlyph } from './ProviderGlyph';
import { Menu } from '../ui/Menu';
import { AttachmentChip } from '../ui/Attachment';

export interface ComposerProps {
  agent?: Agent;
  text: string;
  setText: (value: string) => void;
  attachments: Attachment[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onSend: () => void;
  onStop: () => void;
  busy: boolean;
  canStop: boolean;
  sending: boolean;
  providerId: string;
  modelId: string;
  effort: string;
  mode: 'chat' | 'work';
  workspacePath: string;
  providers: ProviderInfo[];
  currentProvider?: ProviderInfo;
  currentModel?: ModelOption;
  modelPicker: boolean;
  setModelPicker: (value: boolean) => void;
  pickerRef: RefObject<HTMLDivElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  attachInputRef: RefObject<HTMLInputElement | null>;
  onChooseModel: (providerId: string, modelId: string) => void;
  onChooseFolder: () => void;
  onOpenConnections: () => void;
  onSetMode: (mode: 'chat' | 'work') => void;
  onSetEffort: (effort: string) => void;
  onComposerKey: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const effortLabel: Record<string, string> = { low: 'Light', medium: 'Balanced', high: 'Deep' };

export function Composer(props: ComposerProps) {
  const expanded = props.text.includes('\n') || props.text.length > 70 || props.attachments.length > 0;
  const workspaceName = props.workspacePath.split(/[\\/]/).filter(Boolean).at(-1) || '';
  const modelLabel = props.currentProvider?.status === 'connected' ? (props.currentModel?.name || props.currentProvider.name) : 'Choose model';
  const effort = effortLabel[props.effort] || props.effort || 'Balanced';

  return <div className="reason-composer-shell">
    {props.attachments.length > 0 && <div className="reason-attachments">
      {props.attachments.map(file => <AttachmentChip key={file.id} name={file.name} onRemove={() => props.onRemoveAttachment(file.id)} />)}
    </div>}

    <div className={`reason-composer ${expanded ? '' : 'is-one-line'} ${props.busy ? 'is-busy' : ''}`}>
      <div className="reason-composer-main">
        <Menu
          trigger={<button className="composer-plus" title="Add" aria-label="Add"><Plus size={19} /></button>}
          label="Add"
          align="start"
          side="top"
          items={[
            { id: 'attach', label: 'Attach files', icon: <Paperclip size={15} />, onSelect: () => props.attachInputRef.current?.click() },
            { id: 'folder', label: workspaceName ? `Project folder · ${workspaceName}` : 'Project folder', icon: <FolderOpen size={15} />, onSelect: props.onChooseFolder },
            { id: 'work', label: 'Work in project', icon: <Terminal size={15} />, shortcut: props.mode === 'work' ? 'On' : undefined, disabled: props.providerId !== 'codex', onSelect: () => props.onSetMode(props.mode === 'work' ? 'chat' : 'work') },
            { id: 'connections', label: 'Connections', icon: <Plug size={15} />, separatorBefore: true, onSelect: props.onOpenConnections },
          ]}
        />
        <textarea ref={props.textareaRef} value={props.text} onChange={event => props.setText(event.target.value)} onKeyDown={props.onComposerKey} placeholder={`Message ${props.agent?.name || 'A Gent'}…`} aria-label={`Message ${props.agent?.name || 'A Gent'}`} rows={1} disabled={props.sending} />
        <div className="reason-composer-actions">
          <div className="reason-model-anchor" ref={props.pickerRef}>
            <button className="reason-model-pill" aria-expanded={props.modelPicker} aria-haspopup="dialog" onClick={() => props.setModelPicker(!props.modelPicker)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); props.setModelPicker(true); } }}>
              {props.currentProvider?.status === 'connected' && <span className="model-provider-glyph" aria-hidden="true"><ProviderGlyph provider={props.currentProvider} /></span>}
              <span className="model-name">{modelLabel}</span>
              {props.currentProvider?.status === 'connected' && props.currentProvider.kind === 'codex' && <span className="model-effort">{effort}</span>}
              <ChevronDown size={12} />
            </button>
            {props.modelPicker && <ModelPicker providers={props.providers} providerId={props.providerId} modelId={props.modelId} effort={props.effort} anchorRef={props.pickerRef} onClose={() => props.setModelPicker(false)} onChoose={props.onChooseModel} onSetEffort={props.onSetEffort} onOpenConnections={props.onOpenConnections} />}
          </div>
          {props.busy
            ? <button className="reason-send is-stop" title="Stop reply" aria-label="Stop reply" disabled={!props.canStop} onClick={props.onStop}><Square size={13} fill="currentColor" /></button>
            : <button className="reason-send" title="Send message" aria-label="Send message" disabled={props.sending || (!props.text.trim() && !props.attachments.length)} onClick={props.onSend}><ArrowUp size={18} strokeWidth={2.3} /></button>}
        </div>
      </div>
      </div>

      {(props.workspacePath || props.mode === 'work') && <div className="reason-composer-status">
        {props.workspacePath && <span className="chip" title={props.workspacePath}><FolderOpen size={12} />{workspaceName}</span>}
        {props.mode === 'work' && <span className="chip is-work"><Terminal size={12} />Work</span>}
      </div>}

    <input ref={props.attachInputRef} type="file" multiple hidden accept="text/*,.md,.txt,.json,.csv,.ts,.tsx,.js,.jsx,.py,.rs,.go,.css,.html,.yaml,.yml,.toml,.log" onChange={event => { if (event.target.files) props.onAddFiles(event.target.files); event.target.value = ''; }} />
  </div>;
}
