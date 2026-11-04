# A Gent → Reason-style UI Roadmap

Status: in progress  
Branch: `ui/reason-style`  
Baseline commit: `chore: baseline before Reason-style UI`

## Current implementation status

Implemented in the first pass:

- `src/styles/tokens.css` — Reason-derived light/dark tokens.
- `src/styles/reason.css` — shell, sidebar, chat, composer, side panel, responsive rules.
- `src/app/Sidebar.tsx` — Reason-style sidebar with agent rows and account/connect-apps bottom area.
- `src/app/TopBar.tsx` — centered agent/session pill and side-panel toggle.
- `src/app/SidePanel.tsx` — Session, Sessions, and Activity tabs.
- `src/chat/MessageList.tsx` — bubbles, date separators, hover actions, approvals.
- `src/chat/ToolStream.tsx` — compact tool activity stream.
- `src/composer/Composer.tsx` — one-line composer, plus menu, combined model/effort pill.
- `src/App.tsx` — new shell composition; conversations moved out of the sidebar.
- `src/components.tsx` — `AgentGlyph` for solid-color agent icons.
- `src/dialogs/SettingsDialog.tsx` — Reason-style settings modal with left navigation and search.
- `src/dialogs/ConnectionsDialog.tsx` — Reason-style connections catalog with search, category tabs, provider cards, local apps, and host pairing.
- `src/dialogs/AgentsDialog.tsx` — agents grid modal.
- `src/dialogs/SchedulesDialog.tsx` — scheduled tasks modal.
- `src/app/SidebarRail.tsx` — compact icon rail when the sidebar is collapsed.
- Electron custom window chrome: macOS `hiddenInset`, Windows `titleBarOverlay`, drag/no-drag regions.
- Accessibility improvements: `aria-live` streaming replies, `aria-current` navigation, visible run errors, improved muted-text contrast through Reason tokens.
- Code-block copy buttons in Markdown replies.
- Centered model-change and reasoning-effort events in conversations.
- Tool stream setting: Compact / Verbose / Hidden.

Still pending from the roadmap: Files/Terminal tabs, full keyboard navigation, formal accessibility audit, and the full E2E matrix.

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

These values were extracted from Reason’s public CSS bundles and the running 0.1.119 app.

### Dark theme

| Token | Value |
| --- | --- |
| Page | `#121212` |
| Sidebar | `#0e0e0e` |
| Raised | `#1f1f1f` |
| Composer | `#1f1f1f` |
| Highlight | `#1f1f1f` |
| Ink | `#f5f5f5` |
| Text secondary | `#f5f5f5a8` |
| Text tertiary | `#f5f5f58a` |
| Border | `#f5f5f51a` |
| Strong border | `#f5f5f538` |
| Accent | `#4d9bff` |
| Brand blue | `#339cff` |
| Success | `#3fa266` |
| Danger | `#e34671` |
| Warning | `#f1b467` |
| User bubble | `#f5f5f52e` |
| Assistant bubble | `#f5f5f50a` |

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
| Text tertiary | `#1c1c1c9a` |
| Border | `#1c1c1c1f` |
| Strong border | `#1c1c1c3d` |
| Accent | `#0b6dd3` |

### Typography

- Text: Geist Variable.
- Mono: Geist Mono.
- Base: `14px`.
- Micro: `12px`.
- Body weight: `400` / `420`.
- Medium: `500`; semibold: `600`.
- Chat message: `14px`, line-height `20–24px`.
- Headings: `17–22px`.
- Letter spacing: mostly `0`, occasional `-.02em` to `-.035em`.

### Layout

| Token | Value |
| --- | --- |
| Sidebar width | `280px` |
| App shell grid | `248px minmax(0,1fr)` |
| Detail panel | `480px` |
| Reading width | `960px` |
| Composer width | `700px` / `640px` |
| Bubble max width | `486px` / `560px` |
| Row unit | `30px` |
| Row radius | `8px` |
| Inset panel radius | `16px` |
| Inset panel gap | `6px` |

### Component dimensions

| Component | Value |
| --- | --- |
| Header pill | `40px` high, radius `9999px`, padding `7.5px 13.5px 7.5px 7.5px`, font `14px/20px`, weight `500` |
| Composer one-line | `46px` high, radius `999px`, padding `6px` |
| Composer expanded | `99px` min-height, radius `24px`, padding `18px 12px 10px 24px` |
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
| D4 | Settings/Connections: modals or pages? | Modals |
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
- [ ] Add Geist Mono if needed.
- [x] Verify theme switching and build.

### Phase 2 — App shell and top bar

- [x] Add `AppShell` grid: sidebar / main / optional side panel.
- [x] Add inset chat panel with `16px` radius and `6px` gap.
- [x] Add `TopBar` with centered agent/session pill.
- [x] Remove topbar context title and project button.
- [x] Add sidebar top action row: collapse, search, new.
- [ ] Add compact rail state for collapsed sidebar.
- [ ] Add Electron custom chrome: macOS `hiddenInset`, Windows `titleBarOverlay`.
- [ ] Add drag/no-drag regions.

### Phase 3 — Sidebar information architecture

- [x] Remove large brand header.
- [x] Add compact home row.
- [x] Add agent rows with solid color icons.
- [x] Add agent groups or “Agents / Unassigned”.
- [x] Move conversations out of the sidebar.
- [x] Add bottom account menu.
- [x] Add “Connect apps” pill.
- [x] Move All agents / Scheduled / Connections / Settings into menus.
- [x] Add global search trigger.

### Phase 4 — Chat surface

- [x] Add `MessageList`, `ToolStream`, and inline date/system rendering.
- [x] Narrow reading column; use `486px` bubble max.
- [x] User bubble: right, `18px` radius, `7px 13px`, `#f5f5f52e`.
- [x] Assistant bubble: left, `18px` radius, `7px 13px`, `#f5f5f50a`.
- [x] Remove per-message avatar/name/time.
- [x] Add date separators.
- [x] Add centered system events for model and effort changes.
- [x] Add hover message actions: copy.
- [ ] Add retry/more message actions.
- [x] Add code block copy.
- [x] Style tables as cards.
- [x] Add streaming caret/thinking indicator.
- [x] Add empty state.
- [x] Add “Tool stream view” setting.

### Phase 5 — Composer

- [x] Add one-line composer at `46px`, radius `999px`.
- [x] Add expanded composer at `99px`, radius `24px`.
- [x] Add plus menu: files, project, work mode, connections.
- [x] Add combined provider/model/effort pill.
- [x] Add send/stop circle.
- [x] Add attachment chips and drag/drop.
- [x] Move Chat/Work and effort into popovers.
- [x] Remove caption.
- [ ] Add full keyboard menu behavior.

### Phase 6 — Modals and surfaces

- [x] Extend shared `Modal` primitive with surface classes.
- [x] Add `SettingsDialog` with left nav and search.
- [x] Add `ConnectionsDialog` with search/categories/cards.
- [x] Add `AgentDialog`, `GroupDialog`, `ScheduleDialog`, `ConversationDialog`, `SearchDialog`.
- [x] Add `AgentsDialog` and `SchedulesDialog` surfaces.
- [x] Move Settings, Connections, Agents, and Scheduled out of full-page views.
- [x] Add Devices settings section with token create/rotate/revoke.
- [x] Add mobile modal behavior.
- [ ] Move the remaining `ProviderCard` implementation out of `views.tsx` and delete the unused page views.

### Phase 7 — Side panel

- [x] Add `SidePanel` at `480px`.
- [x] Add Session, Sessions, Activity tabs.
- [x] Add approvals to the side panel.
- [x] Open from top pill and toolbar.
- [x] Add mobile overlay sheet.
- [ ] v1.1: Files tab with read-only project tree.
- [ ] v1.1: Terminal/activity detail.

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
- [ ] Full arrow-key menu navigation.
- [x] Surface `run.error` in the conversation.
- [x] Failed tool activity error icon.
- [x] Empty/loading/error states for the main surfaces.
- [x] Reduced motion.
- [x] Tool-stream view setting.
- [ ] Full keyboard shortcut coverage.

### Phase 10 — QA, docs, release

- [x] Visual regression at 5 widths × 2 themes.
- [x] Playwright smoke flows.
- [x] Playwright screenshot visual baselines.
- [ ] Full Playwright E2E matrix.
- [ ] Accessibility audit.
- [ ] Performance check.
- [ ] macOS, Windows, Android smoke tests.
- [ ] Update README and validation docs.
- [ ] Update third-party notices.
- [ ] Tag release.

## 6. Testing strategy

- Visual: 1440×900, 1280×800, 1024×768, 768×1024, 390×844; dark/light.
- Functional: send, stream, stop, approvals, attachments, project, agents, groups, schedules, import/export, host pairing, offline.
- Accessibility: axe, keyboard-only, screen reader, reduced motion, contrast.
- Cross-platform: macOS packaged app, Windows installer, Android APK.

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

- [ ] At 1280×800, the app reads as Reason-like: 280px sidebar, centered pill, inset chat panel, bubbles, one-line composer.
- [ ] No brand header in sidebar; no topbar context title/project button.
- [ ] Sidebar is agent/group-centric; conversations in side panel and plus menu.
- [ ] Chat uses bubbles, date separators, centered system events, hover actions.
- [ ] Composer is one row at rest with plus menu and combined model/effort pill.
- [x] Settings and Connections open as modals.
- [ ] Side panel provides Session, Sessions, Activity; Files/Terminal in v1.1.
- [x] Dark/light themes use extracted tokens.
- [ ] No cloud/billing/hosted connector UI.
- [ ] Existing flows still work.
- [ ] Typecheck, tests, build, E2E, visual, accessibility, and cross-platform smoke tests pass.
