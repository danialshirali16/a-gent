# Roadmap task boards

Updated: 2026-11-05. **The active execution order is [V1-01 through V1-08](../project-roadmap.md#recommended-execution-order).** [V1 triage](v1-triage.md) is the authoritative per-task scope/effort register: 69 CONTINUE, 163 PAUSE, 5 CUT/RETHINK across 237 IDs.

The detailed boards below retain original public R1/R2 targets, full criteria, original dependencies, and implementation history. Their old milestones/feature prerequisites do not override the approved [personal contract](../release-contract.md) or [support matrix](../support-matrix.md). A v1 subset can pass without completing the full original public task.

| Board | Original tasks | Personal v1 treatment |
| --- | ---: | --- |
| [Foundations](../project-roadmap.md#foundation-tasks) | 12 | Retain/reverify core contracts and fix contradicted lifecycle acceptance. |
| [Providers](providers.md) | 44 | Codex/shared core CONTINUE; OpenCode/HTTP/Ollama/Google and managed login deferred. |
| [MCP, Connected Apps, HIL](connect-apps.md) | 40 | MCP/APP paused; HIL-001/002/005/006 retain native approvals/questions/recovery. |
| [Reasoning controls](reasoning-effort.md) | 12 | Paused; default reasoning for v1. |
| [Skills](skills.md) | 20 | Paused. |
| [ElevenLabs STT](speech-to-text.md) | 18 | Paused. |
| [Product/UI](product.md) | 22 | Core text/project/draft/data/recovery and retained accessibility only. |
| [Quality/distribution](quality-release.md) | 24 | Current checks, local package, and owner pilot; public signing/publication deferred. |
| [Platforms/later work](platforms-next.md) | 20 | Windows/Android/FUT paused. |
| [Benchmarks](benchmarking.md) | 25 | Reuse applicable decisions; approved exception for corrective release work. |
| **Total** | **237** | Every ID is classified once in v1-triage.md. |

## Status and evidence

Implementation status is maintained in the owning board, scope/effort only in the triage. Done means evidence for the stated original acceptance package, not an automatic current candidate pass. Review annotations supersede narrower older acceptance where the audit found contrary behavior.

Eight prior Done claims were reopened as Review: FND-006, PVD-006/010/011/015/016, OPC-002, and EFF-005. The assessment's earlier 56 Done / 5 Review / 176 To do snapshot therefore becomes 48 Done / 13 Review / 176 To do for original implementation tracking. These counts are not v1 completion percentages.

Use [validation](../validation.md), [current state](../current-state-review.md), and the [support matrix](../support-matrix.md) for actual results. The original 191 R1 / 28 R2 / 16 paused / 2 optional targets are preserved for history, not used as current release totals.

## Dependencies and benchmarking

For CONTINUE v1 work, follow the phase prerequisites and [D-11 exception](../release-contract.md#d-11-benchmark-policy). New peer comparisons are not required before core fixes, QA, or local packaging; direct verification remains mandatory.

The original full-scope dependency lists remain available for future development. Excluded managed-login/OpenCode/MCP/STT/SKL/EFF/signing/publication gates do not block the smaller personal v1 subsets. Resuming deferred features/platforms requires deliberate scope and applicable benchmark coverage.
