# Durable run and termination lifecycle

**Implementation correction (2026-11-05):** retained Codex behavior now rolls back the reservation/messages on an initial save failure, publishes `stopping` until provider cleanup, rejects concurrent sends, waits for run finalizers during shutdown, and saves active messages as `interrupted`. The OpenCode error-child/descendant finding remains recorded but OpenCode is paused; its API routes are gated.

Status: **FND-006 source corrections implemented; Mac runtime/package evidence remains open.** This defines how a chat run is reserved, interrupted, terminated, and recovered across the Codex, OpenCode, and HTTP/Ollama adapters.

[Release contract](release-contract.md) · [Durable schema](data-schema.md) · [Authority model](authority-model.md) · [Validation](validation.md) · [FND-006 task](project-roadmap.md#foundation-tasks)

## Run states

| State | Meaning | Durable evidence |
| --- | --- | --- |
| `running` | Provider work is active and the chat is reserved. | Run ledger in memory; user message and streaming assistant message persisted. |
| `waiting` | The provider is waiting for a human approval or answer. | Run approvals persisted with the run/message; pending UI state rebuilt from the ledger. |
| `interrupted` | The user stopped the run or the host shut down while it was active. | Assistant message status `interrupted`; reservation released only after provider cleanup. |
| `completed` | The provider finished with a response. | Assistant message completed; activities persisted. |
| `failed` | The provider or transport failed. | Assistant message failed with a bounded error/activity. |

Personal v1 enforces one active controller per host in `RunManager.send()`, with a clear 409 for another chat. `send()` checks the reservation before and after filesystem validation so simultaneous POSTs cannot append two prompts to one provider turn. The initial `publishState` is wrapped: on failure it clears the controller/run, removes both appended messages, restores the previous binding/title, and rethrows so a retry is not permanently blocked. On the ordinary provider path, the controller is removed in the finalizer after cleanup.

## Termination rules

### Codex

- Stop publishes `stopping`, then sends `turn/interrupt` for the known thread/turn.
- An RPC acknowledgement is not completion; the adapter waits for matching turn/completed or child exit. `RunManager` keeps the chat reserved and only publishes `interrupted` after approvals/interactions are settled and the controller is removed.
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

1. Stops the scheduler and marks active runs `stopping`.
2. Aborts every active controller.
3. Calls `ProviderManager.close()`, which closes Codex and waits for OpenCode children.
4. Waits for each run finalizer (approvals/interactions cancelled, controller removed), then marks any leftover run/message `interrupted`.
5. Flushes interactions and saves the workspace.

If the process dies before finalization, `validateImport()` converts a persisted `streaming` message to `interrupted` on the next load. The run ledger itself is intentionally bounded/in-memory; durable message/activity state is the recovery source alongside FND-009's correlated pending-interaction records.

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

- **V1-06/HIL-006:** real Codex approval decline/accept now passes; the live native question path and packaged-Mac recovery remain. MCP forms/URL work is paused.
- **V1-06/08:** verify Finder launch, native folder dialog, Quit/relaunch, and VoiceOver/zoom on the actual Mac.
- **OPC-005:** OpenCode event decoding remains paused; add fixtures before re-enabling it.
- **QA-009:** crash/write-failure/sleep/network-drop recovery beyond the current shutdown and browser offline paths remains a Mac candidate check.
