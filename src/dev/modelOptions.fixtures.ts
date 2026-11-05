import type { ModelOption, ProviderInfo } from '../../shared/types';

export const modelOptionsDataSets = [
  { id: 'demo', label: 'Demo data' },
  { id: 'worst', label: 'Worst case' },
  { id: 'empty', label: 'Empty' },
  { id: 'one', label: 'One choice' },
  { id: 'huge', label: '1,000 models' },
  { id: 'invalid', label: 'Invalid IDs' },
] as const;

export type ModelOptionsDataSet = typeof modelOptionsDataSets[number]['id'];

interface ModelOptionsFixture {
  providers: ProviderInfo[];
  providerId: string;
  modelId: string;
  note: string;
}

function provider(id: string, name: string, kind: ProviderInfo['kind'], models: ModelOption[], status: ProviderInfo['status'] = 'connected'): ProviderInfo {
  return { id, name, kind, status, models, detail: 'Development fixture' };
}

const demo: ModelOptionsFixture = {
  providers: [
    provider('codex', 'Codex', 'codex', [{ id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex' }, { id: 'gpt-5.2', name: 'GPT-5.2' }]),
    provider('ollama', 'Ollama', 'ollama', [{ id: 'llama3.3:latest', name: 'Llama 3.3' }]),
  ],
  providerId: 'codex', modelId: 'gpt-5.2-codex',
  note: 'Ordinary names and two connected providers.',
};

// Plausible repository/deployment labels, mixed scripts, optional descriptions,
// and blank display names accepted by the current catalog adapters.
const worst: ModelOptionsFixture = {
  providers: [
    provider('codex', 'Codex', 'codex', [
      { id: 'enterprise-research-eu-west-nightly', name: 'Northwind Enterprise Research — Codex (EU West, 256k context, nightly evaluation)' },
      { id: 'unnamed-evaluation', name: '' },
      { id: 'quick', name: 'Q' },
      { id: 'farsi-research', name: 'مدل پژوهشی — نسخهٔ سازمانی با پشتیبانی از زبان فارسی' },
      { id: 'vietnamese-research', name: 'Trợ lý nghiên cứu — Tiếng Việt' },
      { id: 'chinese-code', name: '通义千问代码助手企业研究版' },
      { id: 'emoji-lab', name: '🔬 Research 👩🏽‍💻' },
      { id: 'preview-evaluation', name: 'Research <preview> & “evaluation”' },
      { id: 'spaced-label', name: '   Research   preview   ' },
      { id: 'blank-display-name', name: '   ' },
      { id: 'versioned-preset', name: 'Research\nNightly evaluation' },
      { id: 'decomposed-accent', name: 'Cafe\u0301 Research' },
      { id: 'default-named-deployment', name: 'Provider default' },
    ]),
    provider('cloud', 'Cloud', 'openai-compatible', [
      { id: 'production/eu-west/research', name: 'Research' },
      { id: 'production/us-east/research', name: 'Research' },
    ]),
    provider('ollama', 'Ollama', 'ollama', [
      { id: 'registry.example.com/northwind-industries-holdings/enterprise-research-assistant-Qwen3-32B-Instruct-2026-11-05-Q4_K_M:latest', name: 'registry.example.com/northwind-industries-holdings/enterprise-research-assistant-Qwen3-32B-Instruct-2026-11-05-Q4_K_M:latest' },
      { id: 'qwen3:32b-instruct-q4_K_M', name: 'qwen3:32b-instruct-q4_K_M' },
    ]),
    provider('opencode', 'OpenCode', 'opencode', [{ id: 'cached-opencode-model', name: 'Cached model — must stay hidden' }], 'available'),
    provider('antigravity', 'Antigravity', 'openai-compatible', [{ id: 'cached-antigravity-model', name: 'Cached model — must stay hidden' }], 'unavailable'),
    provider('openai-compatible', 'OpenAI compatible', 'openai-compatible', [{ id: 'cached-compatible-model', name: 'Cached model — must stay hidden' }], 'error'),
  ],
  providerId: 'codex', modelId: 'enterprise-research-eu-west-nightly',
  note: 'Long, short, blank, identical, multilingual, emoji, literal markup, newline, and decomposed-accent names. All connection statuses are represented.',
};

const hugeModels: ModelOption[] = Array.from({ length: 1000 }, (_, index) => {
  const family = ['research', 'code', 'translation', 'analysis', 'support'][index % 5];
  const revision = String(Math.floor(index / 5) + 1).padStart(3, '0');
  const id = `northwind/${family}-evaluation-r${revision}`;
  return { id, name: id };
});

export const modelOptionsFixtures: Record<ModelOptionsDataSet, ModelOptionsFixture> = {
  demo,
  worst,
  empty: { providers: [], providerId: 'codex', modelId: '', note: 'No providers or model choices.' },
  one: { providers: [provider('codex', 'Codex', 'codex', [])], providerId: 'codex', modelId: '', note: 'One connected provider with no enumerated models: exactly one Provider default choice.' },
  huge: {
    providers: [
      provider('codex', 'Codex', 'codex', []),
      provider('opencode', 'OpenCode', 'opencode', []),
      provider('antigravity', 'Antigravity', 'openai-compatible', []),
      provider('cloud', 'Cloud', 'openai-compatible', []),
      provider('ollama', 'Ollama', 'ollama', []),
      provider('openai-compatible', 'OpenAI compatible', 'openai-compatible', hugeModels),
    ],
    providerId: 'openai-compatible', modelId: hugeModels[0].id,
    note: 'The HTTP adapter accepts 1,000 model records. All six supported providers are connected; Provider default adds one extra choice per provider.',
  },
  invalid: {
    providers: [provider('openai-compatible', 'OpenAI compatible', 'openai-compatible', [
      { id: '', name: 'Gateway default alias' },
      { id: 'research-eu', name: 'Research (EU)' },
      { id: 'research-eu', name: 'Research (EU replica)' },
      { id: 'research-us', name: 'Research (US)' },
    ])],
    providerId: 'openai-compatible', modelId: 'research-us',
    note: 'A malformed upstream catalog with an empty ID and a repeated ID. The current HTTP adapter accepts both; this is separate from ordinary valid catalog names.',
  },
};
