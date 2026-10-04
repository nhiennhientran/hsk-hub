# HSK3 L7–12 official Vietnamese source evidence

Author visual review only; independent acceptance is not granted. This additional sourceRevision uses the supplied `HSK3 (3.0).pdf`, SHA256 `7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951` (212 PDF pages). It does not replace or impersonate the unavailable original Chinese PDF or its English POS labels.

All 24 vocabulary boxes and their proper-name sublists were rendered and visually opened. The JSON records 166 printed entries bound to all 184 existing stable sense IDs. Multi-POS sense IDs retain one printed number and the complete printed raw label; proper-name numbering is independent of ordinary words. Empty printed POS remains `null`. No lesson, canonical catalogue, runtime, test, or translation was changed.

## Observations

No Chinese, normalized pronunciation, POS, or source-page mismatch was observed. `其他`, `别人` were provisionally misread as `dt.` in whole-page thumbnails; 4x crops show the fine crossbar and confirm `đt.` (pronoun), so these are not recorded as differences. `只能` has no printed POS; the current editorial `cụm từ` classification remains unchanged.

Typographic pinyin wrapping and apostrophes remain in `printedPinyin`, with a separate `normalizedPinyin`. `rawLabel` / `printedPOSRaw` preserve the Vietnamese labels actually printed in the new PDF. `posCategory` is a separate Chinese mapping of the full printed POS set; current POS text is retained under `canonicalPOSAtReview`.

## Exact evidence

JSON SHA256: `d36d94b7897b655c0830efe03b2742f284825f683e4fafba3bc21c87610fa5c4`. Source-page and spread PNG hashes for each reviewed page are frozen under `pageEvidence`; reviewed 4x detail-crop hashes are in `detailEvidence`. Temporary rendered images are in `/workspace/scratch/28b55072841a/hsk23-source-review/l07-12`. Every referenced PNG was fully decoded and its frozen hash checked after transcription.

PDF page set: 70, 72, 74, 75, 80, 82, 83, 85, 89, 91, 93, 94, 99, 101, 103, 104, 108, 110, 111, 113, 117, 119, 120, 122. Printed pages are PDF minus 12; each scan includes a companion physical page, and the relevant half was also preserved for legible review.

Mechanical completeness check: every current L7–12 vocabulary ID occurs exactly once in `rows`, every manual printed head is bound, all 24 source pages have PNG/hash evidence, and proper names / missing POS / repeated POS senses remain distinct. This check is not independent content acceptance.
