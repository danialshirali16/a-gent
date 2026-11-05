# Personal macOS v1.0 acceptance matrix

Updated: 2026-11-05. This is the active QA-001 matrix for the owner-approved [contract](release-contract.md) and [roadmap](project-roadmap.md#recommended-execution-order). **No row is accepted for a current packaged candidate yet.** Recording this matrix satisfies scope documentation only.

The [previous public R1 matrix](archive/support-matrix-public-r1-2026-11-05.md) preserves its broader promises. Deferred STT/skills/MCP/OpenCode/reasoning/signing gates do not block personal v1. The D-11 exception waives new peer benchmarking, not verification.

## Required candidate coverage

Evidence must identify source/artifact, command/scenario, runtime/version, OS/chip, result, and remaining limits in [validation](validation.md). “Source exists” and historical passes are not candidate acceptance.

| Surface | Required result | Owner | Existing test/evidence starting point | Current evidence / gap | Phase |
| --- | --- | --- | --- | --- | --- |
| Clean dependencies/build | Lockfile installation, typecheck, production build and normal tests execute; release blockers corrected. | Host + Release | package.json; tests/server; tests/ui; scripts/build.mjs | npm blocked by registry 403 on audit Linux host; standard checks unverified. | V1-02/06 |
| Codex discovery/compatibility | Finder PATH and supported CLI/schema work; absent/incompatible runtime gives useful install/upgrade guidance and recheck. | Integrations | server/codex-discovery.ts; scripts/runtime-baseline.mjs; backend discovery cases | Discovery exists; startup compatibility enforcement incomplete. Audit CLI is an alpha/schema-drift variant. | V1-02/05 |
| Codex external sign-in | Signed-out/expired account and account changes recover through documented CLI login; never copy CLI credentials. | Integrations + UI | server/codex.ts; provider fixtures; historical real smoke | Managed login deferred; current account-bound session handling needs evidence. | V1-04/05/06 |
| Runtime/feature gating | UI/API use Codex only, default reasoning, and one active run; preserve saved records and reject unsupported paths. | Host + UI | server/providers.ts; server/runs.ts; shared/providers.ts; src/App.tsx | Target only; source still exposes other providers/custom controls and permits runs in different chats. | V1-03 |
| Inherited runtime tools | Native local-work policy is enforced; external MCP/skill capabilities cannot silently widen access; global config is preserved. | Integrations | Codex baseline/schema; config/session capability inspection | Required compatibility/policy verification; hiding Connect Apps is insufficient. | V1-03/06 |
| First run | Auto-paired desktop and fresh workspace reach one real reply; setup errors provide a working next action. | UI + Host | electron/main.cjs; ProviderCard; smoke/e2e | Components exist; complete package journey missing. | V1-05/08 |
| Model identity/default scope | Valid choices, collision labels, Unicode search, bounded exact IDs, chat overrides, and rollback all agree with dispatch. | Host + UI | provider-contract/model-options tests; picker harness | Normalization/search tests pass supplementally; scroll/count/saved-ID and UI evidence remain. | V1-04/05/06 |
| Streaming/continuation | Replies stream once, settle correctly, and continue the correct persisted chat; no cross-chat or stale event reuse. | Host + UI | backend/smoke/e2e; session-binding tests | Historical real Codex smoke; current complete journey pending. | V1-04/06/08 |
| Save failure/run reservation | Failed initial persistence releases reservation and preserves recoverable user intent; retry is not permanently 409. | Host | server/runs.ts; persistence fixtures plus new run-level regression | Audit reproduced stranded running state. | V1-04 |
| Forget/recheck | Disconnect invalidates older probes; late results cannot restore forgotten readiness. | Host + UI | server/providers.ts; provider fixtures plus new generation regression | Audit reproduced configured → ready after a stale probe. | V1-04 |
| Stop/shutdown | “Stopping” remains truthful until actual termination; no later effects or duplicate run; next send works only after cleanup. | Host + UI | run lifecycle/backend fixtures; actual Codex process checks | Backend reservation exists; UI settles early. OpenCode error child leak is deferred but remains recorded. | V1-04/06/08 |
| Project folder/Chat/Work | Native selection validates a real folder; Chat is read-only; Work uses selected root and native sandbox policy. | Desktop + Host | electron/preload.cjs; runs.ts; backend files/e2e | Source and historical work write exist; actual candidate pending. | V1-05/06/08 |
| Approvals/native questions | Correct host/run/chat/request; genuine approve/decline/answer; no fabricated response; settle once on Stop/expiry/restart. | Host + UI | HIL/backend fixtures; smoke approval race; real permission scenario | Correlation/questions exist; full real approval/recovery gate open. | V1-04/06/08 |
| Drafts/failed sends | Navigation, failed send/save, reconnect, and restart preserve the correct chat draft without duplicate submission. | UI + Host | COR-004/005; new recovery scenarios | Current selection handlers clear drafts; durable drafts absent. | V1-05/06 |
| Stream/restart recovery | Resync snapshot/events without missing/duplicated content; runtime exit, revoked token and offline states give usable recovery. | Host + UI | useWorkspace/api; backend device/stream cases | Existing retry logic is partial; ordering/refresh races require acceptance. | V1-05/06 |
| Durable state/backup | v1/v2 migration, lock, atomic save, corrupt-primary backup, failed import, and interrupted shutdown preserve valid data. | Host + QA | persistence/schema-migration/config-secrets tests | Relevant existing tests passed via supplemental runner; package/failure integration pending. | V1-04/06/07 |
| Export/import | Allowed workspace data round-trips; actual export omits credentials and runtime thread/binding fields; failed import rolls back. | Host + UI | server/index.ts export; validateImport; backend/e2e | Import strips binding fields; current export returns raw state and must be corrected. | V1-04/06 |
| Admin/device pairing | Automatic desktop pairing, self-rotation/revocation, closed revoked streams, private admin token, recovery/relaunch. | Host + Desktop | devices/backend/smoke; electron/main.cjs | Historical evidence only for the whole package path. Remote setup is deferred. | V1-04/06/08 |
| Retained UI/accessibility | Complete visible core actions, keyboard/focus, axe, error announcements, essential VoiceOver and actual Mac zoom/reflow. | UI + QA | tests/ui; model-options harness; UX-001/002/003/006/007 | 18-component historical pass; fresh retained-surface checks pending. | V1-05/06/08 |
| Ordinary responsiveness | Startup, ordinary catalog/chat/stream and Stop are usable without runaway memory or hanging UI. | QA | Measured candidate smoke; no fleet-scale QA-002 prerequisite | Not measured for current candidate. | V1-06/08 |
| Package/identity/contents | Compatible .app and DMG/ZIP; consistent version; assets match source; notices present; no local state, secrets, or dev harness leaks. | Release + QA | build/electron config; notices; package inspection | Source still 0.1.0; old artifacts predate foundation/provider/MCP changes. | V1-07 |
| Install/data retention | Finder launch, native dialog, actual data location, first install/upgrade, quit/relaunch, backup/rollback and app removal retain data as documented. | Release + QA | REL-003/005/006/007; Mac test guide | Required actual Mac check; chip/OS unconfirmed. | V1-07/08 |
| Owner acceptance | Exact reviewed artifact passes Danial's test pass and has source/hash/limitations recorded. | Danial | REL-011, QA-012; validation artifact record | Open. | V1-08 |

## Excluded candidate gates

OpenCode (including OPC-006), other inference providers, managed Codex login, MCP/APP full connector lifecycle, MCP forms/URL handoff, EFF-012 custom reasoning, SKL-020, STT-018, expanded scheduling/uploads/content/teams/control, Windows/Android, fleet-scale performance, signing/notarization, and public publication remain deferred as individually assigned in [v1 triage](roadmaps/v1-triage.md).

Do not delete existing deterministic tests merely because their feature is paused. New live-service acceptance and feature development are excluded; retained source still needs regression checks.

## Maintenance and signoff

Mark a row accepted only with fresh scoped evidence for the identified source/artifact. Source acceptance is provisional until the applicable actual-Mac row passes. Record a v1 subset separately from any unfinished original public task criteria.

QA-012 personal signoff requires the required rows above, the approved exclusions, a clean documentation/source-to-artifact record, and Danial's V1-08 acceptance. It does not require BEN-013 research, signing, public publication, or paused feature gates.
