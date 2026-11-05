# A Gent R1 release contract

Status: **Accepted for M0 on 2026-11-05.** This is the FND-001 record. It fixes the first-release boundary, the D-01–D-11 decisions, and the owner/support scope. It is not a claim that the features are implemented or verified.

[Master roadmap](project-roadmap.md) · [BEN-001 record](benchmarks/BEN-001-foundations.md) · [Runtime baseline](runtime-baselines.md) · [Support matrix](support-matrix.md) · [Validation](validation.md)

## Authority and change rule

- **Accountable owner:** Danial. Role owners below are the suggested roles from the roadmap; until delegation, Danial is the acting DRI for Product, Host, Integrations, QA, and Release.
- **Acceptance:** owner direction for the M0 pass, 2026-11-05.
- **Change rule:** a change to a product promise or release boundary requires a dated amendment here, a corresponding status/dependency update in the owning board, and a recheck of the affected BEN record. Technical choices inside an accepted scope may be resolved by their task without reopening this contract unless they change the promise, platform, data handling, or release gate.

## R1 definition

**A Gent 0.1.0 — first public macOS release.**

| Boundary | R1 commitment |
| --- | --- |
| Platform | macOS 13 (Ventura) or later; Apple silicon (arm64) only. Intel Macs are not supported in R1. |
| Package | Signed Developer ID app, notarized and stapled, delivered as DMG and ZIP. |
| Distribution | GitHub Releases, with a reviewed tag/commit, checksums, release notes, support path, and previous signed artifact for rollback. |
| Updates | Manual download/install in R1. No auto-update channel is promised. |
| Host model | Local A Gent host on the user's Mac; provider credentials and workspace data remain local except for the provider calls the user initiates. No Reason private cloud or billing integration. |
| Paused platforms | Windows and Android are not advertised, built as release artifacts, or tested as R1 platforms. Their tasks remain paused and tracked. |
| Release gate | Every pre-publication R1 task is Done, including QA-012; REL-012 publishes only the concrete approved artifact set. |

## Recorded decisions

| ID | Decision | Consequences and boundaries | Owner | Recheck trigger |
| --- | --- | --- | --- | --- |
| **D-01 — release scope** | First public release is macOS 13+ arm64, A Gent 0.1.0, signed/notarized DMG/ZIP via GitHub Releases; manual updates; Windows/Android paused. | Intel builds, auto-update, Windows, Android, and hosted A Gent accounts are out of R1. A universal/Intel build requires a new scope and package plan. | Product + Release | Electron/macOS support change; demand for Intel/universal; distribution change. |
| **D-02 — provider promise** | **Amended 2026-11-05:** R1 advertises **Codex and OpenCode only** as agent runtimes. OpenAI-compatible/Cloud endpoints, Antigravity/Gemini, and Ollama are **deferred to the distant future**; they are not R1 launch providers. Codex/OpenCode provide tools, approvals, sessions, and runtime MCP use. | A provider may not be advertised as "connected" or "supported" until its setup, actual inference, failure, Stop, restart, edit, and removal journeys have evidence. Resuming a deferred provider requires a new/amended benchmark and an explicit R1/R2 scope decision; do not present it in R1 onboarding or support material. | Product + Integrations | New adapter; provider API/auth change; decision to resume a deferred provider; evidence that HTTP tool execution is required. |
| **D-03 — MCP execution ownership** | R1 uses the supported Codex/OpenCode runtime as the owner of MCP execution and auth. A Gent owns connection records, scope, inventory, enable/disable, and UI. Do not create a second uncontrolled MCP process/config/auth path for the same connection. External configuration is discovered read-only by default; adoption or writes require an explicit user action with atomic rollback. | Provider-independent MCP execution for HTTP models is R2 (FUT-001). The app inventory is not a complete connection manager until the APP/MCP lifecycle passes. | Integrations + Host | Runtime MCP implementation change; new transport/auth flow; decision to support MCP for HTTP models. |
| **D-04 — secrets and authority** | Provider and STT credentials use macOS Keychain (Electron `safeStorage`) by default, with an explicit session-only mode. The host administrator token manages devices and host-level credentials; per-device tokens can use granted chats/apps/tools but cannot manage devices or reveal secrets. Secrets never enter renderer state, exports, logs, packages, or crash reports. | Keychain locked/unavailable must produce an actionable recovery path; session-only users re-authenticate after restart. Device revocation must close existing access. | Host + Product | Credential storage change; remote-device rights change; a new secret-bearing integration. |
| **D-05 — launch apps** | R1 supports custom MCP server setup (local stdio and supported remote HTTP/OAuth) plus a verified catalog only for connectors that pass the MCP acceptance journey. No connector name/publisher is advertised before real auth, scope, tool-use, restart, disable, and removal evidence. Initial verification candidates are GitHub, Slack, and Google Drive; they are candidates, not promises. | The release may ship with custom setup and a small or empty verified catalog. Marketing, onboarding, and the support matrix must match the verified list. Unverified connectors remain "custom/unsupported" and cannot be counted as launch apps. | Product + Integrations | Connector verification result; publisher/scope change; a decision to promise a named launch catalog. |
| **D-06 — compatibility and distribution** | Build/tooling floor is Node >=22.12.0; release packaging uses Node 24.x (Electron 45.2.2 embeds Node 24.22.2). Electron is pinned 45.2.2, TypeScript 7.0.2, lockfile v3, and `npm ci`-style reproducibility. Tested runtimes are Codex CLI 0.166.0 and OpenCode 2.2.5. A Gent probes versions/capabilities at startup and disables an unsupported runtime with an actionable message; it never silently substitutes stale fields. | Node 26 is a development probe, not a release guarantee. Codex/OpenCode upgrades require a new baseline and affected-adapter checks. No auto-update of external runtimes by A Gent. macOS 13+ is mandatory because Electron 45 does not support macOS 12. | Release + Integrations | Node/Electron/Codex/OpenCode change; schema drift; macOS support change; signing/hosting change. |
| **D-07 — behavior and feature scope** | R1 includes the text workspace (agents/groups, chats/search, drafts, one-time schedules, text attachments, import/export), device pairing, read-only Files/Terminal, Codex/OpenCode work modes and approvals, model-specific reasoning controls, Agent skills, ElevenLabs STT, and accessibility. R2 retains multiple connection profiles, provider-independent MCP for HTTP models, binary attachments, recurring schedules, branching, richer files, usage, teams, native/browser control, and signed auto-updates. | A feature may move between R1/R2 only with a dated decision and matching tests/dependencies. The UI and docs must not present R2/paused/optional work as shipped. | Product | Scope change; user requirement change; release pressure that proposes deferral. |
| **D-08 — Speech-to-Text** | ElevenLabs is the initial and only R1 STT provider. The R1 flow is deliberate microphone capture → editable transcript → explicit Send through the selected Agent. Spoken replies, voice calls, and always-listening behavior are out of scope. Transport (realtime vs batch), model, languages, token/proxy flow, retention, and cost are selected by BEN-018/BEN-019. The permanent key stays out of the renderer; use a host proxy or host-minted short-lived token. | STT is independent of the Agent's LLM provider but must reuse the selected Agent, model, valid effort, skills, and tool policy. Audio/transcript retention must be disclosed; cancellation/crash cleanup is required. | Product + Integrations | ElevenLabs API/model change; transport decision; privacy/retention change. |
| **D-09 — reasoning controls** | Show only the selected model's verified reasoning options and default. Preserve Codex `defaultReasoningEffort` and `supportedReasoningEfforts`; use OpenCode model variants/capabilities where available. Unknown metadata uses the provider default with no guessed parameter. Unsupported choices are rejected at the API boundary. Switching models migrates only when the saved value is valid; otherwise use the new default. No global Light/Balanced/Deep list applies to every model. | The picker layout is retained, but model descriptions and Media/Reasoning badges stay omitted. Persist the effective model/effort with the chat/agent scope. | Integrations + UI | Model metadata change; new provider mapping; EFF-012 evidence. |
| **D-10 — Agent skills** | Support the Agent Skills format for create/add/import/manage, per-agent/project/global scope, enable/disable, use, edit/update, remove, and export. Native Codex/OpenCode discovery and execution are used where supported; HTTP models are instruction-only and must not claim native skill execution. Imported scripts never execute during addition. Managed copies are owned by A Gent; external files are tracked read-only unless explicitly adopted. | Updates/removal/rollback must preserve provenance. Skill instructions remain inside the same permission boundary as other Agent input. A skill that requires unavailable runtime support is visibly unsupported. | Product + Integrations | Agent Skills format change; runtime skill API change; import/security finding. |
| **D-11 — benchmark gate** | Every delivery scope requires an accepted BEN record with at least two relevant comparators, dated/versioned evidence, adopted decisions, and mapped development/verification criteria before Ready or implementation. BEN-001 covers foundations only. No waiver is granted for bugs, new adapters, QA infrastructure, release process, R2, or resumed platforms. | If live access is unavailable, record the limitation and keep the real-world acceptance open; do not mark the benchmark Done on documentation alone. A scope change requires a new or amended record. | Product + QA | New scope; contradictory evidence; runtime/product change that invalidates the comparison. |

## R1 support summary

The detailed test/evidence mapping is in the [support matrix](support-matrix.md). The release claim is:

| Surface | R1 claim | Verification gate |
| --- | --- | --- |
| macOS package | macOS 13+ arm64, signed/notarized DMG/ZIP, clean install/upgrade, rollback | REL-003/004/006/007/012 |
| Codex | Existing or managed sign-in, model/effort, chat, work mode, approvals, real tool use, Stop, restart/resume, edit/remove | CDX-006, PVD-017, QA-005/008 |
| OpenCode | Auth/readiness, model selection, chat, tool policy, Stop, restart/resume, edit/remove | OPC-006, PVD-017, QA-005/008 |
| OpenAI-compatible / Cloud | **Deferred to distant future — not R1.** | Resuming requires amended scope + BEN-005 + HTTP-006 |
| Antigravity / Gemini | **Deferred to distant future — not R1.** | Resuming requires amended scope + BEN-007 + GEM-004 |
| Ollama | **Deferred to distant future — not R1.** | Resuming requires amended scope + BEN-006 + OLL-004 |
| MCP / Connect Apps | Add/authenticate/scope/use/disable/remove with user input and recovery | MCP-022, APP-012, HIL-006, QA-005/008 |
| Reasoning | Only verified per-model options/defaults; unknown/unsupported/switching | EFF-012, QA-005/008 |
| Skills | Create/import/manage/scope/use/update/disable/remove/export | SKL-020, QA-005/008 |
| ElevenLabs STT | Key, capture, transcript, edit, explicit Send, quality/cost, signed-Mac microphone | STT-018, QA-005/008/012 |
| Core workspace | Agents/groups, chats/search, drafts, one-time schedules, text attachments, import/export, recovery, Files/Terminal, keyboard/a11y | COR-009, UX-005, QA-005/006/007/009 |
| Negative states | Auth denial/expiry, offline, timeout, cancellation, crash/corrupt state, revoked device, schema drift | FND-005/008/009/010/011, QA-003/004/009 |

## Exclusions and non-promises

- Reason's private cloud, billing, hosted accounts, and provider credentials are not part of A Gent.
- Reason parity is not a release claim. The installed UI is a visual/workflow reference only.
- A Gent does not promise OpenAI-compatible/Cloud, Antigravity/Gemini, or Ollama in R1; these are deferred to the distant future. It also does not promise a native Antigravity runtime, a named launch-app catalog before verification, spoken replies, voice calls, always-listening STT, Windows, Android, Intel Mac support, auto-update, or provider-independent MCP for HTTP models in R1.
- A passing catalog fetch, fixture suite, screenshot, or old package does not close a provider, app, speech, skill, or release task.

## Acceptance

- **DRI:** Danial (Product + Host).
- **Reviewer:** Danial (owner), accepted 2026-11-05 for M0.
- **Evidence:** [BEN-001](benchmarks/BEN-001-foundations.md), [runtime baseline](runtime-baselines.md), [support matrix](support-matrix.md), [validation](validation.md).
- **Next gate:** M1 is complete; M2 shared provider/reasoning work is largely implemented; **M3 has BEN-008–BEN-010 accepted** and now needs the MCP/Connect Apps lifecycle and HIL flow. R1 still requires PVD-017, CDX/OPC/EFF completion, product BEN-011/012, skills BEN-023–BEN-025, and speech BEN-018–BEN-020. BEN-005/006/007 and HTTP/OLL/GEM are deferred.
