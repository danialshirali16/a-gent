# A Gent

A local workspace for connected AI agents, with its own React interface, Node host, Electron shell, branding, and data store.

[Source repository](https://github.com/danialshirali16/a-gent)

> Approved target: **personal macOS v1.0, Codex only**. Current source is 1.0.0, Codex-only, provider-default reasoning, with one active run per host. The Windows source baseline and fixture/browser/real-Codex checks pass; a current macOS package and the owner's Finder acceptance remain pending. Windows/Android and broader product work are paused.

## Project documentation

Start with the [documentation index](docs/README.md), then follow the [ordered v1 roadmap](docs/project-roadmap.md#recommended-execution-order), [approved release contract](docs/release-contract.md), and [Mac setup/test guide](docs/macos-v1-testing.md).

[All 237 original tasks](docs/roadmaps/v1-triage.md) are classified once: **69 CONTINUE, 163 PAUSE, 5 CUT/RETHINK**. The release needs Codex chat/project work, persistence, drafts, approvals/Stop, recovery, current checks, and an actual Mac package pass. New two-peer benchmark prerequisites are [waived for that corrective release scope](docs/release-contract.md#d-11-benchmark-policy); implementation/runtime/package verification remains required.

The [current state](docs/current-state-review.md) and [validation](docs/validation.md#personal-v1-implementation-pass-2026-11-05) distinguish fixture, browser, real-Codex, and packaged-Mac evidence. The documented core failures (initial-save phantom run, stale Forget probe, premature Stop, export bindings, draft loss) have source regressions. The 18-component pass and old artifacts do not certify a Mac package.

## Run on this Mac

The personal v1 candidate must launch A Gent.app from Finder, start its bundled loopback host, pair automatically, and retain data in Electron's userData/workspace location. No current Mac artifact exists yet; confirm the Mac chip/macOS version, build on a Mac, and follow the [test guide](docs/macos-v1-testing.md) before accepting it.

For source development, use Node 24.x and the lockfile:

    npm ci
    npm run typecheck
    npm test
    npm run build
    npm start

Open http://127.0.0.1:4317 and pair with the source host's administrator token in `.data/.token`, or opt into `AGENT_ALLOW_LOCAL_TOKEN_INJECTION=1` for local browser convenience. The packaged app uses automatic cookie/device pairing. Development server: `npm run dev`.

Desktop development additionally needs the pinned Electron runtime:

    npm run desktop:runtime
    npm run desktop:dev

For the Mac candidate:

    npm run desktop:runtime
    npm run desktop:mac

Expected data: `~/Library/Application Support/A Gent/workspace` (conversations/state/backup/token) and the app's local storage for unsent drafts. Drafts survive normal relaunch but are not in workspace export. Electron downloading must be explicit when npm install-script policy skips it. Finder discovery must be tested with GUI PATH; developer-specific Homebrew paths are not universal setup instructions.

## Connect Codex

The approved personal v1 runtime is **Codex**. Install the supported 0.166.x CLI independently, run `codex login` in a terminal if needed, then **Check connection** in A Gent. The adapter uses the local runtime's account state without copying account tokens. A missing or unsupported CLI reports install/upgrade guidance; a signed-out account reports `codex login` guidance.

Codex Chat requests a read-only sandbox; Work in project uses the selected native folder and workspace-write policy. A Gent renders command/file/access approvals and supported native questions. The real-source approval check declined an outside-workspace write (no file) and accepted a repeated request (only the requested file). A permitted workspace write alone does not prove approval handling.

**Scope gates:** Only Codex is exposed in v1. OpenCode, Cloud/OpenAI-compatible, Ollama, and the Antigravity/Gemini entry are paused adapters; their connect/test/agent/conversation routes return 409 while saved records remain. Connected Apps management, app-record/auth/reload mutations, custom reasoning controls, Agent skill management, ElevenLabs STT, and remote-device creation are not advertised. Saved settings/data and the external Codex config are preserved.

A Gent withholds inherited skill instructions, disables configured MCP servers per Codex session, and disables plugin/app/hook/multi-agent features without rewriting `~/.codex/config.toml`. The real probe reported all configured external MCP servers `disabled` in the A Gent thread.

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

In the desktop app, open **Settings → Devices**. This Mac pairs automatically and can rotate or revoke its own device token. Remote-device creation is not advertised in the personal-v1 UI; the administrator API remains available for later work but is not a v1 launch promise.

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

Windows and Android build commands remain available in `package.json` for the paused cross-platform work. CI runs macOS desktop packaging by default; Windows/Android are opt-in via the workflow dispatch input.

Current source evidence (Windows x64 development host, not a Mac package result): `npm ci`, typecheck, and build pass; 73/73 server tests, 22/22 browser smoke, 7/7 E2E, and 7/7 axe scans pass. Real Codex chat/continuation/host-restart/Stop/Work/approval probes passed with an isolated workspace. Visual baselines are macOS-only and were not rerun; VoiceOver/actual zoom, Finder launch, native dialog, and the packaged Mac pass remain open. See [validation](docs/validation.md#personal-v1-implementation-pass-2026-11-05).

`dist/THIRD_PARTY_NOTICES.txt` includes bundled dependency licenses, including `bot-avatars@0.2.2` under MIT.

All 18 component families have shared implementations and development previews; [the UI Roadmap](docs/ui-roadmap.md#component-progress) owns their checklist and follow-up work. Agent avatars use pinned `bot-avatars@0.2.2` with an inline 18-shape picker, saved preferences, full motion, lazy fallback, and live reduced-motion handling. Run `npm run dev` and open `/?component=field` or another preview ID. The catalog stress harness is `/?component=composer&stress=model-options&data=worst`; these previews are development-only. See [component notes](docs/component-notes.md) and [the Search review](docs/search-component.md).

Visual baselines live in `tests/ui/visual.spec.ts-snapshots/` and are generated on macOS arm64 with Chrome. Refresh them with `npm run test:visual:update` after an intentional UI change.

Android builds require JDK 21, the Android SDK and its accepted licenses. The project includes a Gradle wrapper. The delivered APK uses the development signing key; production signing and store publication are separate steps. Desktop packages are local development builds, with no commercial code-signing certificate or notarization.

## What this version covers

This is a functional independent implementation of the personal-agent workspace. The active v1 path uses the local Codex CLI and its external account; OpenCode and additional model endpoints remain paused source adapters. Reason’s private cloud service, billing, proprietary agent network, native computer-control system, browser extension, voice calls, and signed automatic updates are not reproduced. One-time schedules run while the host is open; there is no hosted scheduler. Scheduling expansion, uploads, branches, skills management, speech, and connected-app management are deferred.

See [the reverse-engineering findings](docs/reverse-engineering.md) for the inspected artifact identity, evidence references, and limits, and [validation](docs/validation.md) for the checks performed on this build.

## Source layout

`src/` contains the shared React interface, `server/` the local host and Codex/OpenCode agent adapters, `shared/` the API types, `electron/` the desktop shell, and `android/` the paused Capacitor project. Workspace data and provider secrets are excluded from the source archive and packaged builds.
