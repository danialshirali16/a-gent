# Paused platforms and later product completion

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Current state](../current-state-review.md)

Windows and Android remain paused under the existing macOS-first scope. Their tasks are preserved as part of the original project vision. R2/Optional tasks require a deliberate scope decision and do not become complete when R1 ships.

When resumed, native platforms must benchmark and verify their own [speech capture](speech-to-text.md), [model-specific reasoning controls](reasoning-effort.md), and [skills behavior](skills.md). Speech-to-Text is required in R1; FUT-006 now covers only later signed updates. BEN-017 requires a distinct comparison for each future scope before its development.

Task status is **To do** until its evidence is accepted. Owners are suggested roles, not assigned people. Targets: R1 first public macOS release; R2 subsequent product completion; Paused/Optional requires a scope decision. Priority, status, and dependency rules are in the master roadmap.

## Windows

Development gate: **BEN-015** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| WIN-001 | Paused | P1 | To do | Product + Release | BEN-015, FND-001, REL-012 | **Reactivate and define Windows support.** Done when: Owner chooses supported Windows versions/architectures, package formats, permission model, runtime prerequisites, and a Windows verification environment. |
| WIN-002 | Paused | P1 | To do | Integrations | BEN-015, WIN-001, PVD-017, EFF-012, SKL-020 | **Verify Windows provider/process behavior.** Done when: Minimal PATH, npm/binary discovery, spaces/Unicode paths, process trees, credentials, workspaces, model-specific effort, skills paths/configuration, and interruption pass on real Windows. |
| WIN-003 | Paused | P1 | To do | Release | BEN-015, WIN-001 | **Finish Windows installer and portable behavior.** Done when: Install locations, per-user data, shortcuts, upgrades/uninstall, icons, title bar, and artifact identity pass on the supported Windows environment. |
| WIN-004 | Paused | P0 | To do | Host + Integrations | BEN-015, WIN-002, MCP-022, STT-018 | **Port secret/auth/app lifecycle support.** Done when: Windows secure storage, external browser callbacks, local MCP spawning, remote auth, tool policy, ElevenLabs key/microphone/device/lifecycle behavior, and disable/removal pass without macOS assumptions. |
| WIN-005 | Paused | P0 | To do | Release | BEN-015, WIN-003, WIN-004 | **Complete Windows signing and download trust.** Done when: Protected signing credentials, signed artifacts, SmartScreen/download behavior, checksums, and clean-machine installation are verified. |
| WIN-006 | Paused | P0 | To do | QA + Release | BEN-015, WIN-002, WIN-004, WIN-005 | **Accept and publish the Windows release.** Done when: Supported provider/app/core matrices and installer/portable smoke checks pass in Windows CI/device evidence before publication. |

## Android companion

Development gate: **BEN-016** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| AND-001 | Paused | P1 | To do | Product + Release | BEN-016, FND-001, REL-012 | **Reactivate the Android companion contract.** Done when: Host ownership, supported Android/API/device range, HTTPS requirements, feature scope, and distribution channel are agreed. |
| AND-002 | Paused | P0 | To do | Host + Mobile | BEN-016, AND-001, FND-004 | **Persist pairing credentials securely.** Done when: Device tokens use the chosen Android secure storage; logout/revocation/rotation, backup policy, reinstall, and locked-device behavior pass. |
| AND-003 | Paused | P0 | To do | Mobile + Host | BEN-016, AND-002, COR-005 | **Finish HTTPS host pairing and recovery.** Done when: Trusted host selection, origin/CORS policy, bad certificates, expired/revoked tokens, host switching, and offline retry have safe useful flows. |
| AND-004 | Paused | P1 | To do | Mobile + QA | BEN-016, AND-003, STT-018, EFF-012, SKL-020 | **Verify native mobile layout/input behavior.** Done when: Physical-device keyboard, safe areas, back navigation, rotation, touch, selection, clipboard, large text, model-specific effort/skill management, microphone permission/capture/cleanup, and screen-reader flows pass. |
| AND-005 | Paused | P1 | To do | Mobile | BEN-016, AND-003, COR-009, COR-011 | **Complete WebView file and export workflows.** Done when: Native picking, permissions, URI/encoding, file limits, export/download, import recovery, and provider attachment support pass on device. |
| AND-006 | Paused | P0 | To do | Mobile + Host | BEN-016, AND-003, COR-006, COR-007 | **Recover streams/runs across app lifecycle.** Done when: Background/foreground, network transitions, host sleep, repeated reconnect, schedules, notifications policy, and no duplicate submission are verified. |
| AND-007 | Paused | P0 | To do | Mobile + Integrations | BEN-016, AND-003, MCP-022 | **Verify remote app authorization and tool control.** Done when: Phone/browser/host callbacks reach the correct session; approvals/Stop and app access work without treating phone loopback as the desktop host. |
| AND-008 | Paused | P0 | To do | QA + Release | BEN-016, AND-004, AND-005, AND-006, AND-007 | **Ship a verified Android package.** Done when: Release signing, package identity, supported-device matrix, clean install/upgrade, privacy material, and approved APK/AAB distribution replace debug-only delivery. |

## Later integrations and parity

Development gate: **BEN-017** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| FUT-001 | R2 | P2 | To do | Integrations + Host | BEN-017, PVD-001, MCP-017, MCP-018, HIL-006 | **Add provider-independent MCP tool execution.** Done when: A bounded model/tool loop, supported model dialects, schema/result conversion, approvals, cancellation, context limits, and real HTTP-model tool evidence exist. |
| FUT-002 | R2 | P2 | To do | Product + Host | BEN-017, COR-003, FND-003 | **Add editable conversation branches.** Done when: Editing/retry/branch lineage, provider session rebuilding, exports, deletion policy, and parallel branch behavior preserve history. |
| FUT-003 | R2 | P2 | To do | Product + Integrations | BEN-017, PVD-001, HTTP-006 | **Add usage and budget reporting.** Done when: Vendor-reported usage is attributed per run; missing usage and estimates are explicit; current pricing sources and optional limits are maintained. |
| FUT-004 | R2 | P2 | To do | Product + Host | BEN-017, FND-006, FND-007, MCP-016 | **Define and implement the selected team workflow.** Done when: Agent roles, delegation, task state, cancellation, approvals, tool scope, and durable results have an agreed product contract and evidence. |
| FUT-005 | Optional | P2 | To do | Product + Integrations | BEN-017, FND-004, REL-012 | **Specify native/browser-control scope.** Done when: A separately accepted spec covers runtime/extension architecture, granted permissions, session isolation, action review, packaging, and platform tests before implementation. |
| FUT-006 | Optional | P2 | To do | Product + Integrations | BEN-017, FND-004, REL-012 | **Specify later signed application updates.** Done when: A separately benchmarked update mechanism defines authenticity, signing/hosting ownership, staged delivery, rollback and acceptance tasks before being promised; required Speech-to-Text is owned by STT-001–018. |

## Gate

WIN-006 and AND-008 close only with native-platform evidence and approved release assets. If cross-platform delivery becomes a first-release requirement, promote these tasks and recompute the master release gate before scheduling.
