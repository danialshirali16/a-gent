# BEN-001 — Foundations and release-contract comparison

Status: **Done — accepted for M0 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Release contract](../release-contract.md) · [Runtime baseline](../runtime-baselines.md) · [Support matrix](../support-matrix.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-001; covers the M0 foundation scope FND-001–FND-012. It is the development gate for those tasks.
- **Question:** How do the reference products structure a local agent workspace, session/run lifecycle, provider setup, persistence and recovery, host/device authority, and launch boundaries; which behaviors should A Gent adopt for its first macOS release?
- **Included scopes and coverage:**
  - FND-001 release contract and launch boundaries.
  - FND-002 runtime/version and capability/schema baseline.
  - FND-003 durable schema and migration boundaries.
  - FND-004 host/device authority and credential boundaries.
  - FND-005 authenticated event streams.
  - FND-006 durable run/interruption lifecycle.
  - FND-007 provider-isolated session bindings.
  - FND-008 atomic persistence and recovery.
  - FND-009 correlated pending interactions.
  - FND-010 timeout budgets and cancellation primitives.
  - FND-011 diagnostics and redacted errors.
  - FND-012 shared config/secret storage interfaces.
- **Excluded:** provider-specific lifecycle comparisons (BEN-002–BEN-007), MCP/Connect Apps UX (BEN-008–BEN-010), core workspace UX (BEN-011), accessibility (BEN-012), speech/skills/reasoning feature comparisons (BEN-018–BEN-025), measured performance, real model/account calls, and package signing. Those remain their own gates.
- **DRI:** Danial (Product + Host).
- **Reviewer:** Danial (owner acceptance for M0).
- **Research date and environment:** 2026-11-05; Windows 11 x64; Node 26.12.1 (development probe), npm 11.20.0; repository `c47f1550fac67cbc1c5ceed45f0826a4c92f120e`; Codex CLI 0.166.0; OpenCode 2.2.5; Electron 45.2.2 from the lockfile.
- **Acceptance authority:** the owner directed the M0 pass on 2026-11-05. This record adopts the recommended boundaries already proposed in the master roadmap. A later change to a product promise or release boundary requires a dated amendment in [the release contract](../release-contract.md) and propagation to the owning boards.

## Comparators and evidence

| Comparator and version | Source/evidence link and date | Observation type | Access/environment | Limitations |
| --- | --- | --- | --- | --- |
| Reason desktop 0.1.119 (installed artifact) | [`docs/reverse-engineering.md`](../reverse-engineering.md), artifact inspected 2026-11-04; archive SHA-256 `a739beb5…73070` | Direct artifact inspection (prior pass) | macOS `/Applications/Reason.app`; REA 6.8.0 static inspection | Hosted service, complete frontend, and CLI protocol remain unknown; current Reason releases differ. Not re-observed on this Windows host. |
| Reason product documentation (current) | [Reason guide](https://docs.reasonmachines.com/docs/guide), [CLI](https://docs.reasonmachines.com/docs/cli), [ACP](https://docs.reasonmachines.com/docs/acp), read 2026-11-05 | Documented | Public documentation | Describes the current cloud-hosted Brain + local CLI Hands generation, not the 0.1.119 desktop artifact. Not a substitute for observing the installed reference. |
| Codex CLI 0.166.0 app-server | Installed `codex app-server generate-json-schema`; [App Server docs](https://developers.openai.com/codex/app-server), read 2026-11-05; fixtures in `tests/fixtures/runtime-baselines/codex-0.166.0/` | Direct probe + generated schema | Windows x64, local stdio; no account login or model request | Schema is version-specific. The live account, model, MCP, and approval journeys were not exercised. |
| OpenCode 2.2.5 | Installed CLI; `opencode api GET /openapi.json`; fixture in `tests/fixtures/runtime-baselines/opencode-2.2.5/openapi.json`; [Server docs](https://opencode.ai/docs/server/), read 2026-11-05 | Direct probe + generated OpenAPI | Windows x64; local server/CLI; no model prompt or MCP/OAuth flow | The public Server page still documents some v1 paths while 2.2.5 exposes a v2 API. The CLI `run --format json` event format is not covered by the OpenAPI document. |
| Electron 45.2.2 / Node 24.22.2 / Chromium 156 | [Electron 45.2.2 release](https://releases.electronjs.org/release/v45.2.2), [Electron 45 breaking changes](https://raw.githubusercontent.com/electron/electron/v45.0.0/docs/breaking-changes.md), read 2026-11-05 | Documented | Release metadata | Does not establish A Gent package behavior; signing and clean-Mac testing remain release tasks. |

## Workflow and failure comparison

| Scope / state | Reason reference | Codex 0.166.0 | OpenCode 2.2.5 | A Gent current gap | Adopted direction / evidence |
| --- | --- | --- | --- | --- | --- |
| Workspace and project scope | Desktop bridge exposes choose/grant project folders and device-scoped local work; hosted workspace owns chats and agents | Thread and turn carry `cwd`; sandbox `read-only` / `workspace-write` / `danger-full-access` | Sessions and projects are directory/location scoped; the server API exposes project/location records | `conversation.workspacePath`, `agent.workspacePath`, and a data-directory fallback; realpath and directory checks | Keep an explicit workspace root per chat/agent, validate realpath, never assume whole-device access. FND-004, FND-007. |
| Session model | Reason (long-running agent) contains Sessions; Loops wake a Reason; history is hosted | Thread → turn → item; `thread/start`, `thread/resume`, `thread/fork`; events carry thread/turn IDs | Session → message → part; server `session.*` operations, fork, revert, export/import | Conversation → message → run; one `providerThreadId` field shared by adapters | Separate A Gent conversation ID from the provider thread/session ID; store a provider/account/workspace binding with it. FND-003, FND-007. |
| Setup and authentication | Desktop account handoff, local CLI `auth-status`, safeStorage/Keychain vault, device connection | `account/read`, managed `account/login/*`, `account/logout`; existing external sign-in is valid | `auth list/login/logout`, provider auth routes, config; server password is optional basic auth | Codex/OpenCode rely on external sign-in; HTTP keys are in memory; readiness is inferred from model count | Add fresh readiness and managed sign-in where the runtime supports it; never treat catalog discovery as inference proof. FND-004, FND-012; PVD-002/003, CDX-002, OPC-001. |
| Persistence | Electron userData; encrypted `accounts.bin` via safeStorage; temporary-file 0600 writes; window/session state | App-server persists thread rollouts and paginated history; thread list/read/turns/items APIs | SQLite/data store under OpenCode paths; session export/import | `state.json` plus `state.json.bak`, atomic temp+rename, lock file; schema version 1 at review, version 2 added by FND-003 | Keep atomic writes and backup recovery; version schemas and migrations; do not import another user's provider thread IDs. FND-003, FND-008. |
| Restart and recovery | Reconnect/disconnect device, session ready/ended, pending prompts; desktop state restored | `thread/resume`, `turn/completed`, interrupted status, app-server child exit | Session list/get, interrupt, import/export; background service | In-memory run ledger; approvals are in memory; `providerThreadId` is restored from state without provider binding | Persist enough run/pending-interaction state to recover or explicitly fail; rebuild provider sessions deliberately. FND-006, FND-007, FND-009. |
| Local host authority | Desktop bridge checks platform, owning window, renderer origin; device connect/opt-in; keychain | Stdio is local by default; remote WebSocket is experimental and needs explicit auth | HTTP server is local by default; optional basic auth; CORS list | Bearer token and per-device tokens; SSE clients are not bound to device identity; admin token manages devices | Enforce admin/device roles at the API boundary; bind event streams to the authenticated device and close them on rotation/revocation. FND-004, FND-005. |
| Cancellation and Stop | Session stop and device/session status | `turn/interrupt`; success is acknowledged but the turn ends on `turn/completed`; child exit is definitive | Server `session.interrupt`; CLI path uses SIGTERM then SIGKILL | Codex waits for completion/exit with a 10s deadline; OpenCode aborts and settles before confirmed child exit | Treat Stop as confirmed only after the runtime acknowledges/terminates; bound escalation and release the chat reservation afterward. FND-006, FND-010; OPC-002. |
| Pending interactions | `ask_user` pop-up and connection prompts; approvals in the hosted product | Approvals: command, file change, permissions; `item/tool/requestUserInput`; `mcpServer/elicitation/request` | Permission requests (`/permission/...`), forms (`/form/...`), questions | Command/file/permission approvals are surfaced; elicitation is declined; tool questions receive `{}` | Correlate every pending request to host/run/thread; never fabricate an answer; unsupported forms must be an explicit recovery path. FND-009; HIL-001–006. |
| Credentials | Encrypted vault/safeStorage; keychain; secrets kept out of renderer | Managed auth store owned by Codex | Auth store owned by OpenCode | API keys are session-memory only and are not written to `connections.json`; no macOS Keychain option; exports exclude keys | macOS Keychain plus explicit session-only mode; secrets never enter renderer, exports, logs, or packages. FND-012; PVD-003; STT-002. |
| Diagnostics | Operational metrics and telemetry exist in the reference bridge | Structured JSON-RPC errors, request IDs, turn IDs | Structured errors with tags/status, session IDs, event stream | Partial activity/error text; no consistent correlation IDs; provider errors can contain arbitrary text | Add request/run/provider/app correlation and redaction; keep user-facing recovery copy. FND-011. |
| Launch and distribution | macOS desktop app plus hosted service; current CLI supports macOS/Linux/Windows | CLI/app-server across platforms; remote transport experimental | CLI/server across platforms | macOS-first source; Electron 45.2.2; existing package arm64/ad-hoc; Windows/Android CI still present | R1 is macOS 13+ arm64 only, signed/notarized DMG/ZIP, GitHub Releases; Windows/Android stay paused. FND-001, FND-002; REL-003/004. |

## Measurements

No latency, accuracy, or cost measurements are claimed for this foundation comparison. The relevant measured facts are versioned interface sizes and the presence/absence of contract fields:

| Measurement | Result | Method / evidence |
| --- | --- | --- |
| Codex app-server client methods | 106 | Generated 0.166.0 schema; `requestMethods()` in `scripts/runtime-baseline.mjs` |
| Codex app-server server-request methods | 10 | Same generated schema |
| Codex model reasoning metadata | Present: `defaultReasoningEffort`, `supportedReasoningEfforts` | `v2/ModelListResponse.json`; A Gent currently discards both in `server/codex.ts:101-103` |
| Codex used-method coverage | 8/8 client methods and 5/5 server-request methods present | `tests/fixtures/runtime-baselines/codex-0.166.0/manifest.json`; verified by the baseline script |
| OpenCode OpenAPI | 3.1.0, 138 paths, 169 operations | Generated from installed 2.2.5; `tests/fixtures/runtime-baselines/opencode-2.2.5/manifest.json` |
| OpenCode permission/form/MCP/skill routes | Present in the v2 API; not used by the current CLI JSON adapter | `/api/permission/*`, `/api/session/{id}/form/*`, `/api/mcp`, `/api/skill`, `/api/event` |
| Electron runtime | 45.2.2; Chromium 156.0.8078.80; Node 24.22.2; macOS 13+ | Electron release metadata, read 2026-11-05 |
| Reproducibility | Baseline script passes against the checked-in fixtures on 2026-11-05 | `node scripts/runtime-baseline.mjs` |

## Decisions and delivery mapping

| Decision / adopted behavior | Evidence and tradeoff | Delivery tasks | Acceptance / verification |
| --- | --- | --- | --- |
| A Gent owns workspace, conversation, agent, app, skill, and run records; provider threads are external references, not the primary identity. | Reason has its own workspace/session model; Codex and OpenCode both expose stable thread/session IDs that can disappear or be rebound. Reusing one `providerThreadId` across adapters risks cross-provider resumes. | FND-003, FND-007 | Schema/migration tests; two-provider switch fixture; missing/expired thread recovery. |
| Provider/account/workspace/model changes invalidate an incompatible provider binding. | Codex documents a model-provider mismatch error; OpenCode sessions are project/session scoped. | FND-003, FND-007 | Stored binding includes provider and scope; failed resume creates a fresh session or an explicit error; no silent reuse. |
| Durable state keeps the existing atomic temp+rename and `.bak` recovery, adds versioned migrations, and never imports provider thread IDs from another user's export. | Reason uses temporary-file publication and 0600; A Gent already has `StateStore.save` and backup recovery. | FND-003, FND-008 | Concurrent save, write failure, corrupt primary, valid backup, import/migration, lock contention, restart tests. |
| Event streams are authenticated and bound to the device session; rotation/revocation closes affected streams and rejects later requests. | Current `clients` Set has no device identity; a revoked device can keep an open SSE stream. Reason/Codex/OpenCode all scope connections or sessions. | FND-004, FND-005 | Backend reproduction: revoke a device with an open stream; assert no further events and a 401 on reconnect; unrelated device stays connected. |
| Stop is a lifecycle, not a fire-and-forget abort. Codex waits for `turn/completed` or child exit; OpenCode tracks the child through escalation and exit before releasing the chat. | Current Codex path already waits; OpenCode `abort` calls `finish()` immediately after SIGTERM. | FND-006, FND-010; OPC-002 | SIGTERM-resistant child fixture; Stop and host shutdown; reservation remains until confirmed cleanup; bounded timeout. |
| Pending interactions are correlated records (host/run/thread/request ID) that survive refresh/restart or cancel explicitly. Unknown forms are declined, never answered with fabricated data. | Current approvals are in-memory; elicitation is always declined; tool questions get `{}`. | FND-006, FND-009; HIL-001–006 | Simultaneous approvals, late response, refresh, restart, host switch, decline, timeout, focus recovery. |
| Shared timeout budgets cover startup, catalog, auth, tool, interaction, stream, and shutdown, with a single cancellation primitive. | Codex uses per-request timeouts; OpenCode has 30s capture and 15min run timeouts; HTTP has 12s catalog and 15min run timeouts. These are inconsistent. | FND-010 | Named budgets and tests in every adapter; slow/hung fixture; no orphaned work. |
| Provider and STT credentials use macOS Keychain (via Electron safeStorage) by default and an explicit session-only mode; secrets are excluded from renderer state, exports, logs, and artifacts. | Current keys are memory-only and endpoints are saved without keys; Reason uses safeStorage/keychain. | FND-004, FND-012; PVD-003; STT-002 | Keychain locked/unavailable, restart, clear, export scan, log redaction, packaged-app checks. |
| Local host authority is split into administrator and device roles. Only the administrator can manage devices, credentials, and host-level configuration; devices can use granted chats/apps/tools. | Current API has `admin` vs `device` but most mutation routes do not enforce admin; SSE has no device identity. | FND-004, FND-005 | API boundary tests for every mutating route; remote-device denial; admin-only device management. |
| Diagnostics use request/run/provider/app IDs and redact tokens, keys, private arguments, and arbitrary provider error bodies. | Reason has operational metrics; Codex/OpenCode return structured errors; current A Gent surfaces raw provider text in places. | FND-011 | Redaction fixtures for keys/tokens/provider bodies; user-facing recovery copy; correlation in logs. |
| Release scope is macOS 13+ arm64, Electron 45.2.2, Node 24 LTS for packaging, Codex 0.166.0/OpenCode 2.2.5 as tested runtimes, signed/notarized DMG/ZIP, no auto-update in R1. | Electron 45 requires macOS 13+; existing artifact is arm64; Windows/Android are paused. | FND-001, FND-002; REL-001/003/004 | Version probes, lockfile build, signed/notarized artifact, clean-Mac install/upgrade. |
| HTTP providers are chat/text-only in R1; MCP/tool execution is owned by Codex/OpenCode. FUT-001 (provider-independent tool loop) stays R2 unless the release scope changes. | Current HTTP adapters have no tool loop; runtime MCP lifecycle is the supported path; adding a second executor would duplicate auth/config ownership. | FND-001; D-02/D-03; HTTP-005; MCP-022 | UI capability disclosure; no advertised tool use for HTTP models; promote FUT-001 only with a new benchmark/decision. |

## Open questions and acceptance

- **Blocking questions:** none for the M0 foundation boundary. Provider-specific lifecycle decisions remain blocking for their own benchmarks (BEN-002–BEN-007); MCP UX remains BEN-008–BEN-010; reasoning/skills/speech remain their own gates.
- **Unverified observations / remaining limitations:**
  - Reason was not re-observed on this Windows host; the 0.1.119 artifact review is prior macOS evidence, and current public docs describe a newer product generation.
  - No authenticated Codex/OpenCode account, model request, MCP connection, OAuth flow, or approval was exercised.
  - The OpenCode CLI JSON event stream used by `server/opencode.ts` is not covered by the 2.2.5 OpenAPI document; its exact event schema remains unverified.
  - No macOS package, signature, notarization, clean-Mac install, or microphone permission was tested in this pass.
  - The seven model-catalog findings and three earlier backend findings remain open; this record does not close implementation tasks.
- **DRI and reviewer acceptance:** Danial (Product + Host), accepted 2026-11-05 as the M0 execution baseline. The owner is also the reviewer in this solo-maintained project; no independent reviewer was available. Assign an independent review before external release or a scope change, and recheck before changing a product promise or release boundary.
- **Evidence and validation links:** [release contract](../release-contract.md), [runtime baseline](../runtime-baselines.md), [support matrix](../support-matrix.md), [validation](../validation.md), [Codex fixture](../../tests/fixtures/runtime-baselines/codex-0.166.0/manifest.json), [OpenCode fixture](../../tests/fixtures/runtime-baselines/opencode-2.2.5/manifest.json), [baseline script](../../scripts/runtime-baseline.mjs).
- **Recheck triggers:** Codex version/schema change; OpenCode version/API change; Electron major or macOS minimum change; new provider or transport; new credential/auth model; a change to the R1/R2/paused boundary; contradictory real-service evidence.
- **Reuse limits:** this record covers foundations and release boundaries only. It does not authorize provider, MCP, reasoning, skills, speech, product, QA, or release implementation without their own accepted BEN record.
