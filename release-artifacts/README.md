# Release artifact record

`A-Gent-1.0.0-macos-arm64.json` is the source of truth for the personal macOS v1.0 candidate built from branch `codex/v1-macos-release`. It records the exact build commit, host/runtime, artifact sizes, SHA-256 values, CI run, and open checks.

- `SHA256SUMS.txt` covers the directly built and inspected DMG and ZIP.
- `CI-SHA256SUMS.txt` covers the GitHub Actions `A-Gent-macos` artifact zip; the zip contains the same DMG and ZIP names under `release/`.

These files are repository evidence only. They are not included in the packaged app, and they do not imply public publication, signing, notarization, or owner acceptance.

Verify a downloaded pair from the direct build:

```sh
shasum -a 256 -c SHA256SUMS.txt
```

Verify the downloaded CI artifact after saving it as `A-Gent-macos.zip`:

```sh
shasum -a 256 -c CI-SHA256SUMS.txt
```

The download names must match the names in the checksum file. Use the [V1-08 owner procedure](../docs/v1-08-owner-acceptance.md) for the acceptance pass.
