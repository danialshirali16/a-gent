# BEN-022 — Model-specific Thinking controls

Status: **Done — accepted for M2 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Reasoning board](../roadmaps/reasoning-effort.md) · [Model picker review](../model-picker-review.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-022; covers EFF-007–EFF-012.
- **Question:** How should the supplied model-picker layout present each selected model's actual reasoning options/default without a universal Light/Balanced/Deep fallback, and how should every surface stay consistent?
- **Included:** picker footer, no-reasoning/unknown states, model switching, labels/defaults, keyboard/focus, cross-surface consistency, and verification fixtures.
- **Excluded:** capability discovery (BEN-021), provider protocol mapping (EFF-003), and real multi-model acceptance (EFF-011/012 owns evidence).
- **DRI:** Danial (Product + UI). **Reviewer:** Danial (owner acceptance; independent review unavailable).
- **Evidence:** installed Reason UI reference notes, current A Gent picker review/screenshots, Codex 0.166.0 live model metadata, OpenCode model variants.

## Comparators

| Comparator | Evidence | Observation |
| --- | --- | --- |
| Reason 0.1.119/0.1.120 UI | [Reverse engineering](../reverse-engineering.md), [model picker review](../model-picker-review.md), component notes | Compact provider rail, search, model rows, footer controls; visual reference only. |
| Codex 0.166.0 | Live `gpt-6.1-sol` metadata: default `low`, six options | Model-specific default/options differ from A Gent's fixed `medium`/Light-Balanced-Deep. |
| OpenCode 2.2.5 | Model variants/settings in OpenAPI | Variants exist but are provider-specific; do not invent a universal list. |
| A Gent current UI | `ModelPicker.tsx`, `App.tsx`, `dialogs.tsx`, `SidePanel.tsx` | Fixed Light/Balanced/Deep; global `medium`; picker layout otherwise preserved. |

## Decisions

1. **Keep the supplied picker layout** (provider rail, search, model rows, check, footer). Do not reintroduce descriptions or Media/Reasoning badges. EFF-007.
2. **Footer shows only the selected model's verified options/default.** If no reasoning support, hide the control; if unknown, show a clear “Provider default” state and omit the parameter. No universal Light/Balanced/Deep labels.
3. **Defaults come from the model**, not a global `medium`. Switching models selects the new model's valid default or `Provider default`, never a stale value.
4. **All surfaces share the effective value:** composer trigger/footer, SidePanel, Agent editor, global/chat settings, and restored drafts. EFF-008.
5. **Model-switch races are explicit:** rapid switching, late catalog data, removed models/options, failed saves, account changes, and host changes must not display/submit another model's value; rollback/focus remains coherent. EFF-009.
6. **Fixtures are disjoint:** different enum sets, no reasoning, unknown, numeric budgets, one option, long labels, default aliases, removed options. EFF-010.
7. **Release gate:** EFF-011 needs at least two real models with distinct settings plus unsupported/unknown handling; EFF-012 closes only after keyboard/VoiceOver/reflow and real-model evidence.

## Workflow comparison

| State | Reason/A Gent reference | Adopted behavior |
| --- | --- | --- |
| Supported enum | Footer options in supplied layout | Exact model options, verified default, selected check. |
| No reasoning | Reference hides unsupported control | Hide control; no empty/disabled list. |
| Unknown metadata | Not established | “Provider default”; no parameter sent. |
| Model switch | Picker keeps layout | Re-resolve options/default; clear invalid selection. |
| Failure/race | Existing focus/rollback patterns | Keep old valid value or roll back; never show another model's value. |
| Accessibility | Keyboard/focus/reflow already reviewed | Arrow/Home/End/Escape, focus return, 44px targets, VoiceOver labels, reduced motion. |

## Delivery mapping

| Task | Acceptance |
| --- | --- |
| EFF-007 | Footer replaces fixed list; no-reasoning/unknown cases. |
| EFF-008 | Composer/SidePanel/Agent/settings/drafts consistency. |
| EFF-009 | Switching/race/rollback/focus tests. |
| EFF-010 | Disjoint-capability fixture suite. |
| EFF-011 | Two real models with distinct settings + unsupported/unknown. |
| EFF-012 | Final gate: capability, migration, request, race, accessibility, real-model evidence. |

## Open questions and limitations

- Only one live Codex model was explored; a second distinct model is required for EFF-011.
- OpenCode variants need a verified mapping before UI use.
- Current UI still has fixed Light/Balanced/Deep and global `medium`; this record defines the replacement, not the implementation.
- Acceptance: Danial accepted 2026-11-05 as the M2 Thinking-control baseline.
