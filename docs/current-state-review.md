# Current project state

Updated: 2026-11-05. Checkout: the separate A Gent build at `outputs/a-gent`, branch `main`. Active scope: macOS. The working tree contains ongoing uncommitted product and UI changes.

[Documentation index](README.md) · [Project roadmap](project-roadmap.md) · [UI Roadmap](ui-roadmap.md) · [Validation](validation.md)

## Product and architecture

A Gent is a local agent workspace. React/Vite renders the interface, Express persists workspace state and streams activity, Electron packages the desktop host, and Capacitor provides the paused Android companion. A Gent uses its own code, branding, and data store.

Implemented flows include agent customization/grouping, conversations/search, model selection, streamed replies, Codex work mode/approvals, OpenCode, HTTP model providers, one-time schedules, import/export, device pairing tokens, and read-only Files/Terminal panels. Provider credentials remain on the host. Cloud and Antigravity are configurable endpoints rather than Reason's hosted services.

## Source, preview, and package status

| Target | Current record |
| --- | --- |
| Shared interface | Initial 18-component pass complete; pinned bot-avatars renderer, saved shapes, inline picker, shared controls, and Search corrections implemented |
| Provider integration | Adapter foundations exist; sign-in/readiness, credential lifecycle, edit/disconnect, capabilities, negative paths, and release journeys remain partial |
| MCP / Connect Apps | Codex server inventory and inherited runtime tool use exist; add/authenticate/scope/manage/remove workflows and real user-input handling are incomplete |
| Source model picker | Provider rail, search, model names, Thinking footer; connected providers only; descriptions and media/reasoning badges omitted |
| Reasoning options | Fixed Light/Balanced/Deep and global defaults remain; model-specific capability preservation, request mapping, migration, and all-surface controls are planned in EFF-001–012 |
| Speech-to-Text | No capture/transcription adapter; ElevenLabs API setup, editable speech-to-Agent flow, quality checks, and signed-Mac microphone behavior are required in STT-001–018 |
| Skills | No dedicated management/native skill adapter; create/import/manage/scope/use/update/remove/export are required in SKL-001–020 |
| Catalog stress harness | Six synthetic datasets under `src/dev/`; URL-persisted data/environment controls; seven findings remain open |
| Latest source checks | Publication preflight: typecheck, 17 backend/model-option tests, production build, and all 42 smoke/visual/axe/E2E checks pass locally on macOS. Popover initial focus and late-HTTP/streamed-approval ordering were corrected. These checks do not close the seven catalog findings |
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

The latest [integration review](integration-review.md) inspected current source/routes/types, existing test definitions, CI/package configuration, and upstream documentation. It confirmed that Connect Apps is currently an inventory of externally configured Codex MCP servers, not a complete connection manager. HTTP providers do not have their own MCP execution loop; unsupported MCP forms are declined and tool questions receive empty answers.

The [completion/release roadmap](project-roadmap.md) now defines 237 acceptance tasks: 12 foundations, 44 provider, 40 MCP/app/user-input, 12 model-reasoning, 20 skills, 18 speech, 22 product/UI, 24 quality/release, 20 paused/later, and 25 benchmark prerequisites. Targets are 208 first-release macOS tasks, 11 R2 tasks, 16 paused-platform tasks, and 2 optional-scope tasks. Product decisions and actual owners remain to be recorded in FND-001; creating the plan does not mark implementation complete.

ElevenLabs as the first STT provider, the selected model's own reasoning options, adding/managing skills, and benchmarking before development are user requirements. The [three feature boards](roadmaps/README.md) include credential/data handling, runtime compatibility, UI, negative paths, and release acceptance. All 212 delivery tasks now depend on one of [25 scope comparisons](roadmaps/benchmarking.md); actual benchmark evidence is still To do.

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

Next: complete the foundation comparison (BEN-001), confirm the release contract and runtime/capability baseline (FND-001/002), establish reliability/storage/authority foundations, and deliver benchmarked provider/app/reasoning/skills/speech slices through the boards. The catalog and backend findings, requested feature implementation, product recovery gaps, fresh release suites, VoiceOver/actual zoom, performance, signing/notarization, clean-Mac installation, and architecture decision remain open. Windows/Android work remains paused until its scope is resumed.
