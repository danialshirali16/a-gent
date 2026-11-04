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
| `npm test` | 7/7 pass |
| `npm run build` | Pass |
| `npm run desktop:mac` | Pass |
| `npm run desktop:win` | Pass, with icon/metadata warning |
| `npm run android:apk` | Pass |
| Packaged macOS app launch | Pass |
| Real Codex account/model discovery | Pass |
| macOS hidden title bar + traffic lights | Pass |
| Compact sidebar rail | Pass |
| Desktop and mobile UI smoke checks | Pass |

## Artifacts

| Artifact | Size | SHA-256 |
| --- | ---: | --- |
| `A-Gent-0.1.0-mac-arm64.dmg` | 121 MB | `e2253d7aa04748b0fa834f7dc841c3af26ea1d19a2bb91378108d28da849bd36` |
| `A-Gent-0.1.0-mac-arm64.zip` | 118 MB | `c9985cef71cffa111b6839aa122c4a8ce6dd31f5040e78ff9459170e5f835605` |
| `A-Gent-Setup-0.1.0-x64.exe` | 120 MB | `df33c20bbd6a19c9734f6e7e3dcb9c4fac05d856ac493113e83acf1c624f351f` |
| `A-Gent-Portable-0.1.0-x64.exe` | 108 MB | `757d461668c43208655c59c6c2610431f4a4ff238a6f6b6c57f2f7ef08501bd9` |
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
- Workspace data lock rejects a second host using the same data directory.
- Corrupt `state.json` recovers from `state.json.bak`.

## Not verified

- Windows installer/portable on real Windows.
- Windows icon/version metadata.
- Android APK on a real device or emulator.
- Android HTTPS pairing, back button, token persistence, safe areas.
- macOS Gatekeeper on a clean Mac.
- macOS notarization.
- Windows code signing.
- Android release signing.
- Playwright visual/E2E tests.
- CI execution.

## Known issues

- macOS app is ad-hoc signed and not notarized.
- Windows artifacts are unsigned.
- Android APK is debug-signed and companion-only.
- Remote pairing token injection is sensitive to reverse-proxy header configuration.
- Very large exports can still exceed the 32 MB import limit.
- No UI E2E/visual test suite yet.

See `docs/project-roadmap.md` for the remaining work and `docs/ui-roadmap.md` for the UI-specific plan.
