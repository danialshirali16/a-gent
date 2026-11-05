# Current project state

Updated: 2026-11-05. Checkout: the separate A Gent build at `outputs/a-gent`, branch `main`. Active scope: macOS. The working tree contains ongoing uncommitted product and UI changes.

[Documentation index](README.md) · [Project roadmap](project-roadmap.md) · [UI Roadmap](ui-roadmap.md) · [Validation](validation.md)

## Product and architecture

A Gent is a local agent workspace. React/Vite renders the interface, Express persists workspace state and streams activity, Electron packages the desktop host, and Capacitor provides the paused Android companion. A Gent uses its own code, branding, and data store.

**M0 is accepted (2026-11-05), and M1 has started.** The [release contract](release-contract.md) records D-01–D-11 and the macOS-first R1 boundary; the [runtime baseline](runtime-baselines.md) pins Electron 45.2.2, Codex 0.166.0, OpenCode 2.2.5, and checked-in schema/OpenAPI fixtures; the [support matrix](support-matrix.md) records the initial QA-001 mapping. FND-003 is also Done: workspace schema v2 adds provider bindings, scoped app/skill records, chat effort, and non-secret speech settings with migration/rollback tests in [data-schema.md](data-schema.md). FND-004 is Done: host/desktop/remote device authority is enforced for provider credentials, host defaults, speech, import/export, and device management in [authority-model.md](authority-model.md). FND-005 is Done: SSE streams are bound to device identity and close on that device's rotation/revocation without disturbing other devices. FND-007 is Done: provider sessions are reused only when provider, profile, workspace, and model match; mismatches and legacy IDs rebuild deliberately. FND-006 is Done: Codex/OpenCode Stop waits for confirmed termination, OpenCode escalates and keeps the chat reserved until child exit, and host shutdown persists active messages as interrupted. FND-008 is Done: saves are snapshotted/serialized and fsynced, backups and corrupt-primary recovery are verified, and failed imports roll back. FND-009 is Done: approvals/questions/forms carry host/run/conversation/provider/thread correlation, approvals persist/resolve, pending records expire on restart, and host stores are isolated. FND-010 is Done: shared startup/catalog/auth/tool/session/stream/interaction/shutdown budgets and cancellation helpers are applied across adapters. FND-011 is Done: HTTP/SSE errors carry request/run/provider correlation, the error envelope includes a request ID, and tokens/keys/credentials/provider text are redacted. FND-012 is Done: owner-scoped typed config and credential interfaces support atomic updates, rollback, migration, encryption, and export exclusion. **M1 is complete.** M2 has started for **Codex/OpenCode only**: [BEN-002](benchmarks/BEN-002-provider-lifecycle.md) fixes the shared provider lifecycle, [BEN-003](benchmarks/BEN-003-codex-integration.md) fixes Codex login/model/turn/Stop/approval behavior, [BEN-004](benchmarks/BEN-004-opencode-integration.md) fixes OpenCode auth/session/event/permission/Stop behavior, [BEN-021](benchmarks/BEN-021-reasoning-capability.md)/[BEN-022](benchmarks/BEN-022-thinking-controls.md) fix model-specific reasoning capabilities and controls, and [provider-lifecycle.md](provider-lifecycle.md) implements readiness states, capability typing, catalog normalization, model-ID limits, and the API readiness guard (PVD-002/005/008/011/013). Real Codex `gpt-6.1-sol` chat/Stop and OpenCode `opencode-go/deepseek-v4.1-flash` chat passed. The 2026-11-05 D-02 amendment defers Cloud/OpenAI-compatible, Ollama, and Gemini/Antigravity to the distant future.

Implemented flows include agent customization/grouping, conversations/search, model selection, streamed replies, Codex work mode/approvals, OpenCode, HTTP model providers, one-time schedules, import/export, device pairing tokens, and read-only Files/Terminal panels. Provider credentials remain on the host. Cloud and Antigravity are configurable endpoints rather than Reason's hosted services.

## Source, preview, and package status

| Target | Current record |
| --- | --- |
| Shared interface | Initial 18-component pass complete; pinned bot-avatars renderer, saved shapes, inline picker, shared controls, and Search corrections implemented |
| Provider integration | Typed adapter/capability contract, readiness states, catalog normalization, model-ID limits, and Codex reasoning metadata are implemented; credential lifecycle, edit/disconnect, full provider journeys, and OpenCode reasoning mapping remain partial |
| MCP / Connect Apps | Codex server inventory and inherited runtime tool use exist; add/authenticate/scope/manage/remove workflows and real user-input handling are incomplete |
| Source model picker | Provider rail, search, model names, Thinking footer; connected providers only; descriptions and media/reasoning badges omitted |
| Reasoning options | Codex model metadata is preserved and the picker renders verified per-model enum options/defaults; request guard/native mapping work. OpenCode variants, migration, all-surface controls, and EFF verification remain |
| Speech-to-Text | No capture/transcription adapter; ElevenLabs API setup, editable speech-to-Agent flow, quality checks, and signed-Mac microphone behavior are required in STT-001–018 |
| Skills | No dedicated management/native skill adapter; create/import/manage/scope/use/update/remove/export are required in SKL-001–020 |
| Catalog stress harness | Six synthetic datasets under `src/dev/`; URL-persisted data/environment controls; seven findings remain open |
| Latest source checks | Publication preflight: typecheck, 17 backend/model-option tests, production build, and all 42 smoke/visual/axe/E2E checks pass locally on macOS. FND-003–FND-012, the shared provider slice, reasoning metadata, credential/disconnect, endpoint policy, selection scope, and adapter fixtures reran typecheck, 54 server tests, and the production build on Windows; UI Playwright suites were not rerun. Real smoke: Codex `gpt-6.1-sol` chat, Stop, Work-mode file write, restart/reconnect, and thread resume/append passed; OpenCode `opencode-go/deepseek-v4.1-flash` chat passed; other OpenCode models/accounts failed; Ollama/Cloud/Gemini were not configured. These checks do not close the seven catalog findings |
| Packaged macOS app | Earlier arm64 DMG/ZIP built and launched. Latest picker source is awaiting a new package verification |
| Windows / Android | Earlier cross-platform artifacts; current work and runtime checks paused |

The current QA host is `http://127.0.0.1:4492/`, using an isolated test workspace. The [modelOptions harness](http://127.0.0.1:4492/?component=composer&stress=model-options&data=worst&theme=dark) exercises the existing component through fixture props, without changing production selection behavior.

## Open model catalog findings

The [stress-test report](model-options-stress-test.md) records seven findings with evidence and proposed fixes:

1. Empty/repeated IDs produce duplicate selection and an inconsistent trigger.
2. Empty/whitespace display names produce blank, unnamed selectable rows.
3. Different deployments with identical names cannot be distinguished.
4. Canonically equivalent Unicode search strings return different results.
5. A new query retains the old list scroll position.
6. Single-choice live copy uses a plural; large counts are unformatted.
7. Catalog string limits are unbounded and differ from configuration/persistence limits.

The audit stops before production fixes under the invoked break-ui workflow. Its fixtures remain available for the correction pass. Normal-fixture accessibility results do not cover the blank-label failure.

## Provider and app integration completion

The latest [integration review](integration-review.md) inspected current source/routes/types, existing test definitions, CI/package configuration, and upstream documentation. It confirmed that Connect Apps started as inventory of externally configured Codex MCP servers, not a complete connection manager. HTTP providers do not have their own MCP execution loop. Tool questions and supported MCP forms are now answered through correlated HIL records with schema validation; unsupported forms decline explicitly. Connection onboarding/auth/removal remains M3 work.

The [completion/release roadmap](project-roadmap.md) now defines 237 acceptance tasks: 12 foundations, 44 provider, 40 MCP/app/user-input, 12 model-reasoning, 20 skills, 18 speech, 22 product/UI, 24 quality/release, 20 paused/later, and 25 benchmark prerequisites. After the 2026-11-05 D-02 amendment the targets are **191 first-release macOS tasks, 28 R2 tasks**, 16 paused-platform, and 2 optional-scope tasks. FND-001 records the decisions and acting owners; creating the plan does not mark implementation complete.

ElevenLabs as the first STT provider, the selected model's own reasoning options, adding/managing skills, and benchmarking before development are user requirements. The [three feature boards](roadmaps/README.md) include credential/data handling, runtime compatibility, UI, negative paths, and release acceptance. All 212 delivery tasks depend on one of [25 scope comparisons](roadmaps/benchmarking.md); BEN-001 is accepted and the remaining 24 comparisons are still To do.

The seven catalog findings map to PVD-008–PVD-011 and their regression work. The broader provider/app tasks are owned by [providers.md](roadmaps/providers.md) and [connect-apps.md](roadmaps/connect-apps.md).

## Backend findings tracked from the earlier review

These were recorded on 2026-11-04. This documentation pass did not rerun their reproductions; no closure evidence is recorded, so they remain tracked as open.

The 2026-11-05 planning review found the relevant source patterns still present. FND-005/FND-007, OPC-002, and QA-004 require implemented corrections and fresh regression evidence before closure.

| Priority | Finding | Evidence and required follow-up |
| --- | --- | --- |
| P1 | Device revocation leaves an existing event stream connected | Earlier temporary-device reproduction received a workspace event after revocation. Associate streams with authenticated device identity and terminate affected streams on token change/revocation. Location: `server/index.ts` |
| P1 | OpenCode can continue after Stop | Earlier local fixture ignored SIGTERM and remained alive after interruption/shutdown. Track the process until exit and verify escalation. Location: `server/opencode.ts` |
| P2 | Provider sessions share one resume field | Earlier source review found provider IDs stored in `conversation.providerThreadId` and resumed across adapters without a provider binding; live account switching was not tested. Locations: `server/runs.ts`, `server/codex.ts`, `server/opencode.ts` |

The browser folder fallback uses `window.prompt`, unsupported in the in-app browser used for review. Native Mac folder selection uses Electron's picker. The hardcoded Settings connection status was corrected during the UI pass.

## Verification boundaries and continuation

The public-source publication preflight reran 17 backend/model-option tests and 42 UI checks against the pending source, including a deterministic late-response approval case; all pass locally. Earlier macOS package verification still predates the latest picker changes and fixtures. The initial GitHub baseline run exposed paused-platform CI issues; QA-010 remains open. The exact scoped results and screenshots are in [validation](validation.md).

Next: M0/M1 are accepted, BEN-002–BEN-004/BEN-021/BEN-022 and the shared lifecycle slice are done, and live Codex/OpenCode smoke passed. Implement the remaining provider/effort journeys, then deliver the first Codex setup → app connection → real tool use vertical slice. Cloud/Ollama/Gemini are deferred. QA-004 still owns the real-runtime Stop reproduction; PVD-017/QA-008 still require full Codex/OpenCode journeys. The catalog and backend findings, requested feature implementation, product recovery gaps, fresh release suites, VoiceOver/actual zoom, performance, signing/notarization, clean-Mac installation, and architecture decision remain open. Windows/Android work remains paused until its scope is resumed.
