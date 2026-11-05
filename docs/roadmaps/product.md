# Core product and UI completion

Updated: 2026-11-05. [Active v1 path](../project-roadmap.md#recommended-execution-order) · [Every task's v1 decision](v1-triage.md) · [Current state](../current-state-review.md)

**Personal macOS v1 amendment:** The triage selects core onboarding/defaults/drafts/streaming/recovery/import-export and retained UI checks. Schedules, uploads/content expansion, regenerate, broad mobile/reflow work, notifications, and speech/skills/custom reasoning are paused.

The tables retain original public R1/R2 targets, full acceptance criteria, and original dependencies for later work. Current implementation statuses are maintained here; v1 scope/effort is maintained only in the triage. A v1 subset can pass its support-matrix row without declaring the whole original task complete. Old M2/M3 continuation and broad feature gates do not govern the active path.

The [approved D-11 exception](../release-contract.md#d-11-benchmark-policy) permits CONTINUE correction/QA/packaging without new peer comparisons. Compatibility research, tests, real Codex checks, and actual Mac package evidence remain required. Deferred full-scope work retains applicable benchmarks on resumption. Owner labels remain suggested roles; Danial is the acting accountable owner.

## Core workflows

Original benchmark dependency: BEN-011. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| COR-001 | R1 | P1 | To do | Product + UI | BEN-011, FND-001, PVD-005, APP-006 | **Complete first-run onboarding.** Done when: Fresh installs explain local host/data, detect prerequisites, connect a provider, send a first message, and offer app, ElevenLabs speech, and skill setup with working recovery and accurate prerequisites. |
| COR-002 | R1 | P1 | To do | UI + Host | BEN-011, PVD-012, EFF-008, SKL-012 | **Finish Settings and agent/chat defaults.** Done when: Default model editing, settings persistence, agent customization, and chat-specific overrides follow the agreed scope and recover failed saves. |
| COR-003 | R1 | P1 | To do | UI + Host | BEN-011, FND-006, FND-007 | **Add retry/regenerate for failed or completed replies.** Done when: Retry creates a deliberate new attempt with correct history, attachment/model context, visible provenance, and no duplicated user submission. |
| COR-004 | R1 | P1 | To do | UI | BEN-011, FND-008 | **Preserve drafts and attachment intent.** Done when: Switching chats, failed sends, reconnect, app restart, and recovery cannot silently discard the user's unsent work. |
| COR-005 | R1 | P0 | To do | Host + UI | BEN-011, FND-005, FND-006 | **Harden streaming and offline recovery.** Done when: Disconnect/reconnect resynchronizes state and runs, handles valid SSE framing, avoids duplicated deltas, and displays offline/stale state accurately. |
| COR-006 | R1 | P0 | To do | Host | BEN-011, FND-006, FND-008, FND-009 | **Recover interrupted work after a crash.** Done when: Persisted streaming messages and pending interactions reconcile to a safe state; abandoned runs never appear indefinitely active or replay external effects. |
| COR-007 | R1 | P1 | To do | Host + Product | BEN-011, FND-006, FND-008 | **Complete one-time scheduling semantics.** Done when: Timezone/DST, sleep/wake, missed due time, disabled agents, concurrent runs, and closed-host behavior are defined and tested for one execution. |
| COR-008 | R1 | P1 | To do | UI + Host | BEN-011, COR-007, FND-011 | **Expose task/run history and failure recovery.** Done when: Scheduled and manual runs show destination chat, outcome, interruption/failure, retry action, and accessible in-app completion/approval notices. |
| COR-009 | R1 | P0 | To do | Host + UI | BEN-011, FND-003, FND-008, PVD-011 | **Finish workspace import/export recovery.** Done when: Round trips preserve allowed data; secrets/thread bindings stay excluded; duplicate IDs, invalid references, size limits, merge conflicts, and interrupted writes have evidence. |
| COR-010 | R2 | P2 | To do | Product + Host | BEN-011, COR-009 | **Complete archive, restore, and deletion policy.** Done when: Chats and agents have consistent discoverability, recovery/retention, deletion effects, active-run handling, and export behavior. |
| COR-011 | R1 | P1 | To do | Host + UI | BEN-011, HTTP-003, PVD-011 | **Unify text attachment validation.** Done when: Frontend/backend share file-count, byte/character, name, MIME, encoding, and total-request limits; invalid/binary files produce useful errors. |
| COR-012 | R2 | P2 | To do | Integrations + UI | BEN-011, PVD-001, COR-011 | **Add image/PDF/binary attachment support.** Done when: Storage, preview/extraction, provider capabilities, size limits, cleanup, export, and an end-to-end supported-provider flow are implemented before exposing uploads. |
| COR-013 | R2 | P2 | To do | Product + UI | BEN-011, FND-004, FND-008 | **Complete project file and diff workflows.** Done when: Safe workspace boundaries, refresh, truncation, diff inspection, and any chosen write/revert behavior are implemented and tested. |
| COR-014 | R2 | P2 | To do | Host + Product | BEN-011, COR-007, COR-008 | **Add recurring schedules.** Done when: Recurrence/timezone editing, missed-run policy, deduplication, retry history, cancellation, and closed-host limitations are explicit. |

## Interface and accessibility

Original benchmark dependency: BEN-012. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| UX-001 | R1 | P1 | To do | UI + Product | BEN-012, COR-001, COR-002, APP-012, STT-012, SKL-018, EFF-009 | **Audit every visible action for a complete workflow.** Done when: No advertised control ends at a placeholder, misleading success, unsupported prompt, or unexplained disabled state; each has acceptance evidence. |
| UX-002 | R1 | P1 | To do | UI | BEN-012, PVD-009, PVD-010, APP-011, EFF-008, STT-012, SKL-012 | **Finish component integration and edge states.** Done when: Preserve the reference design and branding; long/blank data, forms, notifications, overlays, and confirmations behave consistently across real screens. |
| UX-003 | R1 | P0 | To do | QA + UI | BEN-012, UX-001, HIL-006 | **Perform manual accessibility acceptance.** Done when: VoiceOver, keyboard/focus return, labels, announcements, modal/interaction nesting, errors, and approval paths are reviewed and actionable findings closed. |
| UX-004 | R1 | P1 | To do | QA + UI | BEN-012, UX-002 | **Verify motion and performance preferences.** Done when: Reduced-motion changes apply live to all UI/canvas surfaces; frequent utility interactions remain immediate and no essential feedback depends on animation. |
| UX-005 | R1 | P1 | To do | QA + UI | BEN-012, UX-002, APP-011 | **Run real reflow and input checks.** Done when: Actual 200% browser zoom, large text, forced colors, RTL, 320px, wide desktop, touch targets, and viewport/keyboard changes pass on applicable surfaces. |
| UX-006 | R1 | P1 | To do | UI | BEN-012, COR-005, PVD-015, APP-006, STT-005, SKL-012, EFF-009 | **Complete recovery and offline product copy.** Done when: Lost host, revoked token, no runtime, unavailable model/app, cancelled auth, and stale state offer accurate next steps without erasing drafts. |
| UX-007 | R1 | P1 | To do | UI + Host | BEN-012, FND-004 | **Replace unsupported browser folder prompts.** Done when: Native Mac selection and browser host-path entry use supported accessible controls with validation, cancellation, and remote-host context. |
| UX-008 | R2 | P2 | To do | Product + Release | BEN-012, COR-008 | **Add optional native notifications.** Done when: Permission requests, quiet preferences, click-through, sensitive-content policy, and app background/foreground behavior are tested on each supported platform. |

## Gate

Personal v1 accepts only the contract's text/project/data/recovery subset. COR-001/002 and UX-001/002/003/006/007 do not depend on finishing APP/STT/SKL/EFF or browser/mobile redesign. Preserve broader original criteria as unfinished work; gate unsupported visible controls.
