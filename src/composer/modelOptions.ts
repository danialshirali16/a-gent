import type { ProviderInfo } from '../../shared/types';

export interface ModelChoice {
  id: string;
  name: string;
}

/** A disconnected catalog must never become a selectable model source. */
export function connectedModelGroups(providers: ProviderInfo[], query = '') {
  const term = query.trim().toLocaleLowerCase();
  return providers.filter(provider => provider.status === 'connected').map(provider => {
    const choices: ModelChoice[] = [
      { id: '', name: 'Provider default' },
      ...provider.models.map(model => ({ id: model.id, name: model.name })),
    ];
    return { provider, choices: choices.filter(choice => !term || `${provider.name} ${choice.id} ${choice.name}`.toLocaleLowerCase().includes(term)) };
  }).filter(group => group.choices.length > 0);
}
