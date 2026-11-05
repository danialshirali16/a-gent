# BEN-008 — MCP connection service and runtime ownership

Status: **Done — accepted for M3 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Connect Apps board](../roadmaps/connect-apps.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-008; covers MCP-001–MCP-022.
- **Question:** Where should MCP configuration, auth, execution, scope, and teardown live for R1, and how should A Gent observe/use Codex/OpenCode runtime connections without duplicating their process/auth paths?
- **Comparators:** Codex 0.166.0 app-server schema/docs; OpenCode 2.2.5 server/CLI + MCP docs; MCP 2026-07-28 transports spec; A Gent current Codex inventory.
- **Excluded:** individual connector onboarding UX (BEN-009), HIL interaction design (BEN-010), provider-independent MCP for HTTP models (FUT-001/R2).

## Evidence

| Source | Observation |
| --- | --- |
| Codex schema | `mcpServerStatus/list`, OAuth login, resource read, tool call, config reload, app list/installed methods; status includes auth/connection/tools/resources/capabilities. |
| Codex docs | App-server owns MCP config/auth/reload; `mcpServerStatus/list` supports cursor/limit, `detail`, `threadId`, `serverName`. |
| OpenCode 2.2.5 | MCP config supports local stdio and remote HTTP/OAuth, per-agent/global tool enablement, `mcp list/auth/logout`; v2 API exposes MCP list/add/connect/disconnect. |
| MCP spec | stdio is newline-delimited JSON-RPC over client-launched subprocess; Streamable HTTP is one endpoint with JSON or request-scoped SSE; cancellation/teardown are binding-specific. |
| A Gent current | `/api/apps` reads Codex `mcpServerStatus/list` with one global `lastThreadId`; no add/auth/scope/disable/remove API; OpenCode MCP not inventoried. |

## Decisions

1. **Codex/OpenCode own MCP execution/auth in R1.** A Gent owns stable connection records, host/scope ownership, inventory, enable/disable, and UI. No second process/config/auth path for the same server. (D-03.)
2. **Support local stdio and runtime-supported remote HTTP/OAuth.** Do not claim HTTP MCP for HTTP-only model adapters; FUT-001 remains R2.
3. **External config is discovered read-only by default.** Adoption/writes require explicit user action, atomic rollback, and never silently overwrite another client's config.
4. **Scope is explicit:** workspace/project, Agent, or chat, with effective grants observable. Inventory must use the selected chat/workspace, not one global thread.
5. **Capability snapshot:** record transport, auth state, tool count/details, resources, server info, last checked/error; absence is unknown, not "no tools".
6. **Lifecycle:** add/configure → validate → auth/OAuth → scope/enable → use → inspect → disable → remove, with restart/reload/recovery.
7. **Teardown:** disable/remove must not corrupt other servers; active runs must stop or surface a clear conflict.
8. **Errors:** auth, transport, discovery/tool-call, timeout, cancellation, and unsupported method are distinct; redaction applies.

## Delivery mapping

MCP-001–004 records/capabilities/inventory; MCP-005–014 config/OAuth/scope/lifecycle; MCP-015–020 execution/teardown; MCP-021 fixtures; MCP-022 acceptance.

## Limitations

No live OAuth/custom MCP server was exercised; Codex/OpenCode docs/schema and fixtures only. The MCP spec page was read 2026-11-05. Acceptance: Danial, 2026-11-05.
