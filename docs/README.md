# A Gent documentation

Updated: 2026-11-06. **Approved focus: personal macOS v1.0 with Codex.** The V1-02 baseline and V1-03/V1-04/V1-05 source path are implemented; fixture, browser, macOS, and real Codex checks pass. A 1.0.0 arm64 candidate is built and inspected; owner V1-08 acceptance remains open.

## Start here

| Need | Document |
| --- | --- |
| Follow the approved next work in order | [Roadmap: V1-01 through V1-08](project-roadmap.md#recommended-execution-order) |
| Check promises, exclusions, and benchmark waiver | [Personal v1 release contract](release-contract.md) |
| Find any original task's decision, reason, effort, and phase | [All 237 task decisions](roadmaps/v1-triage.md) — 69 CONTINUE, 163 PAUSE, 5 CUT/RETHINK |
| Check implemented behavior and open failures | [Current state](current-state-review.md) |
| Map a retained flow to required evidence | [Personal candidate support matrix](support-matrix.md) |
| Build, install, back up, and test the candidate | [Mac test guide](macos-v1-testing.md) |
| Run the focused owner acceptance pass | [V1-08 owner procedure](v1-08-owner-acceptance.md) |
| Run current source and learn existing controls | [Project README](../README.md) |
| Check executed commands and their limits | [Validation record](validation.md) |
| Consult full original criteria/status | [Detailed task boards](roadmaps/README.md) |
| Understand the 18-component implementation | [UI Roadmap](ui-roadmap.md), [component index](component-roadmap.md) |
| Separate current picker fixes from raw stress failures | [modelOptions report](model-options-stress-test.md#current-status-after-provider-changes) |
| Consult earlier provider/MCP gaps | [Historical integration review](integration-review.md) |

## Active release path

V1-02 baseline → V1-03 scope enforcement → V1-04 core correctness → V1-05 daily-use recovery are complete in current source. V1-06 now has fresh macOS/Node 24 source, browser, and real-Codex evidence; native-question, VoiceOver, and actual macOS zoom/reflow checks remain open. V1-07 has a built and inspected 1.0.0 arm64 DMG/ZIP candidate; install/upgrade/quit/relaunch behavior and Danial's V1-08 packaged pass remain open.

OpenCode, full MCP/Connected Apps, custom reasoning, Agent skill management, ElevenLabs STT, other inference providers, scheduling/content expansion, Windows/Android, and public distribution are paused. The retained UI/API is now gated to Codex, provider-default reasoning, and one active run per host. The expected macOS 13+ arm64 baseline still needs confirmation against Danial's chip/OS.

The [D-11 exception](release-contract.md#d-11-benchmark-policy) waives new two-peer prerequisites for CONTINUE fixes, QA, and local packaging. It does not waive implementation, compatibility, regression, real-runtime, or package tests. Old public R1 targets/dependencies are traceability metadata, not the personal release gate.

## Architecture and focused references

| Area | Reference |
| --- | --- |
| Versions and generated fixtures | [Runtime baseline](runtime-baselines.md) |
| Workspace v2 and migration | [Durable schema](data-schema.md) |
| Host, desktop, and remote-device roles | [Authority model](authority-model.md) |
| Stop/termination/shutdown | [Run lifecycle](run-lifecycle.md) |
| Atomic writes, backup, locks, failed import | [Persistence](persistence.md) |
| Approval/question correlation and expiry | [Interactions](interactions.md) |
| Timeout/cancellation budgets | [Timeouts](timeouts.md) |
| Error IDs and redaction | [Diagnostics](diagnostics.md) |
| Config/secret interfaces and actual Keychain/session behavior | [Config and secrets](config-secrets.md) |
| Readiness, model IDs, selection, and known lifecycle gaps | [Provider lifecycle](provider-lifecycle.md) |
| Deferred benchmark process and accepted records | [Benchmarks](benchmarks/README.md), [benchmark board](roadmaps/benchmarking.md) |
| Component integration | [Button](button-component.md), [Input/Textarea](input-component.md), [component notes](component-notes.md), [Search](search-component.md), [picker review](model-picker-review.md) |

## Evidence and history

- [Validation](validation.md): the macOS arm64/Node 24 pass has fresh npm ci, typecheck, 73 server tests, 22 browser smoke, 7 E2E, 7 axe, 10 visual checks, real Codex chat/continuation/Stop/Work probes, and an inspected 1.0.0 DMG/ZIP with SHA-256 hashes. Native question, VoiceOver/zoom, install/upgrade/quit/relaunch, and owner V1-08 acceptance remain open.
- [Screenshots](screenshots/README.md): historical scoped visual evidence.
- [Reverse-engineering findings](reverse-engineering.md): inspected reference and limits.
- [Original public R1 roadmap](archive/project-roadmap-public-r1-2026-11-05.md), [contract](archive/release-contract-public-r1-2026-11-05.md), and [support matrix](archive/support-matrix-public-r1-2026-11-05.md): preserved previous scope and gates.
- [Earlier plan](archive/project-roadmap-2026-11-04.md): earlier phases/estimates.

## Updating the docs

1. Keep the ordered active path in project-roadmap.md, promises in release-contract.md, and per-ID v1 decisions/effort in roadmaps/v1-triage.md.
2. Keep full original criteria and implementation status in the owning task board. Record scoped v1 acceptance in support-matrix.md with evidence in validation.md; it does not finish broader public criteria.
3. Update current-state-review.md for actual behavior/bugs and ui-roadmap.md for component integration. Reopen contradicted completion claims.
4. Preserve dated historical records and their source/runtime/artifact boundaries. Fresh source, browser, real-runtime, and package checks remain distinct.
5. Check links/task coverage and actual package contents before declaring a candidate accepted. Use relative documentation links.
