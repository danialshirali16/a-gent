# Durable run and termination lifecycle

**Audit correction:** normal Stop/shutdown fixtures below are narrower than complete lifecycle acceptance. An OpenCode error-event child remained alive after run rejection and bridge.close(); some early error/limit paths settle/remove tracking before child exit, and descendants are not proven cleaned up. RunManager's first save can also strand a reserved chat; interrupt publishes interrupted before the UI can know cleanup finished. [V1-04](project-roadmap.md#recommended-execution-order) fixes retained Codex behavior; OpenCode stays paused.

Status: **FND-006 Review, reopened 2026-11-05.** This defines how a chat run is reserved, interrupted, terminated, and recovered across the Codex, OpenCode, and HTTP/Ollama adapters.

[Release contract](release-contract.md) · [Durable schema](data-schema.md) · [Authority model](authority-model.md) · [Validation](validation.md) · [FND-006 task](project-roadmap.md#foundation-tasks)

## Run states

| State | Meaning | Durable evidence |
| --- | --- | --- |
| `running` | Provider work is active and the chat is reserved. | Run ledger in memory; user message and streaming assistant message persisted. |
| `waiting` | The provider is waiting for a human approval or answer. | Run approvals persisted with the run/message; pending UI state rebuilt from the ledger. |
| `interrupted` | The user stopped the run or the host shut down while it was active. | Assistant message status `interrupted`; reservation released only after provider cleanup. |
| `completed` | The provider finished with a response. | Assistant message completed; activities persisted. |
| `failed` | The provider or transport failed. | Assistant message failed with a bounded error/activity. |

Current source limits one active controller per conversation, not one per host. Personal v1 requires the latter to be enforced in UI/API during V1-03. `RunManager.send()` checks the reservation before and after filesystem validation so simultaneous POSTs cannot append two prompts to one provider turn. On the ordinary provider path, the controller is removed in the run's finally block. Failure at the earlier first publishState occurs before that finalizer is attached and currently leaves a reservation.

## Termination rules

### Codex

- Stop sends `turn/interrupt` for the known thread/turn.
- An RPC acknowledgement is not completion; the adapter waits for matching turn/completed or child exit; current source does not handle turn/status/changed.
- If interruption is not confirmed within 10 seconds, the adapter closes the owned child and waits for exit.
- `CodexBridge.close()` ends stdin, escalates SIGTERM → SIGKILL, and waits for the child exit before resolving.

### OpenCode

- Stop sends SIGTERM to the owned child, schedules SIGKILL after 2 seconds, and has a 6-second confirmation deadline.
- On the normal Stop path, settlement waits for child close (or the deadline), keeping the chat reserved. Error-event/response-limit paths can settle earlier and are not covered by that guarantee.
- OpenCodeBridge.close sends SIGTERM/SIGKILL to children still in its tracking set and waits for exit or its deadline. Error settlement can already have removed a live child, so this is not complete cleanup.
- Tool execution still uses --auto; OPC-003 permission policy also remains incomplete.

### HTTP / Ollama

- The fetch uses the run abort signal plus a 15-minute timeout; cancellation aborts the stream and releases the reader in `finally`.
- There is no child process to confirm; a dropped stream is a transport failure, not a provider session that can be resumed.

## Shutdown and recovery

`RunManager.close()`:

1. Stops the scheduler.
2. Aborts every active controller.
3. Calls `ProviderManager.close()`, which closes Codex and waits for OpenCode children.
4. Saves the workspace.

The assistant message for an active run is marked `interrupted` by the run's finalizer. If the process dies before that finalizer, `validateImport()` converts a persisted `streaming` message to `interrupted` on the next load. The run ledger itself is intentionally bounded/in-memory; durable message/activity state is the recovery source alongside FND-009's correlated pending-interaction records.

## Verification

`tests/server/backend.test.ts` covers:

- **Codex shutdown:** `close()` resolves only after an ignored graceful stop is escalated and the child exits.
- **OpenCode shutdown:** `run()` rejects only after the child exits; the PID is gone.
- **OpenCode Stop:** the chat returns `409` immediately after interrupt while the child terminates, then accepts a new message only after exit.
- **Host shutdown:** an active OpenCode run is terminated, the child is gone, and `state.json` stores the assistant message as `interrupted`.
- **Existing reservation test:** simultaneous messages reserve one conversation and preserve the accepted prompt.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 45/45 server/model-option tests pass; production build pass with the existing chunk-size advisory. The Windows host terminates OpenCode immediately on SIGTERM, so the 2-second escalation path is covered by code and the POSIX fixture path rather than measured on this host; macOS package behavior remains a release check.

## Remaining work

- **FND-009/HIL-005/006:** correlation exists; reverify genuine core answers and deterministic failure/expiry/Stop cleanup. MCP forms/URL work is paused.
- **FND-010:** shared budgets/helpers exist; reverify their retained-runtime cleanup and UI semantics.
- **OPC-005:** add OpenCode event decoding fixtures for split UTF-8/JSON, tool status, and final partial lines.
- **QA-004:** reproduce the historical "OpenCode continues after Stop" finding against the current source on macOS and record evidence.
- **QA-009:** exercise crash/write-failure/sleep/network-drop recovery beyond the current shutdown path.
