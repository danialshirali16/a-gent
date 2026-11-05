# Runtime and capability baseline

Status: **Recorded for FND-002 on 2026-11-05.** This is the versioned baseline that the release contract and adapters build against. It records interfaces, not authenticated journeys. A catalog read is not proof of inference access, and a generated schema is not proof that every method is supported by a user's account.

[Release contract](release-contract.md) · [BEN-001 record](benchmarks/BEN-001-foundations.md) · [Support matrix](support-matrix.md) · [Validation](validation.md)

## Environment

| Item | Recorded value |
| --- | --- |
| Capture date | 2026-11-05 |
| Repository | `c47f1550fac67cbc1c5ceed45f0826a4c92f120e` (`main`) |
| Probe host | Windows 11 x64, Node 26.12.1, npm 11.20.0 |
| Release target | macOS 13+ arm64; Electron 45.2.2; Node 24.x packaging |
| Codex CLI | 0.166.0 (`codex-cli 0.166.0`) |
| OpenCode CLI | 2.2.5 (`opencode v2.2.5`) |
| Electron | 45.2.2; Chromium 156.0.8078.80; Node 24.22.2; V8 15.6.75.27 |
| Lockfile | npm lockfile v3 |

## Supported version matrix

| Component | Supported / tested | Notes |
| --- | --- | --- |
| Node (build/tooling) | >=22.12.0 | `package.json` `engines`; release packaging uses Node 24.x. |
| Node (bundled runtime) | 24.22.2 | Bundled by Electron 45.2.2. |
| Node (development) | 24.x LTS recommended; 26.12.1 used for this probe | Node 26 is not a release guarantee. |
| Electron | 45.2.2 exactly | macOS 13+; end of support 2027-04-27. |
| TypeScript | 7.0.2 exactly | From the lockfile. |
| React / Express / Vite / Playwright | 19.3.1 / 5.3.0 / 8.3.5 / 1.64.1 | From the lockfile; UI/QA checks use these versions. |
| Codex CLI | 0.166.0 exactly for the R1 baseline | Probe at startup; unsupported or changed schema must fail closed for the affected adapter. |
| OpenCode CLI | 2.2.5 exactly for the R1 baseline | Probe at startup; the v2 server API differs from older public docs. |
| Reason reference | Desktop 0.1.119 artifact; 0.1.120/current docs as workflow reference | Not a runtime dependency and not shipped with A Gent. |

## Codex app-server baseline

Generated with:

```powershell
codex app-server generate-json-schema --out <temp-dir>
```

The checked-in fixture is `tests/fixtures/runtime-baselines/codex-0.166.0/`.

| Measurement | Value |
| --- | ---: |
| Client request methods | 106 |
| Server-initiated request methods | 10 |
| Selected schema files in fixture | 26 |
| Model reasoning fields | `defaultReasoningEffort`, `supportedReasoningEfforts` present |

### Methods used by A Gent

| Method | Use in source | Baseline status |
| --- | --- | --- |
| `initialize` | Handshake with `clientInfo` and `experimentalApi: true` (`server/codex.ts:91`) | Present |
| `account/read` | Read account/auth state (`server/codex.ts:97`) | Present |
| `model/list` | Paginated model catalog (`server/codex.ts:101`) | Present; reasoning metadata is currently discarded |
| `thread/start` | New Codex thread (`server/codex.ts:150`) | Present |
| `thread/resume` | Continue a stored thread (`server/codex.ts:144`) | Present |
| `turn/start` | Send input and start a turn (`server/codex.ts:267`) | Present |
| `turn/interrupt` | Stop a turn (`server/codex.ts:178`) | Present |
| `mcpServerStatus/list` | App inventory (`server/codex.ts:118`) | Present |
| `item/commandExecution/requestApproval` | Command approval | Present |
| `item/fileChange/requestApproval` | File-change approval | Present |
| `item/permissions/requestApproval` | Permission approval | Present |
| `mcpServer/elicitation/request` | Declined with a status activity (`server/codex.ts:193`, `:223`) | Present; fallback is temporary, not a complete UI |
| `item/tool/requestUserInput` | Answered with `{}` plus an activity (`server/codex.ts:228`) | Present; fabricated/empty answer is a known gap |

### Available but not used in R1

The 0.166.0 schema also includes account login/logout, rate limits, app list/read/installed, MCP OAuth login and tool call, config read/write, skills list/config/extra roots, plugin/marketplace methods, thread list/read/fork/archive/delete/turns/items, and file-system methods. These are not R1 commitments until a task and benchmark authorize them. In particular, plugin/marketplace methods are marked experimental/under development by the upstream docs.

### Codex contract notes

- `thread/start` accepts `sandbox` as `SandboxMode` (`read-only`, `workspace-write`, `danger-full-access`); `turn/start` accepts `sandboxPolicy` as the structured `SandboxPolicy`. The adapter uses both forms.
- `turn/start.effort` is a non-empty string in the schema. A Gent currently allowlists `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; the real per-model options must come from `model/list` (EFF-001–012). A value outside the verified set must not be guessed.
- `thread/resume` requires `threadId`; `excludeTurns` is supported. A resume failure caused by a missing/foreign thread is recovered by starting a fresh thread, but the current stored `providerThreadId` has no provider/account binding (FND-007).
- The generated schema is version-specific. Do not copy these fixtures into runtime logic; use them to detect drift and to test parsing.

## OpenCode 2.2.5 baseline

Generated from the installed v2 server/CLI:

```powershell
opencode api GET /openapi.json
```

The checked-in fixture is `tests/fixtures/runtime-baselines/opencode-2.2.5/openapi.json`; the manifest records the hash and key operations.

| Measurement | Value |
| --- | ---: |
| OpenAPI version | 3.1.0 |
| Paths | 138 |
| Operations | 169 |

### Capabilities relevant to A Gent

| Area | 2.2.5 surface | Current A Gent use |
| --- | --- | --- |
| Models | `GET /api/model`; CLI `opencode models` | CLI `models`, parsed as `provider/model` |
| Sessions | `POST /api/session`, `GET /api/session`, `POST /api/session/{id}/prompt`, `POST /api/session/{id}/interrupt`, fork/revert/export/import | CLI `run --format json`, `--session`, `--title` |
| Events | `GET /api/event` (SSE; typed event names) | CLI stdout JSON lines, not the v2 SSE API |
| Permissions | `GET /api/permission/request`, `POST /api/session/{id}/permission/{requestID}/reply` | `--auto` auto-approves permissions; no per-tool UI |
| Forms | `/api/session/{id}/form` list/create/get/cancel/reply | Not used |
| MCP | `GET /api/mcp`, experimental add/remove/connect/disconnect, resource catalog | Not used; Codex currently owns app inventory |
| Skills | `GET /api/skill` | Not used |
| Auth | `opencode auth list/login/logout`; provider auth routes | External sign-in; readiness inferred from model count |
| Server auth | `OPENCODE_SERVER_PASSWORD` optional basic auth | Not used by A Gent's CLI adapter |

### OpenCode contract notes

- The public Server page still documents some v1 `/session`, `/event`, and `/mcp` paths. The installed 2.2.5 server exposes the v2 `/api/...` surface. Pin the generated OpenAPI document, not the documentation page.
- The adapter's `run --format json --auto` path is a CLI contract, not the v2 server contract. Its stdout event schema (`text`, `tool_use`, `sessionID`, `error`) is not specified by the OpenAPI document; it must be treated as an unstable adapter format until OPC-005 records fixtures.
- `--auto` does not implement A Gent's Chat/Work permission distinction. The UI must not claim Codex-style approvals for OpenCode until OPC-003 replaces or constrains this path.
- The current stop path sends SIGTERM, schedules SIGKILL after 2 seconds, and resolves immediately. That is not confirmed termination (OPC-002, FND-006).
- OpenCode's server API already exposes interrupt and permission reply; a future adapter can use them instead of process signals, but that is an OPC task, not an M0 change.

## HTTP and Ollama baseline

| Provider | Discovery | Chat transport | Auth | R1 capability |
| --- | --- | --- | --- | --- |
| OpenAI-compatible / Cloud | `GET {base}/models` | `POST {base}/chat/completions`, SSE `data:` frames | Optional bearer key in memory | Text streaming only; manual model supported when catalog is unavailable |
| Antigravity | Gemini OpenAI-compatible `GET /models` | Same chat-completions shape | Bearer API key | Endpoint label only; no native Antigravity account/runtime |
| Ollama | `GET {base}/api/tags` | `POST {base}/api/chat`, NDJSON `message.content` | None by default | Local/remote endpoint policy still required; no tool loop |

The HTTP adapters have a 12-second catalog timeout and a 15-minute run timeout, an 8 MB response cap, and no MCP/tool execution. These are recorded implementation limits, not accepted product budgets (QA-002).

## Unsupported methods and defined fallbacks

| Runtime / method | Current fallback | Required correction / owner |
| --- | --- | --- |
| Codex MCP elicitation (`mcpServer/elicitation/request`) | Decline with `{action:"decline"}` and a status activity | Replace with a correlated HIL flow; never collect secrets in an unseen form. HIL-001–006. |
| Codex tool user input (`item/tool/requestUserInput`) | Return `{answers:{}}` and show the questions as an activity | Real question/form UI with correlation and timeout. HIL-001–006. |
| Codex unknown server request | JSON-RPC error `-32601` | Keep explicit unsupported error; add only with schema evidence. FND-009. |
| Codex/OpenCode missing or unsupported version | Provider status becomes unavailable/error with guidance | Startup probe with supported-version message; fail closed on schema drift. CDX-001, OPC-001. |
| OpenCode permission prompt | `--auto` auto-approves; no UI | Implement or constrain Chat/Work policy via the v2 permission API. OPC-003. |
| OpenCode CLI JSON event drift | Parser ignores invalid lines and may end with "no text" error | Versioned event fixtures and explicit decode errors. OPC-005. |
| OpenCode Stop | SIGTERM then SIGKILL; settle immediately | Track child to exit, escalate, release after confirmation. OPC-002, FND-006. |
| HTTP/Ollama tools, MCP, vision | Not available; adapter is text-only | Keep capability disclosure; promote FUT-001 only with new scope/benchmark. |
| Provider thread reuse across providers | One shared `conversation.providerThreadId` | Store provider/account/workspace binding; rebuild on mismatch. FND-007. |

## Fixtures and reproduction

| Artifact | Path |
| --- | --- |
| Codex 0.166.0 selected schema + manifest | `tests/fixtures/runtime-baselines/codex-0.166.0/` |
| OpenCode 2.2.5 OpenAPI + manifest | `tests/fixtures/runtime-baselines/opencode-2.2.5/` |
| Baseline verifier | `scripts/runtime-baseline.mjs` |
| Baseline evidence summary | `docs/benchmarks/evidence/2026-11-05-runtime-probes.json` |

Commands:

```powershell
node scripts/runtime-baseline.mjs
node scripts/runtime-baseline.mjs --json
node scripts/runtime-baseline.mjs --strict
```

The verifier reads versions, regenerates the Codex schema in a temporary directory, checks selected file hashes and required methods, and probes OpenCode's OpenAPI document when a server is reachable. It does not authenticate, send a prompt, or change provider state.

## Remaining limitations

- No authenticated Codex/OpenCode account, model request, MCP connection, OAuth flow, or approval was exercised in this capture.
- The Codex fixtures are from 0.166.0 on Windows; macOS path discovery and packaged-app behavior remain separate checks.
- The OpenCode v2 OpenAPI document does not describe the CLI JSON event protocol used by the current adapter.
- No macOS package, signature, notarization, microphone permission, or clean-Mac install was verified.
- These fixtures must be refreshed when a supported runtime version or schema changes; a stale fixture is not evidence for the new version.
