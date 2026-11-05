> Historical plan preserved on 2026-11-05. Status, estimates, and test counts below describe the earlier plan. Use the [current project roadmap](../project-roadmap.md), [current state](../current-state-review.md), and [validation record](../validation.md) for continuation.

# A Gent — Main Project Roadmap

Status: active\
Date: 2026-11-04\
Branch: `main`\
Active scope: **macOS only**. Windows and Android work is paused; do not rebuild or test those artifacts until the scope changes.

## 0. Current scope

The active objective is to complete and improve A Gent on macOS. macOS builds, macOS runtime checks, backend tests, macOS UI tests, accessibility audits, and macOS E2E workflows are in scope. Windows and Android builds/tests are explicitly out of scope for this pass.

## 1. Original target

> Build a working clone of Reason, branded **A Gent**, that runs on **Mac, Windows, and Android** — local-first, without Reason’s private cloud service or billing, with a **Reason-like UI**.

Scope clarifications from the project owner:

- Do **not** reproduce Reason’s private cloud service or billing.
- The UI should feel like Reason.
- Keep A Gent’s own name, branding, code, and local data store.

## 2. Current status

### Core product

Working:

- Persistent conversations and messages.
- Custom agents with instructions, icon, color, provider, model, reasoning effort, and agent group.
- Agent groups and conversation groups.
- Conversation search.
- Streamed replies.
- Project folders.
- Visible tool activity.
- Command, file, and permission approvals.
- Run interruption.
- One-time scheduled tasks.
- Workspace import/export.
- Read-only Files side panel with workspace browsing.
- Terminal/activity side panel.
- Per-device pairing tokens with create, rotate, revoke, and legacy cookie migration.
- Local token auth, host/origin allowlists, Electron sandboxing.
- Data-directory lock, rolling `state.json.bak` recovery, CSP, and approval diffs.

### Providers

- **Codex** — local app-server integration and sign-in.
- **OpenCode** — local CLI integration, model discovery, session continuity, streamed JSON events.
- **Antigravity** — Google Gemini OpenAI-compatible endpoint with API key.
- **Cloud** — configurable hosted OpenAI-compatible endpoint.
- **Ollama** — local OpenAI-compatible chat.
- **OpenAI compatible** — custom endpoint, API key, and model ID.

OpenCode runs through its CLI with `--auto`; stricter permissions belong in OpenCode’s own configuration. Cloud and Antigravity use the HTTP streaming adapter.

### Reason-like UI

Implemented:

- Reason-derived light/dark design tokens.
- Inter Variable UI text, Latin subset only (48 KB).
- 280px sidebar, inset chat surface, centered agent pill.
- Agent rows with solid color icons and collapsible agent groups.
- Compact 64px sidebar rail.
- Chat bubbles, date separators, hover actions.
- Tool stream with Compact / Verbose / Hidden setting.
- One-line composer with plus menu and combined model/effort pill.
- Settings modal with left navigation and search, including Devices.
- Connections modal with models, providers, local MCP apps, and host pairing.
- Agents and Scheduled modals.
- 480px side panel with Session, Sessions, Files, Terminal, Activity, and Approvals tabs.
- Code-block copy buttons.
- Centered model/effort change events.
- Electron hidden title bar, traffic-light padding, Windows title-bar overlay.
- Full keyboard navigation for menus, dialogs, model picker, and side-panel tabs.
- `⌘ \` side-panel shortcut.
- Automated axe accessibility audit.
- macOS E2E matrix for core workflows.

Not finished:

- Retry/more message actions.
- Manual screen-reader and reduced-motion audit.
- Removal of unused page views from `views.tsx`.
- Image/PDF/binary attachments.
- Recurring schedules and conversation retry/branching.

### Built artifacts

| Platform | Artifact | Size | Status |
| --- | --- | ---: | --- |
| macOS arm64 | `release/A-Gent-0.1.0-mac-arm64.dmg` | 123 MB | Built; ad-hoc signed; not notarized |
| macOS arm64 | `release/A-Gent-0.1.0-mac-arm64.zip` | 120 MB | Built; ad-hoc signed; not notarized |
| Windows x64 | `release/A-Gent-Setup-0.1.0-x64.exe` | 120 MB | Previous cross-platform build; unsigned; not rebuilt in this macOS pass |
| Windows x64 | `release/A-Gent-Portable-0.1.0-x64.exe` | 108 MB | Previous cross-platform build; unsigned; not rebuilt in this macOS pass |
| Android | `release/A-Gent-0.1.0-android-debug.apk` | 4.3 MB | Previous cross-platform build; debug-signed; companion client |

### Artifact hashes

```text
0b200d3d8d89ef14d03eeb261df2c2abc1c36dae67054817cde7ce6a4629b97b  A-Gent-0.1.0-mac-arm64.dmg
4e9266079ca720be9b493c0d725cd548e8acebba1c29dbeb4e310ed8b0162f08  A-Gent-0.1.0-mac-arm64.zip
4ef4c19e8b9437c246b42a436ab95ad73a65105c432105ead2241f750914df92  A-Gent-Setup-0.1.0-x64.exe
f65ba83b3719106ac8984ddb4bef1c3b6ad4c8806534d63ca3c566477e8f8ba7  A-Gent-Portable-0.1.0-x64.exe
e3d476344f8ba3492657bec03b0626dce11aee4c5a24d99047fad45e240cac2c  A-Gent-0.1.0-android-debug.apk
```

### Verified on this machine

- `npm run typecheck` — passes.
- `npm test` — 17/17 backend tests pass.
- `npm run test:ui` — 18/18 Playwright smoke tests pass.
- `npm run test:visual` — 10/10 visual baselines pass.
- `npm run test:a11y` — 7/7 axe scans pass with 0 violations.
- `npm run test:e2e` — 7/7 macOS E2E workflows pass.
- `npm run build` — passes.
- `npm run desktop:mac` — builds DMG and ZIP.
- Packaged macOS app launches and serves the UI.
- Every agent renders a `bot-avatars@0.2.2` glossy plastic bot with saved shape preferences; the renderer is a lazy 131.42 kB chunk with an SVG fallback, and the picker passes keyboard and axe checks.
- Real Codex discovery works: account detected, models listed.
- OpenCode connects through the installed CLI and reports 31 models.
- Packaged macOS app visually verified with Computer Use: hidden title bar, traffic lights, sidebar, compact rail.
- Packaged macOS app verified for devices, agent groups, Files/Terminal, keyboard flows, light theme, and provider cards.
- Inter Latin WOFF2 is the only bundled font resource (48 KB).

### Not verified

- Windows installer/portable runtime on real Windows (paused).
- Windows icon rendering on a Windows desktop (paused).
- Android APK on a physical device or emulator (paused).
- Android HTTPS host pairing, back button, safe areas, token persistence (paused).
- macOS Gatekeeper on a clean Mac.
- macOS notarization.
- Windows code signing.
- Android release signing.
- Manual VoiceOver and reduced-motion audit.
- Universal/Intel macOS build.
- CI execution on GitHub.
- Performance check under large workspaces/SSE load.

## 3. Completion assessment

These are engineering estimates, not precise metrics.

| Workstream | Done | Remaining | Notes |
| --- | ---: | ---: | --- |
| Core local workspace | 85% | 15% | Core chat/agents/schedules/approvals work; local parity gaps remain |
| macOS delivery | 92% | 8% | Artifact built and packaged app verified; signing/notarization/Intel missing |
| Windows delivery | 60% | 40% | Paused; previous artifacts built, no runtime test, unsigned |
| Android delivery | 40% | 60% | Paused; debug APK, companion-only, no device test |
| Reason-like UI | 92% | 8% | Major surfaces, providers, groups, Files/Terminal, keyboard, and accessibility done; retry actions and manual audit remain |
| Security and reliability | 85% | 15% | Device tokens, cookie migration, data lock, recovery, CSP, and approval diffs; SSRF/timeouts/streaming remain |
| Tests and QA | 97% | 3% | 12 backend, 17 smoke, 10 visual, 6 axe, and 6 E2E pass; manual screen-reader audit pending |
| Docs and release | 85% | 15% | README, roadmap, UI roadmap, validation, and research notes updated; tag, notices, signing remain |
| Full Reason parity | 35% | 65% | Cloud/billing intentionally excluded; native/browser/voice/connectors missing |

**Against the current macOS objective: roughly 90–92% complete.**
**Against the original local-first Mac + Windows + Android goal: roughly 65–70% complete.**
**Against full Reason parity: roughly 35% complete**, with cloud and billing intentionally out of scope.

## 4. What is left

### A. macOS release hardening

- Developer ID signing.
- Notarization and stapling.
- Clean-Mac Gatekeeper test.
- Universal/Intel packaging decision.
- Signing steps in CI/release docs.
- Auto-update only after signing is stable.

### B. Manual accessibility audit

- VoiceOver traversal of home, sidebar, composer, Settings, Connections, side panel, and Files/Terminal.
- Reduced-motion audit of the packaged app.
- Fix any findings and record them in `docs/validation.md`.

### C. Local feature parity

- Retry/regenerate and more message actions.
- Image/PDF/binary attachments.
- Project file browser and diff review.
- Recurring schedules.
- Conversation retry/branching.
- Notifications for scheduled tasks and approvals.
- Token/cost/rate-limit display.
- Multi-agent teams if still in scope.
- Local MCP app authentication flow.
- Voice input/chat, native computer control, and browser extension only after separate approval.

### D. Paused platforms

- Windows runtime test and signing.
- Android device test, persistent secure token storage, QR pairing, safe areas, release signing.
- Cross-platform CI and smoke tests.

### E. Release

- License, privacy, and third-party notices.
- Release notes and artifact naming.
- Tag a release candidate.
- Final README and validation truth.

## 5. Phase plan

### Phase 0 — Release truth and UI merge

- [x] Update README artifact/status text.
- [x] Add `docs/validation.md` with current evidence.
- [x] Merge `ui/reason-style` into `main`.
- [x] Record artifact hashes and sizes.
- [x] Add release checklist.
- [ ] Tag a build (`v0.1.0-ui` or similar).

### Phase 1 — Windows delivery (paused)

- [x] Fix Windows icon/version metadata (`signExecutable: false`).
- [x] Rebuild setup and portable artifacts.
- [ ] Test on Windows 11 x64.
- [ ] Verify Codex/OpenCode discovery and HTTP providers.
- [ ] Verify project folder picker, approvals, interruption, schedules.
- [ ] Verify title-bar overlay and drag regions.
- [ ] Document Windows prerequisites and SmartScreen behavior.
- [ ] Decide signing plan.

### Phase 2 — Android delivery (paused)

- [ ] Test APK on a physical device/emulator.
- [x] Add Android back-button handling.
- [ ] Add persistent secure token storage.
- [ ] Add QR/short-code pairing if feasible.
- [ ] Verify HTTPS host pairing.
- [ ] Verify safe areas, keyboard, touch targets.
- [ ] Verify import/export in WebView.
- [ ] Add release signing.
- [ ] Document companion setup and limitations.

### Phase 3 — macOS release hardening

- [ ] Developer ID signing.
- [ ] Notarization and stapling.
- [ ] Clean-Mac Gatekeeper test.
- [ ] Decide universal vs arm64.
- [ ] Add signing steps to CI/release docs.

### Phase 4 — Security and reliability

- [x] Replace proxy-sensitive token injection with a desktop pairing cookie.
- [x] Add per-device tokens with rotation/revocation and legacy cookie migration.
- [x] Add Settings → Devices for token creation, rotation, and current-device revocation.
- [x] Add data-directory lock.
- [x] Add rolling backups and corrupt-state recovery.
- [ ] Finish import/export streaming; body limit raised to 32 MB.
- [x] Add CSP and remote-image policy.
- [ ] Review provider URL SSRF.
- [x] Add file-diff approvals; session approvals still pending.
- [ ] Add approval/turn timeouts.
- [ ] Add large-workspace/SSE performance checks.

### Phase 5 — UI completion and test suite

- [x] Agent groups in sidebar.
- [x] Approvals in side panel.
- [x] Files/Terminal tabs.
- [ ] Retry/more message actions.
- [x] Full keyboard menu navigation.
- [x] Playwright smoke tests.
- [x] Playwright screenshot visual baselines (5 viewports × 2 themes).
- [x] Automated axe accessibility audit.
- [x] macOS E2E workflow matrix.
- [ ] Manual screen-reader and reduced-motion audit.
- [ ] Remove unused page views.

### Phase 6 — Local feature parity

- [ ] Image/PDF/binary attachments.
- [ ] Project file browser and diff review.
- [ ] Recurring schedules.
- [ ] Conversation retry/branching.
- [ ] Notifications.
- [ ] Token/cost/rate-limit display.
- [ ] Multi-agent teams if still in scope.
- [ ] Voice/native/browser features only after separate approval.

### Phase 7 — Release

- [ ] CI builds and tests on macOS, Windows, Android.
- [ ] Artifact checksums and release notes.
- [ ] License/privacy/terms and third-party notices.
- [x] Final README and validation docs.
- [ ] Tag release.
- [ ] Smoke-test every artifact.

## 6. Milestones

| Milestone | Definition | Status |
| --- | --- | --- |
| M0 | UI branch merged; docs and artifacts truthful | Done |
| M1 | Windows installer/portable pass a Windows smoke test | Paused |
| M2 | Android APK pairs with a host and passes device smoke test | Paused |
| M3 | macOS DMG is signed, notarized, and opens on a clean Mac | Pending |
| M4 | Security/reliability checklist passes | Mostly done |
| M5 | UI E2E/visual/accessibility pass | E2E, visual, and axe pass; manual audit pending |
| M6 | Agreed local parity checklist complete | Pending |
| M7 | v0.1.0 multi-platform release published | Pending |

## 7. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No Windows runtime available here | Windows artifacts unverified | Paused until a Windows VM/device is available |
| No Android device/emulator available here | APK unverified | Paused until a device/emulator is available |
| macOS ad-hoc signature | Gatekeeper blocks other Macs | Developer ID + notarization |
| No signing credentials | Cannot ship a trusted release | Obtain Apple, Windows, and Android signing credentials |
| OpenCode CLI permissions | `--auto` can run tools without A Gent approval | Configure OpenCode permissions; keep provider opt-in |
| Cloud endpoint trust | User-supplied endpoint can be malicious | Keep SSRF review and explicit endpoint configuration |
| Manual accessibility gaps | Automated axe does not catch screen-reader issues | Run VoiceOver/reduced-motion audit |
| State corruption | Data loss | Backups, lock, recovery |
| Scope creep | Delays | Keep cloud/billing/native/voice out of v1 |
| Full Reason parity expectation | Unbounded scope | Define “core local workspace + selected parity” |

## 8. Definition of done

### Current macOS objective

- [x] App builds and launches on macOS.
- [x] Core local workspace flows work.
- [x] Reason-like UI surfaces implemented.
- [x] Files/Terminal, agent groups, devices, and keyboard navigation implemented.
- [x] Automated axe audit passes with zero violations.
- [x] macOS E2E matrix passes.
- [ ] Manual VoiceOver and reduced-motion audit passes.
- [ ] Signed and notarized DMG opens on a clean Mac.
- [ ] Universal/Intel decision recorded.

### Original multi-platform target

- [ ] A clean Windows machine can install/run the app and discover providers.
- [ ] A real Android device can install the APK, pair over HTTPS, and use chat, approvals, and schedules.
- [ ] All three platforms use the Reason-like UI.
- [ ] Core local workspace flows work on all platforms.
- [ ] Cross-platform smoke tests pass.
- [ ] README and validation docs match the shipped artifacts.

## 9. Release checklist

- [ ] Typecheck, backend tests, smoke tests, visual baselines, axe scans, and E2E matrix pass.
- [ ] macOS app builds and launches from the packaged artifact.
- [ ] Manual VoiceOver and reduced-motion audit passes.
- [ ] DMG is signed, notarized, and stapled.
- [ ] Clean-Mac Gatekeeper check passes.
- [ ] Artifact hashes and sizes match `docs/validation.md`.
- [ ] README, roadmap, UI roadmap, validation, and research notes are current.
- [ ] Third-party notices, license, and privacy notes are included.
- [ ] Release tag and notes are created.

## 10. Immediate next actions

1. Run the manual VoiceOver and reduced-motion audit on the packaged macOS app.
2. Decide universal vs arm64.
3. Obtain signing credentials and complete Developer ID/notarization.
4. Add retry/more message actions and image/PDF attachments.
5. Tag a macOS release candidate after the manual audit.

Current environment limitations:

- No signing credentials are available.
- No clean Mac is available for Gatekeeper verification.
- No Windows VM/device, Android device, or emulator is available.
- Windows and Android work remains paused by the current scope.
