# Timeout budgets and cancellation primitives

Status: **FND-010 recorded 2026-11-05.** All host/provider work uses the shared budgets in `server/budgets.ts`; adapters may choose a narrower budget but should not invent unrelated numbers.

[Release contract](release-contract.md) · [Run lifecycle](run-lifecycle.md) · [Interactions](interactions.md) · [Validation](validation.md) · [FND-010 task](project-roadmap.md#foundation-tasks)

## Budgets

| Budget | Value | Applied to |
| --- | ---: | --- |
| `startup` | 30s | Codex app-server initialize and first connection. |
| `catalog` | 15s | Codex `model/list`, HTTP/Ollama `/models`/`/api/tags`, OpenCode `models`. |
| `auth` | 20s | Codex `account/read` and readiness probes. |
| `tool` | 60s | Codex default RPC and `mcpServerStatus/list`; tool-shaped requests. |
| `session` | 120s | Codex `thread/start`, `thread/resume`, `turn/start` acknowledgement. |
| `interrupt` | 10s | Codex `turn/interrupt` acknowledgement and interruption deadline. |
| `stream` | 15min | HTTP/Ollama streaming, OpenCode run, and the RunManager total-run safety net. |
| `interaction` | 5min | Pending interaction `expiresAt`; a restart expires anything still pending immediately. |
| `shutdown` | 6s | Codex/OpenCode child termination confirmation. |
| `terminationGrace` | 2s | SIGTERM before SIGKILL for OpenCode and Codex close. |
| `terminationKill` | 3.5s | Codex SIGKILL escalation. |
| `heartbeat` | 15s | SSE heartbeat comment. |
| `maxResponseBytes` | 8 MB | HTTP/OpenCode response caps. |
| `sseBufferBytes` | 2 MB | Slow SSE client disconnect threshold. |

## Primitives

`server/budgets.ts` exports:

- `budgetSignal(name, timeoutMs?)` — a timeout `AbortSignal`.
- `combineBudget(name, parent?, timeoutMs?)` — timeout combined with the caller's cancellation.
- `withBudget(name, operation, { parent?, timeoutMs? })` — runs an operation under a bounded signal and clears the timer in `finally`.

The caller's abort remains authoritative. A timeout is an additional bound, not a replacement for user Stop or host shutdown.

## Lifecycle mapping

| Feature area | Budget / cancellation |
| --- | --- |
| Startup | Codex initialize; a failed startup closes the owned child and reports an actionable provider status. |
| Catalog/auth | Provider catalog and account calls are bounded; a slow catalog cannot block the host indefinitely. |
| Tools | Codex tool/MCP status calls use the tool budget; tool cancellation still flows through the run signal. |
| Sessions | Thread/turn acknowledgement uses the session budget; a turn can stream up to the stream budget. |
| Streaming | HTTP/Ollama use `combineBudget('stream', request.signal)`; OpenCode uses the stream timer; RunManager aborts a run that exceeds the stream budget and records a failed timeout. |
| Interactions | New pending records receive `expiresAt = now + interaction`; restart marks pending records expired so they cannot be answered without a live provider. |
| Stop | Codex waits for turn completion/interrupt deadline/child exit; OpenCode SIGTERM → SIGKILL → shutdown deadline. |
| Shutdown | Provider close waits for child exit; RunManager saves state even if provider cleanup fails. |
| SSE | Heartbeat and slow-client buffer use the shared constants. |

## Verification

`tests/server/budgets.test.ts` covers the presence/ordering of budgets, timeout abort, parent cancellation, and `withBudget` cleanup. Existing lifecycle, persistence, and interaction tests verify the applied behavior.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 45/45 server/model-option tests pass; production build pass with the existing chunk-size advisory.

## Limits

- Budgets are policy defaults, not measured performance targets. QA-002 still must measure startup, catalog, and stream latency before publishing pass/fail budgets.
- The 15-minute stream cap is a safety net, not a product SLA.
- Provider-specific retry/backoff policy remains PVD-015/HTTP-002; this task only bounds and cancels work.
- Codex turn lifecycle can still take up to the stream budget; a provider that ignores interruption relies on the interrupt/termination path.
- Interaction expiry is recorded at creation; a future UI should surface the countdown/expiry state. HIL-001–HIL-006 owns the answer flow.
