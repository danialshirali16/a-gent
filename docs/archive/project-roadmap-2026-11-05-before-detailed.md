> Historical snapshot preserved before the detailed completion/release roadmap on 2026-11-05. Use the [current roadmap](../project-roadmap.md) for execution.

# A Gent project roadmap

Updated: 2026-11-05. Status: active. Branch: `main`. Active scope: **macOS only**; Windows and Android work remains paused.

[Documentation index](../README.md) · [Current state](../current-state-review.md) · [UI Roadmap](../ui-roadmap.md) · [Validation](../validation.md)

## Current objective

Complete and improve the independent A Gent workspace on macOS, using Reason's visible workflows as a reference while keeping A Gent's code, branding, local data, and provider integrations. Reason's private cloud and billing are outside scope. The original Mac/Windows/Android goal remains recorded; cross-platform runtime work resumes only when that scope changes.

## Current status

| Workstream | Implemented or recorded | Remaining |
| --- | --- | --- |
| Local workspace | Persistent chats, custom agents/groups, search, streamed replies, projects, activity, approvals, Stop, one-time schedules, import/export, Files/Terminal panels | Retry/branching, recurring schedules, binary attachments, deeper file/diff workflows |
| Providers | Codex app-server, OpenCode CLI, Antigravity/Cloud/Ollama/OpenAI-compatible HTTP chat | Catalog hardening and provider/session reliability findings |
| UI | Initial 18-component pass, bot avatars, Search fixes, reference-layout connected-only model picker | Seven modelOptions findings, manual accessibility, latest release regression checks |
| macOS delivery | Earlier arm64 DMG/ZIP built and launched; ad-hoc signed | Rebuild latest picker source, package verification, Developer ID/notarization, clean-Mac test, Intel/universal decision |
| Windows / Android | Earlier unsigned Windows packages and debug Android companion APK | Paused; no current runtime certification |
| Validation | Historical full component suites; latest focused checks described in validation record | Full suites and packaged checks for the latest source |

The detailed earlier phases and percentage estimates are preserved in [the historical plan](project-roadmap-2026-11-04.md). Progress here is based on observable milestones rather than percentage estimates.

## Immediate next actions

1. Review the seven [modelOptions findings](../model-options-stress-test.md#what-broke), then apply the selected corrections and verify Demo/Worst/Empty/One/Huge/Invalid-ID states again. The invoked break-ui workflow reports before fixing.
2. Revisit the three backend findings in [current state](../current-state-review.md#backend-findings-tracked-from-the-earlier-review); record fixes or fresh reproductions before closing them.
3. Run the release test suites against the resulting source, rebuild the macOS package, and record package hashes and runtime evidence.
4. Complete packaged VoiceOver/reduced-motion checks and large-workspace/SSE profiling.
5. Decide arm64 versus universal delivery and complete signing/notarization before a release candidate.

## Product and reliability backlog

| Area | Open work |
| --- | --- |
| Model catalogs | Empty/duplicate IDs, blank names, identical display names, canonical Unicode search, result scroll reset, count copy, consistent string limits; [full report](../model-options-stress-test.md) |
| Device streams | Verify that rotation/revocation terminates streams belonging to the affected device |
| OpenCode Stop | Keep children tracked through exit and verify escalation for a child that ignores SIGTERM |
| Provider sessions | Bind resume IDs to their provider or rebuild the binding when changing provider |
| Host reliability | Import/export streaming and 32 MB limit, provider URL/SSRF review, approval/turn timeouts, large-workspace/SSE load |
| Conversation actions | Retry/regenerate, branching, and remaining message actions |
| Files and attachments | Image/PDF/binary attachments, richer browsing and diff review |
| Scheduling | Recurring schedules and notifications for scheduled work/approvals |
| Usage and integrations | Token/cost/rate-limit display, local MCP authentication flow, multi-agent teams if still in scope |
| Separate future scope | Voice, native computer control, browser extension, and signed automatic updates |

OpenCode currently uses its CLI with `--auto`; stricter tool permissions are configured in OpenCode. Cloud and Antigravity are user-configured HTTP endpoints, rather than Reason's hosted services.

## UI continuation

[UI Roadmap](../ui-roadmap.md) owns the 18-family checklist, component workflow, and UI continuation point. The base component pass is complete; the model picker stress findings are a follow-up. Use [component notes](../component-notes.md) for APIs and [the picker review](../model-picker-review.md) for the earlier normal-fixture implementation checks.

The stress harness is development-only: `/?component=composer&stress=model-options&data=worst`. Its dataset toggle persists in the URL. Production components have not been changed by that audit.

## Release gates

- [ ] Selected model catalog fixes applied and every fixture rechecked.
- [ ] Earlier backend findings reverified and addressed or explicitly dispositioned.
- [ ] Typecheck, backend, smoke, visual, axe, and E2E suites pass against the release source.
- [ ] Packaged macOS app rebuilt and launched with latest JS/CSS; artifact checksums recorded.
- [ ] VoiceOver, reduced motion, actual 200% zoom, and forced-colors checks recorded where applicable.
- [ ] Large-workspace/SSE and catalog performance checks recorded.
- [ ] arm64/universal decision documented.
- [ ] Developer ID signing, notarization/stapling, and clean-Mac Gatekeeper check complete.
- [ ] Third-party notices verified in the package; project license/privacy/release notes finalized.
- [ ] Release tag and notes created.

`npm run build` already generates bundled third-party notices, including bot-avatars. That generation is separate from reviewing the release's license/privacy material and verifying the packaged notice.

## Paused platform work

| Platform | Resume checklist |
| --- | --- |
| Windows | Windows 11 install/portable runtime, provider discovery, folder picker, approvals/Stop/schedules, title-bar regions, icon/SmartScreen checks, signing |
| Android | Physical device/emulator, HTTPS pairing, secure persistent token storage, QR pairing decision, back button, safe areas/keyboard/touch, WebView import/export, release signing |
| Cross-platform CI | Run the appropriate platform build/test matrix after those platforms resume |

The Android app is a companion to a persistent host; it does not run desktop agent processes on the phone. Earlier artifacts and their recorded hashes are in [validation](../validation.md#artifacts), not evidence of current platform readiness.

## Documentation ownership

- Current source/release state and tracked issues: [current-state-review.md](../current-state-review.md).
- Product priorities and release gates: this roadmap.
- UI/component progress: [ui-roadmap.md](../ui-roadmap.md).
- Executed checks and artifact evidence: [validation.md](../validation.md).
- Detailed reproductions and proposed corrections: focused review documents linked from [the index](../README.md).

Update the affected owner document after each change, and append scoped validation evidence. A completed historical suite or component pass does not close a later finding.
