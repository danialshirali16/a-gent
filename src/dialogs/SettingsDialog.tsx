import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Database, Download, Keyboard, KeyRound, Laptop, Moon, Palette, Plug, Plus, RefreshCw, RotateCcw, Search, Sparkles, Sun, Trash2, Upload } from 'lucide-react';
import type { DeviceInfo, Settings, WorkspaceState } from '../../shared/types';
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

export function SettingsDialog({ state, api, connection, onError, onRefresh, onClose, onOpenConnections, onDeviceToken, onDeviceRevoked }: {
  state: WorkspaceState;
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
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState('');
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
    } catch (reason) { setDeviceError((reason as Error).message); }
    finally { setDeviceBusy(''); }
  }

  async function rotateDevice(device: DeviceInfo) {
    setDeviceBusy(device.id); setDeviceError('');
    try {
      const rotated = await api<{ device: DeviceInfo; token: string }>(`/api/devices/${device.id}/rotate`, 'POST', {});
      setDevices(previous => previous.map(item => item.id === device.id ? { ...item, ...rotated.device, current: item.current } : item));
      setNewToken({ name: rotated.device.name, token: rotated.token });
      if (device.current) onDeviceToken(rotated.token);
    } catch (reason) { setDeviceError((reason as Error).message); }
    finally { setDeviceBusy(''); }
  }

  async function revokeDevice(device: DeviceInfo) {
    setDeviceBusy(device.id); setDeviceError('');
    try {
      const revoked = await api<DeviceInfo>(`/api/devices/${device.id}`, 'DELETE');
      if (device.current) { onDeviceRevoked(); return; }
      setDevices(previous => previous.map(item => item.id === device.id ? { ...item, ...revoked, current: item.current } : item));
      setConfirmRevoke(null);
    } catch (reason) { setDeviceError((reason as Error).message); }
    finally { setDeviceBusy(''); }
  }

  async function copyDeviceToken() {
    if (!newToken) return;
    try { await navigator.clipboard.writeText(newToken.token); setTokenCopied(true); setTimeout(() => setTokenCopied(false), 1500); } catch { /* clipboard optional */ }
  }

  return <Modal title="Settings" onClose={onClose} className="modal-settings">
    <div className="settings-shell">
      <aside className="settings-nav">
        <label className="settings-search"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search settings…" aria-label="Search settings" /></label>
        {visible.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'is-active' : ''} onClick={() => setSection(id)}><Icon size={15} />{label}</button>)}
        {!visible.length && <p className="settings-nav-empty">No settings match.</p>}
      </aside>
      <div className="settings-body">
        {section === 'appearance' && <>
          <h2>Appearance</h2>
          <p className="settings-lead">Theme, density, and how much agent activity appears in conversations.</p>
          <div className="settings-group">
            <h3>Theme</h3>
            <div className="theme-options">{([{ id: 'dark', label: 'Dark', Icon: Moon }, { id: 'light', label: 'Light', Icon: Sun }, { id: 'system', label: 'System', Icon: Laptop }] as const).map(({ id, label, Icon }) => <button key={id} aria-pressed={state.settings.theme === id} className={state.settings.theme === id ? 'selected' : ''} onClick={() => void update({ theme: id })}><Icon size={18} /><span>{label}</span>{state.settings.theme === id && <Check size={13} />}</button>)}</div>
          </div>
          <div className="settings-group">
            <h3>Tool stream</h3>
            <div className="theme-options tool-stream-options">{(['compact', 'verbose', 'hidden'] as const).map(value => <button key={value} aria-pressed={toolStreamView === value} className={toolStreamView === value ? 'selected' : ''} onClick={() => void update({ toolStreamView: value })}><span>{value === 'compact' ? 'Compact' : value === 'verbose' ? 'Verbose' : 'Hidden'}</span>{toolStreamView === value && <Check size={13} />}</button>)}</div>
            <p className="settings-hint">Compact shows a summary, verbose opens every step, and hidden removes tool activity from conversations.</p>
          </div>
        </>}

        {section === 'models' && <>
          <h2>Models</h2>
          <p className="settings-lead">A Gent uses the Codex installation on this computer and any OpenAI-compatible endpoint you add.</p>
          <div className="settings-group">
            <div className="settings-model-row"><div><strong>Codex</strong><small>Local Codex account and models</small></div><span className="settings-model-status">Connected on this host</span></div>
            <div className="settings-model-row"><div><strong>Default model</strong><small>{state.settings.defaultProviderId} · {state.settings.defaultModelId || 'Provider default'}</small></div></div>
            <button className="button secondary small" onClick={onOpenConnections}><Plug size={14} />Manage models and connections</button>
          </div>
        </>}

        {section === 'devices' && <>
          <h2>Devices</h2>
          <p className="settings-lead">Pairing tokens let another computer or phone reach this host. Each token can be rotated or revoked independently.</p>
          {deviceError && <p className="form-error" role="alert">{deviceError}</p>}
          {newToken && <div className="settings-group device-token-reveal">
            <h3>New token for {newToken.name}</h3>
            <p className="settings-hint">Copy it now. A Gent will not show this token again.</p>
            <div className="device-token-value"><code>{newToken.token}</code><button className="button secondary small" onClick={() => void copyDeviceToken()}>{tokenCopied ? <Check size={13} /> : <Copy size={13} />}{tokenCopied ? 'Copied' : 'Copy'}</button></div>
            <button className="button quiet small" onClick={() => setNewToken(null)}>Done</button>
          </div>}
          {isAdmin && <div className="settings-group">
            <h3>Create a pairing token</h3>
            <div className="device-create-row">
              <input value={deviceName} onChange={event => setDeviceName(event.target.value)} placeholder="Device name" aria-label="Device name" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void createDevice(); } }} />
              <button className="button secondary small" disabled={!deviceName.trim() || deviceBusy === 'create'} onClick={() => void createDevice()}>{deviceBusy === 'create' ? <Spinner size={13} /> : <Plus size={13} />}Create</button>
            </div>
            <p className="settings-hint">Give each phone or computer its own token so it can be revoked separately.</p>
          </div>}
          <div className="settings-group">
            <h3>{isAdmin ? 'All devices' : 'This device'}</h3>
            {devicesLoading ? <div className="device-loading"><Spinner size={14} />Loading devices…</div> : !devices.length ? <p className="settings-hint">No device tokens yet.</p> : <div className="device-list">{devices.map(device => <div className={`device-row ${device.revokedAt ? 'is-revoked' : ''}`} key={device.id}>
              <div className="device-row-main">
                <strong>{device.name}{device.current && <span className="device-badge is-current">Current</span>}{device.revokedAt && <span className="device-badge is-revoked">Revoked</span>}</strong>
                <small>Created {formatDate(device.createdAt)}{device.lastUsedAt ? ` · Last used ${formatDate(device.lastUsedAt)}` : ''}</small>
              </div>
              {!device.revokedAt && <div className="device-actions">
                <button className="button quiet small" disabled={!!deviceBusy} onClick={() => void rotateDevice(device)}>{deviceBusy === device.id ? <Spinner size={12} /> : <RefreshCw size={12} />}Rotate</button>
                {confirmRevoke === device.id ? <>
                  <button className="button danger small" disabled={!!deviceBusy} onClick={() => void revokeDevice(device)}>{deviceBusy === device.id ? <Spinner size={12} /> : <Trash2 size={12} />}Confirm revoke</button>
                  <button className="button quiet small" onClick={() => setConfirmRevoke(null)}>Cancel</button>
                </> : <button className="button quiet small" disabled={!!deviceBusy} onClick={() => setConfirmRevoke(device.id)}><Trash2 size={12} />Revoke</button>}
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
            <div className="setting-row"><span><strong>Export workspace</strong><small>Save agents, conversations, groups, and schedules as JSON.</small></span><button className="button secondary small" onClick={async () => { try { downloadJson(await api('/api/export'), 'a-gent-workspace.json'); } catch (reason) { onError((reason as Error).message); } }}><Download size={14} />Export</button></div>
            <div className="setting-row"><span><strong>Import workspace</strong><small>Merge a previous A Gent export into this workspace.</small></span><button className="button secondary small" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Spinner size={14} /> : <Upload size={14} />}Import</button><input ref={input} type="file" accept="application/json,.json" hidden onChange={async event => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); try { if (file.size > 32 * 1024 * 1024) throw new Error('Choose an export smaller than 32 MB.'); await api('/api/import', 'POST', JSON.parse(await file.text())); await onRefresh(); } catch (reason) { onError((reason as Error).message); } finally { setBusy(false); event.target.value = ''; } }} /></div>
          </div>
          {archived.length > 0 && <div className="settings-group">
            <h3>Archived conversations</h3>
            {archived.map(chat => <div className="setting-row" key={chat.id}><span><strong>{chat.title}</strong><small>{formatDate(chat.updatedAt)}</small></span><button className="button quiet small" onClick={async () => { try { await api(`/api/conversations/${chat.id}`, 'PATCH', { archived: false }); } catch (reason) { onError((reason as Error).message); } }}><RotateCcw size={14} />Restore</button></div>)}
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
  </Modal>;
}
