# Reason-style component checklist

The full 18-component checklist, current progress, per-component workflow, and continuation point are maintained in the [UI Roadmap](ui-roadmap.md#component-by-component-pass). Update progress there so future sessions have one source of truth.

Updated: 2026-11-05. Status: **initial pass complete, 18 of 18**. Follow-up uses the [personal-v1 path](project-roadmap.md#recommended-execution-order). The [current picker assessment](model-options-stress-test.md#current-status-after-provider-changes) distinguishes implemented fixes, raw-fixture failures, and remaining acceptance. The Search field was corrected on 2026-11-05.

Product integration is tracked separately in [the completion roadmap](project-roadmap.md) and [task boards](roadmaps/README.md): provider and MCP/Connect Apps workflows remain partial despite the completed shared-component milestone.

[Documentation index](README.md) · [UI continuation point](ui-roadmap.md#continuation-point) · [Validation](validation.md)

Component notes:

- [Button](button-component.md)
- [Input and Textarea](input-component.md)
- [Field through Sidebar](component-notes.md) — Field, Select/Combobox, Checkbox/Switch, Tabs/Segmented, Tooltip, Menu, Popover, Dialog/Confirmation, Badge/Status, Avatar/Agent mark, Alert/Toast, Card/List row, Search, Composer/Attachment, Message/Tool activity, Sidebar/Rail
- [Search field review](search-component.md) — findings and fixes for the Search family
- [Model picker review](model-picker-review.md) — reference layout and normal-fixture verification
- [modelOptions stress test](model-options-stress-test.md) — adversarial catalogs, reproductions, proposed fixes, and test-data toggle

Development previews: `/?component=button`, `/?component=input`, and the 16 further IDs listed in the [roadmap](ui-roadmap.md#continuation-point). The preview navigation is shared by all families and preserves the selected light/dark theme. Previews are development-only and excluded from production.

Catalog stress preview: `/?component=composer&stress=model-options&data=worst`. Dataset and environment settings persist in the URL. This is a follow-up harness within Composer, not a nineteenth component family.
