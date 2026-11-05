# Atomic persistence and recovery

**Personal-v1 audit limit (2026-11-05):** the storage primitives below have fixture evidence; application-level recovery remains open because RunManager reserves a run before its initial awaited save and does not clean up if that save fails. Export also still returns stored runtime bindings. Track retained fixes in COR-006/009 and [V1-04](project-roadmap.md#recommended-execution-order).

Status: **FND-008 recorded 2026-11-05.** This defines the write, backup, import, lock, and restart contracts for the workspace file.

[Release contract](release-contract.md) · [Durable schema](data-schema.md) · [Run lifecycle](run-lifecycle.md) · [Validation](validation.md) · [FND-008 task](project-roadmap.md#foundation-tasks)

## Files

| File | Purpose |
| --- | --- |
| `state.json` | Primary workspace snapshot (mode `0600` on creation). |
| `state.json.bak` | Previous primary snapshot, retained for one recovery generation. |
| `.state-<id>.tmp` | Per-write temporary file; renamed atomically to `state.json`. |
| `.lock` | PID lock that prevents two hosts from writing one workspace. |

## Write protocol

`StateStore.save()`:

1. Serializes the current state to a string **before** queueing the write. Concurrent callers therefore write their own snapshots rather than re-reading a later state.
2. Queues the write behind the previous write, so writes never overlap.
3. Creates a temporary file with mode `0600`.
4. Writes the full snapshot and calls `fsync` on the file handle.
5. Copies the current primary to `state.json.bak` (missing primary is allowed on first save).
6. Renames the temporary file over the primary.

`save(true)` is used only for recovery and skips the backup copy so a corrupt primary cannot overwrite the valid backup.

If a write fails, the primary is unchanged. The next `save()` starts a fresh queue after ignoring the previous rejection, so the host can recover without restarting.

## Import transaction

`StateStore.merge()` validates the import, clones current state, applies non-duplicate records, assigns the candidate in memory, then awaits its queued write. On failure it restores the previous in-memory state; this is not isolated from concurrent in-process readers/mutations. The API returns an error instead of a partially merged workspace.

Imports still discard provider bindings/thread IDs via `validateImport()` and never import secrets. See [the durable schema](data-schema.md).

## Load and recovery

`StateStore.load()`:

1. Reads and validates `state.json` (migrating version 1 to version 2 if needed).
2. If the primary is missing, creates a fresh workspace.
3. If the primary is unreadable, reads `state.json.bak`, migrates/validates it, and writes it back as the primary with `save(true)`.
4. If both files are unreadable, closes the lock and fails with an actionable error.

`validateImport()` revalidates references, versions, scopes, ownership, speech settings, and duplicate IDs. A persisted `streaming` message is normalized to `interrupted` so a crash does not leave a permanently active message.

## Locks and restart

- `StateStore` with `lock: true` acquires `.lock` through `acquireDataLock()`; a second host using the same directory is rejected while the owner PID is alive.
- Stale lock files from a dead PID are removed and re-acquired.
- Closing the store releases the lock. Device and state stores are closed in the host shutdown path.
- Restart reads the primary/backup, migrates old versions, restores same-machine provider bindings, and preserves schedules/agents/chats/messages.

## Verification

`tests/server/persistence.test.ts` covers:

1. Concurrent saves: final primary is the later snapshot, backup is a valid previous snapshot, and no `.tmp` file remains.
2. Failed write: primary remains byte-identical, then a later save succeeds and reloads correctly.
3. Failed import: candidate state is rolled back in memory, and a later save/reload does not contain the imported record.

Existing tests also cover:

- Lock rejection and stale-lock recovery (`backend.test.ts`).
- Corrupt-primary recovery from backup (`backend.test.ts`, `schema-migration.test.ts`).
- Version 1 → 2 migration and rollback generation (`schema-migration.test.ts`).
- Import validation strips provider bindings/thread IDs (schema-migration/backend tests). Actual /api/export still returns them and needs COR-009 correction; those tests do not establish sanitized export.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results at the FND-008 step: typecheck pass; 32/32 server/model-option tests pass; production build pass with the existing chunk-size advisory. The suite is 38/38 after the later foundation tests.

## Limits

- One backup generation only. A second corruption before the next save can lose the previous generation; this is disclosed rather than silently repaired.
- `fsync` covers the state file contents; directory-entry durability is delegated to the platform's atomic rename behavior.
- Import/save calls from separate HTTP requests are serialized by the write queue, but a state mutation made outside `StateStore` while an import is pending is not a general transaction API. Product routes should mutate through store helpers and call `save()`.
- Large workspaces still depend on the 32 MB import limit; streaming/compaction is separate work.
- No encrypted-at-rest workspace storage is promised in R1; file modes protect local access and secrets are excluded from state.
