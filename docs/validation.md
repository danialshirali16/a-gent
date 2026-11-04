# A Gent — Validation Record

Date: 2026-11-04  
Host: macOS arm64  
Node: 24.22.2  
Codex CLI: 0.166.0  
Electron: 45.2.2

## Checks performed

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 11/11 pass |
| `npm run test:ui` | 15/15 Playwright smoke tests pass |
| `npm run test:visual` | 10/10 Playwright screenshot baselines pass |
| `npm run test:a11y` | 6/6 axe scans pass; 0 violations |
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

Windows and Android artifacts below are from the previous cross-platform build. They were not rebuilt or tested in this macOS-only pass.

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `A-Gent-0.1.0-mac-arm64.dmg` | 121 MB | `af4fbe894c91f013b330ab290584b585e8beabcb5404b6b8a01c565ae84bcf82` |
| `A-Gent-0.1.0-mac-arm64.zip` | 118 MB | `b8e503686ee53f61a5203c540c7fcb1443987cad72d28fa040946013e73acaa1` |
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
- Axe scans cover home in light/dark, Settings, Connections, the side panel, and mobile home with 0 violations.
- The light-theme faint text token was darkened to meet WCAG AA contrast.
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
- CI execution (the workflow has not run on GitHub yet).

## Known issues

- macOS app is ad-hoc signed and not notarized.
- Windows artifacts are unsigned and were not rebuilt after the macOS-only changes.
- Android APK is debug-signed, companion-only, and was not rebuilt after the macOS-only changes.
- Local browser token injection remains opt-in; use HTTPS and a dedicated device token for remote access.
- Very large exports can still exceed the 32 MB import limit.
- Remote Markdown images are blocked by CSP until an image policy is chosen.

See `docs/project-roadmap.md` for the remaining work and `docs/ui-roadmap.md` for the UI-specific plan.
