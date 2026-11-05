# A Gent personal macOS v1.0 roadmap

Updated: 2026-11-06. **Approved scope: personally installable macOS v1.0, Codex only.** Danial approved the assessment, narrowed scope, task triage, and benchmark exception. The V1-02 baseline, V1-03/V1-04/V1-05 source path, and the V1-06 macOS/Node 24 source checks are implemented on branch `codex/v1-macos-release`; a 1.0.0 arm64 candidate is built and inspected. Native-question, VoiceOver/zoom, packaged install/relaunch, and owner V1-08 acceptance remain open. See [validation](validation.md#personal-v1-implementation-pass-2026-11-05).

The ordered path below is the starting point for implementation. The [release contract](release-contract.md) owns promises/exclusions; [v1 triage](roadmaps/v1-triage.md) assigns all 237 original tasks exactly once; [support matrix](support-matrix.md) owns candidate acceptance; [validation](validation.md) records executed evidence.

## Objective and release boundaries

Install A Gent.app on Danial's Mac, connect an existing signed-in Codex CLI, select a model, chat with streamed replies, retain conversations/drafts, and work in a native-selected project folder with correct sandbox, approvals, Stop, and restart recovery. Initially allow one active run per host.

Pause OpenCode, full MCP/Connected Apps management, custom reasoning controls, Agent skill management, ElevenLabs STT, other inference providers, scheduling/content expansion, Windows/Android, and public distribution. Use provider-default reasoning. Gate unfinished UI/API paths while preserving saved data and external CLI configuration.

The existing package target is macOS 13+ arm64. The V1-07 build host is an Apple M1 MacBook Pro on macOS 27.2; Danial's exact target machine still needs confirmation during V1-08. Source, API health, desktop identity, and package metadata report 1.0.0. A current arm64 DMG/ZIP has been built and inspected; no install/upgrade/relaunch or owner acceptance has been recorded.

The [archived public R1 roadmap](archive/project-roadmap-public-r1-2026-11-05.md) retains the previous 191 R1 / 28 R2 / 16 paused / 2 optional targets and M0–M7 milestones. Those are not the personal-v1 completion gate.

## Source-based assessment

Original assessment source: fc634674f45bb578c68f8963758eef786aec82ac. Current implementation branch: `codex/v1-macos-release` from `be7b52e`; see [validation](validation.md#personal-v1-implementation-pass-2026-11-05) and [current state](current-state-review.md).

- UI, schema v2, persistence primitives, Codex execution, and parts of provider/HIL recovery exist; old Done labels do not establish full current acceptance.
- Previously reproduced and now corrected in source: initial save failure, stale probes after Forget, premature Stop interrupted state, and export of provider bindings/thread IDs. Regressions cover each.
- Picker normalization/disambiguation/Unicode search were already implemented; provider-switch scroll, count copy, exact saved-ID handling, effective model display, and fresh browser evidence are now addressed. Mac package evidence remains.
- A fresh Windows x64 host completed npm ci, typecheck, 73 tests, build, browser smoke/E2E/axe, and real Codex chat/Stop/Work/approval probes. The earlier Linux 403 remains environmental history.
- Strict probing found Codex 0.166.0-alpha.1/schema drift and no OpenCode on that executor. It is not a Mac acceptance host.
- Earlier full-suite and Mac artifact records do not certify a new candidate.

## Recommended execution order

This is the **active path to v1.0**. Follow phases in order and record evidence as it is obtained. Failures established in V1-02 are corrected by their owning later phase; they do not authorize unrelated feature development.

| Phase | Work and original task mapping | Exit evidence | Status |
| --- | --- | --- | --- |
| V1-01 — record approved scope | FND-001, BEN-001, QA-001: contract, all 237 decisions, active acceptance subset, benchmark exception. | Contract/triage/matrix agree; every ID occurs once; links resolve; unimplemented behavior is labeled. | Accepted for documentation scope; registry/link/whitespace checks pass. |
| V1-02 — establish a clean baseline | FND-002, BEN-002/003, REL-001, CDX-001, PVD-001/002, QA-010: lockfile install, Electron/browser prerequisites, runtime discovery and compatibility. | npm ci succeeds; typecheck/build/backend/UI commands execute; failures are reproducible and assigned. Record supported Codex schema behavior and the build host. Carry unconfirmed owner Mac chip/OS to V1-07; it need not block independent source work. | Source baseline complete on Windows x64 and again on the Apple M1/macOS 27.2 build host: Node 24.12.0 npm ci, typecheck, 73 tests, build, Electron 45.2.2, UI/E2E/a11y/visual passed. Codex 0.166.0 matched the fixture; installed OpenCode 1.17.9 drifts from the paused 2.2.5 baseline and is not a v1 gate. |
| V1-03 — enforce release scope | FND-004/012, PVD-001/002/005/006/013, COR-002, UX-001/002: Codex only, default reasoning, one active run; review loaded selections and inherited tools; gate unfinished surfaces. | UI/API reject unsupported runtime/concurrency; no stale effort is submitted; inherited MCP/skill capabilities cannot silently widen retained local-work permissions. Preserve saved data/global CLI config. | Implemented and source/browser/real-Codex verified. Real thread reported inherited MCP servers disabled and no skill instructions; packaged Mac verification remains. |
| V1-04 — fix core correctness | FND-003/005–011, PVD-004/008–013/015/016, CDX-003/005, HIL-001/002/005, COR-006/009: initial-save cleanup, stale probes, Stop/termination, export sanitization, session/interaction identity. | Regressions reproduce then close each core failure; no phantom busy chat, abandoned action, stale success, or cross-chat event. Reverify normalized/raw picker boundaries and ID limits. | Regressions pass for save rollback, stale probes, truthful Stop/shutdown, export sanitization, picker limits, and session identity. Mac runtime checks now pass; packaged-app checks remain. |
| V1-05 — finish daily-use recovery | PVD-005/007/012/015, COR-001/002/004–006/009, UX-002/003/006/007: CLI/login guidance, draft retention, failed-send/model-save rollback, SSE resync, interaction expiry, native folder selection. | Fresh data reaches a first reply; navigation/reconnect/restart preserve user intent; errors have a working recovery action; effective model and Chat/Work displays agree with dispatch. | Source/browser verified for drafts, model/effective state, offline resync, CLI guidance, and native-only folder entry. Native Mac dialog and packaged recovery remain. |
| V1-06 — accept current source and real Codex | PVD-016/017, CDX-006, HIL-006, BEN-010, QA-001/003–012, UX-003: backend/UI/visual/axe/E2E checks, failure injection, real Codex approve/decline/Stop/restart, keyboard/VoiceOver/reflow. | Fresh applicable checks pass; real approval/question behavior passes; no unresolved core blocker. Distinguish fixtures/browser/real runtime evidence; make Windows/Android CI opt-in. | macOS arm64/Node 24: 73 server, 22 smoke, 7 E2E, 7 axe, 10 visual, keyboard checks, and real Codex chat/continuation/Chat-read-only/Work/Stop/approval decline+accept pass. Native question, VoiceOver, actual zoom/reflow, and packaged-app checks remain open. |
| V1-07 — build and inspect a Mac candidate | REL-001/002/003/005/006/008, QA-011: align versions, build compatible .app and DMG/ZIP, inspect resources/notices, install/upgrade/quit/relaunch, document backup/rollback. | Assets match source; no dev harness/secrets/workspace data leak; writable data stays outside app bundle; record artifacts/hashes and install outcomes. Signing/notarization is not required for this personal candidate. | Built on the Apple M1 host with Node 24.12.0: 1.0.0 arm64 `.app`, DMG, and ZIP. DMG/ZIP contents, asar resources, notices, icon hash, architecture, and identity inspected; no workspace/token/state leaked. Hashes recorded in [validation](validation.md#macos-arm64-source-and-candidate-pass-2026-11-06). Install/upgrade/quit/relaunch and owner acceptance remain open. |
| V1-08 — owner packaged-app pass | REL-007/011, QA-012: Danial uses the actual candidate, triages blockers, and receives the accepted artifact/limitations. | Finder launch, CLI setup, streaming, persisted chats/drafts, project work, approve/decline, Stop, restart/expiry, export/backup, quit/relaunch pass on his Mac. Danial accepts that artifact. | Ready for the owner pass on the V1-07 artifact and the focused [V1-08 procedure](v1-08-owner-acceptance.md); no release-readiness claim until Danial accepts it. |

V1-06/07 do not substitute for V1-08. Browser and Linux fixture results cannot accept Finder launch, native selection, data placement, or Gatekeeper behavior.

### Immediate next work

The Windows and macOS source baselines, scope gating, core corrections, daily-use recovery, fixture/browser/visual checks, and real Codex chat/continuation/Chat-read-only/Work/Stop/approval probes are complete. The 1.0.0 arm64 DMG/ZIP is built and inspected; artifact hashes are recorded. Next: verify the packaged app's install/upgrade/quit/relaunch behavior, exercise the live native question, complete VoiceOver and actual macOS zoom/reflow, then run Danial's focused V1-08 pass. The former “finish M3” instructions do not resume connectors, skills, or speech.

## Milestones and dependencies

V1-01 → V1-02 → V1-03 → V1-04 → V1-05 → V1-06 → V1-07 → V1-08.

The [triage](roadmaps/v1-triage.md) owns **69 CONTINUE / 163 PAUSE / 5 CUT/RETHINK** decisions, totaling 237. CONTINUE includes retaining/rechecking completed work; it is not a new-task count or completion percentage.

Original tables retain full public acceptance criteria, original targets/dependencies, and implementation history. The phase table and support matrix define personal-v1 dependencies and acceptance subsets:

- PVD-017/CDX-006 require external-sign-in Codex; OPC-006, managed sign-in, and custom reasoning gates are excluded.
- Core HIL covers runtime approvals/questions, expiry, cancellation, and recovery; MCP forms/URL connector journeys remain paused.
- COR-001/002 and UX-001/002/003/006/007 cover retained text/project/default/recovery surfaces; APP/STT/SKL/EFF completion and broad browser/mobile redesign are excluded.
- QA-003/005/007/008/009/011/012 cover retained contracts, real Codex, recovery, data, and package boundaries; paused feature gates do not block personal signoff.
- REL-003/007 exclude microphone, Developer ID/notarization, native skills, and connector journeys. REL-012 publication is paused.
- COR-011 and SKL-010's original dependency on HTTP-003 is historical; all three are paused and do not block this path.

Accept a v1 subset by linking its matrix/validation evidence without marking an entire broader public task Done. Preserve unfinished criteria for later work.

## Decisions to record

The [release contract](release-contract.md#decisions-to-record) owns D-01–D-11 and the approved exception. Mac chip/OS is the remaining environment detail; no further feature-scope approval is needed for the accepted path.

## Benchmark policy

The [D-11 exception](release-contract.md#d-11-benchmark-policy) waives new two-peer prerequisite research for approved corrections, core UI/recovery, QA, and local packaging. Reuse accepted comparisons and inspect authoritative compatibility documentation.

BEN-011–014 are rethought as compulsory release prerequisites, not marked research-complete. Deferred feature/platform scopes retain their benchmark requirements when resumed. Correctness, regression, real-runtime, and package checks remain mandatory.

## Foundation tasks

These rows retain original identities/criteria/history. Review supersedes earlier completion where contrary evidence exists. Personal-v1 acceptance is the subset mapped above.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| FND-001 | R1 | P0 | Done | Product | BEN-001 | **Confirm the release contract and open decisions.** Accepted 2026-11-05: D-01–D-11, R1 boundaries, launch support matrix, exclusions, and owner acceptance are recorded in [the release contract](release-contract.md); no unfinished feature is relabeled complete. |
| FND-002 | R1 | P0 | Done | Integrations | BEN-001, FND-001 | **Capture runtime versions and capability/schema baselines.** Accepted 2026-11-05: Node/Electron/Codex/OpenCode versions, generated Codex schema, OpenCode OpenAPI, fixtures, and unsupported-method fallbacks are recorded in [the runtime baseline](runtime-baselines.md) and verified by `scripts/runtime-baseline.mjs`. |
| FND-003 | R1 | P0 | Done | Host | BEN-001, FND-001 | **Version the durable data and integration schemas.** Accepted 2026-11-05: workspace v2 adds provider/profile bindings, scoped app/skill records, chat effort, and non-secret speech settings; v1 migration, backup recovery, import stripping, and merge rules have fixture evidence. Implementation update: `/api/export` now strips runtime bindings/thread IDs and app credential references, with HTTP/regression coverage. Record: [durable workspace schema](data-schema.md). |
| FND-004 | R1 | P0 | Done | Host + Product | BEN-001, FND-001 | **Define host/device authority and tool access boundaries.** Accepted 2026-11-05: administrator, host desktop, and remote-device roles are defined; provider credentials, endpoints, defaults, speech, import/export, and device management are host-authority operations enforced by API tests. Future app/skill/STT boundaries are explicit. Record: [authority model](authority-model.md). |
| FND-005 | R1 | P0 | Done | Host | BEN-001, FND-004 | **Bind event streams to authenticated devices.** Accepted 2026-11-05: SSE clients carry the authenticated device ID; rotation/revocation closes affected streams and invalidates old tokens; unrelated device streams remain connected. Record: [authority model](authority-model.md#verification). |
| FND-006 | R1 | P0 | Review | Host | BEN-001, FND-003 | **Define durable run and interruption lifecycle.** Reopened 2026-11-05: the audit reproduced an OpenCode error-event child leak and identified premature UI Stop completion. Current source fixes Codex/retained behavior: initial-save rollback, `stopping` until cleanup, one active run per host, and shutdown waiting for finalizers before saving interrupted messages. OpenCode remains paused with its error-path leak recorded. Record: [run lifecycle](run-lifecycle.md). |
| FND-007 | R1 | P0 | Done | Host | BEN-001, FND-003 | **Isolate provider session bindings.** Accepted 2026-11-05: runtime reuse requires matching provider/kind/profile/workspace/model and a non-empty thread; mismatches and legacy thread IDs clear the binding and rebuild deliberately. Record: [durable workspace schema](data-schema.md#runtime-session-reuse-fnd-007). |
| FND-008 | R1 | P0 | Done | Host | BEN-001, FND-003 | **Verify atomic persistence and recovery contracts.** Accepted 2026-11-05: writes are snapshotted and serialized, fsynced temp files replace atomically, one backup generation is retained, failed imports roll back, and lock/restart/corrupt-primary recovery pass. Implementation update: initial app-level run save failure rolls back and a retry succeeds; shutdown persists interrupted state. Record: [persistence](persistence.md). |
| FND-009 | R1 | P0 | Done | Host | BEN-001, FND-003, FND-004, FND-006 | **Add correlated pending interaction state.** Accepted 2026-11-05: interaction records carry host/run/conversation/provider/thread identity; approvals persist and resolve, unsupported questions/forms are recorded cancelled, pending records expire on restart, and hosts are isolated. Record: [interactions](interactions.md). |
| FND-010 | R1 | P0 | Done | Host | BEN-001, FND-006 | **Define timeout budgets and cancellation primitives.** Accepted 2026-11-05: shared startup/catalog/auth/tool/session/interrupt/stream/interaction/shutdown/termination/heartbeat budgets and budgetSignal/combineBudget/withBudget helpers are applied across adapters and covered by tests. Record: [timeouts](timeouts.md). |
| FND-011 | R1 | P1 | Done | Host + QA | BEN-001, FND-003 | **Standardize diagnostics and error events.** Accepted 2026-11-05: request IDs on HTTP/SSE errors, run/provider correlation, structured error envelope, redaction of tokens/keys/credentials/provider text, and focused tests. Record: [diagnostics](diagnostics.md). |
| FND-012 | R1 | P0 | Done | Host | BEN-001, FND-003, FND-004 | **Define shared config/secret storage interfaces.** Accepted 2026-11-05: owner-scoped ConfigStore with versioning/migration/atomic rollback, SecretStore with memory and encrypted-file backends, export exclusion, and tests. Record: [config and secrets](config-secrets.md). |

## Release acceptance

Use the [support matrix](support-matrix.md), [Mac test guide](macos-v1-testing.md), and [validation](validation.md). V1-08 closes only for the actual reviewed artifact and Mac outcomes. Required checks cannot be replaced by historical counts.

## Evidence and document ownership

- Promises, exclusions, benchmark exception: [release contract](release-contract.md).
- Every original task's category, effort, and primary phase: [v1 triage](roadmaps/v1-triage.md).
- Current implementation/bugs: [current state](current-state-review.md).
- Detailed original work: [task boards](roadmaps/README.md).
- Candidate acceptance/evidence: [support matrix](support-matrix.md) and [validation](validation.md).
- Setup/data/backup/pilot: [Mac test guide](macos-v1-testing.md).
- Previous public milestones/distribution: [archived roadmap](archive/project-roadmap-public-r1-2026-11-05.md) and [archived contract](archive/release-contract-public-r1-2026-11-05.md).

This documentation update performs no application fixes, publication, or user-data changes.
