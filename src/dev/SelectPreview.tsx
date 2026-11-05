import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Select } from '../ui/Select';
import { Combobox } from '../ui/Combobox';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './select-preview.css';

const modelOptions = [
  { value: '', label: 'Provider default', description: 'Use the provider’s default model', group: 'Codex' },
  { value: 'gpt-5.2-codex', label: 'GPT-5.2 Codex', description: 'Deep coding and long-running work', group: 'Codex' },
  { value: 'gpt-5.2', label: 'GPT-5.2', description: 'General reasoning', group: 'Codex' },
  { value: 'gpt-5-mini', label: 'GPT-5 mini', description: 'Fast everyday tasks', group: 'Codex' },
  { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5', description: 'Long context and careful writing', group: 'OpenCode' },
  { value: 'gemini-3-pro', label: 'Gemini 3 Pro', description: 'Multimodal research', group: 'OpenCode' },
  { value: 'llama3.3', label: 'Llama 3.3', description: 'Local Ollama model', group: 'Ollama' },
];

export function SelectPreview() {
  const [model, setModel] = useState('gpt-5.2-codex');
  const [group, setGroup] = useState('product');
  const [notice, setNotice] = useState('');
  const selected = modelOptions.find(option => option.value === model);

  function save(event: FormEvent) {
    event.preventDefault();
    setNotice(`Model set to ${selected?.label || 'Provider default'} in this preview.`);
  }

  return <PreviewLayout title="Select & Combobox" description="Native selection for short lists, searchable selection for models and longer catalogs." component="select">
    <section className="input-preview-section" aria-labelledby="select-native">
      <div className="input-preview-heading"><h2 id="select-native">Native select</h2><p>Native semantics, compact surface</p></div>
      <div className="input-preview-grid input-preview-surface select-preview-grid">
        <Field label="Agent group" description="Organize related agents in the sidebar."><Select defaultValue="product"><option value="">Unassigned</option><option value="product">Product</option><option value="engineering">Engineering</option><option value="research">Research</option></Select></Field>
        <Field label="Default size"><Select defaultValue="balanced"><option value="light">Light</option><option value="balanced">Balanced</option><option value="deep">Deep</option></Select></Field>
        <Field label="Small"><Select controlSize="sm" defaultValue="compact"><option value="compact">Compact</option><option value="verbose">Verbose</option></Select></Field>
        <Field label="Large"><Select controlSize="lg" defaultValue="codex"><option value="codex">Codex</option><option value="opencode">OpenCode</option></Select></Field>
        <Field label="Disabled"><Select disabled defaultValue="unavailable"><option value="unavailable">Unavailable</option></Select></Field>
        <Field label="Validation" error="Choose an agent group."><Select aria-invalid="true" defaultValue=""><option value="">Choose a group</option><option value="product">Product</option></Select></Field>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="combobox-models">
      <div className="input-preview-heading"><h2 id="combobox-models">Combobox</h2><p>Search, groups, keyboard navigation, selected state</p></div>
      <div className="input-preview-surface select-preview-combobox">
        <Field label="Model" description="Type to filter. Arrow keys move through results; Enter chooses."><Combobox value={model} onChange={setModel} options={modelOptions} searchPlaceholder="Search models…" emptyMessage="No models match your search." /></Field>
        <div className="select-preview-selection" aria-live="polite"><span>Selected</span><strong>{selected?.label || 'Provider default'}</strong><small>{selected?.description || 'Use the provider’s default model'}</small></div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="select-live">
      <div className="input-preview-heading"><h2 id="select-live">Try it</h2><p>Open the combobox, type “claude”, and press Enter.</p></div>
      <form className="input-preview-surface input-preview-form select-preview-form" onSubmit={save}>
        <div className="select-preview-form-grid">
          <Field label="Agent group"><Select value={group} onChange={event => setGroup(event.target.value)}><option value="product">Product</option><option value="engineering">Engineering</option><option value="research">Research</option></Select></Field>
          <Field label="Model"><Combobox value={model} onChange={setModel} options={modelOptions} searchPlaceholder="Search models…" /></Field>
        </div>
        <div className="input-preview-actions"><p role="status">{notice || 'Changes stay in this preview.'}</p><Button type="submit" variant="primary">Save preview</Button></div>
      </form>
    </section>
  </PreviewLayout>;
}
