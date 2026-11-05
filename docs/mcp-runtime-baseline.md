# MCP runtime and protocol baseline

Status: **MCP-002 recorded 2026-11-05.** Pins the R1 Codex/OpenCode MCP surfaces and the MCP transport baseline; deferred providers are excluded.

[Connect Apps board](roadmaps/connect-apps.md) · [BEN-008](benchmarks/BEN-008-mcp-runtime.md) · [Runtime baseline](runtime-baselines.md)

## Versions

| Runtime | Baseline | MCP surface |
| --- | --- | --- |
| Codex CLI/app-server | 0.166.0 | `mcpServerStatus/list`, `mcpServer/oauth/login`, `mcpServer/resource/read`, `mcpServer/tool/call`, `config/mcpServer/reload`; app list/installed/read |
| OpenCode | 2.2.5 | `opencode mcp list/add/auth/logout`; v2 `/api/mcp` plus experimental add/remove/connect/disconnect; local/remote/OAuth config |
| MCP spec | 2026-07-28 | stdio newline-delimited JSON-RPC; Streamable HTTP single endpoint with JSON/request-scoped SSE; cancellation/teardown are transport-specific |

## Behavior and fallbacks

| Capability | Behavior / fallback |
| --- | --- |
| Inventory | Codex status is paginated (cursor/limit) and scoped by thread when supplied. OpenCode `mcp list` inventory is provider-qualified; no second MCP executor. |
| Auth | Runtime owns OAuth/token storage. A Gent surfaces needs-auth and starts runtime auth; it never receives long-lived MCP tokens. |
| Config adoption | External config is read-only until explicit adoption; writes require atomic rollback. |
| Reload | Use runtime reload/restart; absent reload disables with an actionable message. |
| Tool call | Runtime executes; A Gent records activity/approval and never invents a tool result. |
| Unknown/experimental methods | Explicit unsupported/fallback; no private protocol assumptions. |
| Timeout/cancel | Shared tool/interaction budgets; abort closes the runtime request/stream. |

## Verification

- Runtime baseline fixtures: `tests/fixtures/runtime-baselines/codex-0.166.0/`, OpenCode 2.2.5 OpenAPI.
- Existing backend inventory assertions use Codex `mcpServerStatus/list`.
- No live OAuth/remote MCP connector was exercised; MCP-022 remains the acceptance gate.

Limitations: OpenCode MCP tool/resource detail and auth-state fixtures remain MCP-004 review work; deferred HTTP/Ollama/Gemini adapters are out of R1 MCP scope.
