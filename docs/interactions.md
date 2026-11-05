# Pending interactions and recovery

Status: **FND-009 recorded 2026-11-05.** This defines the durable correlation record for approvals, questions, forms, and URL requests, and what happens on refresh, restart, or host switch.

[Release contract](release-contract.md) · [Run lifecycle](run-lifecycle.md) · [Persistence](persistence.md) · [Validation](validation.md) · [FND-009 task](project-roadmap.md#foundation-tasks)

## Record

`PendingInteraction` is stored in `interactions.json` with:

- `id`, `hostId`, `runId`, `conversationId`, `providerId`, optional `threadId`
- `kind`: `approval`, `question`, `form`, or `url`
- `title`, optional `description`, `command`, `url`
- `status`: `pending`, `accepted`, `declined`, `cancelled`, or `expired`
- `createdAt`, `updatedAt`, optional `expiresAt`

The `hostId` is derived from the workspace data directory. `runId`, `conversationId`, and `threadId` correlate the request to the exact run; a refresh or host switch cannot route a decision to a different conversation.

## Lifecycle

| Event | Behavior |
| --- | --- |
| Approval requested | A pending record is written before the run is shown as `waiting`; the in-memory responder remains the only way to accept/decline. |
| User accepts/declines | The run approval is updated and the interaction record becomes `accepted`/`declined`. |
| Run finishes with a pending approval | The approval is declined in memory and the interaction becomes `cancelled`. |
| Host restarts | Every still-`pending` record is marked `expired` during `InteractionStore.load()` before the API is available. It cannot be acted on without a live provider callback. |
| Refresh | The run ledger still exposes the live approval; the durable record provides correlation/recovery. |
| Host switch | Each data directory has its own `interactions.json` and host ID; another host's pending requests are not shown or actionable. |
| Corrupt file | The damaged file is renamed to `interactions.json.corrupt-<timestamp>` and a clean version-1 store is created; the evidence is retained. |

Unsupported Codex elicitation, tool questions, and unknown interactive requests are recorded as `form`/`question`/`url`-compatible notices with `status: cancelled`, alongside the existing activity. A real answer flow is owned by HIL-001–HIL-006; this task does not fabricate answers or accept unseen forms.

## Storage

- File: `interactions.json`, mode `0600`, version 1.
- Writes are serialized, fsynced, and atomically renamed.
- Pending records are never pruned. Resolved records are capped at the 200 most recent.
- The workspace export contains `state.json` data only; interaction records are local host state and are not exported.
- No provider keys or secrets are stored; command/description text is local workspace data.

## API

`GET /api/bootstrap` includes `interactions: PendingInteraction[]` in addition to state, providers, and runs. Approval decisions continue to use `POST /api/approvals/:id`; the interaction record shares the approval ID.

The current UI reads approvals from the run ledger. A future interactions panel can render the bootstrap list without changing the correlation contract.

## Verification

`tests/server/interactions.test.ts` covers:

1. Pending records survive a write/read cycle but become `expired` on the next host load; resolved records remain.
2. Two hosts/data directories keep separate records and host IDs.
3. A corrupt file is preserved and replaced with a clean store.

`tests/server/backend.test.ts` covers:

- A real approval fixture writes `kind: approval`, `runId`, `conversationId`, `providerId`, `threadId`, and `status: pending`.
- Approving it persists `status: accepted` before the run completes.
- Existing approval/decline and run-reservation tests remain green.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 45/45 server/model-option tests pass; production build pass with the existing chunk-size advisory.

## Remaining work

- **HIL-001–HIL-006:** render and answer questions/forms/URL requests; this record deliberately records unsupported requests as cancelled rather than pretending they succeeded.
- **FND-010:** shared timeout/cancellation budgets, including interaction expiry.
- **FND-011:** diagnostics/correlation IDs for interaction failures.
- **UI:** add an interaction list/recovery surface if refresh/restart recovery needs to be visible rather than only diagnostic.
