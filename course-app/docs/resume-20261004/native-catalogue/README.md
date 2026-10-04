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

`collection-review.json` compares project/file/title identities before and after fixture expansion. All 600 prior main identities remain: 558 unified and 42 standalone. The newly collected full source catalogue is 252 cases. No historical identities were dropped.

## Execution status

Local Chromium 153.0.8010.0 is available at `/workspace/scratch/9b691105a4f2/browser-runtime/chromium`. The old single-process probe failed at Vulkan initialization or context reuse. A multiprocess probe with `--no-sandbox --disable-dev-shm-usage --no-zygote --disable-gpu --disable-vulkan --disable-software-rasterizer` successfully opens repeated browser contexts.

Exploratory runs against copies of the previous eight-lesson build exercised both hosts: 30 of 34 cases per host passed (L9–15 at all four widths, actual persistence, optional blank submission). Four L4 cases exposed missing Vite-inline-SVG support in the fixture; the fixture was corrected. Subsequent source edits changed L9 revisions while those frozen old builds were used, so that mismatch is expected and cannot certify the new tree.

The final fixture correction passed L4 at 320 in both hosts, including inline-SVG equivalence and expanded number-table keyboard access; see `local-l04-check.json`.

The latest typecheck is currently blocked by new `textbook-display-revisions.ts` production-code errors (lines 34/43/58/71/73), outside the fixture changes. Earlier actual checks with the new fixtures included passed; the final tree must be rechecked after those errors are repaired.

Fresh same-version builds are required before all 15 lessons are executed. WebKit has not been run locally; official two-engine CI remains required. Full final execution results will be added after integration. Content/source correctness and human/physical-device validation are separate from these DOM and behavior checks.
