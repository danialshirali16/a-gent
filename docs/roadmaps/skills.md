# Add, manage, and use Agent skills

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Task boards](README.md) · [Benchmark process](../benchmarks/README.md)

Required flow: discover or add/create a skill → inspect its instructions/resources and origin → enable it for an eligible Agent/project → use it → edit/update → disable/remove/export. Skill management is a separate product area from MCP/Connect Apps. Current source has no dedicated Skills manager or native skill adapter.

The [Agent Skills specification](https://agentskills.io/specification) describes a SKILL.md-based directory with metadata/instructions and optional resources. [Codex App Server](https://learn.chatgpt.com/docs/app-server) exposes skill listing, configuration, and explicit invocation; [OpenCode skills](https://opencode.ai/docs/skills) document native discovery and permission controls. These references were checked 2026-11-05; supported installed runtime schemas still govern implementation. Read/enable state is distinct from actual use in a run.

All tasks start **To do**. Target **R1** is the first public macOS release. Owners are suggested roles; assign an actual DRI and reviewer before Ready. Requirements here are planned, not implemented.

## Skill format, sources, and storage

Development gate: **BEN-023** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| SKL-001 | R1 | P0 | To do | Product + Integrations | BEN-023, FND-001, FND-002, PVD-001 | **Specify the skills product and adapter matrix.** Done when: Reusable instructions/resources are distinct from MCP connections; create/import/manage/use scope, supported runtimes/formats, project/global/per-Agent rules, and explicitly unsupported execution modes are recorded. |
| SKL-002 | R1 | P0 | To do | Host + Integrations | BEN-023, SKL-001, FND-003 | **Define skill identity and discovery.** Done when: Host/root/path/source identity, version, effective precedence, duplicate names, disabled/unsupported states, and discovery errors are stable across project/global/native roots and refresh/restart. |
| SKL-003 | R1 | P0 | To do | Host | BEN-023, SKL-001, FND-012 | **Validate skill packages.** Done when: SKILL.md metadata/body and referenced scripts/assets are parsed against the supported format; encoding, required fields, names, references, file counts, size limits, and malformed metadata fail with actionable errors. |
| SKL-004 | R1 | P0 | To do | UI + Host | BEN-023, SKL-002, SKL-003 | **Create and add local skills.** Done when: Users can create from a template, paste content, or select a SKILL.md/folder, preview destination/scope/conflicts, validate, and add it; no bundled script executes merely because a skill was added. |
| SKL-005 | R1 | P0 | To do | Host + Integrations | BEN-023, SKL-002, SKL-003, FND-004 | **Import repository and archive sources.** Done when: Pinned revision/version, origin, license, and update provenance are recorded; bounded fetch/extraction rejects traversal, symlink escapes, secret-bearing URLs, and unsupported package content before previewed adoption. |
| SKL-006 | R1 | P0 | To do | Host | BEN-023, SKL-004, SKL-005, FND-008 | **Protect managed and external skill files.** Done when: Managed/imported/external ownership is visible; writes are atomic, external changes detected, adoption and replacement previewed, and backup/rollback preserve unrelated files/configuration. |
| SKL-007 | R1 | P0 | To do | Host + Product | BEN-023, SKL-003, SKL-005, FND-011 | **Define skill data and execution boundaries.** Done when: Imports/exports/diagnostics exclude secrets; skill instructions and resource files cannot create file/network/tool permissions; bundled scripts require the existing runtime policy, and untrusted package content is not executed during preview. |

## Runtime use and management interface

Development gate: **BEN-024** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| SKL-008 | R1 | P0 | To do | Integrations | BEN-024, SKL-002, SKL-006, FND-002 | **Integrate supported Codex skill APIs.** Done when: Version-probed native listing, invalidation/reload, enable/disable, and explicit skill input use actual runtime-supported paths and identities; unsupported or under-development methods have a clear fallback. |
| SKL-009 | R1 | P0 | To do | Integrations | BEN-024, SKL-002, SKL-006, OPC-003 | **Integrate supported OpenCode skills.** Done when: Native discovery roots, SKILL.md compatibility, per-Agent permissions, and refresh behavior match the supported runtime; A Gent changes preserve unrelated settings and cannot widen approved tool access. |
| SKL-010 | R1 | P0 | To do | Integrations | BEN-024, SKL-001, SKL-003, HTTP-003 | **Define HTTP and unsupported-runtime behavior.** Done when: Only verified instruction-loading capabilities are offered for HTTP models; execution-capable native skills and instruction-only use are distinguished, incompatible resources explain limitations, and install/enabled state never falsely claims execution. |
| SKL-011 | R1 | P0 | To do | Host + Integrations | BEN-024, SKL-007, SKL-008, SKL-009, SKL-010, FND-007 | **Apply skill scope to Agent runs.** Done when: Per-Agent/project enablement is enforced for the selected runtime; disabled or out-of-scope skills are unavailable, on-demand loading respects context budgets, and run provenance identifies selected skill/version without leaking private content. |
| SKL-012 | R1 | P1 | To do | UI | BEN-024, SKL-001, SKL-002, SKL-011 | **Build a dedicated Skills manager.** Done when: Users can search/filter, inspect source/scope/version/compatibility/errors, add/create, and change enabled state with accurate loading/empty/error feedback; placement follows the benchmark and is distinct from Connect Apps. |
| SKL-013 | R1 | P1 | To do | UI + Host | BEN-024, SKL-006, SKL-012 | **Edit and update skills with review.** Done when: Content edits and source updates validate, show a diff/conflicts, preserve provenance, apply atomically, and support rollback; external skills require deliberate adoption or supported external-edit behavior. |
| SKL-014 | R1 | P0 | To do | UI + Host | BEN-024, SKL-006, SKL-011, SKL-012 | **Complete disable, remove, and export.** Done when: Actions explain scope and active-run effects, persist across restart, remove only owned files/configuration, leave unrelated external skills intact, and export a portable validated package without credentials. |
| SKL-015 | R1 | P1 | To do | UI + Integrations | BEN-024, SKL-011, SKL-012 | **Select skills in a conversation.** Done when: Explicit invocation/selection shows eligible skills for the current Agent/project/runtime; duplicate names are disambiguated, unavailable skills cannot be selected, and switching context invalidates stale selections. |

## Skills verification and release

Development gate: **BEN-025** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| SKL-016 | R1 | P0 | To do | QA | BEN-025, SKL-003, SKL-005, SKL-006, SKL-007 | **Create adversarial package and persistence fixtures.** Done when: Malformed/frontmatter/oversized/duplicate/missing-resource packages, traversal/symlink archives, changed external files, interrupted writes, rollback, and secret exclusion have meaningful regression evidence. |
| SKL-017 | R1 | P0 | To do | QA + Integrations | BEN-025, SKL-011, SKL-014, SKL-015 | **Verify skill behavior across adapters.** Done when: Actual context/invocation payloads, on-demand loading, enabled/disabled scope, missing permissions/resources, token limits, concurrent chats, and runtime errors pass contract tests without granting new execution rights. |
| SKL-018 | R1 | P1 | To do | QA + UI | BEN-025, SKL-012, SKL-013, SKL-014, SKL-015 | **Accept accessible management states.** Done when: Long/duplicate/blank metadata, large catalogs, unsupported skills, conflicts, keyboard, VoiceOver, actual zoom, RTL, and narrow layouts work with useful validation and focus recovery. |
| SKL-019 | R1 | P0 | To do | QA + Integrations | BEN-025, SKL-016, SKL-017, SKL-018 | **Accept real create/import and use journeys.** Done when: On supported real Codex/OpenCode versions, create/import → inspect → scope/enable → use with an Agent → edit/update → disable/remove → restart passes; HTTP instruction-only behavior is checked separately where advertised. |
| SKL-020 | R1 | P0 | To do | QA + Product | BEN-025, SKL-016, SKL-017, SKL-018, SKL-019 | **Close the skills release gate.** Done when: All skill tasks and benchmark records have accepted evidence; supported formats/sources/adapters, file ownership, trust/permissions, data flows, migration, backup/export, and troubleshooting are documented. |

## Gate

SKL-020 must be accepted before QA-012 signs off R1. Real supported-runtime journeys, adapter limitations, file ownership, recovery, and accessibility must be demonstrated. Importing instructions never grants new tool/file/network rights or runs package scripts by itself.
