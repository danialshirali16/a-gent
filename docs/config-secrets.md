# Config and secret storage interfaces

**Personal-v1 context (2026-11-05):** external Codex sign-in is sufficient; general API-key setup is deferred. ProviderManager now uses SecretStore, but its endpoint/model configuration remains a separate connections.json path rather than ConfigStore. The current default on macOS is the security-CLI Keychain adapter, not Electron safeStorage; AGENT_SECRET_STORAGE=session selects memory. A per-provider UI storage-mode choice is not implemented.

Status: **FND-012 recorded 2026-11-05.** This defines typed, owner-scoped config files and credential references, with atomic updates, rollback, migration, and export exclusion. The provider/speech integrations adopt these interfaces in PVD-003/PVD-004/STT-002; this task establishes and tests the contract first.

[Release contract](release-contract.md) · [Persistence](persistence.md) · [Diagnostics](diagnostics.md) · [Validation](validation.md) · [FND-012 task](project-roadmap.md#foundation-tasks)

## Ownership model

Both interfaces use an explicit owner:

```ts
{ kind: 'provider' | 'speech' | 'mcp' | 'skill' | ..., id: 'openai' | 'elevenlabs' | ... }
```

A reference is scoped by `(owner.kind, owner.id, id)`. The same `api-key` id can exist for two providers without collision. A config file loaded by a different owner is rejected rather than silently reused.

## Typed config: `ConfigStore<T>`

`server/config-store.ts` stores:

```json
{ "version": 1, "owner": { "kind": "provider", "id": "openai" }, "updatedAt": "...", "value": { ... } }
```

- The caller supplies a validator and defaults.
- The owner and version are checked on load.
- Updates validate before writing, write atomically with `fsync`, retain one `.bak` generation, and only commit the in-memory value after a successful write.
- A failed write leaves the previous value intact.
- A legacy raw object can be migrated with `migrateLegacy` and is rewritten in versioned form.
- Corrupt primary falls back to the backup; ownership/version mismatch does not fall back to another owner's backup.

## Credential references: `SecretStore`

`server/secrets.ts` defines:

```ts
interface SecretStore {
  kind: string;
  set(input: { id, owner, secret }): Promise<SecretRef>;
  get(id, owner): Promise<string | undefined>;
  delete(id, owner): Promise<boolean>;
  list(owner?): SecretRef[];
  close(): Promise<void>;
}
```

Implementations:

| Backend | Use | Storage |
| --- | --- | --- |
| `MemorySecretStore` | Session-only mode; tests | Process memory; disappears on restart. |
| `KeychainSecretStore` | Default macOS provider API-key storage | Built-in security CLI, a-gent service; missing/locked errors mapped. Actual Mac behavior is not accepted by Windows fixture results. |
| `FileSecretStore` | Available encrypted-file implementation/tests; not selected by createSecretStore | AES-256-GCM ciphertext in `secrets.json`; 32-byte key in `.secret-key` (mode `0600`); atomic writes + `.bak`. |

`FileSecretStore` never writes plaintext secrets. `list()` returns metadata only (id, owner, timestamps). Delete/update are atomic; a failed write leaves the previous record set intact.

**Security boundary:** `FileSecretStore` is local file protection, not macOS Keychain and not hardware-backed. createSecretStore selects macOS Keychain or session memory; full user-facing storage selection remains incomplete. This interface makes that choice replaceable without changing callers.

## Export exclusion

Workspace export is `WorkspaceState` from `state.json`; config and secret files live in the data directory but are not part of that state. Imports validate only workspace records and cannot carry credentials. `tests/server/config-secrets.test.ts` asserts that an exported workspace does not contain a stored secret value.

## Migration and rollback

- Legacy config shape → versioned envelope on load.
- Corrupt config primary → `.bak` recovery.
- Corrupt secret primary → `.bak` recovery with the same key file.
- Failed config set / secret set → in-memory value/record set unchanged.
- Owner mismatch → explicit error, no cross-owner fallback.
- Missing key file → generated with `wx`/`0600`; concurrent creation reuses the existing key.

## Verification

`tests/server/config-secrets.test.ts` covers:

1. Typed config owner/version checks, validation, backup recovery, owner mismatch, and legacy migration.
2. Failed config write leaves the previous value.
3. Memory secret owner separation, get/delete/list.
4. File secret encryption at rest, reload, owner separation, deletion, and export exclusion.
5. File secret backup recovery and failed-write rollback.

Commands run 2026-11-05:

```powershell
npm run typecheck
npm test
npm run build
```

Results: typecheck pass; 45/45 server/model-option tests pass; production build pass with the existing chunk-size advisory.

## Adoption and remaining work

- **PVD-003/PVD-004:** choose Keychain vs session-only, adopt `ConfigStore` for provider endpoints and `SecretStore` for keys, and migrate the existing `connections.json`.
- **STT-002:** reuse the same secret interface for the ElevenLabs key; do not create a second credential file.
- **MCP:** Codex/OpenCode own MCP OAuth/token storage. A Gent stores only a credential reference, auth status, and login ID—never long-lived app tokens. **SKL:** use the `skill` owner kind for skill configuration when that lifecycle exists.
- **FND-012 follow-up:** add a Keychain-backed `SecretStore` implementation when the desktop host exposes it; keep `MemorySecretStore` as the explicit session-only mode.
- **QA-011:** audit that config/secret files, key material, and absolute paths do not enter packages, logs, exports, or diagnostics.
