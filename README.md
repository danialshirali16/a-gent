# A Gent

A personal workspace for AI agents, built independently from the visible workflows of the installed Reason app. A Gent has its own code, branding, data store, and model connections.

The app includes persistent conversations, custom agents, agent groups, conversation groups, search, streamed model replies, project folders, visible tool activity, read-only workspace file browsing, terminal activity, action approvals, interruption, one-time scheduled tasks, and workspace import/export. Codex provides local agent execution. Ollama and OpenAI-compatible endpoints provide additional chat models.

## Run on this Mac

Open the packaged **A Gent.app** from the macOS build. It starts its own local host and stores its workspace in Electron’s application data directory. The app detects the existing Codex installation and sign-in. No Reason account or credentials are imported.

For the source project, use Node 24.22.2 or another runtime accepted by the installed dependencies:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4317` and pair with the administrator token from `.data/.token`, or set `AGENT_ALLOW_LOCAL_TOKEN_INJECTION=1` for local browser convenience. The packaged desktop app pairs automatically and upgrades its cookie to a per-device token. For development, use `npm run dev`. On this device, a compatible existing runtime is `/opt/homebrew/opt/node@24/bin/node`; place its directory first on PATH when using npm.

To launch the desktop shell from source:

```sh
npm run desktop:runtime
npm run desktop:dev
```

`desktop:runtime` downloads the pinned Electron runtime from its official release. It is explicit because this machine’s npm lifecycle policy skips automatic dependency install scripts.

## Connect models and apps

In **Connections**, check the Codex connection. If Codex is not installed or signed in on the host, install the official CLI and run `codex login` in a terminal. A Gent calls the supported app-server interface and uses its account state; it does not read or copy authentication tokens. Models are discovered from that installation.

The **Connected apps** section inventories the MCP connections already configured in Codex on the host. Their availability and authentication remain managed by Codex. A Gent does not register new connectors or reproduce Reason’s hosted OAuth service.

Ollama uses an existing local server, normally `http://127.0.0.1:11434`. For another provider, enter its OpenAI-compatible base URL, optional API key, and model ID. API keys are kept in host memory or supplied through environment variables, and must be re-entered after a host restart. HTTP providers support chat; project tools use Codex.

Select **Chat** for a read-only Codex session. Select **Work in project** and choose a host folder to allow workspace changes under Codex’s sandbox and approval rules. A Gent displays supported command, file, and access approval requests. Requests for richer MCP forms or interactive tool questions currently need completion in Codex itself.

Official integration references: [Codex app-server](https://learn.chatgpt.com/docs/app-server), [non-interactive Codex](https://learn.chatgpt.com/docs/non-interactive-mode).

## Windows

The Windows build targets x64. The installer and portable executable include the UI and local host. Install/sign into Codex on that computer, or connect a model endpoint in Connections. Windows packages are cross-built from macOS and require a Windows runtime check before distribution.

## Android and a shared workspace

The Android APK is a companion client. It connects to an A Gent host running on a Mac, Windows, or other supported Node computer. It does not run desktop Codex processes on the phone.

1. Run one persistent host for the workspace you want to share.
2. Make that host reachable through a private HTTPS connection or an HTTPS reverse proxy you control.
3. Create a dedicated device token for the phone with the administrator token (see **Device pairing tokens**).
4. Open A Gent on Android and enter the host’s HTTPS address and that device token.

The host address is remembered on the device. The device token remains in the current app session. To use the same workspace on a desktop client, choose **Connections → Connect another host**. Do not run two host processes against the same data directory.

## Device pairing tokens

The token in `.data/.token` (or `AGENT_TOKEN`) is the host administrator token. It can create, rotate, and revoke per-device tokens. Device tokens are stored as SHA-256 hashes in `devices.json`; the plaintext token is returned only when it is created or rotated.

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
npm run desktop:mac
npm run desktop:win
npm run android:apk
```

Visual baselines live in `tests/ui/visual.spec.ts-snapshots/` and are generated on macOS arm64 with Chrome. Refresh them with `npm run test:visual:update` after an intentional UI change.

Android builds require JDK 21, the Android SDK and its accepted licenses. The project includes a Gradle wrapper. The delivered APK uses the development signing key; production signing and store publication are separate steps. Desktop packages are local development builds, with no commercial code-signing certificate or notarization.

## What this version covers

This is a functional independent implementation of the core personal-agent workspace. It uses the local Codex tool ecosystem and model endpoints. Reason’s private cloud service, billing, proprietary agent network, native computer-control system, browser extension, voice calls, and signed automatic updates are not reproduced. Schedules run once while the host is open; there is no hosted scheduler.

See [the reverse-engineering findings](docs/reverse-engineering.md) for the inspected artifact identity, evidence references, and limits, and [validation](docs/validation.md) for the checks performed on this build.

## Source layout

`src/` contains the shared React interface, `server/` the local host and agent adapters, `shared/` the API types, `electron/` the desktop shell, and `android/` the Capacitor project. Workspace data and provider secrets are excluded from the source archive and packaged builds.
