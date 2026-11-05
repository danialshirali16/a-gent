# Durable workspace schema

Status: **FND-003 recorded 2026-11-05.** Current workspace version: **2**. The schema is defined in `shared/types.ts` and validated/migrated in `server/store.ts`.

[Release contract](release-contract.md) · [Runtime baseline](runtime-baselines.md) · [Validation](validation.md) · [FND-003 task](project-roadmap.md#foundation-tasks)

## What version 2 adds

| Area | Field(s) | Purpose |
| --- | --- | --- |
| Provider/profile binding | `Agent.providerProfileId?`, `Conversation.providerBinding?` | Keeps the selected connection profile and provider session identity separate from the A Gent conversation. |
| Model-specific effort | `Agent.reasoningEffort`, `Conversation.reasoningEffort?` | Stores the effective agent effort and an optional chat-level override; verified option metadata remains provider-supplied. |
| App ownership/scope | `WorkspaceState.apps: AppRecord[]` | Records id, name, provider, transport, source, ownership (`managed`/`external`), enabled state, scope (`global`/`agent`/`group`/`chat`), optional host/workspace, tool count, capability snapshot (tools/resources/prompts/server version/auth status), credential reference, last-checked time, and error. |
| Skill ownership/scope | `WorkspaceState.skills: SkillRecord[]` | Records Agent Skills format, version/source path, ownership, enabled state, and scope. |
| Non-secret speech settings | `Settings.speech?` | Records ElevenLabs provider, model, language, and credential mode (`keychain`/`session`); the API key is never part of workspace state. |

`providerBinding` carries `providerId`, `providerKind`, optional account/workspace/model IDs, optional provider thread ID, and `updatedAt`. The legacy `Conversation.providerThreadId` remains for runtime compatibility until FND-007 completes the migration.

## Migration behavior

`migrateWorkspace()` accepts version 1 or 2:

- **Version 2:** validated as-is.
- **Version 1:** adds empty `apps` and `skills` arrays and sets `version: 2`. Existing agents, chats, messages, groups, agent groups, schedules, and settings are preserved.
- **Any other version:** rejected with `This workspace export version is not supported.`

On local load, `StateStore.readState()` restores same-machine provider data that `validateImport()` intentionally strips from exports:

- A saved `providerBinding` is validated and restored.
- A legacy `providerThreadId` is promoted to a `providerBinding` using the conversation's agent provider.
- Imported/exported chats never carry another user's `providerBinding` or `providerThreadId`.

## Runtime session reuse (FND-007)

`server/session-binding.ts` keeps a provider session only when the stored binding exactly matches the current run:

- `providerId` and `providerKind`
- `accountId` (currently `Agent.providerProfileId`)
- `workspaceId` (the resolved workspace path)
- `modelId` (the effective run model)
- a non-empty `providerThreadId`

A match reuses the stored provider thread/session. A mismatch, a legacy `providerThreadId` without a complete binding, or a fresh conversation clears both the legacy thread ID and the binding so the adapter starts a new session deliberately. When the provider reports a thread/session ID, `RunManager` writes a new binding with the provider, account/profile, workspace, model, thread ID, and timestamp.

This is conservative: changing a model or workspace rebuilds the provider session rather than relying on provider-specific compatibility rules. Account identity is only as precise as `providerProfileId`; FND-012 can add an explicit credential/account reference when profiles are implemented.

## Validation rules

- Scoped resources require a known `agent`, `group`, or `chat` ID; `global` scope must omit the scope ID.
- `ownership` is `managed` or `external`; `enabled` defaults to true.
- App transport is `stdio` or `http`; app tool counts and capability resource/prompt counts are non-negative integers; credential references are identifiers, never secret values.
- Skills use the `agent-skills` format only.
- Speech provider is `elevenlabs`; credential mode is `keychain` or `session`; only non-secret fields are persisted.
- IDs are unique within each resource collection; names and IDs are bounded.
- Unknown or malformed fields are ignored rather than copied into state.

## Rollback and recovery

Saving publishes a temporary file with mode `0600`, copies the previous primary to `state.json.bak`, then atomically renames the temporary file. A failed load falls back to the backup and recovers without copying the corrupt primary over it. The migration is applied in memory on load; the next save writes version 2 while retaining the version 1 backup for rollback.

## Verification

`tests/server/schema-migration.test.ts` covers:

1. Version 1 load, migration, provider-thread promotion, backup creation, corrupt-primary recovery, and version 2 persistence.
2. Version 2 round-trip of provider bindings, scoped apps/skills, chat effort, and speech settings; export strips provider binding/thread IDs.
3. Rejection of unsupported versions, unknown scopes, invalid ownership, invalid speech credentials, and duplicate resource IDs.
4. Import merge adding scoped resources without replacing existing records.
5. Provider binding reuse/rebuild rules in `tests/server/session-binding.test.ts`, plus an end-to-end reuse/model-change test in `tests/server/backend.test.ts`.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results for the FND-003 run: typecheck pass; 21/21 server/model-option tests pass; production build pass with the existing chunk-size advisory. The suite is now 62/62 after later FND, provider, MCP inventory/capability, HIL, persistence, and config/secret tests.

## Remaining work

- FND-007 follow-up: remove the legacy `providerThreadId` compatibility field after the migration window and add provider/account/workspace mismatch integration cases beyond the current model-change test. Runtime routing already checks the full binding.
- MCP/skills tasks: own the full app/skill lifecycle. MCP-001/005 extended `AppRecord` with host/workspace, capability snapshot, credential reference, last-checked, and error metadata; new fields must not bypass scope/ownership validation.
- FND-008 follow-up: add a second backup generation or checksum validation if field data shows one-generation recovery is insufficient; current concurrent-save/write-failure/import-rollback coverage is in [persistence](persistence.md).
- Import/export limits for very large workspaces remain a separate product/QA concern.
