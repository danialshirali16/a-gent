# Provider and Connect Apps integration review

Reviewed: 2026-11-05. Scope: current working-tree source, routes/types, existing test definitions, packaging/CI configuration, and current upstream integration documentation. This is a static readiness review for planning; no account login, model request, app connection, live OAuth flow, new test run, package rebuild, or publication was performed.

[Master roadmap](project-roadmap.md) · [Task boards](roadmaps/README.md) · [Current state](current-state-review.md)

## Readiness assessment

The project has useful provider adapters and MCP discovery, but provider integration and Connect Apps are **partial**. The completed 18-component pass describes reusable UI work, not completion of these product workflows. A provider is release-ready only after setup, actual model use, errors, Stop, restart, editing, and removal have evidence. An app requires the full authentication/access/use/removal lifecycle.

| Area | Present in source | Missing or incomplete | Evidence / follow-up |
| --- | --- | --- | --- |
| Shared provider lifecycle | Fixed six-entry catalog, probe/connect, model lists, HTTP execution | No complete disconnect/sign-out/profile lifecycle, capability contract, fresh health model, or consistent restore behavior | `server/providers.ts:16`; PVD-001–PVD-007 |
| Credentials | API keys kept in memory/env; endpoint/default ID saved without keys | No Keychain option; UI omits blank key/model fields so intentional clearing is unavailable; restart requires the documented session policy or restoration design | `server/providers.ts:35`, `src/dialogs/ProviderCard.tsx:15`; PVD-003–PVD-006 |
| Connection result UX | Connect POST returns provider information | Backend can return status error in a successful HTTP response; ProviderCard closes details after any resolved POST; model-list success does not prove inference access | `server/providers.ts:78`, `src/dialogs/ProviderCard.tsx:15`; PVD-005, PVD-007 |
| Catalogs and selection | Raw upstream catalogs and a connected-only picker | Seven stress findings; catalog IDs can exceed the 200-character send/persist limit; model choice currently changes the agent record | `src/composer/modelOptions.ts:9`, `server/index.ts:53`, `src/App.tsx:127`; PVD-008–PVD-013 |
| Model reasoning settings | Global string, Codex allowlist, fixed Light/Balanced/Deep footer and medium/Balanced defaults | Model discovery discards effort metadata; per-model options/defaults, unknown/unsupported behavior, migrations and exact adapter mapping are incomplete | `shared/types.ts:101`, `server/codex.ts:95`, `server/codex.ts:266`, `src/composer/ModelPicker.tsx:155`, `src/App.tsx:54`, `src/dialogs.tsx:37`, `src/app/SidePanel.tsx:89`; [EFF-001–012](roadmaps/reasoning-effort.md) |
| Speech-to-Text | No implemented capture or transcription flow found in the reviewed source | ElevenLabs connection/key lifecycle, microphone capture, transcript reconciliation/editing, explicit Send through selected Agent, quality and native-package evidence | [STT-001–018](roadmaps/speech-to-text.md); this is a new integration, independent of the LLM provider |
| Skills | Existing agent instructions; no dedicated Skills manager/native skills bridge found | Discovery, creation/import, ownership/scope, enable/use, updates/editing, disable/remove/export, adapter limits and real-runtime verification | [SKL-001–020](roadmaps/skills.md); agent instruction text is not a skill-management lifecycle |
| Codex | App-server initialization, account/model reads, threads/turns, approvals, interruption | In-app sign-in/account lifecycle, supported-version/capability handling, complete questions/forms, provider-isolated sessions, and release journey evidence | `server/codex.ts:25`; CDX-001–CDX-006 |
| OpenCode | CLI model list, JSON run events, session continuation | Readiness inferred from model count; --auto path does not implement the UI's Codex-style mode contract; abort settles before confirmed termination | `server/opencode.ts:56`, `server/opencode.ts:61`; OPC-001–OPC-006 |
| Cloud/custom HTTP | Streaming chat-completions path and manual model configuration | Catalog failure blocks readiness even with a manual model; framing/error/context/cancellation cases and endpoint policy need hardening; no tool execution loop | `server/providers.ts:78`, `server/providers.ts:114`; HTTP-001–HTTP-006, FUT-001 |
| Ollama | Native /api/tags and /api/chat paths | Actual local-daemon/model lifecycle, missing-model recovery, selected native capabilities, remote endpoint policy, and release evidence | `server/providers.ts:92`, `server/providers.ts:125`; OLL-001–OLL-004 |
| Antigravity label | Gemini OpenAI-compatible endpoint using a key | No native Antigravity account/runtime bridge is implemented; the intended product promise and naming need a decision | `server/providers.ts:30`; GEM-001–GEM-004 |
| MCP inventory | GET /api/apps calls Codex status inventory, including bounded pagination and auth/runtime status mapping | Record exposes only name/status/toolsCount; no stable app ID, provider/project ownership, schemas/details, or OpenCode inventory in A Gent | `server/providers.ts:54`, `server/codex.ts:108`, `shared/types.ts:111`; MCP-001–MCP-004, MCP-015 |
| Connect Apps UI | Search, category tabs, refresh, status cards, setup note | No Add app, auth/re-auth, details, access scope, enable/disable, test, edit, or remove actions | `src/dialogs/ConnectionsDialog.tsx:15`; APP-001–APP-012 |
| MCP management API | Inventory route only | No app configuration CRUD, OAuth lifecycle, grants, removal, or explicit configuration authority API | `server/index.ts:335`; MCP-005–MCP-014, FND-004 |
| App use in runs | Codex MCP tool activities and OpenCode inherited tool events | Provider-managed tools may work when configured externally; there is no provider-independent app executor for HTTP models, and A Gent does not manage the full lifecycle | `server/codex.ts:299`, `server/opencode.ts:99`; MCP-016–MCP-022, FUT-001 |
| Runtime/app context | Codex inventory can use lastThreadId | One global last thread is not a per-chat/project inventory contract; refresh/auth/events need correlated scope | `server/codex.ts:118`; MCP-003, MCP-011, MCP-014 |
| User questions and forms | Supported approvals; unsupported interactions produce a notice | MCP elicitation is declined and tool questions receive empty answers instead of a real user response | `server/codex.ts:193`, `server/codex.ts:223`; HIL-001–HIL-006 |
| Run/device reliability | Auth tokens, SSE, in-memory run ledger, saved chat messages | Active SSE lacks device identity; OpenCode Stop and shared providerThreadId findings remain visible in source; crash/pending interaction recovery needs evidence | `server/index.ts:69`, `server/runs.ts:7`; FND-005–FND-010 |
| Tests | Fake Codex/OpenCode, HTTP stub, inventory assertions, UI/component suites | Existing HTTP test reuses one stub for Cloud/Gemini; MCP test checks inventory, not add/auth/use/remove; live provider and connector acceptance matrix missing | `tests/server/backend.test.ts:348`, `tests/server/backend.test.ts:502`, `tests/server/backend.test.ts:535`; QA-001–QA-009 |
| Release automation | Build scripts, notice generation, CI, ad-hoc macOS artifacts | macOS signing identity is null; Windows/Android CI jobs run despite paused scope; latest source/package verification and release process incomplete | `package.json`, `.github/workflows/build.yml`; QA-010, REL-001–REL-012 |

The earlier backend reproductions were not repeated in this planning pass. Their source patterns remain present; the roadmap requires regression evidence before closure. Historical passing suites are not a current release sign-off.

## Recommended architecture and decisions

These are recommendations inferred from the source gaps, not implemented features:

1. Use one typed provider adapter contract and one host connection service. Keep public readiness/capability data separate from secrets and runtime-specific details.
2. For R1, prefer the supported Codex/OpenCode runtime as the owner of its MCP execution/auth lifecycle, exposed through adapters. Avoid a second uncontrolled process/config/auth path for the same connection.
3. Manage A Gent-owned connections explicitly; discover existing external configuration without silently overwriting it. Support reviewed adoption with atomic changes and rollback.
4. Treat model, app, agent, workspace, host, and account identities as separate scoped records. Make effective grants and available tools observable.
5. Keep HTTP-only model adapters accurately scoped until a tested model/tool execution loop exists. FND-001 keeps FUT-001 in R2; promoting provider-independent MCP for HTTP models requires a new scope decision and benchmark.
6. Distinguish raw MCP servers, provider-native apps, and any later plugin marketplace. The app inventory currently implements only the first subset through Codex.
7. Preserve authoritative model reasoning capabilities and validate the effective model's native parameters. Unknown metadata uses provider default; skill instructions respect the same runtime permission boundary as other Agent input.
8. Keep ElevenLabs transcription separate from model inference: deliberate microphone capture produces an editable draft, then explicit Send invokes the selected Agent with its model, effort, skills and tool policy.

All recommendations now require [scope-specific benchmark evidence](roadmaps/benchmarking.md) and accepted design decisions before development. The [benchmark process](benchmarks/README.md) separates current documentation research from future peer comparisons and measured implementation acceptance.

## Upstream references checked

The current official Codex reference documents managed account operations, MCP OAuth/reload/discovery, native app inventory, and interactive requests. These establish candidate integration paths; availability must still be checked against the supported installed runtime. It marks plugin installation operations as under development, so they are not a ready production marketplace API. [Codex App Server](https://learn.chatgpt.com/docs/app-server).

OpenCode documents local/remote MCP configuration and auth management, including per-agent tool configuration. The A Gent adapter currently exposes only a smaller CLI run/model subset. [OpenCode MCP servers](https://opencode.ai/docs/mcp-servers/).

The MCP specification distinguishes stdio and Streamable HTTP, with versioned transport/auth requirements. The HTTP authorization specification and runtime-specific behavior must be pinned together rather than assuming one universal OAuth implementation. [MCP transports](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports), [MCP authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization).

The existing Google endpoint matches the documented Gemini OpenAI-compatible API, while Ollama discovery uses its native tags endpoint. Neither fact establishes a native Antigravity bridge or real-account acceptance. [Gemini compatibility](https://aistudio.google.com/docs/openai), [Ollama model listing](https://docs.ollama.com/api/tags).

References were read on 2026-11-05. Their capability descriptions inform the roadmap; this review does not claim that upgrading a dependency automatically completes an integration.

New feature references checked on the same date: [ElevenLabs client-side transcription](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming), [ElevenLabs realtime API](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime), [Agent Skills format](https://agentskills.io/specification), and [OpenCode skills](https://opencode.ai/docs/skills). The linked feature boards record how these inform requirements; no microphone recording, paid transcription, skill installation, or new live-model request was performed.
