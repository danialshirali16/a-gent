# Diagnostics and redacted errors

Status: **FND-011 recorded 2026-11-05.** This defines request/run/provider correlation, the user-facing error envelope, and the redaction boundary for logs and responses.

[Release contract](release-contract.md) · [Timeouts](timeouts.md) · [Interactions](interactions.md) · [Validation](validation.md) · [FND-011 task](project-roadmap.md#foundation-tasks)

## Request correlation

- Every HTTP request receives an `X-Request-Id` response header.
- A caller may supply `X-Request-Id` (1–100 chars, `A-Za-z0-9._:-`); otherwise the host generates one.
- Error responses include `{ "error": "...", "requestId": "..." }`.
- Authentication failures include the request ID as well.
- SSE error events may include `requestId`, `runId`, `providerId`, `appId`, and a stable `code` in addition to `message`.

Current sources:

| Source | ID |
| --- | --- |
| HTTP error | `requestId` in body/header |
| Run/save/approval failure event | `runId`, `providerId` where known |
| Provider status/detail | Provider connection record + redacted detail |
| Interaction record | `runId`, `conversationId`, `providerId`, `threadId` |
| Scheduler failure | `code: scheduler` |

`appId` is part of the event contract but is not emitted until the app lifecycle provides stable IDs (MCP tasks).

## Redaction

`server/diagnostics.ts` redacts before a message reaches a log or API response:

- `Authorization: Bearer …`
- common token prefixes (`sk-`, `agt_`, `reason_`, `ghp_`, `github_pat_`, `glpat-`)
- `api_key`/`apiKey`, access/refresh token, `token`, `password`, `secret`, and `cookie` assignments (plain or JSON)
- bounded text (default 2,000 chars; shorter where provider detail/body is compacted)

The error handler:

- returns validation messages after redaction;
- returns a generic 413 message for oversized requests;
- returns a generic 500 message plus the request ID;
- logs a 500 with the request ID and redacted detail only.

Provider adapters apply the same redaction to HTTP response bodies, Codex stderr-derived errors, and OpenCode stderr-derived errors. Provider details shown in Connections use the redacted message.

## User recovery

| Failure | User-facing behavior |
| --- | --- |
| Invalid host/origin/auth | 400/401/403 with request ID; the UI can show the pairing/reconnect path. |
| Validation error | Redacted actionable message; request ID supports follow-up. |
| Oversized request | “This request exceeds the 32 MB limit.” |
| Internal error | “A Gent could not complete this request. Check the server log.” plus request ID. |
| Provider/model failure | Run/message failure with a bounded, redacted activity; Stop/retry remains available. |
| Interaction save failure | SSE error event with run/provider IDs; the in-memory approval remains usable. |

## Verification

`tests/server/diagnostics.test.ts` covers:

1. Bearer, token assignment, JSON API key, prefixed token, password, truncation, and ordinary-text redaction.
2. Unauthorized and validation responses return the caller-supplied request ID in both header and body, without exposing the host token.

Existing tests cover run/provider error paths. Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 45/45 server/model-option tests pass; production build pass with the existing chunk-size advisory.

## Limits

- Redaction is pattern-based defense in depth, not a guarantee that every arbitrary provider payload is classified correctly. Provider bodies are truncated and token-shaped data is removed.
- There is no external log sink/rotation yet; logs are local stderr. QA-011 still audits artifact/diagnostic boundaries.
- `appId` correlation and user-visible diagnostics export remain follow-up work for MCP/QA.
- Request IDs are not cryptographic capabilities; they are correlation aids.
