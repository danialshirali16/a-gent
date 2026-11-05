# V1-08 — Owner acceptance procedure (macOS arm64)

Status: **Prepared for the V1-07 candidate; not yet accepted.** This procedure is for Danial's Mac only. It closes V1-08 only after the exact artifact below passes and the result is recorded in [validation](validation.md#macos-arm64-source-and-candidate-pass-2026-11-06). Source, browser, fixture, and real-Codex checks do not substitute for this pass.

## Candidate under review

| Item | Value |
| --- | --- |
| Product / version | A Gent 1.0.0 |
| Git branch / commit | `codex/v1-macos-release` / build commit recorded in `release-artifacts/A-Gent-1.0.0-macos-arm64.json` |
| Build host | MacBook Pro (MacBookPro17,1), Apple M1, 8 GB, macOS 27.2 (26B123) |
| Build runtime | Node 24.12.0, npm 11.6.2, Electron 45.2.2, Codex CLI 0.166.0 |
| DMG | `release/A-Gent-1.0.0-mac-arm64.dmg` |
| DMG SHA-256 | recorded in `release-artifacts/A-Gent-1.0.0-macos-arm64.json` and `SHA256SUMS.txt` |
| ZIP | `release/A-Gent-1.0.0-mac-arm64.zip` |
| ZIP SHA-256 | recorded in `release-artifacts/A-Gent-1.0.0-macos-arm64.json` and `SHA256SUMS.txt` |
| CI artifact | GitHub Actions run for the build commit, artifact `A-Gent-macos` |
| Signing | Unsigned / ad-hoc (personal test build; no Developer ID or notarization) |
| Minimum OS | macOS 13.0, arm64 only |

Verify the downloaded file before opening it:

```sh
shasum -a 256 A-Gent-1.0.0-mac-arm64.dmg
shasum -a 256 A-Gent-1.0.0-mac-arm64.zip
```

Compare both hashes with `release-artifacts/SHA256SUMS.txt` (or the values published with the pull request). Do not continue if either hash differs.

## Before you begin

1. Quit any running A Gent instance, including one started from source.
2. Keep the existing workspace as a rollback copy:
   ```sh
   cp -R "$HOME/Library/Application Support/A Gent/workspace" "$HOME/Desktop/a-gent-v1-backup"
   ```
   Quit with **⌘Q** first. Closing the window can leave the local host running.
3. Confirm the Codex CLI is installed and signed in:
   ```sh
   codex --version      # expected 0.166.x
   codex login status   # expected signed in
   ```
4. Use a disposable project folder for the Work/approval checks. Do not test destructive actions against a real project.

## Acceptance checks

Record **Pass**, **Fail**, or **Blocked** for every row. A failure that affects launch, data, approvals, Stop, or restart blocks V1-08.

### 1. Install and launch

- [ ] Mount the DMG, drag **A Gent** to **Applications**, and eject the disk image.
- [ ] Launch **A Gent** from Finder (not from a terminal). If macOS blocks it, record the exact dialog and the Privacy & Security path you used.
- [ ] The app opens without a terminal, shows the A Gent home screen, and the local host starts on `127.0.0.1`.
- [ ] Quit with **⌘Q**, then relaunch from Finder. The app opens normally and does not ask for a pairing token.

Expected: Finder launch, automatic desktop pairing, no manual token entry. Record any Gatekeeper/quarantine dialog rather than disabling security globally. The candidate is not Developer ID signed or notarized; `codesign --verify` may report an incomplete ad-hoc signature. That is a known personal-build limitation, not a release claim.

### 2. Codex setup and recovery

- [ ] Open **Connections**: only Codex is offered; paused providers and Connected Apps management are not advertised.
- [ ] Open **Manage** on the Codex card, then click **Check connection**. The card becomes ready and lists models.
- [ ] Choose a model. The composer shows the effective model; a second chat keeps its own selection.
- [ ] (Optional failure check) Temporarily rename the `codex` executable or sign out, then reopen/check. The app gives install/login guidance and recovers after restoring the CLI/login.

Expected: useful recovery copy, no stale “ready” state, no copied Codex credentials.

### 3. First real conversation

- [ ] Send: `Reply with exactly OK. Do not use tools.`
- [ ] The answer streams once and settles as **OK**.
- [ ] Send: `Reply with exactly DONE. Do not use tools.`
- [ ] The second answer is **DONE** and continues the same chat.

Expected: streamed text, no duplicate/stale deltas, ready for a third message.

### 4. Persistence and drafts

- [ ] Type an unsent draft in chat A, switch to chat B, then return. The draft is still in A and B does not show it.
- [ ] Send a message in A, quit with **⌘Q**, relaunch, and reopen A. The conversation and any new unsent draft remain.
- [ ] Use the Files panel to confirm the selected workspace is readable; no project files are modified by browsing.

Expected: conversations and device-local drafts survive navigation and relaunch.

### 5. Project folder and Chat mode

- [ ] Choose **Project folder** and use the native macOS folder dialog. Cancel once, then choose a disposable folder.
- [ ] In **Chat** mode, ask: `Create a file named chat-should-not-exist.txt containing exactly hello.`
- [ ] Confirm the file is absent and the assistant explains that Chat is read-only.

Expected: native dialog only (no browser prompt), read-only Chat behavior.

### 6. Work mode and approvals

- [ ] In **Work** mode in the disposable folder, ask: `Create work-check.txt containing exactly: hello. Use a shell command, then reply DONE.`
- [ ] Confirm `work-check.txt` exists with content `hello`.
- [ ] Ask for an outside-workspace write, for example:
      `Run this exact command: printf hello > "$HOME/agent-v1-approval.txt". Then reply DONE.`
- [ ] **Decline** the approval. Confirm the target file is absent and the run settles.
- [ ] Repeat the request and **Accept** the approval. Confirm only the target file is created, with content `hello`. Remove it afterward.
- [ ] Answer a native Codex question if one is offered; declining/cancelling must not fabricate an answer.

Expected: genuine approve/decline behavior, one settled result, no side effect after a decline. The native-question path remains **open** unless a real question is actually shown and answered.

### 7. Stop and one active run

- [ ] Ask for a long answer (for example, a 1,000-word essay).
- [ ] Press **Stop** while it streams. The button shows **Stopping…** and the chat stays reserved.
- [ ] Try to send another message while stopping: it is rejected with a clear “one task at a time” message.
- [ ] Wait for **interrupted**, then send `Reply with exactly AFTER. Do not use tools.` It completes.
- [ ] Start a run in chat A and try to send in chat B. B is rejected until A stops.

Expected: truthful Stop, actual cleanup, no background work, next turn only after cleanup.

### 8. Restart, offline, and expiry

- [ ] Quit with **⌘Q** during an active run. Relaunch: the run is **interrupted**, the chat is not stuck busy, and a new message works.
- [ ] Disable Wi-Fi, send a message, then restore Wi-Fi. The app reconnects/resynchronizes without duplicate replies and preserves the draft.
- [ ] If a pending approval exists at quit, relaunch and confirm it is expired/cancelled and cannot be replayed.

Expected: no phantom busy state, no replayed side effects, recoverable error.

### 9. Export, backup, and data location

- [ ] Export the workspace. Open the JSON and confirm it omits provider thread IDs, provider bindings, credentials, and app credential references.
- [ ] Confirm the live workspace is at `~/Library/Application Support/A Gent/workspace` and the package does not write user data inside `A Gent.app`.
- [ ] Copy the workspace while A Gent is quit; relaunch and confirm conversations return.
- [ ] Keep the previous app/backup for rollback. Do not erase the live workspace merely to test first run.

Expected: portable export is sanitized; a full local backup preserves conversations; drafts are app-local and not in the workspace export.

### 10. Accessibility and visual checks

- [ ] Keyboard only: open/close Connections and Settings, choose a model, choose a folder, approve/decline, and Stop. Focus returns after dialogs close.
- [ ] Enable **VoiceOver** and complete the first message, model picker, approval, and Stop flows. Record any unlabeled or unreachable control.
- [ ] Use macOS **Zoom** (not browser zoom) at 200% and a narrow window. Check that the composer, model pill, approval, and Stop remain usable without clipped controls.
- [ ] Switch light/dark themes and reduced motion. No essential action depends on motion or color alone.

Expected: no keyboard trap, no lost focus, understandable announcements. VoiceOver/zoom remain **open** until actually performed on this candidate.

### 11. Package and identity

- [ ] **About A Gent** reports 1.0.0.
- [ ] The app icon matches the supplied robot artwork in Finder and the Dock.
- [ ] `codesign -dv "…/A Gent.app"` and `spctl --assess` results are recorded; no claim of notarization.
- [ ] Confirm the app bundle contains `dist`, `dist-server`, `electron`, `README.md`, docs, `package.json`, and `dist/THIRD_PARTY_NOTICES.txt`; no `workspace`, `state.json`, `.token`, `.data`, or test harness is present.

### 12. Quit and relaunch

- [ ] Quit with **⌘Q** while idle: the host stops (no orphan `dist-server` process).
- [ ] Relaunch: the same conversations, drafts, model choice, and project path are available.
- [ ] Remove the app from Applications **without** deleting the workspace; reinstall the same artifact; conversations remain.

Expected: install/upgrade/quit/relaunch behavior is explicit and data stays outside the bundle.

## Result record

Copy this into [validation](validation.md#macos-arm64-source-and-candidate-pass-2026-11-06) (or attach a filled copy) after the pass:

```text
Candidate: A Gent 1.0.0, commit <sha>, DMG SHA-256 <hash>, ZIP SHA-256 <hash>
Host: <Mac model/chip>, macOS <version>, Codex <version>
Checks: 1 __ 2 __ 3 __ 4 __ 5 __ 6 __ 7 __ 8 __ 9 __ 10 __ 11 __ 12 __
Failures/blockers: <none or list with exact dialog/log>
Open checks: native question __, VoiceOver __, macOS zoom/reflow __, install/upgrade __
Owner decision: accepted / rejected; accepted artifact <path or hash>
```

## Rollback

1. Quit A Gent with **⌘Q**.
2. Move the candidate to the Trash (do not empty it).
3. Restore the previous app and the quit-time workspace backup.
4. Relaunch and confirm the previous conversation opens.

Do not publish this candidate, enable paused features, or treat this personal pass as a public release or signing/notarization result.
