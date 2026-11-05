import { Button } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Monitor, RefreshCw, RotateCw } from 'lucide-react';
import type { AppCapabilities, AppConnection, AppInventory, AppLoginStart, AppLoginState, ProviderInfo } from '../../shared/types';
import type { Connection } from '../api';
import type { Api } from '../dialogs';
import { Modal } from '../components';
import { useToast } from '../ui/Alert';
import { SearchField } from '../ui/Search';
import { ProviderCard } from './ProviderCard';

type Category = 'all' | 'models' | 'apps' | 'host';

function schemaFieldNames(schema: unknown): string[] {
  if (!schema || typeof schema !== 'object') return [];
  const properties = (schema as { properties?: unknown }).properties;
  return properties && typeof properties === 'object' ? Object.keys(properties).slice(0, 20) : [];
}

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
  const [selectedApp, setSelectedApp] = useState<AppConnection | null>(null);
  const [capabilities, setCapabilities] = useState<AppCapabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState('');
  const [capabilityBusy, setCapabilityBusy] = useState(false);
  const [scopes, setScopes] = useState('');
  const [loginStart, setLoginStart] = useState<AppLoginStart | null>(null);
  const [loginState, setLoginState] = useState<AppLoginState | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [reloading, setReloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function checkApps() {
    setCheckingApps(true); setAppError(''); setAppNotice('');
    try {
      const inventory = await api<AppInventory>('/api/apps');
      setApps(inventory.apps); setSelectedApp(null); setCapabilities(null); setCapabilityError('');
      if (inventory.partial) setAppNotice(inventory.error ? `Some connections could not be checked. ${inventory.error}` : 'Some connections could not be checked. Refresh to retry.');
    } catch { setAppError('Could not read connected apps. Check the host connection, then refresh.'); }
    finally { setCheckingApps(false); }
  }
  useEffect(() => { void checkApps(); }, []);

  async function inspectApp(app: AppConnection) {
    if (!app.id) return;
    if (selectedApp?.id === app.id) { setSelectedApp(null); setCapabilities(null); setCapabilityError(''); return; }
    setSelectedApp(app); setCapabilities(null); setCapabilityError(''); setCapabilityBusy(true);
    setLoginStart(null); setLoginState(null); setLoginError(''); setScopes('');
    try { setCapabilities(await api<AppCapabilities>(`/api/apps/${encodeURIComponent(app.id)}/capabilities`)); }
    catch (reason) { setCapabilityError((reason as Error).message); }
    finally { setCapabilityBusy(false); }
  }

  async function reloadRuntime() {
    setReloading(true); setAppError('');
    try { await api('/api/apps/reload', 'POST', {}); await checkApps(); }
    catch (reason) { setAppError((reason as Error).message); }
    finally { setReloading(false); }
  }

  async function startLogin(app: AppConnection) {
    if (!app.id) return;
    setLoginBusy(true); setLoginError(''); setLoginState(null);
    try {
      const body = scopes.trim() ? { scopes: scopes.split(',').map(scope => scope.trim()).filter(Boolean) } : {};
      const started = await api<AppLoginStart>(`/api/apps/${encodeURIComponent(app.id)}/auth`, 'POST', body);
      setLoginStart(started);
      window.open(started.authorizationUrl, '_blank', 'noopener,noreferrer');
      if (started.loginId) void pollLogin(started.loginId);
      else setLoginBusy(false);
    } catch (reason) { setLoginError((reason as Error).message); setLoginBusy(false); }
  }

  async function pollLogin(loginId: string) {
    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const state = await api<AppLoginState>(`/api/apps/auth/${encodeURIComponent(loginId)}`);
        setLoginState(state);
        if (state.status === 'pending') continue;
        setLoginBusy(false);
        if (state.status === 'success') await checkApps();
        else setLoginError(state.error || 'Sign-in did not complete.');
        return;
      } catch (reason) { setLoginError((reason as Error).message); setLoginBusy(false); return; }
    }
    setLoginError('Sign-in timed out. Start it again when you are ready.');
    setLoginBusy(false);
  }

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
          <h3>Connected apps <Button variant="quiet" size="sm" loading={checkingApps} onClick={() => void checkApps()}><RefreshCw size={13} />Refresh</Button><Button variant="quiet" size="sm" loading={reloading} onClick={() => void reloadRuntime()}><RotateCw size={13} />Reload runtime</Button></h3>
          <p className="connections-note">MCP connections configured in Codex or OpenCode on this host. Tool lists are read from the runtime, not guessed.</p>
          {appNotice && <p className="connections-notice" role="status">{appNotice}</p>}
          {appError ? <p className="connections-error">{appError}</p> : !shownApps.length ? <p className="connections-empty">{checkingApps ? 'Checking app connections…' : needle ? 'No apps match.' : 'No app connections found. Add MCP servers to Codex or OpenCode on the host, then refresh.'}</p> : <>
            <div className="connections-app-grid">{shownApps.map(app => <button type="button" className={`connection-app-card ${selectedApp?.id === app.id ? 'is-selected' : ''}`} key={app.id || `${app.providerId || 'runtime'}:${app.name}`} onClick={() => void inspectApp(app)} aria-expanded={selectedApp?.id === app.id} aria-controls="connection-app-detail"><span className={`connection-dot ${app.status === 'connected' ? 'is-connected' : ''}`} /><div><strong>{app.name.replace(/[_-]/g, ' ')}</strong><small>{app.status === 'connected' ? `${app.toolsCount === undefined ? 'Tool list unavailable' : `${app.toolsCount} ${app.toolsCount === 1 ? 'tool' : 'tools'}`}${app.authStatus ? ` · ${app.authStatus}` : ''}` : app.status === 'needs-auth' ? 'Sign-in needed' : app.error ? 'Check failed' : app.status.replace('-', ' ')}</small></div></button>)}</div>
            {selectedApp && <div className="connection-app-detail" id="connection-app-detail">
              <div className="connection-app-detail-head"><div><strong>{selectedApp.name.replace(/[_-]/g, ' ')}</strong><small>{selectedApp.providerId || 'runtime'} · {selectedApp.transport || 'unknown transport'}{selectedApp.authStatus ? ` · ${selectedApp.authStatus}` : ''}</small></div><Button variant="quiet" size="sm" onClick={() => { setSelectedApp(null); setCapabilities(null); setCapabilityError(''); }}>Close</Button></div>
              {selectedApp.providerId === 'codex' && <div className="connection-auth-box">
                <div className="connection-auth-field"><label htmlFor="connection-app-scopes">Scopes <span>optional, comma-separated</span></label><input id="connection-app-scopes" value={scopes} onChange={event => setScopes(event.target.value)} placeholder="read, write" disabled={loginBusy} autoComplete="off" /></div>
                <div className="connection-auth-actions">
                  <Button variant="secondary" size="sm" loading={loginBusy} onClick={() => void startLogin(selectedApp)}>{selectedApp.status === 'needs-auth' ? 'Sign in' : 'Sign in again'}</Button>
                  {loginStart && <a href={loginStart.authorizationUrl} target="_blank" rel="noreferrer noopener">Open sign-in page</a>}
                </div>
                {loginState?.status === 'pending' && <p className="connections-note" role="status">Waiting for sign-in to finish in your browser…</p>}
                {loginState?.status === 'success' && <p className="connections-note" role="status">Signed in. Refreshing app status…</p>}
                {loginError && <p className="connections-error" role="alert">{loginError}</p>}
              </div>}
              {capabilityBusy ? <p className="connections-note">Reading capabilities from the runtime…</p> : capabilityError ? <p className="connections-error">{capabilityError}</p> : capabilities ? <>
                {!capabilities.supported ? <p className="connections-notice">{capabilities.error}</p> : <>
                  {capabilities.error && <p className="connections-notice">{capabilities.error}</p>}
                  <div className="connection-capability-grid">
                    <span><strong>{capabilities.tools ? capabilities.tools.length : '—'}</strong><small>Tools</small></span>
                    <span><strong>{capabilities.resources ? capabilities.resources.length : '—'}</strong><small>Resources</small></span>
                    <span><strong>{capabilities.serverInfo?.version || '—'}</strong><small>Server version</small></span>
                  </div>
                  <p className="connections-note">Prompts {capabilities.promptsSupported ? 'are advertised, but the Codex runtime does not expose a prompt list.' : 'are not advertised by this server.'}</p>
                  {capabilities.tools?.length ? <ul className="connection-tool-list">{capabilities.tools.slice(0, 100).map(tool => <li key={tool.name}><strong>{tool.title || tool.name}</strong>{tool.description && <small>{tool.description}</small>}{schemaFieldNames(tool.inputSchema).length > 0 && <code>{schemaFieldNames(tool.inputSchema).join(' · ')}</code>}</li>)}</ul> : capabilities.tools ? <p className="connections-empty">No tools advertised.</p> : null}
                  {capabilities.tools && capabilities.tools.length > 100 && <p className="connections-note">Showing the first 100 tools.</p>}
                  {capabilities.toolsTruncated && <p className="connections-notice">The runtime returned more than 500 tools; the list is truncated.</p>}
                </>}
              </> : null}
            </div>}
          </>}
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
