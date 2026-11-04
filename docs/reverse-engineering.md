# Reason desktop reconstruction findings

## Scope and evidence

Target: Reason Machines desktop 0.1.119, bundle ID `com.reasonmachines.desktop`, installed at `/Applications/Reason.app`.

REA 6.8.0 inspected `/Applications/Reason.app/Contents/Resources/app.asar` without executing its JavaScript. The archive SHA-256 is `a739beb5330c8b98783308374ace416cf8d6ae9bf9d42bfdccec710b59473070`.

Primary analysis Evidence: `ev_f1f02ce458a4741b0e024a73b5e452613fe8caaf0a0a20ecff32bc005bf22720` in `reason-asar.evidence.json`. Summary Evidence: `ev_5b334a1623930a2b3820d747caeccdda9c4d8df858136d875519a1c01bf58139` in `reason-asar.summary.json`.

REA parsed 45 JavaScript sources among 50 relevant files with no syntax parse failures. Application and semantic graph coverage is partial. The semantic graph reports 33,429 unknowns; graph expansion was resource-limited in several verification files. A parsed source does not imply complete behavioral understanding. The route inventory contains verification-fixture routes and must not be treated as an inventory of the hosted product.

Supplementary observations below come from bounded, read-only extraction of already-identified `dist/main.cjs` and `dist/preload.cjs` bytes from the archive. Their SHA-256 values exactly match the REA file identities:

- `dist/main.cjs`: `5cd87de5fe90ea18b6d08a4cf337249a2c5bc934bfcfd0162cb5aeeb99296fc6`.
- `dist/preload.cjs`: `33928eabdd321e34764b0acb33ff12b11238c5b5ca8fc865d027976c8f2765db`.

Offsets below are zero-based UTF-8 text character positions in these ASCII-dominant source files. They are lookup aids, not an assertion of byte-offset equivalence for all preceding Unicode. No original source is copied into the reconstruction.

## Observed desktop architecture

The package manifest declares `reason-desktop`, version 0.1.119, and Electron main entry `dist/main.cjs`. REA resolves this entry to an actual packaged file. The package's `renderer` field is null, which by itself does not prove where the main UI lives.

The main and preload source contain stable/staging hosted web-origin selection: `https://reasonmachines.com` and `https://staging.reasonmachines.com`. Startup selects a web origin using packaged/channel/development settings. The source contains auth handoff paths `/auth/desktop/connect` and `/app/auth/desktop`. These are static values; availability, navigation timing and server behavior are not established. Supplemental anchors: main positions approximately 281,080, 461,540 and 877,000; preload approximately 127,620 and 130,140.

The REA graph resolves the production Electron main entry node `jag_node_b1214434dceee4e9412c18f286b6efd3ad42184837193bfc2bb0dc952270851d`. Native desktop-mount panel and capture-overlay renderer HTML files are packaged separately. Several BrowserWindow/preload findings in the graph refer to `verification/` fixtures. Their preferences are test-fixture observations and must not be presented as production security settings.

## Observed bridge contracts

REA retains context-bridge exposures named `__REASON_DESKTOP__` and `__ARA_DESKTOP__`. The production bridge object is dynamic to the generic extractor, so REA reports unknown member inventory. Relevant production nodes are `jag_node_37a405ecec424d014333224b95ba5826db8f6bcf5b38959fa83ae2a2e75eab3b` and `jag_node_ef4a839915ee4f733b0fe2feb0467186b40669b4f7b9a27be604da75f3c30a5a`. The complete object near preload position 145,190 provides these static method families:

- Accounts: sign-in start/cancel, handoff/bootstrap/complete, session status/sign-out, list accounts and switch account.
- Local work: choose/grant project folders, add/remove local folder grants, enable local sessions, select device workspace and mark sessions ready/ended.
- Device connection: connect opt-ins, connection/capability state, reconnect/disconnect, wake events, keep-awake settings, SSH relay setup and keychain opening.
- Models: provider sign-in start/cancel, local model credentials, local subscription access and local auth status.
- Preview: create/sync/destroy local page previews, capture previews, navigate preview history and receive load/navigation events.
- Desktop integration: file downloads, microphone permission, notifications/settings, native shortcuts, reload/navigation, update check/install/defer/readiness, window transparency/close, operational metrics and telemetry.
- Desktop mount: read/mount/unmount, offer choices/preview, resolve prompts and receive changes/prompts. A separate capture overlay exposes pointer/region selection operations.

REA independently observes literal renderer IPC calls for many of these families, including `desktop:project-folder:choose`, `desktop:project-folder:grant`, `desktop:device:enable-local-sessions`, `desktop:local-models:credentials`, `desktop:local-auth:status`, `desktop:local-subscriptions:access`, `desktop:provider-connect:start`, `desktop:local-preview:sync`, `desktop:local-preview:capture` and `desktop:permission:microphone`. These are static call candidates, not proof that a matching handler executes or succeeds. Dynamic channels remain unresolved.

## Local CLI and model connection observations

The app includes a separate resource named `reason-cli`. Main contains platform-specific installer/update paths for Unix shell and Windows PowerShell. These commands were inspected as inert strings and were never executed. Supplemental anchor: main positions approximately 859,000–860,000 and 937,900.

Model/auth handler code invokes the local CLI adapter with subcommands `subscriptions`, `credentials` and `auth-status`, with 20–30 second request timeouts. A response parser recognizes provider IDs including `openai-codex`, `anthropic`, `xai` and `github`; auth-status values include authenticated, sign-in required, not installed and unavailable. This is a declared response contract, not evidence that any provider is currently connected. Supplemental anchor: main approximately 442,000–443,600 and 905,400–906,500.

The inspected local credential/subscription/auth handler family explicitly checks `process.platform === "darwin"`, the owning BrowserWindow/main frame, and an allowed renderer URL before proceeding. This observation applies to that handler family; it does not imply all Reason features are macOS-only. The separate CLI's implementation and model invocation protocol have not been analyzed.

## Persistence observations

Main references Electron's application user-data directory and an encrypted account vault created with `safeStorage` at `accounts.bin`. A persistent Electron partition is named `persist:ara-desktop`. Supplemental anchors: main approximately 879,000–881,400.

Additional named state files include window bounds, session destination, permission alerts, CLI login/install markers, device connection, pending update application, and optional sign-in-transfer/keychain migration state. Several writes use temporary-file publication and file mode 0600. These are declared local state mechanisms. No actual user-data file, saved credential, session cookie or account vault was opened.

The only `localStorage` node extracted by the generic graph is from a verification fixture. It is not evidence of real chat persistence. Hosted chat schema, messages, groups, personas, schedules, model accounting and synchronization remain unknown from this desktop archive.

## Implications for A Gent

1. Build an independent application service for chats, agents, groups, schedules and model orchestration. The inspected archive does not supply the hosted service implementation.
2. Keep the shared UI separate from a desktop/local-agent adapter. Mac and Windows can connect installed model CLIs through their own supported interfaces; Android needs either direct provider APIs or a paired companion service for desktop-only tools.
3. Define narrow folder grants and explicit project roots. The original bridge has dedicated choose/grant and device-scope contracts; a whole-device filesystem assumption would lose that distinction.
4. Keep provider secrets and local account state out of the renderer. Use each platform's supported credential storage or process-local configuration. Do not import Reason credentials or depend on Reason's private authentication APIs.
5. Treat native desktop control, browser integration, remote device pairing, signed updates and third-party app connectors as separate subsystems requiring their own implementation and verification. A similar UI does not establish their behavior.
6. Existing Reason desktop IPC names describe behavioral boundaries only. A Gent should define its own contracts and branding, with original code and assets.

## Remaining unknowns

- Hosted service internals, frontend source and complete feature/route inventory.
- The local CLI's full daemon, transport, tool-execution and model-session protocol.
- Runtime availability, error behavior and permissions for individual native integrations.
- Native Windows and Android implementation details and real cross-device synchronization.
- Full parity for autonomous agents, computer/browser actions, third-party OAuth connectors, scheduling infrastructure, billing and production distribution/signing.

No claim here establishes full Reason parity or observed execution. These findings are a bounded reconstruction brief backed by one installed desktop artifact.
