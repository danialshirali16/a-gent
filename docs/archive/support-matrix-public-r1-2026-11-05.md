> Historical public R1 snapshot, preserved before the owner-approved personal v1 amendment on 2026-11-05. Follow the [active roadmap](../project-roadmap.md) and [release contract](../release-contract.md) for current work.

# Release acceptance support matrix

Status: **Living R1 support matrix; M0 baseline recorded 2026-11-05.** It maps every advertised R1 surface, negative state, and paused platform to an owner, a test or evidence location, and the gate that still has to accept it. Rows are updated as implementation and validation evidence lands.

This is not QA-001 acceptance. QA-001 depends on BEN-013 (quality strategy), which is still To do. The matrix must be updated as benchmarks, implementations, and real-service checks produce evidence. Per the 2026-11-05 D-02 amendment, **R1 advertises Codex and OpenCode only**; OpenAI-compatible/Cloud, Antigravity/Gemini, and Ollama are deferred.

[Release contract](../release-contract.md) · [BEN-001](../benchmarks/BEN-001-foundations.md) · [Runtime baseline](../runtime-baselines.md) · [Validation](../validation.md) · [Quality board](../roadmaps/quality-release.md)

## Status vocabulary

| Status | Meaning |
| --- | --- |
| **Verified** | A fresh check against the identified source/artifact passed for the stated scope. |
| **Partial** | Code and some fixtures exist, but the advertised journey or negative state is not accepted. |
| **Planned** | Required by R1, not implemented or not yet tested. |
| **Paused** | Tracked but not part of R1; must not be advertised as supported. |
| **Evidence gap** | The code may exist, but the required real-service, package, or assistive-tech evidence is missing. |

## Platform and package

| Surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| macOS 13+ arm64 app | Signed/notarized DMG + ZIP; clean install/upgrade; rollback | Release + QA | `docs/validation.md` package section; REL-003/004/006/007/012 | Partial (older ad-hoc arm64 package) | REL-012 |
| Local host startup | Host serves UI, health, API, SSE; no remote bind by default | Host | `tests/server/backend.test.ts` host/auth cases; `scripts/ui-test-server.mjs` | Partial | FND-004/005, QA-010 |
| Windows | Not advertised; paused | Release | `docs/roadmaps/platforms-next.md`; WIN tasks | Paused | WIN-006 |
| Android | Not advertised; paused | Mobile | `docs/roadmaps/platforms-next.md`; AND tasks | Paused | AND-008 |
| Intel/universal macOS | Not supported in R1 | Release | This matrix; REL-003 | Paused/out of scope | New scope decision |

## Providers

| Provider / surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| Codex discovery/install | Finds supported Codex CLI or gives actionable install/unsupported-version guidance | Integrations | `tests/server/backend.test.ts` "Codex discovery…"; runtime baseline script | Partial | CDX-001 |
| Codex sign-in/account | Existing external sign-in or supported managed sign-in; expiry/account change visible | Integrations + UI | CDX-002 real account smoke; backend fake account fixture | Partial / evidence gap | CDX-002, QA-008 |
| Codex models/effort | Catalog; selected model's verified effort options/default | Integrations + UI | `tests/server/model-options.test.ts`; `docs/benchmarks/BEN-001-foundations.md`; EFF-012 | Verified for Codex metadata/options; macOS assistive/zoom evidence pending | CDX-004, EFF-012 |
| Codex chat | Stream reply, tool activity, Stop, restart/resume | Host + QA | `tests/server/backend.test.ts`; `tests/ui/smoke.spec.ts`; live `gpt-6.1-sol` smoke in [validation](../validation.md#m2-real-provider-smoke) | Real chat, Stop, Work-mode write, restart, and resume smoke verified; tool journey pending | CDX-003/006, QA-005/008 |
| Codex work mode/approvals | Command/file/permission approvals; decline; no fabricated answers | Host + UI | backend approval/interrupt cases; side-panel approval smoke; HIL tests | Partial (real HIL journey pending) | CDX-005, HIL-006 |
| Codex app/MCP use | Inventory and real tool use through the runtime | Integrations + QA | backend inventory/capability fixtures; MCP-022 real journey | Partial / evidence gap (inventory and inspection verified; real tool use pending) | MCP-022, QA-008 |
| Codex edit/remove/restart | Disconnect/reconnect, credential clear, restart recovery | Host + UI | PVD-005/006; QA-005 | Planned | PVD-005/006, QA-005 |
| OpenCode discovery/auth | Supported CLI/version, auth/readiness distinct from model count | Integrations | `tests/server/backend.test.ts` "OpenCode provider…"; OPC-001 probe | Partial | OPC-001 |
| OpenCode models/effort | Catalog and verified model variants/effort | Integrations + UI | OPC-001/004; EFF-012 | Partial (no variant mapping) | OPC-004, EFF-012 |
| OpenCode chat/tools | Stream, tool activity, policy-consistent Chat/Work, Stop, resume | Host + QA | backend CLI session test; live `opencode-go/deepseek-v4.1-flash` smoke in [validation](../validation.md#m2-real-provider-smoke); OPC-002/003/006 | Real chat smoke verified; tool/Stop/policy journey pending | OPC-002/003/006, QA-008 |
| OpenCode edit/remove/restart | Disconnect/reconnect, clear config, restart recovery | Host + UI | PVD-005/006; OPC-006 | Planned | PVD-005/006, OPC-006 |
| OpenAI-compatible / Cloud | **Deferred to distant future — not R1** | Integrations + UI | Not part of R1 evidence | Deferred | Requires amended scope + BEN-005 + HTTP-006 |
| Antigravity / Gemini | **Deferred to distant future — not R1** | Integrations | Not part of R1 evidence | Deferred | Requires amended scope + BEN-007 + GEM-004 |
| Ollama | **Deferred to distant future — not R1** | Integrations | Not part of R1 evidence | Deferred | Requires amended scope + BEN-006 + OLL-004 |
| Provider switch/binding | Provider/account/workspace/model change cannot reuse incompatible session | Host | session-binding tests; FND-007 | Verified in fixtures | QA-004 |
| Provider failures | 401/403/404/408/429/5xx, timeout, malformed catalog, empty stream, retry policy | Host + QA | PVD-016 fixtures; HTTP-002; QA-003 | Fixture-covered for R1 adapters; real journey evidence pending | QA-003 |

## MCP and Connect Apps

| Surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| App inventory | Scoped inventory for the selected chat/workspace, pagination, status/auth mapping | Integrations + Host | `app-inventory.test.ts`; backend inventory assertions; MCP-003/004 | Verified in fixtures | MCP-022 |
| Add local stdio app | Add/configure/validate local server | Host + UI | MCP-005–007 tests | Config record only; runtime add/adoption pending | MCP-006/007, MCP-022 |
| Add remote HTTP/OAuth app | Add, authenticate, re-auth, scope, revoke | Host + Integrations + UI | MCP-005/008/009; backend OAuth fixture; QA-008 real OAuth | Codex OAuth start/correlation implemented; live OAuth, re-auth, scope, and revoke pending | MCP-010/011, MCP-022 |
| App use in run | Tool call belongs to the run; activity and errors are visible | Integrations + QA | MCP-016–020; QA-005 | Partial (runtime-owned only) | MCP-022, QA-005 |
| App disable/remove | Disable/remove without corrupting other connections or active runs | Host + UI | MCP-013/014; QA-005 | Reload implemented; disable/removal policy pending | MCP-013/014, MCP-022 |
| User questions/forms/approvals | Correlated question/form/URL/approval; decline/timeout/restart; no fabricated answer | Host + UI | `interactions.test.ts`; `hil.test.ts`; backend question/form fixtures; HIL-001–006; QA-005 | Questions/forms answered and redacted in fixtures; approvals correlated; URL flow and real HIL journey pending | HIL-004/006, QA-005 |
| Launch app catalog | Only verified connectors advertised; custom setup otherwise | Product + QA | D-05; MCP-018 evidence | Planned (candidates only) | MCP-022, REL-008 |

## Reasoning controls

| Surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| Model capability metadata | Preserve verified enum/budget/boolean/default per model | Integrations + Host | EFF-001–006; [reasoning verification](../reasoning-verification.md); `tests/server/provider-contract.test.ts` | Implemented for Codex; OpenCode explicit unknown; HTTP/Ollama deferred | EFF-012 |
| Picker/selection | Only selected model's options; unknown uses default; no guessed parameter | UI + Host | EFF-007–012; `tests/ui/smoke.spec.ts`; `tests/server/model-options.test.ts` | Implemented; accessibility/real-model gate pending | EFF-012 |
| Switching/migration | Switching model/agent/chat migrates valid effort or uses new default | Host + UI | EFF-005/006/012; App migration effect | Implemented | EFF-012 |
| Cross-surface consistency | Composer, settings, agent form, chat all use the same effective value | UI + Host | EFF-009/012 | Partial (Agent form/settings controls still minimal) | EFF-012 |

## Agent skills

| Surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| Skill discovery/source | Agent Skills format; Codex/OpenCode native roots; provenance | Integrations + Host | SKL-001–007; BEN-023 | Planned | SKL-020 |
| Create/add/import | Create/import without executing scripts; validation/adversarial cases | Host + UI | SKL-002–006; import fixtures | Planned | SKL-020 |
| Scope/enable/use | Per-agent/project/global scope; actual native use; HTTP instruction-only disclosure | Integrations + UI | SKL-008–015; QA-005 | Planned | SKL-020 |
| Edit/update/disable/remove/export | Managed/external ownership, update/rollback, export | Host + UI | SKL-013–015; SKL-018/019 | Planned | SKL-020 |
| Runtime capability disclosure | Unsupported skill/runtime visibly unsupported | UI + Product | D-10; SKL-011/012 | Planned | SKL-020 |

## ElevenLabs Speech-to-Text

| Surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| Key setup/credential policy | Add/test/replace/clear; Keychain or session-only; key never in renderer | Host + UI | STT-002; PVD-003; credential scans | Planned | STT-018 |
| Capture/permission | Explicit start/stop/cancel; first-use, denied, missing/busy device | Desktop + UI | STT-007/008; signed-Mac microphone test | Planned | STT-018 |
| Transcript stream/edit | Partial/committed/revised/out-of-order events; editable draft preserved | UI + Integrations | STT-009/012; fixture corpus | Planned | STT-018 |
| Explicit Send through selected Agent | Uses chat's Agent/model/effort/skills/tool policy; never auto-sends | UI + Host | STT-010/011; QA-005 | Planned | STT-018 |
| Quality/latency/cost | Measured WER/CER, latency, correction burden, cost | QA + Product | STT-013/014; BEN-020 | Planned | STT-018 |
| Signed-Mac microphone | Purpose text, entitlement, deny/re-enable, sleep/wake, upgrade | QA + Release | STT-017; REL-007 | Planned | STT-018, REL-007 |

## Core workspace and UI

| Surface | R1 claim | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| Agents/groups | Create/customize/archive/group; persisted | UI + Host | `tests/ui/e2e.spec.ts`; backend import/group tests | Partial | COR-001/002 |
| Chats/search | Create/rename/archive/search; drafts; history/retry | UI + Host | smoke/e2e/backend tests; COR-003/004 | Partial | COR-009 |
| Composer/attachments | Text attachments, drag/drop, Enter/Shift+Enter, stop | UI | smoke/e2e tests; COR-004/005 | Partial | COR-009 |
| One-time schedules | Create/list/run once; missed-run behavior | Host + UI | backend "schedules exactly once"; e2e schedule test | Partial | COR-006 |
| Import/export | Round-trip without credentials or provider thread IDs | Host + UI | backend validation; e2e export/import | Partial | COR-007 |
| Recovery | Corrupt state backup, crash/restart, interrupted run, old data | Host + QA | backend corrupt-state/lock tests; QA-009 | Partial | COR-006/009, QA-009 |
| Files/Terminal | Read-only workspace tree; path traversal/symlink protection; activity detail | UI + Host | backend files test; e2e Files/Terminal; smoke side panel | Partial | COR-008 |
| Keyboard/a11y | Keyboard paths, focus trap/restore, axe, VoiceOver, zoom/reflow, reduced motion | UI + QA | `tests/ui/accessibility.spec.ts`; smoke keyboard tests; QA-007 | Partial (axe only; manual AT/zoom missing) | UX-005, QA-007 |
| Performance | Startup, stream latency, memory, large workspace/SSE budgets | QA + Host | QA-002 baselines | Planned | QA-002 |

## Negative and recovery states

| State | R1 requirement | Owner | Test / evidence location | Current status | Gate |
| --- | --- | --- | --- | --- | --- |
| Unauthenticated API | 401; no state change | Host | backend auth cases | Partial | FND-004 |
| Revoked/rotated device | Existing streams stop; reconnect rejected; other devices unaffected | Host | `tests/server/backend.test.ts` device-stream test; QA-004 real reproduction | Verified in fixture; real-device evidence pending | QA-004 |
| Auth expired/denied | Actionable re-auth; no cached success | Integrations + UI | PVD-002/016; CDX-002; OPC-001 | Planned | PVD-016 |
| Offline/network drop | Bounded error; no duplicate turn; recovery | Host + UI | HTTP-002; QA-009 | Planned | QA-009 |
| Timeout/hang | Shared budgets; cleanup; no orphan process | Host | FND-010; OPC-002 | Planned | FND-010 |
| Stop/cancel | Confirmed termination before releasing chat | Host | `tests/server/backend.test.ts` OpenCode Stop/shutdown tests; OPC-002/QA-004 real runtime | Verified in fixture; real-runtime evidence pending | OPC-002, QA-004 |
| Crash/corrupt state | Recover primary/backup or fail explicitly; no hidden duplicate work | Host | `tests/server/persistence.test.ts`; `schema-migration.test.ts`; QA-009 real crash evidence | Verified in fixture; real crash evidence pending | QA-009 |
| Schema/runtime drift | Disable affected adapter with actionable message; no stale-field substitution | Integrations | `scripts/runtime-baseline.mjs`; CDX-001; OPC-001 | Partial | CDX-001/OPC-001 |
| Import failure | Reject invalid references/IDs; no partial merge | Host | `tests/server/persistence.test.ts` rollback case; backend validation/import tests | Verified in fixture; product recovery evidence pending | COR-007 |
| Permission denied (files/mic/apps) | Visible recovery; no silent fallback | UI + Host | STT-007; COR-008; HIL | Planned | STT-018, COR-009 |

## Evidence locations

| Evidence type | Location |
| --- | --- |
| Dated executed checks | `docs/validation.md` |
| Scope comparisons and decisions | `docs/benchmarks/` |
| Runtime/schema fixtures | `tests/fixtures/runtime-baselines/` |
| Backend/contract tests | `tests/server/*.test.ts` |
| UI smoke/visual/axe/E2E | `tests/ui/*.spec.ts`, `docs/screenshots/` |
| Package/signing/clean-Mac | REL tasks; `docs/validation.md` |
| Real-service journeys | QA-008 evidence, linked from validation and the owning task |

## Maintenance rule

Every new advertised provider, transport, auth flow, effort mode, speech/skill journey, platform, or negative state must add a row here before it appears in onboarding, settings, release notes, or support material. A row marked **Verified** needs a dated evidence link; otherwise it stays Partial/Planned/Evidence gap. QA-001 can close only after BEN-013 is accepted and every R1 row has an owner, test/evidence location, and accepted result or an explicit scope exclusion.
