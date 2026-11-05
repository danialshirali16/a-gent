import type { Attachment } from '../shared/types';

export interface StoredDraft {
  text: string;
  attachments: Attachment[];
  updatedAt: string;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PREFIX = 'aGent.draft.v1';
const MAX_TEXT = 100_000;
const MAX_ATTACHMENTS = 8;
const MAX_ATTACHMENT_CONTENT = 1_000_000;

export function draftScopeForConversation(conversationId: string): string {
  return `chat:${conversationId}`;
}

export function draftScopeForAgent(agentId: string): string {
  return `agent:${agentId}`;
}

export function draftStorageKey(host: string, scope: string): string {
  return `${PREFIX}:${host}:${scope}`;
}

function validAttachment(value: unknown): value is Attachment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= 100
    && typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 500
    && typeof item.type === 'string' && item.type.length <= 200
    && typeof item.content === 'string' && item.content.length <= MAX_ATTACHMENT_CONTENT;
}

/** Drafts are device-local user intent. Invalid or oversized entries are ignored, never thrown. */
export function loadDraft(storage: DraftStorage | undefined, host: string, scope: string): StoredDraft | undefined {
  if (!storage || !host || !scope) return undefined;
  try {
    const raw = storage.getItem(draftStorageKey(host, scope));
    if (!raw) return undefined;
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (typeof data.text !== 'string' || data.text.length > MAX_TEXT) return undefined;
    if (!Array.isArray(data.attachments) || data.attachments.length > MAX_ATTACHMENTS) return undefined;
    const attachments = data.attachments.filter(validAttachment);
    if (attachments.length !== data.attachments.length) return undefined;
    if (typeof data.updatedAt !== 'string' || Number.isNaN(Date.parse(data.updatedAt))) return undefined;
    return { text: data.text, attachments, updatedAt: data.updatedAt };
  } catch {
    return undefined;
  }
}

export function saveDraft(storage: DraftStorage | undefined, host: string, scope: string, text: string, attachments: Attachment[], updatedAt = new Date().toISOString()): void {
  if (!storage || !host || !scope) return;
  try {
    if (!text && !attachments.length) {
      storage.removeItem(draftStorageKey(host, scope));
      return;
    }
    const boundedText = text.slice(0, MAX_TEXT);
    const boundedAttachments = attachments.slice(0, MAX_ATTACHMENTS).filter(validAttachment);
    if (!boundedText && !boundedAttachments.length) return;
    storage.setItem(draftStorageKey(host, scope), JSON.stringify({ text: boundedText, attachments: boundedAttachments, updatedAt }));
  } catch {
    // Private browsing, quota exhaustion, or a disabled storage API must never break sending.
  }
}

export function clearDraft(storage: DraftStorage | undefined, host: string, scope: string): void {
  if (!storage || !host || !scope) return;
  try { storage.removeItem(draftStorageKey(host, scope)); } catch { /* optional storage */ }
}
