# BEN-010 — Questions, approvals, and elicitation

Status: **Done — accepted for M3 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Connect Apps board](../roadmaps/connect-apps.md) · [Interactions](../interactions.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-010; covers HIL-001–HIL-006.
- **Question:** How should A Gent carry human approvals, tool questions, MCP forms/URL elicitation, decline, timeout, focus recovery, and simultaneous requests?
- **Comparators:** Codex 0.166.0 app-server requests; OpenCode 2.2.5 permission/form API; MCP elicitation spec; A Gent current interaction records.
- **Excluded:** provider-specific approval policy (CDX-005/OPC-003), general accessibility verification (UX).

## Evidence

| Source | Interaction surface |
| --- | --- |
| Codex | Command/file/permissions approvals; `item/tool/requestUserInput`; `mcpServer/elicitation/request`; JSON-RPC request IDs; cancellation/abort. |
| OpenCode | Permission request list/reply; forms list/create/get/cancel/reply; session interrupt; v2 SSE events. |
| MCP spec | Elicitation is a server-initiated form/URL flow; clients must return action/content and support decline/cancel; sensitive values require care. |
| A Gent | Correlated approval records and persistence; questions get empty answers; elicitation declined; no form UI. |

## Decisions

1. **One pending-interaction record** for command/file/permission approval, tool question, MCP form, and URL flow; IDs correlate host/run/conversation/provider/thread/request.
2. **Never fabricate answers.** Unsupported/unknown requests return decline/cancel with a visible activity, not `{}` or a fake success.
3. **Form schema rendering:** bounded text/boolean/enum/number fields, required/optional, sensitive fields masked, URL flow opens with explicit consent and returns only documented result.
4. **Concurrency:** multiple pending requests are queued/displayed with run context; late responses rejected; host/chat switch cannot apply to another run.
5. **Lifecycle:** pending → accepted/declined/cancelled/expired; approval decision persisted; run remains waiting until resolved; abort declines.
6. **Timeout/cancellation:** shared interaction budget; expiration surfaces recovery; no silent default accept.
7. **Sensitive values:** never log/export; keychain/secret references where applicable; redaction.
8. **Accessibility/focus:** focus enters the dialog, Escape cancels, focus returns; status announced; keyboard-only operation.

## Delivery mapping

HIL-001 record/UI foundation; HIL-002 approvals; HIL-003 questions; HIL-004 forms/URL; HIL-005 concurrency/recovery; HIL-006 acceptance.

## Limitations

No live form/elicitation or simultaneous-request journey was exercised; schema/docs/fixtures only. Acceptance: Danial, 2026-11-05.
