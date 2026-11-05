# MCP and Connect Apps completion

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Current state](../current-state-review.md)

Current state: Codex MCP inventory plus inherited runtime tool execution; connection management is incomplete. [Integration review](../integration-review.md) distinguishes server discovery from usable app workflows. Recommended R1 architecture uses provider adapters as execution/auth owners behind a host connection service; FND-001 must confirm that choice. A provider-independent MCP executor for HTTP models is tracked separately in FUT-001.

All task statuses start **To do**: partial existing code is reviewed in the audit, and task closure requires the acceptance evidence below. Owner values are suggested roles, not assigned people. Targets: **R1** first public macOS release; **R2** subsequent product completion. Priority/status rules and the dependency process are in the master roadmap.

## MCP connection service and runtime adapters

Development gate: **BEN-008** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| MCP-001 | R1 | P0 | Done | Host | BEN-008, FND-003, FND-004 | **Define an app/server connection record.** Accepted 2026-11-05: `AppRecord` now carries stable scoped ID, host/provider/workspace, source ownership, transport, capability snapshot, credential reference, and last-checked/error metadata with validation/round-trip tests. [Schema](../data-schema.md). |
| MCP-002 | R1 | P0 | Done | Integrations | BEN-008, FND-002 | **Pin and probe runtime/protocol capabilities.** Accepted 2026-11-05: Codex 0.166.0/OpenCode 2.2.5/MCP 2026-07-28 surfaces pinned with explicit fallbacks in [the baseline](../mcp-runtime-baseline.md). |
| MCP-003 | R1 | P0 | Done | Integrations | BEN-008, MCP-001, MCP-002 | **Complete context-aware Codex inventory.** Accepted 2026-11-05: inventory uses the selected conversation's provider thread with per-thread dedupe, 200-server pagination bound, partial results/error envelope, AbortSignal cancellation (`$/cancelRequest`), checked-at state, and scoped/partial/cancel tests. [Baseline](../mcp-runtime-baseline.md). |
| MCP-004 | R1 | P1 | Done | Integrations | BEN-008, MCP-001, MCP-002 | **Add OpenCode MCP inventory.** Accepted 2026-11-05: OpenCode `mcp list` returns provider-qualified IDs and connected/needs-auth/disabled status; tool count is omitted rather than inferred because the supported CLI does not expose tools. Codex carries tool names, resource count, auth status, server version, and transport without leaking schemas. Auth-state fixture covers connected and needs-auth. [Baseline](../mcp-runtime-baseline.md). |
| MCP-005 | R1 | P0 | Done | Host | BEN-008, MCP-001, FND-012, PVD-003 | **Implement managed configuration CRUD.** Accepted 2026-11-05: app-record GET/POST/PATCH/DELETE, transport/scope validation, credential references, host authority, atomic save/rollback, and backend test. |
| MCP-006 | R1 | P0 | To do | Host + UI | BEN-008, MCP-005 | **Adopt existing configurations safely.** Done when: Imported versus A Gent-managed entries are distinguishable; previewed changes preserve comments, unrelated settings, and external edits. |
| MCP-007 | R1 | P0 | To do | Integrations | BEN-008, MCP-005, FND-006 | **Complete local stdio lifecycle.** Done when: Structured command/args, cwd, restricted environment, dependency checks, start/stop/restart, and orphan cleanup work through the selected runtime owner. |
| MCP-008 | R1 | P0 | To do | Integrations | BEN-008, MCP-005, PVD-014 | **Complete remote Streamable HTTP lifecycle.** Done when: Endpoint/auth configuration, initialization, disconnect/cancel, timeouts, reconnect, and compatible protocol versions pass transport fixtures. |
| MCP-009 | R1 | P0 | To do | Integrations + UI | BEN-008, MCP-002, MCP-008 | **Implement supported OAuth handoff.** Done when: Start sign-in through the selected runtime owner, open only the reviewed URL, correlate completion, and show success/failure without copying another app's tokens. |
| MCP-010 | R1 | P0 | To do | Host | BEN-008, MCP-009, PVD-003 | **Handle authorization and credential lifecycle.** Done when: Requested/granted scopes, issuer/resource binding, refresh/expiry, logout/revoke, locked storage, and no token forwarding are tested for the chosen auth owner. |
| MCP-011 | R1 | P0 | To do | Host + UI | BEN-008, MCP-009, FND-009 | **Handle cancelled and stale sign-ins.** Done when: Cancel, timeout, closed browser, duplicate callback, app removal, and host/account switch cannot attach the wrong account or leave a permanent spinner. |
| MCP-012 | R1 | P0 | To do | Integrations | BEN-008, MCP-005, MCP-015 | **Enforce enable/disable.** Done when: The next applicable turn exposes only enabled servers/tools; toggles persist and take effect in runtime behavior, not just UI state. |
| MCP-013 | R1 | P0 | To do | Host + UI | BEN-008, MCP-005, MCP-010, FND-006 | **Complete disconnect and removal.** Done when: A clear policy handles active calls, credentials, owned config/processes, and unrelated imported entries; stale access cannot survive removal. |
| MCP-014 | R1 | P0 | To do | Integrations | BEN-008, MCP-005, MCP-002 | **Apply configuration to loaded sessions.** Done when: Use supported reload or restart semantics; identify affected threads; refresh tool discovery without disturbing unrelated in-flight turns. |
| MCP-015 | R1 | P1 | Done | Integrations | BEN-008, MCP-003, MCP-004 | **Expose capability-aware tool/resource discovery.** Accepted 2026-11-05: `/api/apps/:id/capabilities` returns bounded tool names/descriptions/input schemas (50 KB per schema, 500 tools), resources, resource templates, advertised prompt support, server info/capabilities, tool-list meta, truncation, and checked-at state. Discovery is fetched on demand so schema changes appear without a stale cache; empty catalogs are distinct from `toolsError`; OpenCode returns `supported: false` rather than inventing tools. Inspect UI added. |
| MCP-016 | R1 | P0 | To do | Host + UI | BEN-008, MCP-012, MCP-015 | **Implement per-agent/project app access.** Done when: The selected allowed-tool/server policy is enforced in runtime requests, survives restart, and is tested across two agents with different access. |
| MCP-017 | R1 | P0 | To do | Integrations | BEN-008, MCP-015, FND-009 | **Route and validate tool calls.** Done when: Namespaced IDs, schema validation, call/run/thread correlation, duration/result budgets, cancellation, and failure propagation are tested. |
| MCP-018 | R1 | P0 | To do | Host + UI | BEN-008, MCP-017, FND-004 | **Complete app action approval policy.** Done when: Read/write/destructive operations follow the agreed policy; requests show useful arguments and scope; decline/cancel prevents execution. |
| MCP-019 | R1 | P1 | To do | Host + UI | BEN-008, MCP-017, FND-011 | **Render bounded app results and errors.** Done when: Text/structured results and supported artifacts are readable and redacted; remote content remains data; oversized/error results do not break chats. |
| MCP-020 | R1 | P1 | To do | Host | BEN-008, MCP-014, FND-010 | **Keep app readiness current.** Done when: Runtime notifications or bounded refresh handle crash, sleep/wake, auth expiry, server restart, and tool changes without duplicate sessions. |
| MCP-021 | R1 | P0 | To do | QA | BEN-008, MCP-007, MCP-008, MCP-010, MCP-017 | **Create deterministic MCP integration fixtures.** Done when: Local, remote anonymous, token-protected, OAuth, malformed-schema, slow/crashing, duplicate-name, and rejected-approval servers are covered. |
| MCP-022 | R1 | P0 | To do | QA + Integrations | BEN-008, MCP-021, APP-012, HIL-006 | **Accept the full app lifecycle.** Done when: For every advertised runtime/transport: add → authenticate → discover → allow → use in chat → restart → disable → remove passes with real supported integration evidence. |

## Connect Apps product flow

Development gate: **BEN-009** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| APP-001 | R1 | P1 | To do | Product + UI | BEN-009, FND-001, MCP-001 | **Define Connect Apps information architecture.** Done when: Models, MCP servers, native-provider apps, host pairing, and their ownership are distinguishable; a status inventory is not presented as a connection workflow. |
| APP-002 | R1 | P1 | To do | UI | BEN-009, MCP-005, APP-001 | **Build Add app/server forms.** Done when: Local command/args/cwd/env references and remote URL/auth fields validate with accessible errors and a reviewable configuration summary. |
| APP-003 | R1 | P1 | To do | Product + Integrations | BEN-009, FND-001, MCP-002 | **Curate the launch connector catalog.** Done when: Choose a small named support list; verify official endpoints/publishers, auth requirements, setup instructions, and versioned presets before claiming support. |
| APP-004 | R1 | P1 | To do | UI | BEN-009, MCP-015, APP-001 | **Add app details and tool inspection.** Done when: Users can identify provider/scope/account, inspect supported tools, see failures, and distinguish configured, authenticated, enabled, and callable states. |
| APP-005 | R1 | P0 | To do | UI | BEN-009, MCP-009, MCP-011 | **Finish the sign-in experience.** Done when: Connect/reconnect/cancel, return-to-app, expiry, denied consent, and retry show accurate state and preserve entered non-secret configuration. |
| APP-006 | R1 | P1 | To do | UI | BEN-009, MCP-020 | **Complete loading, empty, offline, and error states.** Done when: No apps, no results, missing runtime, unsupported capability, partial inventory, timeout, and reconnect each provide a working next action. |
| APP-007 | R1 | P1 | To do | UI | BEN-009, MCP-012, MCP-013 | **Provide enable, disable, edit, disconnect, and remove actions.** Done when: State updates are reversible where appropriate; failure rolls back UI; confirmation copy matches actual scope and credential/config removal. |
| APP-008 | R1 | P1 | To do | UI | BEN-009, MCP-016 | **Expose app access in agent/project settings.** Done when: Choose eligible apps/tools for an agent or project; current scope is visible and unsupported providers cannot imply granted access. |
| APP-009 | R1 | P1 | To do | UI + Integrations | BEN-009, MCP-017, MCP-018 | **Add a non-mutating connection test.** Done when: Default testing checks readiness/discovery; an optional tool test previews arguments and obeys approval policy instead of silently writing external data. |
| APP-010 | R1 | P1 | To do | Host + UI | BEN-009, MCP-002, APP-001 | **Separate native-provider apps from raw MCP servers.** Done when: Where runtime capabilities support native app inventory, use its stable identities/readiness; under-development install APIs are not treated as a production marketplace. |
| APP-011 | R1 | P1 | To do | QA + UI | BEN-009, APP-002, APP-004, APP-005, APP-007 | **Stress-test all Connect Apps surfaces.** Done when: Long/duplicate names, zero/one/many tools, all statuses, RTL, 320px, keyboard, and actual zoom pass with saved fixtures/evidence. |
| APP-012 | R1 | P0 | To do | QA + Product | BEN-009, APP-003, APP-005, APP-007, APP-008, APP-009, APP-010, APP-011 | **Accept first-time app setup.** Done when: A new user can select a supported connector, connect it, scope it, use a real tool in chat, understand failures, and remove access without editing config files manually. |

## Questions, approvals, and elicitation

Development gate: **BEN-010** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| HIL-001 | R1 | P0 | Done | Host | BEN-010, FND-009, MCP-002 | **Define pending interaction types and routing.** Accepted 2026-11-05: typed approval/question/form/URL records with host/run/conversation/provider/thread IDs, response payload, accept/decline/cancel API, double-response rejection, and restart expiry tests. |
| HIL-002 | R1 | P0 | Done | Host + UI | BEN-010, HIL-001 | **Implement real tool-question answers.** Accepted 2026-11-05: Codex `requestUserInput` questions are correlated and rendered; listed options/free text validate against the runtime schema; the selected answer returns to Codex; decline/cancel is explicit and empty `{}` answers are removed. Backend fixture covers invalid option, accepted answer, and double-submit. |
| HIL-003 | R1 | P0 | Review | Host + UI | BEN-010, HIL-001, MCP-010 | **Implement supported elicitation forms.** Supported primitive/enum/multi-select fields render and validate; forms/secret answers are redacted from the ledger; unsupported schemas decline with recovery text. Remaining review: browser keyboard/focus and sensitive-value fixtures. |
| HIL-004 | R1 | P0 | To do | Host + UI | BEN-010, HIL-001, MCP-009 | **Implement URL-flow confirmation and completion.** Done when: Purpose, destination, external opening, expected return, and status are visible; untrusted URLs/callback mismatches cannot complete the wrong flow. |
| HIL-005 | R1 | P0 | To do | Host | BEN-010, HIL-002, HIL-003, HIL-004, FND-010 | **Close pending interactions deterministically.** Done when: Stop, run completion, disconnect, expiry, shutdown, and double submission resolve each request once and never execute an abandoned action. |
| HIL-006 | R1 | P0 | To do | QA | BEN-010, HIL-005 | **Accept human-in-the-loop recovery.** Done when: Keyboard/focus, refresh, simultaneous chats, late responses, denial, and runtime failure pass; pending state never displays as completed work. |

## Gate

MCP-022 is the acceptance gate. Adding a card, displaying a tool count, or storing config does not close it; authentication, scoped execution, restart, disable, and removal must work end to end.
