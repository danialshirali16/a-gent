import { Button } from '../ui/Button';
import { Fragment, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Folder, Link2, RefreshCw } from 'lucide-react';
import type { WorkspaceFiles } from '../../shared/types';
import type { Api } from '../dialogs';
import { Spinner } from '../components';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesPanel({ api, conversationId, agentId }: { api: Api; conversationId?: string; agentId?: string }) {
  const [path, setPath] = useState('');
  const [data, setData] = useState<WorkspaceFiles>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(nextPath: string) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (conversationId) params.set('conversationId', conversationId);
      else if (agentId) params.set('agentId', agentId);
      if (nextPath) params.set('path', nextPath);
      const result = await api<WorkspaceFiles>(`/api/workspace/files?${params.toString()}`);
      setData(result); setPath(result.path);
    } catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!conversationId && !agentId) return;
    setData(undefined); setPath('');
    void load('');
  }, [conversationId, agentId]);

  if (!conversationId && !agentId) return <div className="reason-sidepanel-empty">Choose an agent to browse its workspace.</div>;

  const segments = (data?.path || '').split('/').filter(Boolean);
  const rootName = data?.root.split('/').filter(Boolean).pop() || 'Workspace';
  const goBack = () => { const parts = path.split('/').filter(Boolean); parts.pop(); void load(parts.join('/')); };

  return <div className="reason-files-panel" aria-label="Workspace files">
    <div className="reason-files-toolbar">
      <button className="reason-files-icon" aria-label="Back to parent folder" disabled={!path || loading} onClick={goBack}><ChevronLeft size={14} /></button>
      <div className="reason-files-breadcrumb">
        <button onClick={() => void load('')}>{rootName}</button>
        {segments.map((segment, index) => <Fragment key={`${segment}-${index}`}>
          <span>/</span>
          <button onClick={() => void load(segments.slice(0, index + 1).join('/'))}>{segment}</button>
        </Fragment>)}
      </div>
      <button className="reason-files-icon" aria-label="Refresh files" disabled={loading} onClick={() => void load(path)}><RefreshCw size={13} className={loading ? 'spin' : undefined} /></button>
    </div>
    {loading && !data ? <div className="reason-files-loading"><Spinner size={14} />Reading workspace…</div> : error ? <div className="reason-files-error"><p>{error}</p><Button variant="quiet" size="sm" onClick={() => void load(path)}>Try again</Button></div> : !data?.entries.length ? <div className="reason-sidepanel-empty">This folder is empty.</div> : <div className="reason-file-list">
      {data.entries.map(entry => entry.type === 'directory'
        ? <button key={entry.name} className="reason-file-row is-directory" onClick={() => void load([path, entry.name].filter(Boolean).join('/'))}><Folder size={14} /><span>{entry.name}</span><ChevronRight size={12} /></button>
        : <div key={entry.name} className="reason-file-row"><FileText size={14} /><span>{entry.name}</span>{entry.type === 'symlink' && <Link2 size={11} aria-label="Symbolic link" />}{entry.size !== undefined && <small>{formatSize(entry.size)}</small>}</div>)}
    </div>}
    {data?.truncated && <p className="reason-files-note">Showing the first 500 entries.</p>}
    <p className="reason-files-note">Read-only view of the selected workspace.</p>
  </div>;
}
