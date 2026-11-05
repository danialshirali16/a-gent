import { useRef, useState, type KeyboardEvent } from 'react';
import { FileText, Image, Paperclip } from 'lucide-react';
import type { Agent, Attachment, ProviderInfo } from '../../shared/types';
import { Composer } from '../composer/Composer';
import { AttachmentChip } from '../ui/Attachment';
import { Button } from '../ui/Button';
import { SegmentedControl } from '../ui/Tabs';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './composer-preview.css';

const agent: Agent = { id: 'design', name: 'Design Partner', description: 'Flows, interfaces, and the details that make them work.', instructions: '', color: '#9393ed', icon: 'design', providerId: 'codex', modelId: 'gpt-5.2-codex', reasoningEffort: 'medium', createdAt: new Date().toISOString() };
const providers: ProviderInfo[] = [
  { id: 'codex', name: 'Codex', kind: 'codex', status: 'connected', detail: 'Signed in on this host', models: [{ id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex', description: 'Deep coding and long-running work' }, { id: 'gpt-5.2', name: 'GPT-5.2', description: 'General reasoning' }, { id: 'gpt-5-mini', name: 'GPT-5 mini', description: 'Fast everyday tasks' }] },
  { id: 'ollama', name: 'Ollama', kind: 'ollama', status: 'available', detail: 'Local models', models: [{ id: 'llama3.3', name: 'Llama 3.3' }] },
];

const initialAttachments: Attachment[] = [
  { id: 'brief', name: 'onboarding-brief.md', type: 'text/markdown', content: '# Onboarding brief' },
  { id: 'notes', name: 'research-notes.txt', type: 'text/plain', content: 'Interview notes' },
];

export function ComposerPreview() {
  const [scenario, setScenario] = useState('one');
  const [disconnectedProvider, setDisconnectedProvider] = useState('');
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [providerId, setProviderId] = useState('codex');
  const [modelId, setModelId] = useState('gpt-5.2-codex');
  const [mode, setMode] = useState<'chat' | 'work'>('chat');
  const [workspacePath, setWorkspacePath] = useState('/Users/danial/Projects/a-gent');
  const [modelPicker, setModelPicker] = useState(false);
  const [notice, setNotice] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const previewProviders = providers.map(provider => ({ ...provider,
    status: scenario === 'none' || provider.id === disconnectedProvider ? 'available' as const : scenario === 'multiple' || scenario === 'many' ? 'connected' as const : provider.status,
    models: scenario === 'many' && provider.id === 'codex' ? [
      { id: 'long-name', name: 'An exceptionally long model name with multilingual text — مدل پژوهشی برای بررسی رابط کاربری', description: 'A descriptive label that remains readable when the picker becomes narrow.' },
      ...Array.from({ length: 40 }, (_, index) => ({ id: `model-${index + 1}`, name: `Research model ${index + 1}`, description: `Model ID: research-${index + 1}` })),
    ] : provider.models,
  }));
  const currentProvider = previewProviders.find(provider => provider.id === providerId);
  const currentModel = currentProvider?.models.find(model => model.id === modelId);

  function send() {
    if (!text.trim() && !attachments.length) return;
    setNotice(`Sent “${text.trim() || 'attachments'}” with ${attachments.length} attachment${attachments.length === 1 ? '' : 's'} in this preview.`);
    setText('');
    setAttachments([]);
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
  }

  function addFiles(files: FileList | File[]) {
    const next = Array.from(files).map(file => ({ id: crypto.randomUUID(), name: file.name, type: file.type || 'text/plain', content: '' }));
    setAttachments(previous => [...previous, ...next]);
  }

  return <PreviewLayout title="Composer & Attachment" description="Message entry, attachment chips, the model and effort picker, and send or stop in one compact surface." component="composer">
    <section className="input-preview-section" aria-labelledby="composer-live">
      <div className="input-preview-heading"><h2 id="composer-live">Composer</h2><p>Type, attach, pick a model, and send</p></div>
      <p className="composer-preview-note"><a href={`?component=composer&stress=model-options&data=demo&theme=${new URLSearchParams(location.search).get('theme') || 'dark'}`}>Open modelOptions data stress test</a></p>
      <div className="composer-preview-fixtures"><SegmentedControl ariaLabel="Model picker example" value={scenario} onChange={value => { setScenario(value); setDisconnectedProvider(''); }} options={[{ id: 'one', label: 'One connection' }, { id: 'multiple', label: 'Two connections' }, { id: 'none', label: 'No connections' }, { id: 'many', label: 'Long catalog' }]} /><Button size="sm" variant="quiet" disabled={scenario === 'none'} onClick={() => setDisconnectedProvider(value => value === providerId ? '' : providerId)}>{disconnectedProvider === providerId ? 'Reconnect selected provider' : 'Disconnect selected provider'}</Button></div>
      <div className="composer-preview-stage">
        <Composer
          agent={agent}
          text={text}
          setText={setText}
          attachments={attachments}
          onAddFiles={addFiles}
          onRemoveAttachment={id => setAttachments(previous => previous.filter(item => item.id !== id))}
          onSend={send}
          onStop={() => setNotice('Stopped the reply in this preview.')}
          busy={false}
          stopping={false}
          canStop={false}
          sending={false}
          providerId={providerId}
          modelId={modelId}
          mode={mode}
          workspacePath={workspacePath}
          providers={previewProviders}
          currentProvider={currentProvider}
          currentModel={currentModel}
          modelPicker={modelPicker}
          setModelPicker={setModelPicker}
          pickerRef={pickerRef}
          textareaRef={textareaRef}
          attachInputRef={attachInputRef}
          onChooseModel={(nextProvider, nextModel) => { setProviderId(nextProvider); setModelId(nextModel); }}
          onChooseFolder={() => setWorkspacePath('/Users/danial/Projects/another-project')}
          onOpenConnections={() => setNotice('Connections would open here.')}
          onSetMode={setMode}
          onComposerKey={onKey}
        />
      </div>
      <p className="composer-preview-note" role="status">{notice || 'Changes stay in this preview. Press Enter to send; Shift + Enter adds a line.'}</p>
    </section>

    <section className="input-preview-section" aria-labelledby="composer-attachments">
      <div className="input-preview-heading"><h2 id="composer-attachments">Attachment chips</h2><p>Name, file kind, and a clear remove action</p></div>
      <div className="input-preview-surface composer-preview-chips">
        <AttachmentChip name="onboarding-brief.md" onRemove={() => {}} icon={<FileText size={12} />} />
        <AttachmentChip name="research-notes.txt" onRemove={() => {}} icon={<Paperclip size={12} />} />
        <AttachmentChip name="reference-board.png" onRemove={() => {}} icon={<Image size={12} />} />
        <AttachmentChip name="read-only-context.md" />
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="composer-anatomy">
      <div className="input-preview-heading"><h2 id="composer-anatomy">Anatomy</h2><p>One surface that grows with the message</p></div>
      <div className="input-preview-surface composer-preview-anatomy">
        <div><strong>One line at rest</strong><span>52px high, pill radius, one outer border, and a single row of controls.</span></div>
        <div><strong>Expanded</strong><span>Grows with content, radius 24px, attachments stay above the field.</span></div>
        <div><strong>Actions</strong><span>Add menu, model and effort picker, and a send or stop circle.</span></div>
        <div><strong>Keyboard</strong><span>Enter sends, Shift + Enter adds a line, and the add menu supports arrow keys.</span></div>
      </div>
    </section>
  </PreviewLayout>;
}
