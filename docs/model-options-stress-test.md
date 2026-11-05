# modelOptions stress test

Date: 2026-11-05. Status: audit complete; seven findings open. The dev-only harness is implemented; this audit changes no production model-selection code or styles.

Scope: `connectedModelGroups` in `src/composer/modelOptions.ts`, rendered through the existing Composer and ModelPicker. Synthetic `ProviderInfo[]` fixtures enter through the normal props boundary. The harness is under `src/dev/`, loaded through the development-only path in `src/main.tsx`.

The invoked [break-ui skill](/Users/danial/.agents/skills/break-ui/SKILL.md) says “Report before fixing.” The corrections below are proposals; they have not been applied.

## Rendered data and contracts

| Field | Source and use | Type | Limit | Optional? |
| --- | --- | --- | --- | --- |
| Provider ID/name | `ProviderInfo`; selection, caption, tab, tooltip, accessible result label, search, trigger fallback | strings | Six fixed IDs/names in `server/providers.ts:26`; shared types otherwise unbounded | No |
| Provider kind | `ProviderInfo.kind`; glyph and Thinking availability | enum | codex, opencode, ollama, openai-compatible | No |
| Connection status | `ProviderInfo.status`; catalog inclusion | enum | connected, available, unavailable, error | No |
| Provider list | `providers`; rail and empty state | array | Six in the host; helper accepts unbounded input | No; can be empty |
| Model list | `provider.models`; options and count | array | HTTP/OpenCode cap at 1,000; Codex requests ten pages of 100; helper has no cap | No; can be empty |
| Model ID | `ModelOption.id`; selection, keys, search, sometimes display name | string | Catalog unbounded; manual configuration and saved agent model ID limited to 200 characters | No; runtime catalog accepts empty/duplicate IDs |
| Model name | `ModelOption.name`; row, accessible name, trigger | string | Unbounded; empty/whitespace names pass through ingestion | No in TypeScript |
| Description | `ModelOption.description` | string | Unbounded upstream | Yes; intentionally excluded from display and search |
| Current selection | `providerId`/`modelId` props; fill/check and trigger | strings | Empty model ID means Provider default; provider must be connected | No |
| Search query | SearchField value; filter and empty-state copy | string | Unbounded; trimmed and lowercased, without Unicode normalization | No; empty is valid |
| Count | `choices.length`; caption and live status | integer | Derived from catalogs plus one default per connected provider; displayed without number formatting | No |
| Thinking | `effort` prop; meter/segmented control | string | UI offers low/medium/high; empty falls back to medium | No |
| Actions/recovery/status copy | Static ModelPicker/shared-control strings | strings | English source copy; no localization contract | No |
| Provider glyph | Local SVG/Lucide selected by kind/ID | graphic | Fixed 20px rail glyph; no remote image | No |

This surface renders no timestamps, money, member counts, remote avatars, or permission badges. Provider detail/base URL are not displayed here. Optional descriptions remain omitted as requested.

## What broke

| # | Severity | Field | Worst-case value | What happens | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | Broken | Model ID | Empty ID; repeated `research-eu` | Selecting the empty alias checks both it and Provider default. Selecting EU replica checks both EU rows while the trigger shows the first label | Reject empty IDs, deduplicate per provider, and reserve the synthetic default ID. `src/composer/modelOptions.ts:12`, `server/providers.ts:95` |
| 2 | Broken | Model name | `''` and `'   '` with valid IDs | Blank selectable rows lack usable names; axe reports critical `button-name` | Trim names and fall back to the valid ID for both visible and accessible labels. `src/composer/modelOptions.ts:14`, `src/composer/ModelPicker.tsx:144` |
| 3 | Broken | Distinguishing identity | Two `Research` deployments; a model called `Provider default` | Different IDs have identical visible and accessible names | Add an ID line only for name collisions, including collisions with the synthetic default. `src/composer/ModelPicker.tsx:144` |
| 4 | Broken | Search | Composed `Café` against decomposed `Café Research` | Visually equivalent spelling gives 0 results; the decomposed query gives 1 | Normalize query and fields consistently, such as NFC, before case folding. `src/composer/modelOptions.ts:10`, `src/composer/modelOptions.ts:16` |
| 5 | Ugly | Result position | Scroll to the end, then search `code-evaluation` | The 200 matches start near revision 194 at scrollTop 8,144px, rather than revision 001 | Reset result scroll when the query/provider changes; retain intentional keyboard scrolling. `src/composer/ModelPicker.tsx:141` |
| 6 | Ugly | Count copy | 1 choice; 1,000 matches | Live status says `1 model options available.`; caption says raw `1000 results` | Share singular/plural copy and use `Intl.NumberFormat`. `src/composer/ModelPicker.tsx:139`, `src/composer/ModelPicker.tsx:162` |
| 7 | Fragile | String contract | Unbounded catalog names/IDs versus 200-character configured/saved IDs | Discovery and persistence have different accepted ranges; no shared display-name bound exists | Align the contracts, validate IDs without silently shortening them, and document a display-name limit/fallback. `shared/types.ts:101`, `server/providers.ts:95`, `server/store.ts:34` |

Findings 1–6 were reproduced in the browser. Finding 7 is a source-contract gap. Long values use realistic deployment/repository naming patterns. Invalid IDs are explicitly malformed upstream records accepted by the current adapter, kept separate from ordinary valid names.

## Decisions for you

- **Identical names:** recommend an ID line only where needed. This preserves the request to omit model descriptions and media/reasoning badges.
- **Blank names:** recommend the valid ID as fallback; discard records with unusable IDs and deduplicate repeated IDs.
- **Large catalogs:** 1,001 choices mount together. Keyboard End works; use release profiling before choosing virtualization. No pagination or virtualization was added.
- **Length limits:** preserve the exact ID used in provider requests and align discovery/configuration/persistence before imposing a limit.

## What held up

- Long English labels and an unbroken repository-shaped ID wrap without horizontal overflow at 320px.
- One-letter names, Farsi, Vietnamese, CJK, emoji/ZWJ, and newline-containing labels render. RTL mirrors the rail without squashing its 20×20px glyphs.
- `Research <preview> & “evaluation”` renders literally, with no nested HTML in the model name.
- Cached models from available/unavailable/error providers stay hidden; the worst fixture exposes only connected Codex, Cloud, and Ollama.
- Empty providers show Connect a provider; an empty connected catalog retains one Provider default choice.
- A 1,000-model catalog remains scrollable. End reaches `northwind/support-evaluation-r200`; the footer stays visible. The six-provider rail scrolls, and Home returns to Codex.
- Rail/pane dimensions, selected checks, and Thinking controls hold at ordinary and wide container sizes.

## Verification

| Check | Observed result |
| --- | --- |
| 961×804 real container | Picker 416px; Demo/Worst captures; blank labels and ambiguous names reproduced |
| 320×640 | Picker 304px at x=8–312; page width 320px; long ID wraps to five lines without horizontal overflow; footer visible |
| 2560×1440 | Picker remains 416px and composer caps at 820px; Demo/Worst captures |
| Themes | Dark at all three widths; light at 961px and worst case at 320px |
| RTL / root font | At 320px, RTL and root font 32px preserve bounds. Model text stays 14px because its size is explicit in pixels |
| Large catalog | 1,000 models produce 1,001 mounted choices. One switch used about 0.238 seconds aggregate browser task time including harness/automation; this is not an isolated rendering or frame-rate benchmark |
| Search / one result | Canonically equivalent Unicode queries differ; caption says `1 result` correctly while live status uses the wrong plural |
| Focused axe, worst catalog | Critical `button-name` violation; incomplete color-contrast check on clipped scrollable content. Earlier normal-fixture scans did not exercise blank names |
| Reload | Dataset, theme, direction, and root-text settings persist in URL |
| Existing checks | Typecheck and three existing model-options tests pass; those tests do not cover the new failures |
| Production build | Pass; harness markers absent from all four production JS/CSS assets. Existing main-chunk size advisory remains |

Not verified: actual browser 200% zoom, native screen-reader announcements, mobile hardware, full performance profiling, full automated UI/visual/E2E suites, or packaged installers for this audit. Raising the root font does not double explicitly sized model text; actual zoom remains a follow-up. Temporary viewport overrides were reset.

Evidence: [worst case](screenshots/model-options/final-worst-case.jpg), [invalid IDs](screenshots/model-options/duplicate-id-961-dark.jpg), [identical names](screenshots/model-options/identical-names-961-dark.jpg), [Unicode search](screenshots/model-options/unicode-search-961-dark.jpg), [search scroll](screenshots/model-options/search-scroll-961-dark.jpg), [capture index](screenshots/README.md), [DOM observations](screenshots/model-options/observations.json).

## Reproduce and continue

Implementation ownership is now in [the provider board](roadmaps/providers.md): findings 1–2 → PVD-008; finding 3 → PVD-009; findings 4–6 → PVD-010; finding 7 → PVD-011. PVD-016 and QA-003 cover regression evidence. See [the master roadmap](project-roadmap.md) for sequencing and release gates.

Run `npm run dev`, then open `/?component=composer&stress=model-options&data=worst&theme=dark`. The isolated QA host is [the live harness](http://127.0.0.1:4492/?component=composer&stress=model-options&data=worst&theme=dark).

Bottom toggle: **Demo data / Worst case / Empty / One choice / 1,000 models / Invalid IDs**. Environment controls: Dark, RTL, 200% root text. The ordinary Composer preview links here. Fixtures: `src/dev/modelOptions.fixtures.ts`; harness: `src/dev/ModelOptionsPreview.tsx`.

Say `fix all` or `fix 1, 3` and I'll apply them.
