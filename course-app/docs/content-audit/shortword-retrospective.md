# Retrospective source fidelity checks

2026-10-02. Triggered by independently repaired lesson18 source errors: altered subject/negation, relocated blank, wrong short reply and misread verb. This is an additional targeted pass, not a replacement for each lesson's complete independent source review.

## Required rule for every content batch

1. Compare short subjects, negatives, limiting/time particles and speaker labels against original pixels. Do not let plausibility or ASR override the page.
2. Compare every blank's position relative to the surrounding words, not just the number of blanks. Keep printed task types and full multi-turn prompts.
3. For suspected glyph/verb/noun differences, inspect an original-resolution local crop together with the surrounding sentence and page. Only then edit Chinese and its dependent pinyin/Vietnamese. OCR is a search/triage aid, never evidence of a factual transcription defect.
4. Record false alarms as no-change outcomes, and preserve exact repaired-field checks so a stale author helper cannot reintroduce the error. Do not regenerate source snapshots from changed lesson data just to pass tests.

## Triage and actual pixel checks

- Fuzzy OCR comparison examined1,565 source text/question/grammar/section fields from already independently reviewed lessons.315 approximate discrepancies were found;45 contained possible subject/negative/short-particle changes. These counts describe candidates, not errors.
- All45 flagged fields were compared to original page pixels across37 distinct source pages. Crops that selected a repeated phrase, wrong vertical area or cut off a target word were rejected; full pages were opened instead (including HSK2PDF20/40/94/132/146 and HSK3PDF29). Every flagged source field was confirmed as currently transcribed. No OCR-driven source edit was needed.
- Added representative complete grammar/example/task checks for HSK2lessons6,7,10 (PDF63,73,101); additional short-word/verb samples on HSK2PDF81/84/89/96/138/147 and HSK3PDF28/55/62/73. They preserve pronouns/negatives, verb identity and blank order. All25 currently reviewed lessons (HSK2all15;HSK3one through9 plus18) have source-image coverage in this retrospective selection or its high-risk list. This is sampling beyond the existing full reviews, not a second exhaustive whole-book visual claim.
- False-alarm ledger: HSK2lesson6 adjective-reduplication example2, PDF63/printed48, is **这只猫小小的，真让人喜欢。** A resized full-page reading momentarily suggested 狗. The original-resolution crop clearly showed 猫. The uncommitted tentative local change was immediately reversed; original 猫/māo/mèo bytes were retained, with no commit or remote upload of 狗. This entry must never be treated as a request to change the source to 狗.
- Newly fixed lesson18 source differences and exact evidence remain in its independent audit; no ASR-only confirmation was substituted.

## Permanent regression checks

`content/source-sentinels.json` stores66 selected, pixel-reviewed field/page snapshots, including the independent18 repairs and the confirmed 猫 example with matching pinyin/Vietnamese. Content validation rejects changed reviewed strings, relocated blanks or source-page drift. A dedicated unit test demonstrates rejection of subject/negation substitution, moved blank and wrong page. These checks guard known source content; they cannot prove all language is flawless.

Current pilot validation and20 shared-course unit tests pass. Full human listening, physical IME and final whole-site acceptance remain separate later checks.
