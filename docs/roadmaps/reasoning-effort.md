# Model-specific reasoning and Thinking controls

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Task boards](README.md) · [Benchmark process](../benchmarks/README.md)

The existing Light/Balanced/Deep choices must be replaced by the selected model's actual supported settings. Do not infer support from a model name or apply a shared provider-wide list. Unknown capabilities use provider default without an invented effort parameter.

Current source: `shared/types.ts` keeps only model ID/name/description; `server/codex.ts` drops other discovery metadata and uses a global effort allowlist; `src/composer/ModelPicker.tsx`, `src/App.tsx`, `src/dialogs.tsx`, and `src/app/SidePanel.tsx` retain fixed options/default labels. The [Codex App Server reference](https://learn.chatgpt.com/docs/app-server) documents model-specific `supportedReasoningEfforts` and `defaultReasoningEffort` (checked 2026-11-05). Other adapters require their own verified metadata or explicit capability registry, not copied Codex values.

All tasks start **To do**. Target **R1** is the first public macOS release. Owners are suggested roles; assign an actual DRI and reviewer before Ready. Requirements here are planned, not implemented.

## Model capability data and request mapping

Development gate: **BEN-021** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| EFF-001 | R1 | P0 | To do | Integrations | BEN-021, FND-002, PVD-001 | **Define model-specific reasoning capabilities.** Done when: The typed contract distinguishes verified enum values/order/default, bounded numeric budgets, supported boolean modes, unsupported, and unknown; metadata records provider/model/account context, source, runtime/API version, and freshness. |
| EFF-002 | R1 | P0 | To do | Integrations | BEN-021, EFF-001, PVD-008 | **Preserve authoritative discovery metadata.** Done when: Codex model effort/default fields and verified equivalent adapter data survive discovery and normalization; absent capabilities stay unknown, conflicting sources have defined precedence, and model-name guesses or provider-wide unions are rejected. |
| EFF-003 | R1 | P0 | To do | Integrations | BEN-021, EFF-001, FND-002 | **Map supported reasoning requests per adapter.** Done when: Each advertised provider/model maps its native effort enum, thinking budget, or supported boolean correctly; friendly labels remain separate from wire values, and off/none/default are not conflated. |
| EFF-004 | R1 | P0 | To do | Host | BEN-021, EFF-002, EFF-003, FND-007 | **Resolve default and unknown model behavior.** Done when: Provider default uses resolved model capabilities when known; unknown/stale metadata offers provider default and omits unverified parameters; it never silently sends medium or inherits another model's options. |
| EFF-005 | R1 | P0 | To do | Host + UI | BEN-021, EFF-001, FND-003, PVD-012 | **Persist and migrate model-specific selections.** Done when: Existing global effort strings migrate safely; preferences are scoped to the agreed provider/profile/model/Agent/chat identity, and switching models restores only still-valid values or the verified default. |
| EFF-006 | R1 | P0 | To do | Host | BEN-021, EFF-003, EFF-004, EFF-005, PVD-013 | **Reject incompatible effort at dispatch.** Done when: The API revalidates the effective model and current capability snapshot before a run; invalid enum/budget, stale model changes, and unsupported combinations fail clearly without creating a misleading streaming message. |

## Thinking controls and verification

Development gate: **BEN-022** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| EFF-007 | R1 | P1 | To do | UI | BEN-022, EFF-002, EFF-004, EFF-005 | **Replace the fixed Thinking footer.** Done when: The supplied model-picker layout shows only the selected model's supported settings with its default; unsupported models hide the control, unknown models explain provider-default behavior, and no universal Light/Balanced/Deep fallback remains. |
| EFF-008 | R1 | P1 | To do | UI | BEN-022, EFF-005, EFF-007 | **Align every model and effort surface.** Done when: Composer trigger, SidePanel, Agent editor, global/chat settings, and restored drafts show the effective model-specific value; model descriptions and Media/Reasoning badges remain omitted as requested. |
| EFF-009 | R1 | P0 | To do | UI + Host | BEN-022, EFF-006, EFF-008 | **Handle model-switch and catalog races.** Done when: Rapid switching, failed saves, late discovery, removed models/options, default resolution, and account/host changes never display or submit another model's stale value; keyboard/focus and rollback remain coherent. |
| EFF-010 | R1 | P0 | To do | QA | BEN-022, EFF-006, EFF-009 | **Build disjoint-capability regression fixtures.** Done when: Models with different enum sets, no reasoning, unknown data, numeric budgets, one option, long labels, default aliases, and removed options exercise discovery through UI/persistence to exact request payloads. |
| EFF-011 | R1 | P0 | To do | QA + Integrations | BEN-022, EFF-010, FND-002 | **Verify real supported model settings.** Done when: The support matrix records at least two available models with distinct supported settings plus unsupported/unknown handling; each advertised adapter has captured schema/request evidence and authorized real smoke coverage or an explicit unsupported contract. |
| EFF-012 | R1 | P0 | To do | QA + Product | BEN-022, EFF-007, EFF-008, EFF-009, EFF-010, EFF-011 | **Close the model-specific reasoning gate.** Done when: All capability, migration, request, switch-race, keyboard/VoiceOver/reflow, and real-model checks have accepted evidence; supported options/defaults and unknown-data behavior are documented without invented model claims. |

## Gate

EFF-012 must be accepted before QA-012 signs off R1. PVD-001 owns the shared adapter contract; this board owns model-specific capability semantics, persistence, controls, payload mapping, and verification. CDX-004 verifies the Codex-specific integration; it does not substitute for the other adapters.
