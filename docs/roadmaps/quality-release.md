# Quality, packaging, and release

Updated: 2026-11-05. [Active v1 path](../project-roadmap.md#recommended-execution-order) · [Every task's v1 decision](v1-triage.md) · [Current state](../current-state-review.md)

**Personal macOS v1 amendment:** Retained source/runtime/data/accessibility tests and actual Mac packaging/pilot are CONTINUE. Fleet-scale budgets, signing/notarization, public terms/publication infrastructure, and public publication are PAUSE.

The tables retain original public R1/R2 targets, full acceptance criteria, and original dependencies for later work. Current implementation statuses are maintained here; v1 scope/effort is maintained only in the triage. A v1 subset can pass its support-matrix row without declaring the whole original task complete. Old M2/M3 continuation and broad feature gates do not govern the active path.

The [approved D-11 exception](../release-contract.md#d-11-benchmark-policy) permits CONTINUE correction/QA/packaging without new peer comparisons. Compatibility research, tests, real Codex checks, and actual Mac package evidence remain required. Deferred full-scope work retains applicable benchmarks on resumption. Owner labels remain suggested roles; Danial is the acting accountable owner.

## Quality and verification

Original benchmark dependency: BEN-013. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

QA-001 now uses the [personal-v1 acceptance matrix](../support-matrix.md). Its scope is documented; candidate acceptance remains open. BEN-013 peer research and paused feature gates are not personal-v1 prerequisites.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| QA-001 | R1 | P0 | To do | QA | BEN-013, FND-001, FND-002 | **Create the release acceptance matrix.** Done when: Every advertised provider, transport, auth flow, model-specific effort mode, ElevenLabs speech and skill journey, platform, and negative state maps to an owner, test, and evidence location. |
| QA-002 | R1 | P1 | To do | QA + Host | BEN-013, FND-011 | **Set and measure performance budgets.** Done when: Agree startup, stream latency, memory, catalog, 500-agent/5,000-chat, and slow-SSE-client budgets; publish measured baselines before pass/fail targets. |
| QA-003 | R1 | P0 | To do | QA | BEN-013, PVD-016, MCP-021, STT-015, SKL-016, EFF-010 | **Expand meaningful unit/contract tests.** Done when: Catalog defects, sessions, authorities, secrets, transport framing, schema/version differences, cancellation, and interaction races have regression coverage. |
| QA-004 | R1 | P0 | To do | QA + Host | BEN-013, FND-005, OPC-002, FND-007 | **Reproduce and close the earlier backend findings.** Done when: Revoked SSE streams stop, SIGTERM-resistant OpenCode children terminate, and provider switching preserves isolated sessions; saved tests demonstrate closure. |
| QA-005 | R1 | P0 | To do | QA | BEN-013, PVD-017, MCP-022, COR-009, STT-016, SKL-019, EFF-011 | **Add full provider and app workflow tests.** Done when: Provider/app connect/auth → configure → use → recover → restart → remove, speech → reviewed transcript → selected Agent, and skill create/import → enable → use → edit → disable/remove are exercised with model-specific effort and failure evidence. |
| QA-006 | R1 | P1 | To do | QA + UI | BEN-013, UX-002, APP-011, STT-012, SKL-018, EFF-009 | **Refresh reviewed visual baselines.** Done when: All changed ordinary/adversarial states and widths/themes are reviewed; intentional changes have matching screenshots and provenance. |
| QA-007 | R1 | P0 | To do | QA | BEN-013, UX-003, UX-004, UX-005 | **Complete automated and manual accessibility evidence.** Done when: Axe includes new connection/auth/interaction states; VoiceOver and actual zoom outcomes are recorded separately from automated pass counts. |
| QA-008 | R1 | P0 | To do | QA + Integrations | BEN-013, QA-001, PVD-017, MCP-022, STT-016, SKL-019, EFF-011 | **Run controlled real-integration smoke checks.** Done when: Supported accounts/endpoints/connectors, distinct model effort sets, ElevenLabs transcription, and native skill use have dated authorized evidence; fixtures run by default and real calls use separate explicit credentials/budgets. |
| QA-009 | R1 | P0 | To do | QA + Host | BEN-013, FND-008, COR-006, COR-007, COR-009, STT-011, SKL-016, EFF-005 | **Exercise destructive failure and recovery scenarios.** Done when: Crash/write failure, corrupt primary/backup, sleep, network drop, revoked access, import failure, and interrupted shutdown recover without hidden duplicate work. |
| QA-010 | R1 | P0 | To do | QA + Release | BEN-013, REL-001, QA-003, QA-005, QA-006, QA-007 | **Align CI with the active platform scope.** Done when: macOS R1 suites gate changes; paused Windows/Android jobs are explicit opt-ins; pinned tooling, artifact reports, concurrency, and failed-test evidence work. |
| QA-011 | R1 | P0 | To do | QA + Release | BEN-013, REL-005, FND-011, STT-006, SKL-007 | **Audit package and diagnostic data boundaries.** Done when: Fixtures, workspace/token files, raw credentials, absolute developer paths, unrelated private data, and unsafe external navigation do not leak into distributed artifacts/log bundles. |
| QA-012 | R1 | P0 | To do | QA + Product | BEN-013, QA-002, QA-004, QA-008, QA-009, QA-010, QA-011, STT-018, SKL-020, EFF-012 | **Sign off the release candidate evidence.** Done when: Every other pre-publication R1 task has accepted evidence; the publication step is ready for owner approval; no unresolved P0/P1 is hidden by old pass counts. |

## macOS distribution

Original benchmark dependency: BEN-014. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| REL-001 | R1 | P0 | To do | Release | BEN-014, FND-001, FND-002 | **Make release builds reproducible.** Done when: A clean checkout uses the lockfile and supported Node/Electron/CLI versions; build prerequisites and expected output are documented. |
| REL-002 | R1 | P1 | To do | Release + Host | BEN-014, REL-001 | **Centralize release identity and version metadata.** Done when: Package, app-server client, API health, About, bundle identifiers, artifact names, and release notes agree for active artifacts. |
| REL-003 | R1 | P0 | To do | Release | BEN-014, FND-001, REL-001, STT-007 | **Finalize macOS package and architecture settings.** Done when: arm64/universal choice, minimum OS, entitlements, microphone usage-purpose text and capture permission settings, hardened runtime, icons, bundle identity, and writable user-data placement match the supported release. |
| REL-004 | R1 | P0 | To do | Release | BEN-014, REL-003 | **Provision signing and notarization.** Done when: The release owner supplies protected Apple credentials; signed/notarized/stapled artifacts verify without disabling Gatekeeper. |
| REL-005 | R1 | P0 | To do | Release + QA | BEN-014, REL-002, REL-003 | **Verify packaged contents and generated notices.** Done when: Distributed JS/CSS match the candidate source; dev harnesses/private workspace data are excluded; required dependency/font notices are present and reviewed. |
| REL-006 | R1 | P0 | To do | QA + Release | BEN-014, REL-005, FND-008 | **Test first install, upgrade, and uninstall data behavior.** Done when: Fresh and existing workspaces, credential references, migrations/backups, lock contention, quit/relaunch, and documented retention behave correctly. |
| REL-007 | R1 | P0 | To do | QA + Release | BEN-014, REL-004, REL-006, STT-017, SKL-019, EFF-011 | **Run a clean-Mac installation test.** Done when: Downloaded/quarantined DMG/ZIP installs and opens on the supported clean environment; provider and one app lifecycle, model-specific effort, speech capture/Send, and skill management/use work from the packaged app. |
| REL-008 | R1 | P1 | To do | Release + Product | BEN-014, REL-005 | **Finish release documentation and support material.** Done when: Install/setup, provider/app/skill/effort support matrix, ElevenLabs setup and microphone/language limits, prerequisites, auth/audio/skill data behavior, troubleshooting, limitations, release notes, and rollback instructions match the candidate. |
| REL-009 | R1 | P0 | To do | Product + Release | BEN-014, FND-001, REL-005 | **Finalize license, privacy, and distribution requirements.** Done when: Owner-approved project terms/privacy and dependency attribution describe actual model, MCP, speech/audio/transcript, and skill-source data flows and retention; signing, hosting, and support ownership are recorded. |
| REL-010 | R1 | P1 | To do | Release | BEN-014, QA-010, REL-004 | **Separate build, signing, and publication permissions.** Done when: CI secrets and publication rights are restricted to the release path; ordinary tests cannot publish or expose signing/connector credentials. |
| REL-011 | R1 | P1 | To do | Product + QA | BEN-014, REL-007, REL-008 | **Run a small candidate pilot and triage.** Done when: Pilot issues have reproducible records and priorities; diagnostics are user-controlled/redacted; release blockers return to their task owner. |
| REL-012 | R1 | P0 | To do | Release + Product | BEN-014, QA-012, REL-007, REL-008, REL-009, REL-010, REL-011 | **Publish the approved first release.** Done when: A concrete reviewed candidate, tag/commit, signed assets, checksums, notes, download destination, support path, and rollback package are approved and then published. |

## Gate

QA-012 personal signoff follows the active support matrix and V1-08, not every old R1 task. REL-007 uses the actual personal Mac candidate without REL-004/STT-017/SKL-019/EFF-011 as prerequisites. Public REL-012 remains paused; signing/notarization and public approval gates are retained for later distribution.
