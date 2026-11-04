import type { ServerEvent } from '../shared/types';

export interface Connection { url: string; token: string; }
declare global {
  interface Window {
    __AGENT_CONFIG__?: Connection;
    aGentDesktop?: {
      platform: string;
      selectDirectory: () => Promise<string | null>;
      openExternal: (url: string) => Promise<void>;
    };
  }
}

export function initialConnection(): Connection {
  const injected = window.__AGENT_CONFIG__;
  if (injected?.token) return { url: injected.url || window.location.origin, token: injected.token };
  try {
    const url = localStorage.getItem('aGent.host') || '';
    const token = sessionStorage.getItem('aGent.token') || '';
    return { url, token };
  } catch { return { url: '', token: '' }; }
}

export async function request<T>(connection: Connection, path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${connection.url.replace(/\/$/, '')}${path}`, {
    method,
    headers: { Authorization: `Bearer ${connection.token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data as T;
}

export async function streamEvents(connection: Connection, signal: AbortSignal, onEvent: (event: ServerEvent) => void) {
  const response = await fetch(`${connection.url.replace(/\/$/, '')}/api/events`, {
    headers: { Authorization: `Bearer ${connection.token}` }, signal,
  });
  if (!response.ok || !response.body) throw new Error('The connection to your A Gent host was interrupted.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, boundary).replace(/\r/g, '');
        buffer = buffer.slice(boundary + 2);
        const data = frame.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data) onEvent(JSON.parse(data));
      }
    }
  } finally { reader.releaseLock(); }
}
