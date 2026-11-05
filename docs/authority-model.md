# Host, device, and credential authority

Status: **FND-004 recorded 2026-11-05.** This defines who may change host-level configuration versus who may use the workspace. Enforcement is implemented at the API boundary in `server/index.ts` and covered by backend tests.

[Release contract](release-contract.md) · [Durable schema](data-schema.md) · [Support matrix](support-matrix.md) · [Validation](validation.md) · [FND-004 task](project-roadmap.md#foundation-tasks)

## Roles

| Role | How it is identified | Authority |
| --- | --- | --- |
| **Administrator** | The host root token from `.token`, `AGENT_TOKEN`, or the packaged host's local bootstrap. | Full host authority, including device creation/rotation/revocation, provider credentials, workspace import/export, and all ordinary workspace use. |
| **Host desktop device** | A per-device bearer token used from the host's loopback address, with a loopback `Host` header and no forwarding headers. This is the packaged desktop app after cookie migration. | Ordinary workspace use plus host-level configuration: provider connect/disconnect, default provider/model, speech settings, import/export, agents/chats/schedules/files/approvals, and self-rotation/revocation. Cannot create or manage other devices. |
| **Remote device** | A per-device bearer token whose request is not a host-loopback request (LAN/remote address, non-loopback `Host`, or a forwarding header). | Ordinary workspace use: bootstrap, agents/chats, messages, approvals, interrupts, schedules, read-only Files, and self-rotation/revocation. Cannot change provider credentials, host defaults, speech settings, import/export, or manage other devices. |
| **Unauthenticated** | No valid bearer/cookie token. | No API access; `401`. |

## Authority matrix

| Operation | Administrator | Host desktop | Remote device | Enforcement |
| --- | --- | --- | --- | --- |
| Read bootstrap/state, providers, apps, auth | Yes | Yes | Yes | Authenticated API |
| Create/update agents, chats, groups, schedules | Yes | Yes | Yes | Authenticated API |
| Send message, approve/decline, interrupt | Yes | Yes | Yes | Authenticated API |
| Browse workspace files (read-only) | Yes | Yes | Yes | Authenticated API; path/realpath checks |
| Change ordinary UI preference (`theme`, activity, tool view) | Yes | Yes | Yes | Settings patch |
| Change default provider/model | Yes | Yes | **No** | `requireHostAuthority` |
| Change speech settings | Yes | Yes | **No** | `requireHostAuthority` |
| Connect/probe provider, add/change endpoint or key | Yes | Yes | **No** | `requireHostAuthority` |
| Export/import the whole workspace | Yes | Yes | **No** | `requireHostAuthority` |
| Create/rotate/revoke another device | Yes | **No** | **No** | `requireAdmin`; self-rotation/revocation remains allowed |
| Rotate/revoke own device | Yes | Yes | Yes | Device route ownership check |
| Future app/tool grants, skill configuration | Yes | Yes | **No by default** | To be enforced when those APIs exist (MCP/SKL tasks) |
| Future microphone capture | Host/device-local capture only | Yes | Device-local capture only, with explicit host-minted transcription rights | To be enforced by STT-003/STT-007/STT-011 |

The matrix is deliberately conservative: a remote device can use an existing Agent and its selected provider, but cannot change which account, endpoint, model default, or host credential that Agent uses.

## Host-loopback detection

`isLocalHostRequest()` requires all of the following:

1. The socket remote address is `127.0.0.1`, `::1`, or `::ffff:127.0.0.1`.
2. No `Forwarded`, `X-Forwarded-For`, `X-Forwarded-Host`, or `X-Real-IP` header is present.
3. The `Host` header resolves to `127.0.0.1`, `localhost`, `[::1]`, or `::1`.

This is transport locality, not a user role stored in `devices.json`. A reverse proxy or tunnel that forwards requests without loopback must use the administrator token for host-level changes; ordinary remote use still works with a device token. A future multi-user deployment should replace this heuristic with explicit device roles, but it is sufficient for the R1 single-user local host.

## Why these boundaries

- Provider endpoints and API keys are host-level credentials; a paired remote device must not be able to redirect them or spend the host's account.
- Import replaces/merges workspace state and export contains all chats; both are host-level data operations.
- Ordinary chat, schedules, approvals, and read-only workspace browsing are the useful remote-device workflow and remain available.
- Device management is administrative: a compromised remote token must not mint or revoke other tokens.
- STT and app/skill permissions are not implemented yet, so their rows are explicit future constraints rather than hidden assumptions.

## Verification

`tests/server/backend.test.ts` includes `host authority separates desktop devices from remote devices for credentials and workspace data`:

- A local device token can export and change the default provider.
- A remote device token is denied default-provider, speech, provider-connect, export, and import changes with `403`.
- The same remote token can read bootstrap and change an ordinary theme preference.
- The administrator token can export/change defaults even with forwarding headers.
- A device token cannot create another device even on the host.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm run test -- --test-name-pattern="host authority"
npm test
```

Results: typecheck pass; focused authority test pass; 45/45 server tests pass after FND-006–FND-012.

## Event-stream binding (FND-005)

SSE clients are stored with the authenticated device ID. Rotating or revoking a device closes every stream owned by that device and deletes it from the client set; the old token subsequently returns 401. Streams owned by other devices are untouched, and the administrator stream has no device ID. `tests/server/backend.test.ts` covers rotation, revocation, old-token rejection, and an unrelated device receiving a later state event.

## Remaining work

- **FND-010/FND-011:** consolidate timeout/cancellation budgets and standardize redacted diagnostics.
- **FND-012/PVD-003:** replace transport-locality heuristics with explicit credential/profile storage and, if needed, an explicit device role field.
- **MCP/SKL:** enforce app/tool grants and skill configuration through the same authority helper; do not add a parallel policy path.
- **STT:** define host-minted transcription sessions and device-local capture rights; no permanent ElevenLabs key may reach a remote device.
- **PVD-014:** add endpoint redirect/private-address policy on top of this role boundary.
