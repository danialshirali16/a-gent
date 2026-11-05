# A Gent — Validation Record

Updated: 2026-11-06. Latest implementation source: branch `codex/v1-macos-release` from `be7b52e`. The latest command/runtime/package checks ran on a macOS arm64 (Apple M1) host with Node 24.12.0; the earlier implementation pass used Windows x64 and the assessment used Linux x64. Earlier results below retain their original scope. The Mac package is built and inspected, but install/relaunch, native-question, VoiceOver/zoom, and owner V1-08 acceptance remain open.

[Active v1 path](project-roadmap.md#recommended-execution-order) · [Contract](release-contract.md) · [Candidate matrix](support-matrix.md) · [Current state](current-state-review.md)

## macOS arm64 source and candidate pass 2026-11-06

Scope: V1-06 source/browser/real-Codex checks and V1-07 package build/inspection on the candidate branch `codex/v1-macos-release`. The exact build commit, sizes, and SHA-256 values are recorded in `release-artifacts/A-Gent-1.0.0-macos-arm64.json` and `SHA256SUMS.txt`. This is actual Apple-silicon evidence, but it is not a packaged-app acceptance pass.

### Environment

| Item | Value |
| --- | --- |
| Host | MacBook Pro (MacBookPro17,1), Apple M1, 8 GB |
| OS | macOS 27.2 (26B123) |
| Node / npm | 24.12.0 / 11.6.2 |
| Electron | 45.2.2 |
| Codex CLI | 0.166.0, signed in externally (8 models; first `gpt-6.1-sol`) |
| OpenCode CLI | 1.17.9 installed; differs from the paused 2.2.5 fixture and is not a v1 gate |

### Commands and results

| Check | Result and scope |
| --- | --- |
| `npm ci --no-audit --no-fund` | Pass; 536 packages from the lockfile. |
| `npm run typecheck` | Pass. |
| `npm test` | 73/73 pass, including core-failure, draft, HIL, persistence, provider, and package-content regressions. |
| `npm run build` | Pass; existing >500 kB Vite chunk advisory remains. |
| `npm run test:ui` | 22/22 smoke pass in macOS Chrome against the fixture host. |
| `npm run test:e2e` | 7/7 pass. |
| `npm run test:a11y` | 7/7 axe scans pass with 0 violations and 0 serious/critical findings. |
| `npm run test:visual` | 10/10 pass after reviewing and regenerating the darwin baselines for the intentional `Connections` label (V1 scope). No unrelated layout change. |
| `node scripts/runtime-baseline.mjs --strict` | Codex 0.166.0 matches the fixture; 106 client methods, 10 server requests, and 26 schema files pass. Strict exit is non-zero only because installed OpenCode 1.17.9 differs from the paused 2.2.5 baseline. |
| `npm run desktop:runtime` | Pass; Electron 45.2.2 installed. |
| `npm run desktop:mac` | Pass; `A-Gent-1.0.0-mac-arm64.dmg` and `.zip` built for arm64. |
| Package inspection | `A Gent.app` is arm64, version 1.0.0, bundle id `com.agent.desktop`, minimum macOS 13.0; ICNS hash matches `electron/assets/icon.icns`; asar contains `dist/`, `dist-server/`, `electron/`, `README.md`, 59 docs Markdown files, `package.json`, and `dist/THIRD_PARTY_NOTICES.txt`; no workspace, `.token`, `state.json`, `connections.json`, or `.data` was found. |
| DMG/ZIP contents | DMG mounts with `A Gent.app` and an `Applications` link; ZIP expands the same app. |
| Signing | Unsigned/ad-hoc only (`identity: null`); `spctl` on this host reported `override=security disabled`, so this is not ordinary Gatekeeper evidence. No notarization claim. |
| `npm run test:visual`/install/launch | Visual passes in Chrome; Finder launch, native dialog, install/upgrade/quit/relaunch, and Gatekeeper behavior were not exercised. |

The first record-commit CI run exposed a flaky dark-mode axe scan: Chromium reported the new root `--ui-ink` before the shell's inherited color recalculated, so axe briefly saw light text on a dark background. The audit now polls the painted `.reason-app` color (commit `a374158`); 35/35 repeated accessibility checks pass locally, and the fix is included in the current CI run.

### Real Codex probes

All live checks used the external signed-in Codex CLI with an isolated data directory and disposable workspace. No account token was copied into the workspace or repository.

| Scenario | Result |
| --- | --- |
| Discovery/account | Codex ready with 8 models; no OpenCode or other provider connection required. |
| First chat | Prompt “Reply with exactly OK. Do not use tools.” completed with `OK` and a persisted provider thread. |
| Continuation | “Reply with exactly DONE. Do not use tools.” completed with `DONE` on the same persisted thread. |
| Chat read-only | A request to create a file completed with `CHAT-READ-ONLY`; no file was created and no approval was raised. |
| Work mode | A requested `work-check.txt` containing `hello` was created inside the disposable workspace; the run completed. This host showed variable multi-minute latency (one turn took ~14 minutes) but no permanent hang. |
| Stop | `interrupt` returned `stopping`; a send while stopping returned 409; the run settled `interrupted` in about 1 s; the next prompt completed with `AFTER`. |
| Approval decline | An outside-workspace home-directory write raised one native command approval. Decline completed the run and left the target file absent. |
| Approval accept | Repeating the request and accepting created only the target file with `hello`; the file was removed afterward. |
| Native question | Not exercised. The live Codex question path was not reachable in the retained Chat/Work flow; deterministic HIL fixtures pass. This remains open. |
| VoiceOver / actual macOS zoom | Not exercised. Keyboard smoke/focus checks pass; VoiceOver and OS zoom/reflow remain open. |

The `/tmp` path is intentionally writable under the current `excludeSlashTmp: false` turn policy, so it did not raise an approval. The recorded approval scenario uses a home-directory path outside the workspace.

### Candidate artifacts

| Artifact | Record |
| --- | --- |
| Local `release/A-Gent-1.0.0-mac-arm64.dmg` | Size and SHA-256 in `release-artifacts/A-Gent-1.0.0-macos-arm64.json` / `LOCAL-SHA256SUMS.txt`. |
| Local `release/A-Gent-1.0.0-mac-arm64.zip` | Size and SHA-256 in the same manifest. |
| CI `A-Gent-macos` artifact zip | 658,485,676 bytes; SHA-256 `02b7d02e7309448462259ddc405f8ccbed793c6f09a9645a86dc61c8ad409e9d`; `CI-SHA256SUMS.txt`. |
| CI-extracted DMG / ZIP | SHA-256 values in `SHA256SUMS.txt`; the CI DMG's app tree hash matches the local app (`59b86ca2…`). |
| `.app` bundle | Inspected in both builds; identical content tree hash `59b86ca263d8c03e4d23b1499b9523ff3503e7e40a9122ce41d2fcd9e88e4984`. A bundle digest is not a notarization identity. |

CI artifact: the `A-Gent-macos` artifact attached to the GitHub Actions run for the build commit (expires per repository policy). The artifact's extracted `mac-arm64` directory can have dereferenced framework symlinks; use its DMG or ZIP. The manifest itself is repository evidence and is not part of the packaged app.

### Open V1-06/V1-07 items

- Native Codex question path (live, not fixtures).
- VoiceOver and actual macOS zoom/reflow.
- Packaged install/upgrade/quit/relaunch, Finder launch, native folder dialog, Gatekeeper/quarantine behavior.
- Danial's V1-08 acceptance of the exact artifact; no release-readiness or public-publication claim.

## Personal v1 implementation pass 2026-11-05

Scope: V1-02 baseline plus the V1-03/V1-04/V1-05 source path on branch `codex/v1-macos-release`, created from `be7b52e` (current `main`). This record distinguishes commands that ran on the Windows development host from the still-required Mac package/V1-08 evidence. It does not accept a release candidate.

### Environment and clean baseline

| Check | Result and scope |
| --- | --- |
| Host | Windows 11 x64 (10.0.26300), Node v26.12.1, npm 11.20.0, Codex CLI 0.166.0, OpenCode 2.2.5. Electron 45.2.2 installed through `npm run desktop:runtime`. This is a development host, not the owner Mac. |
| Registry reachability | `npm ping` returned PONG from registry.npmjs.org. The prior Linux 403 was not reproduced here. |
| `npm ci --no-audit --no-fund` | Pass; 535 packages installed from the lockfile. `npm ls --depth=0` resolved the pinned dependency set. |
| `npm run typecheck` | Pass. |
| `npm test` | 73/73 pass, including the new core-failure and draft regressions. |
| `npm run build` | Pass; the existing Vite >500 kB chunk advisory remains. |
| `node scripts/runtime-baseline.mjs --strict` | Pass on this host: Codex 0.166.0 and OpenCode 2.2.5 matched fixture versions; required Codex methods and selected schema hashes passed. OpenCode OpenAPI was not probed (`fetch failed`). |
| `npm run test:ui` | 22/22 browser smoke tests pass in Windows Chrome against the fixture host. |
| `npm run test:e2e` | 7/7 browser E2E workflows pass. |
| `npm run test:a11y` | 7/7 axe scans pass with 0 violations and 0 serious/critical findings. |
| `npm run test:visual` | Not run. Checked-in baselines are macOS `darwin`; a Windows screenshot comparison cannot certify the Mac candidate. |
| `npm run desktop:pack` | Windows x64 unpacked package built at `release/win-unpacked`. `app.asar` contains `dist/`, `dist-server/`, `electron/`, docs, README, and package version 1.0.0; no workspace state, `.token`, `.data`, or provider secret was found. This is a packaging-content check, not a Mac artifact or Finder/Gatekeeper test. |
| `npm run desktop:mac` | Not run: this host is Windows x64. No current `.app`, DMG, ZIP, checksum, or Mac install result exists. |

### Real Codex probes and source behavior

All live checks used the signed-in external Codex CLI and isolated temporary data directories. No account token was copied into the workspace or repository. They are real-runtime evidence, separate from the deterministic fixtures.

| Scenario | Result |
| --- | --- |
| CLI/account discovery | `CodexBridge.info()` returned authenticated with 8 models; first catalog ID `gpt-6.1-sol`. |
| Runtime policy | A real app-server thread with the source policy config reported all four configured external MCP servers as `disabled`: `chrome-devtools`, `codebase-memory-mcp`, `node_repl`, `open-design`. Features `apps`, `plugins`, `hooks`, and `multi_agent` were disabled, and skill instructions were withheld. `codex debug prompt-input` with the same policy flags produced zero skill entries. |
| First real chat | `gpt-6.1-sol`, prompt “Reply with exactly OK. Do not use tools.” completed with `OK`; a provider thread was persisted. |
| Continuation | Second prompt “Reply with exactly DONE. Do not use tools.” completed with `DONE` on the same provider thread. |
| Restart/continue | Host closed and restarted against the same isolated data directory; the next prompt completed with `TWO` on the same persisted provider thread (`ONE` before restart). |
| Real Stop | A long answer in Chat mode returned `stopping` immediately; an attempted send while stopping returned 409; the run settled as `interrupted`; the next prompt completed with `AFTER`. |
| Real Work mode | A disposable workspace write completed and produced `work-check.txt` containing `hello`. |
| Real Chat read-only | A request to create a file in Chat mode completed without creating it; the model explained that Chat mode is read-only. |
| Real approval decline | A `require_escalated` PowerShell write outside the workspace raised one native command approval. Declining completed the run and left the target file absent. |
| Real approval accept | Repeating the same request and accepting the approval created only the requested file with `hello`; the temporary directory was then removed. |
| Real native question | Not exercised. The supported QA question path is covered by deterministic HIL fixtures; Codex's live request-user-input path was not reachable in the retained Chat/Work mode test. This remains a V1-06/manual-package check. |

The live probes did not exercise VoiceOver, actual Mac zoom/reflow, Finder launch, native folder dialog, Quit/relaunch, Gatekeeper, or the packaged Mac app. Machine-readable evidence: [2026-11-05 implementation probe](benchmarks/evidence/2026-11-05-v1-implementation.json).

### Source changes verified by this pass

- Initial persistence failure now rolls back the reservation and both messages; a retry is not permanently 409 (`tests/server/v1-regressions.test.ts`).
- Forget invalidates in-flight probes, so a late Codex result cannot restore readiness.
- Stop reports `stopping` until provider cleanup, rejects concurrent sends, and only then exposes `interrupted`; shutdown waits for active-run finalizers before saving.
- Export strips `providerThreadId`, `providerBinding`, and app `credentialRef`; import already strips runtime bindings.
- v1 dispatch ignores saved reasoning metadata and sends provider-default reasoning; custom reasoning API/UI paths are gated while saved values remain.
- Only Codex is accepted at provider/agent/conversation/default settings boundaries; paused provider, app-record, app-sign-in, and app-reload mutations return 409 while saved data remains.
- Drafts are device-local (Electron/browser local storage), scoped by host and chat/agent; navigation, failed send, offline/reconnect, and reload preserve them. They are not part of workspace export.
- Codex compatibility accepts the verified 0.166.x line and rejects prerelease/other minors with actionable install guidance.
- The browser suite verifies model selection/effective state, Stop, offline stream reconnect/resynchronization, and draft retention.

## Personal v1 readiness assessment

Date: 2026-11-05. Read-only assessment before owner scope approval. Host: Linux x64, Node 24.22.1, npm 11.9.0. Original working tree stayed clean; dependency attempts, existing tests, and controlled reproductions ran in a disposable copy.

### Fresh commands and limits

| Command/check | Result and scope |
| --- | --- |
| npm ci | npm registry tarball requests returned HTTP 403. The installation stalled and was stopped; a retry with --fetch-retries=0 --fetch-timeout=10000 --no-audit --no-fund encountered the same denial and was stopped. This is an executor/network limitation, not proof of lockfile corruption. |
| npm run typecheck | Blocked by missing installation: tsc not found. |
| npm run build | Blocked by missing Vite. |
| npm test | Blocked by missing tsx. No fresh normal 62-test result. |
| npm start | No dist-server build; app did not start. |
| npm run desktop:mac | Blocked by the missing build dependency. Linux x64 is also not an actual macOS package/launch acceptance host. |
| UI / visual / axe / E2E | Not rerun; build/browser prerequisites unavailable. |
| Supplemental existing tests | 40 passed using Node --experimental-transform-types and an in-memory resolver for relative .js/extensionless imports to existing .ts sources. Excluded backend.test.ts and diagnostics.test.ts, which require Express. No application/test files were edited. |
| Supplemental runner detail | Initial resolver ran 37 passing tests but could not resolve the extensionless modelOptions import. After correcting only the ephemeral resolver, its 3 existing tests passed. This is 40 distinct tests, not a normal npm suite/typecheck result. |
| node scripts/runtime-baseline.mjs --strict | Exit 1: installed Codex 0.166.0-alpha.1 differs from baseline 0.166.0 and selected schema hashes drift; OpenCode is missing. Required method/metadata checks passed. No live inference was attempted. |
| Documentation audit | 636 relative file targets resolved. One machine-local absolute skill link and two stale backend-finding anchors were found. These describe the pre-amendment tree. |
| Repository checks | Original git status clean; git diff --check passed. |

The supplemental pass covers existing model/catalog/search, session binding, HIL parsing, interactions, config/secrets, persistence/migration, budgets, provider credential/contract/HTTP fixtures, and scoped Codex inventory/capability fixtures. It does not certify the full Express host, React UI, real account behavior, Electron, Mac architecture, Gatekeeper, or current package.

### Controlled failure reproductions

| Reproduction | Observed outcome | Owner / active phase |
| --- | --- | --- |
| Initial persistence failure | Override RunManager.publishState to reject before provider launch. First send rejects; second says the chat is already working; run remains running because reservation cleanup is not installed around the first awaited save. | FND-008/COR-006, QA-003/009; V1-04. |
| Forget during outstanding Codex probe | Hold info(), start probeCodex, disconnect, then return authenticated info. Readiness changes configured → ready after the stale result. | PVD-006/015; V1-04. |
| OpenCode error child | Launch an owned Node child that emits a JSON error/session PID and stays alive. run rejects and bridge.close returns, but child is still alive. Audit cleanup explicitly kills that fixture. | OPC-002/FND-006; OpenCode paused. |

Source inspection, without a fresh HTTP/browser run, also confirmed raw store.state export includes providerThreadId/providerBinding, immediate interrupted UI state before cleanup, draft-clearing selection handlers, query-only scroll reset, raw plural/count copy, and saved model-ID slicing.

Normal stop/shutdown/atomic-storage fixtures are narrower than these application/error cases. Eight prior Done labels are reopened in the documentation amendment; prior evidence remains historical.

### Historical evidence that does not accept this candidate

- The 62-test Windows source run and earlier 42 UI checks apply to their recorded stages, not a fresh full pass here.
- Historical real Codex chat/Stop/project write/restart/resume and one OpenCode model reply do not complete current live approval, account/recovery, or packaged acceptance.
- The earlier arm64 DMG/ZIP checksums do not identify a package containing all current foundation/provider/MCP work.
- An earlier spctl result relied on disabled host security overrides; no ordinary quarantined-download/clean-Mac claim follows.
- No fresh paid inference, connector/OAuth/STT/skills journey, Mac package launch, VoiceOver, actual zoom, signing, or notarization check occurred.

## Personal v1 scope and documentation amendment

Date: 2026-11-05. Danial approved the assessment, Codex-first personal v1 scope, all-task triage, ordered path, and D-11 benchmark exception, then requested documentation updates.

- Active roadmap: V1-01 through V1-08; next implementation work is V1-02.
- Every original ID is classified once: 69 CONTINUE / 163 PAUSE / 5 CUT/RETHINK.
- Reopened Review: FND-006, PVD-006/010/011/015/016, OPC-002, EFF-005. Original implementation counts become 48 Done / 13 Review / 176 To do; this is not a v1 completion percentage.
- Original public R1 roadmap/contract/matrix are archived; broader unfinished criteria are retained.
- Mac chip/OS remains unconfirmed; arm64/macOS 13+ is the provisional existing baseline.
- Scope gates, default reasoning, single active run, app fixes, version bump, and package acceptance are still unimplemented. Only Markdown documentation is changed in this pass.
- Documentation checks passed: 237 unique original tasks and 237 unique triage entries match exactly; decisions total 69/163/5; every effort/primary phase is valid; all 8 ordered phases are present. 700 relative links, including 145 anchor references, resolve with no nonportable absolute links. git diff --check passed. Changes are Markdown-only; application/test/config files are unchanged. No new application tests or package build are implied.

## Historical validation records

The records below retain their original execution dates/source/artifact scope. Statements about “current,” old R1 requirements, or benchmark gates inside an earlier record are historical; follow the current contract/matrix and the assessment above.

Date: 2026-11-05\
Host: macOS arm64 baseline; latest M3 source checks on Windows x64 (development evidence, not R1 acceptance)\
Historical packaged-baseline Node: 22.23.1\
Codex CLI: 0.166.0\
Electron: 45.2.2

Records below are scoped to their review. The latest focused source commands use Node 24; historical full-suite counts and artifact checksums were not recomputed by the documentation update. Start with [the documentation index](README.md) for current state and continuation.

## M0 foundation acceptance

Date: 2026-11-05. Scope: BEN-001, FND-001, and FND-002; release contract, runtime/capability baseline, and initial QA-001 support matrix. This was a research/contract pass, not a provider, MCP, speech, skills, UI, package, or publication verification.

| Check | Result |
| --- | --- |
| `node scripts/runtime-baseline.mjs --strict` | Pass on the probe host: Codex 0.166.0, OpenCode 2.2.5, Electron 45.2.2 expected; Codex required methods/model metadata and 26 fixture files match. |
| Codex schema generation | `codex app-server generate-json-schema --out <temp>`: 106 client methods, 10 server-request methods; generated 2026-11-05. |
| OpenCode OpenAPI capture | `opencode api GET /openapi.json`: OpenAPI 3.1.0, 138 paths, 169 operations; captured 2026-11-05. |
| Fixture parse | Codex and OpenCode manifests and selected schema files parse as JSON; checked-in sizes are recorded in the manifests. |
| Release decisions | D-01–D-11, R1/exclusions, launch support summary, and owner acceptance recorded in [the release contract](release-contract.md). |
| Benchmark record | [BEN-001](benchmarks/BEN-001-foundations.md) covers FND-001–012 with Reason, Codex, and OpenCode comparisons and explicit limitations. |
| Support matrix | Initial [QA-001 matrix](support-matrix.md) maps R1 surfaces and negative states to owner/test/evidence and gate; QA-001 remains To do pending BEN-013. |
| Documentation links | 636 repo-relative links checked across `docs/**/*.md` and `README.md`; 0 missing. One pre-existing host-absolute skill link was skipped. |
| `git diff --check` | Pass. |
| Live provider/MCP/OAuth/STT/skill calls, package/signing/clean-Mac checks, VoiceOver/zoom, performance | Not performed in this pass; listed as limitations in the records. |

The runtime probe used Node 26.12.1 on Windows x64. Release packaging remains Node 24.x per FND-001; the probe does not certify a macOS package or a real provider account.

## FND-003 durable schema v2

Date: 2026-11-05. Scope: workspace schema, v1 migration, backup recovery, export/import stripping, scoped app/skill records, chat effort, and non-secret speech settings. UI behavior and provider integration were not changed.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 21/21 pass, including 4 new schema-migration tests and the updated v2 import case. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| v1 migration | Adds `apps`/`skills`, sets version 2, preserves agents/chats/messages/schedules/settings, promotes legacy `providerThreadId` to `providerBinding`. |
| Backup rollback | After save, primary is v2 and `.bak` is v1; corrupting the primary recovers the v1 backup, migrates it, and preserves the conversation. |
| v2 round-trip | Preserves provider binding, chat effort, scoped apps/skills, and speech settings; `validateImport` strips provider binding/thread IDs. |
| Validation negatives | Unsupported version, unknown scope, invalid ownership, invalid speech credentials, and duplicate app/skill IDs are rejected. |
| Merge | Imported apps/skills are added without replacing existing records. |

Record: [durable workspace schema](data-schema.md). Code: `shared/types.ts`, `server/store.ts`; tests: `tests/server/schema-migration.test.ts`. The two pre-existing cross-platform test assumptions (Windows workspace path separator and version-2 import rejection) were corrected so the suite runs on this host; neither changes product behavior.

## FND-004 host/device authority

Date: 2026-11-05. Scope: API-boundary roles for host-level credentials/configuration versus ordinary workspace use. The implemented policy distinguishes the administrator token, a host-local desktop device, and a remote paired device.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 22/22 pass at the FND-004 step (23/23 after FND-005), including the new host-authority test. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Host desktop device | Can export the workspace, change default provider/model, change speech settings, connect providers, and use ordinary workspace routes. |
| Remote device | Can read bootstrap/auth, use chats/schedules/approvals/files, and change ordinary UI preferences; host defaults, speech, provider connect, export, and import return 403. |
| Administrator | Can perform host-level operations even with forwarding headers; device creation remains administrator-only. |
| Device self-management | Device self-rotation/revocation remains allowed; managing another device remains denied. |

Record: [authority model](authority-model.md). Code: `server/index.ts`; test: `tests/server/backend.test.ts` (`host authority separates desktop devices from remote devices for credentials and workspace data`). This is transport-locality enforcement; explicit persistent device roles remain future work if multi-user/remote-admin behavior is required.

## FND-005 device-bound event streams

Date: 2026-11-05. Scope: bind SSE clients to the authenticated device and close only the affected streams on rotation/revocation.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 23/23 pass, including the new event-stream binding test. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Affected stream | Rotating or revoking a device closes its open SSE stream; the old token returns 401. |
| Unrelated stream | A second device's stream stays open and receives the next state event after another device is rotated. |
| Administrator stream | Administrator SSE clients have no device ID and are not closed by device rotation/revocation. |

Record: [authority model](authority-model.md#event-stream-binding-fnd-005). Code: `server/index.ts`; test: `tests/server/backend.test.ts` (`device rotation and revocation close that device event stream`).

## FND-007 provider session binding

Date: 2026-11-05. Scope: reuse a provider thread/session only when the stored binding matches the current run; rebuild deliberately on provider/profile/workspace/model changes or legacy data.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 26/26 pass, including 2 unit tests and 1 end-to-end binding test. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Same binding | Second message reuses `test-thread-1`; the binding retains provider, kind, model, and workspace. |
| Model change | Third message rebuilds to a new provider thread and stores the new model in the binding. |
| Legacy/mismatch | A legacy `providerThreadId` without a complete binding is cleared; provider/profile/workspace/model mismatches clear both fields. |
| Fresh chat | Starts without a provider thread until the adapter reports one. |

Record: [durable workspace schema](data-schema.md#runtime-session-reuse-fnd-007). Code: `server/session-binding.ts`, `server/runs.ts`; tests: `tests/server/session-binding.test.ts`, `tests/server/backend.test.ts` (`provider sessions are reused only for a matching binding and rebuilt when the model changes`).

## FND-006 run lifecycle and confirmed termination

Date: 2026-11-05. Scope: reservation release, Stop/termination confirmation, OpenCode child cleanup, and shutdown recovery.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 29/29 pass, including 3 new OpenCode lifecycle tests. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| OpenCode shutdown | `run()` rejects only after the child exits; the PID is gone. |
| OpenCode Stop | The chat stays `409` while the child terminates, then accepts a new message only after exit. |
| Host shutdown | An active OpenCode child is terminated and `state.json` stores the assistant message as `interrupted`. |
| Codex | Existing test still observes child exit after an ignored graceful stop. |

Record: [run lifecycle](run-lifecycle.md). Code: `server/opencode.ts`, `server/runs.ts`; fixture: `tests/server/fake-opencode.mjs`; tests: `tests/server/backend.test.ts` (`OpenCode shutdown…`, `OpenCode Stop…`, `host shutdown…`).

The Windows host terminates OpenCode on SIGTERM immediately; the 2-second escalation path is exercised by code and the POSIX fixture behavior, not measured on this host. QA-004 should reproduce the historical "OpenCode continues after Stop" finding on macOS.

## FND-008 atomic persistence and recovery

Date: 2026-11-05. Scope: save queue/atomic replacement, backup retention, failed-write recovery, failed-import rollback, lock/restart behavior, and migration compatibility.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 32/32 pass, including 3 new persistence tests. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Concurrent saves | Final primary is the later snapshot; backup is a valid previous snapshot; no `.tmp` remains. |
| Failed write | Primary remains byte-identical; a later save succeeds and reloads correctly. |
| Failed import | Candidate state rolls back in memory; a later save/reload contains no imported record. |
| Existing recovery | Lock rejection/stale-lock recovery, corrupt-primary backup recovery, v1→v2 migration, and import/export stripping remain green. |

Record: [persistence](persistence.md). Code: `server/store.ts`; tests: `tests/server/persistence.test.ts`, `tests/server/schema-migration.test.ts`, `tests/server/backend.test.ts`.

## FND-009 correlated pending interactions

Date: 2026-11-05. Scope: durable approval/question/form/URL correlation, decision persistence, restart expiry, and host isolation.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 35/35 pass, including 3 new interaction-store tests and approval correlation assertions. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Approval correlation | A live approval writes `hostId`, `runId`, `conversationId`, `providerId`, `threadId`, `kind: approval`, and `status: pending`. |
| Decision persistence | Accepting the approval persists `status: accepted` before the run completes. |
| Restart | A pending record becomes `expired` on the next host load and cannot remain actionable. |
| Host switch | Separate data directories/host IDs keep independent records. |
| Corrupt file | Damaged interactions are renamed to `interactions.json.corrupt-*` and replaced with a clean store. |
| Unsupported question/form | Codex elicitation/user-input/unknown requests are recorded as cancelled notices; no answer is fabricated. |

Record: [interactions](interactions.md). Code: `server/interactions.ts`, `server/runs.ts`, `server/codex.ts`, `server/index.ts`; tests: `tests/server/interactions.test.ts`, `tests/server/backend.test.ts`.

## FND-010 shared timeout budgets and cancellation

Date: 2026-11-05. Scope: centralize timeout policy, bounded cancellation helpers, adapter application, interaction expiry, SSE heartbeat/buffer, and a total-run stream safety net.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 38/38 pass, including 3 new budget tests and interaction expiry assertion. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Budget categories | startup, catalog, auth, tool, session, interrupt, stream, interaction, shutdown, termination grace/kill, heartbeat, response/SSE caps are defined and ordered. |
| Cancellation primitives | `budgetSignal`, `combineBudget`, and `withBudget` abort on timeout, preserve parent abort, and clear timers. |
| Adapter application | Codex RPC/close, OpenCode capture/run/termination/close, HTTP catalog/stream, SSE heartbeat/buffer, and RunManager total-run cap use shared budgets. |
| Interaction expiry | New pending interactions receive `expiresAt`; restart still expires pending records immediately. |

Record: [timeouts](timeouts.md). Code: `server/budgets.ts` plus `server/codex.ts`, `server/opencode.ts`, `server/providers.ts`, `server/runs.ts`, `server/index.ts`, `server/interactions.ts`; tests: `tests/server/budgets.test.ts`.

## FND-011 diagnostics and redacted errors

Date: 2026-11-05. Scope: request/run/provider correlation, structured API/SSE errors, credential redaction, and user recovery copy.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 40/40 pass, including 2 new diagnostics tests. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Request IDs | Supplied or generated IDs appear in `X-Request-Id` and error bodies; auth failures include them. |
| Redaction | Bearer tokens, prefixed tokens, token/api-key/password/secret/cookie assignments, JSON credentials, and truncated text are redacted. |
| Provider text | HTTP bodies, Codex stderr, and OpenCode stderr pass through redaction before errors/details are exposed. |
| User recovery | 413 and 500 return bounded generic messages plus a request ID; validation errors stay actionable. |
| SSE errors | Error events may carry requestId/runId/providerId/appId/code; run save/approval failures include run/provider IDs. |

Record: [diagnostics](diagnostics.md). Code: `server/diagnostics.ts`, `server/index.ts`, `server/runs.ts`, `server/providers.ts`, `server/codex.ts`, `server/opencode.ts`; tests: `tests/server/diagnostics.test.ts`.

## FND-012 config and secret storage interfaces

Date: 2026-11-05. Scope: owner-scoped typed config, credential references, encryption at rest, atomic updates/rollback, migration, and export exclusion.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 45/45 pass, including 5 new config/secret tests. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Typed config | Owner/version checks, validation, legacy migration, backup recovery, and owner-mismatch rejection pass. |
| Config rollback | A failed write leaves the previous in-memory value intact. |
| Memory secrets | Owner-separated set/get/list/delete pass. |
| File secrets | AES-256-GCM ciphertext, key file, reload, owner separation, delete, and no plaintext in `secrets.json` pass. |
| Export exclusion | Workspace state/export does not contain the stored secret value. |
| Secret recovery | Backup recovery and failed-write rollback pass. |

Record: [config and secrets](config-secrets.md). Code: `server/config-store.ts`, `server/secrets.ts`; tests: `tests/server/config-secrets.test.ts`. ProviderManager still uses its existing connections file and session-only key map; PVD-003/PVD-004/STT-002 adopt these interfaces.

## BEN-002 shared provider lifecycle comparison

Date: 2026-11-05. Scope: research/design comparison, not provider implementation. Compared Codex 0.166.0, OpenCode 2.2.5, LM Studio current docs/CLI, Jan Desktop current docs, and the A Gent source baseline.

| Check | Result |
| --- | --- |
| Codex evidence | Generated 0.166.0 schema (106 client methods/10 server requests) and official App Server docs. |
| OpenCode evidence | Generated 2.2.5 OpenAPI (138 paths/169 operations) and official Server docs. |
| LM Studio evidence | `lms` CLI commit `1b7181b` installed; `lms server status` reported not running; `lms ls --json` woke the service and exceeded the 30s probe timeout; official server/auth/models/settings docs read. |
| Jan evidence | Jan not installed; official quickstart, Local API Server, and custom-endpoint docs read. |
| Live inference/auth/MCP/OAuth | Not performed; PVD-017/QA-008 remain the real-service gates. |
| Contract output | [BEN-002](../docs/benchmarks/BEN-002-provider-lifecycle.md) records lifecycle states, discovery-vs-inference proof, identity/presentation, credentials, edit/remove, recovery, and error contracts mapped to PVD-001–018. |
| Documentation links | Repo-relative link check passed after the update; no runtime code changed. |

BEN-002 is a design/benchmark acceptance only. It does not mark any provider implementation task Done.

## BEN-003 Codex integration comparison

Date: 2026-11-05. Scope: research plus direct app-server observation. Compared Codex CLI/TUI, app-server schema/docs, and a live ChatGPT account.

| Check | Result |
| --- | --- |
| `codex login status` | `Logged in using ChatGPT` |
| `account/read` | Authenticated; `requiresOpenaiAuth: true` |
| Visible models | 8 |
| `gpt-6.1-sol` metadata | default `low`; supported `low/medium/high/xhigh/max/ultra`; text/image modalities |
| Real turn | `turn/completed` status `completed`; response `OK` |
| Real Stop | Second turn interrupted; `turn/completed` status `interrupted` |
| Thread/turn correlation | Opaque thread/turn IDs observed in events and completion |
| Approvals/questions/elicitation | Schema/docs/fixtures only; not live-exercised |
| Current gap | A Gent discards effort metadata and uses a global effort allowlist |

Record: [BEN-003](../docs/benchmarks/BEN-003-codex-integration.md). This is a benchmark/design acceptance; it does not close CDX-001–006.

## BEN-004 OpenCode integration comparison

Date: 2026-11-05. Scope: research plus direct CLI/server observation and one live model turn.

| Check | Result |
| --- | --- |
| `opencode auth list` | Stored OpenAI and OpenCode Console credentials |
| Model catalog | 26 models |
| Real turn | `opencode-go/deepseek-v4.1-flash` completed through A Gent |
| Alternate models | `openai/gpt-5.5` unsupported for ChatGPT account; `opencode/deepseek-v4.1-flash` insufficient funds |
| v2 API | OpenAPI 3.1.0, 138 paths/169 operations; session/event/permission/form/MCP/skill routes present |
| Current adapter | CLI `run --format json --auto`; model count treated as readiness; undocumented event format |
| Live Stop/permission prompts | Not exercised; process cleanup and fixtures cover escalation |

Record: [BEN-004](../docs/benchmarks/BEN-004-opencode-integration.md). This is a benchmark/design acceptance; it does not close OPC-001–006.

## BEN-021/BEN-022 reasoning and Thinking controls

Date: 2026-11-05. Scope: model-specific reasoning capability contract and picker/cross-surface controls.

| Check | Result |
| --- | --- |
| Codex live metadata | `gpt-6.1-sol` default `low`; options `low/medium/high/xhigh/max/ultra`; text/image input |
| OpenCode evidence | Model variants/settings in v2 OpenAPI; no uniform effort enum |
| Ollama evidence | `think` boolean/string/null, discovery via `/api/show`; deferred provider |
| Capability contract | Enum/budget/boolean/unsupported/unknown, source/precedence/freshness, native mapping, migration, dispatch validation mapped to EFF-001–006 |
| Thinking controls | Supplied picker layout retained; per-model options/default, no-reasoning/unknown states, cross-surface/race/accessibility mapped to EFF-007–012 |
| Implementation | Not yet done; current UI still has fixed Light/Balanced/Deep and global `medium` |

Records: [BEN-021](../docs/benchmarks/BEN-021-reasoning-capability.md), [BEN-022](../docs/benchmarks/BEN-022-thinking-controls.md). These are benchmark/design acceptances; they do not close EFF-001–012.

### Reasoning implementation slice

Date: 2026-11-05. Scope: typed model capability metadata, Codex discovery preservation, dynamic picker options/default, and dispatch validation.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 51/51 pass in the current suite (49 at the reasoning step). |
| `npm run build` | Pass; existing chunk-size advisory remains. |
| Live Codex metadata | 8 models returned with enum options/defaults; `gpt-6.1-sol` default `low`, `gpt-6-sol` default `medium`, `gpt-6-luna` excludes `ultra`. |
| Metadata preservation | Codex `supportedReasoningEfforts`/`defaultReasoningEffort` survive into `ModelOption.reasoning`. |
| Picker | Footer renders only the selected model's enum options/default; unsupported/unknown show no-control/provider-default states. |
| Dispatch | Explicit unavailable model or unsupported enum effort is rejected before a streaming message; unknown metadata omits the wire parameter. |
| Gaps | OpenCode variants are not mapped; no dedicated EFF UI/axe tests; EFF-005/008–012 remain open. |
| EFF status | EFF-001–EFF-007/EFF-011 Done; EFF-008–EFF-010/EFF-012 open. |

## M3 MCP/Connect Apps/HIL benchmarks

Date: 2026-11-05. Compared Codex/OpenCode MCP surfaces, MCP 2026-07-28 transports/elicitation, Reason/Claude Desktop/OpenCode connection UX, and A Gent inventory.

| Record | Result |
| --- | --- |
| BEN-008 | Runtime-owned MCP execution/auth, A Gent records/scope, stdio/HTTP/OAuth, reload/teardown, capability snapshots, MCP-001–022 mapping. |
| BEN-009 | Connect Apps IA/add/auth/access/inspect/enable/disable/remove and catalog-honesty decisions. |
| BEN-010 | Correlated HIL approvals/questions/forms/URL, decline/timeout, sensitive values, concurrency, accessibility. |

Records: [BEN-008](../docs/benchmarks/BEN-008-mcp-runtime.md), [BEN-009](../docs/benchmarks/BEN-009-connect-apps-ux.md), [BEN-010](../docs/benchmarks/BEN-010-hil.md). MCP-002 runtime/protocol baseline is recorded in [mcp-runtime-baseline.md](../docs/mcp-runtime-baseline.md). MCP-001 app-record fields, MCP-003/MCP-004 scoped runtime inventory, MCP-005 managed app-record CRUD, MCP-009 OAuth handoff, MCP-015 capability discovery, and HIL-001/HIL-002 interaction routing/question answers are implemented; MCP-010/MCP-011/MCP-014 and HIL-003 remain Review items. No live OAuth connector or live HIL journey was exercised.

### MCP-003/MCP-004 inventory evidence

Date: 2026-11-05. `tests/server/app-inventory.test.ts` and `tests/server/backend.test.ts` verify:

- Codex discovery uses the selected conversation's provider thread; a scoped call returns thread-only inventory while an unscoped call does not reuse it.
- A later page failure returns the collected apps with `partial: true` and a redacted error instead of discarding earlier results.
- Aborting inventory rejects with a cancellation error and sends `$/cancelRequest`; the per-thread inventory promise is cleaned up.
- Inventory is bounded to 40 pages × 5 servers (200) and reports a partial result at the bound.
- Codex apps expose tool names, resource count, auth status, server version, transport, and errors while excluding tool schemas/private markers.
- OpenCode `mcp list` reports connected and needs-auth servers with provider-qualified IDs and omits an unknown tool count instead of reporting zero.
- `/api/apps` returns `{ apps, partial, error?, checkedAt }`; the Connect Apps UI shows a retry notice for partial inventory.

### MCP-015 capability discovery evidence

Date: 2026-11-05. `tests/server/app-inventory.test.ts` and `tests/server/backend.test.ts` verify:

- `/api/apps/:id/capabilities` returns tool names, titles, descriptions, input schemas, resources, resource templates, server info/capabilities, and tool-list meta from Codex `mcpServerStatus/list` with `detail: full`.
- Tool schemas are bounded to 50 KB each and 500 tools; truncation is explicit and the list summary never includes schema/private markers.
- A server with an empty catalog returns an empty tool list; a discovery error returns `partial: true` with no fabricated empty list.
- Discovery is fetched on demand, so schema changes are visible on the next inspection without a stale cache.
- OpenCode returns `supported: false` with recovery text instead of inventing tools/resources; unknown IDs return 404.
- The Connect Apps detail panel shows provider, transport, auth, tool/resource counts, version, prompt advertisement, schemas' field names, and truncation/error states.

### MCP-009/MCP-014 OAuth and reload evidence

Date: 2026-11-05. `tests/server/backend.test.ts` verifies with the Codex protocol fixture:

- `POST /api/apps/:id/auth` starts `mcpServer/oauth/login`, accepts optional scopes, returns the runtime's HTTP(S) authorization URL and login ID, and never returns tokens.
- `GET /api/apps/auth/:loginId` reports pending/success/failure after `mcpServer/oauthLogin/completed`; the failure fixture carries the runtime error text.
- OpenCode sign-in returns 409 with `opencode mcp auth` guidance instead of copying another app's tokens.
- `POST /api/apps/reload` invokes `config/mcpServer/reload`.
- Sign-in start/reload require host authority; the UI opens only the returned URL, shows waiting/success/failure, and offers an explicit retry.

Live OAuth completion, granted scopes, logout/revoke, duplicate callbacks, and in-flight reload isolation remain Review/MCP-022 gates.

### HIL-002/HIL-003 deterministic evidence

Date: 2026-11-05. `tests/server/hil.test.ts` and the `question`/`form` Codex fixtures in `tests/server/backend.test.ts` verify:

- question options are preserved and an answer outside the runtime schema is rejected with 400 while the request stays pending;
- the accepted answer reaches Codex and completes the run; a second answer returns 409;
- required form fields and numeric bounds are enforced before the runtime receives values;
- accepted forms and secret answers are stored as `{ redacted: true }`, not raw values;
- unsupported elicitation schemas decline with a visible recovery message.

`npm test` passes 62/62; typecheck and production build pass with the existing chunk-size advisory. The live HIL acceptance journey remains HIL-006.

## M2 shared provider lifecycle slice

Date: 2026-11-05. Scope: provider readiness states, capability typing, catalog normalization, model-ID limits, connected-only filtering, and API readiness guard. Provider-specific journeys are not included.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass. |
| `npm test` | 51/51 pass, including provider-contract and credential-store coverage. |
| `npm run build` | Pass; existing main-chunk size advisory remains. |
| Readiness | Legacy `connected` maps to `ready`; new states (`checking`, `needs-auth`, `ready`, `degraded`, `error`, `disabled`, etc.) are exposed; UI filters use `isProviderReady`. |
| Capabilities | Codex/OpenCode agent capabilities and HTTP/Ollama text-only capabilities are typed. |
| Catalog normalization | Empty/overlong IDs rejected, duplicates removed, blank names fall back to IDs, description/catalog bounds enforced. |
| Model identity | One 200-character limit used across discovery, connect, persistence, import, dispatch, and the model-ID form. |
| API guard | A non-ready provider is rejected with 409 before a streaming message is created; tests connect providers first. |
| Capability contract | Codex/OpenCode/Ollama/HTTP kinds carry typed chat/stream/tools/approvals/skills/attachments/reasoning/MCP/discovery/auth/cancellation fields; STT is separate. |
| Credentials | Session-only + macOS Keychain policy, provider refs, restore, clear/disconnect, and export exclusion implemented; Keychain not live-tested on this Windows host. |
| Inference test | `POST /api/providers/:id/test` requires `confirm:true`, sends one live minimal turn, returns latency/network/cost intent, and sets `verifiedBy: inference` on success. |
| Endpoint policy | Local Ollama loopback allowed; private/metadata hosts, remote HTTP, redirects, and credential-bearing URLs rejected; tests cover policy. |
| Selection scope | Chat-level provider/model/effort overrides persist, runs use them, failed saves roll back, and other chats/agents remain unchanged. |
| PVD status | PVD-001–PVD-016 Done; PVD-017 remains. |

Record: [provider lifecycle](provider-lifecycle.md). Code: `shared/providers.ts`, `server/providers.ts`, `server/store.ts`, `server/runs.ts`, `server/index.ts`, UI filters. Tests: `tests/server/provider-contract.test.ts`, `tests/server/backend.test.ts`, `tests/server/model-options.test.ts`.

## M2 real provider smoke

Date: 2026-11-05. Scope: authorized live inference through the A Gent host and local provider runtimes. This is a smoke check, not full PVD-017 journey acceptance.

| Provider | Evidence | Result |
| --- | --- | --- |
| Codex | `codex login status`: `Logged in using ChatGPT`; host connect returned 8 models; agent/chat used `gpt-6.1-sol` with `medium` effort | `completed`, response `OK` |
| OpenCode | `opencode auth list`: stored OpenAI/OpenCode Console credentials; host connect returned 26 models; agent/chat used `opencode-go/deepseek-v4.1-flash` | `completed`, response text returned |
| OpenCode alternate models | `openai/gpt-5.5` failed with “not supported when using Codex with a ChatGPT account”; `opencode/deepseek-v4.1-flash` failed with “Insufficient account funds” | Failed; model/account-dependent |
| Ollama | `ollama` not installed | Not exercised |
| Cloud / Gemini / Antigravity | No endpoint/API keys configured | Not exercised |

The smoke used a temporary A Gent host with the real Codex/OpenCode CLIs and an isolated data directory. No credentials were written into the repo or exported.

Additional Codex work/restart check: with `gpt-6.1-sol` in Work mode, Codex wrote `approval.txt` containing `hello` inside a temporary workspace. The host was stopped, restarted with the same data directory, the provider was rechecked, and the same conversation/thread appended `world` (`helloworld`). No approval prompt was raised because the workspace-write sandbox allowed the file change. Full CDX-006/OPC-006 still require an explicitly approved change, Stop, and edit/remove journeys; PVD-017 now covers Codex/OpenCode only.

## D-02 provider-scope amendment

Date: 2026-11-05. The owner deferred OpenAI-compatible/Cloud, Antigravity/Gemini, and Ollama to the distant future. R1 now advertises **Codex and OpenCode only**.

| Change | Result |
| --- | --- |
| Release contract | D-02 amended; deferred providers removed from R1 support summary/exclusions updated. |
| Task targets | 14 provider delivery tasks (HTTP/OLL/GEM) and 3 benchmarks (BEN-005/006/007) moved from R1 to R2. |
| Counts | 191 R1, 28 R2, 16 paused-platform, 2 optional (total 237). |
| Provider board | Deferred sections marked “not R1”; PVD-017 depends on Codex/OpenCode journeys only. |
| Support matrix | HTTP/Cloud, Antigravity/Gemini, and Ollama marked deferred/not R1. |
| Documentation links / diff | Checked after the amendment. |

## Public repository publication preflight

Date: 2026-11-05. Prepared the complete pending UI, avatar, model-picker, documentation, and roadmap changes for the [public source repository](https://github.com/danialshirali16/a-gent), on publication branch `codex/publish-project` based on `892d5b5`. This publishes the development source; the public application-release gates in the roadmap remain open.

The first full UI run exposed two defects. Popover focus attempted to enter a visibility-hidden surface; positioning now uses opacity/pointer gating so initial focus works. A late message POST response could overwrite a newer waiting/approval event; HTTP responses now seed missing runs and preserve existing stream snapshots. The approval smoke check deliberately holds the POST response until the live approval arrives, then verifies that releasing it preserves the actionable approval.

| Check | Result |
| --- | --- |
| Node 24 `npm run typecheck` | Pass after the corrections |
| `npm test` | 17 backend/model-option tests pass |
| `npm run build` | Pass; existing bundle-size advisory remains |
| Combined Playwright smoke / visual / accessibility / E2E | 42 pass: 18 smoke, 10 visual, 7 axe, 7 E2E |
| Credential-pattern scan | No matches in the 392 candidate files or 309 unique historical blobs checked; runtime state, local credentials, dependencies, and generated packages remain ignored |
| Staged whitespace and documentation links | Checked before publication; formatting-only whitespace corrections included |

The earlier baseline GitHub Actions run at `892d5b5` failed on the Windows path assertion, Android environment setup, and the approval E2E path; its macOS package job was cancelled by matrix fail-fast. Those results are separate from the local corrected-tree results above and from any later PR checks. Windows/Android remain paused; the CI-scope task QA-010 is still open.

No new real-provider/MCP/OAuth/transcription journey or signed installer verification is implied. The seven [catalog findings](model-options-stress-test.md), broader [integration gaps](integration-review.md), requested speech/skills/reasoning features, and first public application release remain tracked work.

## Roadmap scope additions and benchmark gates

Date: 2026-11-05. Expanded [the master roadmap](project-roadmap.md) with [ElevenLabs Speech-to-Text](roadmaps/speech-to-text.md), [model-specific reasoning](roadmaps/reasoning-effort.md), [Agent skills](roadmaps/skills.md), and [scope benchmark prerequisites](roadmaps/benchmarking.md). Updated release scope/decisions, milestones, sequencing, QA/package dependencies, current-state, integration/UI notes, and documentation indexes.

The additions comprise 50 feature tasks and 25 benchmark tasks. All delivery sections now require an accepted comparison and design decisions before Ready or development. Benchmark records and feature implementation remain To do; checking official upstream references does not complete peer comparisons.

| Documentation check | Result |
| --- | --- |
| Task registry | 237 unique tasks with seven-column target/priority/status/owner/dependency/acceptance metadata |
| Targets / status | 208 R1, 11 R2, 16 paused-platform, 2 optional; all 237 To do |
| Benchmark coverage | All 212 delivery tasks have the correct BEN dependency; 25 delivery sections have 25 matching development gates |
| Dependency graph | All IDs resolve; no cycles; no R1 dependency on R2/paused/optional work; speech/skills/reasoning gates feed candidate signoff |
| Local links, Markdown anchors, and image/file targets | 382 resolve across 30 Markdown files |
| `git diff --check` | Pass |

This was a roadmap/documentation update. Production code was unchanged by this pass. No microphone capture, ElevenLabs API request, skill import/execution, new live-model/MCP/OAuth journey, runtime test-suite run, package rebuild, or publication occurred. Earlier runtime/package evidence keeps its original scope.

## Completion and release roadmap review — before scope additions

Date: 2026-11-05. Reviewed current provider/MCP/app/core source, API routes/types, test definitions, package/CI configuration, and linked official upstream references. Recorded gaps in [integration-review.md](integration-review.md), expanded [the master roadmap](project-roadmap.md), and created [five task boards](roadmaps/README.md) with 162 tasks and acceptance/dependency/owner metadata.

This was a planning/source-review pass. No new account login, model request, MCP connection, live OAuth flow, runtime test-suite run, package rebuild, or publication occurred. Earlier successful tests and screenshots remain evidence only for their original scope.

| Documentation check | Result |
| --- | --- |
| Local links, Markdown anchors, and image/file targets | 283 resolve across 24 Markdown files |
| Task registry | 162 unique tasks; each has target, priority, status, suggested role, dependencies, and acceptance criteria |
| Dependency graph | All dependencies resolve; no cycles; R1 tasks have no dependency on deferred/paused tasks |
| Targets | 136 R1, 10 R2, 14 paused-platform, 2 optional-scope tasks |
| Status | All new tasks start To do; partial source is described in the integration review rather than counted as completed acceptance |
| `git diff --check` | Pass |

## Documentation organization

Date: 2026-11-05. Added a documentation index and screenshot index, shortened the active project roadmap, preserved its earlier phases in the archive, updated current-state and UI/component continuation, and linked the adversarial catalog findings from the earlier normal-fixture review.

| Check | Result |
| --- | --- |
| Local Markdown links, anchors, and image targets | 212 checked across 16 Markdown files; all resolve |
| `git diff --check` | Pass |
| Source status versus historical evidence | Earlier full-suite/package results labeled by scope; seven model catalog findings and three earlier backend findings remain tracked |
| Artifact checksums / full suites / installers | Not recomputed or rerun for the documentation update |

## modelOptions stress test

Date: 2026-11-05. Added a development-only catalog harness using the existing Composer/ModelPicker and real `connectedModelGroups` helper. No production selection code or styles were corrected in this audit. See [the seven findings and proposed fixes](model-options-stress-test.md).

| Check | Result |
| --- | --- |
| `npm run typecheck` with Node 24 | Pass with the fixture harness |
| `node_modules/.bin/tsx --test --test-force-exit tests/server/model-options.test.ts` | Existing 3/3 tests pass; they do not cover the newly reproduced failures |
| `npm run build` with Node 24 | Pass; stress-harness markers absent from all four production JS/CSS assets. Existing main-chunk size advisory remains |
| Data states | Demo, Worst case, Empty, One choice, 1,000 models, Invalid IDs; settings persist in URL |
| Layout coverage | Dark at 961×804, 320×640, 2560×1440; light at 961px and worst at 320px; Demo/Worst captures saved at all three widths |
| Long/multilingual data | Long repository-shaped ID wraps without horizontal overflow at 320px; Farsi/Vietnamese/CJK/emoji render; literal angle brackets remain text |
| Empty/huge collections | Empty recovery works; one default remains for an empty connected catalog; End reaches the last of 1,000 model records; footer remains visible |
| Invalid/ambiguous data | Empty/repeated IDs produce duplicate selection; blank labels produce unnamed rows; duplicate display names remain indistinguishable |
| Search/copy | Canonical Unicode mismatch, retained scroll after filtering, and singular/raw-count copy issues reproduced |
| Focused axe, worst catalog | Critical `button-name` violation for blank names; color-contrast incomplete on clipped scrollable content. Earlier zero-violation scans apply to their ordinary fixtures |
| Root text / RTL | At 320px, RTL and root font 32px fit; model labels remain explicitly sized at 14px. This does not establish actual browser-zoom coverage |
| Full suites, actual 200% zoom, native screen reader, performance profiling, installers | Not rerun for this audit |

Evidence: [stress-test report](model-options-stress-test.md), [screenshot index](screenshots/README.md), [DOM observations](screenshots/model-options/observations.json). Development URL: `/?component=composer&stress=model-options&data=worst`.

## Model picker refinement

Date: 2026-11-05. The final picker follows the supplied provider-rail reference, with model descriptions and media/reasoning badges omitted. These focused results supersede the older picker behavior described in the original component pass. Commands used Node 24 from `/opt/homebrew/opt/node@24/bin`.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `node_modules/.bin/tsx --test --test-force-exit tests/server/model-options.test.ts` | 3/3 pass: strict connected filtering, search without descriptions, default for an empty connected catalog |
| `npm run build` | Pass; existing Vite advisory for the main chunk over 500 kB remains |
| Connected-only data | One-connection fixture and real app show only Codex; two-connection fixture exposes Ollama only while connected; disconnected cached models are excluded |
| Reference layout | Provider icon rail, search, model-name rows, selected check, and Thinking footer; no descriptions or capability badges |
| Selection | Model choice and Light/Balanced/Deep changes keep the picker open; browsing another provider alone leaves selection unchanged; selecting Ollama updates the trigger and explains unavailable Thinking |
| Keyboard | ArrowDown/Right enter model rows, Home/End navigate and scroll a 42-option catalog, Escape clears search then closes, and closing returns focus to the trigger |
| Scrolling | Wheel scroll moved the long model list by 350px without closing; Thinking stayed visible |
| Recovery | No-match state offers Clear search; no-connections state focuses Connect a provider; Manage connections opens the real Connections dialog |
| Focused axe scans | 0 violations and 0 incomplete checks for desktop dark app, desktop light preview, mobile app, no connections, and no matches (WCAG 2 A/AA, 2.1 AA, 2.2 AA tags) |
| Narrow and reflow | 320×640 app fits with 44px controls and 16px search; 480×402 reflow proxy fits without horizontal overflow; model list yields space to the footer |
| Long names / RTL / reduced motion | At 320px, multilingual names wrap without overflow, keyboard End reaches Research model 40, footer remains visible, and popup animation is `none` with reduced motion emulated |
| Short preview caveat | The constrained 320px component preview has clipped, scrollable model rows: axe reports an incomplete color-contrast check, with 0 violations. The full mobile app scan has 0 incomplete checks |
| Full automated UI/backend suites / native screen reader / actual 200% zoom / packaged installers | Not rerun for this refinement; older results below predate it. The 480×402 check is a reflow proxy, not browser zoom |

Screenshots: [dark app](screenshots/model-picker-dark.jpg), [light preview](screenshots/model-picker-light.jpg), [mobile app](screenshots/model-picker-mobile.jpg), [no connections](screenshots/model-picker-empty.jpg). The live preview uses the isolated QA workspace at `http://127.0.0.1:4492/`. See [the consolidated interface review](model-picker-review.md).

## Component-by-component pass

The 18-component pass is complete. Field, Select/Combobox, Checkbox/Switch, Tabs/Segmented, Tooltip, Menu/Context menu, Popover, Dialog/Confirmation, Badge/Status, Avatar/Agent mark, Alert/Toast, Card/List row, Search, Composer/Attachment, Message/Tool activity, and Sidebar/Rail are implemented, integrated, and linked from the development preview navigation.

The Search field was reviewed and corrected after the first completion pass: single focus treatment, visible Connections field, ArrowDown/Up handoff into results, a larger clear target, a named search landmark, and correct results spacing. See [Search field review](search-component.md).

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 17/17 backend tests pass |
| `npm run build` | Pass |
| `npm run test:ui` | 18/18 Playwright smoke tests pass |
| `npm run test:visual` | 10/10 visual baselines pass (5 widths × 2 themes) |
| `npm run test:a11y` | 7/7 axe scans pass; 0 violations |
| `npm run test:e2e` | 7/7 macOS E2E workflows pass |
| `npm run desktop:mac` | Pass; DMG/ZIP rebuilt |
| Packaged JS/CSS | Packaged asset hashes match `dist`; preview code is excluded |
| Packaged macOS app | Launched; agent-desktop snapshot and screenshot show the new sidebar, bot avatars, composer, and workspace menus |
| Search preview axe | 0 violations |
| All component previews axe | 36 scans (18 families × light/dark), 0 serious or critical violations |
| Search keyboard | ArrowDown from the field focuses the first result; ArrowUp focuses the last; clear empties and restores field focus |
| Search sizing | Desktop field 34px, clear 26px; mobile field 44px, text 16px, clear 40px, result row 56px |
| Responsive | Component previews checked at 1440×900 (light/dark) and 390×844 (selected families); no horizontal overflow |
| Reduced motion | Entry animations and status pulses stop; live canvas avatars switch to the stopped static state |
| Manual screen reader / large workspace / Windows / Android | Not rerun; see below |

Component screenshots are in `docs/screenshots/components/`; integration references are in `docs/screenshots/integration/`. The packaged app references are [packaged-component-pass.png](screenshots/packaged-component-pass.png) and [packaged-bot-avatars.png](screenshots/packaged-bot-avatars.png).

Axe coverage now includes home in dark/light, Settings, Connections, the side panel, the agent avatar picker, and mobile home with zero violations. The only remaining automated-suite gap is the manual screen-reader audit and the large-workspace performance check.

## Bot avatar replacement

Date: 2026-11-05. `bot-avatars@0.2.2` is pinned exactly in `package.json` and `package-lock.json`. The packaged MIT notice for `bot-avatars@0.2.2` appears in `dist/THIRD_PARTY_NOTICES.txt`.

Every agent, including primary A Gent, now renders a glossy plastic bot with eyes-only faces, the agent color, `brightness={1}`, `saturation={1}`, and no accessories. `AgentMark` remains product branding only. The renderer is one lazy chunk with a fixed-size SVG fallback; activity follows the latest run, and reduced-motion changes are applied live to the canvas.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 17/17 pass; includes avatar mapping, activity, validation, persistence, and import/export coverage |
| `npm run test:ui` | 18/18 pass; includes reduced-motion switching |
| `npm run test:a11y` | 7/7 pass; agent avatar picker added, 0 violations in both themes |
| `npm run test:e2e` | 7/7 pass; includes shape selection, reload persistence, and Cancel discarding |
| `npm run test:visual` | 10/10 pass; home baselines refreshed for bot avatars |
| Legacy mapping | spark → star, code → mech, design → flower, search → clover, custom → droid; explicit saved shapes win |
| Activity | Live fake-provider run switched the A Gent sidebar avatar to working and back to idle at completion; helper tests cover waiting, completed, failed, interrupted, and archived sleeping |
| Data safety | Unsupported API shape → 400; unsupported stored/imported shape stripped; import cannot inherit the primary template shape; export/import and restart preserve valid shapes |
| Picker keyboard | Arrow keys move the native radios; Done, Enter, and Escape close and restore trigger focus without submitting or closing the agent dialog; Cancel discards |
| Pointer and click | Moving the pointer across a full-motion avatar changes its head/body orientation; clicking triggers the library's jump/flip reaction |
| Parent actions | Clicking a sidebar avatar still activates the agent row; clicking the top-pill avatar still opens the side panel |
| Picker layout | Six columns on desktop, three at 390px/coarse pointers; 240px scroll cap; fixed Done footer |
| Fallback | Blocking the renderer leaves 0 canvases and 7 fixed-size SVG fallbacks with no layout shift; the fallback unmounts once the canvas reaches full opacity |
| Reduced motion | Live change verified full → static → full with no reload |
| 500-agent stress roster | 500 fallback wrappers; 12 canvases mounted initially, 24 after scrolling to the end; offscreen avatars defer initialization |
| Responsive and themes | 1440/1280/1024/768/390 widths, light and dark; no clipping or overflow around the header pill |
| Engine output | Renderer chunk 131.42 kB (53.80 kB gzip). Current tree versus the previous package: initial main +11.15 kB raw/+3.43 kB gzip and CSS +5.50 kB raw/+0.78 kB gzip; totals include unrelated in-progress component work |
| Packaged macOS app | Rebuilt; resources match `dist`; launch and avatar surfaces verified |
| Windows / Android | Not rebuilt or runtime-tested in this macOS-only pass |

Screenshots: [avatar preview dark](screenshots/components/avatar-dark.png), [avatar preview light](screenshots/components/avatar-light.png), [preview mobile](screenshots/components/avatar-mobile.png), [500-agent roster](screenshots/components/avatar-stress-dark.png), [app](screenshots/integration/avatars-app.png), [rail](screenshots/integration/avatars-rail.png), [agent dialog](screenshots/integration/avatars-agent-dialog.png), [picker desktop](screenshots/integration/avatars-picker-desktop.png), [picker mobile](screenshots/integration/avatars-picker-mobile.png), [side panel](screenshots/integration/avatars-side-panel.png), [sessions](screenshots/integration/avatars-sessions.png), [fallback](screenshots/integration/avatars-fallback.png), [search](screenshots/integration/avatars-search-dialog.png), [schedules list](screenshots/integration/avatars-schedules-list.png), [schedule dialog](screenshots/integration/avatars-schedule-dialog.png), [mobile](screenshots/integration/avatars-mobile.png).

## Input and Textarea component pass

Shared controls now serve 15 fields across forms and provider/device settings. The development preview at `/?component=input` is linked to the Button preview; both are excluded from production.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| Production build | Pass |
| `npm run desktop:mac` | Pass; DMG/ZIP rebuilt; packaged JS/CSS match `dist` |
| Packaged Mac app | Launch, updated agent form, and Cancel verified through Computer Use |
| Editing and accessibility semantics | Keyboard order, disabled skipping, read-only values, password masking, error association/ref focus, multiline editing, and Input Enter submission verified |
| Integration | Agent form accepts multiline English/Persian text; Cancel creates no agent; device field and native scheduled date input checked |
| Enabled text/placeholder contrast | Preview minimum 4.97:1 light, 5.04:1 dark |
| Responsive preview | 1280px and 390px; no horizontal overflow; touch fields 44px high with 16px text |
| Automated UI / axe / E2E | Not rerun for this pass |

See [Input and Textarea notes](input-component.md) and the [component checklist](component-roadmap.md).

## Earlier Button component pass

The Button pass adds shared action variants, sizes, icon slots, native button/submit behavior, keyboard focus, and loading states. Its isolated preview is available in development at `/?component=button` and is excluded from production.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| Production build | Pass |
| `npm run desktop:mac` | Pass; DMG/ZIP rebuilt and packaged JS/CSS match the production build |
| Packaged Mac startup | Local host and app window available |
| Computer Use | Keyboard activation and focus, disabled controls, stable loading width, form Cancel/Enter submission, and fake-provider connection verified |
| Enabled text contrast | Default/hover/pressed checked in both themes; minimum 4.91:1 |
| Reduced motion | Loading glyph reports no animation |
| Responsive preview | 1280px and 390px widths; no page overflow |
| Automated UI / axe / E2E | Not rerun for this pass |

See [Button component notes](button-component.md) for the API and screenshots.

## Earlier UI refinement

This section applies to the working-tree UI refinement against the installed Reason app. The earlier automated results below predate these changes.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 12/12 pass |
| `npm run build` | Pass |
| `npm run desktop:mac` | Pass; DMG and ZIP rebuilt |
| Packaged Mac app | Launch and updated navigation verified with Computer Use |
| Browser interaction checks | Chat streaming, agent message preview, group creation/assignment, settings theme/model sections, Escape and focus restoration verified |
| Responsive visual review | Light/dark at 1440×900, 1280×800, 1024×768, 768×1024, and 390×844; no page overflow |
| Visual references | Ten PNG baselines refreshed through Computer Use in Chrome at device scale 1 and reduced motion |
| Automated UI / visual comparison / axe / E2E | Not rerun for this refinement; the historical pass counts below are not current results |
| Windows / Android | Not rebuilt; existing macOS-only scope retained |

Previews: [Mac app](screenshots/reason-ui-mac.jpg), [Settings](screenshots/reason-ui-settings.png).

## Earlier automated baseline

These results describe the implementation before the current UI refinement.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 12/12 pass |
| `npm run test:ui` | 17/17 Playwright smoke tests pass |
| `npm run test:visual` | 10/10 Playwright screenshot baselines pass |
| `npm run test:a11y` | 6/6 axe scans pass; 0 violations |
| `npm run test:e2e` | 6/6 macOS E2E workflows pass |
| `npm run build` | Pass |
| `npm run desktop:mac` | Pass |
| `npm run desktop:win` | Not rerun; macOS-only scope |
| `npm run android:apk` | Not rerun; macOS-only scope |
| Packaged macOS app launch | Pass |
| Real Codex account/model discovery | Pass |
| macOS hidden title bar + traffic lights | Pass |
| Compact sidebar rail | Pass |
| Desktop and mobile UI smoke checks | Pass |

## Artifacts

Recorded artifact snapshot from the earlier packaging pass. These checksums were not recomputed during the catalog audit or documentation update, and do not describe a package containing the latest picker changes.

Windows and Android artifacts below are from the previous cross-platform build. They were not rebuilt or tested in this macOS-only pass.

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `A-Gent-0.1.0-mac-arm64.dmg` | 123 MB | `0b200d3d8d89ef14d03eeb261df2c2abc1c36dae67054817cde7ce6a4629b97b` |
| `A-Gent-0.1.0-mac-arm64.zip` | 120 MB | `4e9266079ca720be9b493c0d725cd548e8acebba1c29dbeb4e310ed8b0162f08` |
| `A-Gent-Setup-0.1.0-x64.exe` | 120 MB | `4ef4c19e8b9437c246b42a436ab95ad73a65105c432105ead2241f750914df92` |
| `A-Gent-Portable-0.1.0-x64.exe` | 108 MB | `f65ba83b3719106ac8984ddb4bef1c3b6ad4c8806534d63ca3c566477e8f8ba7` |
| `A-Gent-0.1.0-android-debug.apk` | 4.3 MB | `e3d476344f8ba3492657bec03b0626dce11aee4c5a24d99047fad45e240cac2c` |

## Platform details

### macOS

- App bundle: `release/mac-arm64/A Gent.app`
- `codesign -dv`: ad-hoc signature, `Identifier=Electron`, no Team ID.
- `spctl`: accepted on this host only because security overrides are disabled.
- Not notarized.
- arm64 only.

### Windows

- Cross-built from macOS with electron-builder.
- Installer: NSIS, x64.
- Portable: x64.
- Unsigned.
- Icon and version metadata are applied.
- electron-builder reported:
  - `file signing skipped via signExecutable configuration`
  - The executable contains version `0.1.0.0`.
- Not runtime-tested; no Windows runtime or Wine is available on this host.

### Android

- APK package: `com.agent.mobile`
- Version: `0.1.0` (`versionCode 1`)
- minSdk: 24
- targetSdk: 36
- Permissions: `INTERNET` only
- Signer: `CN=Android Debug`
- Companion client; requires an A Gent host over HTTPS.
- Not device-tested; no Android device or emulator is available on this host.

## Verified behavior

- Backend auth rejects unauthenticated API calls.
- Host and origin allowlists reject hostile requests.
- SSE streams state, providers, runs, and deltas.
- Codex adapter lifecycle, approvals, interruption, and stale-event handling.
- Scheduled task runs once.
- Import/export excludes credentials and provider thread IDs.
- HTTP provider streams text and does not persist API keys.
- Codex discovery handles macOS PATH and Windows npm layouts.
- Packaged macOS app starts its local host and serves the UI.
- Real Codex discovery returns the signed-in account and models.
- Reason-style shell, chat bubbles, composer, settings/connections modals, side panel, and compact rail render correctly in smoke checks.
- Android back handler: the `agent:back` event closes an open settings dialog in the browser harness. Device behavior is still unverified.
- Playwright smoke tests cover the shell, compact rail, settings modal, connections modal, fake-Codex chat streaming, mobile drawer, administrator device-token creation/rotation, current-device self-rotation, side-panel approval completion, the agent-group create/assign/rename/delete flow, and Files/Terminal side-panel browsing.
- Visual baselines cover the home screen at 1440×900, 1280×800, 1024×768, 768×1024, and 390×844 in light and dark themes.
- Baselines were generated on macOS arm64 with Chrome. The `visual` CI job runs on `macos-latest`.
- Workspace data lock rejects a second host using the same data directory.
- Desktop pairing cookie gates token injection; the packaged macOS app loads the workspace through that cookie.
- Legacy desktop cookies migrate to a hashed per-device token and are replaced by the server.
- Per-device tokens can be created, rotated, and revoked; only SHA-256 hashes are stored in `devices.json`.
- Settings → Devices creates tokens for an administrator session and rotates or revokes the current device.
- Packaged macOS app verified with Computer Use: the current device rotated its token, revoked it, and returned to the connection screen.
- Side panel Approvals tab completes a waiting run.
- Agent groups support creation, assignment, rename, delete, and legacy workspaces without groups.
- Files tab provides a read-only workspace tree; path traversal and symlink escapes are rejected.
- Terminal tab shows read-only activity detail from the current or latest run.
- Packaged macOS app verified with Computer Use: Files tab browsed `README.md` and `src/index.ts`; Terminal tab showed its read-only empty state.
- Keyboard navigation covers sidebar and group menus, the composer add menu, model picker, dialog Escape/focus trap, and side-panel tabs.
- Axe scans cover home in light/dark, Settings, Connections, the side panel, the agent avatar picker, and mobile home with 0 violations.
- E2E matrix covers agent create/customize, avatar shape save/reload/cancel, chat approval completion, Terminal activity, Files browsing, schedule creation, workspace export/import, device token lifecycle, and keyboard flows.
- Every agent uses `bot-avatars@0.2.2` glossy plastic bots; `Avatar.avatarType` persists through save, restart, and export/import, while legacy icons resolve independently and unsupported shapes fall back safely.
- Avatar picker keyboard behavior: Enter/Escape/Done close and restore trigger focus without submitting or closing the agent dialog; Cancel discards the draft.
- Live run activity changed the A Gent sidebar avatar from idle to working and back to idle when the run completed; waiting runs use the default pose.
- Full-motion avatars follow the pointer, react to clicks, and still pass avatar clicks through to their parent sidebar rows and the top-pill side-panel toggle.
- Live reduced-motion changes pause and resume canvas motion; blocking the renderer leaves the fixed-size SVG fallback with no layout shift, and the fallback unmounts after the canvas fades in.
- The 500-agent stress roster mounts 12 canvases initially and 24 after scrolling to the end.
- The avatar renderer ships as one lazy 131.42 kB chunk (53.80 kB gzip). The current tree's initial main bundle is 11.15 kB raw/3.43 kB gzip larger and CSS 5.50 kB/0.78 kB gzip larger than the previous package; those totals also include unrelated in-progress component work.
- `dist/THIRD_PARTY_NOTICES.txt` includes the MIT license for `bot-avatars@0.2.2`.
- The light-theme faint text token was darkened to meet WCAG AA contrast.
- UI text now uses Inter Variable. Only the Latin variable subset is bundled (48 KB instead of ~218 KB for all Inter subsets), and visual baselines were regenerated.
- A smoke test asserts exactly one Inter Latin WOFF2 resource loads and that it is under 60 KB.
- Provider catalog includes OpenCode, Cloud, and Antigravity. OpenCode uses the local CLI and its sign-in; Cloud and Antigravity use OpenAI-compatible endpoints.
- Packaged macOS app verified with Computer Use: OpenCode connected through the installed CLI and reported 31 models.
- `⌘ \` toggles the side panel; dialog focus returns to the opening control after Escape.
- Packaged macOS app verified with Computer Use: Escape closed Settings and restored focus, Right Arrow moved the side-panel tab from Session to Sessions, and Down Arrow moved workspace-menu focus from All agents to Scheduled.
- Packaged macOS app verified with Computer Use: created a `Product` agent group and assigned Product Designer; the sidebar nested the agent under the group.
- Packaged macOS app migrated its legacy cookie to a device token; after that device was revoked, the next launch created a fresh device and loaded the workspace.
- Local browser token injection is opt-in via `AGENT_ALLOW_LOCAL_TOKEN_INJECTION=1`.
- Corrupt `state.json` recovers from `state.json.bak`.
- CSP now sets `default-src 'self'` and blocks remote images.
- File-change approvals include the available patch/diff text.

## Not verified

- Windows installer/portable on real Windows (out of scope for this macOS-only pass).
- Windows icon rendering on a Windows desktop.
- Android APK on a real device or emulator (out of scope for this macOS-only pass).
- Android HTTPS pairing, back button, token persistence, safe areas.
- macOS Gatekeeper on a clean Mac.
- macOS notarization.
- Windows code signing.
- Android release signing.
- Manual VoiceOver and reduced-motion audit.
- Universal/Intel macOS build.
- Large-workspace/SSE performance check.
- Current candidate CI acceptance (a historical baseline GitHub run failed, as recorded above; no current CI acceptance is implied).

## Known issues

- Catalog findings have mixed current status; see [current picker assessment](model-options-stress-test.md#current-status-after-provider-changes).
- Earlier backend fixture closures and newly reproduced lifecycle gaps are distinguished in [current state](current-state-review.md#earlier-backend-findings).
- macOS app is ad-hoc signed and not notarized.
- Windows artifacts are unsigned and were not rebuilt after the macOS-only changes.
- Android APK is debug-signed, companion-only, and was not rebuilt after the macOS-only changes.
- Local browser token injection remains opt-in; use HTTPS and a dedicated device token for remote access.
- Very large exports can still exceed the 32 MB import limit.
- Remote Markdown images are blocked by CSP until an image policy is chosen.

See `docs/project-roadmap.md` for the remaining work and `docs/ui-roadmap.md` for the UI-specific plan.
