# Model picker refinement

Reviewed: 2026-11-05. Status: implemented and verified in the browser preview.

Follow-up: this was the normal-fixture implementation review. The later [modelOptions stress test](model-options-stress-test.md) found seven open issues, including blank accessible labels and ambiguous/invalid selection. Its findings qualify this review's original verdict; use the stress report and [UI Roadmap](ui-roadmap.md) for continuation.

## Scope and coverage

Scope: the composer trigger, its Choose a model popup, connected-provider filtering/search, selection, Thinking controls, empty states, and Connections handoff. The supplied React reference defines the provider rail and main pane; the user's instruction removes model descriptions and media/reasoning badges. Actual provider catalogs and the existing Light/Balanced/Deep support are retained.

Stack: React 19, TypeScript, Lucide, existing shared Popover/SearchField/SegmentedControl/Tooltip/Button components, and token-based CSS. This adapts the reference within the project's current component conventions; no parallel Tailwind/Radix stack or sample provider catalog was added. Convention sources were the project AGENTS.md, UI Roadmap, component notes, and existing token/component styles. Unrelated workspace changes and the broader release audit are outside this review.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Popup/search/tab/listbox semantics, icon labels, selected state, focus entry/return, keyboard navigation, empty states, WCAG-tagged axe scans, 44px narrow controls | Resolved focus/dismissal issues; no violations in focused scans. Native screen reader not verified |
| Layout | Provider rail, search/model pane, footer, connected catalogs, 42-option scroll fixture, 320px mobile, 480×402 reflow proxy, RTL and long multilingual names | Resolved excessive content and footer clipping |
| Writing | Search, provider names, model names, Thinking, unavailable support, no connections, no matches, and recovery actions | Clear; descriptions and capability badges omitted as requested |
| Typography | 14px model names, 12px metadata, 16px narrow search, wrapping and bidirectional isolation | Clear in inspected states |
| Colors | Existing light/dark semantic tokens, selected fill/check, focus ring, text and icons; focused axe scans | Clear in fully visible app/preview states; clipped rows in the short preview require incomplete-check qualification below |
| UI | Reference geometry, concentric radii, rail/pane depth, consistent controls, hover/focus/selection, Connections handoff | Reference integrated; no actionable finding remains in inspected scope |

## Resolved findings

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| MEDIUM | Layout | `src/composer/ModelPicker.tsx:34`, `src/composer/modelOptions.ts:9` | Every provider and its cached model rows appeared, including unconnected services | Filter strictly to connected providers before building/searching model choices; validate a choice again before applying it | Removes unavailable choices and makes connection state determine what is selectable |
| MEDIUM | Accessibility | `src/ui/Popover.tsx:56`, `src/App.tsx` | Duplicate outside-click handling could treat portalled content as outside; internal scrolling dismissed the popup | Shared Popover owns outside dismissal and ignores its internal scroll targets | Keeps controls operable inside the overlay and long lists usable |
| MEDIUM | Accessibility | `src/ui/Popover.tsx:79`, `src/composer/ModelPicker.tsx:103` | Initial focus relied on old model selectors and a delayed timer | Focus search immediately after placement; provide roving model/provider navigation, clear-then-close Escape, and trigger focus return | Gives keyboard users a stable entry point without delayed focus theft |
| MEDIUM | Layout | `src/styles/composer.css:14`, `src/styles/composer.css:27`, `src/styles/composer.css:37` | The tall list dominated the popup; a constrained layout could hide Thinking below its initial view | Use a provider rail and independently scrolling model pane, allowing the pane to shrink above the Thinking footer | Preserves access to effort controls in short and narrow layouts |
| LOW | UI | `src/composer/ModelPicker.tsx:106`, `src/composer/ProviderGlyph.tsx`, `src/composer/Composer.tsx:46` | Flat provider groups and connection labels made the chooser resemble a settings inventory | Use the supplied reference's icon rail, search header, clean model-name rows, selection check, and footer; keep selection open for Thinking adjustment | Matches the requested component and reduces visual load |

The table records fixed root causes identified in that normal-fixture scope. Search results include provider glyphs and accessible provider names to distinguish providers; the later stress test shows that identical names within one provider still need disambiguation. Provider default remains available when a connected provider does not enumerate models.

Motion decision: model selection is a frequent utility action, so popup entry, provider changes, and result updates are immediate. Selection uses a fill and check rather than an entrance animation. The reduced-motion emulation retained `animation-name: none`.

## Verification

Passed:

- `env PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck`.
- `env PATH=/opt/homebrew/opt/node@24/bin:$PATH node_modules/.bin/tsx --test --test-force-exit tests/server/model-options.test.ts`: 3 tests passed, covering all disconnected statuses, cached catalogs, search, description exclusion, catalog immutability, and empty connected catalogs.
- `env PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run build`: client and host production build passed. Vite's existing main-chunk size advisory remains.
- In the isolated QA workspace at `http://127.0.0.1:4492/`, only the connected Codex provider appears; its Provider default and Test model rows have no descriptions or capability badges. Manage connections opens the real Connections dialog.
- In `/?component=composer`, tested one/two/no connections, cross-provider search, selection staying open, changing Thinking, unsupported Thinking, and recovery actions. Browsing Ollama leaves the selected Codex model unchanged; selecting Llama updates selection and the trigger.
- Keyboard ArrowDown/Right enters choices; Home/End reaches the beginning/end of 42 choices and scrolls the list; Escape clears a query, then closes and restores trigger focus. A wheel scroll moved the list 350px while the popup stayed open.
- Focused axe checks using `wcag2a`, `wcag2aa`, `wcag21aa`, and `wcag22aa`: zero violations and zero incomplete checks in dark desktop app, light desktop preview, mobile app, no-connection, and no-match states. At 320px in the shorter component preview, clipped scrollable rows produce an incomplete color-contrast check with zero violations; the full mobile app has zero incomplete checks.
- At 320×640, model/provider/footer controls measure at least 44px, search text is 16px, and page width remains 320px. Thinking stays visible while the list shrinks. A long multilingual catalog in RTL fits without name overflow; End focuses Research model 40. The 480×402 reflow proxy fits within the viewport without horizontal overflow.
- Saved [dark app](screenshots/model-picker-dark.jpg), [light preview](screenshots/model-picker-light.jpg), [mobile app](screenshots/model-picker-mobile.jpg), and [empty state](screenshots/model-picker-empty.jpg). Restored viewport, text direction, and emulated media overrides afterward.

Not verified for this refinement: native screen-reader announcements, actual browser 200% zoom, forced-colors rendering, full automated backend/UI/visual/E2E suites, new desktop installers, Windows, or Android. Historical full-suite and packaging results in [validation.md](validation.md) predate this refinement.

## Verdict

Original verdict: Approve within the normal-fixture scope inspected at that time. This is not approval of the later adversarial cases or a packaged release. Open corrections and remaining checks are tracked in [the stress report](model-options-stress-test.md) and the [UI Roadmap](ui-roadmap.md).
