# Paused platforms and later product completion

Updated: 2026-11-05. [Active v1 path](../project-roadmap.md#recommended-execution-order) · [Every task's v1 decision](v1-triage.md) · [Current state](../current-state-review.md)

**Personal macOS v1 amendment:** WIN-001–006, AND-001–008, and FUT-001–006 are PAUSE. Existing cross-platform source/artifacts are historical and require native evidence before any support claim.

The tables retain original public R1/R2 targets, full acceptance criteria, and original dependencies for later work. Current implementation statuses are maintained here; v1 scope/effort is maintained only in the triage. A v1 subset can pass its support-matrix row without declaring the whole original task complete. Old M2/M3 continuation and broad feature gates do not govern the active path.

The [approved D-11 exception](../release-contract.md#d-11-benchmark-policy) permits CONTINUE correction/QA/packaging without new peer comparisons. Compatibility research, tests, real Codex checks, and actual Mac package evidence remain required. Deferred full-scope work retains applicable benchmarks on resumption. Owner labels remain suggested roles; Danial is the acting accountable owner.

## Windows

Original benchmark dependency: BEN-015. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| WIN-001 | Paused | P1 | To do | Product + Release | BEN-015, FND-001, REL-012 | **Reactivate and define Windows support.** Done when: Owner chooses supported Windows versions/architectures, package formats, permission model, runtime prerequisites, and a Windows verification environment. |
| WIN-002 | Paused | P1 | To do | Integrations | BEN-015, WIN-001, PVD-017, EFF-012, SKL-020 | **Verify Windows provider/process behavior.** Done when: Minimal PATH, npm/binary discovery, spaces/Unicode paths, process trees, credentials, workspaces, model-specific effort, skills paths/configuration, and interruption pass on real Windows. |
| WIN-003 | Paused | P1 | To do | Release | BEN-015, WIN-001 | **Finish Windows installer and portable behavior.** Done when: Install locations, per-user data, shortcuts, upgrades/uninstall, icons, title bar, and artifact identity pass on the supported Windows environment. |
| WIN-004 | Paused | P0 | To do | Host + Integrations | BEN-015, WIN-002, MCP-022, STT-018 | **Port secret/auth/app lifecycle support.** Done when: Windows secure storage, external browser callbacks, local MCP spawning, remote auth, tool policy, ElevenLabs key/microphone/device/lifecycle behavior, and disable/removal pass without macOS assumptions. |
| WIN-005 | Paused | P0 | To do | Release | BEN-015, WIN-003, WIN-004 | **Complete Windows signing and download trust.** Done when: Protected signing credentials, signed artifacts, SmartScreen/download behavior, checksums, and clean-machine installation are verified. |
| WIN-006 | Paused | P0 | To do | QA + Release | BEN-015, WIN-002, WIN-004, WIN-005 | **Accept and publish the Windows release.** Done when: Supported provider/app/core matrices and installer/portable smoke checks pass in Windows CI/device evidence before publication. |

## Android companion

Original benchmark dependency: BEN-016. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
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

Original benchmark dependency: BEN-017. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| FUT-001 | R2 | P2 | To do | Integrations + Host | BEN-017, PVD-001, MCP-017, MCP-018, HIL-006 | **Add provider-independent MCP tool execution.** Done when: A bounded model/tool loop, supported model dialects, schema/result conversion, approvals, cancellation, context limits, and real HTTP-model tool evidence exist. |
| FUT-002 | R2 | P2 | To do | Product + Host | BEN-017, COR-003, FND-003 | **Add editable conversation branches.** Done when: Editing/retry/branch lineage, provider session rebuilding, exports, deletion policy, and parallel branch behavior preserve history. |
| FUT-003 | R2 | P2 | To do | Product + Integrations | BEN-017, PVD-001, HTTP-006 | **Add usage and budget reporting.** Done when: Vendor-reported usage is attributed per run; missing usage and estimates are explicit; current pricing sources and optional limits are maintained. |
| FUT-004 | R2 | P2 | To do | Product + Host | BEN-017, FND-006, FND-007, MCP-016 | **Define and implement the selected team workflow.** Done when: Agent roles, delegation, task state, cancellation, approvals, tool scope, and durable results have an agreed product contract and evidence. |
| FUT-005 | Optional | P2 | To do | Product + Integrations | BEN-017, FND-004, REL-012 | **Specify native/browser-control scope.** Done when: A separately accepted spec covers runtime/extension architecture, granted permissions, session isolation, action review, packaging, and platform tests before implementation. |
| FUT-006 | Optional | P2 | To do | Product + Integrations | BEN-017, FND-004, REL-012 | **Specify later signed application updates.** Done when: A separately benchmarked update mechanism defines authenticity, signing/hosting ownership, staged delivery, rollback and acceptance tasks before being promised; required Speech-to-Text is owned by STT-001–018. |

## Gate

Windows/Android and later product gates do not block personal macOS v1. Resume only with explicit scope, applicable benchmarks, and native evidence; macOS results do not establish those platforms.
