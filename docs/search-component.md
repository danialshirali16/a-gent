# Search field review

Reviewed and fixed 2026-11-05. Implementation: `src/ui/Search.tsx`; styles: `src/styles/search.css`; preview: `/?component=search`.

## Findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `src/styles/search.css:19` | The search input still matched the legacy page input rule (`input:not([type=checkbox]):not(.text-control)`), which added an inner border, background, padding and 7px radius. | `.ui-search .ui-search-input` explicitly resets border, background, padding and radius. | The field rendered an inner rounded box and a divider before the clear button, so it did not read as one surface. This was the main “not right” state. |
| HIGH | `src/styles/search.css:41` | Clear button was a 20×20px target at every width. | 26×26px on desktop, 40×40px on coarse pointers. | Touch users could miss the only way to reset the field; this violated the project's touch-target rule. |
| MEDIUM | `src/styles/search.css:17` | Focus used an accent border **and** a 2px accent outline offset by 2px, while the input also received a native focus outline. | One 2px accent edge (1px accent border + 1px accent shadow); the input outline is explicitly removed. | The old state read as three nested rectangles and made the field look selected by default. A single focus edge is clearer and more calm. |
| MEDIUM | `src/styles/search.css:68` | Connections search was borderless and transparent, and its focus state removed the outline entirely. | A normal bordered field with the shared focus ring. | The field read as placeholder text in the toolbar, and keyboard users had no visible focus in that surface. |
| MEDIUM | `src/dialogs.tsx:96` | Arrow keys only worked after focus was already inside the result list, despite the preview copy promising arrow navigation. | ArrowDown from the field focuses the first result; ArrowUp focuses the last; Arrow/Home/End continue inside the list. | Keyboard users expect to move from a search field straight into results without tabbing through the dialog. |
| LOW | `src/dev/SearchPreview.tsx:39` | The main preview field used `autoFocus`, so every screenshot showed the focus state as if it were the resting state. | Resting state by default; focus is captured separately and remains keyboard-accessible. | A focus ring is a state, not the default appearance; the preview should show both honestly. |
| LOW | `src/styles/search.css:55` | Search results had no gap below the field in the real dialogs (only the preview added one). | An 8px gap whenever results follow a search field. | The field and results read as one block with a proper pause instead of touching. |
| LOW | `src/ui/Search.tsx:25` | The `role="search"` landmark had no accessible name. | The landmark carries the field label. | Multiple search surfaces (dialog, settings, connections) now have distinct landmarks for screen-reader navigation. |

## Result

- Resting field: 34px high, 1px neutral border, subtle ink-tinted surface, 16px icon, 13px text, no inner input box.
- Focus: one 2px accent edge, no second outline and no native input ring.
- Clear action: 26px desktop, 40px touch, 13px icon, accessible label.
- Mobile: 44px field, 16px text, 40px clear target, 56px result rows, no horizontal overflow.
- Keyboard: ArrowDown/ArrowUp from the field enters the result list; Arrow/Home/End move within it; Escape still closes the containing dialog.
- Settings keeps its compact filled field; Connections now uses the normal bordered field.
- The result list announces an empty state with `role="status"`; the preview has a visible "No result selected" status.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| Axe on the Search preview | 0 violations in light and dark |
| All component previews axe | 36 scans (18 families × light/dark), 0 serious or critical |
| ArrowDown from the field | Focuses "Onboarding flow" result |
| ArrowUp from the field | Focuses the last result, "Weekly review" |
| Type "design" | 1 matching result; clear button visible |
| Clear button | Empties the field and returns focus to the input |
| Desktop measurements | Field 34px; clear 26×26px |
| Mobile measurements at 390px | Field 44px; clear 40×40px; result row 56px; no horizontal overflow |
| Production smoke / visual / axe / E2E | Covered by the final pass in [validation.md](validation.md#component-by-component-pass) |

Screenshots: [resting light](screenshots/components/search-light.png), [focus light](screenshots/components/search-focus-light.png), [dark](screenshots/components/search-dark.png), [empty state](screenshots/components/search-empty-dark.png), [dialog](screenshots/integration/search-dialog.png), [Connections field](screenshots/integration/connections-dialog.png).
