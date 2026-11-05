# Benchmark policy and records

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Scope benchmark tasks](../roadmaps/benchmarking.md) · [Record template](template.md)

**Personal-v1 exception approved 2026-11-05:** follow the [active roadmap](../project-roadmap.md#recommended-execution-order) and [D-11 amendment](../release-contract.md#d-11-benchmark-policy). CONTINUE corrections, core UI/recovery, QA, and local packaging do not require new two-peer comparisons first. Reuse applicable BEN-001/002/003/010 records; direct compatibility, regression, real Codex, and actual package checks remain mandatory.

BEN-011–014 are CUT/RETHINK as compulsory prerequisites for this personal release, not marked research-complete. All other classifications are in [v1 triage](../roadmaps/v1-triage.md). The requirements below apply to deferred full feature/platform scopes when explicitly resumed.

For resumed work outside the personal-v1 exception, the benchmark rule applies to new adapters, features, QA/release infrastructure, and native platforms. When a narrow fix already has a current accepted comparison, link that scope and explain why it still applies; do not repeat research without a reason. New scope requires a new or amended benchmark record before development.

## Required record and acceptance gate

Use [the template](template.md) and store records under `docs/benchmarks/`, named with the BEN ID and scope. BEN tasks stay To do until research is actually performed. The initial upstream-source research in feature boards is background, not completed benchmarking. The personal-v1 exception does not relabel unperformed research as Done.

An accepted record contains:

1. **Scope and question:** BEN ID, covered delivery task IDs, user journey, constraints, success/failure criteria, and excluded cases. A board-level record must list coverage per scope; generic product screenshots do not cover every task.
2. **Relevant comparisons:** at least two other products or reference implementations appropriate to that scope. Use Reason for relevant observable UI/workflows; compare native runtime/API implementations and authoritative standards for protocol, QA, authority, or packaging work. Unavailable access and substitutions are recorded.
3. **Traceable evidence:** date, product/runtime/API version, environment, account/permission conditions, URLs and local evidence where available. Label direct observation, documented behavior, and inference separately. Missing access remains unverified.
4. **Workflow and edge-state matrix:** ordinary, empty, invalid, offline, denied, cancellation, concurrent/context-switch, restart, and recovery states as applicable. Explain why a case does not apply rather than silently omitting it.
5. **Measurements where relevant:** method, corpus/fixtures, environment, samples and distributions, latency/accuracy/cost/resource figures, and limitations. Do not substitute vendor marketing for an A Gent measurement; never fabricate a metric.
6. **Design and engineering decisions:** adopted patterns and reasons, alternatives/tradeoffs, compatibility and migrations, accessibility, data/permission effects, failure handling, and supported boundaries. Benchmarking informs A Gent's independent implementation.
7. **Development and verification mapping:** proposed behavior, acceptance criteria, test/evidence plan, affected task IDs, and remaining questions. Resolve blocking questions before development starts.
8. **Acceptance:** named DRI and reviewer, accepted scope/version/date, evidence links, and recheck triggers. The reviewer accepts the record before the BEN task moves to Done and dependent implementation can become Ready.

A single BEN task may own several records, but all its promised scopes must be accepted before it closes. In particular, BEN-017 requires distinct comparisons for each future feature. Add a scoped BEN task if this becomes too large or creates an unnecessary gate; retain IDs and update dependencies/counts.

## Reuse, changes, and status

Reuse an accepted record only when the new task is explicitly covered and the product/runtime/requirements remain applicable. Scope changes, model capability/schema changes, new auth/transport/permission behavior, or contradictory evidence reopen the affected comparison. Record why retained decisions still hold before resuming dependent work. Unrelated completed scopes remain valid.

The owning delivery board is the status source for implementation. [The benchmark board](../roadmaps/benchmarking.md) owns benchmark status; this folder owns the actual comparison evidence and decisions. [Validation](../validation.md) records checks performed against source/artifacts. A passing implementation test does not retroactively satisfy a missing benchmark.

## Research coverage

Record required product/account access, corpus permissions, and real-service budgets in the benchmark plan. Use documented behavior or fixtures where live access is unavailable, label the limitation, and leave required real-world acceptance open. Accepted comparison records are BEN-001–004, BEN-008–010, and BEN-021–022. They retain their dated scopes and limits. Acceptance of research does not establish current implementation, real-service, or package acceptance; deferred research stays open.
