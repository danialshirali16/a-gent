# A Gent personal macOS v1.0 release contract

Status: **Scope approved by Danial on 2026-11-05. Implementation and candidate acceptance remain open.** This amendment supersedes the broader first-public-release boundary; the [original contract](archive/release-contract-public-r1-2026-11-05.md) remains historical evidence.

[Roadmap and execution path](project-roadmap.md#recommended-execution-order) · [All 237 task decisions](roadmaps/v1-triage.md) · [Acceptance matrix](support-matrix.md) · [Validation](validation.md)

## Authority and change rule

Danial is the accountable owner and reviewer. The approved objective is a version he can install on his Mac, run, and test himself, followed by the remaining roadmap after release. Technical fixes inside this scope may proceed without repeating scope approval. Publication, new runtime promises, and expanded feature/platform commitments require a separate decision.

This documentation amendment records scope approval; it does not assert that the app has been fixed, that old tests certify current source, or that an artifact has been accepted.

## V1 definition

The target is **A Gent 1.0.0 for personal macOS testing**. Source currently reports 0.1.0; REL-002 must align package, About, API health, app-server client identity, and artifacts for the candidate.

| Boundary | Approved requirement |
| --- | --- |
| Platform | macOS only. The existing packaging baseline is macOS 13+ arm64. Danial's actual chip/OS is unconfirmed; confirm compatibility before accepting his package. Intel/universal support is not implied. |
| Delivery | Installable A Gent.app and convenient DMG/ZIP from identified source. Public publication and automatic updates are deferred. |
| Runtime | Codex is the only required/advertised runtime; external CLI sign-in is sufficient. OpenCode is paused. |
| Execution | Multiple persisted chats/agents, initially one active run per host. Enforce the limit in the API and UI. |
| Chat | Select an available model, stream text, Stop, continue, and retain conversations across restart. |
| Projects | Native Mac folder selection; read-only Chat and Codex Work under the selected sandbox; correct runtime-requested approvals and native question answers. |
| Recovery | Draft retention, failed-send recovery, truthful Stop/termination, reconnect/resynchronization, runtime failure, crash/shutdown recovery, and expired pending interactions. |
| Data | Visible actual data location, one-generation backup with documented limits, migration, sanitized export/import, and private administrator/device credentials. |
| Reasoning | Provider-default reasoning for v1. Preserve metadata/saved values for later work; custom controls and stale explicit effort must not affect v1 dispatch. |
| Gate | Fresh V1-06 through V1-08 evidence for the actual candidate and no unresolved core blocker. All 237 public-roadmap tasks are not prerequisites. |

A permitted workspace write does not necessarily require an approval prompt. Acceptance must separately demonstrate an actual runtime permission request, refusal, approval, and cleanup.

## Decisions to record

D-01–D-11 below replace conflicting public R1 commitments. The archived contract preserves the earlier wording and acceptance history.

| Decision | Personal v1 amendment |
| --- | --- |
| D-01 — release scope | A personally installable/testable macOS v1.0; public GitHub Releases, Developer ID signing, notarization, and automatic updates are deferred. |
| D-02 — provider promise | Codex only. Pause OpenCode, HTTP/Cloud/OpenAI-compatible, Ollama, and Gemini/Antigravity. Gate unsupported selections/routes without deleting saved data. Rethink the Antigravity label rather than implying a native runtime bridge. |
| D-03 — MCP ownership | Full MCP/Connected Apps setup/auth/scope/enable/remove is paused. Inspect supported Codex session/config capabilities and constrain inherited MCP tools to the retained local-work policy without rewriting global CLI configuration. Demonstrate the actual restriction before accepting Work; hiding cards alone is insufficient. |
| D-04 — secrets and authority | Codex account credentials stay owned by the CLI. Preserve administrator/device authority, desktop pairing, self-rotation/revocation, and host-only data operations. Existing HTTP secret storage uses macOS Keychain through the security CLI or session memory through AGENT_SECRET_STORAGE, not Electron safeStorage. Credential UI expansion and remote-device setup are deferred. |
| D-05 — launch apps | No managed connector catalog or MCP setup promise. Native project tools and their sandbox/approval behavior are required. |
| D-06 — compatibility/distribution | Node 24.x packaging, the lockfile, Electron 45.2.2, and recorded Codex 0.166.0 baseline. Startup compatibility checks are required work, not current behavior. Drift needs actionable unsupported states and affected checks. No automatic external CLI upgrade. |
| D-07 — core behavior | Text chat, agent/chat model selection, persisted history, drafts, project work, recovery, backup/import/export, desktop pairing, and retained keyboard/accessibility flows. Scheduling expansion, uploads, richer file editing, regenerate/branches, multiple profiles, remote-host setup, and broader product completion are deferred. Expose only accepted behavior. |
| D-08 — speech | ElevenLabs capture/transcription/quality/native-microphone work is paused. No microphone feature is promised in v1. |
| D-09 — reasoning | Provider-default execution only; custom controls and their full gate are paused. Preserve existing implementation/history without inventing defaults or allowing stale selections to block basic sends. |
| D-10 — skills | Dedicated create/import/manage/scope/use/update/remove/export is paused. Existing CLI-native discovery is not an A Gent skills manager; review inherited runtime capabilities during V1-03. |
| D-11 — benchmark policy | Apply the personal-v1 exception below. Useful comparisons remain evidence; direct correctness, compatibility, regression, real-runtime, and package verification remain mandatory. |

### D-11 benchmark policy

**Owner-approved exception, 2026-11-05:** CONTINUE work in the [v1 triage](roadmaps/v1-triage.md) can follow the ordered roadmap without new two-peer benchmarks first. This includes corrections, core UI/recovery, QA, and local packaging. Reuse and annotate applicable BEN-001/002/003/010 decisions; inspect authoritative runtime/Apple/Electron documentation as needed.

BEN-011–014 are CUT/RETHINK as compulsory prerequisites for this release, not marked research-complete. Deferred feature/platform scopes retain their benchmark requirements when explicitly resumed. The exception does not authorize a new adapter or product promise.

Tests, failure reproductions, fresh real Codex checks, artifact inspection, and actual Mac operation are not waived. Old general board benchmark wording does not reintroduce the superseded public-release gate for CONTINUE work.

## Personal release acceptance

Follow the [support matrix](support-matrix.md) and [Mac test guide](macos-v1-testing.md). Accept a candidate only when:

- Source, runtime/OS/architecture, build commands, artifact/checksum, limitations, and outcomes are recorded in validation.
- Setup, streaming, model selection, project access, approvals/questions, Stop, persistence, and failure/restart paths pass for that package.
- Deterministic fixtures, real account calls, browser UI, and the packaged app have separate, scoped evidence.
- Core blockers are corrected and deferred features are accurately unavailable.
- Danial completes the packaged-app pilot and accepts the artifact.

Historical Done states do not satisfy this gate automatically. CONTINUE tasks use the mapped v1 acceptance subset; unfinished portions of original public criteria remain open.

## Deferred public release

Signing/notarization, public download/distribution, publication permissions, public license/privacy approval, and REL-012 publication remain later work. A personally built app can be tested without Developer ID signing/notarization; a quarantined download may require a per-app Gatekeeper exception. The earlier security-overridden host's spctl result is not clean-Mac evidence. Global Gatekeeper disablement is not a testing prerequisite.

## Approval and remaining environment detail

- Scope, triage, path, and benchmark exception: approved by Danial in this chat on 2026-11-05.
- This turn records documentation updates, not implementation or package acceptance.
- Remaining input: Danial's Mac chip and macOS version. Keep arm64/macOS 13+ provisional for his installation until confirmed.
