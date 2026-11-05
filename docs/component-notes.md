# Component notes: Field through Sidebar

Completed 2026-11-05 as part of the [18-component pass](ui-roadmap.md#component-by-component-pass). Every family below has a development-only preview at `/?component=<id>` and a shared implementation under `src/ui/` (or the named feature folder for message and composer composition). The preview navigation links all families and preserves the light/dark selection.

Follow-up status: the [modelOptions stress test](model-options-stress-test.md) found seven open catalog issues after the initial pass. These notes describe the implemented behavior; [the UI Roadmap](ui-roadmap.md) owns correction progress. [Documentation index](README.md).

Screenshots are in `docs/screenshots/components/`.

## Field

Files: `src/ui/Field.tsx`, `src/styles/field.css`; preview: `/?component=field`.

`Field` generates a stable control id with `useId`, associates a visible or visually hidden label, optional requirement marker, description, and error message, and clones the single child to add `id`, `required`, `aria-required`, `aria-invalid`, and a merged `aria-describedby`. `FieldGroup` does the same for grouped controls such as colour swatches. Errors use `role="alert"`; descriptions remain associated when an error replaces the visible guidance.

Integrated into the agent name/description/instructions/group/connection/model form, conversation title/group, schedule name/instructions/agent/time, host address/token, provider URL/key/model ID, and the device-name row. The agent form uses two descriptions where they add information rather than repeating the label.

## Select and Combobox

Files: `src/ui/Select.tsx`, `src/ui/Combobox.tsx`, `src/styles/select.css`; preview: `/?component=select`.

`Select` is a styled native `<select>` that forwards native attributes and refs. `Combobox` is a searchable single-select with a real `role="combobox"` input, a portalled listbox, grouped options, selected state, typeahead filtering, Arrow/Home/End navigation, Enter selection, Escape cancellation, outside-click dismissal, and an upward flip when the viewport is tight. The popup portals into the active native dialog so it is never clipped; this was verified inside the agent form.

Integrated into all native selects in the agent, conversation, and schedule forms, and the agent model field (searchable provider models). The composer keeps its combined provider/model/effort picker because it also controls reasoning effort. Large lists and the popup surface were checked at 390px and 1440px.

## Checkbox and Switch

Files: `src/ui/Checkbox.tsx`, `src/styles/checkbox.css`; preview: `/?component=checkbox`.

Both controls use a real native checkbox input, label click target, visible custom indicator, and `role="switch"` for switches. Checkbox supports an indeterminate state and description; both support disabled state and expose focus through the indicator. On coarse pointers the whole row has a 44px minimum touch area.

Integrated into the agent editor (`Archive this agent`), the schedule form (`Enable this task`), and Settings → Appearance (`Show agent activity`). The settings switch controls whether the tool stream is shown; the separate Compact/Verbose control is disabled while activity is hidden.

## Tabs and Segmented control

Files: `src/ui/Tabs.tsx`, `src/styles/tabs.css`; preview: `/?component=tabs`.

`Tabs` provides underline, pill, and segmented variants with roving tab focus, automatic activation on Arrow/Home/End, optional counts, disabled tabs, and only the active `aria-controls` panel reference. `SegmentedControl` is a labelled group of pressed buttons for immediate single-choice settings.

Integrated into the side panel tabs (pill), Connections categories (segmented), Settings theme selection, and Settings tool-stream detail. The side panel panel id and tab ids are wired for assistive technology.

## Tooltip

Files: `src/ui/Tooltip.tsx`, `src/styles/tooltip.css`; preview: `/?component=tooltip`.

Tooltips are supplemental labels rendered in a fixed portal, shown after a short hover delay or on keyboard focus, dismissed by Escape, pointer leave, scroll, or resize. Shortcuts use a separate keycap. `IconButton` now provides a tooltip by default; a caller can pass `tooltip={false}` to keep only a native title.

Integrated into all shared icon buttons, including the sidebar toolbar, side panel close, composer model actions, and message actions. The agent rail uses bottom-side tooltips so the first row is not clipped.

## Dropdown and Context menu

Files: `src/ui/Menu.tsx`, `src/styles/menu.css`; preview: `/?component=menu`.

`Menu` clones a trigger, manages open state, renders a fixed portal above the active dialog, supports start/end and top/bottom placement, arrow/Home/End navigation, Escape focus restoration, outside-click dismissal, shortcuts, disabled items, destructive tone, and separators. `ContextMenu` reuses the same surface at the pointer or keyboard context position.

Integrated into the sidebar workspace menu, agent-group options, the Agents grid card menu, and message actions (hover menu plus right-click context menu). This replaced the bespoke sidebar menus and their duplicate focus logic.

## Popover

Files: `src/ui/Popover.tsx`, `src/styles/popover.css`; preview: `/?component=popover`.

A fixed, anchored surface with logical start/center/end alignment, top/bottom placement, viewport clamping and collision flipping, dialog-aware portal mounting, outside-click/Escape dismissal, and configurable initial focus. Resize repositions the surface; scrolling inside it keeps it open, while background scrolling dismisses it. The initial positioning frame uses opacity and disabled pointer events rather than visibility:hidden, allowing initial focus to reach its target as positioning completes without a delayed timer.

Integrated into the composer model picker. Focus starts in Search connected models, or Connect a provider when none are connected. The picker owns Escape handling so the first Escape clears an active query and the next closes it and restores trigger focus. See [the model picker review](model-picker-review.md).

## Dialog and Confirmation

Files: `src/ui/Dialog.tsx`, `src/styles/dialog.css`; preview: `/?component=dialog`.

`Dialog` uses native `<dialog>` for focus trapping and top-layer rendering, restores focus to the invoking control, closes on Escape/backdrop, and supports compact/medium/large/full sizes, descriptions, a footer, hidden back labels, and configurable initial focus. The existing `Modal` is now a thin wrapper over `Dialog`, preserving all existing modal surfaces. `ConfirmDialog` adds a danger/primary icon, consequence copy, busy state, and focuses Cancel by default.

Integrated into every existing dialog through `Modal`, and into destructive confirmations for agent-group deletion and device-token revocation. Escape now closes dialogs even when focus is inside a search input, because the dialog also handles Escape at the dialog level.

## Badge and Status indicator

Files: `src/ui/Badge.tsx`, `src/styles/badge.css`; preview: `/?component=badge`.

Badges provide neutral, success, warning, danger, info, accent, and brand tones in small/medium sizes, with optional dot or icon. Status indicators pair a semantic dot with visible text; `StatusDot` supports an accessible label and an optional pulse. Reduced motion stops the pulse.

Integrated into provider statuses in Settings and Connections, schedule states, device current/revoked badges, the sidebar connection dot, the topbar reconnecting badge, agent activity dots, and the side-panel session status.

## Avatar and Agent mark

Files: `src/ui/Avatar.tsx`, `src/ui/AvatarPicker.tsx`, `src/styles/avatar.css`, `shared/agentAvatars.ts`; preview: `/?component=avatar` (add `&stress=1` for the 500-agent roster check).

`bot-avatars@0.2.2` is pinned exactly. Every agent, including primary A Gent, uses a glossy plastic bot (`shading="plastic"`, eyes-only faces, `brightness={1}`, `saturation={1}`, no hats/glasses/headphones/bow tie). `Avatar` sizes are xs/sm/md/lg/xl or numeric; `AgentGlyph` remains the compact wrapper; `AgentMark` remains the brand mark for product surfaces. The primary-agent special case was removed from both the avatar and welcome rendering.

`Avatar` adds `state` (`default`, `working`, `sleeping`) and `motion` (`full`, `static`). The runtime provider derives activity from the latest run per agent: running → working, approval waiting → default (with the existing approval indicators), completed/failed/interrupted → idle, archived with no active run → sleeping. A live media-query listener switches painted motion when reduced-motion changes, not just CSS. Offscreen avatars defer canvas initialization through an IntersectionObserver, and the library stops animation when offscreen or the page is hidden. Rendering is memoized; the seed comes from the agent ID so streaming text does not restart motion.

The renderer is one lazy dynamic-import chunk with a fixed-size SVG bot fallback underneath the canvas. The fallback covers the library's material-preparation fade and is unmounted once the canvas reaches full opacity, so it never shows through the transparent corners of a shape such as the star. If the renderer cannot load or initialize, the fallback remains. There is no layout shift when the canvas appears. The top-pill overflow rule now truncates only the text label, allowing canvas overscan around the header avatar.

Saved agents have `avatarType?: AgentAvatarType` on top of the preserved legacy `icon`. The shared catalog has the 18 names; missing shapes resolve independently as spark → star, code → mech, design → flower, search → clover, custom → droid. Explicit shapes win. API requests reject unsupported values; stored/imported unsupported values are stripped so workspace startup still succeeds. Import never inherits the primary template's shape. Older clients keep their legacy icon behavior against the updated host; downgrading to an older host may discard the shape preference when that host rewrites workspace data.

`AvatarPicker` is a full-width inline disclosure with a labelled native radio grid: six columns on desktop, three on narrow/coarse screens, scrollable inside a 240px panel with a fixed Done footer. Thumbnails use static poses; the selected trigger preview uses full motion. Done, Enter, and Escape close the panel and restore trigger focus without submitting the form or closing the agent dialog. Cancel discards draft changes.

Integrated into the sidebar, compact rail, top pill, welcome empty state, side panel session card and Sessions list, Agents grid, schedule rows, agent editor preview, picker, search results, and the avatar preview. Verified at 1280/1440, 390px, both themes, with a 500-agent stress roster: 500 fallback wrappers loaded, only 12 canvas instances mounted initially and 24 after scrolling, with no offscreen eager initialization.

Screenshots: [preview dark](screenshots/components/avatar-dark.png), [preview light](screenshots/components/avatar-light.png), [preview mobile](screenshots/components/avatar-mobile.png), [picker dark](screenshots/components/avatar-picker-dark.png), [picker light](screenshots/components/avatar-picker-light.png), [500-agent roster](screenshots/components/avatar-stress-dark.png). Integration references: [app](screenshots/integration/avatars-app.png), [rail](screenshots/integration/avatars-rail.png), [agent dialog](screenshots/integration/avatars-agent-dialog.png), [picker desktop](screenshots/integration/avatars-picker-desktop.png), [picker mobile](screenshots/integration/avatars-picker-mobile.png), [side panel](screenshots/integration/avatars-side-panel.png), [sessions](screenshots/integration/avatars-sessions.png), [fallback](screenshots/integration/avatars-fallback.png), [schedules list](screenshots/integration/avatars-schedules-list.png).

## Alert and Toast

Files: `src/ui/Alert.tsx`, `src/styles/alert.css`; preview: `/?component=alert`.

`Alert` provides neutral/info/success/warning/danger tones, compact and medium sizes, an optional title, action, and dismiss control, with immediate announcement for danger/warning. `ToastProvider` and `useToast()` render up to three transient toasts in the active dialog top layer, pause on hover/focus, auto-dismiss, and use the same alert visual language.

Integrated into the app error banner, all form-level errors, schedule failures, device errors, message-run errors, and copy feedback for messages, code blocks, pairing tokens, and device actions.

## Card and List row

Files: `src/ui/Card.tsx`, `src/styles/card.css`; preview: `/?component=card`.

`Card` supports plain/flat/raised/interactive surfaces. `ListRow` provides leading identity, one- or two-line copy, trailing content, selected state, and button semantics when clickable. Both use shared radius and padding tokens.

Integrated into the Agents and Scheduled dialogs, the side-panel Sessions list, and the card/list previews. It replaced the repeated card markup and the bespoke session rows.

## Search field and results

Files: `src/ui/Search.tsx`, `src/styles/search.css`; preview: `/?component=search`; focused review: [Search field review](search-component.md).

`SearchField` is a labelled search landmark with a resting border, a single accent focus ring, a clear button, size variants, and ArrowDown/ArrowUp handoff into results. `SearchResults` provides list semantics, Arrow/Home/End movement, a reusable result row, and a live empty state.

Integrated into Search Conversations (⌘K), Settings search, and Connections search. Results use the shared avatar/glyph, list row, and trailing action. A focused review corrected the legacy input-style leak (which added an inner box inside the field), the double focus treatment, the invisible Connections field, Arrow-key behavior, the clear-button hit area, and the missing results gap.

## Composer and Attachment

Files: `src/composer/Composer.tsx`, `ModelPicker.tsx`, `ProviderGlyph.tsx`, `modelOptions.ts`, plus `src/ui/Attachment.tsx`, `src/styles/attachment.css` and `src/styles/composer.css`; preview: `/?component=composer`.

The composer retains its Reason-style one-row/expanded geometry. The add menu now uses the shared `Menu`, the model/effort picker uses the shared `Popover`, and attachments use shared chips. Enter sends, Shift+Enter adds a line, drag/drop remains available, and the send/stop circle becomes stop while a run is active. On narrow screens the model controls wrap to a second row so the message field keeps full width and 16px text; the circles grow to 40px.

Integrated into the main conversation surface and the live composer preview. Model/effort changes still append centered system events to the conversation.

The model picker follows the supplied provider-rail reference: connected provider icons on the left, search and model-name rows on the right, and Thinking controls below. Model descriptions and media/reasoning badges are omitted. Search matches connected provider names and model names/IDs; cached catalogs from disconnected providers never appear. Provider default remains available for connected providers with no enumerated catalog. Model selection keeps the picker open so Thinking remains reachable; browsing a provider tab alone does not change the selected model. Thinking uses the existing Light/Balanced/Deep support for Codex and explains when another provider does not support it.

Provider tabs and model rows support arrow/Home/End navigation. Search spans connected providers and labels each result with its provider for assistive technology. Empty search and no-connection states offer recovery actions. Long names wrap, the model list scrolls independently, and the Thinking footer stays visible in short layouts with at least 248px of available height. Extremely short surfaces retain outer scrolling. Narrow/coarse-pointer controls are at least 44px with 16px search text. This frequent picker uses immediate state feedback without entry or list animations. Preview fixtures cover one/two/no connections, disconnection, and a long multilingual catalog. See [model-picker-review.md](model-picker-review.md) for the scoped checks and limits.

## Message and Tool activity

Files: `src/chat/MessageBubble.tsx`, `DateDivider.tsx`, `ApprovalCard.tsx`, `ToolStream.tsx`, `MessageList.tsx`; preview: `/?component=message`.

`MessageBubble` owns the bubble body, markdown, code-block copy, attachments, status messages, hover copy, and an overflow menu; it also exposes a right-click context menu with Copy and Conversation details. `DateDivider` and `SystemEvent` own the inline separators. `ApprovalCard` is shared by the conversation and the side panel. `ToolStream` keeps the compact/verbose/hidden setting and failure state.

Integrated into the main conversation, side-panel approvals, and the message preview. The message menu aligns to the message side: assistant menus open right, user menus open left.

## Sidebar and Navigation rail

Files: `src/app/Sidebar.tsx`, `src/app/SidebarRail.tsx`, `src/styles/sidebar.css`; preview: `/?component=sidebar`.

The sidebar keeps agent-first navigation, two-line latest-message previews, collapsible groups, a single account/connect-apps/more footer, and keyboard menus. The rail keeps the same agents and actions with tooltips and an accessible active state. The preview includes both surfaces and their responsive variants.

Integrated into the app shell. The workspace and group menus now use the shared `Menu`; icon buttons use the shared tooltip; running agents use the shared status dot; the accessible name of an agent row is the agent name while the preview is visual-only (`aria-hidden`) to keep voice-control names short and exact.

## Verification

See [validation.md](validation.md#component-by-component-pass) for the exact commands and results. All 18 previews, the integration screens, light/dark themes, desktop/mobile widths, keyboard paths, and automated suites are covered there.

That historical baseline predates the adversarial catalog review. For current limitations and reproductions, see [model-options-stress-test.md](model-options-stress-test.md).
