# A Gent — Main Project Roadmap

Status: active  
Date: 2026-11-04  
Branch: `ui/reason-style`  
Latest UI commit: `1fe01c4`  
Baseline commit: `b0a18fe`

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
- Custom agents with instructions, icon, color, provider, model, and reasoning effort.
- Groups and search.
- Streamed replies.
- Project folders.
- Visible tool activity.
- Command/file/permission approvals.
- Run interruption.
- One-time scheduled tasks.
- Workspace import/export.
- Codex local execution through the app-server interface.
- Ollama and OpenAI-compatible chat providers.
- Local token auth, host/origin allowlists, Electron sandboxing.
- 7 backend integration tests.
- Typecheck and production build pass.

### Reason-like UI

Implemented on `ui/reason-style`:

- Reason-derived light/dark design tokens.
- 280px sidebar, inset chat surface, centered agent pill.
- Agent rows with solid color icons.
- Compact 64px sidebar rail.
- Chat bubbles, date separators, hover actions.
- Tool stream with Compact / Verbose / Hidden setting.
- One-line composer with plus menu and combined model/effort pill.
- Settings modal with left navigation and search.
- Connections modal with models, local MCP apps, and host pairing.
- Agents and Scheduled modals.
- 480px side panel with Session, Sessions, and Activity tabs.
- Code-block copy buttons.
- Centered model/effort change events.
- Electron hidden title bar, traffic-light padding, Windows title-bar overlay.
- Accessibility improvements: `aria-live`, `aria-current`, visible run errors, improved contrast.

Not finished:

- Agent groups in the sidebar.
- Approvals inside the side panel.
- Files and Terminal tabs.
- Retry/more message actions.
- Full keyboard menu navigation.
- Playwright screenshot visual-regression baselines.
- Android back-button handling.
- Physical Android and Windows runtime checks.

### Built artifacts

| Platform | Artifact | Size | Status |
| --- | --- | ---: | --- |
| macOS arm64 | `release/A-Gent-0.1.0-mac-arm64.dmg` | 121 MB | Built; ad-hoc signed; not notarized |
| macOS arm64 | `release/A-Gent-0.1.0-mac-arm64.zip` | 118 MB | Built; ad-hoc signed; not notarized |
| Windows x64 | `release/A-Gent-Setup-0.1.0-x64.exe` | 120 MB | Built; unsigned; icon/metadata skipped |
| Windows x64 | `release/A-Gent-Portable-0.1.0-x64.exe` | 108 MB | Built; unsigned; icon/metadata skipped |
| Android | `release/A-Gent-0.1.0-android-debug.apk` | 4.1 MB | Built; debug-signed; companion client |

### Artifact hashes

```text
61434e53107a5f853087a85fcef75369b8d64f448e4b9725344de70a13796a1c  A-Gent-0.1.0-mac-arm64.dmg
05fbfb9f94ffec892913580186f65b02bc3cb7e303fb93c1954d793e379e1b19  A-Gent-0.1.0-mac-arm64.zip
4fdc030b006fe37a33acb3d53593446d458d0c3c59ba518cdb29d8eee1f54fb1  A-Gent-Setup-0.1.0-x64.exe
b1982c0612e4bcfcbfee361f4da34cb170f4be2d186e1855eb537d2eaa0cedb8  A-Gent-Portable-0.1.0-x64.exe
4fb2f074302af379eec6905306c8c07f46812a2d21041a7fab4d557cf39cb56f  A-Gent-0.1.0-android-debug.apk
```

### Verified on this machine

- `npm run typecheck` — passes.
- `npm test` — 6/6 backend tests pass.
- `npm run build` — passes.
- `npm run desktop:mac` — builds DMG and ZIP.
- `npm run desktop:win` — cross-builds NSIS installer and portable EXE.
- `npm run android:apk` — builds debug APK.
- Packaged macOS app launches and serves the UI.
- Real Codex 0.166.0 discovery works: account detected, models listed.
- Packaged macOS app visually verified with Computer Use: hidden title bar, traffic lights, sidebar, compact rail.
- Android APK metadata: package `com.agent.mobile`, minSdk 24, targetSdk 36, INTERNET permission.
- Android APK signature: Android Debug certificate.

### Not verified

- Windows installer/portable runtime on real Windows.
- Windows icon/version metadata.
- Android APK on a physical device or emulator.
- Android HTTPS host pairing, back button, safe areas, token persistence.
- macOS Gatekeeper on a clean Mac.
- macOS notarization.
- Windows code signing.
- Android release signing.
- Playwright screenshot visual-regression baselines.
- CI execution.

## 3. Completion assessment

These are engineering estimates, not precise metrics.

| Workstream | Done | Remaining | Notes |
| --- | ---: | ---: | --- |
| Core local workspace | 80% | 20% | Core chat/agents/schedules/approvals work; feature parity gaps remain |
| macOS delivery | 90% | 10% | Artifact built and app verified; signing/notarization/Intel missing |
| Windows delivery | 60% | 40% | Artifacts built; no runtime test, no icon metadata, unsigned |
| Android delivery | 40% | 60% | Debug APK built; companion-only, no device test, no release signing |
| Reason-like UI | 75% | 25% | Major surfaces done; tests and smaller interactions pending |
| Security and reliability | 65% | 35% | Data lock, recovery, CSP, and approval diffs added; token pairing and limits still need work |
| Tests and QA | 60% | 40% | Backend tests and Playwright smoke tests pass; device and visual-regression tests pending |
| Docs and release | 50% | 50% | README/roadmap exist; validation doc and release truth missing |
| Full Reason parity | 35% | 65% | Cloud/billing intentionally excluded; native/browser/voice/connectors missing |

**Against the original local-first Mac + Windows + Android goal: roughly 60–65% complete.**  
**Against full Reason parity: roughly 30–35% complete**, but cloud and billing are intentionally out of scope.

## 4. What is left

### A. Release truth and hygiene

- Update `README.md` so it matches the artifacts that now exist.
- Add `docs/validation.md` with commands, results, artifact hashes, and unverified areas.
- Decide whether to merge `ui/reason-style` into `main` or continue on the branch.
- Add a release checklist and artifact naming/version policy.
- Add a license and privacy/terms notes if distributing.

### B. Windows delivery

- Fix `win.signAndEditExecutable: false`: electron-builder reports that this skips icon and version metadata. Use `signExecutable: false` to skip only signing, or apply rcedit manually.
- Rebuild installer and portable with the icon/version metadata applied.
- Test on Windows 11 x64:
  - installer and portable launch
  - local host starts
  - Codex CLI discovery and sign-in
  - Ollama/OpenAI-compatible providers
  - project folder picker
  - approvals, interruption, schedules
  - title-bar overlay and drag regions
- Decide on code signing / SmartScreen guidance.
- Document Windows prerequisites.

### C. Android delivery

- Test the APK on a physical Android device or emulator.
- Decide: companion client vs standalone.
  - Companion is the current design and is realistic for v1.
  - Standalone would require a local model/runtime strategy; not recommended for v1.
- Improve pairing:
  - HTTPS host setup guidance
  - QR code or short pairing code
  - persistent secure token storage instead of re-entry every session
- Add Android back-button handling:
  - close modal
  - close side panel
  - close drawer
  - then exit
- Audit safe areas, keyboard behavior, touch targets, and file import/export in WebView.
- Add release signing and document sideload/store steps.
- Test against a host over HTTPS with a valid certificate.

### D. macOS delivery

- Replace ad-hoc signing with Developer ID signing.
- Notarize and staple the DMG/ZIP.
- Test on a clean Mac with Gatekeeper enabled.
- Decide whether to ship arm64 only or a universal build.
- Consider auto-update only after signing is stable.

### E. Security and reliability

- Redesign remote pairing so the token is not injected into HTML based on proxy-sensitive network heuristics.
- Add per-device tokens and token rotation/revocation.
- Add a data-directory lock to prevent two hosts clobbering state.
- Add rolling backups and recovery for corrupt `state.json`.
- Fix export/import size mismatch: export can exceed the 8 MB import limit.
- Fix attachment total-size validation (8 × 1 MB exceeds the JSON body limit).
- Add CSP `default-src`/`script-src`/`img-src`; decide whether remote Markdown images are allowed.
- Review provider URL SSRF exposure.
- Show file diffs in file-change approvals.
- Add “Allow for this session” and “Cancel turn” approval options.
- Add turn/approval timeouts.
- Test large workspaces and reduce full-state SSE payloads if needed.

### F. UI completion and testing

- Merge or finish the paused UI branch.
- Add agent groups to the sidebar.
- Add approvals, Files, and Terminal to the side panel.
- Add retry/more message actions.
- Add full keyboard navigation for menus.
- Add Playwright screenshot visual coverage; smoke flows are in place.
- Audit contrast, focus, target sizes, and screen-reader behavior.
- Remove the unused page views from `views.tsx` by extracting `ProviderCard`.

### G. Local feature parity

Decide which are in scope:

- Image/PDF/binary attachments.
- Project file browser and diff review.
- Recurring schedules.
- Conversation retry/branching.
- Notifications for scheduled tasks and approvals.
- Token/cost/rate-limit display.
- Multi-agent teams.
- Local MCP app authentication flow.
- Voice input/chat.
- Native computer control and browser extension.

Out of scope unless explicitly added:

- Reason cloud computer.
- Reason hosted connectors/OAuth catalog.
- Billing, usage, members, company.
- Trial/ad banner.
- Reason account/login.
- Signed automatic updates before signing is solved.

## 5. Scope decisions needed

| ID | Decision | Recommendation |
| --- | --- | --- |
| S1 | Android companion vs standalone | Companion for v1; standalone is a separate product |
| S2 | Full Reason parity vs core local workspace | Core local workspace plus selected local parity features |
| S3 | Mac arm64-only vs universal | Universal if Intel users matter; otherwise arm64 |
| S4 | Windows code signing | Sign before public distribution; unsigned for internal testing |
| S5 | Remote access model | Per-device tokens + HTTPS reverse proxy; no public tunnel by default |
| S6 | Native computer control / browser extension / voice | Separate subsystem, not part of v1 |

## 6. Roadmap

### Phase 0 — Release truth and UI merge

**Goal:** Make the repository and artifacts describe reality.

- [ ] Update README artifact table and platform status.
- [x] Add `docs/validation.md` with current build/test evidence.
- [x] Merge `ui/reason-style` into `main`.
- [ ] Tag a build (`v0.1.0-ui` or similar).
- [x] Record artifact hashes and sizes.
- [ ] Add release checklist.

**Exit:** main/branch is green; docs match artifacts; no false delivery claims.

**Effort:** 1–2 days.

### Phase 1 — Windows delivery

**Goal:** A Windows user can install, launch, and use A Gent.

- [x] Fix Windows icon/version metadata (`signExecutable: false`).
- [x] Rebuild setup and portable artifacts.
- [ ] Test on Windows 11 x64.
- [ ] Verify Codex discovery/sign-in and HTTP providers.
- [ ] Verify project folder picker, approvals, interruption, schedules.
- [ ] Verify title-bar overlay and drag regions.
- [ ] Document Windows prerequisites and SmartScreen behavior.
- [ ] Decide signing plan.

**Exit:** installer and portable both pass a Windows smoke test.

**Effort:** 3–5 days, dominated by Windows runtime access.

### Phase 2 — Android delivery

**Goal:** A phone can install the APK, pair with a host, and use the workspace.

- [ ] Test APK on a physical device/emulator.
- [x] Add Android back-button handling.
- [ ] Add persistent secure token storage.
- [ ] Add QR/short-code pairing if feasible.
- [ ] Verify HTTPS host pairing.
- [ ] Verify safe areas, keyboard, touch targets.
- [ ] Verify import/export in WebView.
- [ ] Add release signing.
- [ ] Document companion setup and limitations.

**Exit:** a real Android device completes pairing, chat, approval, and scheduled-task flows.

**Effort:** 5–8 days.

### Phase 3 — macOS release hardening

**Goal:** A clean Mac can open the app without security workarounds.

- [ ] Developer ID signing.
- [ ] Notarization and stapling.
- [ ] Clean-Mac Gatekeeper test.
- [ ] Decide universal vs arm64.
- [ ] Add signing steps to CI/release docs.

**Exit:** DMG opens on a clean Mac with Gatekeeper enabled.

**Effort:** 2–3 days, plus certificate/provisioning lead time.

### Phase 4 — Security and reliability

**Goal:** Safe for daily local use and remote pairing.

- [ ] Replace proxy-sensitive token injection.
- [ ] Add per-device tokens and rotation.
- [x] Add data-directory lock.
- [x] Add rolling backups and corrupt-state recovery.
- [ ] Finish import/export streaming; body limit raised to 32 MB.
- [x] Add CSP and remote-image policy.
- [ ] Review provider URL SSRF.
- [x] Add file-diff approvals; session approvals still pending.
- [ ] Add approval/turn timeouts.
- [ ] Add large-workspace/SSE performance checks.

**Exit:** security/reliability checklist passes; no known high-severity pairing or data-loss issue.

**Effort:** 4–6 days.

### Phase 5 — UI completion and test suite

**Goal:** Finish the Reason-like UI and protect it with tests.

- [ ] Agent groups in sidebar.
- [ ] Approvals in side panel.
- [ ] Files/Terminal tabs.
- [ ] Retry/more message actions.
- [ ] Full keyboard menu navigation.
- [x] Playwright smoke tests.
- [ ] Playwright screenshot visual baselines.
- [ ] Accessibility audit.
- [ ] Remove unused page views.

**Exit:** UI E2E and visual snapshots pass; accessibility has no serious issues.

**Effort:** 4–6 days.

### Phase 6 — Local feature parity

**Goal:** Close the most valuable local gaps.

Prioritize:

- [ ] Image/PDF/binary attachments.
- [ ] Project file browser and diff review.
- [ ] Recurring schedules.
- [ ] Conversation retry/branching.
- [ ] Notifications.
- [ ] Token/cost/rate-limit display.
- [ ] Multi-agent teams if still in scope.
- [ ] Voice/native/browser features only after separate approval.

**Exit:** agreed parity checklist is complete or explicitly deferred.

**Effort:** 5–10 days depending on scope.

### Phase 7 — Release

**Goal:** Ship a coherent multi-platform release.

- [ ] CI builds and tests on macOS, Windows, Android.
- [ ] Artifact checksums and release notes.
- [ ] License/privacy/terms.
- [ ] Final README and validation docs.
- [ ] Tag release.
- [ ] Smoke-test every artifact.

**Exit:** all three platforms have tested artifacts and accurate documentation.

**Effort:** 2–3 days.

## 7. Milestones

| Milestone | Definition |
| --- | --- |
| M0 | UI branch merged or explicitly paused; docs and artifacts truthful |
| M1 | Windows installer/portable pass a Windows smoke test |
| M2 | Android APK pairs with a host and passes device smoke test |
| M3 | macOS DMG is signed, notarized, and opens on a clean Mac |
| M4 | Security/reliability checklist passes |
| M5 | UI E2E/visual/accessibility pass |
| M6 | Agreed local parity checklist complete |
| M7 | v0.1.0 multi-platform release published |

## 8. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No Windows runtime available here | Windows artifacts unverified | Use a Windows VM/device or GitHub Actions Windows runner |
| No Android device/emulator available here | APK unverified | Use a physical device or set up an emulator |
| macOS ad-hoc signature | Gatekeeper blocks other Macs | Developer ID + notarization |
| Windows icon/metadata skipped | Generic Electron icon/metadata | Fix `signExecutable` and verify |
| Android companion only | User expects standalone | Decide S1 explicitly |
| Token pairing via proxy | Workspace compromise | Redesign pairing and add per-device tokens |
| State corruption | Data loss | Backups, lock, recovery |
| Scope creep | Delays | Keep cloud/billing/native/voice out of v1 |
| Full Reason parity expectation | Unbounded scope | Define “core local workspace + selected parity” |

## 9. Definition of done

The main target is done when:

- [ ] A clean Mac can install/open the signed/notarized app.
- [ ] A clean Windows machine can install/run the app and discover Codex.
- [ ] A real Android device can install the APK, pair over HTTPS, and use chat, approvals, and schedules.
- [ ] All three platforms use the Reason-like UI.
- [ ] No Reason cloud service, billing, or account is required.
- [ ] Core local workspace flows work on all platforms.
- [ ] Security/reliability checklist passes.
- [ ] Typecheck, backend tests, UI E2E/visual tests, and cross-platform smoke tests pass.
- [ ] README and validation docs match the shipped artifacts.

## 10. Immediate next actions

1. Test the Windows artifacts on a real Windows runtime.
2. Test the Android APK on a device/emulator.
3. Update README artifact/status text.
4. Start the security/reliability pass.
5. Add Playwright screenshot baselines.
6. Tag a release candidate after runtime checks.

Current environment limitations:

- No Wine, Windows VM, Android device, or emulator is available here.
- Windows and Android artifacts can be built but not runtime-verified on this machine.
