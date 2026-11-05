import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Monitor, RefreshCw } from 'lucide-react';
import type { AppConnection, AppInventory, ProviderInfo } from '../../shared/types';
import type { Connection } from '../api';
import type { Api } from '../dialogs';
import { Modal } from '../components';
import { useToast } from '../ui/Alert';
import { SearchField } from '../ui/Search';
import { ProviderCard } from './ProviderCard';

type Category = 'all' | 'models' | 'apps' | 'host';

export function ConnectionsDialog({ providers, api, onRefresh, connection, onHost, onClose }: {
  providers: ProviderInfo[];
  api: Api;
  onRefresh: () => Promise<unknown>;
  connection: Connection;
  onHost: () => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<AppConnection[]>([]);
  const [appError, setAppError] = useState('');
  const [appNotice, setAppNotice] = useState('');
  const [checkingApps, setCheckingApps] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function checkApps() {
    setCheckingApps(true); setAppError(''); setAppNotice('');
    try {
      const inventory = await api<AppInventory>('/api/apps');
      setApps(inventory.apps);
      if (inventory.partial) setAppNotice(inventory.error ? `Some connections could not be checked. ${inventory.error}` : 'Some connections could not be checked. Refresh to retry.');
    } catch { setAppError('Could not read connected apps. Check the host connection, then refresh.'); }
    finally { setCheckingApps(false); }
  }
  useEffect(() => { void checkApps(); }, []);

  const needle = query.trim().toLowerCase();
  const shownProviders = providers.filter(provider => !needle || `${provider.name} ${provider.detail}`.toLowerCase().includes(needle));
  const shownApps = apps.filter(app => !needle || app.name.toLowerCase().includes(needle));
  const showModels = category === 'all' || category === 'models';
  const showApps = category === 'all' || category === 'apps';
  const showHost = category === 'all' || category === 'host';

  return <Modal title="Connections" onClose={onClose} className="modal-connections">
    <div className="connections-shell">
      <div className="connections-toolbar">
        <SearchField className="connections-search" value={query} onChange={setQuery} label="Search connections" placeholder="Search models, apps, and host settings…" />
        <Tabs className="connections-tabs" variant="segmented" size="sm" items={[['all', 'All'], ['models', 'Models'], ['apps', 'Apps'], ['host', 'Host']].map(([id, label]) => ({ id, label }))} value={category} onChange={id => setCategory(id as Category)} ariaLabel="Connection categories" />
      </div>
      <div className="connections-body">
        {showModels && <section className="connections-section">
          <h3>Models</h3>
          <div className="connections-provider-list">{shownProviders.map(provider => <ProviderCard provider={provider} key={provider.id} api={api} onRefresh={onRefresh} />)}</div>
          {!shownProviders.length && <p className="connections-empty">No model providers match.</p>}
        </section>}

        {showApps && <section className="connections-section">
          <h3>Connected apps <Button variant="quiet" size="sm" loading={checkingApps} onClick={() => void checkApps()}><RefreshCw size={13} />Refresh</Button></h3>
          <p className="connections-note">MCP connections configured in Codex or OpenCode on this host. Tool lists are read from the runtime, not guessed.</p>
          {appNotice && <p className="connections-notice" role="status">{appNotice}</p>}
          {appError ? <p className="connections-error">{appError}</p> : !shownApps.length ? <p className="connections-empty">{checkingApps ? 'Checking app connections…' : needle ? 'No apps match.' : 'No app connections found. Add MCP servers to Codex or OpenCode on the host, then refresh.'}</p> : <div className="connections-app-grid">{shownApps.map(app => <div className="connection-app-card" key={app.id || `${app.providerId || 'runtime'}:${app.name}`}><span className={`connection-dot ${app.status === 'connected' ? 'is-connected' : ''}`} /><div><strong>{app.name.replace(/[_-]/g, ' ')}</strong><small>{app.status === 'connected' ? `${app.toolsCount === undefined ? 'Tool list unavailable' : `${app.toolsCount} ${app.toolsCount === 1 ? 'tool' : 'tools'}`}${app.authStatus ? ` · ${app.authStatus}` : ''}` : app.status === 'needs-auth' ? 'Sign-in needed' : app.error ? 'Check failed' : app.status.replace('-', ' ')}</small></div></div>)}</div>}
        </section>}

        {showHost && <section className="connections-section">
          <h3>Host</h3>
          <div className="connection-host-card">
            <div className="connection-host-head"><Monitor size={18} /><div><strong>Your A Gent host</strong><small>This computer keeps your agents, conversations, and scheduled tasks.</small></div></div>
            <code>{connection.url}</code>
            <div className="connection-host-actions">
              <Button variant="secondary" size="sm" onClick={onHost}>Connect another host<ArrowUpRight size={14} /></Button>
              <Button variant="quiet" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(connection.token); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: 'Pairing token copied', tone: 'success' }); } catch { setCopied(false); toast({ title: 'Clipboard unavailable', tone: 'danger' }); } }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Token copied' : 'Copy pairing token'}</Button>
            </div>
            <p className="connections-note">Android connects to this host over a reachable HTTPS address. A pairing token is required once per app session. Create a dedicated token for each device with the administrator token.</p>
          </div>
        </section>}
      </div>
    </div>
  </Modal>;
}
