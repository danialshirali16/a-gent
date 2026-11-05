# A Gent → Reason-style UI Roadmap

Status: active
Branch: `main`
Active scope: macOS only

Current focus: **complete provider and MCP/Connect Apps workflows after the completed 18/18 component pass**. The [historical integration review](integration-review.md) records the starting gaps; current status belongs to [the completion roadmap](project-roadmap.md), [workstream boards](roadmaps/README.md), and [validation](validation.md).

Required next UI scopes also include [model-specific Thinking options](roadmaps/reasoning-effort.md), [Agent skill management](roadmaps/skills.md), and [ElevenLabs Speech-to-Text](roadmaps/speech-to-text.md). Their acceptance is separate from the completed component pass. Every UI/product scope must first complete its [benchmark comparison and design decisions](benchmarks/README.md); the boards carry explicit BEN dependencies before development can start.

The [modelOptions stress test](model-options-stress-test.md) still has seven open findings, owned by PVD-008–PVD-011 and their regression tasks. The initial component milestone remains complete; production corrections have not been applied in this planning pass.

The Search field was corrected on 2026-11-05; see [its review](search-component.md). The Avatar family uses pinned `bot-avatars@0.2.2` with saved shapes, full motion, and the inline picker; see [component notes](component-notes.md#avatar-and-agent-mark).

Latest refinement (2026-11-05): the composer model picker now follows the supplied provider-rail reference, shows connected providers only, and omits model descriptions and media/reasoning badges. Search, model selection, Thinking controls, keyboard navigation, and narrow layouts were checked. See [the model picker review](model-picker-review.md) and [focused validation](validation.md#model-picker-refinement). This refinement is in the source and browser preview; the desktop installer has not been rebuilt for it.

Subsequent adversarial testing found blank labels, invalid-ID selection, ambiguous names, Unicode search, retained scroll, count-copy issues, and an unbounded string contract. These findings qualify the earlier normal-fixture review. Reproduce them at `/?component=composer&stress=model-options&data=worst`; review the [proposed fixes](model-options-stress-test.md#what-broke) before the next release check.

## Component-by-component pass

Updated: 2026-11-05. Work through one component family at a time, using the installed Reason interface as the visual reference and keeping A Gent's own branding and behavior. Existing screen-specific controls stay in place until their component's turn.

### Component progress

| Order | Component | Status | Scope |
| --- | --- | --- | --- |
| 1 | [Button](button-component.md) | Complete | Primary, secondary, quiet, destructive, text, icon-only, loading |
| 2 | [Input and Textarea](input-component.md) | Complete | Text fields, passwords, dates, multiline text, focus, disabled, read-only, errors |
| 3 | [Field](component-notes.md#field) | Complete | Labels, descriptions, required indicators, validation messages |
| 4 | [Select and Combobox](component-notes.md#select-and-combobox) | Complete | Native selection, searchable options, model selection |
| 5 | [Checkbox and Switch](component-notes.md#checkbox-and-switch) | Complete | Selection and settings toggles |
| 6 | [Tabs and Segmented control](component-notes.md#tabs-and-segmented-control) | Complete | Settings choices and side-panel sections |
| 7 | [Tooltip](component-notes.md#tooltip) | Complete | Labels for compact icon actions and shortcuts |
| 8 | [Dropdown and Context menu](component-notes.md#dropdown-and-context-menu) | Complete | Workspace, agent, group, and message actions |
| 9 | [Popover](component-notes.md#popover) | Complete | Composer actions and anchored pickers |
| 10 | [Dialog and Confirmation](component-notes.md#dialog-and-confirmation) | Complete | Form dialogs, destructive confirmations, focus handling |
| 11 | [Badge and Status indicator](component-notes.md#badge-and-status-indicator) | Complete | Connection, activity, device, and run states |
| 12 | [Avatar and Agent mark](component-notes.md#avatar-and-agent-mark) | Complete | Bot shapes, colors, sizes, motion, activity, shape picker, brand mark |
| 13 | [Alert and Toast](component-notes.md#alert-and-toast) | Complete | Inline errors, notices, action feedback |
| 14 | [Card and List row](component-notes.md#card-and-list-row) | Complete | Agents, providers, schedules, settings rows |
| 15 | [Search field and Search results](search-component.md) | Complete | Workspace search and settings/catalog filters |
| 16 | [Composer and Attachment](component-notes.md#composer-and-attachment) | Complete | Message entry, attachments, model controls, send/stop |
| 17 | [Message and Tool activity](component-notes.md#message-and-tool-activity) | Complete | Chat bubbles, actions, streamed tools, approvals |
| 18 | [Sidebar and Navigation rail](component-notes.md#sidebar-and-navigation-rail) | Complete | Agent rows, groups, compact navigation, footer |

### Process for each component

1. Review the current working tree and preceding component notes so existing user changes and behavior are preserved. Mark the selected row **In progress**.
2. Inspect the corresponding Reason control: geometry, typography, spacing, colors, and interaction states. Use original implementation code and A Gent's shared tokens. Keep motion purposeful and immediate for frequent actions.
3. Build or refine the reusable component in `src/ui/` with its owned styles. Preserve native semantics, keyboard behavior, focus, and accessible labels/descriptions; cover the applicable default, hover, pressed, disabled, loading, read-only, and error states.
4. Integrate it into the relevant existing screens and add a development-only preview linked from the component preview navigation. Keep unrelated component families for their own passes.
5. Verify light/dark, desktop/narrow layouts, touch sizing, keyboard operation, and relevant real form flows. Run typecheck and production build plus checks appropriate to the change. When updating the packaged app, rebuild and verify macOS; Windows and Android remain paused.
6. Save screenshots and component API/integration notes, record exactly which checks ran in [validation.md](validation.md), and update this table, the date, current focus, and continuation point. Mark **Complete** only after implementation, integration, and rendered verification; mark the following component **Next**.

The older phase checkboxes below describe the broader shell implementation. They do not mean that every component has completed this refinement pass, or that earlier automated test results were rerun for the latest changes.

### Continuation point

**The 18-component pass is complete.** No component is Next. All shared families are implemented under `src/ui/` (or their feature folder), integrated into existing screens, and linked from the development preview navigation. The preview IDs are `button`, `input`, `field`, `select`, `checkbox`, `tabs`, `tooltip`, `menu`, `popover`, `dialog`, `badge`, `avatar`, `alert`, `card`, `search`, `composer`, `message`, and `sidebar`.

The final pass ran typecheck, 17 backend tests, production build, 18 Playwright smoke tests, 10 visual baselines, 7 axe scans, and 7 E2E workflows; see [the validation record](validation.md#component-by-component-pass) and the [bot avatar checks](validation.md#bot-avatar-replacement). It also reviewed and corrected the Search field: reset legacy input styling that caused an inner box, single focus treatment, visible Connections field, ArrowDown/Up handoff into results, larger clear target, named search landmark, and correct results spacing. Details are in [search-component.md](search-component.md).

Remaining UI work includes provider setup, app authentication/access/management, URL-flow and live HIL recovery, and catalog corrections, alongside manual accessibility and release QA. Supported question/form cards and the capability/reload/sign-in Connect Apps surfaces now exist in source. Large-workspace/SSE checks, packaged notices, distribution, and resumed platform work are tracked in the master/task boards rather than implied complete by the component pass.

Current continuation: M3 has scoped inventory, capability inspection, Codex OAuth start, runtime reload, and question/form cards implemented; finish config adoption, enable/disable/removal, per-agent access, and Connect Apps onboarding (APP-001–APP-012), then HIL-004–006 and live acceptance. UI owners use PVD-005/006/009/010/012 for model/provider setup. UX-001–UX-007 cover final integration/accessibility. Update task status in those boards, keeping this document for component process and UI evidence.

The catalog regression toggle remains Demo data, Worst case, Empty, One choice, 1,000 models, and Invalid IDs, with URL persistence. [The report](model-options-stress-test.md) contains field contracts, reproductions, and verification limits.

Before the next packaged release, include the latest model picker refinement in the macOS rebuild and rerun the release suites. The earlier full-suite and installer results above predate that refinement.

Run `npm run dev` for the previews. Open `/?component=button`, `/?component=input`, or any of the 18 IDs above; the preview navigation lists every family.

## Current implementation status

Implemented:

- `src/styles/tokens.css` — Reason-derived light/dark tokens.
- `src/styles/reason.css` — shell, sidebar, chat, composer, side panel, responsive rules.
- `src/app/Sidebar.tsx` — compact Teammates toolbar, two-line agent/message previews, collapsible groups, and a single-row account/connect-apps footer.
- `src/app/TopBar.tsx` — centered agent/session pill and side-panel toggle.
- `src/app/SidePanel.tsx` — Session, Sessions, Files, Terminal, Activity, and Approvals tabs.
- `src/app/FilesPanel.tsx` — read-only workspace file browser.
- `src/app/TerminalPanel.tsx` — read-only terminal/activity detail.
- `src/chat/MessageList.tsx` — bubbles, date separators, hover actions, approvals.
- `src/chat/ToolStream.tsx` — compact tool activity stream.
- `src/composer/Composer.tsx` — one-line composer, plus menu, combined model/effort pill.
- `src/composer/ModelPicker.tsx`, `ProviderGlyph.tsx`, and `modelOptions.ts` — connected-only provider rail, searchable model names, and persistent Thinking footer; see [the review](model-picker-review.md).
- `src/App.tsx` — new shell composition; conversations moved out of the sidebar.
- `src/components.tsx` — brand mark alias, spinner, activities, modal wrapper, and the shared avatar/glyph re-exports from `src/ui/Avatar.tsx`.
- `src/dialogs/ConnectionsDialog.tsx` — models/apps/host connection catalog with Codex OAuth start, app capability inspection, reload, partial-inventory notices, and host pairing.
- `src/dialogs/SettingsDialog.tsx` — full-window settings with Appearance, Models, Devices, Data, Shortcuts, and About; model statuses come from the host.
- `src/dialogs/AgentsDialog.tsx` — agents grid modal.
- `src/dialogs/SchedulesDialog.tsx` — scheduled tasks modal.
- `src/app/SidebarRail.tsx` — compact icon rail when the sidebar is collapsed.
- `src/keyboard.ts` — shared arrow/Home/End focus navigation for menus and popovers.
- `src/ui/Button.tsx` — shared Reason-inspired action buttons and icon buttons, with sizes, native form semantics, and loading states. See `button-component.md`; development preview: `/?component=button`.
- `src/ui/Input.tsx` — shared Input and Textarea controls across 15 form fields, with native editing, sizes, focus, disabled/read-only/error states, and touch sizing. See `input-component.md`; development preview: `/?component=input`.
- `src/ui/Field.tsx` — label, description, requirement, and validation composition wired into every form. See `component-notes.md#field`.
- `src/ui/Select.tsx` and `src/ui/Combobox.tsx` — native selects and a searchable, portalled model picker. See `component-notes.md#select-and-combobox`.
- `src/ui/Checkbox.tsx` — native checkbox, indeterminate, and switch controls used by agent archiving, schedules, and settings.
- `src/ui/Tabs.tsx` — underline, pill, and segmented tab families used by the side panel, Connections, and Settings.
- `src/ui/Tooltip.tsx`, `src/ui/Menu.tsx`, and `src/ui/Popover.tsx` — shared overlays with dialog-aware portals and keyboard focus management.
- `src/ui/Dialog.tsx` — native dialog surface, focus restore, Escape/backdrop handling, and `ConfirmDialog` for destructive actions. The existing `Modal` now wraps it.
- `src/ui/Badge.tsx`, `src/ui/Alert.tsx`, and `src/ui/Avatar.tsx` — status, inline notice/toast, and bot-avatar primitives. Avatars use the pinned `bot-avatars@0.2.2` canvas renderer, lazy fallback, live activity/theme/reduced-motion runtime, and a shared brand mark.
- `src/ui/AvatarPicker.tsx` — inline static-thumbnail shape picker with native radios, keyboard dismissal/focus restore, and a 240px scroll cap.
- `shared/agentAvatars.ts` — React-free 18-shape catalog, legacy icon mapping, and run-activity derivation used by the host and UI.
- `src/ui/Card.tsx` — shared card/list-row composition used by Agents, Scheduled, and the side panel.
- `src/ui/Search.tsx` — labelled search field, clear action, result list, empty state, and ArrowDown/Up handoff into results. See [the Search field review](search-component.md).
- `src/ui/Attachment.tsx` — attachment chips shared by the composer and previews.
- `src/chat/MessageBubble.tsx`, `DateDivider.tsx`, and `ApprovalCard.tsx` — extracted message composition, date/system separators, and the approval card shared by the conversation and side panel.
- `src/dialogs/ProviderCard.tsx` — provider card moved out of the removed page-view module.
- Development previews at all 18 IDs with a single linked navigation and theme preservation; preview code is excluded from production.
- Electron custom window chrome: macOS `hiddenInset`, Windows `titleBarOverlay`, drag/no-drag regions.
- Accessibility improvements: `aria-live` streaming replies, `aria-current` navigation, visible run errors, improved muted-text contrast through Reason tokens.
- Code-block copy buttons in Markdown replies.
- Centered model-change and reasoning-effort events in conversations.
- Tool stream setting: Compact / Verbose / Hidden.
- Inter Variable UI text with a Latin-only 48 KB font subset.
- Full keyboard navigation for menus, dialogs, model picker, and side-panel tabs.
- Automated axe coverage exists; earlier normal-fixture scans recorded zero violations. The later adversarial catalog exposes unnamed buttons; see the stress-test report.
- Playwright smoke, visual, accessibility, and E2E coverage.
- Device pairing tokens with rotation/revocation in Settings → Devices.

Still pending: model catalog corrections, retry message action, manual screen-reader/reduced-motion audit, a large-workspace performance check, Windows/Android runtime checks (paused), packaged notice verification, and a release tag. Notice generation is already part of the build.

## 1. Goal

Transform A Gent’s interface into a Reason-style workspace while keeping the app local-first and keeping A Gent’s name, logo, and brand.

Use Reason’s layout, density, component geometry, and interaction patterns as the reference. Do not copy Reason’s proprietary CSS, assets, copy, hosted services, billing, or account flows.

### Fidelity levels

| Level | Scope | Target |
| --- | --- | --- |
| F1 — Visual language | Colors, typography, spacing, radii, shadows, motion | Required |
| F2 — Layout | Shell, sidebar, chat column, composer, top pill | Required |
| F3 — Interaction | Modals, menus, side panel, hover actions, compact rail | Required for v1 |
| F4 — Surface parity | Settings, connections, agents, schedules, search all in Reason-style surfaces | v1.1 |

### Non-goals

- Reason cloud computer, cloud sessions, hosted OAuth connectors.
- Billing, usage, members, company, trial/ad banner.
- Reason account/login.
- Voice input/chat unless separately approved.
- Copying Reason’s proprietary assets, copy, or stylesheet wholesale.
- Auto-update, notarization, store publishing.

## 2. Design system reference

The original reference came from Reason’s public CSS bundles and the running 0.1.119 app. The current values below include the visual refinement against the installed Reason app on 2026-11-04.

### Dark theme

| Token | Value |
| --- | --- |
| Page | `#121212` |
| Sidebar | `#121212` |
| Raised | `#1f1f1f` |
| Composer | `#242424` |
| Highlight | `#1f1f1f` |
| Ink | `#f5f5f5` |
| Text secondary | `#f5f5f5a8` |
| Text tertiary | `#f5f5f58a` |
| Border | `#f5f5f51a` |
| Strong border | `#f5f5f538` |
| Accent | `#4d9bff` |
| A Gent brand | `#ed956c` |
| Success | `#3fa266` |
| Danger | `#e34671` |
| Warning | `#f1b467` |
| User bubble | `#f5f5f52e` |
| Assistant bubble | `#1f1f1f` |

### Light theme

| Token | Value |
| --- | --- |
| Page | `#fcfcfc` |
| Sidebar | `#f5f5f5` |
| Raised | `#ffffff` |
| Composer | `#ffffff` |
| Highlight | `#efefef` |
| Ink | `#1c1c1c` |
| Text secondary | `#1c1c1caf` |
| Text tertiary | `#1c1c1ca3` |
| Border | `#1c1c1c1f` |
| Strong border | `#1c1c1c3d` |
| Accent | `#0b6dd3` |

### Typography

- Text: Inter Variable.
- Mono: system monospace (SF Mono / Menlo fallback).
- Base: `14px`.
- Micro: `12px`.
- Body weight: `400` / `420`.
- Medium: `500`; semibold: `600`.
- Chat message: `14px`, line-height `20–24px`.
- Headings: `17–28px`.
- Letter spacing: mostly `0`, occasional `-.02em` to `-.035em`.

### Layout

| Token | Value |
| --- | --- |
| Sidebar width | `280px` |
| App shell grid | `280px minmax(0,1fr)` |
| Detail panel | `480px` |
| Reading width | Available width minus 32px, capped at `1200px` |
| Composer width | Available width minus 32px, capped at `1200px` |
| Bubble max width | `760px`, capped by the conversation width |
| Agent row height | `56px` |
| Row radius | `8px` |
| Main panel | Flat, with a thin sidebar divider |
| Main panel inset | `0px` |

### Component dimensions

| Component | Value |
| --- | --- |
| Header pill | `40px` high, radius `9999px`, padding `7.5px 13.5px 7.5px 7.5px`, font `14px/20px`, weight `500` |
| Composer one-line | `52px` high, radius `999px`, padding `7px 8px` |
| Composer expanded | Grows with content, radius `24px` |
| User bubble | radius `18px`, padding `7px 13px` |
| Assistant bubble | radius `18px`, padding `7px 13px` |
| Composer menu | `220px` wide, radius `14px`, padding `8px`, shadow `0 8px 22px #00000047` |
| Project modal | `min(520px,100%)`, radius `14px`, shadow `0 24px 64px #00000059` |
| Inset panel shadow | `0 2px 8px #00000014, 0 1px 2px #0000000a` |
| Motion | fast `.12s`, slow `.22s`, base `.26s`, panel `.32s`, `cubic-bezier(.16,1,.3,1)` |

### Radii

`6, 7, 8, 9, 10, 12, 14, 16, 18, 24, 999`

### Breakpoints

Primary: `767/768px`. Also: `640`, `720`, `760`, `1100`, `1180`.

## 3. Decision gates

| ID | Decision | Recommendation |
| --- | --- | --- |
| D1 | Sidebar model: agents only, or agents + conversations? | Agents in sidebar; conversations in side panel + plus menu |
| D2 | Groups: group agents or conversations? | Add agent groups; keep conversation groups in Sessions panel |
| D3 | Accent: Reason blue/neutral or A Gent orange? | Neutral/blue interactive accent; orange for brand/logo |
| D4 | Settings/Connections: modals or pages? | Full-window Settings with dialog focus/escape behavior; Connections remains a modal |
| D5 | Side panel scope: session only, or files/terminal too? | Session + Sessions + Activity in v1; Files/Terminal in v1.1 |
| D6 | Voice controls? | Omit until implemented; no dead buttons |

### Recommended schema for agent groups

```ts
interface AgentGroup {
  id: string;
  name: string;
  createdAt: string;
}

interface Agent {
  // existing fields
  agentGroupId?: string | null;
}

interface WorkspaceState {
  // existing
  agentGroups: AgentGroup[];
}
```

Implemented migration:

- Workspace version stays `1`; `agentGroups` is optional on import and defaults to `[]`.
- Unknown `agentGroupId` references become `null`.
- `validateImport` accepts old workspaces and exports `agentGroups`.
- Agent-group API endpoints cover create, rename, delete, and assignment.
- Backend and UI tests cover the flow.

## 4. Target architecture

```text
src/
  App.tsx                     composition root
  app/
    AppShell.tsx              grid: sidebar / main / side panel
    Sidebar.tsx
    TopBar.tsx
    SidePanel.tsx
  chat/
    ChatView.tsx
    MessageList.tsx
    MessageBubble.tsx
    DateDivider.tsx
    SystemEvent.tsx
    ToolStream.tsx
  composer/
    Composer.tsx
    ComposerMenu.tsx
    ModelPicker.tsx
  ui/
    Button.tsx
    IconButton.tsx
    Avatar.tsx
    Modal.tsx
    Menu.tsx
    Popover.tsx
    Tabs.tsx
    Badge.tsx
    Tooltip.tsx
    EmptyState.tsx
  dialogs/
    SettingsDialog.tsx
    ConnectionsDialog.tsx
    AgentDialog.tsx
    GroupDialog.tsx
    ScheduleDialog.tsx
    SearchDialog.tsx
    ConversationDialog.tsx
  styles/
    tokens.css
    base.css
    shell.css
    sidebar.css
    chat.css
    composer.css
    dialogs.css
    sidepanel.css
    responsive.css
```

## 5. Phases

### Phase 0 — Baseline and safety net

- [x] Commit baseline.
- [x] Create `ui/reason-style` branch.
- [x] Capture baseline screenshots at 1440×900, 1280×800, 1024×768, 768×1024, 390×844.
- [x] Add Playwright visual test scaffold.
- [x] Add this roadmap.
- [x] Run typecheck, server tests, and production build after the first UI pass.

### Phase 1 — Design token layer

- [x] Add `src/styles/tokens.css` with light/dark tokens.
- [x] Add type, spacing, radii, shadow, and motion scales.
- [x] Alias existing CSS variables to new tokens.
- [x] Use Inter Variable for UI text.
- [ ] Add a dedicated mono font if needed.
- [x] Verify theme switching and build.

### Phase 2 — App shell and top bar

- [x] Add `AppShell` grid: sidebar / main / optional side panel.
- [x] Use a flat chat surface with a thin sidebar divider.
- [x] Add `TopBar` with centered agent/session pill.
- [x] Remove topbar context title and project button.
- [x] Add sidebar top action row: collapse, search, new.
- [x] Add compact rail state for collapsed sidebar.
- [x] Add Electron custom chrome: macOS `hiddenInset`, Windows `titleBarOverlay`.
- [x] Add drag/no-drag regions.

### Phase 3 — Sidebar information architecture

- [x] Remove large brand header.
- [x] Use the primary agent row as home; remove the duplicate brand row.
- [x] Add the latest message preview below each agent name.
- [x] Add agent rows with solid color icons.
- [x] Add agent groups or “Agents / Unassigned”.
- [x] Move conversations out of the sidebar.
- [x] Add bottom account menu.
- [x] Add “Connect apps” pill.
- [x] Move All agents / Scheduled / Connections / Settings into menus.
- [x] Add global search trigger.

### Phase 4 — Chat surface

- [x] Add `MessageList`, `ToolStream`, and inline date/system rendering.
- [x] Use the available chat width with a `760px` bubble cap.
- [x] User bubble: right, `18px` radius, `7px 13px`, `#f5f5f52e`.
- [x] Assistant bubble: left, `18px` radius, `7px 13px`, raised theme surface.
- [x] Remove per-message avatar/name/time.
- [x] Add date separators.
- [x] Add centered system events for model and effort changes.
- [x] Add hover message actions: copy.
- [x] Add more message actions (copy, conversation details, and a context menu).
- [ ] Add retry for failed replies.
- [x] Add code block copy.
- [x] Style tables as cards.
- [x] Add streaming caret/thinking indicator.
- [x] Add empty state.
- [x] Add “Tool stream view” setting.

### Phase 5 — Composer

- [x] Add one-line composer at `52px`, radius `999px`, with a single outer border.
- [x] Expand the composer with its content, radius `24px`.
- [x] Add plus menu: files, project, work mode, connections.
- [x] Add combined provider/model/effort pill.
- [x] Add send/stop circle.
- [x] Add attachment chips and drag/drop.
- [x] Move Chat/Work and effort into popovers.
- [x] Remove caption.
- [x] Add full keyboard menu behavior.

### Phase 6 — Modals and surfaces

- [x] Extend shared `Modal` primitive with surface classes.
- [x] Add `SettingsDialog` with left nav and search.
- [x] Add `ConnectionsDialog` with search/categories/cards.
- [x] Add `AgentDialog`, `GroupDialog`, `ScheduleDialog`, `ConversationDialog`, `SearchDialog`.
- [x] Add `AgentsDialog` and `SchedulesDialog` surfaces.
- [x] Use full-window Settings; retain modal Connections, Agents, and Scheduled surfaces.
- [x] Add Devices settings section with token create/rotate/revoke.
- [x] Add mobile modal behavior.
- [x] Move the remaining `ProviderCard` implementation out of `views.tsx` and delete the unused page views.

### Phase 7 — Side panel

- [x] Add `SidePanel` at `480px`.
- [x] Add Session, Sessions, Files, Terminal, Activity, and Approvals tabs.
- [x] Add approvals to the side panel.
- [x] Open from top pill and toolbar.
- [x] Add mobile overlay sheet.
- [x] Files tab with read-only project tree.
- [x] Terminal/activity detail.

### Phase 8 — Responsive and platform chrome

- [x] Add breakpoints 1180 / 860 / 640.
- [x] Add compact sidebar rail.
- [x] Add mobile drawer.
- [x] Add Android back button handling.
- [x] Add 16px mobile inputs.
- [ ] Add full safe-area/touch-target audit.
- [ ] Verify project selection on Android.
- [ ] Verify export/import in WebView.
- [x] Add Electron custom window chrome and drag regions.
- [ ] Verify Windows title bar on a Windows runtime.

### Phase 9 — Polish and accessibility

- [x] Replace low-contrast text tokens with Reason-derived values.
- [x] Keep focus-visible rings across interactive controls.
- [x] `aria-live` and `aria-busy` for streaming replies.
- [x] Native modal focus trap/restore.
- [x] Full arrow-key menu navigation.
- [x] Surface `run.error` in the conversation.
- [x] Failed tool activity error icon.
- [x] Empty/loading/error states for the main surfaces.
- [x] Reduced motion.
- [x] Tool-stream view setting.
- [x] Full keyboard shortcut coverage.

### Phase 10 — QA, docs, release

- [x] Visual regression at 5 widths × 2 themes.
- [x] Playwright smoke flows.
- [x] Playwright screenshot visual baselines.
- [x] Full Playwright E2E matrix.
- [x] Automated axe accessibility audit.
- [ ] Manual screen-reader and reduced-motion audit.
- [ ] Large-workspace performance check.
- [x] macOS packaged-app smoke checks.
- [ ] Windows and Android runtime smoke tests (paused).
- [x] Update README and validation docs.
- [x] Update third-party notices. `npm run build` writes `dist/THIRD_PARTY_NOTICES.txt` from the installed production dependencies.
- [ ] Tag release.

## 6. Testing strategy

- Visual: 1440×900, 1280×800, 1024×768, 768×1024, 390×844; dark/light.
- Functional: send, stream, stop, approvals, attachments, project, agents, agent groups, schedules, import/export, host pairing, offline, device tokens, Files/Terminal, keyboard flows.
- Accessibility: axe, keyboard-only, screen reader, reduced motion, contrast, actual browser zoom, and adversarial catalog data. The historical component baseline had 7 axe scans; scoped current results belong in validation.md.
- Current scope: macOS packaged app. Windows installer and Android APK are paused.

## 7. Risks

| Risk | Mitigation |
| --- | --- |
| Data migration breaks workspaces | Versioned migration, backups, import tests |
| Scope creep into cloud/billing | Explicit non-goals |
| Accessibility regression | Token contrast tests, axe, keyboard pass |
| Side panel requires backend APIs | Ship Session/Sessions/Activity first |
| Electron title bar differences | Test macOS/Windows early |
| Android back behavior | Capacitor App plugin; device test |
| Performance with full-state SSE | Lightweight message list; content-visibility |
| Legal/IP | Original CSS/code; no Reason assets/copy |

## 8. Definition of done

- [x] At 1280×800, the app reads as Reason-like: 280px sidebar, centered pill, flat chat surface, bubbles, wide one-line composer.
- [x] No brand header in sidebar; no topbar context title/project button.
- [x] Sidebar is agent/group-centric; conversations in side panel and plus menu.
- [x] Chat uses bubbles, date separators, centered system events, hover actions.
- [x] Composer is one row at rest with plus menu and combined model/effort pill.
- [x] Settings opens as a full-window page with modal focus handling; Connections opens as a modal.
- [x] Side panel provides Session, Sessions, Files, Terminal, Activity, and Approvals.
- [x] Dark/light themes use extracted tokens.
- [x] No cloud/billing/hosted connector UI.
- [x] Existing flows still work.
- [x] Earlier UI refinement: typecheck, 12 backend tests, production build, and macOS packaging passed at that stage; browser flows and ten light/dark references were checked.
- [x] Historical 18-component pass: 18 smoke, 10 visual, 7 axe, and 7 E2E tests passed at that stage; bot-avatar baselines were refreshed.
- [ ] modelOptions adversarial findings corrected and all fixtures rechecked.
- [ ] Latest source passes release suites and packaged macOS verification.
- [ ] Windows and Android smoke tests pass (paused).
