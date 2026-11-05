# Current project state

Updated: 2026-11-05. Assessment source: fc634674f45bb578c68f8963758eef786aec82ac. **Approved direction: personal macOS v1.0, Codex only; implementation and current package acceptance remain open.**

[Active roadmap](project-roadmap.md#recommended-execution-order) · [Release contract](release-contract.md) · [237-task triage](roadmaps/v1-triage.md) · [Validation](validation.md) · [Support matrix](support-matrix.md)

## Current objective and next work

Danial approved the smaller personal release: packaged Finder launch, external Codex setup, streamed text chat, persisted conversations/drafts, native project folders, correct approvals/Stop, and recoverable failures. Use default reasoning and initially one active run per host. OpenCode, full MCP/Connected Apps, skills, STT, custom reasoning, extra providers, expanded scheduling/uploads, Windows/Android, and public distribution are paused.

Follow V1-01 through V1-08 in the roadmap. **Next implementation phase: V1-02, clean dependencies/runtime/build baseline.** The prior “finish M2/M3 connectors, then skills/speech” continuation is superseded. Danial's chip/macOS version is still unconfirmed; existing arm64/macOS 13+ packaging is provisional for his machine.

This scope is not yet enforced in code: six providers/custom reasoning and unfinished surfaces remain visible, multiple chats can run, and startup compatibility checks are incomplete. V1-03 owns enforcement.

## Implemented, partial, and absent

| Area | Source and evidence today |
| --- | --- |
| Architecture/UI | React/Vite UI, Express local host/SSE, Electron shell; paused Capacitor Android. Initial 18-component pass exists with previews, agents/groups/search/chats/settings and read-only Files/Terminal. Full current UI acceptance is missing. |
| Durable state | Schema v2, v1 migration, atomic serialized/fsynced snapshots, one .bak generation, locks, corrupt-primary recovery, rollback tests. Relevant supplemental library tests passed; application save-failure handling still strands runs. |
| Codex | Discovery, external account reads, catalogs/metadata, threads/turns, streaming, sandboxed work, approvals/questions, Stop/resume exist. Historical real chat/work/restart passed; current full live approval/package acceptance remains open. |
| Provider lifecycle | Readiness/capabilities, normalization, inference testing, chat selection scope and disconnect exist. Forget generations, clear/edit forms, saved ID handling, startup/version/account semantics remain partial. |
| OpenCode | CLI discovery/models, JSON streaming, continuation, inventory and termination machinery exist. Model count is treated as ready; --auto does not enforce Chat/Work; error paths leak tracked children. Paused. |
| MCP/Connected Apps | Scoped runtime inventory, inspection, app-record CRUD, Codex OAuth start/status, reload and supported questions/forms exist. Config application/adoption, enable/remove, access policy and real connector lifecycle are incomplete. Paused except core native HIL. |
| Reasoning | Codex metadata, dynamic enum controls and request validation exist. Migration/save races and effective cross-surface display remain partial. Use default reasoning in v1; custom feature work paused. |
| Skills/STT | Schema records/settings exist; no dedicated skills manager/native adapter or audio capture/transcription flow. Both paused. |
| Other product | Basic text attachments and one-time schedules exist; full semantics/recovery and richer content remain incomplete/deferred. |
| Package | Historical ad-hoc arm64 .app/DMG/ZIP were built/launched. No artifact containing all current foundation/provider/MCP changes is accepted. Source version is still 0.1.0; 1.0.0 is the target. |

## Known core findings

These are source findings or controlled reproductions, not fixed by the documentation amendment.

| Finding | Evidence | Required work |
| --- | --- | --- |
| Save failure strands chat | Injected failure at RunManager's first publishState, after reservation: first send rejects; second returns “already working”; provider never starts. | FND-008/COR-006, QA-003/009; V1-04. Storage primitive tests alone do not accept application recovery. |
| Forget undone by stale probe | Controlled probe completes after disconnect: readiness changes configured → ready. | PVD-015/PVD-006; V1-04. |
| Export contains runtime bindings | /api/export returns store.state, including providerThreadId/providerBinding. validateImport strips them on import, not export. | COR-009, QA-011; V1-04. |
| Stop UI settles early | interrupt marks a run interrupted immediately, while the controller still reserves the chat pending runtime cleanup. | FND-006/CDX-003, QA-004; V1-04. |
| Draft loss | Chat/agent selection clears text/attachments; durable draft recovery is absent. | COR-004; V1-05. |
| Stream/model recovery gaps | Bootstrap/subscription and reconnect ordering need fresh evidence; some automatic effort saves swallow errors; SidePanel displays agent rather than effective chat settings. | COR-002/005, UX-006; V1-05. Reasoning controls are deferred/gated. |
| Compatibility/account identity | Version/schema baseline script is standalone, not adapter startup enforcement. Account binding is only as precise as the profile field. | FND-002/007, CDX-001/003; V1-02/04. |

### Deferred OpenCode cleanup finding

A controlled CLI child emitted an error event and remained alive after run rejection and bridge.close(). The error path settles/removes tracking without terminating that process. Audit cleanup killed the owned fixture afterward. OPC-002/FND-006 previous fixtures cover normal Stop/shutdown, not every error path or descendants. OpenCode stays paused pending OPC-001–006 completion.

### Earlier backend findings

Device-bound SSE revocation and provider/profile/workspace/model binding have implementation/fixture evidence from FND-005/007. Prior OpenCode Stop escalation fixtures also exist. These narrower closures are preserved; current broad lifecycle acceptance is reopened by the findings above. QA-004 still needs fresh retained-source and actual runtime evidence.

## Model catalog findings

The [stress report](model-options-stress-test.md#current-status-after-provider-changes) now distinguishes current code from the original audit:

1. Empty/duplicate IDs: production normalizeModels rejects/deduplicates; raw component fixtures still bypass it.
2. Blank names: production fallback to ID exists; raw fixtures can still render unnamed choices.
3. Identical names: distinguishing ID suffix implemented; fresh browser acceptance pending.
4. Unicode search: NFKC implemented; existing Unicode test passed supplementally.
5. Scroll: query reset exists; provider-only switch reset incomplete.
6. Counts: live singular/plural and number formatting remain incorrect.
7. Limits: shared 200-character IDs/names and 200-model production cap exist; saved connection loading still slices IDs.

Do not call all seven untouched or all seven closed. Recheck both raw/normalized boundaries and actual UI/package behavior.

The six development fixtures remain in src/dev. Start a fresh npm run dev host and use /?component=composer&stress=model-options&data=worst. Port 4492 in historical records was a machine-local session, not a currently running service.

## Validation boundaries

The [personal-v1 assessment record](validation.md#personal-v1-readiness-assessment) records:

- Linux x64, Node 24.22.1/npm 11.9.0: npm registry requests returned 403; standard installation/build/typecheck/test/start/package commands were blocked.
- 40 existing tests passed through a supplemental Node TypeScript resolver, not normal npm test/typecheck.
- Strict probing found Codex 0.166.0-alpha.1 with selected schema drift, rather than baseline 0.166.0; OpenCode was absent.
- Three controlled lifecycle reproductions above succeeded; export and remaining UI issues were source-inspected.
- No fresh real inference, full browser suites, current Mac build, Finder launch, signing, VoiceOver or actual zoom acceptance was performed.

Historical 62 backend/42 UI check records and old artifact checksums retain their original scope. The old package gap covers more than picker refinement. The CI file still includes paused-platform jobs; QA-010 remains open.

## Tracking and continuation

[V1 triage](roadmaps/v1-triage.md) owns 69 CONTINUE / 163 PAUSE / 5 CUT/RETHINK decisions across all 237 IDs. Old public targets/dependencies remain reference metadata, not personal-v1 gates. Review annotations in the owning boards correct contradicted Done claims; recording scope does not finish runtime tasks.

Next: V1-02 clean baseline, then scope gating, core correctness, recovery, fresh source/live acceptance, actual Mac packaging, and Danial's V1-08 acceptance. See the [Mac guide](macos-v1-testing.md) for setup, data/backup, tokens, and the packaged test procedure.
