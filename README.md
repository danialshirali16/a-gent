# A Gent

A local workspace for connected AI agents, with its own React interface, Node host, Electron shell, branding, and data store.

[Source repository](https://github.com/danialshirali16/a-gent)

> Approved target: **personal macOS v1.0, Codex only**. The current source is still 0.1.0 and has not yet been restricted or verified to that target. The installable candidate remains pending; Windows/Android and broader product work are paused.

## Project documentation

Start with the [documentation index](docs/README.md), then follow the [ordered v1 roadmap](docs/project-roadmap.md#recommended-execution-order), [approved release contract](docs/release-contract.md), and [Mac setup/test guide](docs/macos-v1-testing.md).

[All 237 original tasks](docs/roadmaps/v1-triage.md) are classified once: **69 CONTINUE, 163 PAUSE, 5 CUT/RETHINK**. The release needs Codex chat/project work, persistence, drafts, approvals/Stop, recovery, current checks, and an actual Mac package pass. New two-peer benchmark prerequisites are [waived for that corrective release scope](docs/release-contract.md#d-11-benchmark-policy); implementation/runtime/package verification remains required.

The [current state](docs/current-state-review.md) distinguishes implemented source from partial workflows. The 18-component pass is historical; picker normalization and Unicode search now exist, while [remaining picker gaps](docs/model-options-stress-test.md#current-status-after-provider-changes) and main-flow failures remain. Earlier suite/artifact records do not certify this source.

## Run on this Mac

The personal v1 candidate must launch A Gent.app from Finder, start its bundled loopback host, pair automatically, and retain data in Electron's userData/workspace location. Current package acceptance is pending. Expected Mac data location and backup/token details are in the [test guide](docs/macos-v1-testing.md#data-location-and-backup).

For source development, use Node 24.x and the lockfile:

    npm ci
    npm run build
    npm start

Open http://127.0.0.1:4317 and pair with the source host's administrator token in .data/.token, or opt into AGENT_ALLOW_LOCAL_TOKEN_INJECTION=1 for local browser convenience. The packaged app uses automatic cookie/device pairing. Development server: npm run dev.

Desktop development additionally needs the pinned Electron runtime:

    npm run desktop:runtime
    npm run desktop:dev

Electron downloading must be explicit when npm install-script policy skips it. Finder discovery must be tested with GUI PATH; developer-specific Homebrew paths are not universal setup instructions.

## Connect models and apps

The approved personal v1 runtime is **Codex**. Install the supported CLI independently, run codex login in a terminal if needed, then Check connection in A Gent. The adapter uses the local runtime's account state without copying account tokens. Startup compatibility and full missing-runtime/login recovery remain required work.

Codex Chat requests a read-only sandbox; Work in project uses a selected folder and workspace-write policy. A Gent renders supported command/file/access approval requests and native questions. A permitted workspace write may not request approval; genuine permission requests need their own acceptance test.

**Deferred source integrations:** OpenCode currently uses --auto and does not enforce an equivalent Chat/Work contract; its auth/session/event/process cleanup remains incomplete. Cloud/OpenAI-compatible, Ollama, and the Gemini endpoint labeled Antigravity remain experimental/deferred source adapters, not personal-v1 launch support. macOS API keys currently default to Keychain through the security CLI, with AGENT_SECRET_STORAGE=session for memory-only mode; existing session-only form copy is stale.

MCP/Connected Apps inventory, inspection, Codex OAuth start/status, reload, and supported forms exist. Full add/adopt/scope/enable/remove and real connector acceptance remain incomplete and paused. Custom reasoning controls, Agent skill management, and ElevenLabs STT are also deferred; the v1 path uses provider-default reasoning and reviews inherited runtime tools before acceptance.

Official runtime references: [Codex app-server](https://learn.chatgpt.com/docs/app-server), [OpenCode CLI](https://opencode.ai/docs/cli). See [validation](docs/validation.md) for the distinction between source, fixtures, real services, and actual packages.

## Windows

Windows work is paused under the current macOS-only scope. The previous build targets x64; the installer and portable executable include the UI and local host. Install/sign into Codex on that computer, or connect a model endpoint in Connections. Windows packages are cross-built from macOS and require a Windows runtime check before distribution.

## Android and a shared workspace

Android work is paused under the current macOS-only scope. The APK is a companion client. It connects to an A Gent host running on a Mac, Windows, or other supported Node computer. It does not run desktop Codex processes on the phone.

1. Run one persistent host for the workspace you want to share.
2. Make that host reachable through a private HTTPS connection or an HTTPS reverse proxy you control.
3. Create a dedicated device token for the phone with the administrator token (see **Device pairing tokens**).
4. Open A Gent on Android and enter the host’s HTTPS address and that device token.

The host address is remembered on the device. The device token remains in the current app session. To use the same workspace on a desktop client, choose **Connections → Connect another host**. Do not run two host processes against the same data directory.

## Device pairing tokens

For source runs, the token in `.data/.token` (or `AGENT_TOKEN`) is the host administrator token. The packaged app uses its resolved workspace directory; see [data location](docs/macos-v1-testing.md#data-location-and-backup). It can create, rotate, and revoke per-device tokens. Device tokens are stored as SHA-256 hashes in `devices.json`; the plaintext token is returned only when it is created or rotated.

In the desktop app, open **Settings → Devices**. An administrator session can create tokens for other devices. A device session can rotate or revoke its own token.

```sh
TOKEN=$(cat .data/.token)
HOST=http://127.0.0.1:4317

# Create a token for one device. Save the returned token.
curl -s -X POST "$HOST/api/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Android phone"}'

# List devices (administrator view).
curl -s "$HOST/api/devices" -H "Authorization: Bearer $TOKEN"

# Rotate a device token. The previous token stops working immediately.
curl -s -X POST "$HOST/api/devices/<device-id>/rotate" -H "Authorization: Bearer $TOKEN"

# Revoke a device. Access stops immediately and survives restarts.
curl -s -X DELETE "$HOST/api/devices/<device-id>" -H "Authorization: Bearer $TOKEN"
```

A device token can read and rotate or revoke its own record but cannot manage other devices. If a desktop device token is revoked, its next launch falls back to the administrator cookie and creates a fresh device record. Use HTTPS for remote access and give each phone or computer its own token.

The host defaults to loopback. No public service or tunnel is created by the build. Available host configuration:

| Variable | Purpose |
| --- | --- |
| `AGENT_PORT` | Host port; defaults to 4317. |
| `AGENT_HOST` | Listen address; defaults to `127.0.0.1`. |
| `AGENT_DATA_DIR` | Persistent workspace directory; source start defaults to `.data`. |
| `AGENT_TOKEN` | Optional existing administrator pairing token, at least 24 characters. Otherwise generated in the data directory’s `.token` file. |
| `AGENT_ALLOWED_HOSTS` | Extra accepted hostnames, comma separated. |
| `AGENT_ALLOWED_ORIGINS` | Extra accepted browser origins, comma separated. Capacitor’s local origin is already accepted. |
| `AGENT_ALLOW_LOCAL_TOKEN_INJECTION` | Set to `1` to embed the pairing token in local browser HTML. Off by default; the desktop app uses a pairing cookie instead. |

An HTTPS reverse proxy should preserve the backend authority in its upstream Host header, such as `127.0.0.1:4317`, forward the client identity, disable response buffering for `/api/events`, and allow streaming connections. Add the external browser origin to `AGENT_ALLOWED_ORIGINS` when accessing through a web browser. Remote requests receive no embedded pairing token and require manual pairing.

## Keyboard

- `⌘ K` search conversations.
- `⌘ N` new conversation.
- `⌘ \` toggle the side panel.
- `Esc` closes menus, dialogs, and the side panel.
- Arrow keys, Home, and End navigate menus, the model picker, and side-panel tabs.

## Builds and checks

```sh
npm run typecheck
npm test
npm run test:ui
npm run test:visual
npm run test:a11y
npm run test:e2e
npm run desktop:mac
```

Windows and Android build commands remain available in `package.json` for the paused cross-platform work, but were not run in the current macOS-only pass.

Historical component-pass validation recorded 17/17 backend tests, 18/18 smoke tests, 10/10 visual baselines, 7/7 axe scans, and 7/7 E2E workflows passing. Those results predate current foundation/provider/MCP changes. See [validation](docs/validation.md) for the blocked fresh baseline, supplementary tests, current findings, and required package checks.

`dist/THIRD_PARTY_NOTICES.txt` includes bundled dependency licenses, including `bot-avatars@0.2.2` under MIT.

All 18 component families have shared implementations and development previews; [the UI Roadmap](docs/ui-roadmap.md#component-progress) owns their checklist and follow-up work. Agent avatars use pinned `bot-avatars@0.2.2` with an inline 18-shape picker, saved preferences, full motion, lazy fallback, and live reduced-motion handling. Run `npm run dev` and open `/?component=field` or another preview ID. The catalog stress harness is `/?component=composer&stress=model-options&data=worst`; these previews are development-only. See [component notes](docs/component-notes.md) and [the Search review](docs/search-component.md).

Visual baselines live in `tests/ui/visual.spec.ts-snapshots/` and are generated on macOS arm64 with Chrome. Refresh them with `npm run test:visual:update` after an intentional UI change.

Android builds require JDK 21, the Android SDK and its accepted licenses. The project includes a Gradle wrapper. The delivered APK uses the development signing key; production signing and store publication are separate steps. Desktop packages are local development builds, with no commercial code-signing certificate or notarization.

## What this version covers

This is a functional independent implementation of the core personal-agent workspace. It uses the local Codex and OpenCode tool ecosystems and model endpoints. Reason’s private cloud service, billing, proprietary agent network, native computer-control system, browser extension, voice calls, and signed automatic updates are not reproduced. Schedules run once while the host is open; there is no hosted scheduler.

See [the reverse-engineering findings](docs/reverse-engineering.md) for the inspected artifact identity, evidence references, and limits, and [validation](docs/validation.md) for the checks performed on this build.

## Source layout

`src/` contains the shared React interface, `server/` the local host and Codex/OpenCode agent adapters, `shared/` the API types, `electron/` the desktop shell, and `android/` the paused Capacitor project. Workspace data and provider secrets are excluded from the source archive and packaged builds.
