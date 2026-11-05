# Current project state

Updated: 2026-11-05. Original assessment source: fc634674f45bb578c68f8963758eef786aec82ac. Current implementation branch: `codex/v1-macos-release` from `be7b52e`. **Approved direction: personal macOS v1.0, Codex only; source implementation and real-Codex checks are in place, while Mac package acceptance remains open.**

[Active roadmap](project-roadmap.md#recommended-execution-order) · [Release contract](release-contract.md) · [237-task triage](roadmaps/v1-triage.md) · [Validation](validation.md) · [Support matrix](support-matrix.md)

## Current objective and next work

Danial approved the smaller personal release: packaged Finder launch, external Codex setup, streamed text chat, persisted conversations/drafts, native project folders, correct approvals/Stop, and recoverable failures. Use default reasoning and initially one active run per host. OpenCode, full MCP/Connected Apps, skills, STT, custom reasoning, extra providers, expanded scheduling/uploads, Windows/Android, and public distribution are paused.

Follow V1-01 through V1-08 in the roadmap. **V1-02 baseline and the V1-03/V1-04/V1-05 source path are implemented on branch `codex/v1-macos-release`.** The next work is V1-06 acceptance on the actual Mac and packaging in V1-07. Danial's chip/macOS version is still unconfirmed; existing arm64/macOS 13+ packaging is provisional for his machine.

The retained source is now gated to Codex, provider-default reasoning, and one active run per host. The UI exposes only Codex connections and no custom Thinking controls or Connected Apps management; paused API mutations return 409 while saved data remains. Startup now rejects unsupported Codex versions with actionable guidance. Mac Finder/package behavior is still unverified.

## Implemented, partial, and absent

| Area | Source and evidence today |
| --- | --- |
| Architecture/UI | React/Vite UI, Express local host/SSE, Electron shell; paused Capacitor Android. Initial 18-component pass exists with previews, agents/groups/search/chats/settings and read-only Files/Terminal. Full current UI acceptance is missing. |
| Durable state | Schema v2, v1 migration, atomic serialized/fsynced snapshots, one .bak generation, locks, corrupt-primary recovery, rollback tests. Application initial-save failure now rolls back the reservation/messages and a retry succeeds. Drafts are device-local and not part of workspace export. |
| Codex | Discovery, external account reads, catalogs/metadata, threads/turns, streaming, sandboxed work, approvals, Stop/resume exist. Startup checks the 0.166.x version, withholds inherited skill instructions, disables configured MCP servers per session, and performs real chat/continuation/restart/Stop/Work/approval checks. Real native questions and packaged Mac operation remain open. |
| Provider lifecycle | Readiness/capabilities, normalization, inference testing, chat selection scope and disconnect exist. Forget now invalidates in-flight probes; saved over-limit model IDs are rejected instead of sliced. Only Codex is accepted by the v1 API/UI. |
| OpenCode | CLI discovery/models, JSON streaming, continuation, inventory and termination machinery exist. API routes are gated as paused; adapter fixtures remain for the retained source. |
| MCP/Connected Apps | Scoped runtime inventory/inspection exists, but v1 UI management is removed and app-record/auth/reload mutations return 409. Per-session Codex policy disables inherited MCP servers; no connector lifecycle is promised. |
| Reasoning | Codex metadata is preserved, but v1 dispatch uses provider default and rejects new custom-effort mutations. Saved effort values remain in the workspace. |
| Skills/STT | Schema records/settings exist; no dedicated skills manager/native adapter or audio capture/transcription flow. Both paused. Inherited skill instructions are withheld from Codex runs. |
| Other product | Basic text attachments and one-time schedules exist; full semantics/recovery and richer content remain incomplete/deferred. |
| Package | Source and lockfile are now 1.0.0; a Windows unpacked content check passed. No current macOS .app/DMG/ZIP, Finder launch, native dialog, Gatekeeper, or owner Mac acceptance exists. |

## Known core findings

These are source findings or controlled reproductions, not fixed by the documentation amendment.

| Finding | Evidence | Status |
| --- | --- | --- |
| Save failure strands chat | Injected failure at RunManager's first publishState, after reservation: first send rejects; second returns “already working”; provider never starts. | **Closed in source:** rollback deletes the run/controller and both appended messages, restores binding/title, and the retry succeeds (`v1-regressions` + backend tests). |
| Forget undone by stale probe | Controlled probe completes after disconnect: readiness changes configured → ready. | **Closed in source:** disconnect advances the probe generation; the late result is ignored. |
| Export contains runtime bindings | /api/export returned store.state, including providerThreadId/providerBinding. | **Closed in source:** export strips thread IDs, bindings, and app credential references; regression/HTTP assertions pass. |
| Stop UI settles early | interrupt marked a run interrupted immediately, while the controller still reserved the chat pending runtime cleanup. | **Closed in source:** `stopping` is published until provider cleanup; real Codex Stop returned `stopping`, rejected an early send, settled `interrupted`, then continued. |
| Draft loss | Chat/agent selection cleared text/attachments; durable draft recovery was absent. | **Closed for device-local drafts:** host/chat/agent scopes survive navigation, failed send, offline/reconnect, and reload. Drafts are not in workspace export; Mac package evidence remains. |
| Stream/model recovery gaps | Bootstrap/subscription and reconnect ordering needed fresh evidence; automatic effort saves swallowed errors; SidePanel displayed agent rather than effective chat settings. | **Closed in source/browser:** offline/reconnect smoke test resynchronizes; effort auto-save removed; SidePanel shows effective Codex/model/mode. Mac/VoiceOver remains. |
| Compatibility/account identity | Version/schema baseline script was standalone, not adapter startup enforcement. Account binding is only as precise as the profile field. | **Partially closed:** app-server initialize version is checked against 0.166.x with actionable drift errors; real catalog/account discovery passes. Account changes and packaged Mac remain. |

### Deferred OpenCode cleanup finding

A controlled CLI child emitted an error event and remained alive after run rejection and bridge.close(). The error path settles/removes tracking without terminating that process. Audit cleanup killed the owned fixture afterward. OPC-002/FND-006 previous fixtures cover normal Stop/shutdown, not every error path or descendants. OpenCode stays paused pending OPC-001–006 completion.

### Earlier backend findings

Device-bound SSE revocation and provider/profile/workspace/model binding have implementation/fixture evidence from FND-005/007. Prior OpenCode Stop escalation fixtures also exist. Current retained-source Stop/shutdown regressions and a real Codex Stop now pass; OpenCode remains paused and Mac package lifecycle evidence remains open.

## Model catalog findings

The [stress report](model-options-stress-test.md#current-status-after-provider-changes) now distinguishes current code from the original audit:

1. Empty/duplicate IDs: production normalizeModels rejects/deduplicates; raw component fixtures still bypass it.
2. Blank names: production fallback to ID exists; raw fixtures can still render unnamed choices.
3. Identical names: distinguishing ID suffix implemented; model selection/effective state is covered by browser smoke, while collision-specific Mac UI evidence remains.
4. Unicode search: NFKC implemented; existing Unicode test passed supplementally.
5. Scroll: query and provider-only switch now reset the model list.
6. Counts: visible/screen-reader counts use singular/plural plus locale number formatting.
7. Limits: shared 200-character IDs/names and 200-model production cap exist; saved over-limit connection IDs are now rejected rather than sliced.

Do not call all seven untouched or all seven closed. Recheck both raw/normalized boundaries and actual UI/package behavior.

The six development fixtures remain in src/dev. Start a fresh npm run dev host and use /?component=composer&stress=model-options&data=worst. Port 4492 in historical records was a machine-local session, not a currently running service.

## Validation boundaries

The [2026-11-05 implementation record](validation.md#personal-v1-implementation-pass-2026-11-05) records the fresh Windows x64 baseline, 73/73 server tests, 22/22 browser smoke, 7/7 E2E, 7/7 axe, real Codex chat/continuation/host-restart/Stop/Work/approval probes, and the Windows unpacked content check. The [personal-v1 assessment record](validation.md#personal-v1-readiness-assessment) records the earlier limitations:

- Linux x64, Node 24.22.1/npm 11.9.0: npm registry requests returned 403; standard installation/build/typecheck/test/start/package commands were blocked.
- 40 existing tests passed through a supplemental Node TypeScript resolver, not normal npm test/typecheck.
- Strict probing found Codex 0.166.0-alpha.1 with selected schema drift, rather than baseline 0.166.0; OpenCode was absent.
- Three controlled lifecycle reproductions above succeeded; export and remaining UI issues were source-inspected.
- No fresh real inference, full browser suites, current Mac build, Finder launch, signing, VoiceOver or actual zoom acceptance was performed.

Historical 62 backend/42 UI check records and old artifact checksums retain their original scope. The old package gap covers more than picker refinement. CI now gates macOS and makes Windows/Android opt-in via workflow dispatch; Mac visual/VoiceOver/package checks remain.

## Tracking and continuation

[V1 triage](roadmaps/v1-triage.md) owns 69 CONTINUE / 163 PAUSE / 5 CUT/RETHINK decisions across all 237 IDs. Old public targets/dependencies remain reference metadata, not personal-v1 gates. Review annotations in the owning boards correct contradicted Done claims; recording scope does not finish runtime tasks.

Next: V1-06 finish the actual-Mac/manual portions (native question, Finder, VoiceOver/zoom), V1-07 build and inspect the macOS candidate, then Danial's V1-08 packaged-app pass. See the [Mac guide](macos-v1-testing.md) for setup, data/backup, tokens, and the packaged test procedure.
