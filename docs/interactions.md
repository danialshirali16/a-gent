# Pending interactions and recovery

**Personal-v1 context (2026-11-05):** retain native approvals/questions and their expiry/cancellation/recovery; full MCP forms/URL flows are paused. The verification below records historical M3 evidence, not a fresh Mac candidate pass. Durable event/decision ordering under failures remains a V1-04/06 acceptance requirement.

Status: **FND-009 recorded 2026-11-05.** This defines the durable correlation record for approvals, questions, forms, and URL requests, and what happens on refresh, restart, or host switch.

[Release contract](release-contract.md) · [Run lifecycle](run-lifecycle.md) · [Persistence](persistence.md) · [Validation](validation.md) · [FND-009 task](project-roadmap.md#foundation-tasks)

## Record

`PendingInteraction` is stored in `interactions.json` with:

- `id`, `hostId`, `runId`, `conversationId`, `providerId`, optional `threadId`
- `kind`: `approval`, `question`, `form`, or `url`
- `title`, optional `description`, `command`, `url`
- optional `payload`: typed questions (`id`, `header`, `question`, options, free-text/secret flags) or form fields (`string`, `number`, `integer`, `boolean`, `enum`, `multi-enum`, required/default/bounds/format)
- `status`: `pending`, `accepted`, `declined`, `cancelled`, or `expired`
- optional `response`: non-sensitive answer evidence; forms and secret questions store only `{ redacted: true }`
- `createdAt`, `updatedAt`, optional `expiresAt`

The `hostId` is derived from the workspace data directory. `runId`, `conversationId`, and `threadId` correlate the request to the exact run; a refresh or host switch cannot route a decision to a different conversation.

## Lifecycle

| Event | Behavior |
| --- | --- |
| Approval requested | Current source emits waiting before asynchronously persisting the pending record; a persistence error is surfaced. The live responder routes acceptance/decline; durable-before-UI ordering is not established. |
| User accepts/declines | The run approval is updated and the interaction record becomes `accepted`/`declined`. |
| Codex tool question | `item/tool/requestUserInput` becomes a `question` record with its runtime ID, header, options, free-text/secret flags, and the run stays `waiting` until answered. |
| Codex/MCP form | `mcpServer/elicitation/request` becomes a `form` record for supported primitive schemas, or a `url` record for URL mode. Unsupported schemas are declined with a visible activity and recovery text. |
| User answers a question/form | The answer is validated against the runtime schema before the provider receives it; invalid answers leave the request pending. Accepted forms/secret questions are redacted before persistence. |
| Decline/cancel | The provider receives an explicit decline/cancel (or a JSON-RPC cancellation for Codex questions), never an empty fabricated answer. |
| Run finishes with a pending interaction | The finalizer attempts question/form cancellation and cancels durable pending records. Complete native-approval/failure-path cleanup still requires HIL-005/006 acceptance. |
| Host restarts | Every still-`pending` record is marked `expired` during `InteractionStore.load()` before the API is available. It cannot be acted on without a live provider callback. |
| Refresh | The run ledger and bootstrap interaction list expose the live request; the durable record provides correlation/recovery. |
| Host switch | Each data directory has its own `interactions.json` and host ID; another host's pending requests are not shown or actionable. |
| Corrupt file | The damaged file is renamed to `interactions.json.corrupt-<timestamp>` and a clean version-1 store is created; the evidence is retained. |

Unknown interactive requests are recorded as a `form` notice and answered with JSON-RPC `-32601`; unsupported elicitation schemas are declined, not guessed. Sensitive form values and secret question answers are sent only to the runtime and never written to the interaction ledger.

## Storage

- File: `interactions.json`, mode `0600`, version 1.
- Writes are serialized, fsynced, and atomically renamed.
- Pending records are never pruned. Resolved records are capped at the 200 most recent.
- The workspace export contains `state.json` data only; interaction records are local host state and are not exported.
- No provider keys or secrets are stored; command/description text is local workspace data.

## API

`GET /api/bootstrap` includes `interactions: PendingInteraction[]` in addition to state, providers, and runs. Approval decisions continue to use `POST /api/approvals/:id`; the interaction record shares the approval ID.

`POST /api/interactions/:id` accepts `{ action: 'accept' | 'decline' | 'cancel', response? }`. Accepted questions use `{ answers: { questionId: { answers: string[] } } }`; accepted forms use `{ fieldName: value }`. A response is rejected with 400 when it does not match the runtime schema, and 409 when the request is already settled or has no live provider callback.

The chat UI renders pending questions, forms, and URL confirmations as accessible cards. Each card validates required answers before enabling submission, supports decline, and never invents an answer.

## Verification

`tests/server/interactions.test.ts` covers:

1. Pending records survive a write/read cycle but become `expired` on the next host load; resolved records remain.
2. Two hosts/data directories keep separate records and host IDs.
3. A corrupt file is preserved and replaced with a clean store.
4. A response can be recorded once; double responses are ignored.

`tests/server/hil.test.ts` covers:

- Codex question parsing, listed-option validation, free-text handling, and malformed/empty rejection.
- MCP form parsing for string/enum/integer/boolean/multi-select fields, required values, numeric bounds, type checks, and unsupported nested objects.
- URL elicitation accepting only HTTP(S) destinations.

`tests/server/backend.test.ts` covers:

- A real approval fixture writes `kind: approval`, `runId`, `conversationId`, `providerId`, `threadId`, and `status: pending`.
- The approval fixture observes persisted accepted status; ordering under provider completion and persistence failures remains core acceptance work.
- A Codex `requestUserInput` fixture waits as a `question`, rejects an option outside the runtime schema, accepts `Workspace`, returns it to the runtime, and rejects a second answer with 409.
- A Codex `mcpServer/elicitation/request` fixture waits as a `form`, rejects a missing required field and an out-of-range number, accepts valid values, and completes the run.
- Existing approval/decline and run-reservation tests remain green.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 62/62 server/model-option tests pass; production build pass with the existing chunk-size advisory.

## Remaining work

- **HIL-003:** browser/keyboard/focus evidence for the form card and sensitive-field policy fixtures.
- **HIL-004:** open the reviewed URL, correlate callback/completion, and reject mismatched or untrusted destinations.
- **HIL-005:** close pending interactions on stop/disconnect/shutdown with exactly-once provider resolution.
- **HIL-006:** real HIL acceptance across refresh, simultaneous chats, late responses, denial, and runtime failure.
- **FND-010:** shared budgets/expiry exist; retained Stop/timeout failure paths need fresh acceptance.
- **FND-011:** error IDs/redaction exist; reverify actionable retained interaction failures.
