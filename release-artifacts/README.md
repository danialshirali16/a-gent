# Release artifact record

`A-Gent-1.0.0-macos-arm64.json` is the source of truth for the personal macOS v1.0 candidate built from branch `codex/v1-macos-release`. It records the exact build commit, host/runtime, artifact sizes, SHA-256 values, CI run, and open checks.

- `SHA256SUMS.txt` covers the DMG and ZIP extracted from the GitHub Actions `A-Gent-macos` artifact (the download path most people will use).
- `LOCAL-SHA256SUMS.txt` covers the directly built local `release/` copies.
- `CI-SHA256SUMS.txt` covers the GitHub Actions artifact zip itself.

The app bundle contents are identical in both builds: tree SHA-256 `59b86ca263d8c03e4d23b1499b9523ff3503e7e40a9122ce41d2fcd9e88e4984`. The container DMG/ZIP hashes differ because the two builds ran on different hosts/timestamps. That is expected; use the pair matching where you got the file.

These files are repository evidence only. They are not included in the packaged app, and they do not imply public publication, signing, notarization, or owner acceptance.

Verify the downloaded CI pair after extracting the artifact zip:

```sh
shasum -a 256 -c release-artifacts/SHA256SUMS.txt
```

Verify the downloaded CI artifact zip (save it as `A-Gent-macos.zip`):

```sh
shasum -a 256 -c release-artifacts/CI-SHA256SUMS.txt
```

Verify the local build:

```sh
cd release
shasum -a 256 -c ../release-artifacts/LOCAL-SHA256SUMS.txt
```

Use the DMG or ZIP from the artifact zip. Do **not** use the artifact zip's extracted `mac-arm64` directory: artifact transport may dereference the framework symlinks and inflate/break that copy. The DMG and ZIP contain the correct `.app`.

Use the [V1-08 owner procedure](../docs/v1-08-owner-acceptance.md) for the acceptance pass.
