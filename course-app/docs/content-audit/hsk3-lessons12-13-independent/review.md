# Independent audit: HSK3 lessons 12–13

Verdict: PASS for the frozen additive source/content/field-schema/SVG candidate. No blocking author-lane fixes. This is not browser acceptance, full integrated-regression acceptance or publication approval.

Reviewed on 2026-10-04. Read-only candidate: the isolated author checkout, base `d5feac8a01ec7095573da8dd9c4205c23bc7ed2b`. All independently generated evidence is in this directory. No author files, shared tests or main tree were edited; no commit, upload or publication.

## Frozen identity and preservation

- L12 SHA256: `b2372bf3f786eb2baa36c0319825dc6f3376607cba388a99767d026ad9439446`.
- L13 SHA256: `31d89804eb74dab95912767f102d06b53759070972ad933a2da46f3c0f8549d1`.
- Recomputed all 27 frozen JSON/SVG hashes; exact agreement.
- Independently loaded baseline JSON with `git show` and deep-compared all 16 original top-level keys and their complete nested values. Every original ID/value is preserved. Each lesson still has 30 homework questions and four supplemental listening questions. Only the two expected lesson files appear in the tracked diff; untracked files are the dedicated author evidence and 25 lesson SVGs.
- Counts verified: L12 32 activities / 97 fields (24 official, 35 reference, 38 open), 13 SVGs; L13 26 / 66 (24 official, 33 reference, nine open), 12 SVGs.

## Independent source-pixel review

Freshly rendered and personally inspected every actual textbook PDF page 116–135 and answer page 16–19, including page-edge continuations. Full PDF SHA256 identities match the inventory: textbook `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`, answers `7cc42aa78c6b1c32f03f6deccac606c31bd787fd1f72717d45afafa29155e473`.

All 48 official answer selections agree with the actual answer pages:
- L12 matching BCEFAD; listening CC/CA/AA/AA; words AECDB/DABCE. Matching/listening and word Q1–2 are answer PDF17; word Q3–10 PDF18. PDF16 is only the heading boundary.
- L13 matching BECFAD; listening CA/CC/CA/BB; words EACDB/BDCEA. Matching and text1–2 answers PDF18; remainder PDF19.

Source tasks and boundary checks:
- L12 12 grammar frames/12 fields; pictures 5+3+3. Picture3 A/B/B/A is accurate. Pair discussion preserves six questions and an optional continuation rather than an invented seventh question. Review has two vocabulary fields, 11 source rows with 22 distinct checks, and one improvement response; rows1–2 on PDF125 and rows3–11 on PDF126.
- L13 nine grammar frames/11 fields, first grammar 1+2+2; pictures 3+3+4. Listening text2 Q2 correctly points to textbook PDF130, and word Q10 to PDF135. Legacy bank/directive question-kind entries have not acquired spurious answer fields. Four-person discussion retains four prompts with the editorial scaffold disclosed.
- Seven full source explanations match their Chinese paragraphs; 就 retains both meanings and 0–1/2–3 example grouping. 把(4) Chinese paragraph/formula is correctly sourced to PDF130. 一边 shortened form and negative driving example remain present in preserved source data.
- Eight listening activities retain source odd-numbered tracks and the listen-twice directive. Reading answers match the passages and remain editorial/non-unique. No invented text4 figures or L13 culture/review task. L12 culture contains no guessed city names or playable controls.

## Bilingual and field audit

Read all 68 bilingual reference fields, including all 24 reading answers. Independently reconstructed all 47 complete bilingual grammar/picture/word-bank sentences from the actual candidate fields; they exactly match the supplied completion ledger. Reviewed the complete results for Chinese grammar, Vietnamese word order and semantic agreement. The 把 frames use natural Vietnamese restructuring; no literal misplaced đem. Editorial references are plausible non-unique completions rather than official keys. Open fields have no grading/reference keys; official keys are present among their corresponding options. IDs are unique across both lessons and each grammar/picture blank has its own field. Matrix dimensions and field bindings pass the shared validator.

Minor optional language polish, not an acceptance blocker:
- L12 new `text4-question5` Vietnamese prompt could read “Vì sao cô Vương ít thích mùa đông nhất?” or “Vì sao mùa đông là mùa cô Vương không thích nhất?” for a clearer rendering of 最不喜欢. The current wording was inherited unchanged from the source corpus.
- L13 new `words-question9` Vietnamese prompt could replace “đồ ăn uống xong hết rồi” with “đồ ăn, thức uống đều đã chuẩn bị xong rồi” to make the preparation meaning more explicit. Preserve the original corpus when polishing only the additive prompt.
- A few inserted references begin lowercase after a sentence boundary; capitalization is cosmetic.

## Exact-file SVG pixel review

Inspected all 25 author figure-sheet images, then independently rendered each exact hashed SVG through Inkscape at 640×400 and inspected every image in seven independent sheets. Scenes are meaningful and distinguish the warmup concepts; picture scenes support the dialogue prompts. The painter, knocking visitor and adult pair have coherent simplified anatomy. No blank/missing assets, copied source raster pixels, external image references, scripts, matching answer labels, city labels or fake video controls were found. XML parses and manifest hashes agree. Original-art and non-textbook-image disclosures are present with bilingual visual descriptions. These are schematic illustrations, not photorealistic reproductions.

## Executed static checks

- Independent preservation/count/hash/key/XML/blank-count checks: PASS (`checks.json`, `check.py`).
- Complete local corpus activity schema, source guards and release lexicon checks: zero issues (`schemas.json`).
- Full unit suite rerun: 81 passed, one failed (`unit.log`). Sole failure: existing global illustration total expected 320 versus actual 345 at `tests/activities.test.mjs:14`. Per-asset existence/hash/safety assertions pass before the total assertion. The integrating lane must update the final aggregate expectation and rerun the suite; no shared test was edited here.
- Typecheck rerun using the existing audit-local dependency-resolution config: PASS, exit 0 (`typecheck.log`). This uses installed dependency types from the main workspace without modifying that workspace.
- Reviewed renderer code statically: response inputs use field IDs; official/reference feedback uses separate branches. This is not proof of runtime behavior.

## Not executed / remaining integrated gates

No browser desktop/mobile render, answer-concealment interaction, precise input binding, submission/reset/reload, interrupted flow, cross-lesson persistence, 22-checkbox persistence or 11-field L13 persistence test was executed. No fresh audio checksum/decode/listening-semantic test was executed. No full packaged build or production/site regression was performed. Those gates remain with the integrating/browser/audio lanes; static content PASS must not be represented as their completion.
