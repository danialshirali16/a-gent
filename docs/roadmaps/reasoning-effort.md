# Model-specific reasoning and Thinking controls

Updated: 2026-11-05. [Active v1 path](../project-roadmap.md#recommended-execution-order) · [Every task's v1 decision](v1-triage.md) · [Current state](../current-state-review.md)

**Personal macOS v1 amendment:** EFF-001–012 are PAUSE. Preserve existing metadata/controls/history while v1 uses provider-default dispatch. Codex enum discovery/mapping exists; migration, cross-surface consistency, and races remain partial.

The tables retain original public R1/R2 targets, full acceptance criteria, and original dependencies for later work. Current implementation statuses are maintained here; v1 scope/effort is maintained only in the triage. A v1 subset can pass its support-matrix row without declaring the whole original task complete. Old M2/M3 continuation and broad feature gates do not govern the active path.

The [approved D-11 exception](../release-contract.md#d-11-benchmark-policy) permits CONTINUE correction/QA/packaging without new peer comparisons. Compatibility research, tests, real Codex checks, and actual Mac package evidence remain required. Deferred full-scope work retains applicable benchmarks on resumption. Owner labels remain suggested roles; Danial is the acting accountable owner.

## Model capability data and request mapping

Original benchmark dependency: BEN-021. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| EFF-001 | R1 | P0 | Done | Integrations | BEN-021, FND-002, PVD-001 | **Define model-specific reasoning capabilities.** Accepted 2026-11-05: typed enum/budget/boolean/unsupported/unknown contract with source; tests cover normalization/unknown. [Notes](../provider-lifecycle.md). |
| EFF-002 | R1 | P0 | Done | Integrations | BEN-021, EFF-001, PVD-008 | **Preserve authoritative discovery metadata.** Accepted 2026-11-05: Codex supported/default metadata survives discovery and normalization; absent OpenCode metadata stays unknown; no name/provider-wide union. [Notes](../provider-lifecycle.md). |
| EFF-003 | R1 | P0 | Done | Integrations | BEN-021, EFF-001, FND-002 | **Map supported reasoning requests per adapter.** Accepted 2026-11-05: Codex sends exact verified enum only; unknown/unsupported omits the parameter; labels are UI-only. [Notes](../provider-lifecycle.md). |
| EFF-004 | R1 | P0 | Done | Host | BEN-021, EFF-002, EFF-003, FND-007 | **Resolve default and unknown model behavior.** Accepted 2026-11-05: verified default used; unknown/stale omits effort; no medium fallback or inherited model options. [Notes](../provider-lifecycle.md). |
| EFF-005 | R1 | P0 | Review | Host + UI | BEN-021, EFF-001, FND-003, PVD-012 | **Persist and migrate model-specific selections.** Review reopened 2026-11-05: automatic effort migration/save errors are swallowed and cross-surface rollback is incomplete. This feature is paused; personal v1 uses provider default. Previous acceptance evidence: Accepted 2026-11-05: chat/agent scope persists; stale/global effort strings are replaced with the verified model default or provider default on load/switch; failed saves roll back. |
| EFF-006 | R1 | P0 | Done | Host | BEN-021, EFF-003, EFF-004, EFF-005, PVD-013 | **Reject incompatible effort at dispatch.** Accepted 2026-11-05: API validates explicit model availability and enum/unsupported effort before creating a streaming message. [Notes](../provider-lifecycle.md). |

## Thinking controls and verification

Original benchmark dependency: BEN-022. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| EFF-007 | R1 | P1 | Done | UI | BEN-022, EFF-002, EFF-004, EFF-005 | **Replace the fixed Thinking footer.** Accepted 2026-11-05: picker renders only selected model enum options/default; unsupported/unknown show no-control/provider-default; fixed list removed. [Notes](../provider-lifecycle.md). |
| EFF-008 | R1 | P1 | To do | UI | BEN-022, EFF-005, EFF-007 | **Align every model and effort surface.** Done when: Composer trigger, SidePanel, Agent editor, global/chat settings, and restored drafts show the effective model-specific value; model descriptions and Media/Reasoning badges remain omitted as requested. |
| EFF-009 | R1 | P0 | To do | UI + Host | BEN-022, EFF-006, EFF-008 | **Handle model-switch and catalog races.** Done when: Rapid switching, failed saves, late discovery, removed models/options, default resolution, and account/host changes never display or submit another model's stale value; keyboard/focus and rollback remain coherent. |
| EFF-010 | R1 | P0 | To do | QA | BEN-022, EFF-006, EFF-009 | **Build disjoint-capability regression fixtures.** Done when: Models with different enum sets, no reasoning, unknown data, numeric budgets, one option, long labels, default aliases, and removed options exercise discovery through UI/persistence to exact request payloads. |
| EFF-011 | R1 | P0 | Done | QA + Integrations | BEN-022, EFF-010, FND-002 | **Verify real supported model settings.** Accepted 2026-11-05: support matrix records live Codex models with distinct defaults/options; OpenCode uses an explicit unknown contract; HTTP/Ollama deferred. [Evidence](../reasoning-verification.md). |
| EFF-012 | R1 | P0 | To do | QA + Product | BEN-022, EFF-007, EFF-008, EFF-009, EFF-010, EFF-011 | **Close the model-specific reasoning gate.** Done when: All capability, migration, request, switch-race, keyboard/VoiceOver/reflow, and real-model checks have accepted evidence; supported options/defaults and unknown-data behavior are documented without invented model claims. |

## Gate

EFF-012 is not a personal-v1 release dependency. V1-03/PVD-013 must prevent stale explicit effort from affecting basic sends and accurately gate custom controls. Full custom-reasoning criteria remain later work.
