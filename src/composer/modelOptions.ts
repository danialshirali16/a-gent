import { isProviderReady } from '../../shared/providers';
import type { ProviderInfo } from '../../shared/types';

export interface ModelChoice {
  id: string;
  name: string;
}

/** A disconnected catalog must never become a selectable model source. */
export function connectedModelGroups(providers: ProviderInfo[], query = '') {
  const term = query.trim().normalize('NFKC').toLocaleLowerCase();
  return providers.filter(isProviderReady).map(provider => {
    const choices: ModelChoice[] = [
      { id: '', name: 'Provider default' },
      ...provider.models.map(model => ({ id: model.id, name: model.name })),
    ];
    return { provider, choices: choices.filter(choice => !term || `${provider.name} ${choice.id} ${choice.name}`.normalize('NFKC').toLocaleLowerCase().includes(term)) };
  }).filter(group => group.choices.length > 0);
}
