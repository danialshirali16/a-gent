import { providerReadiness, readinessLabel } from '../../shared/providers';
import { Input } from '../ui/Input';
import { Field } from '../ui/Field';
import { Switch } from '../ui/Checkbox';
import { SegmentedControl } from '../ui/Tabs';
import { ConfirmDialog } from '../ui/Dialog';
import { Badge } from '../ui/Badge';
import { Alert, useToast } from '../ui/Alert';
import { SearchField } from '../ui/Search';
import { Button } from '../ui/Button';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Database, Download, Keyboard, KeyRound, Laptop, Moon, Palette, Plug, Plus, RefreshCw, RotateCcw, Sparkles, Sun, Trash2, Upload } from 'lucide-react';
import type { DeviceInfo, ProviderInfo, Settings, WorkspaceState } from '../../shared/types';
import type { Connection } from '../api';
import type { Api } from '../dialogs';
import { Mark, Modal, Spinner, downloadJson, formatDate } from '../components';

type SettingsSection = 'appearance' | 'models' | 'devices' | 'data' | 'shortcuts' | 'about';

const sections: Array<{ id: SettingsSection; label: string; icon: typeof Palette; keywords: string }> = [
  { id: 'appearance', label: 'Appearance', icon: Palette, keywords: 'theme dark light system activity tool stream' },
  { id: 'models', label: 'Models', icon: Plug, keywords: 'provider codex ollama openai connection' },
  { id: 'devices', label: 'Devices', icon: KeyRound, keywords: 'pairing token security rotate revoke device host' },
  { id: 'data', label: 'Data', icon: Database, keywords: 'export import archive workspace backup' },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard, keywords: 'keyboard keys command' },
  { id: 'about', label: 'About', icon: Sparkles, keywords: 'version license local' },
];

export function SettingsDialog({ state, providers, api, connection, onError, onRefresh, onClose, onOpenConnections, onDeviceToken, onDeviceRevoked }: {
  state: WorkspaceState;
  providers: ProviderInfo[];
  api: Api;
  connection: Connection;
  onError: (error: string) => void;
  onRefresh: () => Promise<unknown>;
  onClose: () => void;
  onOpenConnections: () => void;
  onDeviceToken: (token: string) => void;
  onDeviceRevoked: () => void;
}) {
  const [section, setSection] = useState<SettingsSection>('appearance');
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState('');
  const [deviceAction, setDeviceAction] = useState<'rotate' | 'revoke' | null>(null);
  const [deviceError, setDeviceError] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [newToken, setNewToken] = useState<{ name: string; token: string } | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const archived = state.conversations.filter(chat => chat.archived);
  const toolStreamView = state.settings.toolStreamView ?? (state.settings.showActivity === false ? 'hidden' : 'compact');
  const visible = sections.filter(item => !query || `${item.label} ${item.keywords}`.toLowerCase().includes(query.toLowerCase()));

  async function update(settings: Partial<Settings>) {
    try { await api('/api/settings', 'PATCH', settings); } catch (reason) { onError((reason as Error).message); }
  }

  useEffect(() => {
    if (section !== 'devices') return;
    let cancelled = false;
    setDevicesLoading(true); setDeviceError('');
    Promise.all([
      api<DeviceInfo[]>('/api/devices'),
      api<{ admin: boolean; device: DeviceInfo | null }>('/api/auth'),
    ]).then(([list, auth]) => {
      if (cancelled) return;
      setDevices(list); setIsAdmin(auth.admin);
    }).catch(reason => {
      if (!cancelled) setDeviceError((reason as Error).message);
    }).finally(() => {
      if (!cancelled) setDevicesLoading(false);
    });
    return () => { cancelled = true; };
  }, [section, api]);

  async function createDevice() {
    const name = deviceName.trim();
    if (!name) return;
    setDeviceBusy('create'); setDeviceError('');
    try {
      const created = await api<{ device: DeviceInfo; token: string }>('/api/devices', 'POST', { name });
      setDevices(previous => [...previous, created.device]);
      setNewToken({ name: created.device.name, token: created.token });
      setDeviceName('');
      toast({ title: 'Pairing token created', description: `Copy it now for ${created.device.name}.`, tone: 'success' });
    } catch (reason) { setDeviceError((reason as Error).message); }
    finally { setDeviceBusy(''); }
  }

  async function rotateDevice(device: DeviceInfo) {
    setDeviceBusy(device.id); setDeviceAction('rotate'); setDeviceError('');
    try {
      const rotated = await api<{ device: DeviceInfo; token: string }>(`/api/devices/${device.id}/rotate`, 'POST', {});
      setDevices(previous => previous.map(item => item.id === device.id ? { ...item, ...rotated.device, current: item.current } : item));
      setNewToken({ name: rotated.device.name, token: rotated.token });
      if (device.current) onDeviceToken(rotated.token);
      toast({ title: 'Device token rotated', description: `${device.name} has a new pairing token.`, tone: 'success' });
    } catch (reason) { setDeviceError((reason as Error).message); }
    finally { setDeviceBusy(''); setDeviceAction(null); }
  }

  async function revokeDevice(device: DeviceInfo) {
    setDeviceBusy(device.id); setDeviceAction('revoke'); setDeviceError('');
    try {
      const revoked = await api<DeviceInfo>(`/api/devices/${device.id}`, 'DELETE');
      if (device.current) { onDeviceRevoked(); return; }
      setDevices(previous => previous.map(item => item.id === device.id ? { ...item, ...revoked, current: item.current } : item));
      setConfirmRevoke(null);
      toast({ title: 'Device revoked', description: `${device.name} can no longer connect.`, tone: 'success' });
    } catch (reason) { setDeviceError((reason as Error).message); setConfirmRevoke(null); }
    finally { setDeviceBusy(''); setDeviceAction(null); }
  }

  async function copyDeviceToken() {
    if (!newToken) return;
    try { await navigator.clipboard.writeText(newToken.token); setTokenCopied(true); setTimeout(() => setTokenCopied(false), 1500); toast({ title: 'Pairing token copied', tone: 'success' }); } catch { toast({ title: 'Clipboard unavailable', tone: 'danger' }); }
  }

  return <Modal title="Settings" onClose={onClose} className="modal-settings" backLabel="Back to app">
    <div className="settings-shell">
      <aside className="settings-nav">
        <SearchField className="settings-search" size="sm" value={query} onChange={setQuery} label="Search settings" placeholder="Search settings…" />
        <p className="settings-nav-label">Personal workspace</p>
        {visible.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'is-active' : ''} aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}><Icon size={16} />{label}</button>)}
        {!visible.length && <p className="settings-nav-empty">No settings match.</p>}
      </aside>
      <div className="settings-body">
        {section === 'appearance' && <>
          <h2>Appearance</h2>
          <p className="settings-lead">Make A Gent feel at home.</p>
          <h3 className="settings-section-label">Preferences</h3>
          <section className="settings-group settings-preferences" aria-label="Appearance preferences">
            <div className="setting-row">
              <span><strong>Theme</strong><small>Choose a look, or follow your device.</small></span>
              <SegmentedControl options={([{ id: 'dark', label: 'Dark', icon: <Moon size={15} /> }, { id: 'light', label: 'Light', icon: <Sun size={15} /> }, { id: 'system', label: 'System', icon: <Laptop size={15} /> }])} value={state.settings.theme} onChange={id => void update({ theme: id as Settings['theme'] })} ariaLabel="Theme" />
            </div>
            <div className="setting-row">
              <Switch label="Show agent activity" description="See commands, file changes, and progress in conversations." checked={toolStreamView !== 'hidden'} onChange={event => void update({ showActivity: event.target.checked, toolStreamView: event.target.checked ? (toolStreamView === 'hidden' ? 'compact' : toolStreamView) : 'hidden' })} />
            </div>
            <div className="setting-row">
              <span><strong>Tool stream detail</strong><small>Choose how much detail appears when activity is shown.</small></span>
              <SegmentedControl options={[{ id: 'compact', label: 'Compact' }, { id: 'verbose', label: 'Verbose' }]} value={toolStreamView === 'hidden' ? '' : toolStreamView} onChange={id => void update({ toolStreamView: id as 'compact' | 'verbose' })} ariaLabel="Tool stream detail" disabled={toolStreamView === 'hidden'} />
            </div>
          </section>
          <p className="settings-hint">Compact keeps a summary of each step. Verbose opens the details.</p>
        </>}

        {section === 'models' && <>
          <h2>Models</h2>
          <p className="settings-lead">Use the agents and model connections available on this host.</p>
          <div className="settings-group">
            {providers.map(provider => <div className="settings-model-row" key={provider.id}><div><strong>{provider.name}</strong><small>{provider.detail}</small></div><Badge tone={providerReadiness(provider) === 'ready' ? 'success' : providerReadiness(provider) === 'error' ? 'danger' : providerReadiness(provider) === 'needs-auth' ? 'warning' : providerReadiness(provider) === 'checking' ? 'info' : 'neutral'} dot>{readinessLabel(provider)}</Badge></div>)}
            <div className="settings-model-row"><div><strong>Default model</strong><small>{state.settings.defaultProviderId} · {state.settings.defaultModelId || 'Provider default'}</small></div></div>
            <Button variant="secondary" size="sm" onClick={onOpenConnections}><Plug size={14} />Manage models and connections</Button>
          </div>
        </>}

        {section === 'devices' && <>
          <h2>Devices</h2>
          <p className="settings-lead">Pairing tokens let another computer or phone reach this host. Each token can be rotated or revoked independently.</p>
          {deviceError && <Alert tone="danger">{deviceError}</Alert>}
          {newToken && <div className="settings-group device-token-reveal">
            <h3>New token for {newToken.name}</h3>
            <p className="settings-hint">Copy it now. A Gent will not show this token again.</p>
            <div className="device-token-value"><code>{newToken.token}</code><Button variant="secondary" size="sm" onClick={() => void copyDeviceToken()}>{tokenCopied ? <Check size={13} /> : <Copy size={13} />}{tokenCopied ? 'Copied' : 'Copy'}</Button></div>
            <Button variant="quiet" size="sm" onClick={() => setNewToken(null)}>Done</Button>
          </div>}
          {isAdmin && <div className="settings-group">
            <h3>Create a pairing token</h3>
            <div className="device-create-row">
              <Field label="Device name" labelHidden className="device-create-field"><Input value={deviceName} onChange={event => setDeviceName(event.target.value)} placeholder="Device name" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void createDevice(); } }} /></Field>
              <Button variant="secondary" size="sm" loading={deviceBusy === 'create'} disabled={!deviceName.trim()} onClick={() => void createDevice()}><Plus size={13} />Create</Button>
            </div>
            <p className="settings-hint">Give each phone or computer its own token so it can be revoked separately.</p>
          </div>}
          <div className="settings-group">
            <h3>{isAdmin ? 'All devices' : 'This device'}</h3>
            {devicesLoading ? <div className="device-loading"><Spinner size={14} />Loading devices…</div> : !devices.length ? <p className="settings-hint">No device tokens yet.</p> : <div className="device-list">{devices.map(device => <div className={`device-row ${device.revokedAt ? 'is-revoked' : ''}`} key={device.id}>
              <div className="device-row-main">
                <strong>{device.name}{device.current && <Badge tone="info">Current</Badge>}{device.revokedAt && <Badge tone="danger">Revoked</Badge>}</strong>
                <small>Created {formatDate(device.createdAt)}{device.lastUsedAt ? ` · Last used ${formatDate(device.lastUsedAt)}` : ''}</small>
              </div>
              {!device.revokedAt && <div className="device-actions">
                <Button variant="quiet" size="sm" loading={deviceBusy === device.id && deviceAction === 'rotate'} disabled={!!deviceBusy} onClick={() => void rotateDevice(device)}><RefreshCw size={12} />Rotate</Button>
                <Button variant="quiet" size="sm" disabled={!!deviceBusy} onClick={() => setConfirmRevoke(device.id)}><Trash2 size={12} />Revoke</Button>
              </div>}
            </div>)}</div>}
          </div>
          <div className="settings-group">
            <h3>Administrator token</h3>
            <p className="settings-hint">The administrator token in this host’s data directory can manage every device. Keep it private. Revoking this device returns A Gent to the connection screen; the next launch creates a fresh device token.</p>
            <p className="settings-hint">Host: {connection.url || 'This computer'}</p>
          </div>
        </>}

        {section === 'data' && <>
          <h2>Your data</h2>
          <p className="settings-lead">Everything is stored on this host. Export a copy or merge a previous workspace.</p>
          <div className="settings-group">
            <div className="setting-row"><span><strong>Export workspace</strong><small>Save agents, conversations, groups, and schedules as JSON.</small></span><Button variant="secondary" size="sm" onClick={async () => { try { downloadJson(await api('/api/export'), 'a-gent-workspace.json'); } catch (reason) { onError((reason as Error).message); } }}><Download size={14} />Export</Button></div>
            <div className="setting-row"><span><strong>Import workspace</strong><small>Merge a previous A Gent export into this workspace.</small></span><Button variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}><Upload size={14} />Import</Button><input ref={input} type="file" accept="application/json,.json" hidden onChange={async event => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); try { if (file.size > 32 * 1024 * 1024) throw new Error('Choose an export smaller than 32 MB.'); await api('/api/import', 'POST', JSON.parse(await file.text())); await onRefresh(); } catch (reason) { onError((reason as Error).message); } finally { setBusy(false); event.target.value = ''; } }} /></div>
          </div>
          {archived.length > 0 && <div className="settings-group">
            <h3>Archived conversations</h3>
            {archived.map(chat => <div className="setting-row" key={chat.id}><span><strong>{chat.title}</strong><small>{formatDate(chat.updatedAt)}</small></span><Button variant="quiet" size="sm" onClick={async () => { try { await api(`/api/conversations/${chat.id}`, 'PATCH', { archived: false }); } catch (reason) { onError((reason as Error).message); } }}><RotateCcw size={14} />Restore</Button></div>)}
          </div>}
        </>}

        {section === 'shortcuts' && <>
          <h2>Shortcuts</h2>
          <p className="settings-lead">Keyboard shortcuts available from anywhere in A Gent.</p>
          <div className="settings-group settings-shortcuts">
            {[['Search conversations', '⌘ K'], ['New conversation', '⌘ N'], ['Toggle side panel', '⌘ \\'], ['Send message', '↵'], ['New line', '⇧ ↵'], ['Close menu or panel', 'Esc']].map(([label, keys]) => <div className="settings-shortcut" key={label}><span>{label}</span><kbd>{keys}</kbd></div>)}
          </div>
        </>}

        {section === 'about' && <>
          <h2>About A Gent</h2>
          <p className="settings-lead">A local-first personal workspace for connected AI agents.</p>
          <div className="settings-about"><Mark size={42} /><div><strong>A Gent</strong><span>Version 0.1.0 · Local-first</span><small>Your agents, conversations, and workspace data stay on this host.</small></div></div>
          <div className="settings-group">
            <div className="setting-row"><span><strong>Workspace</strong><small>Agents, conversations, groups, and scheduled tasks</small></span></div>
            <div className="setting-row"><span><strong>Models</strong><small>Codex, Ollama, and OpenAI-compatible endpoints</small></span></div>
            <div className="setting-row"><span><strong>No cloud account</strong><small>No Reason account, billing, or hosted workspace is used.</small></span></div>
          </div>
        </>}
      </div>
    </div>
    {confirmRevoke && (() => {
      const device = devices.find(item => item.id === confirmRevoke);
      if (!device) return null;
      return <ConfirmDialog
        title={device.current ? 'Revoke this device?' : `Revoke ${device.name}?`}
        description={device.current
          ? 'This device will return to the connection screen. The next launch creates a fresh device token.'
          : <>The token for <strong>{device.name}</strong> stops working immediately. You can create a new one at any time.</>}
        confirmLabel="Revoke device"
        busy={deviceBusy === device.id && deviceAction === 'revoke'}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => void revokeDevice(device)}
      />;
    })()}
  </Modal>;
}
