# Provider integration completion

Updated: 2026-11-05. [Active v1 path](../project-roadmap.md#recommended-execution-order) · [Every task's v1 decision](v1-triage.md) · [Current state](../current-state-review.md)

**Personal macOS v1 amendment:** Codex and selected shared provider corrections are CONTINUE. OpenCode, additional providers, managed login, and custom reasoning are paused. PVD-017 accepts external-sign-in Codex only for personal v1.

The tables retain original public R1/R2 targets, full acceptance criteria, and original dependencies for later work. Current implementation statuses are maintained here; v1 scope/effort is maintained only in the triage. A v1 subset can pass its support-matrix row without declaring the whole original task complete. Old M2/M3 continuation and broad feature gates do not govern the active path.

The [approved D-11 exception](../release-contract.md#d-11-benchmark-policy) permits CONTINUE correction/QA/packaging without new peer comparisons. Compatibility research, tests, real Codex checks, and actual Mac package evidence remain required. Deferred full-scope work retains applicable benchmarks on resumption. Owner labels remain suggested roles; Danial is the acting accountable owner.

## Shared provider lifecycle

Original benchmark dependency: BEN-002. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| PVD-001 | R1 | P0 | Done | Integrations | BEN-002, FND-002 | **Define the provider adapter and capability contract.** Accepted 2026-11-05: typed chat/streaming/tools/approvals/skills/attachments/reasoning/MCP/discovery/auth/cancellation capabilities per provider kind; Codex reasoning metadata preserved; STT remains separate. [Record](../provider-lifecycle.md). |
| PVD-002 | R1 | P0 | Done | Host | BEN-002, PVD-001 | **Replace ambiguous connection readiness.** Accepted 2026-11-05: lifecycle readiness and UI/API gating implemented; transition/legacy tests pass.** |
| PVD-003 | R1 | P0 | Done | Host | BEN-002, FND-012 | **Implement the selected credential storage policy.** Accepted 2026-11-05: session-only + Keychain adapter policy, refs, removal, export exclusion; locked/missing unit tests pass.** |
| PVD-004 | R1 | P1 | Done | Host | BEN-002, PVD-002, PVD-003 | **Restore and recheck connections after restart.** Accepted 2026-11-05: endpoints/model/secret refs reload; readiness resets; real Codex restart/reconnect/resume passed.** |
| PVD-005 | R1 | P0 | Done | UI | BEN-002, PVD-002 | **Complete provider configuration forms.** Accepted 2026-11-05: forms hydrate endpoint/model, errors stay in-form, failed connect does not close.** |
| PVD-006 | R1 | P1 | Review | UI + Host | BEN-002, PVD-003, PVD-005 | **Add edit, clear credential, disconnect, and reconnect.** Review reopened 2026-11-05: blank configuration fields are omitted by the UI, so deliberate clearing/edit acceptance is incomplete; Codex Forget/reconnect also needs fresh evidence. Previous acceptance evidence: Accepted 2026-11-05: disconnect/clear endpoint+UI, active-run rejection, reconnect.** |
| PVD-007 | R1 | P0 | Done | Integrations | BEN-002, PVD-002 | **Separate discovery from inference health.** Accepted 2026-11-05: provider test endpoint requires explicit confirmation, sends a live model turn, reports latency/cost/network intent, and sets `verifiedBy: inference`; catalog-only stays catalog. [Record](../provider-lifecycle.md#inference-test). |
| PVD-008 | R1 | P0 | Done | Host | BEN-002, PVD-001 | **Normalize incoming model catalogs.** Accepted 2026-11-05: shared normalization rejects empty/overlong IDs, deduplicates, falls back names to IDs, bounds descriptions and catalogs, and has regression tests for findings 1–2. [Record](../provider-lifecycle.md). |
| PVD-009 | R1 | P1 | Done | UI | BEN-002, PVD-008 | **Disambiguate identical model names.** Accepted 2026-11-05: colliding names show a distinguishing ID suffix without descriptions/badges.** |
| PVD-010 | R1 | P1 | Review | UI | BEN-002, PVD-008 | **Finish model search and result behavior.** Review reopened 2026-11-05: NFKC search and query scroll reset exist, but provider-only scroll reset, live singular/plural, and count formatting remain incomplete. Previous acceptance evidence: Accepted 2026-11-05: NFKC search, scroll reset, plural counts, filtering keyboard behavior.** |
| PVD-011 | R1 | P0 | Review | Host + UI | BEN-002, FND-003, PVD-008 | **Align model identifier and catalog limits.** Review reopened 2026-11-05: shared 200-character limits exist, but saved connection loading still silently slices model IDs instead of preserving or rejecting them. Previous acceptance evidence: Accepted 2026-11-05: one 200-character limit is used by discovery, provider connect, form, agent/config persistence, import, message dispatch, and catalog normalization; exact IDs are preserved or rejected. [Record](../provider-lifecycle.md). |
| PVD-012 | R1 | P1 | Done | UI + Host | BEN-002, FND-001, FND-007 | **Define and implement model/default scope.** Accepted 2026-11-05: chat-level provider/model/effort overrides are persisted and used by runs; agent/global defaults remain; failed saves roll back; switching one chat leaves another and the agent unchanged. [Record](../provider-lifecycle.md#selection-scope). |
| PVD-013 | R1 | P0 | Done | Host | BEN-002, PVD-001, PVD-002 | **Validate runs at the API boundary.** Accepted 2026-11-05: readiness, unavailable model, and incompatible enum/unsupported effort fail before streaming.** |
| PVD-014 | R1 | P0 | Done | Host | BEN-002, FND-004 | **Enforce endpoint and credential routing rules.** Accepted 2026-11-05: local Ollama allowed; remote HTTP requires HTTPS; private/metadata hosts rejected; redirects refused; embedded credentials/query/fragment rejected; tests cover policy. [Notes](../provider-lifecycle.md#endpoint-policy). |
| PVD-015 | R1 | P1 | Review | Host + UI | BEN-002, FND-010, FND-011 | **Add refresh cancellation and useful diagnostics.** Review reopened 2026-11-05: an outstanding probe can restore ready after Forget; disconnect does not invalidate its generation. Previous acceptance evidence: Accepted 2026-11-05: probe generations discard stale results, lastCheckedAt/errorKind are exposed, redacted detail distinguishes auth/network/catalog/model/runtime; bounded catalog/stream budgets. |
| PVD-016 | R1 | P0 | Review | QA | BEN-002, PVD-001 | **Build shared adapter contract fixtures.** Review reopened 2026-11-05: the readiness audit demonstrated untested stale-probe and runtime-error cleanup paths; the fixture coverage map must distinguish implemented tests from intended coverage. Previous acceptance evidence: Accepted 2026-11-05: Codex/OpenCode/HTTP success, auth, malformed, no-text, model removal, timeout, disconnect, interruption, and restart cases mapped in [fixtures](../adapter-fixtures.md); deferred adapters excluded. |
| PVD-017 | R1 | P0 | To do | QA + Integrations | BEN-002, CDX-006, OPC-006, EFF-012 | **Verify every advertised provider end to end.** Done when: The release matrix records authorized real-service evidence for the two R1 runtimes (Codex/OpenCode) alongside deterministic fixtures; deferred providers are not advertised as supported. |
| PVD-018 | R2 | P2 | To do | Integrations | BEN-002, PVD-003, PVD-012 | **Support multiple connection profiles/accounts.** Done when: Stable profile IDs allow multiple endpoints/accounts of one kind, with migrations, credential separation, and explicit selection. |

## Codex

Original benchmark dependency: BEN-003. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| CDX-001 | R1 | P0 | To do | Integrations | BEN-003, FND-002 | **Finish Codex discovery and compatibility errors.** Done when: GUI-launch PATH, missing executable, unsupported runtime, schema drift, failed initialization, and upgrade guidance are covered. |
| CDX-002 | R1 | P1 | To do | Integrations + UI | BEN-003, CDX-001, PVD-003 | **Expose supported managed sign-in and account state.** Done when: The supported runtime's login, cancellation, expiry, and account-change lifecycle is surfaced; existing external sign-in remains usable. |
| CDX-003 | R1 | P0 | To do | Host | BEN-003, FND-006, FND-007 | **Harden thread/turn routing and concurrent chats.** Done when: Early events, late events, two chats, provider changes, resume failures, child exit, and confirmed interruption cannot cross-contaminate turns. |
| CDX-004 | R1 | P1 | Done | Integrations | BEN-003, PVD-001, CDX-001, EFF-002, EFF-003, EFF-004 | **Map model and reasoning support.** Accepted 2026-11-05: live Codex metadata is preserved, exact enum mapping/unknown omission implemented, fixed Light/Balanced/Deep removed. [Evidence](../reasoning-verification.md). |
| CDX-005 | R1 | P0 | To do | Host + UI | BEN-003, FND-009, HIL-001 | **Complete approvals and user interaction handling.** Done when: Command/file/network approvals, questions, and supported elicitation route to the correct pending request; cancel/decline never fabricates an answer. |
| CDX-006 | R1 | P0 | Review | QA | BEN-003, CDX-002, CDX-003, CDX-004, CDX-005 | **Accept the Codex user journey.** Review: real `gpt-6.1-sol` chat, model selection, Work-mode file write, host restart, reconnect, thread resume/append, and direct Stop passed; explicit approval prompt and edit/remove remain to verify. [Evidence](../validation.md#m2-real-provider-smoke). |

## OpenCode

Original benchmark dependency: BEN-004. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| OPC-001 | R1 | P0 | To do | Integrations | BEN-004, FND-002, PVD-001 | **Define OpenCode auth and discovery readiness.** Done when: Model-list output alone does not establish usable authorization; supported executable/version/config/auth checks are distinguished. |
| OPC-002 | R1 | P0 | Review | Host | BEN-004, FND-006 | **Fix process termination and descendant cleanup.** Review reopened 2026-11-05: an error-event child remained alive after run rejection and bridge.close(); normal Stop escalation fixtures do not prove all error/descendant cleanup. Previous acceptance evidence: Accepted 2026-11-05: OpenCode child tracking, SIGTERM→SIGKILL escalation, confirmed exit, Stop reservation, and shutdown persistence pass fixtures. [Record](../run-lifecycle.md). |
| OPC-003 | R1 | P0 | To do | Integrations + UI | BEN-004, PVD-001, FND-004 | **Resolve OpenCode Chat/Work permission behavior.** Done when: The current --auto execution path is replaced or constrained by the agreed policy; UI mode and actual runtime permissions agree. |
| OPC-004 | R1 | P0 | To do | Host | BEN-004, FND-007, OPC-001 | **Isolate and resume OpenCode sessions.** Done when: Provider/account/workspace bindings and incompatible/missing session recovery are tested; attachment context is preserved on continued turns. |
| OPC-005 | R1 | P1 | To do | Host | BEN-004, FND-010, FND-011 | **Harden OpenCode event decoding.** Done when: Split UTF-8/JSON lines, tool status/output, stderr bounds, runtime errors, and final partial lines produce correct bounded messages and activities. |
| OPC-006 | R1 | P0 | To do | QA | BEN-004, OPC-001, OPC-002, OPC-003, OPC-004, OPC-005 | **Accept the OpenCode user journey.** Done when: Authenticate/configure → select → stream → tool action under policy → Stop → resume/restart passes on a supported real runtime. |

## Cloud and OpenAI-compatible HTTP endpoints — deferred to distant future

**Not R1.** The 2026-11-05 D-02 amendment defers these tasks to the distant future. Resuming requires an amended release contract, BEN-005, and explicit R1/R2 scope.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| HTTP-001 | R2 | P2 | To do | Integrations | BEN-005, PVD-001, FND-010 | **Make HTTP streaming robust.** Done when: SSE/NDJSON framing, split UTF-8, multi-line events, final frames, malformed chunks, lost connections, cancellation, and empty completion are tested. |
| HTTP-002 | R2 | P2 | To do | Host + UI | BEN-005, PVD-014, FND-011 | **Normalize HTTP failures and retry policy.** Done when: 401/403/404/429/5xx and Retry-After are actionable and redacted; automatic retry cannot duplicate a submitted turn or spend unexpectedly. |
| HTTP-003 | R2 | P2 | To do | Integrations | BEN-005, PVD-001 | **Bound and construct model context.** Done when: System/agent instructions, history, attachment limits, context overflow, and provider-specific restrictions have deterministic request tests. |
| HTTP-004 | R2 | P2 | To do | Integrations + UI | BEN-005, PVD-007, PVD-011 | **Support endpoints without a model-list API.** Done when: A valid manually configured model can be tested and used when catalog enumeration is unsupported; auth failures stay distinct from missing catalogs. |
| HTTP-005 | R2 | P2 | To do | Integrations | BEN-005, FND-001, PVD-001 | **Publish the supported HTTP API dialect.** Done when: Chat-completions, native Ollama, and any selected Responses support are explicit; unsupported tool/MCP/vision paths are gated by capabilities. |
| HTTP-006 | R2 | P2 | To do | QA | BEN-005, HTTP-001, HTTP-002, HTTP-003, HTTP-004, HTTP-005 | **Accept Cloud and custom-endpoint journeys.** Done when: Configure → validate/test → stream → interrupt → edit/clear credential → restart passes against fixtures and the chosen real endpoints. |

## Ollama — deferred to distant future

**Not R1.** The 2026-11-05 D-02 amendment defers these tasks. Resuming requires an amended release contract, BEN-006, and an installed local model.

Original benchmark dependency: BEN-006. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| OLL-001 | R2 | P2 | To do | Integrations + UI | BEN-006, PVD-002, PVD-004 | **Handle Ollama availability and empty installs.** Done when: Service absent/stopped, no downloaded models, removed models, local defaults, and reconnect have useful recovery states. |
| OLL-002 | R2 | P2 | To do | Integrations | BEN-006, HTTP-001, PVD-001 | **Map native Ollama chat capabilities.** Done when: Supported messages, thinking/usage metadata, stop/completion fields, and model identity preserve native protocol behavior. |
| OLL-003 | R2 | P2 | To do | Host | BEN-006, PVD-014 | **Support the selected local/remote Ollama policy.** Done when: Loopback works by default; explicit remote endpoints follow URL/TLS/authorization policy and never imply that the daemon is bundled. |
| OLL-004 | R2 | P2 | To do | QA | BEN-006, OLL-001, OLL-002, OLL-003 | **Accept an actual local-model session.** Done when: A documented installed model lists, streams, stops, survives app restart, and recovers after the daemon restarts. |

## Gemini / current Antigravity entry — deferred to distant future

**Not R1.** The 2026-11-05 D-02 amendment defers these tasks. Resuming requires an amended release contract, BEN-007, and a decision between Gemini API compatibility and a native Antigravity bridge.

Original benchmark dependency: BEN-007. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| GEM-001 | R2 | P2 | To do | Product + Integrations | BEN-007, FND-001 | **Resolve the Antigravity entry's product identity.** Done when: Choose Gemini API compatibility or a separately specified native Antigravity bridge; labels, requirements, and migration preserve that actual promise. |
| GEM-002 | R2 | P2 | To do | Integrations | BEN-007, GEM-001, HTTP-005 | **Validate Gemini-compatible request mapping.** Done when: Model names, message roles, stream shapes, and supported effort/content settings are checked against the chosen API version. |
| GEM-003 | R2 | P2 | To do | UI + Host | BEN-007, PVD-003, GEM-002 | **Finish key, quota, and access recovery.** Done when: Wrong key, forbidden model, quota exhaustion, expired/replaced credentials, and endpoint changes have tested recovery paths. |
| GEM-004 | R2 | P2 | To do | QA | BEN-007, GEM-001, GEM-002, GEM-003 | **Accept the advertised Google integration.** Done when: An authorized real account performs model discovery or manual fallback, test chat, streaming, cancellation, and restart; native claims require native evidence. |

## Gate

For personal v1, PVD-017/CDX-006 use the retained Codex setup → inference → project/approval → Stop → restart/reconnect journey. Managed sign-in, OPC-006, and EFF-012 are excluded dependencies. Full public provider criteria below remain open where not implemented; scope/evidence must not be inferred from a successful catalog request.
