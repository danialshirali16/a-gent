import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { Check, Plug, Search, X } from 'lucide-react';
import { isProviderReady } from '../../shared/providers';
import type { ProviderInfo } from '../../shared/types';
import { Button, IconButton } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { SearchField } from '../ui/Search';
import { Tooltip } from '../ui/Tooltip';
import { connectedModelGroups } from './modelOptions';
import { ProviderGlyph } from './ProviderGlyph';

interface ModelPickerProps {
  providers: ProviderInfo[];
  providerId: string;
  modelId: string;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onChoose: (providerId: string, modelId: string) => void;
  onOpenConnections: () => void;
}

const keyFor = (providerId: string, modelId: string) => JSON.stringify([providerId, modelId]);

export function ModelPicker(props: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const [browsedProviderId, setBrowsedProviderId] = useState(props.providerId);
  const [activeKey, setActiveKey] = useState(keyFor(props.providerId, props.modelId));
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const options = useRef(new Map<string, HTMLButtonElement>());
  const tabs = useRef(new Map<string, HTMLButtonElement>());
  const id = useId();
  const connected = props.providers.filter(isProviderReady);
  const activeProvider = connected.find(provider => provider.id === browsedProviderId) || connected.find(provider => provider.id === props.providerId) || connected[0];
  const searching = query.trim().length > 0;
  const groups = connectedModelGroups(props.providers, query).filter(group => searching || group.provider.id === activeProvider?.id);
  const choices = groups.flatMap(({ provider, choices }) => choices.map(choice => ({ ...choice, provider, key: keyFor(provider.id, choice.id) })));
  const duplicateNames = new Set(choices.filter((choice, index) => choices.findIndex(other => other.name === choice.name) !== index).map(choice => choice.name));
  const selectedKey = keyFor(props.providerId, props.modelId);
  const focusKey = choices.some(choice => choice.key === activeKey) ? activeKey : choices.find(choice => choice.key === selectedKey)?.key || choices[0]?.key;
  const currentProvider = connected.find(provider => provider.id === props.providerId);
  const selectionMissing = !currentProvider || (!!props.modelId && !currentProvider.models.some(model => model.id === props.modelId));
  const availableKeys = choices.map(choice => choice.key).join('\n');
  const panelId = `${id}-models`;
  const countLabel = new Intl.NumberFormat().format(choices.length);

  useEffect(() => {
    if (!choices.some(choice => choice.key === activeKey) && document.activeElement === document.body) search.current?.focus({ preventScroll: true });
  }, [activeKey, availableKeys]);

  useEffect(() => {
    if (list.current) list.current.scrollTop = 0;
  }, [query, browsedProviderId]);

  useEffect(() => {
    const tab = activeProvider && tabs.current.get(activeProvider.id);
    const rail = tab?.closest<HTMLElement>('.model-picker-provider-tabs');
    if (tab && rail && rail.scrollHeight > rail.clientHeight) rail.scrollTop = Math.max(0, tab.offsetTop - (rail.clientHeight - tab.offsetHeight) / 2);
  }, [activeProvider?.id]);

  function close(restoreFocus = true) {
    props.onClose();
    if (restoreFocus) props.anchorRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }

  function choose(providerId: string, modelId: string) {
    const provider = props.providers.find(item => item.id === providerId && isProviderReady(item));
    if (!provider || (modelId && !provider.models.some(model => model.id === modelId))) return;
    setActiveKey(keyFor(providerId, modelId));
    setBrowsedProviderId(providerId);
    props.onChoose(providerId, modelId);
  }

  function focusOption(key?: string) {
    if (!key) return;
    setActiveKey(key);
    const option = options.current.get(key);
    option?.focus({ preventScroll: true });
    option?.scrollIntoView({ block: 'nearest' });
  }

  function browse(providerId: string) {
    setBrowsedProviderId(providerId);
    setQuery('');
    setActiveKey(keyFor(providerId, providerId === props.providerId ? props.modelId : ''));
  }

  function onProviderKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? connected.length - 1 : event.key === 'ArrowDown' ? (index + 1) % connected.length : event.key === 'ArrowUp' ? (index - 1 + connected.length) % connected.length : -1;
    if (next >= 0) { event.preventDefault(); event.stopPropagation(); browse(connected[next].id); tabs.current.get(connected[next].id)?.focus(); }
    else if (event.key === (getComputedStyle(event.currentTarget).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight')) { event.preventDefault(); focusOption(focusKey); }
  }

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(event.key === 'ArrowUp' ? choices.at(-1)?.key : focusKey);
    } else if (event.key === 'Enter' && choices.length) {
      event.preventDefault();
      const choice = choices.find(item => item.key === focusKey) || choices[0];
      choose(choice.provider.id, choice.id);
      focusOption(choice.key);
    }
  }

  function onListKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || !choices.length) return;
    const index = Math.max(0, choices.findIndex(choice => choice.key === focusKey));
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : event.key === 'ArrowDown' ? (index + 1) % choices.length : event.key === 'ArrowUp' ? (index - 1 + choices.length) % choices.length : -1;
    if (next >= 0) { event.preventDefault(); event.stopPropagation(); focusOption(choices[next].key); }
    else if (!searching && event.key === (getComputedStyle(event.currentTarget).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft')) {
      event.preventDefault(); tabs.current.get(activeProvider.id)?.focus();
    } else if (event.key.length === 1 && event.key !== ' ' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); setQuery(value => value + event.key); setActiveKey(''); search.current?.focus();
    }
  }

  return <Popover open onClose={() => close(false)} anchorRef={props.anchorRef} label="Choose a model" side="top" align="end" width={416} className="composer-model-popover" initialFocusSelector={connected.length ? '.ui-search-input' : '.model-picker-connect'}>
    <div className="model-picker" onKeyDownCapture={event => {
      if (event.key !== 'Escape' || event.nativeEvent.isComposing) return;
      event.preventDefault(); event.stopPropagation();
      if (query) { setQuery(''); setActiveKey(''); search.current?.focus(); } else close();
    }}>
      {activeProvider ? <div className="model-picker-layout">
        <aside className="model-picker-rail" aria-label="Model providers">
          <div className="model-picker-provider-tabs" role="tablist" aria-label="Connected providers" aria-orientation="vertical">
            {connected.map((provider, index) => <Tooltip label={provider.name} key={provider.id} delay={250}>
              <button type="button" role="tab" id={`${id}-tab-${provider.id}`} aria-label={provider.name} aria-selected={provider.id === activeProvider.id} aria-controls={panelId} tabIndex={provider.id === activeProvider.id ? 0 : -1} className="model-picker-provider-tab"
                ref={node => { if (node) tabs.current.set(provider.id, node); else tabs.current.delete(provider.id); }} onClick={() => browse(provider.id)} onKeyDown={event => onProviderKey(event, index)}>
                <ProviderGlyph provider={provider} />
              </button>
            </Tooltip>)}
          </div>
          <div className="model-picker-rail-actions">
            <Tooltip label="Manage connections"><IconButton label="Manage connections" onClick={() => { close(false); props.onOpenConnections(); }}><Plug size={16} strokeWidth={1.5} /></IconButton></Tooltip>
            <Tooltip label="Close model picker"><IconButton label="Close model picker" onClick={() => close()}><X size={16} strokeWidth={1.5} /></IconButton></Tooltip>
          </div>
        </aside>
        <div className="model-picker-column" role="tabpanel" id={panelId} aria-labelledby={`${id}-tab-${activeProvider.id}`}>
          <div className="model-picker-search-row"><SearchField value={query} onChange={value => { setQuery(value); setActiveKey(''); }} inputRef={search} onKeyDown={onSearchKey} label="Search connected models" placeholder="Search models" className="model-picker-search" /></div>
          <div className="model-picker-models">
            <div className="model-picker-caption">{searching ? `${countLabel} ${choices.length === 1 ? 'result' : 'results'}` : <bdi>{activeProvider.name}</bdi>}</div>
            {selectionMissing && <p className="model-picker-notice">Choose a connected model.</p>}
            {choices.length ? <div ref={list} className="model-picker-list" role="listbox" aria-label={searching ? 'Search results' : `${activeProvider.name} models`} onKeyDown={onListKey}>
              {choices.map(choice => {
                const selected = choice.key === selectedKey;
                const label = duplicateNames.has(choice.name) && choice.id ? `${choice.name} · ${choice.id}` : choice.name;
                return <button type="button" role="option" aria-label={searching ? `${choice.provider.name} · ${label}` : label} aria-selected={selected} tabIndex={choice.key === focusKey ? 0 : -1} data-provider-id={choice.provider.id} data-model-id={choice.id} className="model-picker-option" key={choice.key}
                  ref={node => { if (node) options.current.set(choice.key, node); else options.current.delete(choice.key); }} onFocus={() => setActiveKey(choice.key)} onClick={() => choose(choice.provider.id, choice.id)}>
                  {searching && <Tooltip label={choice.provider.name}><span className="model-picker-result-provider" aria-hidden="true"><ProviderGlyph provider={choice.provider} /></span></Tooltip>}
                  <span className="model-picker-name"><bdi>{label}</bdi></span>
                  {selected && <Check className="model-picker-check" size={15} strokeWidth={2} aria-hidden="true" />}
                </button>;
              })}
            </div> : <div className="model-picker-empty"><Search size={21} strokeWidth={1.5} aria-hidden="true" /><strong>No models match “<bdi>{query}</bdi>”</strong><Button variant="quiet" size="sm" onClick={() => { setQuery(''); search.current?.focus(); }}>Clear search</Button></div>}
          </div>
          <div className="model-picker-thinking">
            <span className="model-picker-thinking-label"><span className="model-picker-meter" aria-hidden="true">{[0, 1, 2].map(level => <span key={level} />)}</span>Reasoning</span>
            <span className="model-picker-thinking-unavailable">Provider default</span>
          </div>
        </div>
      </div> : <>
        <div className="model-picker-empty-heading"><h2>Choose a model</h2><IconButton label="Close model picker" onClick={() => close()}><X size={16} /></IconButton></div>
        <div className="model-picker-empty is-disconnected"><Plug size={24} strokeWidth={1.5} aria-hidden="true" /><strong>No connected providers</strong><p>Connect a provider to choose a model.</p><Button className="model-picker-connect" variant="secondary" onClick={() => { close(false); props.onOpenConnections(); }}>Connect a provider</Button></div>
      </>}
      <p className="sr-only" role="status">{connected.length ? `${countLabel} model options available. Reasoning uses the provider default.` : 'No connected providers.'}</p>
    </div>
  </Popover>;
}
