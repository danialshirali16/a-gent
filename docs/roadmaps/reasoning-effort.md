# Model-specific reasoning and Thinking controls

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Task boards](README.md) · [Benchmark process](../benchmarks/README.md)

The existing Light/Balanced/Deep choices must be replaced by the selected model's actual supported settings. Do not infer support from a model name or apply a shared provider-wide list. Unknown capabilities use provider default without an invented effort parameter.

Current source: `shared/types.ts` carries model-specific reasoning metadata; `server/codex.ts` preserves `supportedReasoningEfforts`/`defaultReasoningEffort`; the picker and composer render verified per-model enum options/defaults; unknown metadata omits the parameter. The [Codex App Server reference](https://learn.chatgpt.com/docs/app-server) documents these fields (checked 2026-11-05). Other adapters require their own verified metadata or explicit capability registry, not copied Codex values. EFF-001–007/EFF-011 are Done; EFF-008–010/012 and OpenCode variant mapping remain.

Status is maintained in the tables below. Target **R1** is the first public macOS release. Owners are suggested roles; assign an actual DRI and reviewer before Ready. Remaining requirements are planned unless the task row says Done.

## Model capability data and request mapping

Development gate: **BEN-021** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| EFF-001 | R1 | P0 | Done | Integrations | BEN-021, FND-002, PVD-001 | **Define model-specific reasoning capabilities.** Accepted 2026-11-05: typed enum/budget/boolean/unsupported/unknown contract with source; tests cover normalization/unknown. [Notes](../provider-lifecycle.md). |
| EFF-002 | R1 | P0 | Done | Integrations | BEN-021, EFF-001, PVD-008 | **Preserve authoritative discovery metadata.** Accepted 2026-11-05: Codex supported/default metadata survives discovery and normalization; absent OpenCode metadata stays unknown; no name/provider-wide union. [Notes](../provider-lifecycle.md). |
| EFF-003 | R1 | P0 | Done | Integrations | BEN-021, EFF-001, FND-002 | **Map supported reasoning requests per adapter.** Accepted 2026-11-05: Codex sends exact verified enum only; unknown/unsupported omits the parameter; labels are UI-only. [Notes](../provider-lifecycle.md). |
| EFF-004 | R1 | P0 | Done | Host | BEN-021, EFF-002, EFF-003, FND-007 | **Resolve default and unknown model behavior.** Accepted 2026-11-05: verified default used; unknown/stale omits effort; no medium fallback or inherited model options. [Notes](../provider-lifecycle.md). |
| EFF-005 | R1 | P0 | Done | Host + UI | BEN-021, EFF-001, FND-003, PVD-012 | **Persist and migrate model-specific selections.** Accepted 2026-11-05: chat/agent scope persists; stale/global effort strings are replaced with the verified model default or provider default on load/switch; failed saves roll back. |
| EFF-006 | R1 | P0 | Done | Host | BEN-021, EFF-003, EFF-004, EFF-005, PVD-013 | **Reject incompatible effort at dispatch.** Accepted 2026-11-05: API validates explicit model availability and enum/unsupported effort before creating a streaming message. [Notes](../provider-lifecycle.md). |

## Thinking controls and verification

Development gate: **BEN-022** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| EFF-007 | R1 | P1 | Done | UI | BEN-022, EFF-002, EFF-004, EFF-005 | **Replace the fixed Thinking footer.** Accepted 2026-11-05: picker renders only selected model enum options/default; unsupported/unknown show no-control/provider-default; fixed list removed. [Notes](../provider-lifecycle.md). |
| EFF-008 | R1 | P1 | To do | UI | BEN-022, EFF-005, EFF-007 | **Align every model and effort surface.** Done when: Composer trigger, SidePanel, Agent editor, global/chat settings, and restored drafts show the effective model-specific value; model descriptions and Media/Reasoning badges remain omitted as requested. |
| EFF-009 | R1 | P0 | To do | UI + Host | BEN-022, EFF-006, EFF-008 | **Handle model-switch and catalog races.** Done when: Rapid switching, failed saves, late discovery, removed models/options, default resolution, and account/host changes never display or submit another model's stale value; keyboard/focus and rollback remain coherent. |
| EFF-010 | R1 | P0 | To do | QA | BEN-022, EFF-006, EFF-009 | **Build disjoint-capability regression fixtures.** Done when: Models with different enum sets, no reasoning, unknown data, numeric budgets, one option, long labels, default aliases, and removed options exercise discovery through UI/persistence to exact request payloads. |
| EFF-011 | R1 | P0 | Done | QA + Integrations | BEN-022, EFF-010, FND-002 | **Verify real supported model settings.** Accepted 2026-11-05: support matrix records live Codex models with distinct defaults/options; OpenCode uses an explicit unknown contract; HTTP/Ollama deferred. [Evidence](../reasoning-verification.md). |
| EFF-012 | R1 | P0 | To do | QA + Product | BEN-022, EFF-007, EFF-008, EFF-009, EFF-010, EFF-011 | **Close the model-specific reasoning gate.** Done when: All capability, migration, request, switch-race, keyboard/VoiceOver/reflow, and real-model checks have accepted evidence; supported options/defaults and unknown-data behavior are documented without invented model claims. |

## Gate

EFF-012 must be accepted before QA-012 signs off R1. PVD-001 owns the shared adapter contract; this board owns model-specific capability semantics, persistence, controls, payload mapping, and verification. CDX-004 verifies the Codex-specific integration; it does not substitute for the other adapters.
