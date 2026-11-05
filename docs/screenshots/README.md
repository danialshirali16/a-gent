# Screenshot evidence

Updated: 2026-11-05. Each image records the UI at capture time, rather than certifying later source changes or packaged artifacts.

| Evidence | Location | Review |
| --- | --- | --- |
| Customer README | [Conversation](readme-chat.png), [model picker](readme-models.png) | Captured from current source with seeded conversation content and real Codex model discovery |
| Component previews | `components/` | [Component validation](../validation.md#component-by-component-pass) |
| Integrated app and avatars | `integration/` | [Avatar validation](../validation.md#bot-avatar-replacement) |
| Model picker layout | [Dark](model-picker-dark.jpg), [light](model-picker-light.jpg), [mobile](model-picker-mobile.jpg), [empty](model-picker-empty.jpg) | [Picker review](../model-picker-review.md) |
| Catalog failures | [Worst case](model-options/final-worst-case.jpg), [invalid IDs](model-options/duplicate-id-961-dark.jpg), [identical names](model-options/identical-names-961-dark.jpg), [Unicode search](model-options/unicode-search-961-dark.jpg), [search scroll](model-options/search-scroll-961-dark.jpg) | [Stress-test report](../model-options-stress-test.md) |
| Width comparison | [Demo 320px](model-options/demo-320-dark.jpg), [worst 320px](model-options/worst-320-dark.jpg), [demo 2560px](model-options/demo-2560-dark.jpg), [worst 2560px](model-options/worst-2560-dark.jpg) | [Coverage](../model-options-stress-test.md#verification) |
| Measurements | [DOM observations](model-options/observations.json) | Synthetic catalogs; viewport, option counts, selection, and footer bounds |

Other root-level screenshots remain linked from their original reviews. Keep existing filenames stable so those links continue to work.
