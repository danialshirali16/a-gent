import { useCallback, useEffect, useRef, useState } from 'react';
import type { Bootstrap, ServerEvent, Run } from '../shared/types';
import { request, streamEvents, type Connection } from './api';

export function useWorkspace(connection: Connection) {
  const [data, setData] = useState<Bootstrap>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [online, setOnline] = useState(false);
  const current = useRef(connection);
  current.current = connection;
  const api = useCallback(<T,>(path: string, method?: string, body?: unknown) => request<T>(current.current, path, method, body), []);
  const refresh = useCallback(async () => { const next = await api<Bootstrap>('/api/bootstrap'); setData(next); setOnline(true); return next; }, [api]);

  useEffect(() => {
    if (!connection.url || !connection.token) return;
    const controller = new AbortController();
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout>;
    setLoading(true); setError('');
    const apply = (event: ServerEvent) => {
      setOnline(true);
      if (event.type === 'error') { setError(event.message); return; }
      setData(previous => {
        if (!previous) return previous;
        if (event.type === 'state') return { ...previous, state: event.state };
        if (event.type === 'providers') return { ...previous, providers: event.providers };
        if (event.type === 'run') return { ...previous, runs: [...previous.runs.filter(run => run.id !== event.run.id), event.run].slice(-100) };
        if (event.type === 'interaction') return { ...previous, interactions: [...(previous.interactions || []).filter(item => item.id !== event.interaction.id), event.interaction].slice(-200) };
        if (event.type === 'delta') return { ...previous, state: { ...previous.state, conversations: previous.state.conversations.map(chat => chat.id !== event.conversationId ? chat : { ...chat, messages: chat.messages.map(message => message.id !== event.messageId ? message : { ...message, content: message.content + event.delta }) }) } };
        return previous;
      });
    };
    const listen = async () => {
      try { await streamEvents(connection, controller.signal, apply); }
      catch { if (cancelled) return; }
      if (!cancelled) { setOnline(false); retry = setTimeout(async () => { try { await refresh(); } catch { /* retry stream below */ } void listen(); }, 2500); }
    };
    void request<Bootstrap>(connection, '/api/bootstrap').then(next => {
      if (cancelled) return; setData(next); setOnline(true); void listen();
    }).catch(reason => { if (!cancelled) { setError(reason.message || 'Could not connect to your A Gent host.'); setOnline(false); } }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); clearTimeout(retry); };
  }, [connection.url, connection.token, refresh]);

  // A live event can advance the run before its initiating HTTP response arrives.
  // Seed missing runs from responses without replacing an existing stream snapshot.
  const updateRun = (run: Run) => setData(previous => previous && !previous.runs.some(item => item.id === run.id) ? { ...previous, runs: [...previous.runs, run] } : previous);
  return { data, api, refresh, loading, error, setError, online, updateRun };
}
