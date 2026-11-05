import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Monitor } from 'lucide-react';
import type { ProviderInfo } from '../../shared/types';
import type { Connection } from '../api';
import type { Api } from '../dialogs';
import { Modal } from '../components';
import { useToast } from '../ui/Alert';
import { SearchField } from '../ui/Search';
import { ProviderCard } from './ProviderCard';

type Category = 'models' | 'host';

/**
 * Personal v1 exposes the Codex runtime only. Connected Apps/MCP management is
 * paused, so this panel deliberately has no app inventory, sign-in, or reload
 * controls. Saved app records stay in the workspace untouched.
 */
export function ConnectionsDialog({ providers, api, onRefresh, connection, onHost, onClose }: {
  providers: ProviderInfo[];
  api: Api;
  onRefresh: () => Promise<unknown>;
  connection: Connection;
  onHost: () => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<Category>('models');
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const codex = providers.filter(provider => provider.id === 'codex');
  const needle = query.trim().toLowerCase();
  const shownProviders = codex.filter(provider => !needle || `${provider.name} ${provider.detail}`.toLowerCase().includes(needle));

  return <Modal title="Connections" onClose={onClose} className="modal-connections">
    <div className="connections-shell">
      <div className="connections-toolbar">
        <SearchField className="connections-search" value={query} onChange={setQuery} label="Search connections" placeholder="Search Codex and host settings…" />
        <Tabs className="connections-tabs" variant="segmented" size="sm" items={[{ id: 'models', label: 'Codex' }, { id: 'host', label: 'Host' }]} value={category} onChange={id => setCategory(id as Category)} ariaLabel="Connection categories" />
      </div>
      <div className="connections-body">
        {category === 'models' && <section className="connections-section">
          <h3>Runtime</h3>
          <p className="connections-note">This release uses the Codex CLI and its external sign-in. OpenCode, hosted endpoints, and connected apps are paused; saved settings are preserved.</p>
          <div className="connections-provider-list">{shownProviders.map(provider => <ProviderCard provider={provider} key={provider.id} api={api} onRefresh={onRefresh} />)}</div>
          {!shownProviders.length && <p className="connections-empty">No Codex connection matches.</p>}
        </section>}

        {category === 'host' && <section className="connections-section">
          <h3>Host</h3>
          <div className="connection-host-card">
            <div className="connection-host-head"><Monitor size={18} /><div><strong>Your A Gent host</strong><small>This computer owns your agents, conversations, drafts, and project data.</small></div></div>
            <code>{connection.url}</code>
            <div className="connection-host-actions">
              <Button variant="secondary" size="sm" onClick={onHost}>Connect another host<ArrowUpRight size={14} /></Button>
              <Button variant="quiet" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(connection.token); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: 'Pairing token copied', tone: 'success' }); } catch { setCopied(false); toast({ title: 'Clipboard unavailable', tone: 'danger' }); } }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Token copied' : 'Copy pairing token'}</Button>
            </div>
            <p className="connections-note">Remote-device pairing is deferred for this personal release. The desktop app pairs automatically on this computer.</p>
          </div>
        </section>}
      </div>
    </div>
  </Modal>;
}
