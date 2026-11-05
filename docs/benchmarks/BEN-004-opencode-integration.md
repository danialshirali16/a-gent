# BEN-004 — OpenCode integration comparison

Status: **Done — accepted for M2 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [OpenCode board](../roadmaps/providers.md#opencode) · [Runtime baseline](../runtime-baselines.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-004; covers OPC-001–OPC-006 and the OpenCode portions of PVD-001/002/007/013.
- **Question:** How should A Gent drive OpenCode as a supported R1 runtime: auth/readiness, model selection, session continuation, event decoding, permissions, Stop/cleanup, and recovery?
- **Included:** CLI vs v2 server API, auth discovery, model catalog, session IDs, run event formats, permission modes, cancellation/process cleanup, and real supported-model smoke.
- **Excluded:** MCP app UX (BEN-008/009), full provider lifecycle (BEN-002), reasoning metadata (BEN-021/022), and packaged macOS behavior.
- **DRI:** Danial (Integrations + Host).
- **Reviewer:** Danial (owner acceptance; independent review unavailable).
- **Environment:** 2026-11-05; Windows x64; OpenCode 2.2.5; stored OpenAI/OpenCode Console credentials; live `opencode-go/deepseek-v4.1-flash` turn completed.

## Comparators and evidence

| Comparator | Evidence | Type | Limitations |
| --- | --- | --- | --- |
| OpenCode 2.2.5 CLI/TUI | `opencode --help`, `run --help`, `auth list`, `models`, live run | Direct CLI + real inference | TUI permission flow not walked live; one account. |
| OpenCode 2.2.5 v2 server/OpenAPI | Generated OpenAPI: 138 paths/169 operations; session, event, permission, form, MCP, skill routes | Direct generated spec | No live server prompt/OAuth/MCP. |
| Codex app-server | BEN-003 / generated schema | Peer runtime | Different auth/session model. |
| A Gent adapter | `server/opencode.ts`; fixture and lifecycle tests | Source + fixture | Uses CLI JSON, not v2 API. |

### Direct observations

- `opencode auth list` shows stored OpenAI and OpenCode Console credentials.
- `opencode models` returned 26 models.
- Real run with `opencode-go/deepseek-v4.1-flash` completed through A Gent.
- `openai/gpt-5.5` failed: model not supported for a ChatGPT account.
- `opencode/deepseek-v4.1-flash` failed: insufficient account funds.
- Current A Gent adapter infers readiness from model count, passes `--auto`, and parses undocumented CLI JSON (`text`, `tool_use`, `sessionID`, `error`).
- v2 surface exposes `session.prompt`, `session.interrupt`, permission request/reply, forms, SSE events, and MCP/skill endpoints; the adapter does not use them.

## Workflow comparison

| Lifecycle | OpenCode CLI/TUI | OpenCode v2 server | A Gent gap | Adopted direction |
| --- | --- | --- | --- | --- |
| Auth/readiness | `auth list/login/logout`; model list | Provider/auth routes; server password optional | Model count treated as connected; no auth check | Probe executable/version/auth explicitly; model list alone is discovery. |
| Model selection | `models`, `run --model`, variants | `GET /api/model`; model variants | Exact IDs only; no variants/defaults | Preserve exact IDs; use verified model variants when available. |
| Session/resume | `--session`, `--title`, `--continue` | `session.create`, `session.get`, `session.interrupt`, export/import | Uses CLI `--session`; shared binding now checks provider/workspace/model | Keep binding checks; prefer v2 session API when adopted. |
| Events | Undocumented CLI JSON lines | Typed v2 SSE event stream | Fragile line parser; no typed fixtures | Version fixtures; prefer server SSE; fail explicitly on schema drift. |
| Permissions | `--auto` auto-approves unless denied in config | Permission request/reply API; forms | UI mode does not match `--auto`; no per-tool approvals | Replace/constrain `--auto`; enforce Chat/Work policy; do not advertise Codex-style approvals. |
| Stop/cleanup | SIGTERM process | `session.interrupt` API | Process escalation implemented; release after child exit | Keep confirmed process cleanup; v2 interrupt is preferred when available. |
| Errors | Exit/stderr | Structured errors/event stream | Redacted stderr, generic failure | Classify auth/model/network/cancel; bounded stderr. |
| MCP/skills | OpenCode config/runtime | MCP/skill routes | Inherited runtime tools only | Runtime owns execution; A Gent owns scope/UI. |

## Decisions

1. **Treat model discovery as discovery, not auth/inference proof.** Require an explicit auth/readiness check and a live test turn (PVD-007/OPC-001).
2. **Pin OpenCode 2.2.5 and version the contract.** The CLI JSON event shape is not in the OpenAPI document; use fixtures and fail closed on drift. Prefer the v2 server API as the supported long-term path.
3. **Do not claim Codex-style approvals with the current `--auto`.** Chat/Work must map to an actual policy; either use v2 permission replies or document the stricter configured default. OPC-003.
4. **Session IDs remain provider-scoped.** Reuse only with matching provider/profile/workspace/model; missing/foreign sessions rebuild. OPC-004/FND-007.
5. **Stop must confirm child/API termination.** Keep the reservation until exit/interrupt completion. OPC-002/FND-006.
6. **Event decoding is bounded and typed.** Handle split UTF-8/JSON, final partial lines, tool status, errors. OPC-005.
7. **Real-model acceptance is account/model dependent.** A listed model may be unavailable due plan/credits; surface the provider error without marking the whole runtime ready.

## Delivery mapping

| Task | Acceptance evidence |
| --- | --- |
| OPC-001 | Executable/version/auth checks; discovery separated from inference; missing/bad auth recovery. |
| OPC-002 | SIGTERM-resistant child tracking/escalation; Stop and shutdown release after exit. |
| OPC-003 | Agreed Chat/Work permission policy; UI matches runtime; no silent auto-approval. |
| OPC-004 | Provider/workspace/model binding; missing/foreign session rebuild; attachment context. |
| OPC-005 | Versioned event fixtures; split/late/partial/tool/error cases. |
| OPC-006 | Auth/configure → select → stream → tool action under policy → Stop → resume/restart real journey. |

## Open questions and limitations

- Real Stop/restart and permission prompts were not exercised against the live CLI; only chat inference and process fixtures.
- The v2 server API was captured but not used by the adapter; migration is an OPC task.
- `--auto` policy remains a known gap (OPC-003).
- One account/model family was tested; other models may have different availability/credits.
- Acceptance: Danial accepted 2026-11-05 as the M2 OpenCode baseline. Recheck on OpenCode version/API change.
