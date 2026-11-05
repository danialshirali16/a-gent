# BEN-009 — Connect Apps experience comparison

Status: **Done — accepted for M3 execution on 2026-11-05.**

[Benchmark process](README.md) · [Scope task](../roadmaps/benchmarking.md) · [Connect Apps board](../roadmaps/connect-apps.md) · [BEN-008](BEN-008-mcp-runtime.md)

## Scope

- **BEN ID and delivery task IDs:** BEN-009; covers APP-001–APP-012.
- **Question:** What first-connection, catalog/custom, sign-in, access, inspection, enable/disable, and removal workflow should Connect Apps expose?
- **Comparators:** Reason current docs/installed reference; Claude Desktop custom connectors; OpenCode MCP docs; A Gent inventory UI.
- **Excluded:** runtime internals (BEN-008), question/form UI (BEN-010), named launch catalog promises (D-05).

## Evidence

| Source | Observed workflow |
| --- | --- |
| Reason | Connectors in Customize/settings; account-scoped tools, approvals, per-job enablement; private cloud/billing excluded. |
| Claude Desktop | Custom connector add by name + remote URL; detected auth; sign-in now/when needed/no sign-in; OAuth client or headers; enable per conversation; remove and re-add to edit. |
| OpenCode | Config-defined MCP servers; local/remote/OAuth; list/auth/logout; per-agent tool enablement; automatic 401 OAuth. |
| A Gent | Search/category/refresh/status cards only; no add/auth/details/scope/enable/disable/remove/test. |

## Decisions

1. **First-run:** show connected apps, a single “Add app” action, custom local/remote setup, and a small verified catalog (only when D-05 evidence exists).
2. **Add flow:** name, transport, URL/command, auth mode, scope, and preflight validation; never write config without confirmation.
3. **Auth:** distinct needs-auth/checking/ready/error; browser OAuth status; cancel; re-auth; no secret display.
4. **Access:** show requested scopes/tools; per-app enable/disable; per-conversation/Agent enablement where supported; effective grants visible.
5. **Inspect:** transport, source/ownership, auth, tool count/list, last checked, errors, and server version; no fabricated capability.
6. **Remove:** disable/remove with active-run conflict handling; removal is explicit and doesn't edit another client's config silently.
7. **Catalog honesty:** custom entries are supported; named catalog publishers are advertised only after real onboarding evidence.
8. **Accessibility/recovery:** keyboard/focus, empty/error/offline states, retry, and no dead-end.

## Delivery mapping

APP-001 IA; APP-002/003 add/custom; APP-004/005 auth/re-auth; APP-006 details/access; APP-007 enable/scope; APP-008/009 edit/remove; APP-010 test/health; APP-011 accessibility; APP-012 acceptance.

## Limitations

No live OAuth connector or Claude Desktop walkthrough was performed. Acceptance: Danial, 2026-11-05.
