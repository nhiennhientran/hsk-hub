# HSK2 lesson 3 bounded source structure audit

Result: structural checks pass, with three metadata observations. This is not visual or printed-text acceptance; the parent reviewer owns all original-page review.

Input source SHA256: `1751c64e4a0960f57aa8823b4186e59beac2691f7e43d7969a1446013bf9ce11`. Original PDF SHA256: `6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b`.

| Check | Observed |
| --- | --- |
| Records / unique source IDs | 115 / 115; no duplicate IDs |
| Mandatory base fields and types | Present and consistent for all 115 records |
| Ordinary numbered words | 15; ordinals 1–15 |
| Proper-noun word rows | 0 |
| Role translation lines | 16: text 1 = 5, text 2 = 5, text 3 = 6; ordinal sequences contiguous |
| Text 4 whole unlabelled paragraph | 1; speaker null; no website line partition inferred |
| Connected summary grammar rows | 9; ordinals 1–9, all PDF42 / printed28 |
| Original page evidence | 10 entries: PDF33–42 / printed019–028 |
| Page raster hashes / PDF geometry metadata | All ten hashes, CropBoxes, pageRects and rotations match |
| Detail raster hashes | All seven match |
| Freeze file hashes | All five listed author files match |

Two conceptual cross-page cases correctly occupy three records. Grammar 2 rules 1 and 2 separately anchor Chinese to printed22/PDF36 and Vietnamese to printed23/PDF37. Grammar 3 has one source record spanning printed24–25/PDF38–39; its two Vietnamese fragments join with one space to exactly reproduce `viPrinted`. These are metadata checks, not a decision about their printed wording.

Metadata observations:

1. Detail evidence entries 1–2 use `file` / `clip`; entries 3–7 use `path` / `clipDisplayCoordinates`. Files resolve and hashes match, but a consumer must normalize the heterogeneous keys.
2. All seven detail entries omit printedPage, CropBox and rotation. The two `clip` entries do not explicitly name their coordinate convention. Whole-page evidence supplies original page geometry.
3. The freeze manifest omits separate proper-noun, whole-paragraph and connected-summary-row counts. The frozen source JSON includes them, and they recompute to 0, 1 and 9.

No blocking structural anomaly was found. No external machine-readable schema was supplied; validation used the task contract and bundle field, type, ID, count, page, span and hash consistency. No author script was executed or author file changed. No website Vietnamese, website runtime, OCR or PDF text extraction was used. This auditor did not visually view any original PDF image and makes no text-fidelity or source-completeness acceptance claim.
