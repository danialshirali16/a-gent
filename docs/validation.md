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
| `npm test` | 9/9 pass |
| `npm run test:ui` | 3/3 Playwright smoke tests pass |
| `npm run test:visual` | 10/10 Playwright screenshot baselines pass |
| `npm run build` | Pass |
| `npm run desktop:mac` | Pass |
| `npm run desktop:win` | Pass; unsigned, icon/version metadata applied |
| `npm run android:apk` | Pass |
| Packaged macOS app launch | Pass |
| Real Codex account/model discovery | Pass |
| macOS hidden title bar + traffic lights | Pass |
| Compact sidebar rail | Pass |
| Desktop and mobile UI smoke checks | Pass |

## Artifacts

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `A-Gent-0.1.0-mac-arm64.dmg` | 121 MB | `0f43ef754a20a7a4ae6bb0fd8a1f12a2da69095c4c911770125114098cee8bcd` |
| `A-Gent-0.1.0-mac-arm64.zip` | 118 MB | `e0ac2dfaca8eacb556849a372ee40143821f9c0cc9491bd9097ad437a648e98f` |
| `A-Gent-Setup-0.1.0-x64.exe` | 120 MB | `aec990568e4b2343a681bea41665bfbc6241fc084a89a5f94c2578a8b40dbf93` |
| `A-Gent-Portable-0.1.0-x64.exe` | 108 MB | `bbfdb2b6e77a3997c12d8e35228964f82b46eb908f3bef95bea5e6b6a1592735` |
| `A-Gent-0.1.0-android-debug.apk` | 4.3 MB | `ad871757273e6847a26e4111b726ed4427f2fe09116a5174e8b1816e9345a908` |

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
- Playwright smoke tests cover the shell, compact rail, settings modal, connections modal, fake-Codex chat streaming, and mobile drawer.
- Visual baselines cover the home screen at 1440×900, 1280×800, 1024×768, 768×1024, and 390×844 in light and dark themes.
- Baselines were generated on macOS arm64 with Chrome. The `visual` CI job runs on `macos-latest`.
- Workspace data lock rejects a second host using the same data directory.
- Desktop pairing cookie gates token injection; the packaged macOS app loads the workspace through that cookie.
- Legacy desktop cookies migrate to a hashed per-device token and are replaced by the server.
- Per-device tokens can be created, rotated, and revoked; only SHA-256 hashes are stored in `devices.json`.
- Packaged macOS app migrated its legacy cookie to a device token; after that device was revoked, the next launch created a fresh device and loaded the workspace.
- Local browser token injection is opt-in via `AGENT_ALLOW_LOCAL_TOKEN_INJECTION=1`.
- Corrupt `state.json` recovers from `state.json.bak`.
- CSP now sets `default-src 'self'` and blocks remote images.
- File-change approvals include the available patch/diff text.

## Not verified

- Windows installer/portable on real Windows.
- Windows icon rendering on a Windows desktop.
- Android APK on a real device or emulator.
- Android HTTPS pairing, back button, token persistence, safe areas.
- macOS Gatekeeper on a clean Mac.
- macOS notarization.
- Windows code signing.
- Android release signing.
- CI execution (the workflow has not run on GitHub yet).

## Known issues

- macOS app is ad-hoc signed and not notarized.
- Windows artifacts are unsigned.
- Android APK is debug-signed and companion-only.
- Local browser token injection remains opt-in; use HTTPS and a dedicated device token for remote access.
- Device-token management is currently API-only; there is no Settings device list yet.
- Very large exports can still exceed the 32 MB import limit.
- Remote Markdown images are blocked by CSP until an image policy is chosen.

See `docs/project-roadmap.md` for the remaining work and `docs/ui-roadmap.md` for the UI-specific plan.
