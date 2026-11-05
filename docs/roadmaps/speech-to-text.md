# Speech-to-Text with ElevenLabs

Updated: 2026-11-05. [Active v1 path](../project-roadmap.md#recommended-execution-order) · [Every task's v1 decision](v1-triage.md) · [Current state](../current-state-review.md)

**Personal macOS v1 amendment:** STT-001–018 are PAUSE. Non-secret settings exist; microphone capture, transcription, and transcript-to-Agent behavior are not implemented. No microphone permission/entitlement feature is required for personal v1.

The tables retain original public R1/R2 targets, full acceptance criteria, and original dependencies for later work. Current implementation statuses are maintained here; v1 scope/effort is maintained only in the triage. A v1 subset can pass its support-matrix row without declaring the whole original task complete. Old M2/M3 continuation and broad feature gates do not govern the active path.

The [approved D-11 exception](../release-contract.md#d-11-benchmark-policy) permits CONTINUE correction/QA/packaging without new peer comparisons. Compatibility research, tests, real Codex checks, and actual Mac package evidence remain required. Deferred full-scope work retains applicable benchmarks on resumption. Owner labels remain suggested roles; Danial is the acting accountable owner.

## Provider, API, and credentials

Original benchmark dependency: BEN-018. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| STT-001 | R1 | P0 | To do | Product + Integrations | BEN-018, FND-001, FND-002 | **Specify the ElevenLabs transcription contract.** Done when: ElevenLabs is the first STT provider, independent of the LLM connection; the accepted realtime-versus-batch comparison determines the current API/model, supported languages, session limits, and fallback behavior recorded in the contract. |
| STT-002 | R1 | P0 | To do | Host | BEN-018, FND-012, PVD-003, STT-001 | **Add STT configuration and credential lifecycle.** Done when: The user can add/test/replace/clear the ElevenLabs key, choose session-only or secure persistence, and recover locked storage or denied STT access; permanent keys stay out of renderer state, bundles, exports, and logs. |
| STT-003 | R1 | P0 | To do | Host + Integrations | BEN-018, STT-001, STT-002, FND-004 | **Implement authorized transcription sessions.** Done when: The benchmark-selected host proxy or host-minted short-lived single-use token flow authenticates the device, bounds use/expiry, and rejects replay/stale sessions; direct browser access never needs the permanent API key. |
| STT-004 | R1 | P0 | To do | Integrations | BEN-018, STT-001, FND-010 | **Implement the audio and transport adapter.** Done when: Audio encoding, mono conversion, sample rate, chunk sizing, backpressure, commit strategy, and cancellation match the chosen documented endpoint; compressed MediaRecorder output is not mislabeled as raw PCM. |
| STT-005 | R1 | P0 | To do | Host + Integrations | BEN-018, STT-003, STT-004, FND-011 | **Normalize STT failures and usage limits.** Done when: Invalid/expired keys, forbidden access, quota/429, network loss, silence, session timeout, and service errors have bounded cleanup and useful redacted recovery; retries never silently duplicate a session or billable upload. |
| STT-006 | R1 | P0 | To do | Host + Product | BEN-018, STT-001, STT-002, FND-008 | **Define audio and transcript retention.** Done when: Disclosed data flows distinguish local temporary audio, provider processing, saved chat text, and optional diagnostics; cancellation/crash cleanup and export exclusion pass; account-dependent provider retention is verified without promising unsupported zero retention. |

## Microphone, transcript, and Agent flow

Original benchmark dependency: BEN-019. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| STT-007 | R1 | P0 | To do | Desktop + UI | BEN-019, STT-001, FND-004 | **Add deliberate microphone capture.** Done when: Explicit start/stop/cancel, first-use permission, denied/revoked permission, missing/busy/disconnected devices, and selected input work; tracks stop on cancellation, unmount, and the agreed background/context-switch policy. |
| STT-008 | R1 | P1 | To do | UI | BEN-019, STT-005, STT-007, COR-004 | **Build composer recording states.** Done when: Idle, requesting permission, connecting, listening, transcribing, stopped, cancelled, and error states are distinct; microphone activity and destination Agent are visible and ordinary typed drafts remain usable. |
| STT-009 | R1 | P0 | To do | UI + Integrations | BEN-019, STT-004, STT-008 | **Reconcile streamed transcript events.** Done when: Partial, committed, revised, empty, repeated, and out-of-order events produce one coherent transcript; typed text, caret intent, and existing draft content survive without duplicated or silently overwritten words. |
| STT-010 | R1 | P0 | To do | UI + Host | BEN-019, STT-009, PVD-012, FND-007, EFF-006, SKL-011 | **Send reviewed speech through the selected Agent.** Done when: An editable transcript is submitted only by the user's Send action through the normal chat pipeline, using that chat's Agent, model, valid effort, skills, and tool policy; partial/committed STT events never submit themselves. |
| STT-011 | R1 | P0 | To do | UI + Host | BEN-019, STT-003, STT-007, STT-010, FND-010 | **Handle context and lifecycle races.** Done when: Host/chat/Agent switching, Stop, close, sleep, reconnect, late transcript events, and simultaneous windows cannot write into the wrong draft or leave the microphone active; interrupted transcription preserves recoverable text. |
| STT-012 | R1 | P1 | To do | UI + QA | BEN-019, STT-008, STT-009, STT-011 | **Accept accessible speech controls.** Done when: Keyboard and VoiceOver can start/stop/cancel, review errors, and edit text; live announcements are bounded, status uses more than motion/color, and RTL, narrow layout, large text, and reduced motion work. |

## Speech benchmarks and release verification

Original benchmark dependency: BEN-020. Personal-v1 CONTINUE work follows the [D-11 exception](../release-contract.md#d-11-benchmark-policy); deferred full-scope work follows the benchmark process when resumed.

| ID | Original target | Priority | Status | Owner | Original dependencies | Original full-scope task and acceptance history |
| --- | --- | --- | --- | --- | --- | --- |
| STT-013 | R1 | P1 | To do | QA + Product | BEN-020, STT-001, STT-006 | **Create an approved speech evaluation corpus.** Done when: Named target languages, accents, code-switching, technical names, quiet/noisy conditions, short/long speech, silence, and user consent/data rights are documented; reference transcripts and environment are versioned. |
| STT-014 | R1 | P1 | To do | QA + Integrations | BEN-020, STT-004, STT-013 | **Measure accuracy, latency, and cost.** Done when: WER/CER where appropriate, first-partial/final latency distributions, correction burden, network conditions, and actual usage/cost are compared to the benchmark baselines; product budgets follow measurements rather than marketing claims. |
| STT-015 | R1 | P0 | To do | QA | BEN-020, STT-005, STT-006, STT-011 | **Add deterministic speech regression fixtures.** Done when: Permission denial, device loss, malformed audio, token expiry, repeated/revised events, silence, 429, dropped connection, cleanup, and context races pass without needing a live microphone or paid account in ordinary CI. |
| STT-016 | R1 | P0 | To do | QA + Integrations | BEN-020, STT-010, STT-012, STT-014, STT-015 | **Accept an authorized ElevenLabs journey.** Done when: Connect a real authorized ElevenLabs key, speak, edit, Send to the selected Agent, stop/cancel, replace/clear credentials, and restart; recorded evidence distinguishes API fixtures from real transcription and Agent replies. |
| STT-017 | R1 | P0 | To do | QA + Release | BEN-020, STT-016, REL-004, REL-006 | **Verify microphone use in the signed macOS app.** Done when: Permission purpose text, applicable entitlements, first launch/denial/re-enable, input devices, sleep/wake, quit/relaunch, and upgrade work on the actual signed package; local browser-only success is insufficient. |
| STT-018 | R1 | P0 | To do | QA + Product | BEN-020, STT-006, STT-012, STT-014, STT-015, STT-016, STT-017 | **Close the Speech-to-Text release gate.** Done when: All STT tasks and their benchmark records have accepted evidence; setup, supported languages, limits, data handling, troubleshooting, and measured quality are documented for the exact candidate. |

## Gate

STT-018, native microphone checks, and BEN-018–020 do not block personal v1. The ElevenLabs choice and full feature criteria are preserved for later resumption.
