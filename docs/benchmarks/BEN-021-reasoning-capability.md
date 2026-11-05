# BEN-021 — Model reasoning capability contract

Status: **Done — accepted for M2 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Reasoning board](../roadmaps/reasoning-effort.md) · [Runtime baseline](../runtime-baselines.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-021; covers EFF-001–EFF-006 and the reasoning portions of CDX-004/EFF-002.
- **Question:** How do providers express model-specific reasoning capabilities, and what typed contract should A Gent use without inventing options or applying a global list?
- **Included:** enum/budget/boolean kinds, defaults, unknown/unsupported behavior, metadata source/precedence/freshness, native request mapping, persistence/migration, and boundary validation.
- **Excluded:** picker/UX design (BEN-022), provider catalog normalization (PVD-008), and real multi-model verification (EFF-011/012).
- **DRI:** Danial (Integrations + Host). **Reviewer:** Danial (owner acceptance; independent review unavailable).
- **Environment:** 2026-11-05; Codex 0.166.0 app-server; OpenCode 2.2.5 OpenAPI; Ollama API docs; real `gpt-6.1-sol` metadata.

## Comparators and evidence

| Comparator | Evidence | Type | Limitations |
| --- | --- | --- | --- |
| Codex app-server 0.166.0 | `model/list` live: `gpt-6.1-sol` default `low`, options `low/medium/high/xhigh/max/ultra`; schema fields | Direct observation | One model/account; other models may differ. |
| OpenCode 2.2.5 | Generated OpenAPI `Model.Info`, `Model.Variant`, `Model.Settings` | Direct spec | No explicit effort enum; variants are provider-specific. |
| Ollama API | `/api/chat` `think` accepts boolean/string/null; `/api/show` is the discovery source | Documented | Deferred provider; not live-tested. |
| A Gent current source | `shared/types.ts` ModelOption has no capability data; Codex adapter drops metadata; global Light/Balanced/Deep UI | Source review | Known gap baseline. |

## Capability shapes

| Kind | Example | Required fields | Request mapping |
| --- | --- | --- | --- |
| Enum | Codex `low/medium/high/xhigh/max/ultra` | ordered values, default, labels/descriptions | Send exact value as `effort`. |
| Budget | Anthropic/other reasoning token budget | minimum/maximum/default | Send numeric budget only when verified. |
| Boolean | thinking on/off | default | Send boolean only when verified. |
| Unsupported | model has no reasoning control | none | Hide control; do not send a parameter. |
| Unknown | metadata absent/stale | source/freshness unknown | Offer provider default; omit unverified parameter. |

## Decisions

1. **Typed capability contract.** EFF-001 must distinguish enum, budget, boolean, unsupported, and unknown; include provider/model/account context, source, runtime/API version, and freshness.
2. **Authoritative discovery wins.** Codex `defaultReasoningEffort`/`supportedReasoningEfforts` are preserved; OpenCode variants are preserved as verified model metadata when available; model names/provider-wide unions are not evidence. EFF-002.
3. **Native wire values are separate from labels.** UI labels can be friendly; dispatch sends the exact enum/budget/boolean or omits the field. `off`/`none`/default are not conflated. EFF-003.
4. **Unknown means provider default, no guessed `medium`.** Stale/missing metadata never inherits another model's options. EFF-004.
5. **Selections are scoped and migrated.** Existing global strings migrate safely; preferred values are tied to provider/profile/model/Agent/chat and restored only if still supported. EFF-005.
6. **Dispatch revalidates.** The API checks the effective model and current capability snapshot before creating a streaming message; invalid combinations fail clearly. EFF-006.
7. **Codex example:** `gpt-6.1-sol` default is `low`, not `medium`; supported values exclude `none/minimal`. A Gent's current allowlist includes unsupported values and must be replaced by metadata.

## Delivery mapping

| Task | Acceptance |
| --- | --- |
| EFF-001 | Typed contract + source/freshness/unknown tests. |
| EFF-002 | Codex metadata preserved through discovery/normalization; OpenCode verified equivalents; conflicts resolved. |
| EFF-003 | Per-adapter native mapping fixtures (enum/budget/boolean/default). |
| EFF-004 | Unknown/stale/default behavior; no guessed medium. |
| EFF-005 | Migration and provider/model/Agent/chat scoping. |
| EFF-006 | API rejection before streaming; stale snapshot handling. |

## Open questions and limitations

- OpenCode variants are provider-specific and not a uniform effort enum; only verified metadata may populate controls.
- Ollama is deferred; its `think` values must be discovered with `/api/show` when resumed.
- Only one Codex model was observed live; EFF-011 requires at least two distinct option sets.
- Acceptance: Danial accepted 2026-11-05 as the M2 reasoning-contract baseline.
