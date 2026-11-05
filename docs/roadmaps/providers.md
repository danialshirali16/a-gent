# Provider integration completion

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Current state](../current-state-review.md)

Current state: working adapter foundations with partial product lifecycles. The provider review and evidence are in [integration-review.md](../integration-review.md). A successful catalog request does not complete provider integration.

The [reasoning board](reasoning-effort.md) owns model-specific settings; the [skills board](skills.md) owns skill management and runtime support. [ElevenLabs Speech-to-Text](speech-to-text.md) is a separate transcription connection that feeds the selected Agent, regardless of its LLM provider.

All task statuses start **To do**: partial existing code is reviewed in the audit, and task closure requires the acceptance evidence below. Owner values are suggested roles, not assigned people. Targets: **R1** first public macOS release; **R2** subsequent product completion. Priority/status rules and the dependency process are in the master roadmap.

## Shared provider lifecycle

Development gate: **BEN-002** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| PVD-001 | R1 | P0 | To do | Integrations | BEN-002, FND-002 | **Define the provider adapter and capability contract.** Done when: Chat, tools, approvals, model-specific reasoning metadata, skills, attachments, auth, cancellation, and discovery have typed, tested capabilities; STT remains a separate connection from the LLM provider. |
| PVD-002 | R1 | P0 | To do | Host | BEN-002, PVD-001 | **Replace ambiguous connection readiness.** Done when: Configured, authenticating, checking, ready, degraded, expired, and disconnected states have documented transitions and actionable errors. |
| PVD-003 | R1 | P0 | To do | Host | BEN-002, FND-012 | **Implement the selected credential storage policy.** Done when: Session-only and macOS Keychain storage are explicit; locked/unavailable storage, restart, update, and removal are tested; secrets never enter exports. |
| PVD-004 | R1 | P1 | To do | Host | BEN-002, PVD-002, PVD-003 | **Restore and recheck connections after restart.** Done when: Saved endpoints, model defaults, and credential references reload; each adapter reports fresh readiness without pretending cached credentials are valid. |
| PVD-005 | R1 | P0 | To do | UI | BEN-002, PVD-002 | **Complete provider configuration forms.** Done when: Existing values hydrate; required fields validate; provider.status error stays visible instead of closing as a successful connection. |
| PVD-006 | R1 | P1 | To do | UI + Host | BEN-002, PVD-003, PVD-005 | **Add edit, clear credential, disconnect, and reconnect.** Done when: Empty fields can intentionally clear saved values; disconnect removes the chosen access and handles active runs without corrupting chats. |
| PVD-007 | R1 | P0 | To do | Integrations | BEN-002, PVD-002 | **Separate discovery from inference health.** Done when: A listed model is not treated as proof of account access; an explicit test turn verifies the selected model and reports cost/network intent. |
| PVD-008 | R1 | P0 | To do | Host | BEN-002, PVD-001 | **Normalize incoming model catalogs.** Done when: Empty IDs are rejected, IDs deduplicated, blank names fall back to IDs, malformed payloads fail safely; stress findings 1–2 have regression evidence. |
| PVD-009 | R1 | P1 | To do | UI | BEN-002, PVD-008 | **Disambiguate identical model names.** Done when: Colliding names, including Provider default, expose distinguishing IDs; descriptions and Media/Reasoning badges remain omitted from the picker. |
| PVD-010 | R1 | P1 | To do | UI | BEN-002, PVD-008 | **Finish model search and result behavior.** Done when: Canonical Unicode search matches, query changes reset scroll, counts format/pluralize, and keyboard selection survives filtering; findings 4–6 close. |
| PVD-011 | R1 | P0 | To do | Host + UI | BEN-002, FND-003, PVD-008 | **Align model identifier and catalog limits.** Done when: Discovery, forms, API validation, persistence, import, and request dispatch use one documented contract; exact IDs are never silently shortened. |
| PVD-012 | R1 | P1 | To do | UI + Host | BEN-002, FND-001, FND-007 | **Define and implement model/default scope.** Done when: Global, agent, and chat selections behave as agreed; failed saves roll back; switching one chat cannot silently change an unrelated chat. |
| PVD-013 | R1 | P0 | To do | Host | BEN-002, PVD-001, PVD-002 | **Validate runs at the API boundary.** Done when: Disconnected/error providers, unsupported modes, unavailable models, and unsupported effort fail before creating a streaming message; UI hiding is not the guard. |
| PVD-014 | R1 | P0 | To do | Host | BEN-002, FND-004 | **Enforce endpoint and credential routing rules.** Done when: Local Ollama remains usable; redirects, private/metadata addresses, TLS, remote-host permissions, and cross-origin credential forwarding have explicit tested policy. |
| PVD-015 | R1 | P1 | To do | Host + UI | BEN-002, FND-010, FND-011 | **Add refresh cancellation and useful diagnostics.** Done when: Close/switch-host cancels stale work; retry/backoff and last-checked state are bounded; redacted diagnostics distinguish auth, network, catalog, and model errors. |
| PVD-016 | R1 | P0 | To do | QA | BEN-002, PVD-001 | **Build shared adapter contract fixtures.** Done when: Each adapter runs success, no text, malformed data, auth failure, model removal, timeout, disconnect, interruption, and restart cases. |
| PVD-017 | R1 | P0 | To do | QA + Integrations | BEN-002, CDX-006, OPC-006, HTTP-006, OLL-004, GEM-004, EFF-012 | **Verify every advertised provider end to end.** Done when: The release matrix records authorized real-service smoke evidence alongside deterministic fixtures; unverified entries cannot be advertised as supported. |
| PVD-018 | R2 | P2 | To do | Integrations | BEN-002, PVD-003, PVD-012 | **Support multiple connection profiles/accounts.** Done when: Stable profile IDs allow multiple endpoints/accounts of one kind, with migrations, credential separation, and explicit selection. |

## Codex

Development gate: **BEN-003** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| CDX-001 | R1 | P0 | To do | Integrations | BEN-003, FND-002 | **Finish Codex discovery and compatibility errors.** Done when: GUI-launch PATH, missing executable, unsupported runtime, schema drift, failed initialization, and upgrade guidance are covered. |
| CDX-002 | R1 | P1 | To do | Integrations + UI | BEN-003, CDX-001, PVD-003 | **Expose supported managed sign-in and account state.** Done when: The supported runtime's login, cancellation, expiry, and account-change lifecycle is surfaced; existing external sign-in remains usable. |
| CDX-003 | R1 | P0 | To do | Host | BEN-003, FND-006, FND-007 | **Harden thread/turn routing and concurrent chats.** Done when: Early events, late events, two chats, provider changes, resume failures, child exit, and confirmed interruption cannot cross-contaminate turns. |
| CDX-004 | R1 | P1 | To do | Integrations | BEN-003, PVD-001, CDX-001, EFF-002, EFF-003, EFF-004 | **Map model and reasoning support.** Done when: Codex preserves supported model effort/default metadata and uses the EFF contract for native wire mapping and unknown/default behavior; the selected model never inherits a global Light/Balanced/Deep list. |
| CDX-005 | R1 | P0 | To do | Host + UI | BEN-003, FND-009, HIL-001 | **Complete approvals and user interaction handling.** Done when: Command/file/network approvals, questions, and supported elicitation route to the correct pending request; cancel/decline never fabricates an answer. |
| CDX-006 | R1 | P0 | To do | QA | BEN-003, CDX-002, CDX-003, CDX-004, CDX-005 | **Accept the Codex user journey.** Done when: Fresh sign-in or existing account → choose model → chat → approved project change → Stop → restart/resume passes with recorded evidence. |

## OpenCode

Development gate: **BEN-004** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| OPC-001 | R1 | P0 | To do | Integrations | BEN-004, FND-002, PVD-001 | **Define OpenCode auth and discovery readiness.** Done when: Model-list output alone does not establish usable authorization; supported executable/version/config/auth checks are distinguished. |
| OPC-002 | R1 | P0 | To do | Host | BEN-004, FND-006 | **Fix process termination and descendant cleanup.** Done when: A SIGTERM-resistant child remains tracked, escalates, and exits; Stop and host shutdown release the chat only after cleanup is confirmed. |
| OPC-003 | R1 | P0 | To do | Integrations + UI | BEN-004, PVD-001, FND-004 | **Resolve OpenCode Chat/Work permission behavior.** Done when: The current --auto execution path is replaced or constrained by the agreed policy; UI mode and actual runtime permissions agree. |
| OPC-004 | R1 | P0 | To do | Host | BEN-004, FND-007, OPC-001 | **Isolate and resume OpenCode sessions.** Done when: Provider/account/workspace bindings and incompatible/missing session recovery are tested; attachment context is preserved on continued turns. |
| OPC-005 | R1 | P1 | To do | Host | BEN-004, FND-010, FND-011 | **Harden OpenCode event decoding.** Done when: Split UTF-8/JSON lines, tool status/output, stderr bounds, runtime errors, and final partial lines produce correct bounded messages and activities. |
| OPC-006 | R1 | P0 | To do | QA | BEN-004, OPC-001, OPC-002, OPC-003, OPC-004, OPC-005 | **Accept the OpenCode user journey.** Done when: Authenticate/configure → select → stream → tool action under policy → Stop → resume/restart passes on a supported real runtime. |

## Cloud and OpenAI-compatible HTTP endpoints

Development gate: **BEN-005** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| HTTP-001 | R1 | P0 | To do | Integrations | BEN-005, PVD-001, FND-010 | **Make HTTP streaming robust.** Done when: SSE/NDJSON framing, split UTF-8, multi-line events, final frames, malformed chunks, lost connections, cancellation, and empty completion are tested. |
| HTTP-002 | R1 | P0 | To do | Host + UI | BEN-005, PVD-014, FND-011 | **Normalize HTTP failures and retry policy.** Done when: 401/403/404/429/5xx and Retry-After are actionable and redacted; automatic retry cannot duplicate a submitted turn or spend unexpectedly. |
| HTTP-003 | R1 | P1 | To do | Integrations | BEN-005, PVD-001 | **Bound and construct model context.** Done when: System/agent instructions, history, attachment limits, context overflow, and provider-specific restrictions have deterministic request tests. |
| HTTP-004 | R1 | P0 | To do | Integrations + UI | BEN-005, PVD-007, PVD-011 | **Support endpoints without a model-list API.** Done when: A valid manually configured model can be tested and used when catalog enumeration is unsupported; auth failures stay distinct from missing catalogs. |
| HTTP-005 | R1 | P1 | To do | Integrations | BEN-005, FND-001, PVD-001 | **Publish the supported HTTP API dialect.** Done when: Chat-completions, native Ollama, and any selected Responses support are explicit; unsupported tool/MCP/vision paths are gated by capabilities. |
| HTTP-006 | R1 | P0 | To do | QA | BEN-005, HTTP-001, HTTP-002, HTTP-003, HTTP-004, HTTP-005 | **Accept Cloud and custom-endpoint journeys.** Done when: Configure → validate/test → stream → interrupt → edit/clear credential → restart passes against fixtures and the chosen real endpoints. |

## Ollama

Development gate: **BEN-006** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| OLL-001 | R1 | P1 | To do | Integrations + UI | BEN-006, PVD-002, PVD-004 | **Handle Ollama availability and empty installs.** Done when: Service absent/stopped, no downloaded models, removed models, local defaults, and reconnect have useful recovery states. |
| OLL-002 | R1 | P1 | To do | Integrations | BEN-006, HTTP-001, PVD-001 | **Map native Ollama chat capabilities.** Done when: Supported messages, thinking/usage metadata, stop/completion fields, and model identity preserve native protocol behavior. |
| OLL-003 | R1 | P1 | To do | Host | BEN-006, PVD-014 | **Support the selected local/remote Ollama policy.** Done when: Loopback works by default; explicit remote endpoints follow URL/TLS/authorization policy and never imply that the daemon is bundled. |
| OLL-004 | R1 | P0 | To do | QA | BEN-006, OLL-001, OLL-002, OLL-003 | **Accept an actual local-model session.** Done when: A documented installed model lists, streams, stops, survives app restart, and recovers after the daemon restarts. |

## Gemini / current Antigravity entry

Development gate: **BEN-007** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| GEM-001 | R1 | P0 | To do | Product + Integrations | BEN-007, FND-001 | **Resolve the Antigravity entry's product identity.** Done when: Choose Gemini API compatibility or a separately specified native Antigravity bridge; labels, requirements, and migration preserve that actual promise. |
| GEM-002 | R1 | P1 | To do | Integrations | BEN-007, GEM-001, HTTP-005 | **Validate Gemini-compatible request mapping.** Done when: Model names, message roles, stream shapes, and supported effort/content settings are checked against the chosen API version. |
| GEM-003 | R1 | P1 | To do | UI + Host | BEN-007, PVD-003, GEM-002 | **Finish key, quota, and access recovery.** Done when: Wrong key, forbidden model, quota exhaustion, expired/replaced credentials, and endpoint changes have tested recovery paths. |
| GEM-004 | R1 | P0 | To do | QA | BEN-007, GEM-001, GEM-002, GEM-003 | **Accept the advertised Google integration.** Done when: An authorized real account performs model discovery or manual fallback, test chat, streaming, cancellation, and restart; native claims require native evidence. |

## Gate

PVD-017 closes only after all providers advertised for R1 have recorded real-service evidence and the shared lifecycle/contract tasks pass. Changing scope requires a recorded FND-001 decision.
