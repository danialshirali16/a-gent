import { useEffect, useRef, useState } from 'react';
import { Composer } from '../composer/Composer';
import { modelOptionsDataSets, modelOptionsFixtures, type ModelOptionsDataSet } from './modelOptions.fixtures';
import './model-options-preview.css';

function readDataSet(): ModelOptionsDataSet {
  const value = new URLSearchParams(location.search).get('data');
  return modelOptionsDataSets.find(item => item.id === value)?.id || 'demo';
}

function replaceParam(name: string, value: string) {
  const url = new URL(location.href);
  url.searchParams.set(name, value);
  history.replaceState(null, '', url);
}

function ModelOptionsExample({ dataSet }: { dataSet: ModelOptionsDataSet }) {
  const fixture = modelOptionsFixtures[dataSet];
  const [providerId, setProviderId] = useState(fixture.providerId);
  const [modelId, setModelId] = useState(fixture.modelId);
  const [effort, setEffort] = useState('medium');
  const [text, setText] = useState('');
  const [modelPicker, setModelPicker] = useState(false);
  const [disconnected, setDisconnected] = useState('');
  const [notice, setNotice] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const providers = fixture.providers.map(provider => provider.id === disconnected ? { ...provider, status: 'error' as const } : provider);
  const currentProvider = providers.find(provider => provider.id === providerId);

  useEffect(() => { setModelPicker(true); }, []);

  return <>
    <div className="model-options-lab-meta">
      <p>{fixture.note}</p>
      <output aria-label="Selected model">{providerId} · {modelId || 'Provider default'}</output>
      <div className="model-options-lab-actions">
        <button type="button" disabled={!currentProvider} onClick={() => setDisconnected(value => value === providerId ? '' : providerId)}>{disconnected === providerId ? 'Reconnect selected' : 'Disconnect selected'}</button>
        <button type="button" onClick={() => setModelPicker(true)}>Open picker</button>
      </div>
      {notice && <p role="status">{notice}</p>}
    </div>
    <div className="model-options-lab-composer">
      <Composer
        text={text} setText={setText} attachments={[]}
        onAddFiles={() => {}} onRemoveAttachment={() => {}}
        onSend={() => setNotice('Messages stay in this preview.')} onStop={() => {}}
        busy={false} canStop={false} sending={false}
        providerId={providerId} modelId={modelId} effort={effort} mode="chat" workspacePath=""
        providers={providers} currentProvider={currentProvider}
        currentModel={currentProvider?.models.find(model => model.id === modelId)}
        modelPicker={modelPicker} setModelPicker={setModelPicker}
        pickerRef={pickerRef} textareaRef={textareaRef} attachInputRef={attachInputRef}
        onChooseModel={(nextProvider, nextModel) => { setProviderId(nextProvider); setModelId(nextModel); }}
        onChooseFolder={() => {}} onOpenConnections={() => setNotice('Use the main app to manage connections.')}
        onSetMode={() => {}} onSetEffort={setEffort} onComposerKey={() => {}}
      />
    </div>
  </>;
}

/** Development-only data harness. Production components and styles are unchanged. */
export function ModelOptionsPreview() {
  const [dataSet, setDataSet] = useState<ModelOptionsDataSet>(readDataSet);
  const [theme, setTheme] = useState(() => new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark');
  const [rtl, setRtl] = useState(() => new URLSearchParams(location.search).get('dir') === 'rtl');
  const [largeText, setLargeText] = useState(() => new URLSearchParams(location.search).get('text') === 'large');

  useEffect(() => {
    const root = document.documentElement;
    const previous = { theme: root.dataset.theme, dir: root.getAttribute('dir'), fontSize: root.style.fontSize };
    root.dataset.theme = theme;
    root.dir = rtl ? 'rtl' : 'ltr';
    root.style.fontSize = largeText ? '200%' : previous.fontSize;
    return () => {
      if (previous.theme) root.dataset.theme = previous.theme; else delete root.dataset.theme;
      if (previous.dir) root.setAttribute('dir', previous.dir); else root.removeAttribute('dir');
      root.style.fontSize = previous.fontSize;
    };
  }, [theme, rtl, largeText]);

  useEffect(() => {
    const restore = () => setDataSet(readDataSet());
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  return <div className="model-options-lab">
    <header className="model-options-lab-header">
      <div><a href={`?component=composer&theme=${theme}`}>← Composer preview</a><h1>modelOptions · data stress test</h1></div>
      <div className="model-options-lab-environment" role="group" aria-label="Test environment">
        <label><input type="checkbox" checked={theme === 'dark'} onChange={event => { const next = event.target.checked ? 'dark' : 'light'; setTheme(next); replaceParam('theme', next); }} />Dark</label>
        <label><input type="checkbox" checked={rtl} onChange={event => { setRtl(event.target.checked); replaceParam('dir', event.target.checked ? 'rtl' : 'ltr'); }} />RTL</label>
        <label><input type="checkbox" checked={largeText} onChange={event => { setLargeText(event.target.checked); replaceParam('text', event.target.checked ? 'large' : 'normal'); }} />200% root text</label>
      </div>
    </header>
    <main className="model-options-lab-stage">
      <ModelOptionsExample key={dataSet} dataSet={dataSet} />
    </main>
    <div className="model-options-lab-data" role="group" aria-label="Model options test data">
      {modelOptionsDataSets.map(item => <button type="button" key={item.id} aria-pressed={item.id === dataSet} onClick={() => { setDataSet(item.id); replaceParam('data', item.id); }}>{item.label}</button>)}
    </div>
  </div>;
}
