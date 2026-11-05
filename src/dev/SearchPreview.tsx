import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, MessageSquare, Search } from 'lucide-react';
import { AgentGlyph } from '../ui/Avatar';
import { SearchField, SearchResults } from '../ui/Search';
import { Badge } from '../ui/Badge';
import { PreviewLayout } from './PreviewLayout';
import './input-preview.css';
import './search-preview.css';

const conversations = [
  { id: 'onboarding', title: 'Onboarding flow', agent: 'Design Partner', color: '#9393ed', icon: 'design' as const, body: 'First pass at the onboarding flow with a quiet empty state and a primary action in the composer.', time: '2 minutes ago' },
  { id: 'sync', title: 'Provider sync failure', agent: 'Software Engineer', color: '#5ab9a0', icon: 'code' as const, body: 'The Codex adapter loses its thread after a host restart. Investigate the reconnect path.', time: '1 hour ago' },
  { id: 'research', title: 'Local-first research notes', agent: 'Research Partner', color: '#70aee0', icon: 'search' as const, body: 'Compare local-first sync models and summarize the tradeoffs for a small team.', time: 'Yesterday' },
  { id: 'review', title: 'Weekly review', agent: 'A Gent', color: '#ed956c', icon: 'custom' as const, body: 'Prepare the weekly review from the conversations and scheduled tasks.', time: 'Monday' },
];

export function SearchPreview() {
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState('');
  const [selected, setSelected] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const results = conversations.filter(item => !query || `${item.title} ${item.agent} ${item.body}`.toLowerCase().includes(query.toLowerCase()));

  function onSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      resultsRef.current?.querySelector<HTMLElement>('.ui-search-result')?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const items = resultsRef.current?.querySelectorAll<HTMLElement>('.ui-search-result');
      items?.[items.length - 1]?.focus();
    }
  }

  return <PreviewLayout title="Search field & results" description="A focused search field with clear affordance, live filtering, keyboard movement, and a useful empty state." component="search">
    <section className="input-preview-section" aria-labelledby="search-live">
      <div className="input-preview-heading"><h2 id="search-live">Conversation search</h2><p>Type to filter; ArrowDown moves into results</p></div>
      <div className="input-preview-surface search-preview-panel">
        <SearchField value={query} onChange={setQuery} onKeyDown={onSearchKey} label="Search conversations" placeholder="Search titles, agents, and messages…" />
        <SearchResults
          query={query}
          resultsRef={resultsRef}
          results={results.map(item => ({
            id: item.id,
            title: item.title,
            description: `${item.agent} · ${item.time}`,
            leading: <AgentGlyph agent={{ color: item.color, icon: item.icon }} size="sm" />,
            trailing: <ArrowUpRight size={15} />,
          }))}
          onSelect={setSelected}
          emptyIcon={<Search size={24} />}
          emptyTitle="No conversations match your search."
          emptyDescription="Try a title, an agent name, or a phrase from a message."
          label="Conversation results"
        />
        <p className="search-preview-selected" role="status">{selected ? `Selected ${conversations.find(item => item.id === selected)?.title}` : 'No result selected.'}</p>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="search-settings">
      <div className="input-preview-heading"><h2 id="search-settings">Settings filter</h2><p>A compact field inside a navigation rail</p></div>
      <div className="input-preview-surface search-preview-settings">
        <SearchField className="settings-search" size="sm" value={settings} onChange={setSettings} label="Search settings" placeholder="Search settings…" />
        <div className="search-preview-settings-list">
          {[['Appearance', 'Theme dark light system activity tool stream'], ['Models', 'provider codex ollama openai connection'], ['Devices', 'pairing token security rotate revoke device host'], ['Data', 'export import archive workspace backup']].filter(([, keywords]) => !settings || keywords.includes(settings.toLowerCase())).map(([label, detail]) => <div key={label}><strong>{label}</strong><small>{detail}</small></div>)}
        </div>
      </div>
    </section>

    <section className="input-preview-section" aria-labelledby="search-states">
      <div className="input-preview-heading"><h2 id="search-states">States</h2><p>Empty, filled, clearable, and disabled results</p></div>
      <div className="input-preview-grid input-preview-surface search-preview-states">
        <div><span>Empty</span><SearchField value="" onChange={() => {}} label="Empty search" placeholder="Search conversations…" /></div>
        <div><span>Filled</span><SearchField value="design" onChange={() => {}} label="Filled search" placeholder="Search conversations…" /></div>
        <div><span>With a filter result</span><div className="search-preview-result-line"><MessageSquare size={15} /><span><strong>Design Partner</strong><small>Agent · 3 conversations</small></span><Badge tone="info" dot>Match</Badge></div></div>
      </div>
    </section>
  </PreviewLayout>;
}
