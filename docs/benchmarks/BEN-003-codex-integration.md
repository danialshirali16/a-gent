# BEN-003 — Codex integration comparison

Status: **Done — accepted for M2 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Codex board](../roadmaps/providers.md#codex) · [Runtime baseline](../runtime-baselines.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-003; covers CDX-001–CDX-006 plus the shared Codex portions of PVD-001/002/007/013.
- **Question:** How should A Gent drive Codex as a supported R1 runtime: login/readiness, model capability, thread/turn routing, Stop, approvals, discovery versus inference, and failure recovery?
- **Included:** supported Codex CLI/app-server surface, login/account state, model metadata, thread/turn IDs, streaming events, Stop, approvals/negative interactions, process lifecycle, and real supported-model smoke.
- **Excluded:** managed OpenAI account UI design (CDX-002 still owns it), full MCP/Connect Apps UX (BEN-008/009), macOS package/signing, and every non-Codex provider.
- **DRI:** Danial (Integrations + Host).
- **Reviewer:** Danial (owner acceptance; independent review unavailable in this solo-maintained project).
- **Research date/environment:** 2026-11-05; Codex CLI 0.166.0 on Windows x64; ChatGPT account authenticated; real `gpt-6.1-sol` turns executed through A Gent and a direct app-server probe.

## Comparators and evidence

| Comparator | Evidence | Observation type | Limitations |
| --- | --- | --- | --- |
| Codex CLI 0.166.0 / TUI | `codex --help`, `codex login status` (`Logged in using ChatGPT`), generated schema, official app-server docs | Direct CLI + documented | TUI interaction not walked step by step; no approval or managed-login flow exercised. |
| Codex app-server protocol | Generated 0.166.0 JSON schema (106 client methods/10 server requests), official [App Server docs](https://developers.openai.com/codex/app-server), direct JSON-RPC probe | Direct protocol observation + real inference | One model/account; no MCP/OAuth or concurrent-turn stress. |
| OpenCode 2.2.5 runtime | Generated OpenAPI/CLI + real `opencode-go/deepseek-v4.1-flash` turn | Peer runtime comparison | Different auth/model semantics; not a Codex substitute. |
| A Gent Codex adapter | `server/codex.ts`, `tests/server/backend.test.ts`, real host smoke | Source + fixture + real smoke | Managed login/questions/elicitation remain incomplete. |

### Direct Codex observations

- `account/read` returned an authenticated ChatGPT account with `requiresOpenaiAuth: true`.
- `model/list` returned 8 visible models.
- Selected `gpt-6.1-sol` metadata:
  - `defaultReasoningEffort: low`
  - supported efforts: `low`, `medium`, `high`, `xhigh`, `max`, `ultra` with descriptions
  - input modalities: text, image
- Real thread/turn with `gpt-6.1-sol` completed and returned `OK`.
- A second slow turn was interrupted with `turn/interrupt`; `turn/completed` reported `status: interrupted`.
- Thread/turn IDs are opaque strings; events carry thread/turn IDs and item IDs.
- Current A Gent adapter discards `defaultReasoningEffort`/`supportedReasoningEfforts` and uses a global allowlist including unsupported `none/minimal`. This is a concrete EFF/CDX-004 gap.

## Workflow comparison

| Lifecycle | Codex CLI/TUI | App-server reference | A Gent adapter gap | Adopted direction |
| --- | --- | --- | --- | --- |
| Login/readiness | `codex login` external; `login status` says ChatGPT | `account/read`, managed `account/login/*`, `logout` | External sign-in only; no managed login UI/lifecycle | Keep external sign-in; surface account state; managed login is optional follow-up. |
| Discovery | Local model list through app-server | `model/list` with capabilities/defaults | Metadata discarded; global effort list | Preserve exact IDs/names/effort metadata; unknown uses provider default. |
| Discovery vs inference | TUI requires an actual turn | Catalog does not prove inference | Catalog marks connected; no explicit test turn | Add PVD-007 test-turn path; only ready after explicit evidence where required. |
| Thread/session | TUI manages resume/fork/archive | `thread/start`, `resume`, `read`, `list`, `unsubscribe` | Uses `thread/start`/`resume`, shared provider binding | One binding per provider/profile/workspace/model; reuse only when matched. |
| Turn/events | Streamed TUI output | `turn/start`, item deltas, `turn/completed` | Early/late events handled but questions/elicitation incomplete | Keep thread/turn correlation; add question/form mapping. |
| Stop | TUI stop control | `turn/interrupt`; completion status is authoritative | Waits for completion/child exit with deadline | Do not release chat on RPC ack alone; wait for completed/exit. |
| Approvals | TUI prompts | command/file/permissions server requests | Command/file/permissions surfaced; elicitation declined; questions empty | Real HIL forms for questions/elicitation; decline unknown forms rather than fabricate answers. |
| Errors | CLI output/exit | JSON-RPC errors/child exit | Redacted detail, classify auth/network/schema/runtime | Map to stable error classes and recovery copy. |
| Process lifecycle | CLI process exits | app-server stdio child | Close escalates/waits; restart reconnects | Keep owned child; no orphaned turns. |

## Decisions

1. **Use the supported app-server protocol, not a private client implementation.** Pin/probe Codex 0.166.0; use generated schema fixtures to detect drift. CDX-001.
2. **Preserve model capability metadata.** `model/list` is authoritative for IDs, names, defaults, supported efforts, and modalities; the adapter must not apply a provider-wide or name-based effort list. Unknown metadata uses the provider default with no invented parameter. CDX-004/EFF-002–004.
3. **Session routing is thread/turn based.** Store a provider binding with thread ID; reuse only when provider/profile/workspace/model match. Early events before `turn/start` response must stay correlated to the turn. CDX-003/FND-007.
4. **Stop is confirmed by turn completion or child exit.** `turn/interrupt` acknowledgment alone is insufficient; retain the reservation until `turn/completed`/exit or the bounded deadline. CDX-003/FND-006.
5. **Approvals are first-class pending interactions.** Command/file/permissions requests route to the run; decline on abort; never fabricate answers. Questions/elicitation need real HIL-001–006 instead of empty answers. CDX-005/FND-009.
6. **External sign-in remains valid; managed login is optional.** Read `account/read`; show auth-required state and `codex login` recovery. Do not assume a private OpenAI client. CDX-002.
7. **Discovery and inference are separate.** A returned catalog/account does not prove model access; PVD-007's explicit test turn is the readiness proof. CDX-006/PVD-017.
8. **Errors are classified and redacted.** auth, network, unsupported runtime/schema, model, runtime, cancellation; child stderr is bounded/redacted. CDX-001/FND-011.

## Delivery mapping

| Task | Acceptance evidence |
| --- | --- |
| CDX-001 | Version/schema probe, missing/unsupported runtime, initialization failure, upgrade guidance. |
| CDX-002 | Account/read state, existing external sign-in, managed login/cancel/expiry if implemented. |
| CDX-003 | Two-chat/early-late-event/resume-failure/child-exit/Stop tests. |
| CDX-004 | Real `gpt-6.1-sol` effort metadata preserved; exact native effort mapping; unknown/default behavior. |
| CDX-005 | Command/file/permission approvals plus question/form handling without fabricated answers. |
| CDX-006 | Fresh/existing sign-in → model → chat → approved change → Stop → restart/resume real journey. |

## Open questions and limitations

- No real approval or question/form journey was executed; only schema/docs/fixtures cover those paths.
- Managed Codex login UI is not designed; external CLI sign-in remains the R1 baseline.
- One ChatGPT account/model family was tested; other accounts/models may expose different catalogs or restricted models.
- Concurrent real chats and macOS packaged-app behavior remain CDX-006/QA-004 checks.
- A Gent still discards effort metadata and uses a global effort allowlist; CDX-004/EFF tasks must close that gap.
- **Acceptance:** Danial accepted 2026-11-05 as the M2 Codex integration baseline. Recheck on Codex version/schema change or a new account/model family.
