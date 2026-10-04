# HSK1 source catalogue native fixtures

Scope: shared and standalone hosts, lessons 1–15, widths 320/390/768/1440, Chromium and WebKit. The existing L4 pilot and all prior main identities are retained.

## Fixture changes

- The previous browser-fixture typecheck omitted the new catalogue spec and its helper. `tsconfig.browser-check.json` now includes both host specs, which recursively includes the shared helper.
- Each host has 60 lesson/width cases plus three actual behavior cases: nonempty cross-lesson history/refresh/isolation, optional blank ungraded self-assessment, and known headerless read-only month/weekday tables.
- The catalogue defines 252 cases across both hosts and both native projects. This is collection coverage, not an execution claim.
- Rendering checks cover source identities/versions, bilingual headings/instructions/prompts, labels/options, field types/requirements, table topology and embedded fields, header/caption semantics, read-only behavior, and source-field pinyin when supplied.
- Figure checks bind delivered assets to trusted source IDs, bilingual alt/caption, visible dimensions, safe crop paths, and SHA-256 bytes. Vite SVG inlining is handled with base64 byte checks or equivalent XML-tree checks for percent-encoded SVG.
- Tall scrollable tables are exercised through actual keyboard focus and ArrowRight. The earlier mouse point could lie above the viewport after a tall table was scrolled into view; that was a test defect, not evidence of a product scrolling defect.
- Visits must not create source receipts; primary exercise/homework history and exact legacy bytes are preserved. Optional self-assessment accepts omitted answers without inventing scores.

## Collection evidence

`collection-review.json` compares project/file/title identities before and after fixture expansion. All 600 prior main identities remain: 558 unified and 42 standalone. The newly collected full source catalogue is 252 cases, and the all-scene gallery addition contributes eight more cases across both hosts and both engines. The main collection is therefore 860 identities (600 retained + 252 catalogue + 8 gallery). No historical identities were dropped.

## Execution status

Production source checkpoint: `743361dc97d5e174bb36582e3e8c8dd7c76f4e21`. Both same-version build outputs were copied before execution, their full file manifests and aggregate hashes captured in `frozen-builds.json`. Source JSON and catalogue code were unchanged during the final runs; the final fixture hash is also recorded.

**Actual local Chromium: 138/138 passed, zero failures, skips or retries.** Each host passed 69 cases: 63 source catalogue cases, four retained scene history/listen/hide cases, and two new all-scene gallery cases. Both source and gallery checks preserve seeded nonempty homework and legacy data. The two full gallery cases per host visit all 45 scenes and 48 original crops at 320 and 1440 widths, verify delivered SHA-256/alt/caption/visible dimensions, hide them from visual and accessible output, and restore correct display on reload. Existing scene navigation covers real audio playback, scene-change stopping, keyboard/picker selection, history and mode restoration.

Final raw results: `local-final-course.json`, `local-final-modular.json`. Condensed identity/result evidence: `local-execution-summary.json`. Actual fixture typecheck passed after both host specs were included.

First integration runs passed 51/63 catalogue cases per host and caught a fixture expectation bug at blank source table headers in L3/L6/L7: blank cells correctly render an empty string, while the fixture expected a bilingual separator. The fixture was corrected and the full final suites were rerun. `catalogue-first-*.json` retain this diagnostic evidence. Earlier probes also exposed Vite SVG inlining and tall-table pointer-coordinate assumptions; these were corrected without changing production code.

Local Chromium 153.0.8010.0 is available at `/workspace/scratch/9b691105a4f2/browser-runtime/chromium`. The working launch uses `--no-sandbox --disable-dev-shm-usage --no-zygote --disable-gpu --disable-vulkan --disable-software-rasterizer`, with real browser DOM, storage, keyboard, audio and network behavior. The old single-process launch was removed because it crashed at context reuse.

## Scope limits

- WebKit has not been executed locally. Official two-engine CI on the final code/test revision is still required.
- The local browser lacks CJK fonts: inspected 390px screenshots display correct images/layout and Vietnamese text, while Chinese glyphs are boxes. DOM/source text checks are valid, but final Chinese visual acceptance must use CI's installed Noto CJK fonts.
- Hidden galleries retain alt attributes inside `hidden` DOM containers. The tests verify invisibility and absence of alt/caption content from the accessible tree; they do not misrepresent this as deletion from raw DOM.
- Content/source correctness and human/physical-device validation are separate from these DOM and behavior checks. Human listening and physical-device checks were not performed.
