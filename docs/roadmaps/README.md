# Roadmap task boards

Updated: 2026-11-05. The [master roadmap](../project-roadmap.md) defines milestones, scope, decisions, task status, and release gates.

| Board | Tasks | Scope |
| --- | ---: | --- |
| [Foundations](../project-roadmap.md#foundation-tasks) | 12 | Scope, compatibility, schemas, authority, sessions, Stop, persistence, interactions, diagnostics |
| [Provider integration completion](providers.md) | 44 | Shared lifecycle and six advertised provider entries |
| [MCP and Connect Apps completion](connect-apps.md) | 40 | MCP lifecycle, Connect Apps, questions/forms/approvals |
| [Model-specific reasoning controls](reasoning-effort.md) | 12 | Verified per-model options/defaults, native mapping, persistence, Thinking UI, verification |
| [Agent skills](skills.md) | 20 | Create/add/import, discovery, scope, native use, editing, updates, removal/export |
| [ElevenLabs Speech-to-Text](speech-to-text.md) | 18 | Key setup, capture, streamed transcript, explicit Agent Send, quality, native microphone checks |
| [Core product and UI completion](product.md) | 22 | Core text workspace, recovery, broader content, UI/a11y |
| [Quality, packaging, and release](quality-release.md) | 24 | Regression, real integrations, CI, signing, packaging, pilot, publication |
| [Paused platforms and later product completion](platforms-next.md) | 20 | Windows/Android and later product scope |
| [Benchmark prerequisites](benchmarking.md) | 25 | Scope-specific peer/reference comparison and design decisions before development |

Total: **237 tasks**. After the 2026-11-05 D-02 amendment: **191 R1**, **28 R2**, **16 paused platform**, **2 optional-scope** tasks. These include 25 benchmark tasks and 212 delivery tasks. Counts describe acceptance packages, not effort or percentage completion.

Every new task starts To do. Existing partial implementation is documented in [the integration review](../integration-review.md); move a task to Done only when its acceptance evidence is linked in [validation](../validation.md). Update status in its owning board rather than copying task lists into other documents.

**M0 accepted (2026-11-05):** BEN-001, FND-001, and FND-002 are Done; D-01–D-11 and the initial QA-001 matrix are recorded. **M1 is complete (2026-11-05):** BEN-001 and FND-001–FND-012 are Done. **M2 is in progress for Codex/OpenCode only:** BEN-002–BEN-004 and BEN-021/BEN-022 are accepted; shared readiness/catalog/model-ID, credentials/disconnect, inference test, endpoint policy, and reasoning controls are implemented (PVD-001–016 Done; EFF-001–007/EFF-011 Done). Remaining M2: PVD-017/CDX/OPC/EFF-008–012. **M3 is in progress:** BEN-008–BEN-010 accepted; MCP-001–005/MCP-009/MCP-015 and HIL-001/HIL-002 Done; MCP-010/011/014 and HIL-003 Review. Cloud/OpenAI-compatible, Ollama, and Gemini/Antigravity are deferred. Next: M3 lifecycle/config/Connect Apps implementation, then M2 closure and M4 tracks.

All 25 delivery sections have a BEN dependency and development gate. Follow [benchmark → design decisions → development → verification](../benchmarks/README.md); an accepted scope-matched comparison is required before Ready. The remaining benchmark peers have not been assessed by this documentation update.
