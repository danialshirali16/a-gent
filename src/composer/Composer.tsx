import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { ArrowUp, Check, ChevronDown, FolderOpen, Paperclip, Plug, Plus, Square, Terminal, X } from 'lucide-react';
import type { Agent, Attachment, ModelOption, ProviderInfo } from '../../shared/types';
import { IconButton } from '../components';
import { moveFocus } from '../keyboard';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const expanded = props.text.includes('\n') || props.text.length > 70 || props.attachments.length > 0;
  const workspaceName = props.workspacePath.split(/[\\/]/).filter(Boolean).at(-1) || '';
  const modelLabel = props.currentModel?.name || props.currentProvider?.name || 'Choose model';
  const effort = effortLabel[props.effort] || props.effort || 'Balanced';

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menuOpen]);
  useEffect(() => {
    if (!props.modelPicker) return;
    props.pickerRef.current?.querySelector<HTMLButtonElement>('.reason-model-group button')?.focus();
  }, [props.modelPicker, props.pickerRef]);

  const choose = (providerId: string, modelId: string) => { props.setModelPicker(false); props.onChooseModel(providerId, modelId); };
  const menuAction = (run: () => void) => { setMenuOpen(false); run(); };

  return <div className="reason-composer-shell">
    {props.attachments.length > 0 && <div className="reason-attachments">
      {props.attachments.map(file => <span key={file.id}><Paperclip size={12} />{file.name}<button aria-label={`Remove ${file.name}`} onClick={() => props.onRemoveAttachment(file.id)}><X size={12} /></button></span>)}
    </div>}

    <div className={`reason-composer ${expanded ? '' : 'is-one-line'} ${props.busy ? 'is-busy' : ''}`}>
      <div className="reason-composer-main">
        <button ref={plusRef} className="composer-plus" title="Add" aria-label="Add" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen(value => !value)}><Plus size={19} /></button>
        <textarea ref={props.textareaRef} value={props.text} onChange={event => props.setText(event.target.value)} onKeyDown={props.onComposerKey} placeholder={`Message ${props.agent?.name || 'A Gent'}…`} aria-label={`Message ${props.agent?.name || 'A Gent'}`} rows={1} disabled={props.sending} />
        <div className="reason-composer-actions">
          <div className="reason-model-anchor" ref={props.pickerRef}>
            <button className="reason-model-pill" aria-expanded={props.modelPicker} aria-haspopup="dialog" onClick={() => props.setModelPicker(!props.modelPicker)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); props.setModelPicker(true); } }}>
              <span className="model-name">{modelLabel}</span>
              <span className="model-effort">{effort}</span>
              <ChevronDown size={12} />
            </button>
            {props.modelPicker && <div className="reason-model-popup" role="dialog" aria-label="Choose a model" onKeyDown={event => {
              if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); props.setModelPicker(false); props.pickerRef.current?.querySelector<HTMLButtonElement>('.reason-model-pill')?.focus(); }
              else moveFocus(event);
            }}>
              <div className="reason-popup-head"><span>Choose a model</span><IconButton label="Close model picker" onClick={() => props.setModelPicker(false)}><X size={14} /></IconButton></div>
              {props.providers.map(provider => <div className="reason-model-group" key={provider.id}>
                <span>{provider.name}<small>{provider.status === 'connected' ? 'Connected' : 'Not connected'}</small></span>
                <button className={props.providerId === provider.id && !props.modelId ? 'is-selected' : ''} onClick={() => choose(provider.id, '')}><span>Provider default</span>{props.providerId === provider.id && !props.modelId && <Check size={14} />}</button>
                {provider.models.map(model => <button key={model.id} className={props.providerId === provider.id && props.modelId === model.id ? 'is-selected' : ''} onClick={() => choose(provider.id, model.id)}><span>{model.name}</span>{props.providerId === provider.id && props.modelId === model.id && <Check size={14} />}</button>)}
              </div>)}
              {props.providerId === 'codex' && <div className="reason-model-group">
                <span>Effort</span>
                <div className="reason-effort-options">
                  {(['low', 'medium', 'high'] as const).map(value => <button key={value} aria-pressed={props.effort === value} className={props.effort === value ? 'is-selected' : ''} onClick={() => props.onSetEffort(value)}>{effortLabel[value]}</button>)}
                </div>
              </div>}
              <button className="reason-model-manage" onClick={() => { props.setModelPicker(false); props.onOpenConnections(); }}><Plug size={14} />Manage connections</button>
            </div>}
          </div>
          {props.busy
            ? <button className="reason-send is-stop" title="Stop reply" aria-label="Stop reply" disabled={!props.canStop} onClick={props.onStop}><Square size={13} fill="currentColor" /></button>
            : <button className="reason-send" title="Send message" aria-label="Send message" disabled={props.sending || (!props.text.trim() && !props.attachments.length)} onClick={props.onSend}><ArrowUp size={18} strokeWidth={2.3} /></button>}
        </div>
      </div>

      {menuOpen && <div className="reason-composer-menu" ref={menuRef} role="menu" aria-label="Add" onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setMenuOpen(false); plusRef.current?.focus(); }
        else moveFocus(event, '[role="menuitem"]:not([disabled])');
      }}>
        <div className="reason-menu-label" role="presentation">Add</div>
        <button role="menuitem" onClick={() => menuAction(() => props.attachInputRef.current?.click())}><Paperclip size={15} />Attach files</button>
        <button role="menuitem" onClick={() => menuAction(props.onChooseFolder)}><FolderOpen size={15} />Project folder{workspaceName && <small>{workspaceName}</small>}</button>
        <button role="menuitem" disabled={props.providerId !== 'codex'} onClick={() => menuAction(() => props.onSetMode(props.mode === 'work' ? 'chat' : 'work'))}><Terminal size={15} />Work in project{props.mode === 'work' && <Check size={14} />}</button>
        <div className="reason-menu-divider" role="separator" />
        <button role="menuitem" onClick={() => menuAction(props.onOpenConnections)}><Plug size={15} />Connections</button>
      </div>}
    </div>

    {(props.workspacePath || props.mode === 'work') && <div className="reason-composer-status">
      {props.workspacePath && <span className="chip" title={props.workspacePath}><FolderOpen size={12} />{workspaceName}</span>}
      {props.mode === 'work' && <span className="chip is-work"><Terminal size={12} />Work</span>}
    </div>}

    <input ref={props.attachInputRef} type="file" multiple hidden accept="text/*,.md,.txt,.json,.csv,.ts,.tsx,.js,.jsx,.py,.rs,.go,.css,.html,.yaml,.yml,.toml,.log" onChange={event => { if (event.target.files) props.onAddFiles(event.target.files); event.target.value = ''; }} />
  </div>;
}
