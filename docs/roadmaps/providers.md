# Provider integration completion

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Current state](../current-state-review.md)

Current state: working adapter foundations with partial product lifecycles. The historical gap baseline is [integration-review.md](../integration-review.md); current evidence is in [validation.md](../validation.md). A successful catalog request does not complete provider integration. **BEN-002 shared lifecycle is accepted (2026-11-05):** [record](../benchmarks/BEN-002-provider-lifecycle.md). **R1 scope is Codex/OpenCode only:** the 2026-11-05 D-02 amendment defers HTTP/Ollama/Gemini to the distant future.

The [reasoning board](reasoning-effort.md) owns model-specific settings; the [skills board](skills.md) owns skill management and runtime support. [ElevenLabs Speech-to-Text](speech-to-text.md) is a separate transcription connection that feeds the selected Agent, regardless of its LLM provider.

Status is maintained in the tables below: PVD-001–016, CDX-004, and OPC-002 are Done; remaining M2 work is PVD-017, CDX/OPC, and EFF-008–012. Task closure requires the acceptance evidence below. Owner values are suggested roles, not assigned people. Targets: **R1** first public macOS release; **R2** subsequent product completion. Priority/status rules and the dependency process are in the master roadmap.

## Shared provider lifecycle

Development gate: **BEN-002** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| PVD-001 | R1 | P0 | Done | Integrations | BEN-002, FND-002 | **Define the provider adapter and capability contract.** Accepted 2026-11-05: typed chat/streaming/tools/approvals/skills/attachments/reasoning/MCP/discovery/auth/cancellation capabilities per provider kind; Codex reasoning metadata preserved; STT remains separate. [Record](../provider-lifecycle.md). |
| PVD-002 | R1 | P0 | Done | Host | BEN-002, PVD-001 | **Replace ambiguous connection readiness.** Accepted 2026-11-05: lifecycle readiness and UI/API gating implemented; transition/legacy tests pass.** |
| PVD-003 | R1 | P0 | Done | Host | BEN-002, FND-012 | **Implement the selected credential storage policy.** Accepted 2026-11-05: session-only + Keychain adapter policy, refs, removal, export exclusion; locked/missing unit tests pass.** |
| PVD-004 | R1 | P1 | Done | Host | BEN-002, PVD-002, PVD-003 | **Restore and recheck connections after restart.** Accepted 2026-11-05: endpoints/model/secret refs reload; readiness resets; real Codex restart/reconnect/resume passed.** |
| PVD-005 | R1 | P0 | Done | UI | BEN-002, PVD-002 | **Complete provider configuration forms.** Accepted 2026-11-05: forms hydrate endpoint/model, errors stay in-form, failed connect does not close.** |
| PVD-006 | R1 | P1 | Done | UI + Host | BEN-002, PVD-003, PVD-005 | **Add edit, clear credential, disconnect, and reconnect.** Accepted 2026-11-05: disconnect/clear endpoint+UI, active-run rejection, reconnect.** |
| PVD-007 | R1 | P0 | Done | Integrations | BEN-002, PVD-002 | **Separate discovery from inference health.** Accepted 2026-11-05: provider test endpoint requires explicit confirmation, sends a live model turn, reports latency/cost/network intent, and sets `verifiedBy: inference`; catalog-only stays catalog. [Record](../provider-lifecycle.md#inference-test). |
| PVD-008 | R1 | P0 | Done | Host | BEN-002, PVD-001 | **Normalize incoming model catalogs.** Accepted 2026-11-05: shared normalization rejects empty/overlong IDs, deduplicates, falls back names to IDs, bounds descriptions and catalogs, and has regression tests for findings 1–2. [Record](../provider-lifecycle.md). |
| PVD-009 | R1 | P1 | Done | UI | BEN-002, PVD-008 | **Disambiguate identical model names.** Accepted 2026-11-05: colliding names show a distinguishing ID suffix without descriptions/badges.** |
| PVD-010 | R1 | P1 | Done | UI | BEN-002, PVD-008 | **Finish model search and result behavior.** Accepted 2026-11-05: NFKC search, scroll reset, plural counts, filtering keyboard behavior.** |
| PVD-011 | R1 | P0 | Done | Host + UI | BEN-002, FND-003, PVD-008 | **Align model identifier and catalog limits.** Accepted 2026-11-05: one 200-character limit is used by discovery, provider connect, form, agent/config persistence, import, message dispatch, and catalog normalization; exact IDs are preserved or rejected. [Record](../provider-lifecycle.md). |
| PVD-012 | R1 | P1 | Done | UI + Host | BEN-002, FND-001, FND-007 | **Define and implement model/default scope.** Accepted 2026-11-05: chat-level provider/model/effort overrides are persisted and used by runs; agent/global defaults remain; failed saves roll back; switching one chat leaves another and the agent unchanged. [Record](../provider-lifecycle.md#selection-scope). |
| PVD-013 | R1 | P0 | Done | Host | BEN-002, PVD-001, PVD-002 | **Validate runs at the API boundary.** Accepted 2026-11-05: readiness, unavailable model, and incompatible enum/unsupported effort fail before streaming.** |
| PVD-014 | R1 | P0 | Done | Host | BEN-002, FND-004 | **Enforce endpoint and credential routing rules.** Accepted 2026-11-05: local Ollama allowed; remote HTTP requires HTTPS; private/metadata hosts rejected; redirects refused; embedded credentials/query/fragment rejected; tests cover policy. [Notes](../provider-lifecycle.md#endpoint-policy). |
| PVD-015 | R1 | P1 | Done | Host + UI | BEN-002, FND-010, FND-011 | **Add refresh cancellation and useful diagnostics.** Accepted 2026-11-05: probe generations discard stale results, lastCheckedAt/errorKind are exposed, redacted detail distinguishes auth/network/catalog/model/runtime; bounded catalog/stream budgets. |
| PVD-016 | R1 | P0 | Done | QA | BEN-002, PVD-001 | **Build shared adapter contract fixtures.** Accepted 2026-11-05: Codex/OpenCode/HTTP success, auth, malformed, no-text, model removal, timeout, disconnect, interruption, and restart cases mapped in [fixtures](../adapter-fixtures.md); deferred adapters excluded. |
| PVD-017 | R1 | P0 | To do | QA + Integrations | BEN-002, CDX-006, OPC-006, EFF-012 | **Verify every advertised provider end to end.** Done when: The release matrix records authorized real-service evidence for the two R1 runtimes (Codex/OpenCode) alongside deterministic fixtures; deferred providers are not advertised as supported. |
| PVD-018 | R2 | P2 | To do | Integrations | BEN-002, PVD-003, PVD-012 | **Support multiple connection profiles/accounts.** Done when: Stable profile IDs allow multiple endpoints/accounts of one kind, with migrations, credential separation, and explicit selection. |

## Codex

Development gate: **BEN-003** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| CDX-001 | R1 | P0 | To do | Integrations | BEN-003, FND-002 | **Finish Codex discovery and compatibility errors.** Done when: GUI-launch PATH, missing executable, unsupported runtime, schema drift, failed initialization, and upgrade guidance are covered. |
| CDX-002 | R1 | P1 | To do | Integrations + UI | BEN-003, CDX-001, PVD-003 | **Expose supported managed sign-in and account state.** Done when: The supported runtime's login, cancellation, expiry, and account-change lifecycle is surfaced; existing external sign-in remains usable. |
| CDX-003 | R1 | P0 | To do | Host | BEN-003, FND-006, FND-007 | **Harden thread/turn routing and concurrent chats.** Done when: Early events, late events, two chats, provider changes, resume failures, child exit, and confirmed interruption cannot cross-contaminate turns. |
| CDX-004 | R1 | P1 | Done | Integrations | BEN-003, PVD-001, CDX-001, EFF-002, EFF-003, EFF-004 | **Map model and reasoning support.** Accepted 2026-11-05: live Codex metadata is preserved, exact enum mapping/unknown omission implemented, fixed Light/Balanced/Deep removed. [Evidence](../reasoning-verification.md). |
| CDX-005 | R1 | P0 | To do | Host + UI | BEN-003, FND-009, HIL-001 | **Complete approvals and user interaction handling.** Done when: Command/file/network approvals, questions, and supported elicitation route to the correct pending request; cancel/decline never fabricates an answer. |
| CDX-006 | R1 | P0 | Review | QA | BEN-003, CDX-002, CDX-003, CDX-004, CDX-005 | **Accept the Codex user journey.** Review: real `gpt-6.1-sol` chat, model selection, Work-mode file write, host restart, reconnect, thread resume/append, and direct Stop passed; explicit approval prompt and edit/remove remain to verify. [Evidence](../validation.md#m2-real-provider-smoke). |

## OpenCode

Development gate: **BEN-004** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| OPC-001 | R1 | P0 | To do | Integrations | BEN-004, FND-002, PVD-001 | **Define OpenCode auth and discovery readiness.** Done when: Model-list output alone does not establish usable authorization; supported executable/version/config/auth checks are distinguished. |
| OPC-002 | R1 | P0 | Done | Host | BEN-004, FND-006 | **Fix process termination and descendant cleanup.** Accepted 2026-11-05: OpenCode child tracking, SIGTERM→SIGKILL escalation, confirmed exit, Stop reservation, and shutdown persistence pass fixtures. [Record](../run-lifecycle.md). |
| OPC-003 | R1 | P0 | To do | Integrations + UI | BEN-004, PVD-001, FND-004 | **Resolve OpenCode Chat/Work permission behavior.** Done when: The current --auto execution path is replaced or constrained by the agreed policy; UI mode and actual runtime permissions agree. |
| OPC-004 | R1 | P0 | To do | Host | BEN-004, FND-007, OPC-001 | **Isolate and resume OpenCode sessions.** Done when: Provider/account/workspace bindings and incompatible/missing session recovery are tested; attachment context is preserved on continued turns. |
| OPC-005 | R1 | P1 | To do | Host | BEN-004, FND-010, FND-011 | **Harden OpenCode event decoding.** Done when: Split UTF-8/JSON lines, tool status/output, stderr bounds, runtime errors, and final partial lines produce correct bounded messages and activities. |
| OPC-006 | R1 | P0 | To do | QA | BEN-004, OPC-001, OPC-002, OPC-003, OPC-004, OPC-005 | **Accept the OpenCode user journey.** Done when: Authenticate/configure → select → stream → tool action under policy → Stop → resume/restart passes on a supported real runtime. |

## Cloud and OpenAI-compatible HTTP endpoints — deferred to distant future

**Not R1.** The 2026-11-05 D-02 amendment defers these tasks to the distant future. Resuming requires an amended release contract, BEN-005, and explicit R1/R2 scope.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| HTTP-001 | R2 | P2 | To do | Integrations | BEN-005, PVD-001, FND-010 | **Make HTTP streaming robust.** Done when: SSE/NDJSON framing, split UTF-8, multi-line events, final frames, malformed chunks, lost connections, cancellation, and empty completion are tested. |
| HTTP-002 | R2 | P2 | To do | Host + UI | BEN-005, PVD-014, FND-011 | **Normalize HTTP failures and retry policy.** Done when: 401/403/404/429/5xx and Retry-After are actionable and redacted; automatic retry cannot duplicate a submitted turn or spend unexpectedly. |
| HTTP-003 | R2 | P2 | To do | Integrations | BEN-005, PVD-001 | **Bound and construct model context.** Done when: System/agent instructions, history, attachment limits, context overflow, and provider-specific restrictions have deterministic request tests. |
| HTTP-004 | R2 | P2 | To do | Integrations + UI | BEN-005, PVD-007, PVD-011 | **Support endpoints without a model-list API.** Done when: A valid manually configured model can be tested and used when catalog enumeration is unsupported; auth failures stay distinct from missing catalogs. |
| HTTP-005 | R2 | P2 | To do | Integrations | BEN-005, FND-001, PVD-001 | **Publish the supported HTTP API dialect.** Done when: Chat-completions, native Ollama, and any selected Responses support are explicit; unsupported tool/MCP/vision paths are gated by capabilities. |
| HTTP-006 | R2 | P2 | To do | QA | BEN-005, HTTP-001, HTTP-002, HTTP-003, HTTP-004, HTTP-005 | **Accept Cloud and custom-endpoint journeys.** Done when: Configure → validate/test → stream → interrupt → edit/clear credential → restart passes against fixtures and the chosen real endpoints. |

## Ollama — deferred to distant future

**Not R1.** The 2026-11-05 D-02 amendment defers these tasks. Resuming requires an amended release contract, BEN-006, and an installed local model.

Development gate: **BEN-006** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| OLL-001 | R2 | P2 | To do | Integrations + UI | BEN-006, PVD-002, PVD-004 | **Handle Ollama availability and empty installs.** Done when: Service absent/stopped, no downloaded models, removed models, local defaults, and reconnect have useful recovery states. |
| OLL-002 | R2 | P2 | To do | Integrations | BEN-006, HTTP-001, PVD-001 | **Map native Ollama chat capabilities.** Done when: Supported messages, thinking/usage metadata, stop/completion fields, and model identity preserve native protocol behavior. |
| OLL-003 | R2 | P2 | To do | Host | BEN-006, PVD-014 | **Support the selected local/remote Ollama policy.** Done when: Loopback works by default; explicit remote endpoints follow URL/TLS/authorization policy and never imply that the daemon is bundled. |
| OLL-004 | R2 | P2 | To do | QA | BEN-006, OLL-001, OLL-002, OLL-003 | **Accept an actual local-model session.** Done when: A documented installed model lists, streams, stops, survives app restart, and recovers after the daemon restarts. |

## Gemini / current Antigravity entry — deferred to distant future

**Not R1.** The 2026-11-05 D-02 amendment defers these tasks. Resuming requires an amended release contract, BEN-007, and a decision between Gemini API compatibility and a native Antigravity bridge.

Development gate: **BEN-007** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| GEM-001 | R2 | P2 | To do | Product + Integrations | BEN-007, FND-001 | **Resolve the Antigravity entry's product identity.** Done when: Choose Gemini API compatibility or a separately specified native Antigravity bridge; labels, requirements, and migration preserve that actual promise. |
| GEM-002 | R2 | P2 | To do | Integrations | BEN-007, GEM-001, HTTP-005 | **Validate Gemini-compatible request mapping.** Done when: Model names, message roles, stream shapes, and supported effort/content settings are checked against the chosen API version. |
| GEM-003 | R2 | P2 | To do | UI + Host | BEN-007, PVD-003, GEM-002 | **Finish key, quota, and access recovery.** Done when: Wrong key, forbidden model, quota exhaustion, expired/replaced credentials, and endpoint changes have tested recovery paths. |
| GEM-004 | R2 | P2 | To do | QA | BEN-007, GEM-001, GEM-002, GEM-003 | **Accept the advertised Google integration.** Done when: An authorized real account performs model discovery or manual fallback, test chat, streaming, cancellation, and restart; native claims require native evidence. |

## Gate

PVD-017 closes only after all providers advertised for R1 have recorded real-service evidence and the shared lifecycle/contract tasks pass. Changing scope requires a recorded FND-001 decision.
