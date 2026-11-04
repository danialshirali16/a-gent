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
| `npm test` | 6/6 pass |
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
| `A-Gent-0.1.0-mac-arm64.dmg` | 121 MB | `61434e53107a5f853087a85fcef75369b8d64f448e4b9725344de70a13796a1c` |
| `A-Gent-0.1.0-mac-arm64.zip` | 118 MB | `05fbfb9f94ffec892913580186f65b02bc3cb7e303fb93c1954d793e379e1b19` |
| `A-Gent-Setup-0.1.0-x64.exe` | 120 MB | `4fdc030b006fe37a33acb3d53593446d458d0c3c59ba518cdb29d8eee1f54fb1` |
| `A-Gent-Portable-0.1.0-x64.exe` | 108 MB | `b1982c0612e4bcfcbfee361f4da34cb170f4be2d186e1855eb537d2eaa0cedb8` |
| `A-Gent-0.1.0-android-debug.apk` | 4.1 MB | `4fb2f074302af379eec6905306c8c07f46812a2d21041a7fab4d557cf39cb56f` |

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
- electron-builder reported:
  - `executable resource editing and code signing skipped — signAndEditExecutable is false`
  - This means the executable icon and version metadata are not applied.
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
- Windows executable metadata/icon are skipped.
- Android APK is debug-signed and companion-only.
- Remote pairing token injection is sensitive to reverse-proxy header configuration.
- Export can exceed the 8 MB import limit.
- Attachment totals can exceed the 8 MB JSON body limit.
- No data-directory lock or automatic state backup.
- No UI E2E/visual test suite yet.

See `docs/project-roadmap.md` for the remaining work and `docs/ui-roadmap.md` for the UI-specific plan.
