# Model-specific reasoning verification

Status: **EFF-011 evidence recorded 2026-11-05.**

[Reasoning board](roadmaps/reasoning-effort.md) · [BEN-021](benchmarks/BEN-021-reasoning-capability.md) · [BEN-022](benchmarks/BEN-022-thinking-controls.md) · [Validation](validation.md)

## Codex — live account

`model/list` from Codex 0.166.0 with the signed-in ChatGPT account returned 8 visible models. At least two have distinct reasoning sets/defaults:

| Model | Default | Supported efforts | Notes |
| --- | --- | --- | --- |
| `gpt-6.1-sol` | `low` | low, medium, high, xhigh, max, ultra | text/image |
| `gpt-6-sol` | `medium` | low, medium, high, xhigh, max, ultra | different default |
| `gpt-6-luna` | `medium` | low, medium, high, xhigh, max | no `ultra` |
| `gpt-5.6-luna` | `medium` | low, medium, high, xhigh, max | no `ultra` |

The adapter preserves these options/defaults and sends only an exact verified enum value. Unknown metadata omits the parameter.

## OpenCode — explicit unknown contract

OpenCode 2.2.5 model discovery exposes model IDs/variants, not a uniform reasoning enum. A Gent therefore represents its reasoning capability as **unknown** unless a verified mapping is added; it shows Provider default and sends no effort parameter. This is an explicit unsupported contract, not a guessed list.

## Deferred adapters

Ollama, OpenAI-compatible/Cloud, and Gemini/Antigravity are deferred from R1. When resumed, each must capture schema/request evidence and real smoke coverage before advertising reasoning settings.

## Verification boundary

- Capability normalization tests cover enum, budget, boolean, unsupported, unknown, one-option, long-label, and invalid-default cases.
- Codex live metadata is recorded above; UI axe/VoiceOver/actual-zoom checks are still EFF-012 evidence gaps.
- The current UI supports enum controls; budget/boolean controls are represented in the contract but not rendered.
