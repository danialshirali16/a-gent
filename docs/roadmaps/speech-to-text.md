# Speech-to-Text with ElevenLabs

Updated: 2026-11-05. [Master roadmap](../project-roadmap.md) · [Task boards](README.md) · [Benchmark process](../benchmarks/README.md)

Required flow: connect an ElevenLabs API key → deliberately record speech → review/edit the transcript → Send to the currently selected Agent. Transcription is independent of the Agent's LLM provider; it must retain that Agent's model, model-specific reasoning setting, skills, and tool policy. Spoken replies, voice calls, and always-listening behavior need separate scope.

Current source has no microphone capture or STT adapter. The initial technical references are ElevenLabs' [client streaming guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming) and [realtime API](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime), checked 2026-11-05. They document Scribe v2 Realtime, temporary client tokens, supported audio formats, and partial/committed events. Choose transport and capture behavior through BEN-018/019; documentation research alone does not complete the benchmarks.

All tasks start **To do**. Target **R1** is the first public macOS release. Owners are suggested roles; assign an actual DRI and reviewer before Ready. Requirements here are planned, not implemented.

## Provider, API, and credentials

Development gate: **BEN-018** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| STT-001 | R1 | P0 | To do | Product + Integrations | BEN-018, FND-001, FND-002 | **Specify the ElevenLabs transcription contract.** Done when: ElevenLabs is the first STT provider, independent of the LLM connection; the accepted realtime-versus-batch comparison determines the current API/model, supported languages, session limits, and fallback behavior recorded in the contract. |
| STT-002 | R1 | P0 | To do | Host | BEN-018, FND-012, PVD-003, STT-001 | **Add STT configuration and credential lifecycle.** Done when: The user can add/test/replace/clear the ElevenLabs key, choose session-only or secure persistence, and recover locked storage or denied STT access; permanent keys stay out of renderer state, bundles, exports, and logs. |
| STT-003 | R1 | P0 | To do | Host + Integrations | BEN-018, STT-001, STT-002, FND-004 | **Implement authorized transcription sessions.** Done when: The benchmark-selected host proxy or host-minted short-lived single-use token flow authenticates the device, bounds use/expiry, and rejects replay/stale sessions; direct browser access never needs the permanent API key. |
| STT-004 | R1 | P0 | To do | Integrations | BEN-018, STT-001, FND-010 | **Implement the audio and transport adapter.** Done when: Audio encoding, mono conversion, sample rate, chunk sizing, backpressure, commit strategy, and cancellation match the chosen documented endpoint; compressed MediaRecorder output is not mislabeled as raw PCM. |
| STT-005 | R1 | P0 | To do | Host + Integrations | BEN-018, STT-003, STT-004, FND-011 | **Normalize STT failures and usage limits.** Done when: Invalid/expired keys, forbidden access, quota/429, network loss, silence, session timeout, and service errors have bounded cleanup and useful redacted recovery; retries never silently duplicate a session or billable upload. |
| STT-006 | R1 | P0 | To do | Host + Product | BEN-018, STT-001, STT-002, FND-008 | **Define audio and transcript retention.** Done when: Disclosed data flows distinguish local temporary audio, provider processing, saved chat text, and optional diagnostics; cancellation/crash cleanup and export exclusion pass; account-dependent provider retention is verified without promising unsupported zero retention. |

## Microphone, transcript, and Agent flow

Development gate: **BEN-019** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| STT-007 | R1 | P0 | To do | Desktop + UI | BEN-019, STT-001, FND-004 | **Add deliberate microphone capture.** Done when: Explicit start/stop/cancel, first-use permission, denied/revoked permission, missing/busy/disconnected devices, and selected input work; tracks stop on cancellation, unmount, and the agreed background/context-switch policy. |
| STT-008 | R1 | P1 | To do | UI | BEN-019, STT-005, STT-007, COR-004 | **Build composer recording states.** Done when: Idle, requesting permission, connecting, listening, transcribing, stopped, cancelled, and error states are distinct; microphone activity and destination Agent are visible and ordinary typed drafts remain usable. |
| STT-009 | R1 | P0 | To do | UI + Integrations | BEN-019, STT-004, STT-008 | **Reconcile streamed transcript events.** Done when: Partial, committed, revised, empty, repeated, and out-of-order events produce one coherent transcript; typed text, caret intent, and existing draft content survive without duplicated or silently overwritten words. |
| STT-010 | R1 | P0 | To do | UI + Host | BEN-019, STT-009, PVD-012, FND-007, EFF-006, SKL-011 | **Send reviewed speech through the selected Agent.** Done when: An editable transcript is submitted only by the user's Send action through the normal chat pipeline, using that chat's Agent, model, valid effort, skills, and tool policy; partial/committed STT events never submit themselves. |
| STT-011 | R1 | P0 | To do | UI + Host | BEN-019, STT-003, STT-007, STT-010, FND-010 | **Handle context and lifecycle races.** Done when: Host/chat/Agent switching, Stop, close, sleep, reconnect, late transcript events, and simultaneous windows cannot write into the wrong draft or leave the microphone active; interrupted transcription preserves recoverable text. |
| STT-012 | R1 | P1 | To do | UI + QA | BEN-019, STT-008, STT-009, STT-011 | **Accept accessible speech controls.** Done when: Keyboard and VoiceOver can start/stop/cancel, review errors, and edit text; live announcements are bounded, status uses more than motion/color, and RTL, narrow layout, large text, and reduced motion work. |

## Speech benchmarks and release verification

Development gate: **BEN-020** in [the benchmark board](benchmarking.md) must have an accepted, scope-matched record before these tasks enter Ready or implementation.

| ID | Target | Priority | Status | Owner | Depends on | Task and acceptance |
| --- | --- | --- | --- | --- | --- | --- |
| STT-013 | R1 | P1 | To do | QA + Product | BEN-020, STT-001, STT-006 | **Create an approved speech evaluation corpus.** Done when: Named target languages, accents, code-switching, technical names, quiet/noisy conditions, short/long speech, silence, and user consent/data rights are documented; reference transcripts and environment are versioned. |
| STT-014 | R1 | P1 | To do | QA + Integrations | BEN-020, STT-004, STT-013 | **Measure accuracy, latency, and cost.** Done when: WER/CER where appropriate, first-partial/final latency distributions, correction burden, network conditions, and actual usage/cost are compared to the benchmark baselines; product budgets follow measurements rather than marketing claims. |
| STT-015 | R1 | P0 | To do | QA | BEN-020, STT-005, STT-006, STT-011 | **Add deterministic speech regression fixtures.** Done when: Permission denial, device loss, malformed audio, token expiry, repeated/revised events, silence, 429, dropped connection, cleanup, and context races pass without needing a live microphone or paid account in ordinary CI. |
| STT-016 | R1 | P0 | To do | QA + Integrations | BEN-020, STT-010, STT-012, STT-014, STT-015 | **Accept an authorized ElevenLabs journey.** Done when: Connect a real authorized ElevenLabs key, speak, edit, Send to the selected Agent, stop/cancel, replace/clear credentials, and restart; recorded evidence distinguishes API fixtures from real transcription and Agent replies. |
| STT-017 | R1 | P0 | To do | QA + Release | BEN-020, STT-016, REL-004, REL-006 | **Verify microphone use in the signed macOS app.** Done when: Permission purpose text, applicable entitlements, first launch/denial/re-enable, input devices, sleep/wake, quit/relaunch, and upgrade work on the actual signed package; local browser-only success is insufficient. |
| STT-018 | R1 | P0 | To do | QA + Product | BEN-020, STT-006, STT-012, STT-014, STT-015, STT-016, STT-017 | **Close the Speech-to-Text release gate.** Done when: All STT tasks and their benchmark records have accepted evidence; setup, supported languages, limits, data handling, troubleshooting, and measured quality are documented for the exact candidate. |

## Gate

STT-018 must be accepted before QA-012 signs off R1. Authorized live transcription, measured quality, failure recovery, and microphone use in the signed Mac package are required. Windows/Android inherit their own native capture and lifecycle checks when resumed.
