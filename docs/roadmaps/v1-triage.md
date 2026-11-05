# Personal macOS v1.0 task triage

Approved by Danial: 2026-11-05. **69 CONTINUE, 163 PAUSE, 5 CUT/RETHINK: all 237 original IDs, each assigned exactly once.** This is the authoritative scope/effort register for the [active roadmap](../project-roadmap.md#recommended-execution-order) and [release contract](../release-contract.md).

CONTINUE means retain, correct, and verify only the personal-v1 acceptance subset. PAUSE preserves later work without making it a release dependency. CUT/RETHINK changes the stated premise, not the historical evidence. Existing code/data is preserved; deferral does not authorize deletion.

Effort estimates cover remaining work if pursued: S under one day, M roughly one to three days, L several days or more. They are rough and non-additive because tests/changes overlap. Completed work commonly needs only revalidation. Primary phase identifies where a CONTINUE item contributes; the roadmap can reuse it in later verification.

Original task statuses, full public criteria, and original dependencies remain in the linked boards. They are not copied here as a second implementation-status source. Accept v1 subsets through the support matrix/validation, without marking uncompleted public criteria Done. At approval, 32 CONTINUE items were marked Done, 36 To do, and one Review; audit-driven Review corrections are recorded in the owning boards.

## Foundations

[Original criteria and implementation status](../project-roadmap.md#foundation-tasks).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| FND-001 | Confirm the release contract and open decisions. | CONTINUE | S | V1-01 | Record the approved personal scope, exclusions, and revised gates. |
| FND-002 | Capture runtime versions and capability/schema baselines. | CONTINUE | M | V1-02 | Verify the supported runtime/schema baseline and startup checks. |
| FND-003 | Version the durable data and integration schemas. | CONTINUE | S | V1-04 | Retain and reverify durable schema migration. |
| FND-004 | Define host/device authority and tool access boundaries. | CONTINUE | S | V1-03 | Preserve desktop/host authority and credential boundaries. |
| FND-005 | Bind event streams to authenticated devices. | CONTINUE | S | V1-04 | Reverify token rotation/revocation against open streams. |
| FND-006 | Define durable run and interruption lifecycle. | CONTINUE | M | V1-04 | Make Stop, process cleanup, and shutdown truthful end to end. |
| FND-007 | Isolate provider session bindings. | CONTINUE | M | V1-04 | Verify session isolation and external CLI account changes. |
| FND-008 | Verify atomic persistence and recovery contracts. | CONTINUE | M | V1-04 | Retain atomic storage and recover application run reservations after save failure. |
| FND-009 | Add correlated pending interaction state. | CONTINUE | M | V1-04 | Preserve correlated approvals/questions and durable expiry. |
| FND-010 | Define timeout budgets and cancellation primitives. | CONTINUE | S | V1-04 | Align timeout, cancellation, and cleanup in the retained flow. |
| FND-011 | Standardize diagnostics and error events. | CONTINUE | S | V1-04 | Retain actionable, correlated, redacted diagnostics. |
| FND-012 | Define shared config/secret storage interfaces. | CONTINUE | S | V1-03 | Retain credential isolation without a new storage backend. |

## Providers

[Original criteria and implementation status](providers.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| PVD-001 | Define the provider adapter and capability contract. | CONTINUE | M | V1-03 | Retain capability/readiness contracts and gate the supported runtime. |
| PVD-002 | Replace ambiguous connection readiness. | CONTINUE | M | V1-03 | Retain capability/readiness contracts and gate the supported runtime. |
| PVD-003 | Implement the selected credential storage policy. | PAUSE | M | — | General API-key storage UI is unnecessary for external Codex login. |
| PVD-004 | Restore and recheck connections after restart. | CONTINUE | M | V1-04 | Codex must reconnect correctly after restart. |
| PVD-005 | Complete provider configuration forms. | CONTINUE | M | V1-05 | Make setup, errors, Forget, and reconnect accurate; broader key editing stays deferred. |
| PVD-006 | Add edit, clear credential, disconnect, and reconnect. | CONTINUE | M | V1-05 | Make setup, errors, Forget, and reconnect accurate; broader key editing stays deferred. |
| PVD-007 | Separate discovery from inference health. | CONTINUE | S | V1-05 | Distinguish catalog discovery from successful real inference. |
| PVD-008 | Normalize incoming model catalogs. | CONTINUE | S | V1-04 | Retain normalization/disambiguation and verify raw and normalized boundaries. |
| PVD-009 | Disambiguate identical model names. | CONTINUE | S | V1-04 | Retain normalization/disambiguation and verify raw and normalized boundaries. |
| PVD-010 | Finish model search and result behavior. | CONTINUE | S | V1-04 | Finish provider-switch scroll and count/plural behavior. |
| PVD-011 | Align model identifier and catalog limits. | CONTINUE | S | V1-04 | Apply an exact preserve-or-reject model-ID contract. |
| PVD-012 | Define and implement model/default scope. | CONTINUE | M | V1-03 | Keep chat model scope and dispatch validation reliable with default reasoning. |
| PVD-013 | Validate runs at the API boundary. | CONTINUE | M | V1-03 | Keep chat model scope and dispatch validation reliable with default reasoning. |
| PVD-014 | Enforce endpoint and credential routing rules. | PAUSE | M | — | Additional HTTP endpoint routing is outside launch scope. |
| PVD-015 | Add refresh cancellation and useful diagnostics. | CONTINUE | M | V1-04 | Invalidate stale probes and provide useful connection recovery. |
| PVD-016 | Build shared adapter contract fixtures. | CONTINUE | M | V1-06 | Add meaningful contract regressions for retained Codex behavior. |
| PVD-017 | Verify every advertised provider end to end. | CONTINUE | M | V1-06 | Accept Codex end to end; paused runtime/effort gates are excluded. |
| PVD-018 | Support multiple connection profiles/accounts. | PAUSE | L | — | Multiple accounts/profiles are unnecessary for personal testing. |
| CDX-001 | Finish Codex discovery and compatibility errors. | CONTINUE | M | V1-02 | Finder launch, missing CLI, and compatibility errors must work. |
| CDX-002 | Expose supported managed sign-in and account state. | PAUSE | M | — | External codex login is sufficient; managed sign-in can follow. |
| CDX-003 | Harden thread/turn routing and concurrent chats. | CONTINUE | L | V1-04 | Verify routing/resume and enforce one active run initially. |
| CDX-004 | Map model and reasoning support. | PAUSE | S | — | Preserve existing metadata; custom reasoning is outside v1. |
| CDX-005 | Complete approvals and user interaction handling. | CONTINUE | M | V1-04 | Command/file/access approvals and native questions are core; MCP forms are deferred. |
| CDX-006 | Accept the Codex user journey. | CONTINUE | M | V1-06 | Finish real Codex acceptance using external sign-in and default reasoning. |
| OPC-001 | Define OpenCode auth and discovery readiness. | PAUSE | M | — | OpenCode authorization readiness belongs to its later launch. |
| OPC-002 | Fix process termination and descendant cleanup. | PAUSE | M | — | Fix uncovered error/process cleanup paths before re-enabling OpenCode. |
| OPC-003 | Resolve OpenCode Chat/Work permission behavior. | PAUSE | L | — | Replace or constrain --auto with policy-consistent execution. |
| OPC-004 | Isolate and resume OpenCode sessions. | PAUSE | M | — | OpenCode session/context and event hardening follow v1. |
| OPC-005 | Harden OpenCode event decoding. | PAUSE | M | — | OpenCode session/context and event hardening follow v1. |
| OPC-006 | Accept the OpenCode user journey. | PAUSE | M | — | Real OpenCode acceptance follows its prerequisite fixes. |
| HTTP-001 | Make HTTP streaming robust. | PAUSE | L | — | Additional HTTP inference is unnecessary for the retained Mac journey. |
| HTTP-002 | Normalize HTTP failures and retry policy. | PAUSE | L | — | Additional HTTP inference is unnecessary for the retained Mac journey. |
| HTTP-003 | Bound and construct model context. | PAUSE | L | — | Additional HTTP inference is unnecessary for the retained Mac journey. |
| HTTP-004 | Support endpoints without a model-list API. | PAUSE | L | — | Additional HTTP inference is unnecessary for the retained Mac journey. |
| HTTP-005 | Publish the supported HTTP API dialect. | PAUSE | L | — | Additional HTTP inference is unnecessary for the retained Mac journey. |
| HTTP-006 | Accept Cloud and custom-endpoint journeys. | PAUSE | L | — | Additional HTTP inference is unnecessary for the retained Mac journey. |
| OLL-001 | Handle Ollama availability and empty installs. | PAUSE | M | — | Local-model support adds another installation/runtime matrix. |
| OLL-002 | Map native Ollama chat capabilities. | PAUSE | M | — | Local-model support adds another installation/runtime matrix. |
| OLL-003 | Support the selected local/remote Ollama policy. | PAUSE | M | — | Local-model support adds another installation/runtime matrix. |
| OLL-004 | Accept an actual local-model session. | PAUSE | M | — | Local-model support adds another installation/runtime matrix. |
| GEM-001 | Resolve the Antigravity entry's product identity. | CUT/RETHINK | S | — | Remove native Antigravity implications; define any future Gemini integration accurately. |
| GEM-002 | Validate Gemini-compatible request mapping. | PAUSE | M | — | Google endpoint mapping and account acceptance are deferred. |
| GEM-003 | Finish key, quota, and access recovery. | PAUSE | M | — | Google endpoint mapping and account acceptance are deferred. |
| GEM-004 | Accept the advertised Google integration. | PAUSE | M | — | Google endpoint mapping and account acceptance are deferred. |

## MCP, Connected Apps, and interactions

[Original criteria and implementation status](connect-apps.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| MCP-001 | Define an app/server connection record. | PAUSE | S | — | Preserve existing record/inventory foundations; no v1 management expansion. |
| MCP-002 | Pin and probe runtime/protocol capabilities. | PAUSE | S | — | Preserve existing record/inventory foundations; no v1 management expansion. |
| MCP-003 | Complete context-aware Codex inventory. | PAUSE | S | — | Preserve existing record/inventory foundations; no v1 management expansion. |
| MCP-004 | Add OpenCode MCP inventory. | PAUSE | S | — | Preserve existing record/inventory foundations; no v1 management expansion. |
| MCP-005 | Implement managed configuration CRUD. | PAUSE | S | — | Preserve existing record/inventory foundations; no v1 management expansion. |
| MCP-006 | Adopt existing configurations safely. | PAUSE | L | — | Configuration adoption and managed transports are separate product work. |
| MCP-007 | Complete local stdio lifecycle. | PAUSE | L | — | Configuration adoption and managed transports are separate product work. |
| MCP-008 | Complete remote Streamable HTTP lifecycle. | PAUSE | L | — | Configuration adoption and managed transports are separate product work. |
| MCP-009 | Implement supported OAuth handoff. | PAUSE | M | — | Connector OAuth and credential lifecycle are not required for local project work. |
| MCP-010 | Handle authorization and credential lifecycle. | PAUSE | M | — | Connector OAuth and credential lifecycle are not required for local project work. |
| MCP-011 | Handle cancelled and stale sign-ins. | PAUSE | M | — | Connector OAuth and credential lifecycle are not required for local project work. |
| MCP-012 | Enforce enable/disable. | PAUSE | M | — | Managed enable/remove/reload semantics are outside the launch promise. |
| MCP-013 | Complete disconnect and removal. | PAUSE | M | — | Managed enable/remove/reload semantics are outside the launch promise. |
| MCP-014 | Apply configuration to loaded sessions. | PAUSE | M | — | Managed enable/remove/reload semantics are outside the launch promise. |
| MCP-015 | Expose capability-aware tool/resource discovery. | PAUSE | S | — | Preserve existing inspection without additional discovery work. |
| MCP-016 | Implement per-agent/project app access. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| MCP-017 | Route and validate tool calls. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| MCP-018 | Complete app action approval policy. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| MCP-019 | Render bounded app results and errors. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| MCP-020 | Keep app readiness current. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| MCP-021 | Create deterministic MCP integration fixtures. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| MCP-022 | Accept the full app lifecycle. | PAUSE | L | — | App grants, execution, transports, and full connector acceptance are deferred. |
| APP-001 | Define Connect Apps information architecture. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-002 | Build Add app/server forms. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-003 | Curate the launch connector catalog. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-004 | Add app details and tool inspection. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-005 | Finish the sign-in experience. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-006 | Complete loading, empty, offline, and error states. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-007 | Provide enable, disable, edit, disconnect, and remove actions. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-008 | Expose app access in agent/project settings. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-009 | Add a non-mutating connection test. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-010 | Separate native-provider apps from raw MCP servers. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-011 | Stress-test all Connect Apps surfaces. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| APP-012 | Accept first-time app setup. | PAUSE | M | — | Full connector onboarding/management is unnecessary for local Codex project work. |
| HIL-001 | Define pending interaction types and routing. | CONTINUE | M | V1-04 | Retain routing and genuine answers to native runtime questions/approvals. |
| HIL-002 | Implement real tool-question answers. | CONTINUE | M | V1-04 | Retain routing and genuine answers to native runtime questions/approvals. |
| HIL-003 | Implement supported elicitation forms. | PAUSE | M | — | MCP forms and external URL completion are not launch requirements. |
| HIL-004 | Implement URL-flow confirmation and completion. | PAUSE | M | — | MCP forms and external URL completion are not launch requirements. |
| HIL-005 | Close pending interactions deterministically. | CONTINUE | M | V1-06 | Pending core approvals/questions must settle once and recover correctly. |
| HIL-006 | Accept human-in-the-loop recovery. | CONTINUE | M | V1-06 | Pending core approvals/questions must settle once and recover correctly. |

## Reasoning controls

[Original criteria and implementation status](reasoning-effort.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| EFF-001 | Define model-specific reasoning capabilities. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-002 | Preserve authoritative discovery metadata. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-003 | Map supported reasoning requests per adapter. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-004 | Resolve default and unknown model behavior. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-005 | Persist and migrate model-specific selections. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-006 | Reject incompatible effort at dispatch. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-007 | Replace the fixed Thinking footer. | PAUSE | S | — | Preserve implemented capability work; use provider-default execution for v1. |
| EFF-008 | Align every model and effort surface. | PAUSE | M | — | Custom controls, cross-surface races, and feature fixtures are deferred. |
| EFF-009 | Handle model-switch and catalog races. | PAUSE | M | — | Custom controls, cross-surface races, and feature fixtures are deferred. |
| EFF-010 | Build disjoint-capability regression fixtures. | PAUSE | M | — | Custom controls, cross-surface races, and feature fixtures are deferred. |
| EFF-011 | Verify real supported model settings. | PAUSE | S | — | Retain existing evidence without expanding the model-settings matrix. |
| EFF-012 | Close the model-specific reasoning gate. | PAUSE | M | — | The full custom-reasoning release gate is outside v1. |

## Agent skills

[Original criteria and implementation status](skills.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| SKL-001 | Specify the skills product and adapter matrix. | PAUSE | M | — | Skill format, discovery, and validation are new feature foundations. |
| SKL-002 | Define skill identity and discovery. | PAUSE | M | — | Skill format, discovery, and validation are new feature foundations. |
| SKL-003 | Validate skill packages. | PAUSE | M | — | Skill format, discovery, and validation are new feature foundations. |
| SKL-004 | Create and add local skills. | PAUSE | M | — | Local skill creation is unnecessary for text/project testing. |
| SKL-005 | Import repository and archive sources. | PAUSE | L | — | Skill import provenance and managed-file ownership are separate work. |
| SKL-006 | Protect managed and external skill files. | PAUSE | L | — | Skill import provenance and managed-file ownership are separate work. |
| SKL-007 | Define skill data and execution boundaries. | PAUSE | M | — | Skill-specific execution boundaries follow the skill feature. |
| SKL-008 | Integrate supported Codex skill APIs. | PAUSE | L | — | Native skill adapters and per-agent execution are deferred. |
| SKL-009 | Integrate supported OpenCode skills. | PAUSE | L | — | Native skill adapters and per-agent execution are deferred. |
| SKL-010 | Define HTTP and unsupported-runtime behavior. | PAUSE | L | — | Native skill adapters and per-agent execution are deferred. |
| SKL-011 | Apply skill scope to Agent runs. | PAUSE | L | — | Native skill adapters and per-agent execution are deferred. |
| SKL-012 | Build a dedicated Skills manager. | PAUSE | M | — | Skill management, editing, export, and invocation are deferred. |
| SKL-013 | Edit and update skills with review. | PAUSE | M | — | Skill management, editing, export, and invocation are deferred. |
| SKL-014 | Complete disable, remove, and export. | PAUSE | M | — | Skill management, editing, export, and invocation are deferred. |
| SKL-015 | Select skills in a conversation. | PAUSE | M | — | Skill management, editing, export, and invocation are deferred. |
| SKL-016 | Create adversarial package and persistence fixtures. | PAUSE | L | — | Skill-specific adversarial and real-runtime acceptance follows implementation. |
| SKL-017 | Verify skill behavior across adapters. | PAUSE | L | — | Skill-specific adversarial and real-runtime acceptance follows implementation. |
| SKL-018 | Accept accessible management states. | PAUSE | L | — | Skill-specific adversarial and real-runtime acceptance follows implementation. |
| SKL-019 | Accept real create/import and use journeys. | PAUSE | L | — | Skill-specific adversarial and real-runtime acceptance follows implementation. |
| SKL-020 | Close the skills release gate. | PAUSE | L | — | Skill-specific adversarial and real-runtime acceptance follows implementation. |

## ElevenLabs Speech-to-Text

[Original criteria and implementation status](speech-to-text.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| STT-001 | Specify the ElevenLabs transcription contract. | PAUSE | M | — | Speech configuration and authorized sessions are unnecessary for typed chat. |
| STT-002 | Add STT configuration and credential lifecycle. | PAUSE | M | — | Speech configuration and authorized sessions are unnecessary for typed chat. |
| STT-003 | Implement authorized transcription sessions. | PAUSE | M | — | Speech configuration and authorized sessions are unnecessary for typed chat. |
| STT-004 | Implement the audio and transport adapter. | PAUSE | L | — | Audio transport is a new integration. |
| STT-005 | Normalize STT failures and usage limits. | PAUSE | M | — | Speech failures and retention belong to the deferred integration. |
| STT-006 | Define audio and transcript retention. | PAUSE | M | — | Speech failures and retention belong to the deferred integration. |
| STT-007 | Add deliberate microphone capture. | PAUSE | L | — | Native microphone capture is outside v1. |
| STT-008 | Build composer recording states. | PAUSE | M | — | Recording UI is outside the retained composer flow. |
| STT-009 | Reconcile streamed transcript events. | PAUSE | L | — | Transcript reconciliation is substantial new behavior. |
| STT-010 | Send reviewed speech through the selected Agent. | PAUSE | M | — | Transcript-to-Agent submission is unnecessary for typed input. |
| STT-011 | Handle context and lifecycle races. | PAUSE | L | — | Speech lifecycle/context races follow speech implementation. |
| STT-012 | Accept accessible speech controls. | PAUSE | M | — | Speech accessibility, corpus, and measurements are feature-specific. |
| STT-013 | Create an approved speech evaluation corpus. | PAUSE | M | — | Speech accessibility, corpus, and measurements are feature-specific. |
| STT-014 | Measure accuracy, latency, and cost. | PAUSE | M | — | Speech accessibility, corpus, and measurements are feature-specific. |
| STT-015 | Add deterministic speech regression fixtures. | PAUSE | L | — | Speech regression infrastructure is deferred. |
| STT-016 | Accept an authorized ElevenLabs journey. | PAUSE | M | — | Live transcription and native microphone acceptance are deferred. |
| STT-017 | Verify microphone use in the signed macOS app. | PAUSE | M | — | Live transcription and native microphone acceptance are deferred. |
| STT-018 | Close the Speech-to-Text release gate. | PAUSE | S | — | No speech release gate applies to this scope. |

## Core product and UI

[Original criteria and implementation status](product.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| COR-001 | Complete first-run onboarding. | CONTINUE | M | V1-05 | Fresh installs need a working route to a first Codex reply. |
| COR-002 | Finish Settings and agent/chat defaults. | CONTINUE | M | V1-05 | Effective agent/chat model defaults must be understandable and durable. |
| COR-003 | Add retry/regenerate for failed or completed replies. | PAUSE | M | — | Dedicated regenerate can follow reliable resend/draft recovery. |
| COR-004 | Preserve drafts and attachment intent. | CONTINUE | M | V1-05 | Navigation, failed sends, reconnect, and restart must preserve drafts. |
| COR-005 | Harden streaming and offline recovery. | CONTINUE | L | V1-05 | Streaming and reconnect/resynchronization are the primary journey. |
| COR-006 | Recover interrupted work after a crash. | CONTINUE | M | V1-04 | Interrupted or failed work must leave a truthful, recoverable state. |
| COR-007 | Complete one-time scheduling semantics. | PAUSE | M | — | Complete scheduling semantics are unnecessary for manual testing. |
| COR-008 | Expose task/run history and failure recovery. | PAUSE | M | — | Expanded run/schedule history can follow existing activity/error views. |
| COR-009 | Finish workspace import/export recovery. | CONTINUE | M | V1-04 | Backup/export/import must preserve allowed data and exclude runtime bindings. |
| COR-010 | Complete archive, restore, and deletion policy. | PAUSE | M | — | Broader archive/deletion policy is outside core acceptance. |
| COR-011 | Unify text attachment validation. | PAUSE | M | — | Defer upload controls and attachment expansion; HTTP-003 is not a v1 dependency. |
| COR-012 | Add image/PDF/binary attachment support. | PAUSE | L | — | Binary attachments are a separate content feature. |
| COR-013 | Complete project file and diff workflows. | PAUSE | L | — | Richer file/diff editing is unnecessary for runtime project work. |
| COR-014 | Add recurring schedules. | PAUSE | L | — | Recurring scheduling is outside v1. |
| UX-001 | Audit every visible action for a complete workflow. | CONTINUE | M | V1-03 | Every retained action must complete or accurately explain unavailability. |
| UX-002 | Finish component integration and edge states. | CONTINUE | M | V1-05 | Finish core forms, errors, overlays, and picker edge states. |
| UX-003 | Perform manual accessibility acceptance. | CONTINUE | M | V1-06 | Verify keyboard/focus and core approval accessibility. |
| UX-004 | Verify motion and performance preferences. | PAUSE | S | — | Broad motion/performance refinement is not a release prerequisite. |
| UX-005 | Run real reflow and input checks. | PAUSE | M | — | The full mobile/RTL/forced-colors matrix exceeds this Mac scope. |
| UX-006 | Complete recovery and offline product copy. | CONTINUE | M | V1-05 | Missing runtime, lost host, revoked token, and missing model need recovery. |
| UX-007 | Replace unsupported browser folder prompts. | CONTINUE | S | V1-05 | Verify native Mac folder selection; browser host-path redesign is deferred. |
| UX-008 | Add optional native notifications. | PAUSE | M | — | Native notifications are optional. |

## Quality and distribution

[Original criteria and implementation status](quality-release.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Create the release acceptance matrix. | CONTINUE | S | V1-01 | Define the smaller candidate acceptance matrix. |
| QA-002 | Set and measure performance budgets. | PAUSE | L | — | Large-workspace budgets are deferred; retain an ordinary startup/stream smoke check. |
| QA-003 | Expand meaningful unit/contract tests. | CONTINUE | M | V1-04 | Cover demonstrated core failures with meaningful regressions. |
| QA-004 | Reproduce and close the earlier backend findings. | CONTINUE | M | V1-06 | Reverify retained stream/session/Stop findings; OpenCode-specific acceptance is deferred. |
| QA-005 | Add full provider and app workflow tests. | CONTINUE | M | V1-06 | Exercise the complete retained Codex workflow. |
| QA-006 | Refresh reviewed visual baselines. | CONTINUE | S | V1-06 | Review current core-screen visual baselines. |
| QA-007 | Complete automated and manual accessibility evidence. | CONTINUE | M | V1-06 | Run current axe and manual retained accessibility checks. |
| QA-008 | Run controlled real-integration smoke checks. | CONTINUE | M | V1-06 | Obtain fresh authorized real-Codex evidence. |
| QA-009 | Exercise destructive failure and recovery scenarios. | CONTINUE | L | V1-06 | Test crash, save failure, network loss, and shutdown recovery. |
| QA-010 | Align CI with the active platform scope. | CONTINUE | M | V1-02 | Make macOS checks gate the candidate and paused platforms opt-in. |
| QA-011 | Audit package and diagnostic data boundaries. | CONTINUE | S | V1-07 | Inspect package/diagnostic boundaries and exclude private state/secrets. |
| QA-012 | Sign off the release candidate evidence. | CONTINUE | S | V1-08 | Accept actual personal-candidate evidence without paused feature gates. |
| REL-001 | Make release builds reproducible. | CONTINUE | M | V1-02 | Produce a clean repeatable Mac build and explicit prerequisites. |
| REL-002 | Centralize release identity and version metadata. | CONTINUE | S | V1-07 | Align package, API, About, client, and artifact versions. |
| REL-003 | Finalize macOS package and architecture settings. | CONTINUE | M | V1-07 | Confirm architecture/minimum OS, bundle identity, and writable data paths. |
| REL-004 | Provision signing and notarization. | PAUSE | M | — | Developer ID signing/notarization is unnecessary for personal testing. |
| REL-005 | Verify packaged contents and generated notices. | CONTINUE | S | V1-07 | Verify package contents, source correspondence, and notices. |
| REL-006 | Test first install, upgrade, and uninstall data behavior. | CONTINUE | M | V1-07 | Verify install, existing data, migration, upgrade, and quit/relaunch. |
| REL-007 | Run a clean-Mac installation test. | CONTINUE | M | V1-08 | Test the actual package on Danial's Mac under the unsigned personal scope. |
| REL-008 | Finish release documentation and support material. | CONTINUE | S | V1-07 | Document setup, limitations, backup, recovery, and testing. |
| REL-009 | Finalize license, privacy, and distribution requirements. | PAUSE | M | — | Public distribution terms/privacy approval follows personal testing. |
| REL-010 | Separate build, signing, and publication permissions. | PAUSE | M | — | Signing/publication permission infrastructure is unnecessary for local delivery. |
| REL-011 | Run a small candidate pilot and triage. | CONTINUE | S | V1-08 | Use Danial's package test as the initial candidate pilot. |
| REL-012 | Publish the approved first release. | PAUSE | S | — | Public publication is outside the personally testable release goal. |

## Platforms and later work

[Original criteria and implementation status](platforms-next.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| WIN-001 | Reactivate and define Windows support. | PAUSE | L | — | Windows requires its own runtime and installation evidence. |
| WIN-002 | Verify Windows provider/process behavior. | PAUSE | L | — | Windows requires its own runtime and installation evidence. |
| WIN-003 | Finish Windows installer and portable behavior. | PAUSE | L | — | Windows requires its own runtime and installation evidence. |
| WIN-004 | Port secret/auth/app lifecycle support. | PAUSE | L | — | Windows requires its own runtime and installation evidence. |
| WIN-005 | Complete Windows signing and download trust. | PAUSE | L | — | Windows requires its own runtime and installation evidence. |
| WIN-006 | Accept and publish the Windows release. | PAUSE | L | — | Windows requires its own runtime and installation evidence. |
| AND-001 | Reactivate the Android companion contract. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-002 | Persist pairing credentials securely. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-003 | Finish HTTPS host pairing and recovery. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-004 | Verify native mobile layout/input behavior. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-005 | Complete WebView file and export workflows. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-006 | Recover streams/runs across app lifecycle. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-007 | Verify remote app authorization and tool control. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| AND-008 | Ship a verified Android package. | PAUSE | L | — | Android companion delivery is outside the Mac scope. |
| FUT-001 | Add provider-independent MCP tool execution. | PAUSE | L | — | HTTP tools, branching, usage, teams, control, and updates are later capabilities. |
| FUT-002 | Add editable conversation branches. | PAUSE | L | — | HTTP tools, branching, usage, teams, control, and updates are later capabilities. |
| FUT-003 | Add usage and budget reporting. | PAUSE | L | — | HTTP tools, branching, usage, teams, control, and updates are later capabilities. |
| FUT-004 | Define and implement the selected team workflow. | PAUSE | L | — | HTTP tools, branching, usage, teams, control, and updates are later capabilities. |
| FUT-005 | Specify native/browser-control scope. | PAUSE | L | — | HTTP tools, branching, usage, teams, control, and updates are later capabilities. |
| FUT-006 | Specify later signed application updates. | PAUSE | L | — | HTTP tools, branching, usage, teams, control, and updates are later capabilities. |

## Benchmark prerequisites

[Original criteria and implementation status](benchmarking.md).

| ID | Original task | V1 decision | Effort | Primary phase | V1 reason / scoped acceptance |
| --- | --- | --- | --- | --- | --- |
| BEN-001 | Benchmark foundations and release contract. | CONTINUE | S | V1-01 | Amend the existing release/foundation record for personal v1. |
| BEN-002 | Benchmark shared provider lifecycle. | CONTINUE | S | V1-02 | Reuse accepted provider/Codex decisions and check current applicability. |
| BEN-003 | Benchmark codex integration. | CONTINUE | S | V1-02 | Reuse accepted provider/Codex decisions and check current applicability. |
| BEN-004 | Benchmark opencode integration. | PAUSE | S | — | Retain accepted OpenCode research for its later completion. |
| BEN-005 | Benchmark cloud and custom http endpoints. | PAUSE | M | — | Additional providers are deferred. |
| BEN-006 | Benchmark ollama integration. | PAUSE | M | — | Additional providers are deferred. |
| BEN-007 | Benchmark gemini and antigravity scope. | PAUSE | M | — | Additional providers are deferred. |
| BEN-008 | Benchmark mcp connection service and runtimes. | PAUSE | S | — | Full MCP/Connected Apps development is deferred. |
| BEN-009 | Benchmark connect apps experience. | PAUSE | S | — | Full MCP/Connected Apps development is deferred. |
| BEN-010 | Benchmark questions, approvals, and elicitation. | CONTINUE | S | V1-06 | Reuse accepted core approval/question decisions. |
| BEN-011 | Benchmark core workspace workflows. | CUT/RETHINK | S | — | Replace compulsory pre-fix peer research with direct personal-release acceptance checks. |
| BEN-012 | Benchmark interface and accessibility. | CUT/RETHINK | S | — | Replace compulsory pre-fix peer research with direct personal-release acceptance checks. |
| BEN-013 | Benchmark quality and verification strategy. | CUT/RETHINK | S | — | Replace compulsory pre-fix peer research with direct personal-release acceptance checks. |
| BEN-014 | Benchmark macos packaging and release. | CUT/RETHINK | S | — | Replace compulsory pre-fix peer research with direct personal-release acceptance checks. |
| BEN-015 | Benchmark windows delivery. | PAUSE | L | — | Platform/future-feature comparisons follow those scopes. |
| BEN-016 | Benchmark android companion. | PAUSE | L | — | Platform/future-feature comparisons follow those scopes. |
| BEN-017 | Benchmark later integrations and parity. | PAUSE | L | — | Platform/future-feature comparisons follow those scopes. |
| BEN-018 | Benchmark speech provider, api, and credentials. | PAUSE | L | — | Speech research is unnecessary before this release. |
| BEN-019 | Benchmark microphone and transcript-to-agent ux. | PAUSE | L | — | Speech research is unnecessary before this release. |
| BEN-020 | Benchmark speech quality and release method. | PAUSE | L | — | Speech research is unnecessary before this release. |
| BEN-021 | Benchmark model reasoning capability contract. | PAUSE | S | — | Custom reasoning controls are deferred. |
| BEN-022 | Benchmark model-specific thinking controls. | PAUSE | S | — | Custom reasoning controls are deferred. |
| BEN-023 | Benchmark skill format, sources, and storage. | PAUSE | L | — | Skills research is deferred with skills implementation. |
| BEN-024 | Benchmark skill runtime use and management ux. | PAUSE | L | — | Skills research is deferred with skills implementation. |
| BEN-025 | Benchmark skills quality and release method. | PAUSE | L | — | Skills research is deferred with skills implementation. |
