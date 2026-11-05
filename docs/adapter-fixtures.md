# Shared adapter contract fixtures

Status: **PVD-016 evidence recorded 2026-11-05.** Covers the two R1 runtimes plus the shared HTTP fixture; deferred providers are excluded.

[Provider board](roadmaps/providers.md) · [Provider lifecycle](provider-lifecycle.md) · [Validation](validation.md)

| Case | Codex | OpenCode | HTTP/shared |
| --- | --- | --- | --- |
| Success/catalog | Fake app-server + real live smoke | Fake CLI + real live smoke | `adapter-fixtures.test.ts` valid catalog/stream |
| Auth failure | account/read / CLI discovery errors | `auth list`/CLI failure | HTTP 401 fixture |
| Malformed data | schema drift/fixture errors | invalid JSON lines ignored/bounded | malformed `/models` fixture |
| No text | RunManager fails completed-without-text | RunManager fails completed-without-text | empty SSE fixture |
| Model removal | catalog normalization/fixture list | CLI model list changes | `adapter-fixtures.test.ts` removal |
| Timeout | per-request/catalog/stream budgets | capture/run/termination budgets | catalog/stream budgets |
| Disconnect | provider disconnect/readiness reset | provider disconnect/readiness reset | disconnect/credential clear |
| Interruption | backend approval/interrupt tests | Stop/child-exit tests | stream abort |
| Restart | backend restart + real Codex restart/resume | backend restart/credential fixture | endpoint/secret restore |

Fixtures live in `tests/server/fake-codex.mjs`, `fake-opencode.mjs`, `adapter-fixtures.test.ts`, `provider-contract.test.ts`, `provider-credentials.test.ts`, and the existing backend lifecycle tests.

Limitations: Codex/OpenCode no-text cases rely on the shared RunManager failure path rather than dedicated adapter-specific scripts; deferred HTTP/Ollama/Gemini adapters are out of scope.
