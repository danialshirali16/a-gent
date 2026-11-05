# Personal macOS v1.0 setup and test guide

Status: **Acceptance procedure, 2026-11-05; source checks and real Codex probes pass, but a current Mac candidate has not been built or accepted.** Follow the [roadmap](project-roadmap.md#recommended-execution-order), [release contract](release-contract.md), and [support matrix](support-matrix.md). [Current state](current-state-review.md) and [validation](validation.md#personal-v1-implementation-pass-2026-11-05) distinguish source/browser/real-runtime evidence from the required Mac package pass.

## Before building

1. Confirm Danial's Mac chip and macOS version before building or accepting the package. Existing configuration targets arm64/macOS 13+; Intel support is not implied. This remains the one unconfirmed environment detail.
2. Use the identified checkout and Node 24.x for the candidate build. Keep the lockfile; complete `npm ci` on a host with npm and Electron download access.
3. Make Electron runtime installation explicit with `npm run desktop:runtime` if the install policy has skipped it. Install Chrome for Playwright with `npx playwright install chrome`; Linux verification hosts may need its OS dependencies too.
4. Install/sign into the supported Codex CLI independently; the verified baseline is 0.166.x (0.166.0 recorded). Existing external login is sufficient. Never copy account tokens into A Gent. The source gate rejects prerelease or different-minor CLIs with actionable guidance. GUI PATH and actual runtime/schema compatibility must still pass CDX-001 on the Mac.
5. Use disposable project/test workspace data for failure injection; identify the exact source/runtime/host in validation.

## Required build and source verification

Run from the checkout. These are required checks, not results of this documentation update.

    npm ci
    npm run typecheck
    npm test
    npm run build
    npm run test:ui
    npm run test:visual
    npm run test:a11y
    npm run test:e2e
    npm run desktop:runtime
    npm run desktop:mac

Use supported runtime-baseline probing and recorded compatibility evidence. Standard npm commands must execute; a supplemental runner alone cannot accept the candidate. Review screenshot changes rather than automatically accepting new baselines. Mac visual baselines cannot be certified by Linux/Windows screenshots.

Current source evidence from the Windows x64 development host (not a Mac acceptance result): `npm ci` succeeded; typecheck and build pass; 73/73 server tests, 22/22 browser smoke, 7/7 E2E, and 7/7 axe scans pass. The checked-in visual baselines are macOS-only and were not rerun. Real Codex chat/continuation/host-restart/Stop/Work/approval probes passed against the signed-in CLI with an isolated workspace; native question, Finder, native folder dialog, VoiceOver/zoom, and the packaged Mac app remain required.

Build configuration emits arm64 A Gent.app plus DMG/ZIP under `release` with version 1.0.0 and macOS 13.0 minimum. Record actual paths and hashes rather than assuming old artifact names. Signing/notarization is deferred for this personal candidate.

## Install and first run

1. Install the identified A Gent.app in Applications and launch it through Finder.
2. Confirm the local host starts on loopback and the desktop pairs automatically. A user should not need to find/copy the administrator token to use the ordinary desktop.
3. Verify missing CLI, unsupported version, and signed-out guidance. After installation/login, Check connection must recover without a stale success state.
4. Select an available Codex model and send a short message. Check streamed output and a second turn. A second concurrent chat should be rejected clearly; only one run is allowed per host.
5. Confirm deferred providers, custom effort, connectors, speech, skills, uploads/scheduling expansion, and remote-host setup are not represented as supported launch paths. Connections should list only Codex; Connected Apps management and Devices remote-token creation should not be advertised. Existing data is preserved.
6. Close and relaunch the app; confirm conversations and unsent drafts are still present and the same chat continues on its provider thread.

## Chat, project, approval, and recovery pass

| Scenario | Expected result |
| --- | --- |
| Two chats, used sequentially | Correct model/history in each; unsent drafts survive navigation and restart. A second concurrent run is rejected clearly by UI/API; only one run is allowed per host. |
| Restart/continue | Sent messages/completed replies and correct runtime bindings survive; continuation appends to the intended chat. Real source evidence used `OK` then `DONE` on the same thread. |
| Native folder selection | Choose/cancel/invalid/unavailable path behaves correctly; the selected host folder is clear. The packaged source uses the macOS dialog rather than a browser prompt; verify it on the candidate. |
| Chat mode | Inspect/read context without modifying the selected project. The real source probe refused a file write and created no file. |
| Work mode | Create a small requested file in a disposable folder under Codex's sandbox. Real source wrote `hello` inside the selected workspace. A permitted write alone does not prove approval handling. |
| Genuine approval | Use the candidate's recorded, reproducible Codex permission-request scenario. Deny once and verify no denied action occurs; approve a new request and verify only that action occurs. Real source evidence: elevated outside-workspace write declined → no file; repeated request accepted → only the requested `hello` file, then temp cleanup. |
| Native question | Answer actual supported question options/text; decline/cancel does not fabricate an answer. Fixture coverage exists; the live Codex question path was not reachable in retained Chat/Work mode and remains a candidate check. |
| Stop | Stop a controlled long run. UI remains truthful while stopping, actual effects/processes end, and only then can another run start. Real source returned `stopping`, rejected an early send with 409, settled `interrupted`, then accepted `AFTER`. |
| Runtime exit / offline / sleep-wake | Bounded visible error; resync without duplicated deltas or external work; working retry/recheck and preserved draft. |
| Quit/restart with work or pending approval | Run becomes interrupted and abandoned requests expire; no indefinite busy state or replayed side effect. |
| First-save failure | Controlled injection rejects cleanly, preserves user intent, and does not leave a phantom reserved chat. |
| Forget during probe | Late catalog/account results do not reconnect a forgotten provider. |
| Data/import failure | Corrupt primary can use its valid backup; invalid/failed imports do not partially merge. Test with isolated copies. |
| Keyboard/accessibility | Navigate model/setup/project/approval controls; restore focus after overlays; run axe and essential VoiceOver/actual zoom checks. |

The release documentation must supply the concrete permission scenario that passed V1-06, not claim that an arbitrary file write always raises a prompt. Native checks and actual packaged checks are recorded separately from fixtures.

## Data location and backup

The packaged app resolves Electron userData and places its host workspace in the workspace subdirectory. Expected macOS location:

    ~/Library/Application Support/A Gent/workspace

Source runs default to .data in the checkout unless AGENT_DATA_DIR is provided. The packaged main process passes an explicit directory, so do not assume that environment variable selects a separate packaged workspace. REL-003/008 must expose/document the actual resolved location.

- Quit with **Command-Q** before copying a backup. Closing the last Mac window can leave the host running.
- A full local backup copies the workspace directory, including state, backups, devices/interactions, and the private `.token`. Keep it private; it is not a portable share/export.
- `state.json` is local plaintext protected by file permissions. `state.json.bak` is one previous generation, not a multi-version backup system.
- Portable export now omits credentials, runtime thread IDs, provider bindings, and app credential references; import strips those fields too. The E2E download/import round trip passes on current source.
- Drafts are device-local app storage, scoped by host and chat/agent. They survive navigation, failed sends, reconnect, and normal relaunch, but are not part of the workspace directory or the portable export. Removing app data removes them; do not claim that a workspace-only backup preserves unsent drafts.
- External Codex account credentials remain managed separately by the CLI. Workspace backup is not account backup.
- For rollback, keep the previous known-working app and a quit-time data backup. Retain existing data while testing application upgrade/removal; do not erase the live workspace merely to test first run.

## Administrator token and desktop pairing

The workspace .token is the host administrator credential (or AGENT_TOKEN supplies it). It manages devices and host authority. Avoid copying it into screenshots, issue text, packages, or public diagnostics.

The desktop uses an automatically paired per-device token. Verify rotation, revocation, closed affected streams, and relaunch recovery. An ordinary device session can manage itself; creating/managing other devices requires administrator authority. Remote-device creation is not advertised in the personal-v1 UI; remote pairing is deferred. The API retains existing device management for compatibility, but it is not a v1 launch promise.

## Signing and Gatekeeper

Developer ID signing/notarization is not required for Danial's own test. Existing artifacts are development/ad-hoc builds. A downloaded quarantined app may need an explicit per-app Privacy & Security exception if macOS offers it; a locally built artifact can have different quarantine behavior. Record the actual result. Global security disablement is not a prerequisite, and the earlier host's override-based spctl result is not ordinary installation evidence.

## Candidate record and completion

Record commit/tree, Mac OS/chip, Node/Electron/Codex versions, dependency/install commands, complete check outcomes, artifact paths/hashes, actual packaged scenarios, core open issues, data location/backup instructions, draft storage location, and limitations in validation. Any fix after packaging requires a rebuild and affected source/package checks.

Danial accepts the exact tested artifact in V1-08. Public publication, signing infrastructure, and deferred features remain later work.
