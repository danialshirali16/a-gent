# Provider readiness and model identity

**Active scope:** [personal macOS v1](release-contract.md), Codex only/default reasoning. Existing source is broader and not yet gated. PVD-006/010/011/015/016 are Review after the audit: blank-field clearing, scroll/count copy, saved-ID slicing, stale Forget probes, and incomplete contract coverage remain. [V1-03–06](project-roadmap.md#recommended-execution-order) owns the retained corrections; this implementation reference is not release acceptance.

Status: **M2 implementation record with personal-v1 review corrections, 2026-11-05.** Implements the BEN-002 lifecycle contract for readiness, capability typing, catalog normalization, model-ID limits, and API-boundary readiness checks. Provider-specific journeys remain their own tasks.

[Release contract](release-contract.md) · [BEN-002](benchmarks/BEN-002-provider-lifecycle.md) · [Runtime baseline](runtime-baselines.md) · [Validation](validation.md) · [Provider board](roadmaps/providers.md)

## Readiness states

`ProviderInfo.readiness` is the lifecycle field; the legacy `status` remains for compatibility.

| State | Meaning |
| --- | --- |
| `unconfigured` | No usable endpoint/auth setup yet. |
| `configured` | Configuration exists but readiness has not been checked. |
| `checking` | A probe/catalog check is running. |
| `needs-auth` | Runtime is present but sign-in/account access is missing. |
| `ready` | The provider has a verified-enough connection for selection; discovery may still be catalog-only until PVD-007. |
| `degraded` | Connected but missing a model/usable capability. |
| `error` | The last check failed; detail is redacted and actionable. |
| `disabled` | Unsupported/unavailable runtime. |

Legacy mapping: `connected` → `ready`, `available` → `configured`, `unavailable` → `disabled`, `error` → `error`. UI/model filtering uses `isProviderReady()`, so old fixtures remain compatible.

## Adapter capability contract

Every provider carries typed capabilities. Speech-to-text is deliberately absent: it is a separate connection that feeds the selected Agent.

| Kind | Chat/stream | Tools/MCP | Approvals | Skills | Attachments | Reasoning | Discovery | Auth | Cancellation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | yes | yes | yes | yes | yes | yes | yes | external | turn |
| OpenCode | yes | yes | no | yes | yes | yes | yes | external | process |
| Ollama | yes | no | no | no | no | yes | yes | none | stream |
| OpenAI-compatible/Cloud/Antigravity | yes | no | no | no | no | no | yes | API key | stream |

`providerCapabilities(kind)` is the single source for these values; `ProviderInfo.capabilities` is populated on load. Unknown/unsupported reasoning is represented by the model capability contract, not by a provider-wide union.

## Implemented behavior

- Provider entries carry typed `capabilities` for chat, streaming, tools, approvals, skills, attachments, reasoning, MCP, and discovery. Codex/OpenCode are agent runtimes; HTTP/Ollama are text-only deferred source adapters, not personal-v1 launch providers.
- Codex probe transitions `checking` → `ready`/`needs-auth`/`error`.
- OpenCode probe transitions `checking` → `ready` when models are found (detail explicitly says inference still needs a test), `needs-auth` when empty, or `error`.
- HTTP/Ollama connect transitions `checking` → `ready` with models, `degraded` when connected without a model, or `error`.
- Model catalogs use `normalizeModels()`: empty IDs rejected, duplicate IDs removed, blank names fall back to IDs, descriptions bounded, catalog capped at 200, IDs capped at 200.
- Shared MODEL_ID_LIMIT bounds discovery, connect, persistence/import, dispatch, and the form; saved connection loading still slices IDs and must adopt preserve-or-reject behavior.
- `RunManager.send()` rejects a provider that is not `ready` with a `409` before creating a streaming message. Explicit model/enum/unsupported-effort validation exists; personal-v1 dispatch must use provider default and gate custom controls.
- Provider cards/settings show lifecycle labels (`Ready`, `Checking`, `Sign-in needed`, `Connection error`, etc.) and the model picker filters with `isProviderReady`.
- Provider cards hydrate the saved endpoint and manual model ID; a connect response with error readiness keeps the form open and shows the redacted detail instead of closing.
- Search uses NFKC and query scroll reset; colliding names show an ID suffix. Provider-only scroll reset, live plural copy, and formatted counts remain incomplete.
- Model options now carry verified `ReasoningCapability` metadata. Codex discovery preserves `defaultReasoningEffort` and `supportedReasoningEfforts`; the model picker renders only the selected model's enum options/default, and unknown/unsupported models show provider-default/no-control states.
- Codex sends an effort only when the selected model advertises that exact enum value; the API rejects an explicit model that is unavailable or an effort outside the verified enum/unsupported case.

## Selection scope

- Chat-level `providerId`, `modelId`, and `reasoningEffort` overrides are persisted on the conversation and used by `RunManager` ahead of the Agent defaults.
- Agent provider/model/effort remain the default for new chats; global settings remain the final fallback.
- Selecting a model or effort in an existing chat patches that conversation only. A new chat writes the selected scope at creation.
- Failed patches roll the composer selection back to the previous value.
- Switching one chat cannot mutate another conversation or the Agent default; tests cover the scope and failed-save case.

## Endpoint policy

- Local loopback endpoints are allowed for Ollama; custom/Cloud/OpenAI-compatible defaults require a public HTTPS endpoint.
- Localhost/private ranges/metadata hosts (`169.254.169.254`, `metadata.google.internal`, `metadata`, `instance-data`) are rejected for non-Ollama providers.
- Remote `http:` is rejected unless `AGENT_ALLOW_INSECURE_PROVIDER_HTTP=1`.
- Provider fetches use `redirect: "error"` so credentials cannot be forwarded to a redirect target.
- Embedded credentials, query strings, and fragments are rejected.
- `AGENT_ALLOW_LOCAL_PROVIDER_ENDPOINTS=1` is test/development-only for local HTTP fixtures.
- DNS rebinding/resolved-IP policy remains a hardening follow-up; raw IP ranges and hostnames are checked before connect.

## Inference test

`POST /api/providers/:id/test` accepts `{ modelId, confirm: true }`, sends one minimal live turn with tools disabled, and returns `{ ok, response, error, latencyMs, network: true, mayCost: true }`. Success sets `ProviderInfo.verifiedBy = "inference"` and readiness `ready`; failure records the redacted error. Catalog-only connections stay `verifiedBy: "catalog"` until this explicit test runs. The Provider card exposes a “Test model” action with a live-request/credit warning.

## Credentials

- `createSecretStore()` selects session-only memory outside macOS and macOS Keychain on Darwin by default; `AGENT_SECRET_STORAGE=session|keychain` can force a mode.
- `KeychainSecretStore` uses the built-in `security` command and the `a-gent` service. Locked/unavailable Keychain errors are surfaced as actionable provider errors.
- `ProviderManager` stores HTTP API keys under `provider:<id>:api-key`, exposes `credentialMode`/`hasStoredKey`, restores refs on load, and removes the ref on disconnect. Codex/OpenCode remain external sign-in.
- Endpoint/model config stays in the separate connections file; secrets never enter workspace export.
- Disconnect clears the stored credential and resets readiness to configured/unconfigured; Codex/OpenCode “Forget connection” resets A Gent state without pretending to sign out the external CLI.
- Keychain behavior has not been exercised on a real macOS host in this pass; Windows uses session-only memory.

## Verification

`tests/server/provider-contract.test.ts` covers legacy mapping, readiness labels, capability differences, empty/duplicate/blank/overlong model IDs, and the 200-model bound. Existing backend tests were updated to connect providers before runs, proving the API guard. `tests/server/model-options.test.ts` still verifies disconnected catalogs are not selectable.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 51/51 server/model-option tests pass; production build pass with the existing chunk-size advisory. UI Playwright suites were not run for this slice.

## Remaining

- **PVD-007:** explicit inference test/health check; `ready` currently means connection/catalog readiness, not a completed model turn.
- **PVD-003/004/005/006:** credential storage/disconnect/restart mechanisms exist. Full blank-field clear/edit is incomplete; PVD-006 is Review. Mac Keychain behavior still needs actual-host evidence if that deferred feature is resumed.
- **PVD-012:** global/agent/chat default scoping.
- **PVD-013/EFF-006:** model/effort capability validation before dispatch.
- **PVD-014/015:** endpoint policy and refresh diagnostics.
- **Provider-specific tasks:** BEN-003/BEN-004 Codex/OpenCode benchmarks and CDX/OPC journeys. HTTP/OLL/GEM are deferred to the distant future (D-02 amendment).

## Personal v1 review limits

Disconnect does not invalidate a pending probe generation: the audit reproduced configured → ready after Forget. Native runtime Forget resets A Gent state and is not CLI sign-out. Current startup probes Codex only; OpenCode requires an explicit check. Actual account changes are not represented by a fresh account identity in every session binding. Automatic effort-save failures and effective chat/default display still need work; custom effort is paused. Follow the support matrix rather than treating these source mechanisms as end-to-end acceptance.
