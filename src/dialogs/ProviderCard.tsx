import { useState } from 'react';
import { CheckCircle2, Globe, Monitor, RefreshCw, Server, Terminal } from 'lucide-react';
import { isProviderReady, MODEL_ID_LIMIT, providerReadiness, readinessLabel } from '../../shared/providers';
import type { ProviderInfo } from '../../shared/types';
import type { Api } from '../dialogs';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';

export function ProviderCard({ provider, api, onRefresh }: { provider: ProviderInfo; api: Api; onRefresh: () => Promise<unknown> }) {
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl || (provider.kind === 'ollama' ? 'http://127.0.0.1:11434' : ''));
  const [key, setKey] = useState(''); const [modelId, setModelId] = useState(provider.modelId || ''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [testResult, setTestResult] = useState('');
  const readiness = providerReadiness(provider);
  const [expanded, setExpanded] = useState(readiness !== 'ready');
  const tone = readiness === 'ready' ? 'success' : readiness === 'error' ? 'danger' : readiness === 'needs-auth' ? 'warning' : readiness === 'checking' ? 'info' : 'neutral';
  const Icon = provider.kind === 'codex' ? Monitor : provider.kind === 'opencode' ? Terminal : provider.kind === 'ollama' ? Server : Globe;
  async function connect() {
    setBusy(true); setError('');
    try {
      const result = await api<ProviderInfo>(`/api/providers/${provider.id}/connect`, 'POST', { ...(baseUrl ? { baseUrl } : {}), ...(key ? { apiKey: key } : {}), ...(modelId ? { modelId } : {}) });
      setKey('');
      if (result.status === 'error' || result.readiness === 'error') { setError(result.detail || 'The provider could not be connected.'); await onRefresh(); return; }
      await onRefresh(); setExpanded(false);
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true); setError('');
    try { await api(`/api/providers/${provider.id}/disconnect`, 'POST', {}); setKey(''); await onRefresh(); setExpanded(true); }
    catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  async function testLive() {
    const liveModel = modelId || provider.models[0]?.id;
    if (!liveModel) { setError('Choose a model before testing.'); return; }
    setBusy(true); setError(''); setTestResult('');
    try {
      const result = await api<{ ok: boolean; response?: string; error?: string; latencyMs: number }>(`/api/providers/${provider.id}/test`, 'POST', { modelId: liveModel, confirm: true });
      setTestResult(result.ok ? `Verified in ${result.latencyMs} ms: ${result.response || 'OK'}` : `Test failed: ${result.error || 'No response'}`);
      await onRefresh();
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  return <article className="provider-card"><div className="provider-heading"><span className="provider-symbol"><Icon size={23} /></span><div><h2>{provider.name}</h2><Badge tone={tone} dot>{readinessLabel(provider)}</Badge></div><Button variant="quiet" size="sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide details' : 'Manage'}</Button></div><p className="provider-detail">{provider.detail || (provider.kind === 'codex' ? 'Use Codex and its sign-in on the host computer.' : provider.kind === 'opencode' ? 'Use OpenCode and its sign-in on the host computer.' : 'Connect your own model endpoint.')}</p>{isProviderReady(provider) && <div className="model-summary"><CheckCircle2 size={14} /><span>{provider.models.length ? `${provider.models.length} ${provider.models.length === 1 ? 'model' : 'models'} available` : 'Provider default model'}</span></div>}
    {expanded && <div className="provider-settings">{provider.kind === 'codex' ? <p className="field-help">A Gent uses the Codex installation and account on your host. If needed, run <code>codex login</code> there, then check the connection.</p> : provider.kind === 'opencode' ? <p className="field-help">A Gent uses the OpenCode CLI and the account already signed in there. If needed, run <code>opencode auth login</code> there, then check the connection.</p> : <><Field label="Base URL" description="The endpoint A Gent should reach."><Input type="url" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder={provider.kind === 'ollama' ? 'http://127.0.0.1:11434' : 'https://your-provider.example/v1'} /></Field>{provider.kind === 'openai-compatible' && <><Field label="API key" description="Kept in the host’s memory for this session."><Input type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} placeholder="For this host session" /></Field><Field label="Model ID" optional description="Leave blank if your provider lists models automatically."><Input value={modelId} maxLength={MODEL_ID_LIMIT} onChange={event => setModelId(event.target.value)} placeholder="Optional if your provider lists models" /></Field></>}</>}{error && <p className="form-error" role="alert">{error}</p>}<Button variant="secondary" onClick={() => void connect()} loading={busy}><RefreshCw size={15} />{provider.kind === 'codex' || provider.kind === 'opencode' ? 'Check connection' : 'Connect provider'}</Button><Button variant="quiet" onClick={() => void disconnect()} disabled={busy}>{provider.kind === 'codex' || provider.kind === 'opencode' ? 'Forget connection' : 'Disconnect'}</Button>{provider.models.length > 0 && <Button variant="quiet" title="Sends a live model request and may use account credits." onClick={() => void testLive()} disabled={busy}>Test model</Button>}{testResult && <p className="field-help" role="status">{testResult}</p>}</div>}
  </article>;
}
