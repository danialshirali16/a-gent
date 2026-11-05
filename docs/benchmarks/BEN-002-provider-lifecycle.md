# BEN-002 — Shared provider lifecycle comparison

**Personal-v1 reuse amendment, approved 2026-11-05:** Retain applicable readiness, model identity, inference-vs-catalog, connection error, and recovery decisions for Codex. Actual Forget/clear/ID/fixture gaps remain Review; deferred API providers are not launch promises. Follow the [active roadmap](../project-roadmap.md#recommended-execution-order), [contract/D-11 exception](../release-contract.md#d-11-benchmark-policy), and [task triage](../roadmaps/v1-triage.md). The dated comparison below is preserved, not rerun; reuse does not establish fresh runtime/package acceptance.

Status: **Done — accepted for M2 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Provider board](../roadmaps/providers.md) · [Runtime baseline](../runtime-baselines.md) · [Authority model](../authority-model.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-002; covers the shared provider lifecycle PVD-001–PVD-018 and the lifecycle portions of CDX-001/002, OPC-001/003/004, HTTP-001–006, OLL-001–004, and GEM-001–004. **Scope amendment:** HTTP/OLL/GEM are deferred to the distant future (D-02, 2026-11-05); the shared contract still applies if they resume. Provider-specific protocol decisions remain BEN-003–BEN-007 and reasoning remains BEN-021/022.
- **Question:** How do agent runtimes and multi-provider desktop apps establish, prove, present, edit, remove, and recover provider connections; what contract should every A Gent adapter follow?
- **Included:** setup/discovery, auth/readiness, model catalogs/defaults, discovery versus actual inference, connected-only presentation, edit/remove, restart/recovery, error classes, credential references, and profiles.
- **Excluded:** detailed Codex/OpenCode transport behavior (BEN-003/004), HTTP dialect details (BEN-005), Ollama lifecycle (BEN-006), Gemini/Antigravity naming (BEN-007), MCP/app UX (BEN-008/009), reasoning controls (BEN-021/022), and real-account acceptance (PVD-017).
- **DRI:** Danial (Product + Integrations).
- **Reviewer:** Danial (owner acceptance for M2; independent reviewer unavailable in this solo-maintained project).
- **Research date and environment:** 2026-11-05; Windows 11 x64; repo `c47f1550fac67cbc1c5ceed45f0826a4c92f120e`; Codex CLI 0.166.0; OpenCode 2.2.5; LM Studio `lms` CLI commit `1b7181b` installed but server stopped; Jan Desktop not installed.

## Comparators and evidence

| Comparator and version | Evidence | Observation type | Access/environment | Limitations |
| --- | --- | --- | --- | --- |
| Codex CLI 0.166.0 app-server | Generated schema + [App Server docs](https://developers.openai.com/codex/app-server), 2026-11-05; fixtures under `tests/fixtures/runtime-baselines/codex-0.166.0/` | Direct schema/source probe | Windows x64; local stdio | No login, model request, or MCP/OAuth flow was exercised. |
| OpenCode 2.2.5 | Generated OpenAPI (138 paths/169 operations) + CLI help; [Server docs](https://opencode.ai/docs/server/), 2026-11-05 | Direct CLI/OpenAPI probe | Windows x64; local server/CLI | No model prompt, provider auth, or MCP/OAuth flow was exercised; public docs mix v1/v2 paths. |
| LM Studio current desktop/server docs (0.4.0+ auth behavior) | [Server](https://lmstudio.ai/docs/developer/core/server), [Authentication](https://lmstudio.ai/docs/developer/core/authentication), [Server settings](https://lmstudio.ai/docs/developer/core/server/settings), [OpenAI models](https://lmstudio.ai/docs/developer/openai-compat/models), read 2026-11-05; `lms` CLI commit `1b7181b` | Direct CLI presence + documented behavior | `lms` installed; server reported “not running”; no model list/inference | Versioned UI docs are current public docs, not a live UI walkthrough. |
| Jan Desktop current docs | [Quickstart](https://jan.ai/docs/desktop/quickstart), [Local API Server](https://jan.ai/docs/desktop/api-server), [Custom endpoints](https://jan.ai/docs/desktop/remote-models/custom-endpoint), read 2026-11-05 | Documented behavior | Jan not installed on this host | No live Jan UI/API observation; docs describe current product generation. |
| A Gent current source | `server/providers.ts`, `src/dialogs/ProviderCard.tsx`, [integration review](../integration-review.md) | Direct source review | Repo working tree | This is the gap baseline, not an external comparator. |

## Workflow comparison

| Lifecycle stage | Codex 0.166.0 | OpenCode 2.2.5 | LM Studio | Jan Desktop | A Gent current gap | Adopted direction |
| --- | --- | --- | --- | --- | --- | --- |
| Discovery/setup | Installed CLI + app-server; existing external sign-in; managed login methods exist in schema | Installed CLI; external `opencode auth login`; server/API available | Start server from Developer tab or `lms server start`; local model must exist | Install + default model; Model Providers for cloud/custom; Local API server requires a local model | Fixed six-entry catalog; Codex/OpenCode probe; HTTP setup form | Show installed/configured/auth-required states separately; never present a fixed catalog entry as usable before discovery. |
| Auth/readiness | `account/read` says authenticated or requires OpenAI auth | `auth list`/model list; current adapter infers readiness from model count | Auth is optional by default; tokens can be required (0.4.0+); server may be stopped | Local models need no key; cloud keys; optional local API key | Codex uses account; OpenCode uses model count; HTTP status is set from catalog request | Readiness is a fresh, explicit state; model count alone is not proof of auth or inference. |
| Catalog/defaults | `model/list` includes IDs, display names, default effort, supported efforts | `models`/OpenAPI returns provider/model IDs and variants | `/v1/models` lists models visible to the server; JIT may include downloaded models | Fetches `{base_url}/models` when saving; manual model IDs when absent | Raw catalogs; duplicate/blank IDs; default model is global; no capability metadata | Normalize IDs, names, and metadata; keep exact IDs; use verified model defaults; allow a manually entered model when catalog enumeration is unsupported. |
| Discovery vs inference | Account/model discovery is separate from a turn | Model discovery is separate from `run` | Model list can include downloaded but not loaded models; JIT changes semantics | Model list/test-key checks can succeed without a chat completion | Connect closes the card after any resolved POST; no inference test | Introduce a deliberate “test this model” turn/health check; mark ready only after it succeeds; keep discovery-only state distinct. |
| Connected-only presentation | N/A (runtime) | N/A (runtime) | Server models list is the UI surface | Model selector only after provider/model setup | Picker shows connected providers only, but `connected` can mean catalog-only | Only `ready` providers/models are selectable; unavailable/error entries show recovery, not a fake connected state. |
| Edit/removal | External CLI manages login; app-server account methods exist | CLI auth/provider config manages login | Server settings can stop server/change auth; model load/unload | Provider settings edit keys/endpoints; custom providers can be removed | No disconnect/sign-out, no clear key, no remove endpoint; blank values cannot intentionally clear | Add edit, clear credential, disconnect/remove, and active-run handling for every provider. |
| Restart/recovery | App-server process restart; account read on next connect | Background CLI/server; session list/import | Server must be started again; JIT/loaded model state is separate | App restart reloads local models/providers; server must be running | Endpoints restore; keys are session-only; readiness is not refreshed until reconnect; saved status can be stale | Restore non-secret config, re-read credential references, re-probe readiness, and never reuse cached “connected” without a fresh check. |
| Errors | Structured JSON-RPC errors; child exit/stderr | Structured errors/exit codes; CLI stderr | Server stopped, auth 401, wrong port/base URL, no model; settings/logs | 401/403/429/404/connection refused/CORS; key fallbacks only on 401/403/429 | Generic HTTP status + truncated body; provider status `error` still returned as HTTP 200; card closes | Stable error classes: auth, network, catalog, model, runtime, cancellation; actionable recovery; redacted detail; failed connect keeps the form open. |
| Credentials | Managed auth store; external sign-in | Auth store | Optional bearer token | Provider keys, multiple fallback keys; local server optional key | Keys in process memory only; endpoints saved without keys; no Keychain | Keychain/session-only references; no keys in renderer/exports/logs; explicit clear and edit. |
| Profiles | One signed-in account per runtime | Provider/auth entries | One local server endpoint (plus links) | Multiple providers and multiple keys | One connection per fixed provider ID | One profile per provider in R1; multiple profiles/accounts are R2 (PVD-018). |
| UI state | Runtime-owned | Runtime-owned | Developer server settings | Provider list + model selector | Card closes on resolved POST; error status can look “connected”; fixed labels | Preserve form on failure; show auth needed/checking/ready/degraded/error distinctly; expose last-checked/retry. |

## Measurements and observations

| Measurement | Result |
| --- | --- |
| Codex app-server methods | 106 client methods, 10 server-request methods; model/list exposes `defaultReasoningEffort`/`supportedReasoningEfforts` |
| OpenCode API | OpenAPI 3.1.0, 138 paths, 169 operations; models/permissions/sessions/MCP endpoints present |
| LM Studio CLI | `lms` commit `1b7181b`; `lms server status` reported “The server is not running”; `lms ls --json` woke the service and exceeded the 30s probe timeout |
| Jan | Not installed; docs verified local API, custom endpoint, model-fetch fallback, and optional API key |
| Live inference / auth | Not performed for any provider; PVD-017/QA-008 still require real-service evidence |
| Latency/cost | Not measured; QA-002 owns budgets |

## Decisions and delivery mapping

| Decision | Evidence and tradeoff | Delivery tasks | Acceptance / verification |
| --- | --- | --- | --- |
| One typed provider adapter contract with explicit lifecycle states: unconfigured, configured, checking, needs-auth, ready, degraded, error, disabled. | Codex/OpenCode distinguish runtime/auth from catalogs; LM Studio/Jan have start/auth/model states; A Gent conflates catalog success with connected. | PVD-001, PVD-002, PVD-013 | Contract tests for every state/transition; UI labels; no selectable non-ready model. |
| Discovery and inference are separate. A `ready` provider/model requires an explicit test turn or a deliberate host health check; a catalog fetch alone is discovery. | LM Studio can list downloaded models that are not loaded; Jan test-key checks `/models`; Codex/OpenCode catalogs do not prove account access. | PVD-007, PVD-017, QA-008 | Test-turn fixture + real-service smoke; UI reports cost/network intent; failed inference returns to a recoverable state. |
| Stable provider/profile/model identity: exact provider ID, profile ID, model ID; display name is not identity. | Catalogs can contain duplicate/blank names; model IDs exceed old limits; Codex/OpenCode/Jan all use IDs. | PVD-008–PVD-011 | Collision/duplicate/empty/Unicode fixtures; ID length aligned across discovery/config/persistence/send. |
| Connected-only presentation: only `ready` providers/models appear as selectable; others show a recovery action. | Picker source already filters connected, but backend marks catalog-only as connected. | PVD-005, PVD-009, PVD-013 | UI tests for connected, checking, error, auth, empty, and stale states. |
| Defaults are scoped global/agent/chat, and failed saves roll back without mutating unrelated chats. | Codex/OpenCode model selection is per run; A Gent currently changes agent records and uses global defaults. | PVD-012, EFF-005 | Scope fixtures, save failure/rollback, switch-model tests. |
| Credentials use owner-scoped references with Keychain/session-only policy; endpoints/config are separate non-secret records. | LM Studio/Jan allow optional keys; Codex/OpenCode own external auth; A Gent has a memory map and unencrypted endpoint file. | PVD-003, PVD-004, PVD-006, FND-012 | Keychain/session tests, clear/edit, restart, export/log scans. |
| Edit, clear credential, disconnect/remove, and active-run handling are first-class lifecycle operations. | LM Studio/Jan expose server/provider edit; A Gent has no disconnect/remove. | PVD-005, PVD-006 | Form hydration, empty-field clear, disconnect during run, reconnect. |
| Recovery is fresh and bounded: restore config, recompute readiness, cap catalog/auth/stream, and expose retry/backoff. | Jan/LM Studio document stopped-server/auth/404/429 states; A Gent can show stale connected state. | PVD-002, PVD-004, PVD-015, FND-010 | Restart/daemon-loss/timeout/Retry-After tests; last-checked timestamps. |
| Error classes and recovery copy: auth, network, catalog, model/runtime, cancellation; never surface arbitrary provider bodies. | All comparators document actionable auth/connection/model errors; A Gent returns raw status/body and resolves HTTP 200 on connect error. | PVD-013, FND-011, HTTP-002 | Error fixture matrix; redaction tests; form remains open on failure. |
| Multiple connection profiles/accounts are R2; R1 keeps one profile per provider. | Jan supports multiple keys/providers; A Gent schema has one connection per fixed provider. | PVD-018 (R2) | Do not advertise multi-profile in R1; migration path when promoted. |
| Provider-specific behavior stays in its own adapter/benchmark; this record only fixes the shared lifecycle. | Codex/OpenCode/HTTP/Ollama/Gemini have distinct auth/transport semantics. | PVD-001; CDX/OPC/HTTP/OLL/GEM tasks | Each provider benchmark accepted before its implementation. |

## Open questions and acceptance

- **Blocking questions:** none for the shared lifecycle contract. The named launch provider list remains D-02/D-05; Antigravity’s product promise remains BEN-007; exact Keychain implementation remains PVD-003.
- **Unverified/limitations:** LM Studio and Jan were not exercised live; `lms` server was stopped; no authenticated Codex/OpenCode model request; no inference test; no UI walkthrough. Those are PVD-017/QA-008 gates.
- **DRI/reviewer acceptance:** Danial accepted 2026-11-05 as the M2 shared-lifecycle baseline. Independent review is recommended before external release.
- **Evidence links:** [runtime baseline](../runtime-baselines.md), [authority model](../authority-model.md), [config/secrets](../config-secrets.md), [provider board](../roadmaps/providers.md), [validation](../validation.md).
- **Recheck triggers:** provider runtime/API change (Codex/OpenCode/LM Studio/Jan), new provider entry, credential policy change, catalog schema change, or evidence contradicting discovery/inference separation.
- **Reuse limits:** covers shared lifecycle only. Codex/OpenCode/HTTP/Ollama/Gemini protocol details require BEN-003–BEN-007; reasoning/skills/speech/MCP remain their own gates.
