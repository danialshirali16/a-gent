import type { Conversation, ProviderBinding, ProviderKind } from '../shared/types.js';

export interface SessionBindingExpectation {
  providerId: string;
  providerKind: ProviderKind;
  accountId?: string;
  workspaceId: string;
  modelId: string;
}

export function bindingMatches(binding: ProviderBinding | undefined, expected: SessionBindingExpectation): boolean {
  if (!binding?.providerThreadId) return false;
  return binding.providerId === expected.providerId
    && binding.providerKind === expected.providerKind
    && (binding.accountId ?? '') === (expected.accountId ?? '')
    && binding.workspaceId === expected.workspaceId
    && (binding.modelId ?? '') === (expected.modelId ?? '');
}

export function bindingFor(expected: SessionBindingExpectation, providerThreadId: string, updatedAt: string): ProviderBinding {
  return {
    providerId: expected.providerId,
    providerKind: expected.providerKind,
    ...(expected.accountId ? { accountId: expected.accountId } : {}),
    workspaceId: expected.workspaceId,
    modelId: expected.modelId,
    providerThreadId,
    updatedAt,
  };
}

/**
 * Keep a provider session only when the provider, profile/account, workspace,
 * and model are all known to match. A legacy thread id without a binding is
 * treated as incompatible and rebuilt deliberately rather than resumed blind.
 */
export function prepareConversationBinding(conversation: Conversation, expected: SessionBindingExpectation): boolean {
  if (bindingMatches(conversation.providerBinding, expected)) {
    conversation.providerThreadId = conversation.providerBinding!.providerThreadId;
    return true;
  }
  if (conversation.providerThreadId || conversation.providerBinding) {
    delete conversation.providerThreadId;
    delete conversation.providerBinding;
  }
  return false;
}
