# Personal macOS v1.0 setup and test guide

Status: **Acceptance procedure, 2026-11-05; a current candidate has not been built or accepted.** Follow the [roadmap](project-roadmap.md#recommended-execution-order), [release contract](release-contract.md), and [support matrix](support-matrix.md). The required behaviors below are targets; [current state](current-state-review.md) records gaps.

## Before building

1. Confirm Danial's Mac chip and macOS version. Existing configuration targets arm64/macOS 13+; Intel support is not implied.
2. Use the identified checkout and Node 24.x. Keep the lockfile; complete npm ci on a host with npm and Electron download access.
3. Make Electron runtime installation explicit with npm run desktop:runtime if the install policy has skipped it. Install Chrome for Playwright with npx playwright install chrome; Linux verification hosts may need its OS dependencies too.
4. Install/sign into the supported Codex CLI independently; recorded baseline is 0.166.0. Existing external login is sufficient. Never copy account tokens into A Gent. GUI PATH and actual runtime/schema compatibility must pass CDX-001.
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

Use supported runtime-baseline probing and recorded compatibility evidence. Standard npm commands must execute; a supplemental runner alone cannot accept the candidate. Review screenshot changes rather than automatically accepting new baselines. Mac visual baselines cannot be certified by Linux screenshots.

Build configuration currently emits arm64 A Gent.app plus DMG/ZIP under release. Record actual paths and hashes rather than assuming the old 0.1.0 artifact names. Signing/notarization is deferred for this personal candidate.

## Install and first run

1. Install the identified A Gent.app in Applications and launch it through Finder.
2. Confirm the local host starts on loopback and the desktop pairs automatically. A user should not need to find/copy the administrator token to use the ordinary desktop.
3. Verify missing CLI, unsupported version, and signed-out guidance. After installation/login, Check connection must recover without a stale success state.
4. Select an available Codex model and send a short message. Check streamed output and a second turn.
5. Confirm deferred providers, custom effort, connectors, speech, skills, uploads/scheduling expansion, and remote-host setup are not represented as supported launch paths. Existing data is preserved.

## Chat, project, approval, and recovery pass

| Scenario | Expected result |
| --- | --- |
| Two chats, used sequentially | Correct model/history in each; unsent drafts survive navigation and restart. A second concurrent run is rejected clearly by UI/API. |
| Restart/continue | Sent messages/completed replies and correct runtime bindings survive; continuation appends to the intended chat. |
| Native folder selection | Choose/cancel/invalid/unavailable path behaves correctly; the selected host folder is clear. |
| Chat mode | Inspect/read context without modifying the selected project. |
| Work mode | Create a small requested file in a disposable folder under Codex's sandbox. A permitted write alone does not prove approval handling. |
| Genuine approval | Use the candidate's recorded, reproducible Codex permission-request scenario. Deny once and verify no denied action occurs; approve a new request and verify only that action occurs. Record the exact prompt/runtime/policy and whether command/file/access approval was exercised. |
| Native question | Answer actual supported question options/text; decline/cancel does not fabricate an answer. |
| Stop | Stop a controlled long run. UI remains truthful while stopping, actual effects/processes end, and only then can another run start. |
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
- A full local backup copies the workspace directory, including state, backups, devices/interactions, and the private .token. Keep it private; it is not a portable share/export.
- state.json is local plaintext protected by file permissions. state.json.bak is one previous generation, not a multi-version backup system.
- Portable export should omit secrets and runtime thread/binding fields; current source still exports bindings and must be fixed before accepting that promise. Import currently strips those fields.
- External Codex account credentials remain managed separately by the CLI. Workspace backup is not account backup.
- For rollback, keep the previous known-working app and a quit-time data backup. Retain existing data while testing application upgrade/removal; do not erase the live workspace merely to test first run.

## Administrator token and desktop pairing

The workspace .token is the host administrator credential (or AGENT_TOKEN supplies it). It manages devices and host authority. Avoid copying it into screenshots, issue text, packages, or public diagnostics.

The desktop uses an automatically paired per-device token. Verify rotation, revocation, closed affected streams, and relaunch recovery. An ordinary device session can manage itself; creating/managing other devices requires administrator authority. Remote pairing is deferred for personal v1.

## Signing and Gatekeeper

Developer ID signing/notarization is not required for Danial's own test. Existing artifacts are development/ad-hoc builds. A downloaded quarantined app may need an explicit per-app Privacy & Security exception if macOS offers it; a locally built artifact can have different quarantine behavior. Record the actual result. Global security disablement is not a prerequisite, and the earlier host's override-based spctl result is not ordinary installation evidence.

## Candidate record and completion

Record commit/tree, Mac OS/chip, Node/Electron/Codex versions, dependency/install commands, complete check outcomes, artifact paths/hashes, actual packaged scenarios, core open issues, data location/backup instructions, and limitations in validation. Any fix after packaging requires a rebuild and affected source/package checks.

Danial accepts the exact tested artifact in V1-08. Public publication, signing infrastructure, and deferred features remain later work.
