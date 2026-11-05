# Quality, packaging, and release

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Current state](../current-state-review.md)

The earlier test counts and installer checks are historical. This board requires evidence for a new candidate after provider, app, and product corrections. The workflow file currently builds Windows and Android unconditionally; QA-010 reconciles CI with the active scope.

R1 evidence includes [ElevenLabs speech](speech-to-text.md), [model-specific reasoning](reasoning-effort.md), and [skills](skills.md). QA and packaging have their own benchmark prerequisites; final QA signoff depends on all three feature gates, including real-service/runtime and signed-package checks.

Task status is **To do** until its evidence is accepted. Owners are suggested roles, not assigned people. Targets: R1 first public macOS release; R2 subsequent product completion; Paused/Optional requires a scope decision. Priority, status, and dependency rules are in the master roadmap.

## Quality and verification

Development gate: **BEN-013** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
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

Development gate: **BEN-014** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
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

REL-012 can close only for the actual approved artifact set. A successful source build, fake-provider suite, or ad-hoc local package is insufficient evidence for public distribution.
