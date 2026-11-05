# A Gent documentation

Updated: 2026-11-05. Active development scope: macOS. Windows and Android remain paused.

## Start here

| Need | Document |
| --- | --- |
| Run the app, connect providers, pair devices, use shortcuts | [Project README](../README.md) |
| Understand source status, packaged builds, and open issues | [Current project state](current-state-review.md) |
| Choose the next product or release task | [Project roadmap](project-roadmap.md) |
| Work through detailed tasks and dependencies | [Roadmap task boards](roadmaps/README.md) — 237 tracked tasks |
| Benchmark a scope before development | [Benchmark process and records](benchmarks/README.md), [25 scope prerequisites](roadmaps/benchmarking.md), and [record template](benchmarks/template.md) |
| Understand incomplete provider/MCP/app workflows | [Integration readiness review](integration-review.md) |
| Continue UI work and the 18-component process | [UI Roadmap](ui-roadmap.md) |
| See which checks ran and which build they cover | [Validation record](validation.md) |

## Components and focused reviews

| Area | Reference |
| --- | --- |
| Component links | [Component index](component-roadmap.md); progress is owned by the UI Roadmap |
| Buttons | [Button](button-component.md) |
| Text entry | [Input and Textarea](input-component.md) |
| Field through Sidebar | [Component APIs and integration notes](component-notes.md) |
| Search | [Search field review](search-component.md) |
| Composer model picker | [Reference-layout review](model-picker-review.md) |
| Catalog edge cases | [modelOptions stress test](model-options-stress-test.md); seven findings remain open |

The initial 18-component pass is complete. Product integration remains partial. Execution follows benchmark → design decisions → development → verification for foundations, providers, MCP/Connect Apps, model-specific reasoning, skills, ElevenLabs speech, remaining product flows, quality, and distribution. The catalog findings remain part of the provider board.

## Completion and release workstreams

| Workstream | Tasks | Board |
| --- | ---: | --- |
| Foundations and decisions | 12 | [Master roadmap](project-roadmap.md#foundation-tasks) |
| Providers | 44 | [Provider integration](roadmaps/providers.md) |
| MCP / Connect Apps / user input | 40 | [App integration](roadmaps/connect-apps.md) |
| Model-specific reasoning | 12 | [Reasoning and Thinking controls](roadmaps/reasoning-effort.md) |
| Agent skills | 20 | [Add/manage/use skills](roadmaps/skills.md) |
| ElevenLabs Speech-to-Text | 18 | [Speech integration](roadmaps/speech-to-text.md) |
| Core product and UI | 22 | [Product completion](roadmaps/product.md) |
| QA and public macOS release | 24 | [Quality and release](roadmaps/quality-release.md) |
| Paused platforms and later scope | 20 | [Platforms and next work](roadmaps/platforms-next.md) |
| Benchmark prerequisites | 25 | [Scope comparison tasks](roadmaps/benchmarking.md) |

First-release boundaries, the user's new requirements, and eleven decisions are in [the master](project-roadmap.md#decisions-to-record). There are 208 R1, 11 R2, 16 paused-platform, and 2 optional-scope tasks. Counts are acceptance packages rather than effort estimates; the boards have priorities, status, suggested roles, dependencies, and completion criteria.

## Evidence and history

- [Validation record](validation.md): dated check results and recorded artifact checksums. Historical full-suite results do not certify later source changes.
- [Screenshot index](screenshots/README.md): visual evidence grouped by review.
- [Reason reconstruction findings](reverse-engineering.md): inspected artifact, observations, and research limits.
- [Earlier project plan](archive/project-roadmap-2026-11-04.md): preserved phases, estimates, and milestone history. Use [the current roadmap](project-roadmap.md) for continuation.

## Updating the docs

1. Record implemented behavior and unresolved issues in **current-state-review.md**.
2. Maintain milestones/decisions in **project-roadmap.md**, task status in the owning **roadmaps/** board, scope comparisons/acceptance in **benchmarks/**, and component integration notes in **ui-roadmap.md**. A task requires an accepted BEN record before Ready or development. Component notes describe APIs and behavior.
3. Record checks in **validation.md** with date, commands, result, source/build scope, and unverified cases. Later changes need a new entry.
4. Keep detailed findings and reproductions in their focused review; link it from the roadmaps and this index.
5. Verify a rebuilt package before updating its release status or checksums. Source, browser preview, and packaged app are separate verification targets.

Use relative links inside documentation. Preserve historical evidence and label its original scope.
